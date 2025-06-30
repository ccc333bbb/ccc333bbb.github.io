// TARDIS RSS News Search Functionality v2.0
class NewsSearch {
    constructor() {
        this.rankedIndex = null;
        this.loadData();
    }

    async loadData() {
        try {
            // Load ranked news index, which is the primary source of truth for the client.
            const rankedResponse = await fetch('/data/ranked-news-index.json');
            if (rankedResponse.ok) {
                this.rankedIndex = await rankedResponse.json();
                console.log('✅ Ranked news index loaded');
            } else {
                // If the main data file fails, log an error and stop.
                throw new Error(`Failed to load ranked-news-index.json: ${rankedResponse.status}`);
            }
            console.log('✅ RSS News search data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading RSS news search data:', error);
            // Optionally, render an error state in the UI
            const newsGrid = document.getElementById('newsGrid');
            if (newsGrid) {
                newsGrid.innerHTML = `
                    <div class="no-results">
                        <h3>📭 Error loading news</h3>
                        <p>Could not fetch the latest news data. Please try refreshing the page.</p>
                    </div>
                `;
            }
        }
    }

    async searchNews(query, filters = {}) {
        if (!this.rankedIndex || !this.rankedIndex.topArticles) {
            return [];
        }

        if (!query.trim()) {
            return this.getLatestNews(filters);
        }

        return this.searchInRankedArticles(query, filters);
    }

    searchInRankedArticles(query, filters = {}) {
        const words = query.toLowerCase().split(/\s+/);
        const results = [];
        
        this.rankedIndex.topArticles.forEach(article => {
            let score = 0;
            const fullText = `${article.title} ${article.source}`.toLowerCase();
            
            // Calculate relevance score
            words.forEach(word => {
                const titleMatches = (article.title.toLowerCase().match(new RegExp(word, 'g')) || []).length;
                const sourceMatches = (article.source.toLowerCase().match(new RegExp(word, 'g')) || []).length;
                
                score += titleMatches * 3 + sourceMatches * 1;
            });
            
            if (score > 0) {
                results.push({
                    ...article,
                    searchScore: score + (article.relevanceScore || 0)
                });
            }
        });

        // Apply filters
        let filteredResults = this.applyFilters(results, filters);

        // Sort by search score and relevance
        return filteredResults.sort((a, b) => {
            if (b.searchScore !== a.searchScore) {
                return b.searchScore - a.searchScore;
            }
            return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });
    }

    applyFilters(results, filters) {
        let filteredResults = results;

        if (filters.dateRange) {
            filteredResults = filteredResults.filter(article => {
                const articleDate = new Date(article.pubDate || article.timestamp);
                return articleDate >= filters.dateRange.start && 
                       articleDate <= filters.dateRange.end;
            });
        }

        if (filters.category) {
            filteredResults = filteredResults.filter(article => 
                article.category === filters.category
            );
        }

        if (filters.source) {
            filteredResults = filteredResults.filter(article => 
                article.source === filters.source
            );
        }

        if (filters.tags && filters.tags.length > 0) {
            filteredResults = filteredResults.filter(article => 
                article.tags && article.tags.some(tag => filters.tags.includes(tag))
            );
        }

        if (filters.readingLevel) {
            filteredResults = filteredResults.filter(article => 
                article.readingLevel === filters.readingLevel
            );
        }

        return filteredResults;
    }

    async getLatestNews(filters = {}) {
        if (!this.rankedIndex || !this.rankedIndex.topArticles) {
            return [];
        }
        
        let results = [...this.rankedIndex.topArticles];
        results = this.applyFilters(results, filters);
        
        return results.sort((a, b) => {
            const dateA = new Date(a.pubDate || a.timestamp);
            const dateB = new Date(b.pubDate || b.timestamp);
            return dateB - dateA;
        });
    }

    getCategories() {
        if (this.rankedIndex && this.rankedIndex.categories) {
            return this.rankedIndex.categories;
        }
        return ['general', 'tech', 'business', 'science', 'development'];
    }

