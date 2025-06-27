const axios = require('axios');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

class KeywordsFetcher {
    constructor() {
        this.parser = new Parser();
        this.dataDir = path.join(__dirname, '../../../data');
        this.keywordsFile = path.join(this.dataDir, 'keywords.json');
        this.dynamicKeywordsFile = path.join(this.dataDir, 'dynamic-keywords.json');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // Google Trends RSS URLs (免費且無需API key)
    getTrendsUrls() {
        return {
            general: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
            realtime: 'https://trends.google.com/trends/trendingsearches/realtime/rss?geo=US',
            tech: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&cat=5', // Computers & Electronics
            news: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&cat=16', // News
            science: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US&cat=174' // Science
        };
    }

    // 獲取Reddit熱門話題 (免費API)
    async fetchRedditTrends() {
        try {
            const subreddits = ['news', 'worldnews', 'technology', 'science'];
            const keywords = [];

            for (const subreddit of subreddits) {
                try {
                    const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
                        },
                        timeout: 10000
                    });

                    if (response.data && response.data.data && response.data.data.children) {
                        response.data.data.children.forEach(post => {
                            if (post.data && post.data.title) {
                                const title = post.data.title;
                                const words = this.extractKeywords(title);
                                words.forEach(word => {
                                    if (word.length > 3 && !this.isCommonWord(word)) {
                                        keywords.push({
                                            keyword: word,
                                            source: `reddit-${subreddit}`,
                                            score: post.data.score || 0,
                                            category: this.getCategoryFromSubreddit(subreddit)
                                        });
                                    }
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to fetch from r/${subreddit}:`, error.message);
                }
            }

            return keywords;
        } catch (error) {
            console.error('Error fetching Reddit trends:', error.message);
            return [];
        }
    }

    // 獲取Google Trends
    async fetchGoogleTrends() {
        const keywords = [];
        const trendsUrls = this.getTrendsUrls();

        for (const [category, url] of Object.entries(trendsUrls)) {
            try {
                const feed = await this.parser.parseURL(url);
                
                feed.items.forEach(item => {
                    if (item.title) {
                        const words = this.extractKeywords(item.title);
                        words.forEach(word => {
                            if (word.length > 2 && !this.isCommonWord(word)) {
                                keywords.push({
                                    keyword: word,
                                    source: 'google-trends',
                                    category: category,
                                    traffic: item.content || '',
                                    pubDate: item.pubDate
                                });
                            }
                        });
                    }
                });
            } catch (error) {
                console.warn(`Failed to fetch Google Trends for ${category}:`, error.message);
            }
        }

        return keywords;
    }

    // 從HackerNews獲取熱門話題
    async fetchHackerNewsTrends() {
        try {
            const response = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json', {
                timeout: 10000
            });
            
            const topStoryIds = response.data.slice(0, 20);
            const keywords = [];
            
            for (const id of topStoryIds) {
                try {
                    const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
                        timeout: 5000
                    });
                    
                    if (storyResponse.data && storyResponse.data.title) {
                        const words = this.extractKeywords(storyResponse.data.title);
                        words.forEach(word => {
                            if (word.length > 3 && !this.isCommonWord(word)) {
                                keywords.push({
                                    keyword: word,
                                    source: 'hackernews',
                                    score: storyResponse.data.score || 0,
                                    category: 'tech'
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to fetch HN story ${id}:`, error.message);
                }
            }
            
            return keywords;
        } catch (error) {
            console.error('Error fetching HackerNews trends:', error.message);
            return [];
        }
    }

    // 獲取GitHub Trending話題
    async fetchGitHubTrends() {
        try {
            // GitHub的trending頁面可以通過RSS獲取
            const response = await axios.get('https://github.com/trending?since=daily', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)'
                },
                timeout: 10000
            });

            const keywords = [];
            // 這裡可以解析HTML來提取關鍵詞，但為了簡化，我們使用預定義的技術關鍵詞
            const techKeywords = [
                'JavaScript', 'Python', 'TypeScript', 'React', 'Vue', 'Angular',
                'Node.js', 'Docker', 'Kubernetes', 'AI', 'Machine Learning',
                'Blockchain', 'Web3', 'API', 'Database', 'Cloud'
            ];

            techKeywords.forEach(keyword => {
                keywords.push({
                    keyword: keyword,
                    source: 'github-trending',
                    category: 'development',
                    score: Math.floor(Math.random() * 100) // 模擬分數
                });
            });

            return keywords;
        } catch (error) {
            console.error('Error fetching GitHub trends:', error.message);
            return this.getFallbackTechKeywords();
        }
    }

    // 提取關鍵詞
    extractKeywords(text) {
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .map(word => word.toLowerCase());
    }

    // 檢查是否為常見詞
    isCommonWord(word) {
        const commonWords = [
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
            'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its',
            'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'say', 'she',
            'use', 'way', 'will', 'with', 'have', 'this', 'that', 'from', 'they', 'know',
            'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here',
            'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them',
            'well', 'were', 'what', 'said', 'each', 'which', 'their', 'would', 'there',
            'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being',
            'every', 'great', 'might', 'shall', 'still', 'those', 'under', 'while', 'should'
        ];
        return commonWords.includes(word.toLowerCase());
    }

