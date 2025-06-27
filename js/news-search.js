// TARDIS News Search Functionality
class NewsSearch {
  constructor() {
    this.searchIndex = null;
    this.newsData = {};
    this.newsIndex = null;
    this.loadData();
  }

  async loadData() {
    try {
      // Load search index
      const searchResponse = await fetch('/data/search-index.json');
      if (searchResponse.ok) {
        this.searchIndex = await searchResponse.json();
      }

      // Load news index
      const indexResponse = await fetch('/data/news-index.json');
      if (indexResponse.ok) {
        this.newsIndex = await indexResponse.json();
      }

      console.log('✅ News search data loaded');
    } catch (error) {
      console.error('❌ Error loading news search data:', error);
    }
  }

  async searchNews(query, filters = {}) {
    if (!this.searchIndex || !query.trim()) {
      return await this.getLatestNews(filters);
    }

    const words = query.toLowerCase().split(/\s+/);
    const results = new Map();

    // Search for matching articles
    for (const word of words) {
      if (this.searchIndex[word]) {
        for (const match of this.searchIndex[word]) {
          const article = await this.getArticle(match.articleId, match.date);
          if (article) {
            const existing = results.get(article.id);
            const score = existing ? existing.score + match.score : match.score;
            
            results.set(article.id, {
              ...article,
              score,
              matchDate: match.date
            });
          }
        }
      }
    }

    // Apply filters
    let filteredResults = Array.from(results.values());
    
    if (filters.dateRange) {
      filteredResults = filteredResults.filter(article => {
        const articleDate = new Date(article.timestamp);
        return articleDate >= filters.dateRange.start && 
               articleDate <= filters.dateRange.end;
      });
    }

    if (filters.category) {
      filteredResults = filteredResults.filter(article => 
        article.category === filters.category
      );
    }

    if (filters.keyword) {
      filteredResults = filteredResults.filter(article => 
        article.keyword === filters.keyword
      );
    }

    if (filters.source) {
      filteredResults = filteredResults.filter(article => 
        article.source === filters.source
      );
    }

    // Sort by score and time
    return filteredResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  async getLatestNews(filters = {}) {
    if (!this.newsIndex) return [];

    const results = [];
    const recentDates = this.newsIndex.dates.slice(0, 5); // Last 5 days

    for (const dateInfo of recentDates) {
      const articles = await this.getArticlesByDate(dateInfo.date);
      results.push(...articles);
    }

    // Apply filters
    let filteredResults = results;
    
    if (filters.category) {
      filteredResults = filteredResults.filter(article => 
        article.category === filters.category
      );
    }

    if (filters.keyword) {
      filteredResults = filteredResults.filter(article => 
        article.keyword === filters.keyword
      );
    }

    if (filters.source) {
      filteredResults = filteredResults.filter(article => 
        article.source === filters.source
      );
    }

    // Sort by time
    return filteredResults.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  async getArticle(articleId, date) {
    if (this.newsData[date]) {
      return this.newsData[date].find(a => a.id === articleId);
    }

    try {
      const response = await fetch(`/data/news/${date}.json`);
      if (response.ok) {
        const data = await response.json();
        this.newsData[date] = data.articles;
        return data.articles.find(a => a.id === articleId);
      }
    } catch (error) {
      console.error(`Error loading news for ${date}:`, error);
    }
    return null;
  }

  async getArticlesByDate(date) {
    if (this.newsData[date]) {
      return this.newsData[date];
    }

    try {
      const response = await fetch(`/data/news/${date}.json`);
      if (response.ok) {
        const data = await response.json();
        this.newsData[date] = data.articles;
        return data.articles;
      }
    } catch (error) {
      console.error(`Error loading news for ${date}:`, error);
    }
    return [];
  }

  // Render news section
  renderNewsSection() {
    return `
      <div class="news-section">
        <div class="news-header">
          <h2>📰 Latest News</h2>
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
              <option value="general">General News</option>
              <option value="keyword-search">Keyword Search</option>
            </select>
            <select id="sourceFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">All Sources</option>
              <option value="BBC News">BBC News</option>
              <option value="TechCrunch">TechCrunch</option>
              <option value="The Verge">The Verge</option>
              <option value="Google News">Google News</option>
            </select>
            <button onclick="newsSearch.performSearch()">Search</button>
          </div>
        </div>
        
        <div class="news-grid" id="newsGrid">
          <div class="loading">Loading latest news...</div>
        </div>
        
        <div class="news-stats" id="newsStats"></div>
      </div>
    `;
  }

  async refreshNews() {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.innerHTML = '<div class="loading">Refreshing news...</div>';
    
    await this.loadData();
    await this.displayLatestNews();
  }

  toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advancedSearch');
    advancedSearch.classList.toggle('hidden');
  }

  handleSearchInput(event) {
    if (event.key === 'Enter') {
      this.performSearch();
    }
  }

  handleFilterChange() {
    this.performSearch();
  }

  async performSearch() {
    const query = document.getElementById('newsSearchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const source = document.getElementById('sourceFilter')?.value || '';

    const filters = {};
    if (category) filters.category = category;
    if (source) filters.source = source;

    const results = await this.searchNews(query, filters);
    this.displayResults(results, query);
  }

  async displayLatestNews() {
    const results = await this.getLatestNews();
    this.displayResults(results);
  }

  displayResults(results, query = '') {
    const container = document.getElementById('newsGrid');
    const statsContainer = document.getElementById('newsStats');

    if (results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📰</div>
          <h3>No related news found</h3>
          <p>${query ? `No news found containing "${query}"` : 'No latest news available'}</p>
        </div>
      `;
      statsContainer.innerHTML = '';
      return;
    }

    container.innerHTML = results.slice(0, 12).map(article => `
      <div class="news-card" data-article-id="${article.id}">
        <div class="news-header">
          <h3 class="news-title">
            <a href="${article.link}" target="_blank" rel="noopener">
              ${article.title}
            </a>
          </h3>
          ${article.keyword ? `<span class="news-keyword">${article.keyword}</span>` : ''}
        </div>
        <div class="news-meta">
          <span class="news-source">${article.source}</span>
          <span class="news-date">${this.formatTime(article.timestamp)}</span>
        </div>
        ${article.score ? `<div class="news-score">Relevance: ${article.score}</div>` : ''}
      </div>
    `).join('');

    // Update statistics
    const categories = {};
    const sources = {};
    const keywords = {};
    
    results.forEach(article => {
      categories[article.category] = (categories[article.category] || 0) + 1;
      sources[article.source] = (sources[article.source] || 0) + 1;
      if (article.keyword) {
        keywords[article.keyword] = (keywords[article.keyword] || 0) + 1;
      }
    });

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Articles</span>
          <span class="stat-value">${results.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Categories</span>
          <span class="stat-value">${Object.keys(categories).length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Sources</span>
          <span class="stat-value">${Object.keys(sources).length}</span>
        </div>
        ${Object.keys(keywords).length > 0 ? `
        <div class="stat-item">
          <span class="stat-label">Keywords</span>
          <span class="stat-value">${Object.keys(keywords).length}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Format absolute time
    const absoluteTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (diff < 24 * 60 * 60 * 1000) {
      // Within 24 hours - show both relative and absolute time
      const hours = Math.floor(diff / (60 * 60 * 1000));
      let relativeTime;
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        relativeTime = `${minutes} minutes ago`;
      } else {
        relativeTime = `${hours} hours ago`;
      }
      return `<span class="relative-time">${relativeTime}</span><br><span class="absolute-time">${absoluteTime}</span>`;
    } else {
      // More than 24 hours - show absolute time with relative days
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `<span class="relative-time">${days} days ago</span><br><span class="absolute-time">${absoluteTime}</span>`;
    }
  }
}

// Initialize news search and expose as global variable
window.newsSearch = new NewsSearch(); 