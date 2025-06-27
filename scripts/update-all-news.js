const fs = require('fs');
const path = require('path');

// 引入各個子模塊
const DynamicKeywordManager = require('./fetch-keywords');

class NewsUpdateManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.logFile = path.join(this.dataDir, 'update-log.json');
    this.initializeLogging();
  }

  initializeLogging() {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, JSON.stringify({ updates: [] }, null, 2));
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    // 寫入日誌文件
    const logData = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
    logData.updates.push(logEntry);
    
    // 保持最新1000條記錄
    if (logData.updates.length > 1000) {
      logData.updates = logData.updates.slice(-1000);
    }
    
    fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
  }

  async updateKeywords() {
    this.log('🔄 開始更新動態關鍵字...');
    
    try {
      const keywordManager = new DynamicKeywordManager();
      const keywords = await keywordManager.mergeAndOptimizeKeywords();
      
      this.log(`✅ 成功更新 ${keywords.length} 個動態關鍵字`, 'success');
      return keywords;
    } catch (error) {
      this.log(`❌ 關鍵字更新失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async fetchNews() {
    this.log('📰 開始獲取新聞...');
    
    try {
      // 動態引入fetch-news模塊以避免循環依賴
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const fetchProcess = spawn('node', [path.join(__dirname, 'fetch-news.js')], {
          stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        fetchProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log(data.toString());
        });

        fetchProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(data.toString());
        });

        fetchProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ 新聞獲取完成', 'success');
            resolve(output);
          } else {
            this.log(`❌ 新聞獲取失敗，退出碼: ${code}`, 'error');
            reject(new Error(`新聞獲取失敗: ${errorOutput}`));
          }
        });
      });
    } catch (error) {
      this.log(`❌ 新聞獲取過程出錯: ${error.message}`, 'error');
      throw error;
    }
  }

  async rankNews() {
    this.log('🏆 開始新聞排序...');
    
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const rankProcess = spawn('node', [path.join(__dirname, 'rank-news.js')], {
          stdio: 'pipe'
        });

        let output = '';
        let errorOutput = '';

        rankProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log(data.toString());
        });

        rankProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.error(data.toString());
        });

        rankProcess.on('close', (code) => {
          if (code === 0) {
            this.log('✅ 新聞排序完成', 'success');
            resolve(output);
          } else {
            this.log(`❌ 新聞排序失敗，退出碼: ${code}`, 'error');
            reject(new Error(`新聞排序失敗: ${errorOutput}`));
          }
        });
      });
    } catch (error) {
      this.log(`❌ 新聞排序過程出錯: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateAll() {
    const startTime = Date.now();
    this.log('🚀 開始完整新聞更新流程...');

    try {
      // 步驟1: 更新動態關鍵字
      const keywords = await this.updateKeywords();
      
      // 步驟2: 獲取新聞
      await this.fetchNews();
      
      // 步驟3: 排序新聞
      await this.rankNews();
      
      const duration = (Date.now() - startTime) / 1000;
      this.log(`🎉 完整更新流程成功完成！耗時 ${duration.toFixed(2)} 秒`, 'success');
      
      return {
        success: true,
        duration,
        keywordsUpdated: keywords.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.log(`💥 更新流程失敗: ${error.message}，耗時 ${duration.toFixed(2)} 秒`, 'error');
      
      return {
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  async quickUpdate() {
    const startTime = Date.now();
    this.log('⚡ 開始快速新聞更新（跳過關鍵字更新）...');

    try {
      // 只執行新聞獲取和排序
      await this.fetchNews();
      await this.rankNews();
      
      const duration = (Date.now() - startTime) / 1000;
      this.log(`⚡ 快速更新完成！耗時 ${duration.toFixed(2)} 秒`, 'success');
      
      return {
        success: true,
        duration,
        type: 'quick',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.log(`💥 快速更新失敗: ${error.message}，耗時 ${duration.toFixed(2)} 秒`, 'error');
      
      return {
        success: false,
        error: error.message,
        duration,
        type: 'quick',
        timestamp: new Date().toISOString()
      };
    }
  }

  generateReport() {
    this.log('📊 生成新聞更新報告...');
    
    try {
      // 讀取各種數據文件
      const newsIndex = this.readJsonFile('news-index.json');
      const rankedNewsIndex = this.readJsonFile('ranked-news-index.json');
      const keywords = this.readJsonFile('keywords.json');
      const dynamicKeywords = this.readJsonFile('dynamic-keywords.json');
      const logs = this.readJsonFile('update-log.json');

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalArticles: newsIndex?.totalArticles || 0,
          rankedArticles: rankedNewsIndex?.totalArticles || 0,
          staticKeywords: keywords?.keywords?.filter(k => !k.isDynamic)?.length || 0,
          dynamicKeywords: keywords?.keywords?.filter(k => k.isDynamic)?.length || 0,
          lastUpdated: newsIndex?.lastUpdated || 'Never',
          categories: newsIndex?.categories || {}
        },
        recentLogs: logs?.updates?.slice(-10) || [],
        sources: {
          general: newsIndex?.sources?.general || 0,
          keywordSearch: newsIndex?.sources?.keywordSearch || 0
        },
        performance: {
          averageUpdateTime: this.calculateAverageUpdateTime(logs?.updates || []),
          successRate: this.calculateSuccessRate(logs?.updates || [])
        }
      };

      console.log('\n=== 新聞系統狀態報告 ===');
      console.log(`📊 總文章數: ${report.summary.totalArticles}`);
      console.log(`🏆 已排序文章: ${report.summary.rankedArticles}`);
      console.log(`🔧 靜態關鍵字: ${report.summary.staticKeywords}`);
      console.log(`🔄 動態關鍵字: ${report.summary.dynamicKeywords}`);
      console.log(`⏰ 最後更新: ${report.summary.lastUpdated}`);
      console.log(`📈 成功率: ${(report.performance.successRate * 100).toFixed(1)}%`);
      console.log(`⚡ 平均更新時間: ${report.performance.averageUpdateTime.toFixed(2)}秒`);
      console.log('=======================\n');

      return report;
      
    } catch (error) {
      this.log(`❌ 報告生成失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  readJsonFile(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return null;
    } catch (error) {
      this.log(`⚠️ 無法讀取文件 ${filename}: ${error.message}`, 'warn');
      return null;
    }
  }

  calculateAverageUpdateTime(logs) {
    const updateLogs = logs.filter(log => 
      log.message.includes('完成') && log.message.includes('耗時')
    );
    
    if (updateLogs.length === 0) return 0;
    
    const times = updateLogs.map(log => {
      const match = log.message.match(/耗時 ([\d.]+) 秒/);
      return match ? parseFloat(match[1]) : 0;
    });
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  calculateSuccessRate(logs) {
    const updateLogs = logs.filter(log => 
      log.message.includes('完成') || log.message.includes('失敗')
    );
    
    if (updateLogs.length === 0) return 0;
    
    const successLogs = updateLogs.filter(log => 
      log.level === 'success' || log.message.includes('成功')
    );
    
    return successLogs.length / updateLogs.length;
  }
}

module.exports = NewsUpdateManager;

// 如果直接運行此文件
if (require.main === module) {
  const manager = new NewsUpdateManager();
  
  // 解析命令行參數
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  (async () => {
    try {
      switch (command) {
        case 'keywords':
          await manager.updateKeywords();
          break;
        case 'news':
          await manager.fetchNews();
          break;
        case 'rank':
          await manager.rankNews();
          break;
        case 'quick':
          await manager.quickUpdate();
          break;
        case 'report':
          manager.generateReport();
          break;
        case 'full':
        default:
          await manager.updateAll();
          break;
      }
    } catch (error) {
      console.error('執行失敗:', error.message);
      process.exit(1);
    }
  })();
} 