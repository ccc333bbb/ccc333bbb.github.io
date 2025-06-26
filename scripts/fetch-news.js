const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 新聞來源配置 - 更新選擇器和添加更多來源
const newsSources = [
  {
    name: 'BBC News',
    url: 'https://www.bbc.com/news',
    selector: 'h3[data-testid="card-headline"], h2[data-testid="card-headline"], .gs-c-promo-heading__title',
    limit: 5
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    selector: 'h2.post-block__title a, .post-block__title a, h2 a',
    limit: 5
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com',
    selector: 'h2 a, .c-entry-box--compact__title a, .c-entry-summary__title a',
    limit: 4
  },
  {
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    selector: 'h2.entry-title a, .listing-title a',
    limit: 4
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com',
    selector: 'h3 a, .SummaryItemHedLink, .headline a',
    limit: 4
  },
  {
    name: 'Google News',
    url: 'https://news.google.com',
    selector: 'h3 a, .VDXfz, .DY5T1d, .ipQwMb',
    limit: 6
  }
];

class NewsManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.newsDir = path.join(this.dataDir, 'news');
    this.indexFile = path.join(this.dataDir, 'news-index.json');
    this.searchIndexFile = path.join(this.dataDir, 'search-index.json');
    this.keywordsFile = path.join(this.dataDir, 'keywords.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.newsDir)) {
      fs.mkdirSync(this.newsDir, { recursive: true });
    }
  }

  getDateString(date = new Date()) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async fetchNewsFromSource(source) {
    try {
      console.log(`Fetching news from ${source.name}...`);
      
      // 更強的反反爬蟲策略
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 20000,
        maxRedirects: 5
      });
      
      console.log(`✓ Got response from ${source.name}, status: ${response.status}`);
      console.log(`✓ Content length: ${response.data.length} characters`);
      
      const $ = cheerio.load(response.data);
      const articles = [];
      
      // 嘗試多個選擇器
      const selectors = source.selector.split(', ');
      let foundArticles = false;
      
      for (const selector of selectors) {
        const elements = $(selector);
        console.log(`  Trying selector "${selector}": found ${elements.length} elements`);
        
        if (elements.length > 0) {
          elements.slice(0, source.limit).each((i, element) => {
            const $el = $(element);
            let title = $el.text().trim();
            let link = $el.attr('href') || $el.find('a').attr('href');
            
            // 如果沒有直接找到鏈接，嘗試父元素
            if (!link && $el.parent().is('a')) {
              link = $el.parent().attr('href');
            }
            
            // 構建完整URL
            if (link) {
              if (link.startsWith('http')) {
                // 已經是完整URL
              } else if (link.startsWith('//')) {
                link = 'https:' + link;
              } else if (link.startsWith('/')) {
                const baseUrl = source.url.split('/').slice(0, 3).join('/');
                link = baseUrl + link;
              } else {
                const baseUrl = source.url.split('/').slice(0, 3).join('/');
                link = baseUrl + '/' + link;
              }
            }
            
            if (title && link && title.length > 10) {
              const article = {
                id: this.generateId(),
                title,
                link: link,
                source: source.name,
                timestamp: new Date().toISOString(),
                category: 'general'
              };
              
              // 添加智能標記
              const enhancedArticle = this.addSmartMetadata(article);
              articles.push(enhancedArticle);
            }
          });
          
          if (articles.length > 0) {
            foundArticles = true;
            break;
          }
        }
      }
      
      if (!foundArticles) {
        // 如果所有選擇器都失敗，嘗試通用的標題選擇器
        console.log(`  No articles found with specific selectors, trying generic selectors...`);
        const genericSelectors = ['h1 a', 'h2 a', 'h3 a', '.title a', '.headline a', 'a[href*="/202"]'];
        
        for (const selector of genericSelectors) {
          const elements = $(selector);
          console.log(`  Trying generic selector "${selector}": found ${elements.length} elements`);
          
          if (elements.length > 0) {
            elements.slice(0, source.limit).each((i, element) => {
              const $el = $(element);
              const title = $el.text().trim();
              let link = $el.attr('href');
              
              if (link && title && title.length > 10) {
                if (!link.startsWith('http')) {
                  if (link.startsWith('//')) {
                    link = 'https:' + link;
                  } else if (link.startsWith('/')) {
                    const baseUrl = source.url.split('/').slice(0, 3).join('/');
                    link = baseUrl + link;
                  } else {
                    const baseUrl = source.url.split('/').slice(0, 3).join('/');
                    link = baseUrl + '/' + link;
                  }
                }
                
                const article = {
                  id: this.generateId(),
                  title,
                  link: link,
                  source: source.name,
                  timestamp: new Date().toISOString(),
                  category: 'general'
                };
                
                // 添加智能標記
                const enhancedArticle = this.addSmartMetadata(article);
                articles.push(enhancedArticle);
              }
            });
            
            if (articles.length > 0) break;
          }
        }
      }
      
      console.log(`✓ Fetched ${articles.length} articles from ${source.name}`);
      return articles;
      
    } catch (error) {
      console.error(`✗ Error fetching from ${source.name}:`, error.message);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Headers:`, error.response.headers);
      }
      return [];
    }
  }

  // 添加智能元數據
  addSmartMetadata(article) {
    const keywordsData = JSON.parse(fs.readFileSync(this.keywordsFile, 'utf8'));
    
    // 計算重要性評分
    const importance = this.calculateImportance(article, keywordsData);
    
    // 檢測文章類型
    const articleType = this.detectArticleType(article, keywordsData);
    
    // 估算閱讀時間
    const readTime = this.estimateReadTime(article.title);
    
    // 評估複雜度
    const complexity = this.assessComplexity(article, keywordsData);
    
    // 獲取關鍵詞等級
    const keywordLevel = this.getKeywordLevel(article.keyword, keywordsData);
    
    // 檢測是否為深度分析
    const isAnalysis = this.isAnalysisArticle(article, keywordsData);
    
    return {
      ...article,
      metadata: {
        importance,
        articleType,
        readTime,
        complexity,
        keywordLevel,
        isAnalysis,
        isTop10: false // 稍後在排名時設置
      }
    };
  }

  // 計算重要性評分
  calculateImportance(article, keywordsData) {
    let score = 0;
    
    // 來源權威性評分
    const sourceWeights = keywordsData.sourceWeights || {};
    score += sourceWeights[article.source] || 5;
    
    // 關鍵詞重要性
    if (article.keyword) {
      const keyword = keywordsData.keywords.find(k => k.keyword === article.keyword);
      if (keyword) {
        score += (11 - keyword.priority) * 2; // 優先級1得20分，優先級10得2分
      }
    }
    
    // 文章類型加分
    const typeBonus = {
      'analysis': 3,
      'opinion': 2,
      'breaking': 1,
      'review': 2
    };
    
    const detectedType = this.detectArticleType(article, keywordsData);
    score += typeBonus[detectedType] || 0;
    
    // 標題長度加分（長標題通常更有信息量）
    if (article.title.length > 50) {
      score += 1;
    }
    
    return Math.min(10, Math.max(1, score));
  }

  // 檢測文章類型
  detectArticleType(article, keywordsData) {
    const title = article.title.toLowerCase();
    const patterns = keywordsData.articleTypePatterns || {};
    
    for (const [type, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (title.includes(keyword.toLowerCase())) {
          return type;
        }
      }
    }
    
    return 'general';
  }

  // 估算閱讀時間
  estimateReadTime(title) {
    const wordCount = title.split(' ').length;
    // 基於標題長度估算，平均每分鐘閱讀200字
    const estimatedWords = wordCount * 20; // 假設正文是標題的20倍
    return Math.max(1, Math.ceil(estimatedWords / 200));
  }

  // 評估複雜度
  assessComplexity(article, keywordsData) {
    const title = article.title.toLowerCase();
    
    // 複雜技術關鍵詞
    const complexKeywords = ['quantum', 'algorithm', 'neural', 'blockchain', 'cryptography'];
    const hasComplexKeywords = complexKeywords.some(keyword => title.includes(keyword));
    
    // 文章類型
    const isAnalysis = this.isAnalysisArticle(article, keywordsData);
    
    if (hasComplexKeywords || isAnalysis) {
      return 'advanced';
    } else if (article.metadata?.readTime > 5) {
      return 'medium';
    } else {
      return 'basic';
    }
  }

  // 獲取關鍵詞等級
  getKeywordLevel(keyword, keywordsData) {
    if (!keyword) return null;
    
    const keywordData = keywordsData.keywords.find(k => k.keyword === keyword);
    return keywordData?.level || null;
  }

  // 檢測是否為深度分析文章
  isAnalysisArticle(article, keywordsData) {
    const title = article.title.toLowerCase();
    const analysisPatterns = keywordsData.articleTypePatterns?.analysis || [];
    
    return analysisPatterns.some(pattern => title.includes(pattern.toLowerCase()));
  }

  async searchKeywordNews(keyword) {
    try {
      console.log(`Searching for keyword: ${keyword}`);
      
      // 使用多個搜索源
      const searchSources = [
        {
          name: 'Google News',
          url: `https://news.google.com/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`,
          selector: 'article h3 a, .DY5T1d'
        },
        {
          name: 'Bing News',
          url: `https://www.bing.com/news/search?q=${encodeURIComponent(keyword)}`,
          selector: '.news-card a, .title a'
        }
      ];
      
      let allArticles = [];
      
      for (const searchSource of searchSources) {
        try {
          const response = await axios.get(searchSource.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 15000
          });
          
          const $ = cheerio.load(response.data);
          const articles = [];
          
          $(searchSource.selector).slice(0, 5).each((i, element) => {
            const $el = $(element);
            const title = $el.text().trim();
            let link = $el.attr('href');
            
            if (title && link && title.length > 10) {
              if (!link.startsWith('http')) {
                if (link.startsWith('//')) {
                  link = 'https:' + link;
                } else if (link.startsWith('/')) {
                  const baseUrl = searchSource.url.split('/').slice(0, 3).join('/');
                  link = baseUrl + link;
                } else {
                  const baseUrl = searchSource.url.split('/').slice(0, 3).join('/');
                  link = baseUrl + '/' + link;
                }
              }
              
              articles.push({
                id: this.generateId(),
                title,
                link: link,
                source: searchSource.name,
                keyword: keyword,
                timestamp: new Date().toISOString(),
                category: 'keyword-search'
              });
            }
          });
          
          allArticles.push(...articles);
          console.log(`✓ Found ${articles.length} articles from ${searchSource.name} for "${keyword}"`);
          
        } catch (error) {
          console.error(`✗ Error searching ${searchSource.name} for "${keyword}":`, error.message);
        }
      }
      
      console.log(`✓ Total found ${allArticles.length} articles for keyword "${keyword}"`);
      return allArticles;
      
    } catch (error) {
      console.error(`✗ Error searching keyword "${keyword}":`, error.message);
      return [];
    }
  }

  async saveDailyNews(articles, date) {
    const filePath = path.join(this.newsDir, `${date}.json`);
    const dailyData = {
      date: date,
      lastUpdated: new Date().toISOString(),
      articles: articles
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dailyData, null, 2));
    console.log(`✓ Saved ${articles.length} articles to ${date}.json`);
  }

  async updateNewsIndex() {
    const index = {
      lastUpdated: new Date().toISOString(),
      dates: [],
      totalArticles: 0,
      categories: {},
      keywords: {}
    };

    // 掃描所有新聞文件
    const files = fs.readdirSync(this.newsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(this.newsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      index.dates.push({
        date: data.date,
        articleCount: data.articles.length,
        file: file
      });
      
      index.totalArticles += data.articles.length;
      
      // 統計分類和關鍵詞
      data.articles.forEach(article => {
        const category = article.category || 'general';
        if (!index.categories[category]) {
          index.categories[category] = 0;
        }
        index.categories[category]++;
        
        if (article.keyword) {
          if (!index.keywords[article.keyword]) {
            index.keywords[article.keyword] = 0;
          }
          index.keywords[article.keyword]++;
        }
      });
    }

    // 保留最近30天，刪除舊文件
    index.dates.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (index.dates.length > 30) {
      const toDelete = index.dates.slice(30);
      toDelete.forEach(item => {
        const filePath = path.join(this.newsDir, item.file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old news file: ${item.date}`);
        }
      });
      index.dates = index.dates.slice(0, 30);
    }

    fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
    console.log(`✓ Updated news index with ${index.dates.length} days`);
  }

  async buildSearchIndex() {
    const searchIndex = {};
    const files = fs.readdirSync(this.newsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(this.newsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      data.articles.forEach(article => {
        const words = this.extractWords(article.title + ' ' + (article.description || ''));
        words.forEach(word => {
          if (!searchIndex[word]) {
            searchIndex[word] = [];
          }
          searchIndex[word].push({
            articleId: article.id,
            date: data.date,
            score: this.calculateScore(word, article)
          });
        });
      });
    }

    fs.writeFileSync(this.searchIndexFile, JSON.stringify(searchIndex, null, 2));
    console.log(`✓ Built search index with ${Object.keys(searchIndex).length} words`);
  }

  extractWords(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  calculateScore(word, article) {
    let score = 0;
    const title = article.title.toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    if (title.includes(word)) score += 3;
    if (description.includes(word)) score += 1;
    if (article.keyword === word) score += 2;
    
    return score;
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^\w\s]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async fetchAllNews() {
    const today = this.getDateString();
    let allArticles = [];

    // 抓取常規新聞
    console.log('📰 Fetching regular news...');
    for (const source of newsSources) {
      const articles = await this.fetchNewsFromSource(source);
      allArticles.push(...articles);
    }

    // 抓取關鍵詞相關新聞
    console.log('🔍 Fetching keyword-based news...');
    const keywordsData = JSON.parse(fs.readFileSync(this.keywordsFile, 'utf8'));
    const highPriorityKeywords = keywordsData.keywords
      .filter(k => k.priority <= 2)
      .map(k => k.keyword);

    for (const keyword of highPriorityKeywords) {
      const articles = await this.searchKeywordNews(keyword);
      allArticles.push(...articles);
      
      // 避免請求過於頻繁
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 去重
    allArticles = this.deduplicateArticles(allArticles);
    console.log(`✓ Total unique articles: ${allArticles.length}`);

    // 保存今日新聞
    await this.saveDailyNews(allArticles, today);
    
    // 更新索引
    await this.updateNewsIndex();
    
    // 構建搜索索引
    await this.buildSearchIndex();

    return allArticles;
  }
}

// 執行新聞抓取
async function main() {
  console.log('🚀 Starting news fetch process...');
  const newsManager = new NewsManager();
  await newsManager.fetchAllNews();
  console.log('✅ News fetch process completed!');
}

main().catch(console.error); 