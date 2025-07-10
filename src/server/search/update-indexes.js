const fs = require('fs');
const path = require('path');

class SearchIndexUpdater {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.logFile = path.join(this.dataDir, 'search-update-log.json');
        this.lastUpdateFile = path.join(this.dataDir, 'last-search-update.txt');
        
        // 配置
        this.config = {
            updateInterval: 60 * 60 * 1000, // 1小時
            maxRetries: 3,
            batchSize: 100,
            enableIncremental: true
        };
    }

    async logOperation(operation, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation,
            details: details
        };

        let logs = { operations: [] };
        if (fs.existsSync(this.logFile)) {
            logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
        }

        logs.operations.unshift(logEntry);
        logs.operations = logs.operations.slice(0, 50); // 保留最近50條記錄
        logs.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    }

    // 檢查是否需要更新
    needsUpdate() {
        if (!fs.existsSync(this.lastUpdateFile)) {
            return true;
        }

        const lastUpdate = fs.readFileSync(this.lastUpdateFile, 'utf8');
        const lastUpdateTime = new Date(lastUpdate);
        const now = new Date();
        
        return (now - lastUpdateTime) > this.config.updateInterval;
    }

    // 獲取最新數據文件時間戳
    getLatestDataTimestamp() {
        const files = [
            'ranked-news-index.json',
            'ai-tools.json',
            'thinking-models.json',
            'mcp-servers.json'
        ];

        let latestTime = new Date(0);
        
        files.forEach(file => {
            const filePath = path.join(this.dataDir, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                if (stats.mtime > latestTime) {
                    latestTime = stats.mtime;
                }
            }
        });

        return latestTime;
    }

    // 生成搜索索引更新信號
    async generateUpdateSignal() {
        const timestamp = new Date().toISOString();
        fs.writeFileSync(this.lastUpdateFile, timestamp);
        
        // 創建一個更新信號文件供客戶端檢測
        const signalFile = path.join(this.dataDir, 'search-update-signal.json');
        const signal = {
            timestamp: timestamp,
            version: '1.0',
            dataFiles: this.getDataFilesStatus()
        };
        
        fs.writeFileSync(signalFile, JSON.stringify(signal, null, 2));
        
        console.log(`📡 Generated update signal: ${timestamp}`);
        return signal;
    }

    // 獲取數據文件狀態
    getDataFilesStatus() {
        const files = [
            'ranked-news-index.json',
            'ai-tools.json',
            'thinking-models.json',
            'mcp-servers.json'
        ];

        const status = {};
        
        files.forEach(file => {
            const filePath = path.join(this.dataDir, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                status[file] = {
                    exists: true,
                    lastModified: stats.mtime.toISOString(),
                    size: stats.size,
                    recordCount: this.getRecordCount(data)
                };
            } else {
                status[file] = { exists: false };
            }
        });

        return status;
    }

    // 獲取記錄數量
    getRecordCount(data) {
        if (data.topArticles) return data.topArticles.length;
        if (data.articles) return data.articles.length;
        if (data.tools) return data.tools.length;
        if (data.models) return data.models.length;
        if (data.servers) return data.servers.length;
        if (Array.isArray(data)) return data.length;
        return 0;
    }

    // 檢查數據完整性
    async validateDataIntegrity() {
        console.log('🔍 Validating data integrity...');
        
        const files = [
            'ranked-news-index.json',
            'ai-tools.json',
            'thinking-models.json',
            'mcp-servers.json'
        ];

        const validationResults = {};
        
        for (const file of files) {
            const filePath = path.join(this.dataDir, file);
            
            try {
                if (fs.existsSync(filePath)) {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const stats = fs.statSync(filePath);
                    
                    validationResults[file] = {
                        valid: true,
                        size: stats.size,
                        recordCount: this.getRecordCount(data),
                        lastModified: stats.mtime.toISOString(),
                        hasRequiredFields: this.checkRequiredFields(data, file)
                    };
                } else {
                    validationResults[file] = {
                        valid: false,
                        error: 'File not found'
                    };
                }
            } catch (error) {
                validationResults[file] = {
                    valid: false,
                    error: error.message
                };
            }
        }

        return validationResults;
    }

    // 檢查必需字段
    checkRequiredFields(data, fileType) {
        const requiredFields = {
            'ranked-news-index.json': ['topArticles', 'categories'],
            'ai-tools.json': ['metadata', 'categories'],
            'thinking-models.json': ['metadata', 'models'],
            'mcp-servers.json': ['metadata', 'servers']
        };

        const fields = requiredFields[fileType] || [];
        return fields.every(field => data.hasOwnProperty(field));
    }

    // 生成搜索索引統計
    async generateSearchStats() {
        console.log('📊 Generating search statistics...');
        
        const stats = {
            timestamp: new Date().toISOString(),
            dataFiles: this.getDataFilesStatus(),
            totalRecords: 0,
            storageSize: 0
        };

        // 計算總記錄數和存儲大小
        Object.values(stats.dataFiles).forEach(fileStatus => {
            if (fileStatus.exists) {
                stats.totalRecords += fileStatus.recordCount || 0;
                stats.storageSize += fileStatus.size || 0;
            }
        });

        // 保存統計信息
        const statsFile = path.join(this.dataDir, 'search-stats.json');
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

        console.log(`📈 Total records: ${stats.totalRecords}`);
        console.log(`💾 Total storage: ${(stats.storageSize / 1024 / 1024).toFixed(1)}MB`);

        return stats;
    }

    // 執行增量更新檢查
    async runIncrementalUpdate() {
        console.log('🔄 Running incremental update check...');
        
        if (!this.needsUpdate()) {
            console.log('⏭️ No update needed');
            return { updated: false, reason: 'No update needed' };
        }

        const latestDataTime = this.getLatestDataTimestamp();
        const lastUpdateTime = fs.existsSync(this.lastUpdateFile) ? 
            new Date(fs.readFileSync(this.lastUpdateFile, 'utf8')) : new Date(0);

        if (latestDataTime <= lastUpdateTime) {
            console.log('⏭️ Data files not changed');
            return { updated: false, reason: 'Data files not changed' };
        }

        console.log('📝 Data files changed, triggering update...');
        return await this.runFullUpdate();
    }

    // 執行完整更新
    async runFullUpdate() {
        console.log('🚀 Starting search index update process...');
        const startTime = Date.now();

        try {
            // 步驟1：驗證數據完整性
            console.log('\n🔍 Step 1/4: Validating data integrity');
            const validationResults = await this.validateDataIntegrity();
            
            const invalidFiles = Object.entries(validationResults)
                .filter(([file, result]) => !result.valid)
                .map(([file, result]) => ({ file, error: result.error }));

            if (invalidFiles.length > 0) {
                console.log('❌ Data validation failed:');
                invalidFiles.forEach(({ file, error }) => {
                    console.log(`  - ${file}: ${error}`);
                });
                throw new Error('Data validation failed');
            }

            console.log('✅ Data validation passed');

            // 步驟2：生成搜索統計
            console.log('\n📊 Step 2/4: Generating search statistics');
            const searchStats = await this.generateSearchStats();
            console.log('✅ Search statistics generated');

            // 步驟3：生成更新信號
            console.log('\n📡 Step 3/4: Generating update signal');
            const updateSignal = await this.generateUpdateSignal();
            console.log('✅ Update signal generated');

            // 步驟4：記錄操作
            console.log('\n📝 Step 4/4: Logging operation');
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            const report = {
                success: true,
                duration: `${duration}s`,
                timestamp: new Date().toISOString(),
                summary: {
                    totalRecords: searchStats.totalRecords,
                    storageSize: searchStats.storageSize,
                    dataFiles: Object.keys(searchStats.dataFiles).length
                },
                details: {
                    validationResults,
                    searchStats,
                    updateSignal
                }
            };

            await this.logOperation('full-update', report);

            console.log('\n🎉 Search index update completed successfully!');
            console.log(`⏱️  Duration: ${duration}s`);
            console.log(`📊 Total records: ${searchStats.totalRecords}`);
            console.log(`💾 Storage size: ${(searchStats.storageSize / 1024 / 1024).toFixed(1)}MB`);

            return report;

        } catch (error) {
            console.error('❌ Search index update failed:', error.message);
            
            const errorReport = {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };

            await this.logOperation('update-error', errorReport);
            throw error;
        }
    }

    // 生成更新報告
    async generateReport() {
        console.log('📋 Generating search index update report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            system: 'Search Index Updater v1.0',
            status: {
                needsUpdate: this.needsUpdate(),
                lastUpdate: fs.existsSync(this.lastUpdateFile) ? 
                    fs.readFileSync(this.lastUpdateFile, 'utf8') : 'Never',
                latestDataTime: this.getLatestDataTimestamp().toISOString()
            },
            dataFiles: this.getDataFilesStatus(),
            configuration: this.config
        };

        // 檢查日誌文件
        if (fs.existsSync(this.logFile)) {
            const logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            report.recentOperations = logs.operations.slice(0, 5);
        }

        console.log('📊 Search Index Status:');
        console.log(`  🔄 Needs update: ${report.status.needsUpdate}`);
        console.log(`  📅 Last update: ${report.status.lastUpdate}`);
        console.log(`  📅 Latest data: ${report.status.latestDataTime}`);
        console.log(`  📁 Data files: ${Object.keys(report.dataFiles).length}`);

        return report;
    }

    // 清理舊的更新信號
    async cleanupOldSignals() {
        const signalFile = path.join(this.dataDir, 'search-update-signal.json');
        
        if (fs.existsSync(signalFile)) {
            const signal = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
            const signalTime = new Date(signal.timestamp);
            const now = new Date();
            
            // 如果信號超過24小時，刪除它
            if ((now - signalTime) > 24 * 60 * 60 * 1000) {
                fs.unlinkSync(signalFile);
                console.log('🗑️ Cleaned up old update signal');
            }
        }
    }
}

// 主函數
async function main() {
    const updater = new SearchIndexUpdater();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'update';
    
    try {
        switch (command) {
            case 'update':
                await updater.runFullUpdate();
                break;
            case 'incremental':
                await updater.runIncrementalUpdate();
                break;
            case 'report':
                await updater.generateReport();
                break;
            case 'validate':
                await updater.validateDataIntegrity();
                break;
            case 'cleanup':
                await updater.cleanupOldSignals();
                break;
            default:
                console.log('Usage: node update-indexes.js [update|incremental|report|validate|cleanup]');
                console.log('  update      - Run full update process');
                console.log('  incremental - Run incremental update check');
                console.log('  report      - Generate update report');
                console.log('  validate    - Validate data integrity');
                console.log('  cleanup     - Clean up old signals');
        }
    } catch (error) {
        console.error('❌ Update process failed:', error.message);
        process.exit(1);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    main();
}

module.exports = SearchIndexUpdater; 