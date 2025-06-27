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
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('en-US');
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
                        Visit Tool 🚀
                    </a>
                    ${tool.lastUpdate ? `
                        <div class="last-update">
                            Updated: ${tool.lastUpdate}
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
            stats.push(`🤖 ${tool.models_supported.length} Models`);
        }
        if (tool.extensions) {
            stats.push(`🧩 ${tool.extensions} Extensions`);
        }
        if (tool.communityNodes) {
            stats.push(`🔗 ${tool.communityNodes} Nodes`);
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
                <div class="features-title">Key Features</div>
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
                <div class="quota-title">Free Quota</div>
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
                <div class="new-features-title">🆕 Latest Features</div>
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
            'free': '<span class="pricing-badge free">Free</span>',
            'freemium': '<span class="pricing-badge freemium">Freemium</span>',
            'free_tier_available': '<span class="pricing-badge freemium">Free Tier</span>',
            'pay_per_use': '<span class="pricing-badge paid">Pay per Use</span>',
            'free_open_source': '<span class="pricing-badge free">Open Source</span>',
            'open_source': '<span class="pricing-badge free">Open Source</span>'
        };
        return badges[pricing] || '';
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 No matching AI tools found</h3>
                <p>Try adjusting your search terms or selecting a different category</p>
                <p>Or clear the search box to view all tools</p>
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
            case 'active': return 'Active';
            case 'maintenance': return 'Maintenance';
            case 'inactive': return 'Inactive';
            default: return 'Normal';
        }
    }

    translateFeature(feature) {
        // Features now display in English directly
        const featureMap = {
            'workflow': 'Workflow',
            'agent': 'Agent',
            'chatbot': 'Chatbot',
            'knowledge_base': 'Knowledge Base',
            'prompt_engineering': 'Prompt Engineering',
            'model_tuning': 'Model Tuning',
            'api_testing': 'API Testing',
            'node_workflow': 'Node Workflow',
            'custom_nodes': 'Custom Nodes',
            'api': 'API',
            'model_management': 'Model Management',
            'webui': 'Web UI',
            'extensions': 'Extensions',
            'model_training': 'Model Training',
            'img2img': 'Image to Image',
            'gui': 'GUI',
            'model_discovery': 'Model Discovery',
            'chat_interface': 'Chat Interface',
            'api_server': 'API Server',
            'debugging': 'Debugging',
            'testing': 'Testing',
            'monitoring': 'Monitoring',
            'dataset_management': 'Dataset Management'
        };
        return featureMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
    }

    translateQuotaKey(key) {
        // Quotas now display in English directly
        const keyMap = {
            'requests': 'Requests',
            'tokens': 'Tokens',
            'models': 'Models',
            'credits': 'Credits',
            'rate_limits': 'Rate Limits',
            'workflows': 'Workflows',
            'executions': 'Executions',
            'users': 'Users',
            'traces': 'Traces',
            'datasets': 'Datasets'
        };
        return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Loading Failed</h3>
                <p>Unable to load AI tools data. Please check your network connection or try again later</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    Reload
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
        Loading AI tools...
    </div>
`; 