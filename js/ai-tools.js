// AI Tools Page JavaScript
class AIToolsApp {
    constructor() {
        this.tools = null;
        this.filteredTools = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            await this.loadTools();
            this.setupEventListeners();
            this.updateStats();
            this.renderTools();
        } catch (error) {
            console.error('Failed to initialize AI Tools:', error);
            this.showError();
        }
    }

    async loadTools() {
        try {
            const response = await fetch('../data/ai-tools.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.tools = await response.json();
            this.filteredTools = this.tools;
        } catch (error) {
            console.error('Error loading tools:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('resourceSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterTools();
        });

        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.category;
                this.updateActiveFilter(e.target);
                this.filterTools();
            });
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterTools() {
        if (!this.tools) return;

        let filtered = { ...this.tools };
        
        if (this.currentFilter !== 'all') {
            const categoryData = this.tools.categories[this.currentFilter];
            if (categoryData) {
                filtered.categories = { [this.currentFilter]: categoryData };
            } else {
                filtered.categories = {};
            }
        }

        // Apply search filter
        if (this.searchTerm) {
            const searchFiltered = {};
            for (const [categoryId, categoryData] of Object.entries(filtered.categories)) {
                const filteredTools = categoryData.tools.filter(tool => 
                    tool.name.toLowerCase().includes(this.searchTerm) ||
                    tool.description.toLowerCase().includes(this.searchTerm) ||
                    (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(this.searchTerm))) ||
                    (tool.capabilities && tool.capabilities.some(cap => cap.toLowerCase().includes(this.searchTerm)))
                );
                
                if (filteredTools.length > 0) {
                    searchFiltered[categoryId] = {
                        ...categoryData,
                        tools: filteredTools
                    };
                }
            }
            filtered.categories = searchFiltered;
        }

        this.filteredTools = filtered;
        this.renderTools();
    }

    updateStats() {
        if (!this.tools) return;

        const metadata = this.tools.metadata;
        
        document.getElementById('totalTools').textContent = metadata.totalTools;
        document.getElementById('activeTools').textContent = metadata.activeTools;
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('zh-TW');
    }

    renderTools() {
        const container = document.getElementById('resourcesGrid');
        
        if (!this.filteredTools || Object.keys(this.filteredTools.categories).length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        let html = '';
        
        for (const [categoryId, categoryData] of Object.entries(this.filteredTools.categories)) {
            // Add category header
            html += this.renderCategoryHeader(categoryData);
            
            // Add tools
            categoryData.tools.forEach(tool => {
                html += this.renderToolCard(tool);
            });
        }

        container.innerHTML = html;
    }

    renderCategoryHeader(categoryData) {
        return `
            <div class="category-header">
                <h2>
                    ${categoryData.name}
                    <span class="category-count">${categoryData.tools.length}</span>
                </h2>
                <p>${categoryData.description}</p>
            </div>
        `;
    }

    renderToolCard(tool) {
        const statusClass = this.getStatusClass(tool.status?.health);
        const pricingBadge = this.getPricingBadge(tool.pricing);
        const newFeatures = tool.newFeatures || tool.recent_updates || tool.new_models || [];
        
        return `
            <div class="resource-card ai-tool-card">
                <div class="resource-header-info">
                    <div>
                        <div class="resource-name">${tool.name}</div>
                        ${pricingBadge}
                        ${tool.status ? `
                            <div class="resource-status">
                                <div class="status-indicator ${statusClass}"></div>
                                <span>${this.getStatusText(tool.status.health)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${this.renderToolStats(tool)}
                </div>
                
                <div class="resource-description">
                    ${tool.description}
                </div>
                
                ${this.renderToolFeatures(tool)}
                ${this.renderFreeQuota(tool)}
                ${this.renderNewFeatures(newFeatures)}
                ${this.renderToolTags(tool)}
                
                <div class="resource-actions">
                    <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                        訪問工具 🚀
                    </a>
                    ${tool.lastUpdate ? `
                        <div class="last-update">
                            更新: ${tool.lastUpdate}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderToolStats(tool) {
        const stats = [];
        
        if (tool.githubStars) {
            stats.push(`⭐ ${tool.githubStars}`);
        }
        if (tool.integrations) {
            stats.push(`🔗 ${tool.integrations}`);
        }
        if (tool.models_supported && Array.isArray(tool.models_supported)) {
            stats.push(`🤖 ${tool.models_supported.length} 模型`);
        }
        if (tool.extensions) {
            stats.push(`🧩 ${tool.extensions} 擴展`);
        }
        if (tool.communityNodes) {
            stats.push(`🔗 ${tool.communityNodes} 節點`);
        }

        if (stats.length === 0) return '';

        return `
            <div class="tool-stats">
                ${stats.map(stat => `<div class="stat">${stat}</div>`).join('')}
            </div>
        `;
    }

    renderToolFeatures(tool) {
        let features = tool.features || tool.capabilities || [];
        if (!Array.isArray(features)) return '';
        
        return `
            <div class="tool-features">
                <div class="features-title">主要功能</div>
                <div class="features-list">
                    ${features.map(feature => `
                        <span class="feature-tag">${this.translateFeature(feature)}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderFreeQuota(tool) {
        if (!tool.freeQuota && !tool.free_credits) return '';

        const quota = tool.freeQuota || {};
        if (tool.free_credits) quota.credits = tool.free_credits;
        if (tool.rate_limits) quota.rate_limits = tool.rate_limits;

        if (Object.keys(quota).length === 0) return '';

        return `
            <div class="tool-quota">
                <div class="quota-title">免費額度</div>
                <div class="quota-list">
                    ${Object.entries(quota).map(([key, value]) => `
                        <div class="quota-item">
                            <span>${this.translateQuotaKey(key)}</span>
                            <span class="quota-value">${value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderNewFeatures(features) {
        if (!features || features.length === 0) return '';

        return `
            <div class="new-features">
                <div class="new-features-title">🆕 最新功能</div>
                <div class="new-features-list">
                    ${features.slice(0, 3).map(feature => `
                        <div class="new-feature-item">${feature}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderToolTags(tool) {
        const tags = tool.tags || [];
        if (tags.length === 0) return '';

        return `
            <div class="resource-tags">
                ${tags.map(tag => `
                    <span class="tag">${tag}</span>
                `).join('')}
            </div>
        `;
    }

    getPricingBadge(pricing) {
        const badges = {
            'free': '<span class="pricing-badge free">免費</span>',
            'freemium': '<span class="pricing-badge freemium">免費版</span>',
            'free_tier_available': '<span class="pricing-badge freemium">含免費額度</span>',
            'pay_per_use': '<span class="pricing-badge paid">按使用付費</span>',
            'free_open_source': '<span class="pricing-badge free">開源免費</span>',
            'open_source': '<span class="pricing-badge free">開源</span>'
        };
        return badges[pricing] || '';
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 未找到匹配的 AI 工具</h3>
                <p>請嘗試調整搜索條件或選擇不同的分類</p>
                <p>或者清空搜索框查看所有工具</p>
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
            case 'active': return '活躍';
            case 'maintenance': return '維護中';
            case 'inactive': return '不活躍';
            default: return '狀態正常';
        }
    }

    translateFeature(feature) {
        const translations = {
            'workflow': '工作流',
            'agent': '智能體',
            'chatbot': '聊天機器人',
            'knowledge_base': '知識庫',
            'prompt_engineering': '提示工程',
            'model_tuning': '模型調優',
            'api_testing': 'API 測試',
            'node_workflow': '節點工作流',
            'custom_nodes': '自定義節點',
            'api': 'API',
            'model_management': '模型管理',
            'webui': 'Web 界面',
            'extensions': '擴展',
            'model_training': '模型訓練',
            'img2img': '圖像轉圖像',
            'gui': '圖形界面',
            'model_discovery': '模型發現',
            'chat_interface': '對話界面',
            'api_server': 'API 服務器',
            'debugging': '調試',
            'testing': '測試',
            'monitoring': '監控',
            'dataset_management': '數據集管理'
        };
        return translations[feature] || feature;
    }

    translateQuotaKey(key) {
        const translations = {
            'requests': '請求次數',
            'tokens': 'Token 數',
            'models': '模型',
            'credits': '免費額度',
            'rate_limits': '速率限制',
            'workflows': '工作流',
            'executions': '執行次數',
            'users': '用戶數',
            'traces': '追蹤數',
            'datasets': '數據集'
        };
        return translations[key] || key;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ 載入失敗</h3>
                <p>無法載入 AI 工具數據，請檢查網路連接或稍後再試</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    重新載入
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIToolsApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        載入 AI 工具中...
    </div>
`; 