#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class HealthChecker {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.results = {
            timestamp: new Date().toISOString(),
            ftdd: { healthy: 0, warning: 0, unhealthy: 0, total: 0 },
            mcp: { active: 0, inactive: 0, total: 0 },
            overall: { status: 'healthy', score: 100 }
        };
    }

    async run() {
        console.log('🔍 Starting health check...');
        
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
            console.log('🔍 Checking FTDD resources...');
            
            let totalChecked = 0;
            
            for (const [categoryId, category] of Object.entries(data.categories)) {
                for (const service of category.services) {
                    totalChecked++;
                    
                    try {
                        const response = await axios.get(service.url, {
                            timeout: 10000,
                            validateStatus: (status) => status < 500
                        });
                        
                        const responseTime = response.config.metadata?.endTime - response.config.metadata?.startTime || 0;
                        
                        if (response.status < 400) {
                            if (responseTime > 5000) {
                                this.results.ftdd.warning++;
                                service.status.health = 'warning';
                            } else {
                                this.results.ftdd.healthy++;
                                service.status.health = 'healthy';
                            }
                        } else {
                            this.results.ftdd.warning++;
                            service.status.health = 'warning';
                        }
                        
                        service.status.lastChecked = new Date().toISOString();
                        service.status.responseTime = responseTime;
                        
                        console.log(`  ✓ ${service.name}: ${service.status.health} (${responseTime}ms)`);
                    } catch (error) {
                        this.results.ftdd.unhealthy++;
                        service.status.health = 'unhealthy';
                        service.status.lastChecked = new Date().toISOString();
                        service.status.responseTime = null;
                        
                        console.log(`  ✗ ${service.name}: unhealthy (${error.message})`);
                    }
                    
                    // Add delay to avoid rate limiting
                    await this.delay(1000);
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
                        server.status.health = 'active';
                        server.status.stars = response.data.stargazers_count;
                        server.status.forks = response.data.forks_count;
                        server.status.issues = response.data.open_issues_count;
                        server.status.lastCommit = response.data.updated_at?.split('T')[0];
                        
                        this.results.mcp.active++;
                        console.log(`  ✓ ${server.name}: active (${server.status.stars} stars)`);
                    }
                } catch (error) {
                    server.status.health = 'inactive';
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
        const ftddScore = this.results.ftdd.total > 0 ? 
            (this.results.ftdd.healthy * 100 + this.results.ftdd.warning * 70) / this.results.ftdd.total : 100;
        
        const mcpScore = this.results.mcp.total > 0 ?
            (this.results.mcp.active * 100) / this.results.mcp.total : 100;
        
        this.results.overall.score = Math.round((ftddScore + mcpScore) / 2);
        
        if (this.results.overall.score >= 90) {
            this.results.overall.status = 'healthy';
        } else if (this.results.overall.score >= 70) {
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
        console.log('\n📊 Health Check Summary:');
        console.log(`Overall Status: ${this.results.overall.status.toUpperCase()} (${this.results.overall.score}%)`);
        console.log('\nFTDD Resources:');
        console.log(`  ✅ Healthy: ${this.results.ftdd.healthy}`);
        console.log(`  ⚠️  Warning: ${this.results.ftdd.warning}`);
        console.log(`  ❌ Unhealthy: ${this.results.ftdd.unhealthy}`);
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