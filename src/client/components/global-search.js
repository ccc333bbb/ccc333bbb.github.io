// TARDIS Global Search Component with Auto-Update
import lyraSearch from './lyra-search.js';

class GlobalSearch {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.searchOverlay = null;
        this.isOpen = false;
        this.currentQuery = '';
        this.searchTimeout = null;
        this.lastKnownUpdate = null;
        this.updateChecker = null;
        this.isUpdating = false;
        
        this.init();
    }

    init() {
        this.createSearchUI();
        this.bindEvents();
        this.initializeLyra();
        this.startUpdateChecker();
    }

    createSearchUI() {
        // 創建搜索按鈕
        const searchButton = document.createElement('button');
        searchButton.id = 'globalSearchBtn';
        searchButton.className = 'global-search-btn';
        searchButton.innerHTML = '🔍';
        searchButton.title = 'Global Search (Ctrl+K)';
        
        // 插入到頁面頭部
        const header = document.querySelector('header') || document.body;
        header.appendChild(searchButton);

        // 創建搜索覆蓋層
        this.searchOverlay = document.createElement('div');
        this.searchOverlay.id = 'globalSearchOverlay';
        this.searchOverlay.className = 'global-search-overlay hidden';
        this.searchOverlay.innerHTML = `
            <div class="global-search-container">
                <div class="global-search-header">
                    <div class="search-input-wrapper">
                        <input type="text" id="globalSearchInput" placeholder="Search portals, news, AI tools, thinking models, MCP servers..." autocomplete="off">
                        <button class="search-close-btn" id="closeSearchBtn">✕</button>
                    </div>
                    <div class="search-status" id="searchStatus">
                        <span class="status-indicator" id="statusIndicator">🟢</span>
                        <span class="status-text" id="statusText">Ready</span>
                    </div>
                </div>
                <div class="global-search-results" id="globalSearchResults">
                    <div class="search-placeholder">
                        <div class="search-icon">🔍</div>
                        <p>Start typing to search across all content...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.searchOverlay);
        
        this.searchInput = document.getElementById('globalSearchInput');
        this.searchResults = document.getElementById('globalSearchResults');
    }

    bindEvents() {
        // 搜索按鈕點擊
        document.getElementById('globalSearchBtn').addEventListener('click', () => {
            this.openSearch();
        });

        // 關閉按鈕
        document.getElementById('closeSearchBtn').addEventListener('click', () => {
            this.closeSearch();
        });

        // 搜索輸入
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // 鍵盤事件
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });

        // 點擊覆蓋層關閉
        this.searchOverlay.addEventListener('click', (e) => {
            if (e.target === this.searchOverlay) {
                this.closeSearch();
            }
        });

        // 全局快捷鍵
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    async initializeLyra() {
        try {
            await lyraSearch.initialize();
            
            // 索引所有數據
            await this.indexAllData();
            
            console.log('✅ Global search initialized');
            this.updateStatus('Ready', 'success');
        } catch (error) {
            console.error('❌ Failed to initialize global search:', error);
            this.updateStatus('Error initializing', 'error');
        }
    }

    async indexAllData() {
        try {
            this.updateStatus('Indexing data...', 'loading');
            
            // 索引門戶數據
            if (typeof portalsData !== 'undefined') {
                await lyraSearch.indexPortals(portalsData);
            }

            // 索引新聞數據
            const newsResponse = await fetch('/data/ranked-news-index.json');
            if (newsResponse.ok) {
                const newsData = await newsResponse.json();
                if (newsData.topArticles) {
                    await lyraSearch.indexNews(newsData.topArticles);
                }
            }

            // 索引 AI 工具數據
            const aiToolsResponse = await fetch('/data/ai-tools.json');
            if (aiToolsResponse.ok) {
                const aiToolsData = await aiToolsResponse.json();
                await lyraSearch.indexAiTools(aiToolsData);
            }

            // 索引思維模型數據
            const modelsResponse = await fetch('/data/thinking-models.json');
            if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                await lyraSearch.indexThinkingModels(modelsData);
            }

            // 索引 MCP 服務器數據
            const mcpResponse = await fetch('/data/mcp-servers.json');
            if (mcpResponse.ok) {
                const mcpData = await mcpResponse.json();
                await lyraSearch.indexMcpServers(mcpData);
            }

            this.updateStatus('Ready', 'success');
        } catch (error) {
            console.error('❌ Error indexing data:', error);
            this.updateStatus('Indexing failed', 'error');
        }
    }

    // 更新狀態指示器
    updateStatus(text, type = 'info') {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (statusIndicator && statusText) {
            const indicators = {
                'success': '🟢',
                'error': '🔴',
                'loading': '🟡',
                'warning': '🟠',
                'info': '🔵'
            };
            
            statusIndicator.textContent = indicators[type] || '🔵';
            statusText.textContent = text;
        }
    }

    // 檢查更新
    async checkForUpdates() {
        if (this.isUpdating) return;
        
        try {
            const response = await fetch('/data/search-update-signal.json');
            if (!response.ok) return;
            
            const signal = await response.json();
            
            if (this.lastKnownUpdate !== signal.timestamp) {
                console.log('🔄 Search data updated, refreshing indexes...');
                this.lastKnownUpdate = signal.timestamp;
                await this.refreshSearchIndexes();
            }
        } catch (error) {
            // 靜默處理錯誤，避免影響搜索功能
            console.debug('Update check failed:', error.message);
        }
    }

    // 刷新搜索索引
    async refreshSearchIndexes() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        this.updateStatus('Updating indexes...', 'loading');
        
        try {
            // 重新索引所有數據
            await this.indexAllData();
            
            console.log('✅ Search indexes refreshed');
            this.updateStatus('Updated', 'success');
            
            // 如果搜索覆蓋層是打開的，顯示更新通知
            if (this.isOpen) {
                this.showUpdateNotification();
            }
        } catch (error) {
            console.error('❌ Failed to refresh search indexes:', error);
            this.updateStatus('Update failed', 'error');
        } finally {
            this.isUpdating = false;
        }
    }

    // 顯示更新通知
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'search-update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>🔄 Search indexes updated</span>
                <button class="notification-close">✕</button>
            </div>
        `;
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        this.searchOverlay.appendChild(notification);
        
        // 3秒後自動移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // 開始更新檢查器
    startUpdateChecker() {
        // 每5分鐘檢查一次更新
        this.updateChecker = setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);
        
        // 頁面可見性變化時也檢查
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    // 停止更新檢查器
    stopUpdateChecker() {
        if (this.updateChecker) {
            clearInterval(this.updateChecker);
            this.updateChecker = null;
        }
    }

    openSearch() {
        this.isOpen = true;
        this.searchOverlay.classList.remove('hidden');
        this.searchInput.focus();
        
        // 添加動畫
        setTimeout(() => {
            this.searchOverlay.classList.add('active');
        }, 10);
    }

    closeSearch() {
        this.isOpen = false;
        this.searchOverlay.classList.remove('active');
        
        setTimeout(() => {
            this.searchOverlay.classList.add('hidden');
            this.searchInput.value = '';
            this.currentQuery = '';
            this.clearResults();
        }, 200);
    }

    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // 清除之前的超時
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (!this.currentQuery) {
            this.showPlaceholder();
            return;
        }
        
        // 防抖搜索
        this.searchTimeout = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, 300);
    }

    async performSearch(query) {
        try {
            this.showLoading();
            
            const results = await lyraSearch.globalSearch(query);
            
            this.displayResults(results, query);
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showError();
        }
    }

    displayResults(results, query) {
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
        
        if (totalResults === 0) {
            this.showNoResults(query);
            return;
        }

        let html = `
            <div class="search-results-header">
                <h3>Found ${totalResults} results for "${query}"</h3>
            </div>
        `;

        // 門戶結果
        if (results.portals && results.portals.length > 0) {
            html += this.renderSection('Portals', results.portals, 'portal');
        }

        // 新聞結果
        if (results.news && results.news.length > 0) {
            html += this.renderSection('News', results.news.slice(0, 5), 'news');
        }

        // AI 工具結果
        if (results.aiTools && results.aiTools.length > 0) {
            html += this.renderSection('AI Tools', results.aiTools, 'ai-tool');
        }

        // 思維模型結果
        if (results.thinkingModels && results.thinkingModels.length > 0) {
            html += this.renderSection('Thinking Models', results.thinkingModels, 'model');
        }

        // MCP 服務器結果
        if (results.mcpServers && results.mcpServers.length > 0) {
            html += this.renderSection('MCP Servers', results.mcpServers, 'mcp-server');
        }

        this.searchResults.innerHTML = html;
        this.bindResultEvents();
    }

    renderSection(title, items, type) {
        return `
            <div class="search-section">
                <h4 class="section-title">${title} (${items.length})</h4>
                <div class="section-items">
                    ${items.map(item => this.renderItem(item, type)).join('')}
                </div>
            </div>
        `;
    }

    renderItem(item, type) {
        const score = item.searchScore ? `<span class="search-score">${item.searchScore.toFixed(2)}</span>` : '';
        
        switch (type) {
            case 'portal':
                return `
                    <div class="search-item portal-item" data-url="${item.url}">
                        <div class="item-icon">${item.icon || '🌐'}</div>
                        <div class="item-content">
                            <div class="item-title">${item.title} ${score}</div>
                            <div class="item-description">${item.description}</div>
                            <div class="item-meta">
                                <span class="item-category">${item.category}</span>
                                <span class="item-tags">${item.tags.join(', ')}</span>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'news':
                return `
                    <div class="search-item news-item" data-url="${item.url}">
                        <div class="item-icon">📰</div>
                        <div class="item-content">
                            <div class="item-title">${item.title} ${score}</div>
                            <div class="item-description">${item.description || ''}</div>
                            <div class="item-meta">
                                <span class="item-source">${item.source}</span>
                                <span class="item-date">${this.formatDate(item.pubDate)}</span>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'ai-tool':
                return `
                    <div class="search-item ai-tool-item" data-url="${item.url}">
                        <div class="item-icon">🤖</div>
                        <div class="item-content">
                            <div class="item-title">${item.name} ${score}</div>
                            <div class="item-description">${item.description}</div>
                            <div class="item-meta">
                                <span class="item-category">${item.category}</span>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'model':
                return `
                    <div class="search-item model-item" data-url="${item.url}">
                        <div class="item-icon">🧠</div>
                        <div class="item-content">
                            <div class="item-title">${item.name} ${score}</div>
                            <div class="item-description">${item.description}</div>
                            <div class="item-meta">
                                <span class="item-category">${item.category}</span>
                                <span class="item-complexity">${item.complexity}</span>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'mcp-server':
                return `
                    <div class="search-item mcp-server-item" data-url="${item.url}">
                        <div class="item-icon">🔌</div>
                        <div class="item-content">
                            <div class="item-title">${item.name} ${score}</div>
                            <div class="item-description">${item.description}</div>
                            <div class="item-meta">
                                <span class="item-category">${item.category}</span>
                            </div>
                        </div>
                    </div>
                `;
            
            default:
                return '';
        }
    }

    bindResultEvents() {
        const searchItems = this.searchResults.querySelectorAll('.search-item');
        
        searchItems.forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                if (url && url !== '#') {
                    if (url.startsWith('http')) {
                        window.open(url, '_blank');
                    } else {
                        window.location.href = url;
                    }
                    this.closeSearch();
                }
            });
        });
    }

    showPlaceholder() {
        this.searchResults.innerHTML = `
            <div class="search-placeholder">
                <div class="search-icon">🔍</div>
                <p>Start typing to search across all content...</p>
            </div>
        `;
    }

    showLoading() {
        this.searchResults.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p>Searching...</p>
            </div>
        `;
    }

    showNoResults(query) {
        this.searchResults.innerHTML = `
            <div class="search-no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No results found for "${query}"</h3>
                <p>Try different keywords or check your spelling</p>
            </div>
        `;
    }

    showError() {
        this.searchResults.innerHTML = `
            <div class="search-error">
                <div class="error-icon">⚠️</div>
                <h3>Search error</h3>
                <p>Something went wrong. Please try again.</p>
            </div>
        `;
    }

    clearResults() {
        this.searchResults.innerHTML = '';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString();
    }

    // 清理資源
    destroy() {
        this.stopUpdateChecker();
    }
}

// 創建全局實例
const globalSearch = new GlobalSearch();

// 頁面卸載時清理資源
window.addEventListener('beforeunload', () => {
    globalSearch.destroy();
});

export default globalSearch; 