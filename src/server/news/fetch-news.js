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

    // Configuration for free RSS news sources
    getNewsSources() {
        return [
            // International authoritative media RSS
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

            // Tech media RSS
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

            // Business and finance RSS
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

            // Developer and tech community RSS
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

            // Science and research RSS
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

            // Reddit RSS (free and no API key required)
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

    // Fetch news from a single RSS source
    async fetchRSSFeed(source) {
        try {
            console.log(`🔍 Fetching news from ${source.name}...`);
            
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
                    console.warn(`Error processing article from ${source.name}:`, error.message);
                }
            }
            
            console.log(`✅ ${source.name}: Fetched ${articles.length} articles`);
            return articles;
            
        } catch (error) {
            console.error(`❌ Failed to fetch ${source.name}:`, error.message);
            return [];
        }
    }

    // Process an RSS item
    processRSSItem(item, source) {
        // Extract basic article information
        const title = item.title?.trim() || '';
        const link = item.link || item.guid || '';
        const description = this.extractDescription(item);
        const pubDate = this.parseDate(item.pubDate || item.isoDate);
        
        if (!title || !link) {
            return null;
        }

        // Generate a unique article ID
        const id = this.generateArticleId(title, link);
        
        // Create the article object
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
            
            // Add smart metadata
            ...this.addSmartMetadata(title, description, source)
        };

        return article;
    }

    // Extract description text
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
        
        // Clean HTML tags and truncate
        return this.stripHtml(description).substring(0, 300);
    }

    // Extract content
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

    // Clean HTML tags
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

    // Parse date string
    parseDate(dateString) {
        if (!dateString) return new Date();
        
        try {
            return new Date(dateString);
        } catch (error) {
            return new Date();
        }
    }

    // Check if the article is from the last 48 hours
    isRecentArticle(pubDate, hoursLimit = 48) {
        const articleDate = new Date(pubDate);
        const now = new Date();
        const diffHours = (now - articleDate) / (1000 * 60 * 60);
        return diffHours <= hoursLimit;
    }

    // Generate a unique article ID
    generateArticleId(title, link) {
        const combined = `${title}-${link}`;
        return Buffer.from(combined).toString('base64').substring(0, 16);
    }

    // Add smart metadata
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

    // Estimate reading time
    estimateReadTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    // Calculate importance score
    calculateImportance(text, source) {
        let score = source.weight || 5;
        
        // Keyword weighting
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

    // Extract tags
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
        
        return tags.slice(0, 3); // Max 3 tags
    }

    // Simple sentiment analysis
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

    // Assess complexity
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

    // Detect article type
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

    // Deduplicate articles
    deduplicateArticles(articles) {
        const seen = new Set();
        const uniqueArticles = [];
        
        articles.forEach(article => {
            // Use the first 50 characters of the title as the deduplication key
            const titleKey = article.title.substring(0, 50).toLowerCase();
            
            if (!seen.has(titleKey)) {
                seen.add(titleKey);
                uniqueArticles.push(article);
            }
        });
        
        return uniqueArticles;
    }

    // Filter and rank articles by keywords
    async filterAndRankArticles(articles) {
        try {
            // Try to read the keywords file
            const keywordsPath = path.join(this.dataDir, 'keywords.json');
            let keywords = [];
            
            if (fs.existsSync(keywordsPath)) {
                const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
                keywords = keywordsData.keywords || [];
            }

            // Calculate relevance score for each article
            articles.forEach(article => {
                let relevanceScore = article.importance || 5;
                const fullText = `${article.title} ${article.description}`.toLowerCase();
                
                // Keyword-based relevance scoring
                keywords.forEach(keywordObj => {
                    const keyword = keywordObj.keyword?.toLowerCase();
                    if (keyword && fullText.includes(keyword)) {
                        relevanceScore += (keywordObj.score || 1);
                    }
                });
                
                // Time freshness weighting
                const hoursAgo = (new Date() - new Date(article.pubDate)) / (1000 * 60 * 60);
                const freshnessBonus = Math.max(0, 5 - hoursAgo * 0.5);
                
                article.relevanceScore = relevanceScore + freshnessBonus;
            });

            // Sort by relevance score, descending
            return articles.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
            
        } catch (error) {
            console.warn('Error during ranking:', error.message);
            // Fallback to simple time-based sorting
            return articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        }
    }

    // Save daily news data
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
        console.log(`💾 Saved ${articles.length} articles to ${dateString}.json`);
        
        return filePath;
    }

    // Update the index file
    async updateNewsIndex() {
        try {
            const newsFiles = fs.readdirSync(this.newsDir)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => b.localeCompare(a)); // Newest date first
            
            const index = [];
            
            for (const file of newsFiles.slice(0, 30)) { // Keep the last 30 days
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
            console.log(`📇 Updated news index with ${index.length} days of data`);
            
        } catch (error) {
            console.error('Error updating news index:', error.message);
        }
    }

    // Build the search index
    async buildSearchIndex() {
        try {
            const searchIndex = {};
            const newsFiles = fs.readdirSync(this.newsDir)
                .filter(file => file.endsWith('.json'))
                .slice(0, 7); // Last 7 days
            
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
            
            // Sort results for each word
            Object.keys(searchIndex).forEach(word => {
                searchIndex[word] = searchIndex[word]
                    .sort((a, b) => b.relevance - a.relevance)
                    .slice(0, 20); // Max 20 results per word
            });
            
            const searchData = {
                lastUpdated: new Date().toISOString(),
                totalWords: Object.keys(searchIndex).length,
                index: searchIndex
            };
            
            fs.writeFileSync(this.searchIndexFile, JSON.stringify(searchData, null, 2));
            console.log(`🔍 Built search index with ${Object.keys(searchIndex).length} words`);
            
        } catch (error) {
            console.error('Error building search index:', error.message);
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

    // Main execution function
    async fetchAllNews() {
        console.log('🚀 Starting RSS news aggregation...');
        const startTime = Date.now();
        
        const sources = this.getNewsSources();
        const allArticles = [];
        
        // Fetch all RSS sources in parallel
        const promises = sources.map(source => this.fetchRSSFeed(source));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allArticles.push(...result.value);
            } else {
                console.error(`❌ Failed to fetch ${sources[index].name}:`, result.reason?.message);
            }
        });
        
        console.log(`📊 Fetched a total of ${allArticles.length} raw articles`);
        
        // Deduplicate
        const uniqueArticles = this.deduplicateArticles(allArticles);
        console.log(`🔄 Remaining after deduplication: ${uniqueArticles.length} articles`);
        
        // Filter and rank
        const rankedArticles = await this.filterAndRankArticles(uniqueArticles);
        console.log(`📈 Completed smart sorting and relevance scoring`);
        
        // Save data
        await this.saveDailyNews(rankedArticles);
        await this.updateNewsIndex();
        await this.buildSearchIndex();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ RSS news aggregation complete!`);
        console.log(`⏱️  Total time: ${duration}s`);
        console.log(`📰 Final article count: ${rankedArticles.length}`);
        console.log(`🎯 Covered sources: ${sources.length}`);
        
        return {
            success: true,
            totalArticles: rankedArticles.length,
            sources: sources.length,
            duration: duration,
            articles: rankedArticles.slice(0, 10) // Return top 10 for preview
        };
    }
}

// Main function
async function main() {
    const aggregator = new RSSNewsAggregator();
    const result = await aggregator.fetchAllNews();
    console.log('🎉 News aggregation result:', result);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RSSNewsAggregator;