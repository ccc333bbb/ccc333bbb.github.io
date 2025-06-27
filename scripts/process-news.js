const axios = require('axios');
const fs = require('fs');
const path = require('path');

class NewsProcessor {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.newsDir = path.join(this.dataDir, 'news');
        this.rankedIndexFile = path.join(this.dataDir, 'ranked-news-index.json');
        this.updateLogFile = path.join(this.dataDir, 'update-log.json');
    }

    // 獲取最新的新聞文件
    getLatestNewsFile() {
        const newsFiles = fs.readdirSync(this.newsDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a));
        
        return newsFiles.length > 0 ? newsFiles[0] : null;
    }

    // 加載關鍵詞數據
    loadKeywords() {
        try {
            const keywordsFile = path.join(this.dataDir, 'keywords.json');
            const dynamicKeywordsFile = path.join(this.dataDir, 'dynamic-keywords.json');
            
            let keywords = [];
            
            // 加載靜態關鍵詞
            if (fs.existsSync(keywordsFile)) {
                const keywordsData = JSON.parse(fs.readFileSync(keywordsFile, 'utf8'));
                keywords = keywords.concat(keywordsData.keywords || []);
            }
            
            // 加載動態關鍵詞
            if (fs.existsSync(dynamicKeywordsFile)) {
                const dynamicKeywordsData = JSON.parse(fs.readFileSync(dynamicKeywordsFile, 'utf8'));
                keywords = keywords.concat(dynamicKeywordsData.keywords || []);
            }
            
            return keywords;
        } catch (error) {
            console.warn('載入關鍵詞失敗:', error.message);
            return [];
        }
    }

    // 重新計算文章相關性分數
    recalculateRelevanceScores(articles, keywords) {
        return articles.map(article => {
            let score = article.weight || 5;
            const fullText = `${article.title} ${article.description}`.toLowerCase();
            
            // 基於關鍵詞的相關性評分
            keywords.forEach(keywordObj => {
                const keyword = keywordObj.keyword?.toLowerCase();
                if (keyword && fullText.includes(keyword)) {
                    score += (keywordObj.score || 1) * 0.5;
                }
            });
            
            // 時間新鮮度加權
            const hoursAgo = (new Date() - new Date(article.pubDate)) / (1000 * 60 * 60);
            const freshnessBonus = Math.max(0, 10 - hoursAgo * 0.2);
            
            // 來源權威性加權
            const sourceWeights = {
                'BBC News': 10,
                'Reuters': 10,
                'Associated Press': 9,
                'MIT Technology Review': 9,
                'TechCrunch': 8,
                'NPR Business': 8,
                'The Verge': 7,
                'Ars Technica': 7,
                'Wired': 7,
                'GitHub Blog': 7,
                'Engadget': 6,
                'Stack Overflow Blog': 6,
                'Dev.to': 6,
                'Science Daily': 8,
                'ABC News Business': 7,
                'Reddit Technology': 5,
                'Reddit Programming': 5,
                'Reddit World News': 6
            };
            
            const sourceBonus = sourceWeights[article.source] || 5;
            
            // 文章類型加權
            const typeWeights = {
                'analysis': 3,
                'news': 2,
                'opinion': 1,
                'tutorial': 2,
                'review': 2
            };
            
            const typeBonus = typeWeights[article.type] || 1;
            
            // 情感分析加權
            const sentimentBonus = article.sentiment === 'positive' ? 1 : 
                                 article.sentiment === 'negative' ? -0.5 : 0;
            
            const finalScore = score + freshnessBonus + sourceBonus + typeBonus + sentimentBonus;
            
            return {
                ...article,
                relevanceScore: Math.round(finalScore * 100) / 100,
                calculatedAt: new Date().toISOString()
            };
        });
    }

    // 文章分類和標籤優化
    enhanceArticleMetadata(articles) {
        return articles.map(article => {
            const enhanced = { ...article };
            
            // 增強標籤系統
            const additionalTags = this.extractAdditionalTags(article.title + ' ' + article.description);
            enhanced.tags = [...(article.tags || []), ...additionalTags].slice(0, 5);
            
            // 增強分類
            enhanced.category = this.refineCategory(article, enhanced.tags);
            
            // 添加推薦分數
            enhanced.recommendationScore = this.calculateRecommendationScore(article);
            
            // 添加閱讀難度
            enhanced.readingLevel = this.assessReadingLevel(article.title + ' ' + article.description);
            
            return enhanced;
        });
    }

    // 提取額外標籤
    extractAdditionalTags(text) {
        const lowerText = text.toLowerCase();
        const additionalTags = [];
        
        const tagPatterns = {
            'Breaking': /\b(breaking|urgent|alert|emergency)\b/i,
            'Exclusive': /\b(exclusive|first|scoop)\b/i,
            'Analysis': /\b(analysis|deep dive|investigation)\b/i,
            'Tutorial': /\b(how to|guide|tutorial|walkthrough)\b/i,
            'Interview': /\b(interview|Q&A|conversation)\b/i,
            'Report': /\b(report|study|survey|research)\b/i,
            'Launch': /\b(launch|release|announce|unveil)\b/i,
            'Update': /\b(update|patch|upgrade|new version)\b/i,
            'Acquisition': /\b(acquisition|merger|buyout|purchase)\b/i,
            'IPO': /\b(ipo|public|stock market)\b/i,
            'Funding': /\b(funding|investment|round|valuation)\b/i,
            'Partnership': /\b(partnership|collaboration|deal)\b/i,
            'Controversy': /\b(controversy|scandal|criticism|debate)\b/i,
            'Regulation': /\b(regulation|law|policy|compliance)\b/i,
            'Innovation': /\b(innovation|breakthrough|revolutionary)\b/i
        };
        
        Object.entries(tagPatterns).forEach(([tag, pattern]) => {
            if (pattern.test(lowerText)) {
                additionalTags.push(tag);
            }
        });
        
        return additionalTags;
    }

    // 精細化分類
    refineCategory(article, tags) {
        const title = article.title.toLowerCase();
        const description = article.description.toLowerCase();
        const fullText = title + ' ' + description;
        
        // 基於內容的分類規則
        const categoryRules = {
            'ai-ml': /\b(ai|artificial intelligence|machine learning|deep learning|neural network|chatgpt|gpt|llm)\b/i,
            'blockchain': /\b(blockchain|bitcoin|crypto|ethereum|nft|web3|defi)\b/i,
            'mobile': /\b(iphone|android|mobile|app|ios|smartphone)\b/i,
            'cloud': /\b(cloud|aws|azure|google cloud|kubernetes|docker|saas)\b/i,
            'cybersecurity': /\b(security|hack|breach|privacy|cyber|malware|phishing)\b/i,
            'startup': /\b(startup|funding|ipo|venture|unicorn|valuation)\b/i,
            'social': /\b(facebook|twitter|instagram|tiktok|social media|meta)\b/i,
            'gaming': /\b(gaming|game|esports|steam|playstation|xbox)\b/i,
            'automotive': /\b(tesla|electric vehicle|autonomous|self-driving|car)\b/i,
            'space': /\b(space|spacex|nasa|rocket|satellite|mars)\b/i,
            'health': /\b(health|medical|covid|vaccine|medicine|biotech)\b/i,
            'finance': /\b(finance|fintech|bank|payment|stock|market)\b/i,
            'climate': /\b(climate|environment|renewable|solar|wind|carbon)\b/i,
            'education': /\b(education|learning|university|school|course)\b/i,
            'entertainment': /\b(entertainment|movie|music|streaming|netflix)\b/i
        };
        
        for (const [category, pattern] of Object.entries(categoryRules)) {
            if (pattern.test(fullText)) {
                return category;
            }
        }
        
        return article.category || 'general';
    }

    // 計算推薦分數
    calculateRecommendationScore(article) {
        let score = 0;
        
        // 基礎分數
        score += article.relevanceScore || 0;
        
        // 社交指標模擬（基於標題吸引力）
        const title = article.title.toLowerCase();
        if (title.includes('new') || title.includes('first') || title.includes('launch')) score += 2;
        if (title.includes('vs') || title.includes('compared') || title.includes('better')) score += 1;
        if (title.includes('why') || title.includes('how') || title.includes('what')) score += 1.5;
        if (title.includes('best') || title.includes('worst') || title.includes('top')) score += 1;
        
        // 長度加權
        if (article.title.length > 50 && article.title.length < 100) score += 0.5;
        
        // 標籤加權
        const premiumTags = ['Breaking', 'Exclusive', 'Analysis'];
        premiumTags.forEach(tag => {
            if (article.tags && article.tags.includes(tag)) score += 2;
        });
        
        return Math.round(score * 100) / 100;
    }

    // 評估閱讀難度
    assessReadingLevel(text) {
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        const complexWords = text.split(/\s+/).filter(word => word.length > 6).length;
        
        // 簡化的閱讀難度評估
        const avgWordsPerSentence = words / Math.max(sentences, 1);
        const complexWordRatio = complexWords / Math.max(words, 1);
        
        if (avgWordsPerSentence > 20 || complexWordRatio > 0.3) return 'advanced';
        if (avgWordsPerSentence > 15 || complexWordRatio > 0.2) return 'intermediate';
        return 'beginner';
    }

    // 創建排名索引
    createRankedIndex(articles) {
        // 按相關性分數排序
        const sortedArticles = [...articles].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        
        // 創建分類索引
        const categoryIndex = {};
        sortedArticles.forEach(article => {
            const category = article.category || 'general';
            if (!categoryIndex[category]) {
                categoryIndex[category] = [];
            }
            categoryIndex[category].push({
                title: article.title,
                link: article.link,
                source: article.source,
                pubDate: article.pubDate,
                relevanceScore: article.relevanceScore,
                tags: article.tags
            });
        });
        
        // 限制每個分類的文章數量
        Object.keys(categoryIndex).forEach(category => {
            categoryIndex[category] = categoryIndex[category].slice(0, 20);
        });
        
        return {
            lastUpdated: new Date().toISOString(),
            totalArticles: sortedArticles.length,
            categories: Object.keys(categoryIndex),
            topArticles: sortedArticles.slice(0, 50).map(article => ({
                title: article.title,
                link: article.link,
                source: article.source,
                category: article.category,
                pubDate: article.pubDate,
                relevanceScore: article.relevanceScore,
                recommendationScore: article.recommendationScore,
                tags: article.tags,
                readingLevel: article.readingLevel
            })),
            categoryIndex: categoryIndex,
            stats: {
                totalSources: [...new Set(sortedArticles.map(a => a.source))].length,
                totalCategories: Object.keys(categoryIndex).length,
                avgRelevanceScore: sortedArticles.reduce((sum, a) => sum + (a.relevanceScore || 0), 0) / sortedArticles.length,
                topCategories: Object.entries(categoryIndex)
                    .sort((a, b) => b[1].length - a[1].length)
                    .slice(0, 5)
                    .map(([cat, articles]) => ({ category: cat, count: articles.length }))
            }
        };
    }

    // 記錄更新日誌
    logUpdate(operation, details) {
        let updateLog = { updates: [] };
        
        if (fs.existsSync(this.updateLogFile)) {
            updateLog = JSON.parse(fs.readFileSync(this.updateLogFile, 'utf8'));
        }
        
        updateLog.updates.unshift({
            timestamp: new Date().toISOString(),
            operation: operation,
            details: details
        });
        
        // 保留最近100條記錄
        updateLog.updates = updateLog.updates.slice(0, 100);
        updateLog.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(this.updateLogFile, JSON.stringify(updateLog, null, 2));
    }

    // 主處理函數
    async processLatestNews() {
        console.log('🔄 開始處理最新新聞...');
        
        try {
            // 獲取最新新聞文件
            const latestFile = this.getLatestNewsFile();
            if (!latestFile) {
                console.log('❌ 沒有找到新聞文件');
                return;
            }
            
            console.log(`📄 處理文件: ${latestFile}`);
            
            // 載入新聞數據
            const newsFilePath = path.join(this.newsDir, latestFile);
            const newsData = JSON.parse(fs.readFileSync(newsFilePath, 'utf8'));
            
            if (!newsData.articles || newsData.articles.length === 0) {
                console.log('❌ 新聞文件中沒有文章');
                return;
            }
            
            console.log(`📊 原始文章數: ${newsData.articles.length}`);
            
            // 載入關鍵詞
            const keywords = this.loadKeywords();
            console.log(`🔑 載入關鍵詞數: ${keywords.length}`);
            
            // 重新計算相關性分數
            let processedArticles = this.recalculateRelevanceScores(newsData.articles, keywords);
            console.log('✅ 完成相關性分數計算');
            
            // 增強文章元數據
            processedArticles = this.enhanceArticleMetadata(processedArticles);
            console.log('✅ 完成元數據增強');
            
            // 創建排名索引
            const rankedIndex = this.createRankedIndex(processedArticles);
            console.log('✅ 完成排名索引創建');
            
            // 保存排名索引
            fs.writeFileSync(this.rankedIndexFile, JSON.stringify(rankedIndex, null, 2));
            console.log(`💾 已保存排名索引到 ranked-news-index.json`);
            
            // 更新原始新聞文件
            const updatedNewsData = {
                ...newsData,
                articles: processedArticles,
                processedAt: new Date().toISOString(),
                processingVersion: '2.0'
            };
            
            fs.writeFileSync(newsFilePath, JSON.stringify(updatedNewsData, null, 2));
            console.log(`💾 已更新原始新聞文件`);
            
            // 記錄更新日誌
            this.logUpdate('process-news', {
                file: latestFile,
                totalArticles: processedArticles.length,
                avgRelevanceScore: rankedIndex.stats.avgRelevanceScore,
                categoriesCount: rankedIndex.stats.totalCategories,
                sourcesCount: rankedIndex.stats.totalSources
            });
            
            console.log('✅ 新聞處理完成！');
            console.log(`📈 平均相關性分數: ${rankedIndex.stats.avgRelevanceScore.toFixed(2)}`);
            console.log(`📊 分類數: ${rankedIndex.stats.totalCategories}`);
            console.log(`🎯 來源數: ${rankedIndex.stats.totalSources}`);
            
            return {
                success: true,
                totalArticles: processedArticles.length,
                rankedIndex: rankedIndex
            };
            
        } catch (error) {
            console.error('❌ 處理新聞時出錯:', error.message);
            
            this.logUpdate('process-news-error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 主函數
async function main() {
    const processor = new NewsProcessor();
    const result = await processor.processLatestNews();
    
    if (result.success) {
        console.log('🎉 新聞處理成功完成！');
    } else {
        console.error('💥 新聞處理失敗:', result.error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewsProcessor; 