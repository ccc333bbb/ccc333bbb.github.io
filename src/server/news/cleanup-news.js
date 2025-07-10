const fs = require('fs');
const path = require('path');

class NewsCleanupManager {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.newsDir = path.join(this.dataDir, 'news');
        this.archiveDir = path.join(this.dataDir, 'news-archive');
        this.compressedDir = path.join(this.dataDir, 'news-compressed');
        
        // 配置
        this.config = {
            retentionDays: 30,        // 保留30天
            compressionDays: 7,        // 7天後壓縮
            archiveDays: 14,           // 14天後歸檔
            maxArchiveSize: 100 * 1024 * 1024, // 100MB 歸檔限制
            logFile: path.join(this.dataDir, 'cleanup-log.json')
        };
    }

    async logOperation(operation, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation: operation,
            details: details
        };

        let logs = { operations: [] };
        if (fs.existsSync(this.config.logFile)) {
            logs = JSON.parse(fs.readFileSync(this.config.logFile, 'utf8'));
        }

        logs.operations.unshift(logEntry);
        logs.operations = logs.operations.slice(0, 100); // 保留最近100條記錄
        logs.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.config.logFile, JSON.stringify(logs, null, 2));
    }

    // 確保目錄存在
    ensureDirectories() {
        [this.archiveDir, this.compressedDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });
    }

    // 獲取所有新聞文件
    getNewsFiles() {
        if (!fs.existsSync(this.newsDir)) {
            console.log('📁 News directory does not exist');
            return [];
        }

        return fs.readdirSync(this.newsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                name: file,
                date: new Date(file.replace('.json', '')),
                path: path.join(this.newsDir, file),
                size: fs.statSync(path.join(this.newsDir, file)).size
            }))
            .sort((a, b) => a.date - b.date);
    }

    // 壓縮新聞文件
    async compressNewsFile(fileInfo) {
        try {
            const data = JSON.parse(fs.readFileSync(fileInfo.path, 'utf8'));
            
            // 只保留重要字段以節省空間
            const compressedData = {
                date: data.date,
                totalArticles: data.articles?.length || 0,
                articles: data.articles?.map(article => ({
                    title: article.title,
                    url: article.url,
                    source: article.source,
                    pubDate: article.pubDate,
                    relevanceScore: article.relevanceScore,
                    category: article.category
                })) || []
            };
            
            const compressedPath = path.join(this.compressedDir, fileInfo.name);
            fs.writeFileSync(compressedPath, JSON.stringify(compressedData));
            
            // 刪除原文件
            fs.unlinkSync(fileInfo.path);
            
            const originalSize = fileInfo.size;
            const compressedSize = fs.statSync(compressedPath).size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            
            console.log(`🗜️ Compressed: ${fileInfo.name} (${compressionRatio}% smaller)`);
            
            return {
                success: true,
                originalSize,
                compressedSize,
                compressionRatio: parseFloat(compressionRatio)
            };
        } catch (error) {
            console.error(`❌ Failed to compress ${fileInfo.name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // 歸檔新聞文件
    async archiveNewsFile(fileInfo) {
        try {
            const archivePath = path.join(this.archiveDir, fileInfo.name);
            fs.renameSync(fileInfo.path, archivePath);
            
            console.log(`📦 Archived: ${fileInfo.name}`);
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to archive ${fileInfo.name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // 刪除過期文件
    async deleteExpiredFile(fileInfo) {
        try {
            fs.unlinkSync(fileInfo.path);
            console.log(`🗑️ Deleted: ${fileInfo.name}`);
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to delete ${fileInfo.name}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // 檢查歸檔目錄大小
    checkArchiveSize() {
        if (!fs.existsSync(this.archiveDir)) return 0;
        
        const files = fs.readdirSync(this.archiveDir);
        let totalSize = 0;
        
        files.forEach(file => {
            const filePath = path.join(this.archiveDir, file);
            totalSize += fs.statSync(filePath).size;
        });
        
        return totalSize;
    }

    // 清理過大的歸檔目錄
    async cleanupLargeArchive() {
        const currentSize = this.checkArchiveSize();
        
        if (currentSize > this.config.maxArchiveSize) {
            console.log(`📊 Archive size (${(currentSize / 1024 / 1024).toFixed(1)}MB) exceeds limit, cleaning up...`);
            
            const files = fs.readdirSync(this.archiveDir)
                .map(file => ({
                    name: file,
                    date: new Date(file.replace('.json', '')),
                    path: path.join(this.archiveDir, file),
                    size: fs.statSync(path.join(this.archiveDir, file)).size
                }))
                .sort((a, b) => a.date - b.date); // 最舊的在前
            
            let deletedSize = 0;
            let deletedCount = 0;
            
            for (const file of files) {
                if (currentSize - deletedSize <= this.config.maxArchiveSize) break;
                
                const result = await this.deleteExpiredFile(file);
                if (result.success) {
                    deletedSize += file.size;
                    deletedCount++;
                }
            }
            
            console.log(`🗑️ Cleaned up ${deletedCount} files (${(deletedSize / 1024 / 1024).toFixed(1)}MB)`);
            
            return { deletedCount, deletedSize };
        }
        
        return { deletedCount: 0, deletedSize: 0 };
    }

    // 執行完整的清理流程
    async runCleanup() {
        console.log('🧹 Starting news cleanup process...');
        const startTime = Date.now();
        
        this.ensureDirectories();
        
        const newsFiles = this.getNewsFiles();
        if (newsFiles.length === 0) {
            console.log('📭 No news files to process');
            return;
        }
        
        const now = new Date();
        const results = {
            compressed: [],
            archived: [],
            deleted: [],
            errors: []
        };
        
        console.log(`📊 Processing ${newsFiles.length} news files...`);
        
        for (const file of newsFiles) {
            const daysOld = (now - file.date) / (1000 * 60 * 60 * 24);
            
            try {
                if (daysOld > this.config.retentionDays) {
                    // 超過保留期限，刪除
                    const result = await this.deleteExpiredFile(file);
                    if (result.success) {
                        results.deleted.push(file.name);
                    } else {
                        results.errors.push({ file: file.name, error: result.error });
                    }
                } else if (daysOld > this.config.archiveDays) {
                    // 超過歸檔期限，歸檔
                    const result = await this.archiveNewsFile(file);
                    if (result.success) {
                        results.archived.push(file.name);
                    } else {
                        results.errors.push({ file: file.name, error: result.error });
                    }
                } else if (daysOld > this.config.compressionDays) {
                    // 超過壓縮期限，壓縮
                    const result = await this.compressNewsFile(file);
                    if (result.success) {
                        results.compressed.push({
                            name: file.name,
                            compressionRatio: result.compressionRatio
                        });
                    } else {
                        results.errors.push({ file: file.name, error: result.error });
                    }
                }
            } catch (error) {
                results.errors.push({ file: file.name, error: error.message });
            }
        }
        
        // 清理過大的歸檔目錄
        const archiveCleanup = await this.cleanupLargeArchive();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // 生成報告
        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration}s`,
            summary: {
                totalFiles: newsFiles.length,
                compressed: results.compressed.length,
                archived: results.archived.length,
                deleted: results.deleted.length,
                errors: results.errors.length,
                archiveCleanup: archiveCleanup
            },
            details: results
        };
        
        // 記錄操作
        await this.logOperation('cleanup', report);
        
        // 輸出結果
        console.log('\n🎉 Cleanup process completed!');
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`🗜️ Compressed: ${results.compressed.length} files`);
        console.log(`📦 Archived: ${results.archived.length} files`);
        console.log(`🗑️ Deleted: ${results.deleted.length} files`);
        console.log(`❌ Errors: ${results.errors.length} files`);
        
        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(error => {
                console.log(`  - ${error.file}: ${error.error}`);
            });
        }
        
        return report;
    }

    // 生成清理報告
    async generateReport() {
        console.log('📋 Generating cleanup report...');
        
        const newsFiles = this.getNewsFiles();
        const archiveFiles = fs.existsSync(this.archiveDir) ? 
            fs.readdirSync(this.archiveDir).filter(f => f.endsWith('.json')) : [];
        const compressedFiles = fs.existsSync(this.compressedDir) ? 
            fs.readdirSync(this.compressedDir).filter(f => f.endsWith('.json')) : [];
        
        const report = {
            timestamp: new Date().toISOString(),
            currentStatus: {
                activeFiles: newsFiles.length,
                archivedFiles: archiveFiles.length,
                compressedFiles: compressedFiles.length,
                totalStorage: {
                    active: newsFiles.reduce((sum, f) => sum + f.size, 0),
                    archive: this.checkArchiveSize(),
                    compressed: compressedFiles.reduce((sum, file) => {
                        const filePath = path.join(this.compressedDir, file);
                        return sum + fs.statSync(filePath).size;
                    }, 0)
                }
            },
            configuration: this.config
        };
        
        console.log('📊 Current Status:');
        console.log(`  📰 Active files: ${report.currentStatus.activeFiles}`);
        console.log(`  📦 Archived files: ${report.currentStatus.archivedFiles}`);
        console.log(`  🗜️ Compressed files: ${report.currentStatus.compressedFiles}`);
        console.log(`  💾 Total storage: ${(report.currentStatus.totalStorage.active / 1024 / 1024).toFixed(1)}MB active, ${(report.currentStatus.totalStorage.archive / 1024 / 1024).toFixed(1)}MB archived, ${(report.currentStatus.totalStorage.compressed / 1024 / 1024).toFixed(1)}MB compressed`);
        
        return report;
    }
}

// 主函數
async function main() {
    const cleanupManager = new NewsCleanupManager();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'cleanup';
    
    try {
        switch (command) {
            case 'cleanup':
                await cleanupManager.runCleanup();
                break;
            case 'report':
                await cleanupManager.generateReport();
                break;
            case 'test':
                console.log('🧪 Running cleanup in test mode...');
                cleanupManager.config.retentionDays = 1; // 測試用：1天後刪除
                cleanupManager.config.compressionDays = 0.5; // 測試用：12小時後壓縮
                cleanupManager.config.archiveDays = 1; // 測試用：1天後歸檔
                await cleanupManager.runCleanup();
                break;
            default:
                console.log('Usage: node cleanup-news.js [cleanup|report|test]');
                console.log('  cleanup - Run full cleanup process');
                console.log('  report  - Generate cleanup report');
                console.log('  test    - Run cleanup in test mode');
        }
    } catch (error) {
        console.error('❌ Cleanup process failed:', error.message);
        process.exit(1);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    main();
}

module.exports = NewsCleanupManager; 