const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

class RSSNewsAggregator {
    constructor() {
        this.parser = new Parser({
            customFields: {
                item: [['description', 'description'], ['pubDate', 'pubDate'], ['content', 'content']]
            }
        });
        this.dataDir = path.join(__dirname, '../../../data');
        this.newsDir = path.join(this.dataDir, 'news');
        this.indexFile = path.join(this.dataDir, 'news-index.json');
        this.searchIndexFile = path.join(this.dataDir, 'search-index.json');
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.dataDir, this.newsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // 免費RSS新聞源配置
    getNewsSources() {
        return [
            // 國際權威媒體 RSS
            {
                name: 'BBC News',
                url: 'http://feeds.bbci.co.uk/news/rss.xml',
                category: 'general',
                weight: 10,
                limit: 5
            },
            {
                name: 'BBC Technology',
                url: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
                category: 'tech',
                weight: 9,
                limit: 4
            },
            {
                name: 'Reuters',
                url: 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best',
                category: 'general',
                weight: 10,
                limit: 4
            },
            {
                name: 'Associated Press',
                url: 'https://feeds.apnews.com/index.rss',
                category: 'general',
                weight: 9,
                limit: 4
            },

            // 科技媒體 RSS
            {
                name: 'TechCrunch',
                url: 'https://techcrunch.com/feed/',
                category: 'tech',
                weight: 8,
                limit: 5
            },
            {
                name: 'The Verge',
                url: 'https://www.theverge.com/rss/index.xml',
                category: 'tech',
                weight: 7,
                limit: 4
            },
            {
                name: 'Ars Technica',
                url: 'https://feeds.arstechnica.com/arstechnica/index',
                category: 'tech',
                weight: 7,
                limit: 4
            },
            {
                name: 'Wired',
                url: 'https://www.wired.com/feed/rss',
                category: 'tech',
                weight: 7,
                limit: 4
            },
            {
                name: 'Engadget',
                url: 'https://www.engadget.com/rss.xml',
                category: 'tech',
                weight: 6,
                limit: 4
            },

            // 商業和財經 RSS
            {
                name: 'NPR Business',
                url: 'https://feeds.npr.org/1006/rss.xml',
                category: 'business',
                weight: 8,
                limit: 3
            },
            {
                name: 'ABC News Business',
                url: 'https://abcnews.go.com/abcnews/businessheadlines',
                category: 'business',
                weight: 7,
                limit: 3
            },

            // 開發者和技術社區 RSS
            {
                name: 'GitHub Blog',
                url: 'https://github.blog/feed/',
                category: 'development',
                weight: 7,
                limit: 3
            },
            {
                name: 'Stack Overflow Blog',
                url: 'https://stackoverflow.blog/feed/',
                category: 'development',
                weight: 6,
                limit: 3
            },
            {
                name: 'Dev.to',
                url: 'https://dev.to/feed',
                category: 'development',
                weight: 6,
                limit: 3
            },

            // 科學和研究 RSS
            {
                name: 'Science Daily',
                url: 'https://www.sciencedaily.com/rss/computers_math/computer_science/artificial_intelligence.xml',
                category: 'science',
                weight: 8,
                limit: 3
            },
            {
                name: 'MIT Technology Review',
                url: 'https://www.technologyreview.com/feed/',
                category: 'science',
                weight: 9,
                limit: 3
            },

            // Reddit RSS (免費且無需API)
            {
                name: 'Reddit Technology',
                url: 'https://www.reddit.com/r/technology/.rss',
                category: 'tech',
                weight: 5,
                limit: 3
            },
            {
                name: 'Reddit Programming',
                url: 'https://www.reddit.com/r/programming/.rss',
                category: 'development',
                weight: 5,
                limit: 3
            },
            {
                name: 'Reddit World News',
                url: 'https://www.reddit.com/r/worldnews/.rss',
                category: 'world',
                weight: 6,
                limit: 3
            }
        ];
    }

    // 獲取單個RSS源的新聞
    async fetchRSSFeed(source) {
        try {
            console.log(`🔍 正在獲取 ${source.name} 的新聞...`);
            
            const feed = await this.parser.parseURL(source.url);
            const articles = [];
            
            const itemsToProcess = feed.items.slice(0, source.limit || 5);
            
            for (const item of itemsToProcess) {
                try {
                    const article = this.processRSSItem(item, source);
                    if (article && this.isRecentArticle(article.pubDate)) {
                        articles.push(article);
                    }
                } catch (error) {
                    console.warn(`處理文章時出錯 (${source.name}):`, error.message);
                }
            }
            
            console.log(`✅ ${source.name}: 獲取到 ${articles.length} 篇文章`);
            return articles;
            
        } catch (error) {
            console.error(`❌ 獲取 ${source.name} 失敗:`, error.message);
            return [];
        }
    }

    // 處理RSS條目
    processRSSItem(item, source) {
        // 提取文章基本信息
        const title = item.title?.trim() || '';
        const link = item.link || item.guid || '';
        const description = this.extractDescription(item);
        const pubDate = this.parseDate(item.pubDate || item.isoDate);
        
        if (!title || !link) {
            return null;
        }

        // 生成文章ID
        const id = this.generateArticleId(title, link);
        
        // 創建文章對象
        const article = {
            id,
            title,
            link,
            description,
            pubDate: pubDate.toISOString(),
            source: source.name,
            category: source.category,
            weight: source.weight,
            content: this.extractContent(item),
            author: item.author || item.creator || source.name,
            
            // 添加智能元數據
            ...this.addSmartMetadata(title, description, source)
        };

        return article;
    }

    // 提取描述文本
    extractDescription(item) {
        let description = '';
        
        if (item.description) {
            description = item.description;
        } else if (item.summary) {
            description = item.summary;
        } else if (item.content) {
            description = item.content;
        } else if (item['content:encoded']) {
            description = item['content:encoded'];
        }
        
        // 清理HTML標籤
        return this.stripHtml(description).substring(0, 300);
    }

    // 提取內容
    extractContent(item) {
        let content = '';
        
        if (item['content:encoded']) {
            content = item['content:encoded'];
        } else if (item.content) {
            content = item.content;
        } else if (item.description) {
            content = item.description;
        }
        
        return this.stripHtml(content).substring(0, 500);
    }

    // 清理HTML標籤
    stripHtml(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    // 解析日期
    parseDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            return new Date(dateString);
        } catch (error) {
            return new Date();
        }
    }

