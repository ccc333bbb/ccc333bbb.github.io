const fs = require('fs');
const path = require('path');

class NewsProcessor {
    constructor() {
        this.dataDir = path.join(__dirname, '../../../data');
        this.newsDir = path.join(this.dataDir, 'news');
        this.rankedIndexFile = path.join(this.dataDir, 'ranked-news-index.json');
        this.updateLogFile = path.join(this.dataDir, 'update-log.json');
    }

    // Get the latest news file
    getLatestNewsFile() {
        const newsFiles = fs.readdirSync(this.newsDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a));
        
        return newsFiles.length > 0 ? newsFiles[0] : null;
    }

    // Load keyword data
    loadKeywords() {
        try {
            const keywordsFile = path.join(this.dataDir, 'keywords.json');
            const dynamicKeywordsFile = path.join(this.dataDir, 'dynamic-keywords.json');
            
            let keywords = [];
            
            // Load static keywords
            if (fs.existsSync(keywordsFile)) {
                const keywordsData = JSON.parse(fs.readFileSync(keywordsFile, 'utf8'));
                keywords = keywords.concat(keywordsData.keywords || []);
            }
            
            // Load dynamic keywords
            if (fs.existsSync(dynamicKeywordsFile)) {
                const dynamicKeywordsData = JSON.parse(fs.readFileSync(dynamicKeywordsFile, 'utf8'));
                keywords = keywords.concat(dynamicKeywordsData.keywords || []);
            }
            
            return keywords;
        } catch (error) {
            console.warn('Failed to load keywords:', error.message);
            return [];
        }
    }

    // Recalculate article relevance scores
    recalculateRelevanceScores(articles, keywords) {
        return articles.map(article => {
            let score = article.weight || 5;
            const fullText = `${article.title} ${article.description}`.toLowerCase();
            
            // Keyword-based relevance scoring
            keywords.forEach(keywordObj => {
                const keyword = keywordObj.keyword?.toLowerCase();
                if (keyword && fullText.includes(keyword)) {
                    score += (keywordObj.score || 1) * 0.5;
                }
            });
            
            // Time freshness weighting
            const hoursAgo = (new Date() - new Date(article.pubDate)) / (1000 * 60 * 60);
            const freshnessBonus = Math.max(0, 10 - hoursAgo * 0.2);
            
            // Source authority weighting
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
            
            // Article type weighting
            const typeWeights = {
                'analysis': 3,
                'news': 2,
                'opinion': 1,
                'tutorial': 2,
                'review': 2
            };
            
            const typeBonus = typeWeights[article.type] || 1;
            
            // Sentiment analysis weighting
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

    // Enhance article classification and tags
    enhanceArticleMetadata(articles) {
        return articles.map(article => {
            const enhanced = { ...article };
            
            // Enhance tag system
            const additionalTags = this.extractAdditionalTags(article.title + ' ' + article.description);
            enhanced.tags = [...(article.tags || []), ...additionalTags].slice(0, 5);
            
            // Enhance category
            enhanced.category = this.refineCategory(article, enhanced.tags);
            
            // Add recommendation score
            enhanced.recommendationScore = this.calculateRecommendationScore(article);
            
            // Add reading difficulty
            enhanced.readingLevel = this.assessReadingLevel(article.title + ' ' + article.description);
            
            return enhanced;
        });
    }

    // Extract additional tags
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

    // Refine category
    refineCategory(article, tags) {
        const title = article.title.toLowerCase();
        const description = article.description.toLowerCase();
        const fullText = title + ' ' + description;
        
        // Content-based categorization rules
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

    // Calculate recommendation score
    calculateRecommendationScore(article) {
        let score = 0;
        
        // Base score
        score += article.relevanceScore || 0;
        
        // Social metrics simulation (based on title appeal)
        const title = article.title.toLowerCase();
        if (title.includes('new') || title.includes('first') || title.includes('launch')) score += 2;
        if (title.includes('vs') || title.includes('compared') || title.includes('better')) score += 1;
        if (title.includes('why') || title.includes('how') || title.includes('what')) score += 1.5;
        if (title.includes('best') || title.includes('worst') || title.includes('top')) score += 1;
        
        // Length weighting
        if (article.title.length > 50 && article.title.length < 100) score += 0.5;
        
        // Tag weighting
        const premiumTags = ['Breaking', 'Exclusive', 'Analysis'];
        premiumTags.forEach(tag => {
            if (article.tags && article.tags.includes(tag)) score += 2;
        });
        
        return Math.round(score * 100) / 100;
    }

    // Assess reading difficulty
    assessReadingLevel(text) {
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        const complexWords = text.split(/\s+/).filter(word => word.length > 6).length;
        
        // Simplified reading difficulty assessment
        const avgWordsPerSentence = words / Math.max(sentences, 1);
        const complexWordRatio = complexWords / Math.max(words, 1);
        
        if (avgWordsPerSentence > 20 || complexWordRatio > 0.3) return 'advanced';
        if (avgWordsPerSentence > 15 || complexWordRatio > 0.2) return 'intermediate';
        return 'beginner';
    }

    // Create ranked index
    createRankedIndex(articles) {
        // Sort by relevance score
        const sortedArticles = [...articles].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        
        // Create category index
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
        
        // Limit the number of articles per category
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

    // Log update operation
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
        
        // Keep the last 100 records
        updateLog.updates = updateLog.updates.slice(0, 100);
        updateLog.lastUpdated = new Date().toISOString();
        
        fs.writeFileSync(this.updateLogFile, JSON.stringify(updateLog, null, 2));
    }

    // Main processing function
    async processLatestNews() {
        console.log('🔄 Starting to process the latest news...');
        
        try {
            // Get the latest news file
            const latestFile = this.getLatestNewsFile();
            if (!latestFile) {
                console.log('❌ No news file found.');
                return;
            }
            
            console.log(`📄 Processing file: ${latestFile}`);
            
            // Load news data
            const newsFilePath = path.join(this.newsDir, latestFile);
            const newsData = JSON.parse(fs.readFileSync(newsFilePath, 'utf8'));
            
            if (!newsData.articles || newsData.articles.length === 0) {
                console.log('❌ No articles in the news file.');
                return;
            }
            
            console.log(`📊 Original article count: ${newsData.articles.length}`);
            
            // Load keywords
            const keywords = this.loadKeywords();
            console.log(`🔑 Loaded keywords: ${keywords.length}`);
            
            // Recalculate relevance scores
            let processedArticles = this.recalculateRelevanceScores(newsData.articles, keywords);
            console.log('✅ Completed relevance score calculation.');
            
            // Enhance article metadata
            processedArticles = this.enhanceArticleMetadata(processedArticles);
            console.log('✅ Completed metadata enhancement.');
            
            // Create ranked index
            const rankedIndex = this.createRankedIndex(processedArticles);
            console.log('✅ Completed ranked index creation.');
            
            // Save ranked index
            fs.writeFileSync(this.rankedIndexFile, JSON.stringify(rankedIndex, null, 2));
            console.log(`💾 Saved ranked index to ranked-news-index.json`);
            
            // Update the original news file
            const updatedNewsData = {
                ...newsData,
                articles: processedArticles,
                processedAt: new Date().toISOString(),
                processingVersion: '2.0'
            };
            
            fs.writeFileSync(newsFilePath, JSON.stringify(updatedNewsData, null, 2));
            console.log(`💾 Updated the original news file.`);
            
            // Log the update
            this.logUpdate('process-news', {
                file: latestFile,
                totalArticles: processedArticles.length,
                avgRelevanceScore: rankedIndex.stats.avgRelevanceScore,
                categoriesCount: rankedIndex.stats.totalCategories,
                sourcesCount: rankedIndex.stats.totalSources
            });
            
            console.log('✅ News processing complete!');
            console.log(`📈 Average relevance score: ${rankedIndex.stats.avgRelevanceScore.toFixed(2)}`);
            console.log(`📊 Category count: ${rankedIndex.stats.totalCategories}`);
            console.log(`🎯 Source count: ${rankedIndex.stats.totalSources}`);
            
            return {
                success: true,
                totalArticles: processedArticles.length,
                rankedIndex: rankedIndex
            };
            
        } catch (error) {
            console.error('❌ Error processing news:', error.message);
            
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

// Main function
async function main() {
    const processor = new NewsProcessor();
    const result = await processor.processLatestNews();
    
    if (result.success) {
        console.log('🎉 News processing finished successfully!');
    } else {
        console.error('💥 News processing failed:', result.error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewsProcessor;