// MCP Servers Page JavaScript
class MCPServersApp {
    constructor() {
        this.servers = null;
        this.filteredServers = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            await this.loadServers();
            this.setupEventListeners();
            this.updateStats();
            this.renderServers();
        } catch (error) {
            console.error('Failed to initialize MCP Servers:', error);
            this.showError();
        }
    }

    async loadServers() {
        try {
            const response = await fetch('../data/mcp-servers.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.servers = await response.json();
            this.filteredServers = this.servers;
        } catch (error) {
            console.error('Error loading servers:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('resourceSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterServers();
        });

        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.category;
                this.updateActiveFilter(e.target);
                this.filterServers();
            });
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterServers() {
        if (!this.servers) return;

        let filtered = this.servers.servers;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(server => server.category === this.currentFilter);
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(server => 
                server.name.toLowerCase().includes(this.searchTerm) ||
                server.description.toLowerCase().includes(this.searchTerm) ||
                server.author.toLowerCase().includes(this.searchTerm) ||
                server.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)) ||
                server.capabilities.some(cap => cap.toLowerCase().includes(this.searchTerm))
            );
        }

        this.filteredServers = { ...this.servers, servers: filtered };
        this.renderServers();
    }

    updateStats() {
        if (!this.servers) return;

        const metadata = this.servers.metadata;
        
        document.getElementById('totalServers').textContent = metadata.totalServers;
        document.getElementById('activeServers').textContent = metadata.activeServers;
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('zh-TW');
    }

    renderServers() {
        const container = document.getElementById('resourcesGrid');
        
        if (!this.filteredServers || this.filteredServers.servers.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        // Group servers by category
        const grouped = this.groupServersByCategory(this.filteredServers.servers);
        let html = '';
        
        for (const [categoryId, servers] of Object.entries(grouped)) {
            if (servers.length > 0) {
                const categoryInfo = this.servers.categories[categoryId];
                html += this.renderCategoryHeader(categoryInfo, servers.length);
                
                servers.forEach(server => {
                    html += this.renderServerCard(server);
                });
            }
        }

        container.innerHTML = html;
    }

    groupServersByCategory(servers) {
        const grouped = {};
        servers.forEach(server => {
            if (!grouped[server.category]) {
                grouped[server.category] = [];
            }
            grouped[server.category].push(server);
        });
        return grouped;
    }

    renderCategoryHeader(categoryInfo, count) {
        if (!categoryInfo) return '';
        
        return `
            <div class="category-header">
                <h2>
                    ${categoryInfo.name}
                    <span class="category-count">${count}</span>
                </h2>
                <p>${categoryInfo.description}</p>
            </div>
        `;
    }

    renderServerCard(server) {
        const statusClass = this.getStatusClass(server.status.health);
        const compatibilityIcons = this.renderCompatibility(server.status.compatibility);
        
        return `
            <div class="resource-card mcp-server-card">
                <div class="resource-header-info">
                    <div>
                        <div class="resource-name">${server.name}</div>
                        <div class="server-author">by ${server.author}</div>
                        <div class="resource-status">
                            <div class="status-indicator ${statusClass}"></div>
                            <span>${this.getStatusText(server.status.health)}</span>
                        </div>
                    </div>
                    <div class="server-stats">
                        <div class="stat">⭐ ${server.status.stars || 0}</div>
                        <div class="stat">🍴 ${server.status.forks || 0}</div>
                        <div class="stat">🐛 ${server.status.issues || 0}</div>
                    </div>
                </div>
                
                <div class="resource-description">
                    ${server.description}
                </div>
                
                <div class="server-capabilities">
                    <div class="capabilities-title">功能能力</div>
                    <div class="capabilities-list">
                        ${server.capabilities.map(cap => `
                            <span class="capability-tag">${this.translateCapability(cap)}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="server-compatibility">
                    <div class="compatibility-title">兼容性</div>
                    <div class="compatibility-list">
                        ${compatibilityIcons}
                    </div>
                </div>
                
                <div class="server-installation">
                    <div class="installation-title">安裝方式</div>
                    <div class="installation-info">
                        <div class="npm-package">📦 ${server.installation.npm}</div>
                        <div class="requirements">
                            ${server.installation.requirements.map(req => `
                                <span class="requirement-tag">${req}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="resource-tags">
                    ${server.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
                
                <div class="resource-actions">
                    <a href="${server.repository}" target="_blank" rel="noopener noreferrer" class="resource-link">
                        查看倉庫 🔗
                    </a>
                    <div class="last-commit">
                        最後提交: ${server.status.lastCommit || '未知'}
                    </div>
                </div>
            </div>
        `;
    }

    renderCompatibility(compatibility) {
        const icons = [];
        for (const [model, status] of Object.entries(compatibility)) {
            const icon = status === '✅' ? '✅' : status === '⚠️' ? '⚠️' : '❌';
            icons.push(`<span class="compatibility-item" title="${model}">${icon} ${model}</span>`);
        }
        return icons.join('');
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 未找到匹配的 MCP 服務器</h3>
                <p>請嘗試調整搜索條件或選擇不同的分類</p>
                <p>或者清空搜索框查看所有服務器</p>
            </div>
        `;
    }

    getStatusClass(health) {
        switch (health) {
            case 'active': return '';
            case 'maintenance': return 'warning';
            case 'inactive': return 'unhealthy';
            default: return '';
        }
    }

    getStatusText(health) {
        switch (health) {
            case 'active': return '活躍維護';
            case 'maintenance': return '維護中';
            case 'inactive': return '不活躍';
            default: return '狀態未知';
        }
    }

    translateCapability(capability) {
        const translations = {
            'read_pages': '讀取頁面',
            'create_pages': '創建頁面',
            'update_pages': '更新頁面',
            'search_content': '搜索內容',
            'manage_blocks': '管理區塊',
            'repository_info': '倉庫信息',
            'file_operations': '文件操作',
            'issue_management': '問題管理',
            'pull_requests': 'PR 管理',
            'search_code': '代碼搜索',
            'read_files': '讀取文件',
            'write_files': '寫入文件',
            'list_directories': '列表目錄',
            'file_search': '文件搜索',
            'file_permissions': '文件權限',
            'list_files': '列表文件',
            'upload_files': '上傳文件',
            'download_files': '下載文件',
            'share_files': '分享文件',
            'search_drive': '搜索雲盤',
            'send_messages': '發送消息',
            'read_channels': '讀取頻道',
            'user_management': '用戶管理',
            'file_sharing': '文件分享',
            'channel_management': '頻道管理',
            'sql_queries': 'SQL 查詢',
            'schema_inspection': '模式檢查',
            'data_export': '數據導出',
            'table_operations': '表操作',
            'connection_pooling': '連接池',
            'fetch_webpage': '抓取網頁',
            'extract_text': '提取文本',
            'parse_html': '解析 HTML',
            'follow_links': '跟蹤鏈接',
            'screenshot_capture': '截圖',
            'send_email': '發送郵件',
            'read_inbox': '讀取收件箱',
            'email_templates': '郵件模板',
            'attachment_handling': '附件處理',
            'filter_management': '過濾管理'
        };
        return translations[capability] || capability;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ 載入失敗</h3>
                <p>無法載入 MCP 服務器數據，請檢查網路連接或稍後再試</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    重新載入
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MCPServersApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        載入 MCP 服務器中...
    </div>
`; 