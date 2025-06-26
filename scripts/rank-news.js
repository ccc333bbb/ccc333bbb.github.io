const fs = require('fs');
const path = require('path');

class NewsRanker {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.newsDir = path.join(this.dataDir, 'news');
    this.indexFile = path.join(this.dataDir, 'news-index.json');
    this.keywordsFile = path.join(this.dataDir, 'keywords.json');
    this.rankedIndexFile = path.join(this.dataDir, 'ranked-news-index.json');
  }

  async rankAllNews() {
    console.log('🚀 Starting news ranking process...');
    
    const keywordsData = JSON.parse(fs.readFileSync(this.keywordsFile, 'utf8'));
    const indexData = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
    
    const rankedIndex = {
      lastUpdated: new Date().toISOString(),
      top10: [],
      analysis: [],
      categories: {},
      keywords: {},
      sources: {},
      dailyRankings: []
    };

    // 處理每一天的新聞
    for (const dateInfo of indexData.dates) {
      const dailyRanking = await this.rankDailyNews(dateInfo.date, keywordsData);
      rankedIndex.dailyRankings.push(dailyRanking);
      
      // 收集所有文章用於全局排名
      dailyRanking.articles.forEach(article => {
        // 按分類統計
        const category = article.metadata?.keywordLevel ? `level${article.metadata.keywordLevel}` : 'general';
        if (!rankedIndex.categories[category]) {
          rankedIndex.categories[category] = [];
        }
        rankedIndex.categories[category].push(article);
        
        // 按關鍵詞統計
        if (article.keyword) {
          if (!rankedIndex.keywords[article.keyword]) {
            rankedIndex.keywords[article.keyword] = [];
          }
          rankedIndex.keywords[article.keyword].push(article);
        }
        
        // 按來源統計
        if (!rankedIndex.sources[article.source]) {
          rankedIndex.sources[article.source] = [];
        }
        rankedIndex.sources[article.source].push(article);
      });
    }

    // 生成全局 Top 10
    const allArticles = rankedIndex.dailyRankings.flatMap(d => d.articles);
    rankedIndex.top10 = this.getTop10(allArticles);
    
    // 生成深度分析文章列表
    rankedIndex.analysis = this.getAnalysisArticles(allArticles);
    
    // 排序各分類
    Object.keys(rankedIndex.categories).forEach(category => {
      rankedIndex.categories[category].sort((a, b) => 
        b.metadata.importance - a.metadata.importance
      );
    });

    // 保存排名結果
    fs.writeFileSync(this.rankedIndexFile, JSON.stringify(rankedIndex, null, 2));
    console.log(`✅ Ranked news index saved with ${allArticles.length} articles`);
    
    return rankedIndex;
  }

  async rankDailyNews(date, keywordsData) {
    const filePath = path.join(this.newsDir, `${date}.json`);
    
    if (!fs.existsSync(filePath)) {
      return { date, articles: [] };
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const articles = data.articles || [];

    // 為每篇文章添加排名信息
    const rankedArticles = articles.map(article => {
      const enhancedArticle = this.enhanceArticle(article, keywordsData);
      return enhancedArticle;
    });

    // 按重要性排序
    rankedArticles.sort((a, b) => b.metadata.importance - a.metadata.importance);

    // 標記 Top 10
    rankedArticles.slice(0, 10).forEach(article => {
      article.metadata.isTop10 = true;
    });

    // 更新文件
    const updatedData = {
      ...data,
      articles: rankedArticles,
      ranking: {
        totalArticles: rankedArticles.length,
        top10Count: Math.min(10, rankedArticles.length),
        analysisCount: rankedArticles.filter(a => a.metadata.isAnalysis).length,
        averageImportance: this.calculateAverageImportance(rankedArticles)
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    
    return {
      date,
      articles: rankedArticles,
      ranking: updatedData.ranking
    };
  }

  enhanceArticle(article, keywordsData) {
    // 如果文章還沒有元數據，添加它
    if (!article.metadata) {
      const metadata = {
        importance: this.calculateImportance(article, keywordsData),
        articleType: this.detectArticleType(article, keywordsData),
        readTime: this.estimateReadTime(article.title),
        complexity: this.assessComplexity(article, keywordsData),
        keywordLevel: this.getKeywordLevel(article.keyword, keywordsData),
        isAnalysis: this.isAnalysisArticle(article, keywordsData),
        isTop10: false
      };
      
      return { ...article, metadata };
    }
    
    return article;
  }

  calculateImportance(article, keywordsData) {
    let score = 0;
    
    // 來源權威性評分
    const sourceWeights = keywordsData.sourceWeights || {};
    score += sourceWeights[article.source] || 5;
    
    // 關鍵詞重要性
    if (article.keyword) {
      const keyword = keywordsData.keywords.find(k => k.keyword === article.keyword);
      if (keyword) {
        score += (11 - keyword.priority) * 2;
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
    
    // 標題長度加分
    if (article.title.length > 50) {
      score += 1;
    }
    
    return Math.min(10, Math.max(1, score));
  }

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

  estimateReadTime(title) {
    const wordCount = title.split(' ').length;
    const estimatedWords = wordCount * 20;
    return Math.max(1, Math.ceil(estimatedWords / 200));
  }

  assessComplexity(article, keywordsData) {
    const title = article.title.toLowerCase();
    
    const complexKeywords = ['quantum', 'algorithm', 'neural', 'blockchain', 'cryptography'];
    const hasComplexKeywords = complexKeywords.some(keyword => title.includes(keyword));
    
    const isAnalysis = this.isAnalysisArticle(article, keywordsData);
    
    if (hasComplexKeywords || isAnalysis) {
      return 'advanced';
    } else if (this.estimateReadTime(title) > 5) {
      return 'medium';
    } else {
      return 'basic';
    }
  }

  getKeywordLevel(keyword, keywordsData) {
    if (!keyword) return null;
    
    const keywordData = keywordsData.keywords.find(k => k.keyword === keyword);
    return keywordData?.level || null;
  }

  isAnalysisArticle(article, keywordsData) {
    const title = article.title.toLowerCase();
    const analysisPatterns = keywordsData.articleTypePatterns?.analysis || [];
    
    return analysisPatterns.some(pattern => title.includes(pattern.toLowerCase()));
  }

  getTop10(articles) {
    return articles
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, 10)
      .map(article => ({
        id: article.id,
        title: article.title,
        link: article.link,
        source: article.source,
        timestamp: article.timestamp,
        importance: article.metadata.importance,
        keyword: article.keyword,
        keywordLevel: article.metadata.keywordLevel
      }));
  }

  getAnalysisArticles(articles) {
    return articles
      .filter(article => article.metadata.isAnalysis)
      .sort((a, b) => b.metadata.importance - a.metadata.importance)
      .slice(0, 20)
      .map(article => ({
        id: article.id,
        title: article.title,
        link: article.link,
        source: article.source,
        timestamp: article.timestamp,
        importance: article.metadata.importance,
        keyword: article.keyword,
        readTime: article.metadata.readTime,
        complexity: article.metadata.complexity
      }));
  }

  calculateAverageImportance(articles) {
    if (articles.length === 0) return 0;
    const total = articles.reduce((sum, article) => sum + article.metadata.importance, 0);
    return Math.round((total / articles.length) * 10) / 10;
  }
}

// 執行排名
async function main() {
  const ranker = new NewsRanker();
  await ranker.rankAllNews();
  console.log('✅ News ranking completed!');
}

main().catch(console.error); 