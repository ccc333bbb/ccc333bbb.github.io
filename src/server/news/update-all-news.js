const KeywordsFetcher = require('./fetch-keywords');
const RSSNewsAggregator = require('./fetch-news');
const NewsProcessor = require('./process-news');
const NewsCleanupManager = require('./cleanup-news');
const SearchIndexUpdater = require('../search/update-indexes');
const fs = require('fs');
const path = require('path');

class NewsUpdateManager {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.logFile = path.join(this.dataDir, 'update-log.json');
        this.cleanupManager = new NewsCleanupManager();
        this.searchUpdater = new SearchIndexUpdater();
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
            processing: null,
            cleanup: null,
            searchUpdate: null
        };

        try {
            // Step 1: Fetch trending keywords
            console.log('\n📊 Step 1/5: Fetching trending keywords');
            const keywordsFetcher = new KeywordsFetcher();
            results.keywords = await keywordsFetcher.fetchAllKeywords();
            await this.logOperation('fetch-keywords', {
                success: true,
                totalKeywords: results.keywords.totalKeywords
            });
            console.log('✅ Keyword fetching complete.');

            // Step 2: Fetch RSS news
            console.log('\n📰 Step 2/5: Fetching RSS news');
            const newsAggregator = new RSSNewsAggregator();
            results.news = await newsAggregator.fetchAllNews();
            await this.logOperation('fetch-news', results.news);
            console.log('✅ News fetching complete.');

            // Step 3: Process and rank news
            console.log('\n🔄 Step 3/5: Processing and ranking news');
            const newsProcessor = new NewsProcessor();
            results.processing = await newsProcessor.processLatestNews();
            await this.logOperation('process-news', results.processing);
            console.log('✅ News processing complete.');

            // Step 4: Cleanup old news files
            console.log('\n🧹 Step 4/5: Cleaning up old news files');
            results.cleanup = await this.cleanupManager.runCleanup();
            await this.logOperation('cleanup-news', results.cleanup);
            console.log('✅ News cleanup complete.');

            // Step 5: Update search indexes
            console.log('\n🔍 Step 5/5: Updating search indexes');
            results.searchUpdate = await this.searchUpdater.runFullUpdate();
            await this.logOperation('update-search-indexes', results.searchUpdate);
            console.log('✅ Search index update complete.');

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
                    categoriesCount: results.processing?.rankedIndex?.stats?.totalCategories || 0,
                    cleanupStats: results.cleanup?.summary || {},
                    searchStats: results.searchUpdate?.summary || {}
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
            
            // 顯示清理統計
            if (results.cleanup?.summary) {
                console.log(`🗜️ Compressed: ${results.cleanup.summary.compressed} files`);
                console.log(`📦 Archived: ${results.cleanup.summary.archived} files`);
                console.log(`🗑️ Deleted: ${results.cleanup.summary.deleted} files`);
            }
            
            // 顯示搜索統計
            if (results.searchUpdate?.summary) {
                console.log(`🔍 Search records: ${results.searchUpdate.summary.totalRecords}`);
                console.log(`💾 Search storage: ${(results.searchUpdate.summary.storageSize / 1024 / 1024).toFixed(1)}MB`);
            }

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
        console.log('⚡ Starting quick news update (news, processing, and search index update)...');
        
        try {
            const results = {
                news: null,
                processing: null,
                searchUpdate: null
            };

            // Fetch and process news
            const newsAggregator = new RSSNewsAggregator();
            results.news = await newsAggregator.fetchAllNews();
            
            const newsProcessor = new NewsProcessor();
            results.processing = await newsProcessor.processLatestNews();

            // Update search indexes
            results.searchUpdate = await this.searchUpdater.runIncrementalUpdate();

            console.log('✅ Quick update complete.');
            console.log(`📰 Articles: ${results.news.totalArticles}`);
            
            if (results.searchUpdate.updated) {
                console.log('🔍 Search indexes updated');
            } else {
                console.log('⏭️ Search indexes up to date');
            }
            
            return {
                success: true,
                ...results
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

    async runCleanupOnly() {
        console.log('🧹 Running news cleanup only...');
        
        try {
            const cleanupResult = await this.cleanupManager.runCleanup();
            const searchUpdateResult = await this.searchUpdater.runIncrementalUpdate();
            
            console.log('✅ Cleanup complete.');
            
            return {
                success: true,
                cleanup: cleanupResult,
                searchUpdate: searchUpdateResult
            };

        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            throw error;
        }
    }

    async runSearchUpdateOnly() {
        console.log('🔍 Running search index update only...');
        
        try {
            const result = await this.searchUpdater.runFullUpdate();
            
            console.log('✅ Search index update complete.');
            
            return {
                success: true,
                searchUpdate: result
            };

        } catch (error) {
            console.error('❌ Search index update failed:', error.message);
            throw error;
        }
    }

    async generateReport() {
        console.log('📋 Generating comprehensive update report...');
        
        try {
            const report = {
                timestamp: new Date().toISOString(),
                system: 'RSS News Aggregator v2.0 with Cleanup & Search',
                files: {}
            };

            // Check data files
            const dataFiles = [
                'keywords.json',
                'dynamic-keywords.json', 
                'news-index.json',
                'ranked-news-index.json',
                'search-index.json',
                'update-log.json',
                'cleanup-log.json',
                'search-update-log.json',
                'search-stats.json'
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

            // Check archive and compressed directories
            const archiveDir = path.join(this.dataDir, 'news-archive');
            const compressedDir = path.join(this.dataDir, 'news-compressed');
            
            if (fs.existsSync(archiveDir)) {
                const archiveFiles = fs.readdirSync(archiveDir).filter(f => f.endsWith('.json'));
                report.archiveFiles = {
                    count: archiveFiles.length,
                    totalSize: archiveFiles.reduce((sum, file) => {
                        return sum + fs.statSync(path.join(archiveDir, file)).size;
                    }, 0)
                };
            }
            
            if (fs.existsSync(compressedDir)) {
                const compressedFiles = fs.readdirSync(compressedDir).filter(f => f.endsWith('.json'));
                report.compressedFiles = {
                    count: compressedFiles.length,
                    totalSize: compressedFiles.reduce((sum, file) => {
                        return sum + fs.statSync(path.join(compressedDir, file)).size;
                    }, 0)
                };
            }

            console.log('✅ Comprehensive report generation complete.');
            console.table(Object.entries(report.files).map(([file, info]) => ({
                File: file,
                Exists: info.exists ? '✅' : '❌',
                Size: info.exists ? `${(info.size / 1024).toFixed(1)}KB` : '-',
                Records: info.exists ? info.recordCount : '-'
            })));

            if (report.newsFiles) {
                console.log(`\n📰 News Files: ${report.newsFiles.count} files, ${(report.newsFiles.totalSize / 1024 / 1024).toFixed(1)}MB`);
            }
            if (report.archiveFiles) {
                console.log(`📦 Archive Files: ${report.archiveFiles.count} files, ${(report.archiveFiles.totalSize / 1024 / 1024).toFixed(1)}MB`);
            }
            if (report.compressedFiles) {
                console.log(`🗜️ Compressed Files: ${report.compressedFiles.count} files, ${(report.compressedFiles.totalSize / 1024 / 1024).toFixed(1)}MB`);
            }

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
            case 'cleanup':
                await manager.runCleanupOnly();
                break;
            case 'search':
                await manager.runSearchUpdateOnly();
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