    getSources() {
        const sources = new Set();
        
        if (this.rankedIndex && this.rankedIndex.topArticles) {
            this.rankedIndex.topArticles.forEach(article => {
                if (article.source) sources.add(article.source);
            });
        }
        
        return Array.from(sources).sort();
    }

    getTags() {
        const tags = new Set();
        
        if (this.rankedIndex && this.rankedIndex.topArticles) {
            this.rankedIndex.topArticles.forEach(article => {
                if (article.tags) {
                    article.tags.forEach(tag => tags.add(tag));
                }
            });
        }
        
        return Array.from(tags).sort();
    }

    // Render news section with enhanced filters
    renderNewsSection() {
        const categories = this.getCategories();
        const sources = this.getSources();
        const tags = this.getTags();

        return `
      <div class="news-section">
        <div class="news-header">
          <h2>📰 Latest RSS News</h2>
          <div class="news-controls">
            <button class="news-refresh-btn" onclick="newsSearch.refreshNews()" title="Refresh News">🔄</button>
            <button class="news-search-toggle" onclick="newsSearch.toggleAdvancedSearch()" title="Advanced Search">🔍</button>
          </div>
        </div>
        
        <div class="advanced-search hidden" id="advancedSearch">
          <div class="search-filters">
            <input type="text" id="newsSearchInput" placeholder="Search news..." onkeyup="newsSearch.handleSearchInput(event)">
            
            <select id="categoryFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">All Categories</option>
              ${categories.map(cat => `<option value="${cat}">${this.formatCategoryName(cat)}</option>`).join('')}
            </select>
            
            <select id="sourceFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">All Sources</option>
              ${sources.map(source => `<option value="${source}">${source}</option>`).join('')}
            </select>
            
            <select id="tagsFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">All Tags</option>
              ${tags.map(tag => `<option value="${tag}">${tag}</option>`).join('')}
            </select>
            
            <select id="readingLevelFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <button onclick="newsSearch.performSearch()">Search</button>
            <button onclick="newsSearch.clearFilters()">Clear</button>
          </div>
        </div>
        
        <div class="news-stats" id="newsStats">
          <span class="stat">Loading news statistics...</span>
        </div>
        
        <div class="news-grid" id="newsGrid">
          <div class="loading-placeholder">
            <div class="loading-spinner"></div>
            <p>Loading latest RSS news...</p>
          </div>
        </div>
      </div>
    `;
    }

