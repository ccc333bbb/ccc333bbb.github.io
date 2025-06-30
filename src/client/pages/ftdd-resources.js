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
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('en-US');
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
        const responseTime = service.status.responseTime ? `${service.status.responseTime}ms` : 'Testing...';
        
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
                    <div class="quota-title">Free Tier</div>
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
                    <div class="features-title">Key Features</div>
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
                        Visit Service 🚀
                    </a>
                    <div class="response-time">${responseTime}</div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 No matching resources found</h3>
                <p>Try adjusting your search terms or selecting a different category.</p>
                <p>Or clear the search box to see all resources.</p>
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
            case 'healthy': return 'Operational';
            case 'warning': return 'Partial Outage';
            case 'unhealthy': return 'Major Outage';
            case 'discontinued': return 'Discontinued';
            default: return 'Unknown Status';
        }
    }

    translateQuotaKey(key) {
        const translations = {
            'bandwidth': 'Bandwidth',
            'builds': 'Builds',
            'functions': 'Functions',
            'domains': 'Domains',
            'storage': 'Storage',
            'requests': 'Requests',
            'users': 'Users',
            'reads': 'Reads',
            'writes': 'Writes',
            'branches': 'Branches',
            'models': 'Models',
            'datasets': 'Datasets',
            'inference': 'Inference',
            'spaces': 'Spaces',
            'credit': 'Free Credit',
            'rate_limit': 'Rate Limit',
            'cpu_time': 'CPU Time',
            'workers': 'Workers',
            'kv_operations': 'KV Operations',
            'deployments': 'Deployments',
            'monitors': 'Monitors',
            'interval': 'Check Interval',
            'sms': 'SMS',
            'retention': 'Data Retention',
            'packages': 'Package Support',
            'uptime': 'Uptime',
            'bins': 'Bins',
            'sandboxes': 'Sandboxes',
            'private': 'Private Projects',
            'collaborators': 'Collaborators'
        };
        return translations[key] || key;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Load Failed</h3>
                <p>Could not load resource data. Please check your connection or try again later.</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    Reload
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
        Loading FTDD Resources...
    </div>
`;