    // 檢查文章是否為最近24小時內
    isRecentArticle(pubDate, hoursLimit = 48) {
        const articleDate = new Date(pubDate);
        const now = new Date();
        const diffHours = (now - articleDate) / (1000 * 60 * 60);
        return diffHours <= hoursLimit;
    }

    // 生成文章ID
    generateArticleId(title, link) {
        const combined = `${title}-${link}`;
        return Buffer.from(combined).toString('base64').substring(0, 16);
    }

    // 添加智能元數據
    addSmartMetadata(title, description, source) {
        const fullText = `${title} ${description}`.toLowerCase();
        
        return {
            readTime: this.estimateReadTime(title + ' ' + description),
            importance: this.calculateImportance(fullText, source),
            tags: this.extractTags(fullText),
            sentiment: this.analyzeSentiment(fullText),
            complexity: this.assessComplexity(fullText),
            type: this.detectArticleType(fullText)
        };
    }

    // 估算閱讀時間
    estimateReadTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    // 計算重要性分數
    calculateImportance(text, source) {
        let score = source.weight || 5;
        
        // 關鍵詞加權
        const importantKeywords = [
            'breaking', 'urgent', 'exclusive', 'first', 'new', 'launch',
            'ai', 'artificial intelligence', 'breakthrough', 'innovation',
            'crisis', 'emergency', 'alert', 'warning', 'critical'
        ];
        
        importantKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 2;
            }
        });
        
        return Math.min(10, score);
    }

    // 提取標籤
    extractTags(text) {
        const tags = [];
        const tagPatterns = {
            'AI': /\b(ai|artificial intelligence|machine learning|deep learning)\b/i,
            'Tech': /\b(tech|technology|software|hardware|digital)\b/i,
            'Business': /\b(business|economy|market|finance|investment)\b/i,
            'Science': /\b(science|research|study|discovery|breakthrough)\b/i,
            'Security': /\b(security|privacy|cyber|hack|breach)\b/i,
            'Mobile': /\b(mobile|smartphone|iphone|android|app)\b/i,
            'Web': /\b(web|website|browser|internet|online)\b/i,
            'Cloud': /\b(cloud|aws|azure|google cloud|saas)\b/i,
            'Startup': /\b(startup|funding|ipo|venture|investor)\b/i,
            'Social': /\b(social|facebook|twitter|instagram|tiktok)\b/i
        };
        
        Object.entries(tagPatterns).forEach(([tag, pattern]) => {
            if (pattern.test(text)) {
                tags.push(tag);
            }
        });
        
        return tags.slice(0, 3); // 最多3個標籤
    }

    // 簡單的情感分析
    analyzeSentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'breakthrough', 'success', 'win', 'growth', 'improve'];
        const negativeWords = ['bad', 'terrible', 'crisis', 'problem', 'issue', 'fail', 'decline', 'drop', 'concern', 'risk'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveWords.forEach(word => {
            if (text.includes(word)) positiveCount++;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) negativeCount++;
        });
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    // 評估複雜度
    assessComplexity(text) {
        const technicalTerms = [
            'algorithm', 'api', 'framework', 'protocol', 'architecture',
            'database', 'encryption', 'blockchain', 'kubernetes', 'docker'
        ];
        
        let complexityScore = 0;
        technicalTerms.forEach(term => {
            if (text.includes(term)) complexityScore++;
        });
        
        if (complexityScore >= 3) return 'high';
        if (complexityScore >= 1) return 'medium';
        return 'low';
    }

    // 檢測文章類型
    detectArticleType(text) {
        const typePatterns = {
            'news': /\b(report|announce|reveal|confirm|statement)\b/i,
            'analysis': /\b(analysis|examine|study|research|investigate)\b/i,
            'opinion': /\b(opinion|think|believe|argue|perspective)\b/i,
            'tutorial': /\b(how to|guide|tutorial|step|learn)\b/i,
            'review': /\b(review|test|compare|evaluation)\b/i
        };
        
        for (const [type, pattern] of Object.entries(typePatterns)) {
            if (pattern.test(text)) {
                return type;
            }
        }
        
        return 'news';
    }

    // 去重處理
    deduplicateArticles(articles) {
        const seen = new Set();
        const uniqueArticles = [];
        
        articles.forEach(article => {
            // 使用標題的前50個字符作為去重依據
            const titleKey = article.title.substring(0, 50).toLowerCase();
            
            if (!seen.has(titleKey)) {
                seen.add(titleKey);
                uniqueArticles.push(article);
            }
        });
        
        return uniqueArticles;
    }

    // 根據關鍵詞過濾和排序
    async filterAndRankArticles(articles) {
        try {
            // 嘗試讀取關鍵詞文件
            const keywordsPath = path.join(this.dataDir, 'keywords.json');
            let keywords = [];
            
            if (fs.existsSync(keywordsPath)) {
                const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
                keywords = keywordsData.keywords || [];
            }

            // 為每篇文章計算相關性分數
            articles.forEach(article => {
                let relevanceScore = article.importance || 5;
                const fullText = `${article.title} ${article.description}`.toLowerCase();
                
                // 基於關鍵詞的相關性評分
                keywords.forEach(keywordObj => {
                    const keyword = keywordObj.keyword?.toLowerCase();
                    if (keyword && fullText.includes(keyword)) {
                        relevanceScore += (keywordObj.score || 1);
                    }
                });
                
                // 時間新鮮度加權
                const hoursAgo = (new Date() - new Date(article.pubDate)) / (1000 * 60 * 60);
                const freshnessBonus = Math.max(0, 5 - hoursAgo * 0.5);
                
                article.relevanceScore = relevanceScore + freshnessBonus;
            });

            // 排序：相關性分數降序
            return articles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
            
        } catch (error) {
            console.warn('排序時出錯:', error.message);
            // 降級到簡單的時間排序
            return articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        }
    }

    // 保存日報數據
    async saveDailyNews(articles, date = new Date()) {
        const dateString = date.toISOString().split('T')[0];
        const filePath = path.join(this.newsDir, `${dateString}.json`);
        
        const newsData = {
            date: dateString,
            lastUpdated: new Date().toISOString(),
            totalArticles: articles.length,
            articles: articles,
            sources: [...new Set(articles.map(a => a.source))],
            categories: [...new Set(articles.map(a => a.category))]
        };
        
        fs.writeFileSync(filePath, JSON.stringify(newsData, null, 2));
        console.log(`💾 已保存 ${articles.length} 篇文章到 ${dateString}.json`);
        
        return filePath;
    }

    // 更新索引文件
    async updateNewsIndex() {
        try {
            const newsFiles = fs.readdirSync(this.newsDir)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)); // 最新日期在前
            
            const index = [];
            
            for (const file of newsFiles.slice(0, 30)) { // 保留最近30天
                const filePath = path.join(this.newsDir, file);
                const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                index.push({
                    date: newsData.date,
                    file: file,
                    totalArticles: newsData.totalArticles,
                    lastUpdated: newsData.lastUpdated,
                    sources: newsData.sources,
                    categories: newsData.categories,
                    topArticles: newsData.articles
                        .slice(0, 5)
                        .map(article => ({
                            title: article.title,
                            source: article.source,
                            link: article.link,
                            relevanceScore: article.relevanceScore
                        }))
                });
            }
            
            const indexData = {
                lastUpdated: new Date().toISOString(),
                totalDays: index.length,
                index: index
            };
            
            fs.writeFileSync(this.indexFile, JSON.stringify(indexData, null, 2));
            console.log(`📇 已更新新聞索引，包含 ${index.length} 天的數據`);
            
        } catch (error) {
            console.error('更新索引時出錯:', error.message);
        }
    }

    // 構建搜索索引
    async buildSearchIndex() {
        try {
            const searchIndex = {};
            const newsFiles = fs.readdirSync(this.newsDir)
                .filter(file => file.endsWith('.json'))
                .slice(0, 7); // 最近7天
            
            for (const file of newsFiles) {
                const filePath = path.join(this.newsDir, file);
                const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                newsData.articles.forEach(article => {
                    const words = this.extractWords(`${article.title} ${article.description}`);
                    
                    words.forEach(word => {
                        if (word.length > 2) {
                            if (!searchIndex[word]) {
                                searchIndex[word] = [];
                            }
                            
                            searchIndex[word].push({
                                title: article.title,
                                link: article.link,
                                source: article.source,
                                date: article.pubDate,
                                relevance: this.calculateWordRelevance(word, article)
                            });
                        }
                    });
                });
            }
            
            // 排序每個詞的結果
            Object.keys(searchIndex).forEach(word => {
                searchIndex[word] = searchIndex[word]
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(0, 20); // 每個詞最多20個結果
            });
            
            const searchData = {
                lastUpdated: new Date().toISOString(),
                totalWords: Object.keys(searchIndex).length,
                index: searchIndex
            };
            
            fs.writeFileSync(this.searchIndexFile, JSON.stringify(searchData, null, 2));
            console.log(`🔍 已構建搜索索引，包含 ${Object.keys(searchIndex).length} 個詞條`);
            
        } catch (error) {
            console.error('構建搜索索引時出錯:', error.message);
        }
    }

    extractWords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    calculateWordRelevance(word, article) {
        const titleWeight = 3;
        const descWeight = 1;
        let relevance = 0;
        
        const titleCount = (article.title.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        const descCount = (article.description.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        
        relevance = titleCount * titleWeight + descCount * descWeight;
        relevance += article.relevanceScore || 0;
        
        return relevance;
    }

    // 主執行函數
    async fetchAllNews() {
        console.log('🚀 開始RSS新聞聚合...');
        const startTime = Date.now();
        
        const sources = this.getNewsSources();
        const allArticles = [];
        
        // 並行獲取所有RSS源
        const promises = sources.map(source => this.fetchRSSFeed(source));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allArticles.push(...result.value);
            } else {
                console.error(`❌ ${sources[index].name} 獲取失敗:`, result.reason?.message);
            }
        });
        
        console.log(`📊 總共獲取到 ${allArticles.length} 篇原始文章`);
        
        // 去重
        const uniqueArticles = this.deduplicateArticles(allArticles);
        console.log(`🔄 去重後剩餘 ${uniqueArticles.length} 篇文章`);
        
        // 過濾和排序
        const rankedArticles = await this.filterAndRankArticles(uniqueArticles);
        console.log(`📈 完成智能排序和相關性評分`);
        
        // 保存數據
        await this.saveDailyNews(rankedArticles);
        await this.updateNewsIndex();
        await this.buildSearchIndex();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ RSS新聞聚合完成！`);
        console.log(`⏱️  總耗時: ${duration}秒`);
        console.log(`📰 最終文章數: ${rankedArticles.length}`);
        console.log(`🎯 涵蓋來源: ${sources.length}個`);
        
        return {
            success: true,
            totalArticles: rankedArticles.length,
            sources: sources.length,
            duration: duration,
            articles: rankedArticles.slice(0, 10) // 返回前10篇用於預覽
        };
    }
}

// 主函數
async function main() {
    const aggregator = new RSSNewsAggregator();
    const result = await aggregator.fetchAllNews();
    console.log('🎉 新聞聚合結果:', result);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RSSNewsAggregator; 