    formatCategoryName(category) {
        const categoryNames = {
            'general': 'General News',
            'tech': 'Technology',
            'ai-ml': 'AI & Machine Learning',
            'blockchain': 'Blockchain',
            'mobile': 'Mobile',
            'cloud': 'Cloud Computing',
            'cybersecurity': 'Cybersecurity',
            'startup': 'Startups',
            'social': 'Social Media',
            'gaming': 'Gaming',
            'automotive': 'Automotive',
            'space': 'Space',
            'health': 'Health',
            'finance': 'Finance',
            'climate': 'Climate',
            'education': 'Education',
            'entertainment': 'Entertainment',
            'business': 'Business',
            'science': 'Science',
            'development': 'Development'
        };
        return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    async refreshNews() {
        console.log('🔄 Refreshing RSS news data...');
        await this.loadData();
        await this.displayLatestNews();
    }

    toggleAdvancedSearch() {
        const searchDiv = document.getElementById('advancedSearch');
        searchDiv.classList.toggle('hidden');
    }

    handleSearchInput(event) {
        if (event.key === 'Enter') {
            this.performSearch();
        }
    }

    handleFilterChange() {
        // Auto-search when filters change
        this.performSearch();
    }

    clearFilters() {
        document.getElementById('newsSearchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('sourceFilter').value = '';
        document.getElementById('tagsFilter').value = '';
        document.getElementById('readingLevelFilter').value = '';
        this.displayLatestNews();
    }

    async performSearch() {
        const query = document.getElementById('newsSearchInput').value;
        const filters = {
            category: document.getElementById('categoryFilter').value,
            source: document.getElementById('sourceFilter').value,
            tags: document.getElementById('tagsFilter').value ? [document.getElementById('tagsFilter').value] : [],
            readingLevel: document.getElementById('readingLevelFilter').value
        };

        const results = await this.searchNews(query, filters);
        this.displayResults(results, query);
    }

    async displayLatestNews() {
        const results = await this.getLatestNews();
        this.displayResults(results.slice(0, 20), ''); // Show top 20 articles
    }

    displayResults(results, query = '') {
        const newsGrid = document.getElementById('newsGrid');
        const newsStats = document.getElementById('newsStats');
        
        // Update statistics
        if (newsStats) {
            const totalArticles = this.rankedIndex ? this.rankedIndex.totalArticles : 0;
            const lastUpdated = this.rankedIndex ? new Date(this.rankedIndex.lastUpdated).toLocaleString() : 'Unknown';
            
            newsStats.innerHTML = `
                <span class="stat">📊 Showing ${results.length} articles</span>
                <span class="stat">📰 Total: ${totalArticles}</span>
                <span class="stat">🕒 Updated: ${lastUpdated}</span>
                ${query ? `<span class="stat">🔍 Query: "${query}"</span>` : ''}
            `;
        }

        if (!results || results.length === 0) {
            newsGrid.innerHTML = `
                <div class="no-results">
                    <h3>📭 No articles found</h3>
                    <p>Try different search terms or filters</p>
                </div>
            `;
            return;
        }

        const newsHtml = results.map(article => this.renderArticleCard(article)).join('');
        newsGrid.innerHTML = newsHtml;
    }

    renderArticleCard(article) {
        const pubDate = new Date(article.pubDate || article.timestamp);
        const timeAgo = this.getTimeAgo(pubDate);
        const relevanceScore = article.relevanceScore || article.searchScore || 0;
        const tags = article.tags || [];
        const readingLevel = article.readingLevel || 'intermediate';
        
        // Generate category color
        const categoryColor = this.getCategoryColor(article.category);
        
        return `
            <div class="news-card" data-category="${article.category || 'general'}" data-source="${article.source}">
                <div class="news-card-header">
                    <div class="news-source">
                        <span class="source-name">${article.source}</span>
                        <span class="news-category" style="background-color: ${categoryColor}">
                            ${this.formatCategoryName(article.category || 'general')}
                        </span>
                    </div>
                    <div class="news-meta">
                        <span class="relevance-score" title="Relevance Score">${relevanceScore.toFixed(1)}</span>
                        <span class="reading-level ${readingLevel}" title="Reading Level">${readingLevel}</span>
                    </div>
                </div>
                
                <div class="news-content">
                    <h3 class="news-title">
                        <a href="${article.link}" target="_blank" rel="noopener">
                            ${article.title}
                        </a>
                    </h3>
                    
                    ${article.description ? `
                        <p class="news-description">${article.description.substring(0, 150)}...</p>
                    ` : ''}
                    
                    ${tags.length > 0 ? `
                        <div class="news-tags">
                            ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="news-footer">
                    <span class="news-time" title="${pubDate.toLocaleString()}">${timeAgo}</span>
                    ${article.readTime ? `<span class="read-time">${article.readTime} min read</span>` : ''}
                    ${article.type ? `<span class="article-type">${article.type}</span>` : ''}
                </div>
            </div>
        `;
    }

    getCategoryColor(category) {
        const colors = {
            'general': '#6c757d',
            'tech': '#007bff',
            'ai-ml': '#e83e8c',
            'blockchain': '#fd7e14',
            'mobile': '#20c997',
            'cloud': '#17a2b8',
            'cybersecurity': '#dc3545',
            'startup': '#28a745',
            'social': '#6f42c1',
            'gaming': '#ffc107',
            'business': '#343a40',
            'science': '#6610f2',
            'development': '#495057'
        };
        return colors[category] || '#6c757d';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        
        const days = Math.floor(diffInSeconds / 86400);
        if (days === 1) return '1 day ago';
        if (days < 7) return `${days} days ago`;
        
        return date.toLocaleDateString();
    }
}

// Initialize global instance
window.newsSearch = new NewsSearch();