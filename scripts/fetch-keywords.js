const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class DynamicKeywordManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.keywordsFile = path.join(this.dataDir, 'keywords.json');
    this.dynamicKeywordsFile = path.join(this.dataDir, 'dynamic-keywords.json');
  }

  // 1. 從 Google Trends 獲取熱門關鍵字
  async getGoogleTrendsKeywords() {
    try {
      const categories = ['technology', 'business', 'science'];
      let allKeywords = [];

      for (const category of categories) {
        const url = `https://trends.google.com/trends/trendingsearches/daily/rss?hl=en-US&geo=US`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        
        $('item').each((i, item) => {
          const title = $(item).find('title').text();
          const traffic = $(item).find('ht\\:approx_traffic').text();
          
          if (title && this.isRelevantTechKeyword(title)) {
            allKeywords.push({
              keyword: title,
              source: 'google-trends',
              traffic: parseInt(traffic) || 0,
              category: category,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      return allKeywords;
    } catch (error) {
      console.error('Error fetching Google Trends:', error.message);
      return [];
    }
  }

  // 2. 從 GitHub Trending 獲取技術關鍵字
  async getGitHubTrendingKeywords() {
    try {
      const url = 'https://github.com/trending';
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const keywords = [];

      $('h2.h3 a').each((i, element) => {
        const repoName = $(element).text().trim().split('/')[1];
        if (repoName && this.isRelevantTechKeyword(repoName)) {
          keywords.push({
            keyword: repoName,
            source: 'github-trending',
            category: 'technology',
            timestamp: new Date().toISOString()
          });
        }
      });

      // 獲取語言標籤
      $('.f6.color-fg-muted .ml-1').each((i, element) => {
        const language = $(element).text().trim();
        if (language && this.isRelevantTechKeyword(language)) {
          keywords.push({
            keyword: language,
            source: 'github-trending',
            category: 'programming',
            timestamp: new Date().toISOString()
          });
        }
      });

      return keywords;
    } catch (error) {
      console.error('Error fetching GitHub Trending:', error.message);
      return [];
    }
  }

  // 3. 從 Hacker News 獲取熱門技術話題
  async getHackerNewsKeywords() {
    try {
      const response = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStories = response.data.slice(0, 30);
      const keywords = [];

      for (const storyId of topStories) {
        try {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
          const story = storyResponse.data;
          
          if (story && story.title) {
            const extractedKeywords = this.extractKeywordsFromTitle(story.title);
            extractedKeywords.forEach(keyword => {
              if (this.isRelevantTechKeyword(keyword)) {
                keywords.push({
                  keyword: keyword,
                  source: 'hacker-news',
                  score: story.score || 0,
                  category: 'technology',
                  timestamp: new Date().toISOString()
                });
              }
            });
          }
        } catch (error) {
          // 忽略單個故事的錯誤
        }
      }

      return keywords;
    } catch (error) {
      console.error('Error fetching Hacker News:', error.message);
      return [];
    }
  }

  // 4. 從 Reddit 技術版塊獲取熱門話題
  async getRedditTechKeywords() {
    try {
      const subreddits = ['programming', 'technology', 'MachineLearning', 'javascript', 'reactjs'];
      let allKeywords = [];

      for (const subreddit of subreddits) {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=20`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'NewsBot/1.0'
          }
        });

        const posts = response.data.data.children;
        
        posts.forEach(post => {
          const title = post.data.title;
          const extractedKeywords = this.extractKeywordsFromTitle(title);
          
          extractedKeywords.forEach(keyword => {
            if (this.isRelevantTechKeyword(keyword)) {
              allKeywords.push({
                keyword: keyword,
                source: 'reddit',
                subreddit: subreddit,
                upvotes: post.data.ups,
                category: 'technology',
                timestamp: new Date().toISOString()
              });
            }
          });
        });
      }

      return allKeywords;
    } catch (error) {
      console.error('Error fetching Reddit keywords:', error.message);
      return [];
    }
  }

  // 關鍵字相關性檢測
  isRelevantTechKeyword(keyword) {
    const techKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'javascript', 'python', 'react', 'nodejs', 'typescript',
      'blockchain', 'web3', 'crypto', 'nft',
      'cloud', 'aws', 'azure', 'kubernetes', 'docker',
      'cybersecurity', 'privacy', 'quantum',
      'startup', 'fintech', 'saas', 'api',
      'frontend', 'backend', 'database', 'microservices',
      'mobile', 'ios', 'android', 'flutter',
      'data science', 'analytics', 'big data',
      'devops', 'cicd', 'automation',
      'framework', 'library', 'open source'
    ];

    const keywordLower = keyword.toLowerCase();
    return techKeywords.some(tech => 
      keywordLower.includes(tech) || tech.includes(keywordLower)
    ) && keyword.length > 2 && keyword.length < 50;
  }

  // 從標題提取關鍵字
  extractKeywordsFromTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // 限制每個標題最多5個關鍵字
  }

  // 合併和優化關鍵字
  async mergeAndOptimizeKeywords() {
    console.log('🔍 開始獲取動態關鍵字...');

    const [
      googleTrends,
      githubTrending,
      hackerNews,
      redditKeywords
    ] = await Promise.all([
      this.getGoogleTrendsKeywords(),
      this.getGitHubTrendingKeywords(),
      this.getHackerNewsKeywords(),
      this.getRedditTechKeywords()
    ]);

    // 合併所有關鍵字
    const allDynamicKeywords = [
      ...googleTrends,
      ...githubTrending,
      ...hackerNews,
      ...redditKeywords
    ];

    // 統計關鍵字頻率和權重
    const keywordStats = {};
    allDynamicKeywords.forEach(item => {
      const key = item.keyword.toLowerCase();
      if (!keywordStats[key]) {
        keywordStats[key] = {
          keyword: item.keyword,
          count: 0,
          sources: new Set(),
          totalScore: 0,
          categories: new Set(),
          firstSeen: item.timestamp
        };
      }
      
      keywordStats[key].count++;
      keywordStats[key].sources.add(item.source);
      keywordStats[key].totalScore += (item.traffic || item.score || item.upvotes || 1);
      keywordStats[key].categories.add(item.category);
    });

    // 排序並選擇前20個關鍵字
    const topKeywords = Object.values(keywordStats)
      .sort((a, b) => (b.count * b.totalScore) - (a.count * a.totalScore))
      .slice(0, 20)
      .map((item, index) => ({
        keyword: item.keyword,
        priority: Math.min(3, Math.floor(index / 7) + 1), // 分三個優先級
        category: Array.from(item.categories)[0],
        description: `動態關鍵字 - ${item.sources.size}個來源`,
        longTermFocus: item.count > 2,
        color: this.getColorForCategory(Array.from(item.categories)[0]),
        level: Math.min(3, Math.floor(index / 7) + 1),
        tags: Array.from(item.categories),
        dynamicScore: item.count * item.totalScore,
        sources: Array.from(item.sources),
        lastUpdated: new Date().toISOString()
      }));

    // 載入現有關鍵字
    let existingKeywords = [];
    if (fs.existsSync(this.keywordsFile)) {
      const existingData = JSON.parse(fs.readFileSync(this.keywordsFile, 'utf8'));
      existingKeywords = existingData.keywords || [];
    }

    // 合併靜態和動態關鍵字
    const mergedKeywords = [...existingKeywords];
    topKeywords.forEach(dynamicKeyword => {
      const existingIndex = mergedKeywords.findIndex(k => 
        k.keyword.toLowerCase() === dynamicKeyword.keyword.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // 更新現有關鍵字
        mergedKeywords[existingIndex] = {
          ...mergedKeywords[existingIndex],
          ...dynamicKeyword,
          isDynamic: true
        };
      } else {
        // 添加新關鍵字
        mergedKeywords.push({
          ...dynamicKeyword,
          isDynamic: true
        });
      }
    });

    // 保存動態關鍵字
    const dynamicKeywordsData = {
      keywords: topKeywords,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      stats: {
        totalSources: 4,
        totalKeywordsAnalyzed: allDynamicKeywords.length,
        selectedKeywords: topKeywords.length
      }
    };

    fs.writeFileSync(this.dynamicKeywordsFile, JSON.stringify(dynamicKeywordsData, null, 2));

    // 更新主關鍵字文件
    const existingMainData = fs.existsSync(this.keywordsFile) ? 
      JSON.parse(fs.readFileSync(this.keywordsFile, 'utf8')) : {};
    
    const updatedMainKeywords = {
      keywords: mergedKeywords,
      lastUpdated: new Date().toISOString(),
      version: "2.0",
      // 保持現有的配置結構
      categories: existingMainData.categories || {},
      sourceWeights: existingMainData.sourceWeights || {},
      articleTypePatterns: existingMainData.articleTypePatterns || {}
    };

    fs.writeFileSync(this.keywordsFile, JSON.stringify(updatedMainKeywords, null, 2));

    console.log(`✅ 成功獲取並合併 ${topKeywords.length} 個動態關鍵字`);
    console.log(`📊 分析了 ${allDynamicKeywords.length} 個來源關鍵字`);
    
    return topKeywords;
  }

  getColorForCategory(category) {
    const colors = {
      'technology': '#4ECDC4',
      'programming': '#3776AB',
      'business': '#F39C12',
      'science': '#9B59B6'
    };
    return colors[category] || '#95A5A6';
  }
}

module.exports = DynamicKeywordManager;

// 如果直接運行此文件
if (require.main === module) {
  (async () => {
    const manager = new DynamicKeywordManager();
    await manager.mergeAndOptimizeKeywords();
  })();
} 