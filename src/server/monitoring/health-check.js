#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const config = require('../../../config/health-check.config.js');

class HealthChecker {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.config = config;
        this.results = {
            timestamp: new Date().toISOString(),
            ftdd: { healthy: 0, warning: 0, unhealthy: 0, discontinued: 0, total: 0 },
            mcp: { active: 0, inactive: 0, total: 0 },
            overall: { status: 'healthy', score: 100 }
        };
    }

    async run() {
        console.log('🔍 Starting enhanced health check...');
        
        try {
            await this.checkFTDDResources();
            await this.checkMCPServers();
            await this.calculateOverallHealth();
            await this.saveResults();
            
            console.log('✅ Health check completed successfully');
            this.printSummary();
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            process.exit(1);
        }
    }

    async checkFTDDResources() {
        try {
            const data = await this.loadJSON('ftdd-resources.json');
            console.log('🔍 Checking FTDD resources with enhanced logic...');
            
            let totalChecked = 0;
            
            for (const [categoryId, category] of Object.entries(data.categories)) {
                for (const service of category.services) {
                    totalChecked++;
                    
                    console.log(`  🔍 Checking ${service.name}...`);
                    
                    const healthResult = await this.checkServiceHealth(service);
                    
                    // 更新服務狀態
                    service.status = {
                        ...service.status,
                        ...healthResult,
                        lastChecked: new Date().toISOString()
                    };
                    
                    // 統計結果
                    this.updateFTDDStats(healthResult.health);
                    
                    console.log(`    ${this.getStatusIcon(healthResult.health)} ${service.name}: ${healthResult.health} ${healthResult.reason || ''}`);
                    
                    // 避免請求過於頻繁
                    await this.delay(this.config.checkInterval);
                }
            }
            
            this.results.ftdd.total = totalChecked;
            data.metadata.lastUpdated = new Date().toISOString();
            data.metadata.healthyServices = this.results.ftdd.healthy + this.results.ftdd.warning;
            
            await this.saveJSON('ftdd-resources.json', data);
        } catch (error) {
            console.error('Failed to check FTDD resources:', error.message);
        }
    }

    async checkServiceHealth(service) {
        try {
            // 1. 基本HTTP檢查
            const startTime = Date.now();
            const response = await axios.get(service.url, {
                timeout: this.config.timeout.http,
                validateStatus: (status) => status < 500,
                headers: {
                    'User-Agent': 'TARDIS-Health-Checker/1.0'
                }
            });
            const responseTime = Date.now() - startTime;
            
            // 2. 檢查響應狀態
            if (response.status >= 400) {
                return {
                    health: 'unhealthy',
                    responseTime: responseTime,
                    statusCode: response.status,
                    reason: `HTTP ${response.status}`
                };
            }
            
            // 3. 內容檢查 - 查找停服關鍵詞
            const contentCheck = await this.checkServiceContent(response.data, service);
            if (contentCheck.discontinued) {
                return {
                    health: 'discontinued',
                    responseTime: responseTime,
                    statusCode: response.status,
                    reason: `Service discontinued: ${contentCheck.keyword}`,
                    discontinuedKeyword: contentCheck.keyword
                };
            }
            
            // 4. 特殊檢查邏輯
            const specialCheck = await this.performSpecialChecks(service, response);
            if (specialCheck.status !== 'normal') {
                return {
                    health: specialCheck.health,
                    responseTime: responseTime,
                    statusCode: response.status,
                    reason: specialCheck.reason
                };
            }
            
            // 5. 根據響應時間判斷健康狀態
            if (responseTime > this.config.responseTime.warning) {
                return {
                    health: 'warning',
                    responseTime: responseTime,
                    statusCode: response.status,
                    reason: 'Slow response time'
                };
            }
            
            return {
                health: 'healthy',
                responseTime: responseTime,
                statusCode: response.status,
                reason: 'Service operational'
            };
            
        } catch (error) {
            return {
                health: 'unhealthy',
                responseTime: null,
                statusCode: null,
                reason: error.message,
                error: error.code
            };
        }
    }

    async checkServiceContent(htmlContent, service) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            return { discontinued: false };
        }
        
        const content = htmlContent.toLowerCase();
        
        for (const keyword of this.config.discontinuedKeywords) {
            if (content.includes(keyword.toLowerCase())) {
                // 進一步檢查上下文，避免誤判
                const contextCheck = this.analyzeKeywordContext(content, keyword.toLowerCase());
                if (contextCheck.isDiscontinued) {
                    return { 
                        discontinued: true, 
                        keyword: keyword,
                        context: contextCheck.context 
                    };
                }
            }
        }
        
        return { discontinued: false };
    }

    analyzeKeywordContext(content, keyword) {
        const keywordIndex = content.indexOf(keyword);
        if (keywordIndex === -1) return { isDiscontinued: false };
        
        // 提取關鍵詞前後100個字符作為上下文
        const start = Math.max(0, keywordIndex - 100);
        const end = Math.min(content.length, keywordIndex + keyword.length + 100);
        const context = content.substring(start, end);
        
        // 檢查是否是真正的停服通知
        const positiveIndicators = this.config.contextIndicators;
        
        const hasPositiveIndicator = positiveIndicators.some(indicator => 
            context.includes(indicator)
        );
        
        return {
            isDiscontinued: hasPositiveIndicator,
            context: context.trim()
        };
    }

    async performSpecialChecks(service, response) {
        // 特殊服務的額外檢查邏輯
        const url = service.url.toLowerCase();
        
        // 檢查RedHat相關服務
        if (url.includes('redhat.com') || url.includes('openshift')) {
            return await this.checkRedHatService(service, response);
        }
        
        // 檢查GitHub相關服務
        if (url.includes('github.com')) {
            return await this.checkGitHubService(service, response);
        }
        
        // 檢查雲服務提供商
        if (url.includes('vercel.com') || url.includes('netlify.com')) {
            return await this.checkCloudProvider(service, response);
        }
        
        return { status: 'normal' };
    }

    async checkRedHatService(service, response) {
        // 檢查RedHat服務的特殊邏輯
        const content = response.data.toLowerCase();
        
        if (content.includes('end of life') && content.includes('september')) {
            return {
                status: 'discontinued',
                health: 'discontinued',
                reason: 'Service officially discontinued'
            };
        }
        
        return { status: 'normal' };
    }

    async checkGitHubService(service, response) {
        // 檢查GitHub服務狀態
        try {
            const statusResponse = await axios.get('https://www.githubstatus.com/api/v2/status.json', {
                timeout: 5000
            });
            
            if (statusResponse.data.status.indicator !== 'none') {
                return {
                    status: 'warning',
                    health: 'warning',
                    reason: `GitHub status: ${statusResponse.data.status.description}`
                };
            }
        } catch (error) {
            // GitHub狀態檢查失敗，不影響主要判斷
        }
        
        return { status: 'normal' };
    }

    async checkCloudProvider(service, response) {
        // 檢查雲服務提供商的狀態頁面
        const content = response.data.toLowerCase();
        
        if (content.includes('incident') || content.includes('outage')) {
            return {
                status: 'warning',
                health: 'warning',
                reason: 'Potential service incident detected'
            };
        }
        
        return { status: 'normal' };
    }

    updateFTDDStats(health) {
        switch (health) {
            case 'healthy':
                this.results.ftdd.healthy++;
                break;
            case 'warning':
                this.results.ftdd.warning++;
                break;
            case 'discontinued':
                this.results.ftdd.discontinued++;
                break;
            case 'unhealthy':
            default:
                this.results.ftdd.unhealthy++;
                break;
        }
    }

    getStatusIcon(health) {
        const icons = {
            'healthy': '✅',
            'warning': '⚠️',
            'unhealthy': '❌',
            'discontinued': '🚫'
        };
        return icons[health] || '❓';
    }

    async checkMCPServers() {
        try {
            const data = await this.loadJSON('mcp-servers.json');
            console.log('🔍 Checking MCP servers...');
            
            for (const server of data.servers) {
                try {
                    // Check GitHub repository status
                    const repoUrl = server.repository.replace('github.com', 'api.github.com/repos');
                    const response = await axios.get(repoUrl, { timeout: 5000 });
                    
                    if (response.data) {
                        // 檢查項目活躍度
                        const lastUpdate = new Date(response.data.updated_at);
                        const monthsAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                        
                        if (monthsAgo > this.config.activityThreshold) {
                            server.status.health = 'inactive';
                            server.status.reason = `No updates for ${Math.round(monthsAgo)} months`;
                        } else {
                            server.status.health = 'active';
                            server.status.reason = 'Recently updated';
                        }
                        
                        server.status.stars = response.data.stargazers_count;
                        server.status.forks = response.data.forks_count;
                        server.status.issues = response.data.open_issues_count;
                        server.status.lastCommit = response.data.updated_at?.split('T')[0];
                        
                        this.results.mcp.active++;
                        console.log(`  ✓ ${server.name}: ${server.status.health} (${server.status.stars} stars)`);
                    }
                } catch (error) {
                    server.status.health = 'inactive';
                    server.status.reason = error.message;
                    this.results.mcp.inactive++;
                    console.log(`  ✗ ${server.name}: inactive (${error.message})`);
                }
                
                this.results.mcp.total++;
                await this.delay(1000);
            }
            
            data.metadata.lastUpdated = new Date().toISOString();
            data.metadata.activeServers = this.results.mcp.active;
            
            await this.saveJSON('mcp-servers.json', data);
        } catch (error) {
            console.error('Failed to check MCP servers:', error.message);
        }
    }

    async calculateOverallHealth() {
        const scoring = this.config.scoring;
        const ftddScore = this.results.ftdd.total > 0 ? 
            (this.results.ftdd.healthy * scoring.healthy + 
             this.results.ftdd.warning * scoring.warning + 
             this.results.ftdd.discontinued * scoring.discontinued) / this.results.ftdd.total : 100;
        
        const mcpScore = this.results.mcp.total > 0 ?
            (this.results.mcp.active * scoring.healthy) / this.results.mcp.total : 100;
        
        this.results.overall.score = Math.round((ftddScore + mcpScore) / 2);
        
        const thresholds = this.config.statusThresholds;
        if (this.results.overall.score >= thresholds.healthy) {
            this.results.overall.status = 'healthy';
        } else if (this.results.overall.score >= thresholds.warning) {
            this.results.overall.status = 'warning';
        } else {
            this.results.overall.status = 'unhealthy';
        }
    }

    async saveResults() {
        const resultsPath = path.join(this.dataDir, 'health-report.json');
        await this.saveJSON('health-report.json', this.results);
        
        // Update overall metadata
        const updateLog = {
            timestamp: new Date().toISOString(),
            type: 'health_check',
            status: this.results.overall.status,
            score: this.results.overall.score,
            details: {
                ftdd: this.results.ftdd,
                mcp: this.results.mcp
            }
        };
        
        // Read existing update log and append
        try {
            const existingLog = await this.loadJSON('update-log.json');
            existingLog.updates = existingLog.updates || [];
            existingLog.updates.unshift(updateLog);
            existingLog.updates = existingLog.updates.slice(0, 100); // Keep last 100 updates
            existingLog.lastUpdate = updateLog.timestamp;
            await this.saveJSON('update-log.json', existingLog);
        } catch (error) {
            // Create new log file
            const newLog = {
                lastUpdate: updateLog.timestamp,
                updates: [updateLog]
            };
            await this.saveJSON('update-log.json', newLog);
        }
    }

    printSummary() {
        console.log('\n📊 Enhanced Health Check Summary:');
        console.log(`Overall Status: ${this.results.overall.status.toUpperCase()} (${this.results.overall.score}%)`);
        console.log('\nFTDD Resources:');
        console.log(`  ✅ Healthy: ${this.results.ftdd.healthy}`);
        console.log(`  ⚠️  Warning: ${this.results.ftdd.warning}`);
        console.log(`  ❌ Unhealthy: ${this.results.ftdd.unhealthy}`);
        console.log(`  🚫 Discontinued: ${this.results.ftdd.discontinued}`);
        console.log(`  📊 Total: ${this.results.ftdd.total}`);
        console.log('\nMCP Servers:');
        console.log(`  ✅ Active: ${this.results.mcp.active}`);
        console.log(`  ❌ Inactive: ${this.results.mcp.inactive}`);
        console.log(`  📊 Total: ${this.results.mcp.total}`);
    }

    async loadJSON(filename) {
        const filePath = path.join(this.dataDir, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }

    async saveJSON(filename, data) {
        const filePath = path.join(this.dataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add axios interceptor to measure response time
axios.interceptors.request.use((config) => {
    config.metadata = { startTime: Date.now() };
    return config;
});

axios.interceptors.response.use(
    (response) => {
        response.config.metadata.endTime = Date.now();
        return response;
    },
    (error) => {
        if (error.config) {
            error.config.metadata.endTime = Date.now();
        }
        return Promise.reject(error);
    }
);

// Run health check if script is executed directly
if (require.main === module) {
    const checker = new HealthChecker();
    checker.run().catch(error => {
        console.error('Health check failed:', error);
        process.exit(1);
    });
}

module.exports = HealthChecker; 