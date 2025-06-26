// TARDIS 新聞搜索功能
class NewsSearch {
  constructor() {
    this.searchIndex = null;
    this.newsData = {};
    this.newsIndex = null;
    this.loadData();
  }

  async loadData() {
    try {
      // 加載搜索索引
      const searchResponse = await fetch('/data/search-index.json');
      if (searchResponse.ok) {
        this.searchIndex = await searchResponse.json();
      }

      // 加載新聞索引
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

    // 搜索匹配的文章
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

    // 應用過濾器
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

    // 按分數和時間排序
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
    const recentDates = this.newsIndex.dates.slice(0, 5); // 最近5天

    for (const dateInfo of recentDates) {
      const articles = await this.getArticlesByDate(dateInfo.date);
      results.push(...articles);
    }

    // 應用過濾器
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

    // 按時間排序
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

  // 渲染新聞區塊
  renderNewsSection() {
    return `
      <div class="news-section">
        <div class="news-header">
          <h2>📰 Latest News</h2>
          <div class="news-controls">
            <button class="news-refresh-btn" onclick="newsSearch.refreshNews()">🔄</button>
            <button class="news-search-toggle" onclick="newsSearch.toggleAdvancedSearch()">🔍</button>
          </div>
        </div>
        
        <div class="advanced-search hidden" id="advancedSearch">
          <div class="search-filters">
            <input type="text" id="newsSearchInput" placeholder="搜索新聞..." onkeyup="newsSearch.handleSearchInput(event)">
            <select id="categoryFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">所有分類</option>
              <option value="general">一般新聞</option>
              <option value="keyword-search">關鍵詞搜索</option>
            </select>
            <select id="sourceFilter" onchange="newsSearch.handleFilterChange()">
              <option value="">所有來源</option>
              <option value="BBC News">BBC News</option>
              <option value="TechCrunch">TechCrunch</option>
              <option value="The Verge">The Verge</option>
              <option value="Google News">Google News</option>
            </select>
            <button onclick="newsSearch.performSearch()">搜索</button>
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
          <h3>沒有找到相關新聞</h3>
          <p>${query ? `沒有找到包含 "${query}" 的新聞` : '暫時沒有最新新聞'}</p>
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
        ${article.score ? `<div class="news-score">相關度: ${article.score}</div>` : ''}
      </div>
    `).join('');

    // 更新統計信息
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
          <span class="stat-label">總數:</span>
          <span class="stat-value">${results.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">分類:</span>
          <span class="stat-value">${Object.keys(categories).length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">來源:</span>
          <span class="stat-value">${Object.keys(sources).length}</span>
        </div>
        ${Object.keys(keywords).length > 0 ? `
        <div class="stat-item">
          <span class="stat-label">關鍵詞:</span>
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
    
    if (diff < 24 * 60 * 60 * 1000) {
      // 24小時內
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分鐘前`;
      }
      return `${hours}小時前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}

// 初始化新聞搜索
let newsSearch;
document.addEventListener('DOMContentLoaded', () => {
  newsSearch = new NewsSearch();
}); 