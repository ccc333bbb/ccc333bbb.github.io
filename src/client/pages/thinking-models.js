// Thinking Models Page JavaScript
class ThinkingModelsApp {
    constructor() {
        this.models = null;
        this.filteredModels = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            await this.loadModels();
            this.setupEventListeners();
            this.updateStats();
            this.renderModels();
        } catch (error) {
            console.error('Failed to initialize Thinking Models:', error);
            this.showError();
        }
    }

    async loadModels() {
        try {
            const response = await fetch('../data/thinking-models.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.models = await response.json();
            this.filteredModels = this.models;
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('resourceSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterModels();
        });

        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.category;
                this.updateActiveFilter(e.target);
                this.filterModels();
            });
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterModels() {
        if (!this.models) return;

        let filtered = this.models.models;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(model => model.category === this.currentFilter);
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(model => 
                model.name.toLowerCase().includes(this.searchTerm) ||
                model.description.toLowerCase().includes(this.searchTerm) ||
                model.keyTechniques.some(tech => tech.toLowerCase().includes(this.searchTerm)) ||
                model.applications.some(app => app.toLowerCase().includes(this.searchTerm))
            );
        }

        this.filteredModels = { ...this.models, models: filtered };
        this.renderModels();
    }

    updateStats() {
        if (!this.models) return;

        const metadata = this.models.metadata;
        
        document.getElementById('totalModels').textContent = metadata.totalModels;
        document.getElementById('totalPapers').textContent = metadata.totalPapers;
        document.getElementById('categories').textContent = metadata.categories;
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('en-US');
    }

    renderModels() {
        const container = document.getElementById('resourcesGrid');
        
        if (!this.filteredModels || this.filteredModels.models.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        let html = '';
        
        this.filteredModels.models.forEach(model => {
            html += this.renderModelCard(model);
        });

        container.innerHTML = html;
    }

    renderModelCard(model) {
        return `
            <div class="resource-card thinking-model-card">
                <div class="resource-header-info">
                    <div>
                        <div class="resource-name">${model.name}</div>
                        <div class="model-category">${this.getCategoryName(model.category)}</div>
                        <div class="model-complexity">
                            <span class="complexity-label">Complexity:</span>
                            <span class="complexity-value ${model.complexity.toLowerCase()}">${this.getComplexityText(model.complexity)}</span>
                        </div>
                    </div>
                    <div class="model-metrics">
                        <div class="metric">📄 ${model.papers.length} Papers</div>
                        <div class="metric">🔧 ${model.implementations.length} Implementations</div>
                        <div class="metric">🎯 ${model.applications.length} Applications</div>
                    </div>
                </div>
                
                <div class="resource-description">
                    ${model.description}
                </div>
                
                <div class="model-techniques">
                    <div class="techniques-title">Key Techniques</div>
                    <div class="techniques-list">
                        ${model.keyTechniques.map(tech => `
                            <span class="technique-tag">${tech}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="model-applications">
                    <div class="applications-title">Application Areas</div>
                    <div class="applications-list">
                        ${model.applications.map(app => `
                            <span class="application-tag">${app}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="model-effectiveness">
                    <div class="effectiveness-title">Effectiveness Evaluation</div>
                    <div class="effectiveness-grid">
                        ${Object.entries(model.effectiveness).map(([key, value]) => `
                            <div class="effectiveness-item">
                                <span class="effectiveness-label">${this.translateEffectivenessKey(key)}</span>
                                <div class="effectiveness-bar">
                                    <div class="effectiveness-fill" style="width: ${value}%"></div>
                                    <span class="effectiveness-score">${value}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="model-papers">
                    <div class="papers-title">Related Papers</div>
                    <div class="papers-list">
                        ${model.papers.slice(0, 2).map(paper => `
                            <div class="paper-item">
                                <a href="${paper.url}" target="_blank" rel="noopener noreferrer" class="paper-title">
                                    ${paper.title}
                                </a>
                                <div class="paper-meta">
                                    ${paper.year} - ${paper.venue}
                                </div>
                            </div>
                        `).join('')}
                        ${model.papers.length > 2 ? `
                            <div class="more-papers">+${model.papers.length - 2} more papers</div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="model-implementations">
                    <div class="implementations-title">Frameworks</div>
                    <div class="implementations-list">
                        ${model.implementations.map(impl => `
                            <a href="${impl.url}" target="_blank" rel="noopener noreferrer" class="implementation-link">
                                <div class="impl-name">${impl.name}</div>
                                <div class="impl-meta">${impl.language} - ${impl.framework}</div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryName(category) {
        const categories = {
            'economic': 'Economic Models',
            'cognitive': 'Cognitive Psychology Models', 
            'analytical': 'Analytical Thinking Models',
            'optimization': 'Optimization Models',
            'strategic': 'Strategic Thinking Models',
            'systems': 'Systems Thinking Models',
            'mathematical': 'Mathematical Models',
            'philosophical': 'Philosophical Models',
            'general': 'General Models'
        };
        return categories[category] || category;
    }

    getComplexityText(complexity) {
        const complexities = {
            'Low': 'Low',
            'Medium': 'Medium',
            'High': 'High'
        };
        return complexities[complexity] || complexity;
    }

    translateEffectivenessKey(key) {
        const translations = {
            'decision_quality': 'Decision Quality',
            'thinking_clarity': 'Clarity of Thought',
            'problem_solving': 'Problem Solving',
            'accuracy': 'Accuracy',
            'efficiency': 'Efficiency',
            'interpretability': 'Interpretability',
            'consistency': 'Consistency',
            'robustness': 'Robustness',
            'scalability': 'Scalability'
        };
        return translations[key] || key;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 No matching thinking models found</h3>
                <p>Try adjusting your search terms or selecting a different category.</p>
                <p>Or clear the search box to see all models.</p>
            </div>
        `;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Load Failed</h3>
                <p>Could not load thinking model data. Please check your connection or try again later.</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    Reload
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation
    const container = document.getElementById('resourcesGrid');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                Loading Thinking Models...
            </div>
        `;
    }
    
    new ThinkingModelsApp();
});