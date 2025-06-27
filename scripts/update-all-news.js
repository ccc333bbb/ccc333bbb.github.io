const KeywordsFetcher = require('./fetch-keywords');
const RSSNewsAggregator = require('./fetch-news');
const NewsProcessor = require('./process-news');
const fs = require('fs');
const path = require('path');

class NewsUpdateManager {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
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
        logs.operations = logs.operations.slice(0, 50); // 保留最近50次操作
        logs.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    }

    async runFullUpdate() {
        console.log('🚀 開始完整的RSS新聞更新流程...');
        const startTime = Date.now();
        
        const results = {
            keywords: null,
            news: null,
            processing: null
        };

        try {
            // 步驟1: 獲取熱門關鍵詞
            console.log('\n📊 步驟 1/3: 獲取熱門關鍵詞');
            const keywordsFetcher = new KeywordsFetcher();
            results.keywords = await keywordsFetcher.fetchAllKeywords();
            await this.logOperation('fetch-keywords', {
                success: true,
                totalKeywords: results.keywords.totalKeywords
            });
            console.log('✅ 關鍵詞獲取完成');

            // 步驟2: 獲取RSS新聞
            console.log('\n📰 步驟 2/3: 獲取RSS新聞');
            const newsAggregator = new RSSNewsAggregator();
            results.news = await newsAggregator.fetchAllNews();
            await this.logOperation('fetch-news', results.news);
            console.log('✅ 新聞抓取完成');

            // 步驟3: 處理和排序新聞
            console.log('\n🔄 步驟 3/3: 處理和排序新聞');
            const newsProcessor = new NewsProcessor();
            results.processing = await newsProcessor.processLatestNews();
            await this.logOperation('process-news', results.processing);
            console.log('✅ 新聞處理完成');

            const endTime = Date.now();
            const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

            // 生成綜合報告
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

            // 保存報告
            const reportFile = path.join(this.dataDir, 'last-update-report.json');
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

            console.log('\n🎉 完整更新流程完成！');
            console.log(`⏱️  總耗時: ${totalDuration}秒`);
            console.log(`🔑 關鍵詞: ${report.summary.keywordsCount}個`);
            console.log(`📰 文章: ${report.summary.articlesCount}篇`);
            console.log(`🎯 來源: ${report.summary.sourcesCount}個`);
            console.log(`📊 分類: ${report.summary.categoriesCount}個`);
            console.log(`📈 平均相關性: ${report.summary.avgRelevanceScore.toFixed(2)}`);

            return report;

        } catch (error) {
            console.error('❌ 更新流程失敗:', error.message);
            
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
        console.log('⚡ 開始快速新聞更新（僅新聞和處理）...');
        
        try {
            // 僅獲取新聞和處理
            const newsAggregator = new RSSNewsAggregator();
            const newsResult = await newsAggregator.fetchAllNews();
            
            const newsProcessor = new NewsProcessor();
            const processingResult = await newsProcessor.processLatestNews();

            console.log('✅ 快速更新完成');
            console.log(`📰 文章: ${newsResult.totalArticles}篇`);
            
            return {
                success: true,
                news: newsResult,
                processing: processingResult
            };

        } catch (error) {
            console.error('❌ 快速更新失敗:', error.message);
            throw error;
        }
    }

    async runKeywordsOnly() {
        console.log('🔑 僅更新關鍵詞...');
        
        try {
            const keywordsFetcher = new KeywordsFetcher();
            const result = await keywordsFetcher.fetchAllKeywords();
            
            console.log('✅ 關鍵詞更新完成');
            console.log(`🎯 關鍵詞: ${result.totalKeywords}個`);
            
            return {
                success: true,
                keywords: result
            };

        } catch (error) {
            console.error('❌ 關鍵詞更新失敗:', error.message);
            throw error;
        }
    }

    async generateReport() {
        console.log('📋 生成更新報告...');
        
        try {
            const report = {
                timestamp: new Date().toISOString(),
                system: 'RSS News Aggregator v2.0',
                files: {}
            };

            // 檢查各個數據文件
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

            // 檢查新聞文件夾
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

            console.log('✅ 報告生成完成');
            console.table(Object.entries(report.files).map(([file, info]) => ({
                檔案: file,
                存在: info.exists ? '✅' : '❌',
                大小: info.exists ? `${(info.size / 1024).toFixed(1)}KB` : '-',
                記錄數: info.exists ? info.recordCount : '-'
            })));

            return report;

        } catch (error) {
            console.error('❌ 報告生成失敗:', error.message);
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

// 主執行函數
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
        console.error('💥 執行失敗:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewsUpdateManager; 