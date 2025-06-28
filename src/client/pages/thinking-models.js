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
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('zh-TW');
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
                            <span class="complexity-label">複雜度:</span>
                            <span class="complexity-value ${model.complexity.toLowerCase()}">${this.getComplexityText(model.complexity)}</span>
                        </div>
                    </div>
                    <div class="model-metrics">
                        <div class="metric">📄 ${model.papers.length} 論文</div>
                        <div class="metric">🔧 ${model.implementations.length} 實現</div>
                        <div class="metric">🎯 ${model.applications.length} 應用</div>
                    </div>
                </div>
                
                <div class="resource-description">
                    ${model.description}
                </div>
                
                <div class="model-techniques">
                    <div class="techniques-title">關鍵技術</div>
                    <div class="techniques-list">
                        ${model.keyTechniques.map(tech => `
                            <span class="technique-tag">${tech}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="model-applications">
                    <div class="applications-title">應用領域</div>
                    <div class="applications-list">
                        ${model.applications.map(app => `
                            <span class="application-tag">${app}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="model-effectiveness">
                    <div class="effectiveness-title">效果評估</div>
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
                    <div class="papers-title">相關論文</div>
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
                            <div class="more-papers">+${model.papers.length - 2} 更多論文</div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="model-implementations">
                    <div class="implementations-title">實現框架</div>
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
            'economic': '經濟學模型',
            'cognitive': '認知心理模型', 
            'analytical': '分析思維模型',
            'optimization': '最佳化模型',
            'strategic': '戰略思維模型',
            'systems': '系統思維模型',
            'mathematical': '數學模型',
            'philosophical': '哲學思辯模型',
            'general': '通用模型'
        };
        return categories[category] || category;
    }

    getComplexityText(complexity) {
        const complexities = {
            'Low': '低',
            'Medium': '中',
            'High': '高'
        };
        return complexities[complexity] || complexity;
    }

    translateEffectivenessKey(key) {
        const translations = {
            'decision_quality': '決策品質',
            'thinking_clarity': '思維清晰度',
            'problem_solving': '問題解決能力',
            'accuracy': '準確性',
            'efficiency': '效率',
            'interpretability': '可解釋性',
            'consistency': '一致性',
            'robustness': '魯棒性',
            'scalability': '可擴展性'
        };
        return translations[key] || key;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 未找到匹配的思維模型</h3>
                <p>請嘗試調整搜索條件或選擇不同的分類</p>
                <p>或者清空搜索框查看所有模型</p>
            </div>
        `;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ 載入失敗</h3>
                <p>無法載入思維模型數據，請檢查網路連接或稍後再試</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    重新載入
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThinkingModelsApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        載入思維模型中...
    </div>
`; 