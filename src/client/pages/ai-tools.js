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
                    (tool.capabilities && tool.capabilities.some(cap => cap.toLowerCase().includes(this.searchTerm))) ||
                    (tool.models && tool.models.some(model => model.toLowerCase().includes(this.searchTerm)))
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
        
        // Count free APIs
        const freeApiCount = this.tools.categories.inference_apis ? 
            this.tools.categories.inference_apis.tools.filter(tool => 
                tool.pricing === 'free' || 
                tool.pricing === 'freemium' || 
                tool.pricing === 'trial' ||
                tool.pricing === 'free_provider' ||
                tool.pricing === 'free_tier_available'
            ).length : 0;
        
        document.getElementById('totalTools').textContent = metadata.totalTools;
        document.getElementById('activeTools').textContent = metadata.activeTools;
        document.getElementById('freeApis').textContent = freeApiCount;
        
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
                
                ${this.renderModels(tool)}
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
            stats.push(`⭐ ${this.formatNumber(tool.githubStars)}`);
        }
        if (tool.integrations) {
            stats.push(`🔗 ${tool.integrations}`);
        }
        if (tool.models_supported && Array.isArray(tool.models_supported)) {
            stats.push(`🤖 ${tool.models_supported.length} Models`);
        }
        if (tool.models && Array.isArray(tool.models)) {
            stats.push(`🤖 ${tool.models.length} Models`);
        }
        if (tool.extensions) {
            stats.push(`🧩 ${tool.extensions} Extensions`);
        }
        if (tool.communityNodes) {
            stats.push(`🔗 ${tool.communityNodes} Nodes`);
        }
        if (tool.status?.responseTime) {
            stats.push(`⚡ ${tool.status.responseTime}ms`);
        }

        if (stats.length === 0) return '';

        return `
            <div class="tool-stats">
                ${stats.map(stat => `<div class="stat">${stat}</div>`).join('')}
            </div>
        `;
    }

    renderModels(tool) {
        if (!tool.models || !Array.isArray(tool.models)) return '';
        
        const displayModels = tool.models.slice(0, 6); // Show first 6 models
        const hasMore = tool.models.length > 6;
        
        return `
            <div class="tool-models">
                <div class="models-title">Supported Models</div>
                <div class="models-list">
                    ${displayModels.map(model => `
                        <span class="model-tag">${model}</span>
                    `).join('')}
                    ${hasMore ? `<span class="model-tag more">+${tool.models.length - 6} more</span>` : ''}
                </div>
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
                <div class="quota-title">🆓 Free Quota</div>
                <div class="quota-list">
                    ${Object.entries(quota).map(([key, value]) => `
                        <div class="quota-item">
                            <span class="quota-key">${this.translateQuotaKey(key)}:</span>
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
            <div class="tool-updates">
                <div class="updates-title">🆕 Recent Updates</div>
                <ul class="updates-list">
                    ${features.slice(0, 3).map(feature => `
                        <li>${feature}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderToolTags(tool) {
        if (!tool.tags || tool.tags.length === 0) return '';

        return `
            <div class="tool-tags">
                ${tool.tags.map(tag => `
                    <span class="tag">${tag}</span>
                `).join('')}
            </div>
        `;
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    getPricingBadge(pricing) {
        const badges = {
            'free': '<span class="pricing-badge free">Free</span>',
            'freemium': '<span class="pricing-badge freemium">Freemium</span>',
            'free_tier_available': '<span class="pricing-badge free">Free Tier</span>',
            'free_provider': '<span class="pricing-badge free">Free</span>',
            'free_preview': '<span class="pricing-badge free">Free Preview</span>',
            'trial': '<span class="pricing-badge trial">Free Trial</span>',
            'trial_provider': '<span class="pricing-badge trial">Free Trial</span>',
            'pay_per_use': '<span class="pricing-badge paid">Pay per Use</span>',
            'open_source': '<span class="pricing-badge open-source">Open Source</span>',
            'free_open_source': '<span class="pricing-badge open-source">Open Source</span>'
        };
        return badges[pricing] || '';
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No tools found</h3>
                <p>Try adjusting your search or filter criteria</p>
            </div>
        `;
    }

    getStatusClass(health) {
        const statusMap = {
            'active': 'healthy',
            'healthy': 'healthy',
            'warning': 'warning',
            'inactive': 'unhealthy',
            'unhealthy': 'unhealthy'
        };
        return statusMap[health] || 'unknown';
    }

    getStatusText(health) {
        const statusMap = {
            'active': 'Active',
            'healthy': 'Healthy',
            'warning': 'Warning',
            'inactive': 'Inactive',
            'unhealthy': 'Unhealthy'
        };
        return statusMap[health] || 'Unknown';
    }

    translateFeature(feature) {
        const translations = {
            'text': 'Text Generation',
            'vision': 'Vision/Image',
            'code': 'Code Generation',
            'reasoning': 'Advanced Reasoning',
            'multimodal': 'Multimodal',
            'long_context': 'Long Context',
            'function_calling': 'Function Calling',
            'json_mode': 'JSON Mode',
            'prompt_engineering': 'Prompt Engineering',
            'model_tuning': 'Model Tuning',
            'api_testing': 'API Testing',
            'workflow': 'Workflow',
            'agent': 'AI Agent',
            'chatbot': 'Chatbot',
            'knowledge_base': 'Knowledge Base',
            'debugging': 'Debugging',
            'testing': 'Testing',
            'monitoring': 'Monitoring',
            'dataset_management': 'Dataset Management',
            'node_workflow': 'Node Workflow',
            'custom_nodes': 'Custom Nodes',
            'api': 'API',
            'model_management': 'Model Management',
            'webui': 'Web UI',
            'extensions': 'Extensions',
            'model_training': 'Model Training',
            'img2img': 'Image to Image',
            'gui': 'GUI Interface',
            'model_discovery': 'Model Discovery',
            'chat_interface': 'Chat Interface',
            'api_server': 'API Server',
            'model_routing': 'Model Routing',
            'unified_api': 'Unified API',
            'cost_optimization': 'Cost Optimization',
            'optimized_inference': 'Optimized Inference',
            'enterprise_ready': 'Enterprise Ready',
            'multiple_models': 'Multiple Models',
            'open_source_models': 'Open Source Models',
            'community_driven': 'Community Driven',
            'easy_integration': 'Easy Integration',
            'ultra_fast': 'Ultra Fast',
            'high_throughput': 'High Throughput',
            'optimized_hardware': 'Optimized Hardware',
            'low_latency': 'Low Latency',
            'high_performance': 'High Performance',
            'large_models': 'Large Models',
            'research_friendly': 'Research Friendly',
            'rag_optimized': 'RAG Optimized',
            'embeddings': 'Embeddings',
            'github_integration': 'GitHub Integration',
            'multiple_providers': 'Multiple Providers',
            'developer_friendly': 'Developer Friendly',
            'serverless': 'Serverless',
            'edge_computing': 'Edge Computing',
            'global_deployment': 'Global Deployment',
            'latest_models': 'Latest Models',
            'competitive_pricing': 'Competitive Pricing',
            'fast_inference': 'Fast Inference',
            'open_models': 'Open Models',
            'provider_routing': 'Provider Routing',
            'european_provider': 'European Provider',
            'gdpr_compliant': 'GDPR Compliant',
            'generous_quota': 'Generous Quota'
        };
        return translations[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    translateQuotaKey(key) {
        const translations = {
            'requests': 'Requests',
            'tokens': 'Tokens', 
            'models': 'Models',
            'workflows': 'Workflows',
            'executions': 'Executions',
            'users': 'Users',
            'traces': 'Traces',
            'datasets': 'Datasets',
            'zaps': 'Zaps',
            'tasks': 'Tasks',
            'credits': 'Credits',
            'rate_limits': 'Rate Limits',
            'neurons': 'Neurons',
            'extended': 'Extended Plan'
        };
        return translations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Failed to load AI tools</h3>
                <p>Please check your connection and try again</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AIToolsApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        Loading AI tools...
    </div>
`;