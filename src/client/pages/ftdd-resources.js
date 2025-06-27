// FTDD Resources Page JavaScript
class FTDDResourcesApp {
    constructor() {
        this.resources = null;
        this.filteredResources = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            await this.loadResources();
            this.setupEventListeners();
            this.updateStats();
            this.renderResources();
        } catch (error) {
            console.error('Failed to initialize FTDD Resources:', error);
            this.showError();
        }
    }

    async loadResources() {
        try {
            const response = await fetch('../data/ftdd-resources.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.resources = await response.json();
            this.filteredResources = this.resources;
        } catch (error) {
            console.error('Error loading resources:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('resourceSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterResources();
        });

        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.category;
                this.updateActiveFilter(e.target);
                this.filterResources();
            });
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterResources() {
        if (!this.resources) return;

        let filtered = { ...this.resources };
        
        if (this.currentFilter !== 'all') {
            const categoryData = this.resources.categories[this.currentFilter];
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
                const filteredServices = categoryData.services.filter(service => 
                    service.name.toLowerCase().includes(this.searchTerm) ||
                    service.description.toLowerCase().includes(this.searchTerm) ||
                    service.tags.some(tag => tag.toLowerCase().includes(this.searchTerm))
                );
                
                if (filteredServices.length > 0) {
                    searchFiltered[categoryId] = {
                        ...categoryData,
                        services: filteredServices
                    };
                }
            }
            filtered.categories = searchFiltered;
        }

        this.filteredResources = filtered;
        this.renderResources();
    }

    updateStats() {
        if (!this.resources) return;

        const metadata = this.resources.metadata;
        
        document.getElementById('totalServices').textContent = metadata.totalServices;
        document.getElementById('healthyServices').textContent = metadata.healthyServices;
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('zh-TW');
    }

    renderResources() {
        const container = document.getElementById('resourcesGrid');
        
        if (!this.filteredResources || Object.keys(this.filteredResources.categories).length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        let html = '';
        
        for (const [categoryId, categoryData] of Object.entries(this.filteredResources.categories)) {
            // Add category header
            html += this.renderCategoryHeader(categoryData);
            
            // Add services
            categoryData.services.forEach(service => {
                html += this.renderResourceCard(service);
            });
        }

        container.innerHTML = html;
    }

    renderCategoryHeader(categoryData) {
        return `
            <div class="category-header">
                <h2>
                    ${categoryData.name}
                    <span class="category-count">${categoryData.services.length}</span>
                </h2>
                <p>${categoryData.description}</p>
            </div>
        `;
    }

    renderResourceCard(service) {
        const statusClass = this.getStatusClass(service.status.health);
        const responseTime = service.status.responseTime ? `${service.status.responseTime}ms` : '測試中';
        
        return `
            <div class="resource-card">
                <div class="resource-header-info">
                    <div>
                        <div class="resource-name">${service.name}</div>
                        <div class="resource-status">
                            <div class="status-indicator ${statusClass}"></div>
                            <span>${this.getStatusText(service.status.health)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="resource-description">
                    ${service.description}
                </div>
                
                <div class="resource-quota">
                    <div class="quota-title">免費額度</div>
                    <div class="quota-list">
                        ${Object.entries(service.freeQuota).map(([key, value]) => `
                            <div class="quota-item">
                                <span>${this.translateQuotaKey(key)}</span>
                                <span class="quota-value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="resource-features">
                    <div class="features-title">主要功能</div>
                    <div class="features-list">
                        ${service.features.map(feature => `
                            <span class="feature-tag">${feature}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="resource-tags">
                    ${service.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
                
                <div class="resource-actions">
                    <a href="${service.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                        訪問服務 🚀
                    </a>
                    <div class="response-time">${responseTime}</div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 未找到匹配的資源</h3>
                <p>請嘗試調整搜索條件或選擇不同的分類</p>
                <p>或者清空搜索框查看所有資源</p>
            </div>
        `;
    }

    getStatusClass(health) {
        switch (health) {
            case 'healthy': return '';
            case 'warning': return 'warning';
            case 'unhealthy': return 'unhealthy';
            case 'discontinued': return 'discontinued';
            default: return '';
        }
    }

    getStatusText(health) {
        switch (health) {
            case 'healthy': return '正常運行';
            case 'warning': return '部分問題';
            case 'unhealthy': return '服務異常';
            case 'discontinued': return '已停服';
            default: return '狀態未知';
        }
    }

    translateQuotaKey(key) {
        const translations = {
            'bandwidth': '頻寬',
            'builds': '構建',
            'functions': '函數',
            'domains': '域名',
            'storage': '存儲空間',
            'requests': '請求次數',
            'users': '用戶數',
            'reads': '讀取次數',
            'writes': '寫入次數',
            'branches': '分支數',
            'models': '模型',
            'datasets': '數據集',
            'inference': '推理次數',
            'spaces': 'Spaces',
            'credit': '免費額度',
            'rate_limit': '請求限制',
            'cpu_time': 'CPU 時間',
            'workers': 'Worker 數',
            'kv_operations': 'KV 操作',
            'deployments': '部署次數',
            'monitors': '監控數',
            'interval': '檢查間隔',
            'sms': 'SMS 次數',
            'retention': '數據保留',
            'packages': '包支持',
            'uptime': '可用性',
            'bins': 'Bin 數',
            'sandboxes': '沙盒數',
            'private': '私人項目',
            'collaborators': '協作者'
        };
        return translations[key] || key;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ 載入失敗</h3>
                <p>無法載入資源數據，請檢查網路連接或稍後再試</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    重新載入
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FTDDResourcesApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        載入 FTDD 資源中...
    </div>
`; 