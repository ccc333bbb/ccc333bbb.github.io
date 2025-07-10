const NewsUpdateManager = require('../news/update-all-news');
const NewsCleanupManager = require('../news/cleanup-news');
const SearchIndexUpdater = require('../search/update-indexes');
const fs = require('fs');
const path = require('path');

class AutomatedTaskScheduler {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.logFile = path.join(this.dataDir, 'scheduler-log.json');
        this.configFile = path.join(__dirname, '../../../config/scheduler.config.js');
        
        // 默認配置
        this.config = {
            enabled: true,
            tasks: {
                newsUpdate: {
                    enabled: true,
                    schedule: '0 */6 * * *', // 每6小時
                    type: 'full' // full, quick, keywords
                },
                cleanup: {
                    enabled: true,
                    schedule: '0 2 * * *', // 每天凌晨2點
                    type: 'cleanup'
                },
                searchUpdate: {
                    enabled: true,
                    schedule: '0 */2 * * *', // 每2小時
                    type: 'incremental'
                }
            },
            notifications: {
                enabled: true,
                webhook: null,
                email: null
            }
        };
        
        this.timers = new Map();
        this.isRunning = false;
        
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const config = require(this.configFile);
                this.config = { ...this.config, ...config };
                console.log('✅ Loaded scheduler configuration');
            } else {
                this.saveConfig();
                console.log('📝 Created default scheduler configuration');
            }
        } catch (error) {
            console.error('❌ Failed to load scheduler config:', error.message);
        }
    }

    saveConfig() {
        try {
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            const configContent = `module.exports = ${JSON.stringify(this.config, null, 2)};`;
            fs.writeFileSync(this.configFile, configContent);
        } catch (error) {
            console.error('❌ Failed to save scheduler config:', error.message);
        }
    }

    async logTask(operation, details) {
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
        logs.operations = logs.operations.slice(0, 100); // 保留最近100條記錄
        logs.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    }

    // 解析 cron 表達式（簡化版本）
    parseCronExpression(expression) {
        const parts = expression.split(' ');
        if (parts.length !== 5) {
            throw new Error('Invalid cron expression');
        }

        const [minute, hour, day, month, weekday] = parts;
        
        return {
            minute: minute === '*' ? null : parseInt(minute),
            hour: hour === '*' ? null : parseInt(hour),
            day: day === '*' ? null : parseInt(day),
            month: month === '*' ? null : parseInt(month),
            weekday: weekday === '*' ? null : parseInt(weekday)
        };
    }

    // 檢查是否應該執行任務
    shouldRunTask(schedule) {
        const now = new Date();
        const cron = this.parseCronExpression(schedule);
        
        if (cron.minute !== null && cron.minute !== now.getMinutes()) return false;
        if (cron.hour !== null && cron.hour !== now.getHours()) return false;
        if (cron.day !== null && cron.day !== now.getDate()) return false;
        if (cron.month !== null && cron.month !== (now.getMonth() + 1)) return false;
        if (cron.weekday !== null && cron.weekday !== now.getDay()) return false;
        
        return true;
    }

    // 執行新聞更新任務
    async runNewsUpdateTask(type = 'full') {
        console.log(`📰 Running news update task (${type})...`);
        
        try {
            const manager = new NewsUpdateManager();
            let result;
            
            switch (type) {
                case 'quick':
                    result = await manager.runQuickUpdate();
                    break;
                case 'keywords':
                    result = await manager.runKeywordsOnly();
                    break;
                case 'full':
                default:
                    result = await manager.runFullUpdate();
                    break;
            }
            
            await this.logTask('news-update', {
                type: type,
                success: true,
                result: result
            });
            
            console.log(`✅ News update task completed (${type})`);
            return result;
            
        } catch (error) {
            console.error(`❌ News update task failed (${type}):`, error.message);
            
            await this.logTask('news-update', {
                type: type,
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    // 執行清理任務
    async runCleanupTask() {
        console.log('🧹 Running cleanup task...');
        
        try {
            const cleanupManager = new NewsCleanupManager();
            const result = await cleanupManager.runCleanup();
            
            await this.logTask('cleanup', {
                success: true,
                result: result
            });
            
            console.log('✅ Cleanup task completed');
            return result;
            
        } catch (error) {
            console.error('❌ Cleanup task failed:', error.message);
            
            await this.logTask('cleanup', {
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    // 執行搜索索引更新任務
    async runSearchUpdateTask(type = 'incremental') {
        console.log(`🔍 Running search update task (${type})...`);
        
        try {
            const searchUpdater = new SearchIndexUpdater();
            let result;
            
            switch (type) {
                case 'full':
                    result = await searchUpdater.runFullUpdate();
                    break;
                case 'incremental':
                default:
                    result = await searchUpdater.runIncrementalUpdate();
                    break;
            }
            
            await this.logTask('search-update', {
                type: type,
                success: true,
                result: result
            });
            
            console.log(`✅ Search update task completed (${type})`);
            return result;
            
        } catch (error) {
            console.error(`❌ Search update task failed (${type}):`, error.message);
            
            await this.logTask('search-update', {
                type: type,
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    // 發送通知
    async sendNotification(task, result) {
        if (!this.config.notifications.enabled) return;
        
        try {
            const message = {
                task: task,
                timestamp: new Date().toISOString(),
                success: result.success,
                details: result
            };
            
            // Webhook 通知
            if (this.config.notifications.webhook) {
                await this.sendWebhookNotification(message);
            }
            
            // 郵件通知
            if (this.config.notifications.email) {
                await this.sendEmailNotification(message);
            }
            
        } catch (error) {
            console.error('❌ Failed to send notification:', error.message);
        }
    }

    async sendWebhookNotification(message) {
        // 實現 webhook 通知邏輯
        console.log('📡 Webhook notification sent');
    }

    async sendEmailNotification(message) {
        // 實現郵件通知邏輯
        console.log('📧 Email notification sent');
    }

    // 執行單個任務
    async executeTask(taskName, taskConfig) {
        if (!taskConfig.enabled) {
            console.log(`⏭️ Task ${taskName} is disabled`);
            return;
        }
        
        if (!this.shouldRunTask(taskConfig.schedule)) {
            return;
        }
        
        console.log(`🚀 Executing scheduled task: ${taskName}`);
        
        try {
            let result;
            
            switch (taskName) {
                case 'newsUpdate':
                    result = await this.runNewsUpdateTask(taskConfig.type);
                    break;
                case 'cleanup':
                    result = await this.runCleanupTask();
                    break;
                case 'searchUpdate':
                    result = await this.runSearchUpdateTask(taskConfig.type);
                    break;
                default:
                    console.warn(`⚠️ Unknown task: ${taskName}`);
                    return;
            }
            
            await this.sendNotification(taskName, result);
            
        } catch (error) {
            console.error(`❌ Task ${taskName} failed:`, error.message);
            await this.sendNotification(taskName, { success: false, error: error.message });
        }
    }

    // 啟動調度器
    start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler is already running');
            return;
        }
        
        if (!this.config.enabled) {
            console.log('⏭️ Scheduler is disabled');
            return;
        }
        
        console.log('🚀 Starting automated task scheduler...');
        this.isRunning = true;
        
        // 每分鐘檢查一次任務
        const checkInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(checkInterval);
                return;
            }
            
            Object.entries(this.config.tasks).forEach(([taskName, taskConfig]) => {
                this.executeTask(taskName, taskConfig);
            });
        }, 60 * 1000); // 每分鐘
        
        this.timers.set('main', checkInterval);
        
        console.log('✅ Scheduler started successfully');
        console.log('📋 Active tasks:');
        Object.entries(this.config.tasks).forEach(([taskName, taskConfig]) => {
            if (taskConfig.enabled) {
                console.log(`  - ${taskName}: ${taskConfig.schedule} (${taskConfig.type})`);
            }
        });
    }

    // 停止調度器
    stop() {
        console.log('🛑 Stopping automated task scheduler...');
        this.isRunning = false;
        
        this.timers.forEach((timer, name) => {
            clearInterval(timer);
            console.log(`  - Stopped timer: ${name}`);
        });
        
        this.timers.clear();
        console.log('✅ Scheduler stopped');
    }

    // 立即執行任務
    async runTaskNow(taskName) {
        console.log(`⚡ Running task immediately: ${taskName}`);
        
        const taskConfig = this.config.tasks[taskName];
        if (!taskConfig) {
            console.error(`❌ Unknown task: ${taskName}`);
            return;
        }
        
        await this.executeTask(taskName, taskConfig);
    }

    // 生成狀態報告
    async generateStatusReport() {
        console.log('📋 Generating scheduler status report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            scheduler: {
                enabled: this.config.enabled,
                running: this.isRunning,
                activeTimers: this.timers.size
            },
            tasks: {},
            recentLogs: []
        };
        
        // 任務狀態
        Object.entries(this.config.tasks).forEach(([taskName, taskConfig]) => {
            report.tasks[taskName] = {
                enabled: taskConfig.enabled,
                schedule: taskConfig.schedule,
                type: taskConfig.type,
                nextRun: this.getNextRunTime(taskConfig.schedule)
            };
        });
        
        // 最近日誌
        if (fs.existsSync(this.logFile)) {
            const logs = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            report.recentLogs = logs.operations.slice(0, 10);
        }
        
        console.log('✅ Status report generated');
        console.table(Object.entries(report.tasks).map(([name, config]) => ({
            Task: name,
            Enabled: config.enabled ? '✅' : '❌',
            Schedule: config.schedule,
            Type: config.type,
            NextRun: config.nextRun
        })));
        
        return report;
    }

    // 獲取下次運行時間
    getNextRunTime(schedule) {
        // 簡化的下次運行時間計算
        const now = new Date();
        const cron = this.parseCronExpression(schedule);
        
        // 這裡應該實現更複雜的 cron 解析邏輯
        // 目前返回一個簡單的估計
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1小時後
    }

    // 重新加載配置
    reloadConfig() {
        console.log('🔄 Reloading scheduler configuration...');
        this.loadConfig();
        console.log('✅ Configuration reloaded');
    }
}

// 主函數
async function main() {
    const scheduler = new AutomatedTaskScheduler();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    
    try {
        switch (command) {
            case 'start':
                scheduler.start();
                break;
            case 'stop':
                scheduler.stop();
                break;
            case 'status':
                await scheduler.generateStatusReport();
                break;
            case 'news':
                await scheduler.runTaskNow('newsUpdate');
                break;
            case 'cleanup':
                await scheduler.runTaskNow('cleanup');
                break;
            case 'search':
                await scheduler.runTaskNow('searchUpdate');
                break;
            case 'reload':
                scheduler.reloadConfig();
                break;
            default:
                console.log('Usage: node automated-tasks.js [start|stop|status|news|cleanup|search|reload]');
                console.log('  start   - Start the scheduler');
                console.log('  stop    - Stop the scheduler');
                console.log('  status  - Show scheduler status');
                console.log('  news    - Run news update task now');
                console.log('  cleanup - Run cleanup task now');
                console.log('  search  - Run search update task now');
                console.log('  reload  - Reload configuration');
        }
    } catch (error) {
        console.error('❌ Scheduler operation failed:', error.message);
        process.exit(1);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    main();
}

module.exports = AutomatedTaskScheduler; 