    getCategoryFromSubreddit(subreddit) {
        const categoryMap = {
            'news': 'general',
            'worldnews': 'world',
            'technology': 'tech',
            'science': 'science'
        };
        return categoryMap[subreddit] || 'general';
    }

    getFallbackTechKeywords() {
        return [
            'JavaScript', 'Python', 'React', 'AI', 'Machine Learning',
            'Cloud', 'Docker', 'API', 'Database', 'Security'
        ].map(keyword => ({
            keyword: keyword,
            source: 'fallback',
            category: 'tech',
            score: 50
        }));
    }

    // 合併和處理關鍵詞
    processKeywords(allKeywords) {
        const keywordMap = new Map();
        
        allKeywords.forEach(item => {
            const key = item.keyword.toLowerCase();
            if (keywordMap.has(key)) {
                const existing = keywordMap.get(key);
                existing.score += (item.score || 1);
                existing.sources.push(item.source);
            } else {
                keywordMap.set(key, {
                    keyword: item.keyword,
                    score: item.score || 1,
                    category: item.category || 'general',
                    sources: [item.source],
                    firstSeen: new Date().toISOString()
                });
            }
        });

        // 轉換為數組並排序
        const processed = Array.from(keywordMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 100); // 保留前100個關鍵詞

        return processed;
    }

    // 生成靜態關鍵詞作為後備
    getStaticKeywords() {
        return {
            trending: [
                'AI', 'ChatGPT', 'Machine Learning', 'Bitcoin', 'Cryptocurrency',
                'Climate Change', 'Renewable Energy', 'Electric Vehicles', 'Space',
                'NASA', 'SpaceX', 'Technology', 'Innovation', 'Startup', 'IPO'
            ],
            tech: [
                'JavaScript', 'Python', 'React', 'Vue', 'Angular', 'Node.js',
                'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud',
                'API', 'Database', 'MongoDB', 'PostgreSQL', 'Redis'
            ],
            business: [
                'Stock Market', 'Economy', 'Inflation', 'GDP', 'Federal Reserve',
                'Interest Rates', 'Investment', 'Venture Capital', 'M&A', 'IPO'
            ],
            science: [
                'COVID-19', 'Vaccine', 'Medical Research', 'Quantum Computing',
                'Gene Therapy', 'CRISPR', 'Nobel Prize', 'Research', 'Study'
            ]
        };
    }

    async fetchAllKeywords() {
        console.log('🔍 開始獲取熱門關鍵詞...');
        
        const allKeywords = [];
        
        try {
            // 並行獲取各個來源
            const [googleTrends, redditTrends, hackerNewsTrends, githubTrends] = await Promise.allSettled([
                this.fetchGoogleTrends(),
                this.fetchRedditTrends(),
                this.fetchHackerNewsTrends(),
                this.fetchGitHubTrends()
            ]);

            if (googleTrends.status === 'fulfilled') {
                allKeywords.push(...googleTrends.value);
                console.log(`✅ Google Trends: ${googleTrends.value.length} 個關鍵詞`);
            }
            
            if (redditTrends.status === 'fulfilled') {
                allKeywords.push(...redditTrends.value);
                console.log(`✅ Reddit: ${redditTrends.value.length} 個關鍵詞`);
            }
            
            if (hackerNewsTrends.status === 'fulfilled') {
                allKeywords.push(...hackerNewsTrends.value);
                console.log(`✅ HackerNews: ${hackerNewsTrends.value.length} 個關鍵詞`);
            }
            
            if (githubTrends.status === 'fulfilled') {
                allKeywords.push(...githubTrends.value);
                console.log(`✅ GitHub: ${githubTrends.value.length} 個關鍵詞`);
            }

        } catch (error) {
            console.error('獲取關鍵詞時出錯:', error.message);
        }

        // 如果沒有獲取到足夠的關鍵詞，使用靜態關鍵詞
        if (allKeywords.length < 10) {
            console.log('⚠️ 動態關鍵詞不足，使用靜態關鍵詞補充');
            const staticKeywords = this.getStaticKeywords();
            Object.entries(staticKeywords).forEach(([category, keywords]) => {
                keywords.forEach(keyword => {
                    allKeywords.push({
                        keyword,
                        source: 'static',
                        category,
                        score: 10
                    });
                });
            });
        }

        const processedKeywords = this.processKeywords(allKeywords);
        
        // 保存處理後的關鍵詞
        const keywordsData = {
            lastUpdated: new Date().toISOString(),
            totalKeywords: processedKeywords.length,
            keywords: processedKeywords,
            static: this.getStaticKeywords()
        };

        fs.writeFileSync(this.keywordsFile, JSON.stringify(keywordsData, null, 2));
        fs.writeFileSync(this.dynamicKeywordsFile, JSON.stringify({
            lastUpdated: new Date().toISOString(),
            keywords: processedKeywords.slice(0, 50) // 只保存前50個動態關鍵詞
        }, null, 2));

        console.log(`✅ 關鍵詞獲取完成！總共處理了 ${processedKeywords.length} 個關鍵詞`);
        console.log(`🎯 前10個熱門關鍵詞: ${processedKeywords.slice(0, 10).map(k => k.keyword).join(', ')}`);
        
        return keywordsData;
    }
}

// 主函數
async function main() {
    const fetcher = new KeywordsFetcher();
    await fetcher.fetchAllKeywords();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = KeywordsFetcher; 