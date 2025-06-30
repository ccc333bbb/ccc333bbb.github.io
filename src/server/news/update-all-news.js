const KeywordsFetcher = require('./fetch-keywords');
const RSSNewsAggregator = require('./fetch-news');
const NewsProcessor = require('./process-news');
const fs = require('fs');
const path = require('path');

class NewsUpdateManager {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.logFile = path.join(this.dataDir, 'update-log.json');
    }

    async logOperation(operation, result) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation,
            success: result.success,
            details: result,
            version: '2.0-rss'
        };

        let logs = { operations: [] };
        if (fs.existsSync(this.logFile)) {
            logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
        }

        logs.operations.unshift(logEntry);
        logs.operations = logs.operations.slice(0, 50); // Keep the last 50 operations
        logs.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    }

    async runFullUpdate() {
        console.log('🚀 Starting the full RSS news update process...');
        const startTime = Date.now();
        
        const results = {
            keywords: null,
            news: null,
            processing: null
        };

        try {
            // Step 1: Fetch trending keywords
            console.log('\n📊 Step 1/3: Fetching trending keywords');
            const keywordsFetcher = new KeywordsFetcher();
            results.keywords = await keywordsFetcher.fetchAllKeywords();
            await this.logOperation('fetch-keywords', {
                success: true,
                totalKeywords: results.keywords.totalKeywords
            });
            console.log('✅ Keyword fetching complete.');

            // Step 2: Fetch RSS news
            console.log('\n📰 Step 2/3: Fetching RSS news');
            const newsAggregator = new RSSNewsAggregator();
            results.news = await newsAggregator.fetchAllNews();
            await this.logOperation('fetch-news', results.news);
            console.log('✅ News fetching complete.');

            // Step 3: Process and rank news
            console.log('\n🔄 Step 3/3: Processing and ranking news');
            const newsProcessor = new NewsProcessor();
            results.processing = await newsProcessor.processLatestNews();
            await this.logOperation('process-news', results.processing);
            console.log('✅ News processing complete.');

            const endTime = Date.now();
            const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

            // Generate a comprehensive report
            const report = {
                success: true,
                duration: totalDuration,
                timestamp: new Date().toISOString(),
                summary: {
                    keywordsCount: results.keywords?.totalKeywords || 0,
                    articlesCount: results.news?.totalArticles || 0,
                    sourcesCount: results.news?.sources || 0,
                    avgRelevanceScore: results.processing?.rankedIndex?.stats?.avgRelevanceScore || 0,
                    categoriesCount: results.processing?.rankedIndex?.stats?.totalCategories || 0
                },
                details: results
            };

            // Save the report
            const reportFile = path.join(this.dataDir, 'last-update-report.json');
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

            console.log('\n🎉 Full update process finished successfully!');
            console.log(`⏱️  Total time: ${totalDuration}s`);
            console.log(`🔑 Keywords: ${report.summary.keywordsCount}`);
            console.log(`📰 Articles: ${report.summary.articlesCount}`);
            console.log(`🎯 Sources: ${report.summary.sourcesCount}`);
            console.log(`📊 Categories: ${report.summary.categoriesCount}`);
            console.log(`📈 Average Relevance: ${report.summary.avgRelevanceScore.toFixed(2)}`);

            return report;

        } catch (error) {
            console.error('❌ Update process failed:', error.message);
            
            const errorReport = {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                results: results
            };

            await this.logOperation('full-update-error', errorReport);
            throw error;
        }
    }

    async runQuickUpdate() {
        console.log('⚡ Starting quick news update (news and processing only)...');
        
        try {
            // Fetch and process news only
            const newsAggregator = new RSSNewsAggregator();
            const newsResult = await newsAggregator.fetchAllNews();
            
            const newsProcessor = new NewsProcessor();
            const processingResult = await newsProcessor.processLatestNews();

            console.log('✅ Quick update complete.');
            console.log(`📰 Articles: ${newsResult.totalArticles}`);
            
            return {
                success: true,
                news: newsResult,
                processing: processingResult
            };

        } catch (error) {
            console.error('❌ Quick update failed:', error.message);
            throw error;
        }
    }

    async runKeywordsOnly() {
        console.log('🔑 Updating keywords only...');
        
        try {
            const keywordsFetcher = new KeywordsFetcher();
            const result = await keywordsFetcher.fetchAllKeywords();
            
            console.log('✅ Keyword update complete.');
            console.log(`🎯 Keywords: ${result.totalKeywords}`);
            
            return {
                success: true,
                keywords: result
            };

        } catch (error) {
            console.error('❌ Keyword update failed:', error.message);
            throw error;
        }
    }

    async generateReport() {
        console.log('📋 Generating update report...');
        
        try {
            const report = {
                timestamp: new Date().toISOString(),
                system: 'RSS News Aggregator v2.0',
                files: {}
            };

            // Check data files
            const dataFiles = [
                'keywords.json',
                'dynamic-keywords.json', 
                'news-index.json',
                'ranked-news-index.json',
                'search-index.json',
                'update-log.json'
            ];

            for (const file of dataFiles) {
                const filePath = path.join(this.dataDir, file);
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    report.files[file] = {
                        exists: true,
                        size: stats.size,
                        lastModified: stats.mtime,
                        lastUpdated: data.lastUpdated || 'Unknown',
                        recordCount: this.getRecordCount(data)
                    };
                } else {
                    report.files[file] = {
                        exists: false
                    };
                }
            }

            // Check news directory
            const newsDir = path.join(this.dataDir, 'news');
            if (fs.existsSync(newsDir)) {
                const newsFiles = fs.readdirSync(newsDir).filter(f => f.endsWith('.json'));
                report.newsFiles = {
                    count: newsFiles.length,
                    latest: newsFiles.sort().reverse()[0] || null,
                    totalSize: newsFiles.reduce((sum, file) => {
                        return sum + fs.statSync(path.join(newsDir, file)).size;
                    }, 0)
                };
            }

            console.log('✅ Report generation complete.');
            console.table(Object.entries(report.files).map(([file, info]) => ({
                File: file,
                Exists: info.exists ? '✅' : '❌',
                Size: info.exists ? `${(info.size / 1024).toFixed(1)}KB` : '-',
                Records: info.exists ? info.recordCount : '-'
            })));

            return report;

        } catch (error) {
            console.error('❌ Report generation failed:', error.message);
            throw error;
        }
    }

    getRecordCount(data) {
        if (data.keywords) return data.keywords.length;
        if (data.articles) return data.articles.length;
        if (data.index) return data.index.length;
        if (data.totalArticles) return data.totalArticles;
        if (data.totalKeywords) return data.totalKeywords;
        if (data.operations) return data.operations.length;
        return 'Unknown';
    }
}

// Main execution function
async function main() {
    const manager = new NewsUpdateManager();
    const args = process.argv.slice(2);
    const command = args[0] || 'full';

    try {
        switch (command) {
            case 'quick':
                await manager.runQuickUpdate();
                break;
            case 'keywords':
                await manager.runKeywordsOnly();
                break;
            case 'report':
                await manager.generateReport();
                break;
            case 'full':
            default:
                await manager.runFullUpdate();
                break;
        }
    } catch (error) {
        console.error('💥 Execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewsUpdateManager;