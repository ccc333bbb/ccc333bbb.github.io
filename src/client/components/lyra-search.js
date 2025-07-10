// TARDIS Lyra Search Service with Multilingual Support
import { create, insert, search, remove } from '@lyrasearch/lyra';
import { stemmer as chineseStemmer } from '@lyrasearch/components/stemmer/zh';
import { stemmer as englishStemmer } from '@lyrasearch/components/stemmer/en';

class TardisLyraSearch {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.searchIndexes = {
            portals: null,
            news: null,
            aiTools: null,
            thinkingModels: null,
            mcpServers: null
        };
        
        // 多語言配置
        this.languageConfig = {
            chinese: {
                defaultLanguage: 'chinese',
                components: {
                    tokenizer: {
                        stemmingFn: chineseStemmer,
                    },
                }
            },
            english: {
                defaultLanguage: 'english',
                components: {
                    tokenizer: {
                        stemmingFn: englishStemmer,
                    },
                }
            }
        };
        
        // 檢測用戶語言
        this.userLanguage = this.detectUserLanguage();
    }

    detectUserLanguage() {
        // 檢測瀏覽器語言
        const browserLang = navigator.language || navigator.userLanguage;
        
        // 檢測頁面語言
        const pageLang = document.documentElement.lang;
        
        // 優先級：頁面語言 > 瀏覽器語言 > 默認英文
        if (pageLang && (pageLang.startsWith('zh') || pageLang === 'zh')) {
            return 'chinese';
        }
        
        if (browserLang && (browserLang.startsWith('zh') || browserLang === 'zh')) {
            return 'chinese';
        }
        
        return 'english';
    }

    getLanguageConfig() {
        return this.languageConfig[this.userLanguage] || this.languageConfig.english;
    }

    async initialize() {
        try {
            const langConfig = this.getLanguageConfig();
            console.log(`🌍 Initializing Lyra search with language: ${this.userLanguage}`);
            
            // 初始化所有索引時使用檢測到的語言配置
            this.searchIndexes.portals = await create({
                schema: {
                    id: 'string',
                    title: 'string',
                    description: 'string',
                    category: 'string',
                    tags: 'string',
                    url: 'string',
                    featured: 'boolean',
                    disabled: 'boolean'
                },
                ...langConfig
            });

            // 初始化新聞搜索索引
            this.searchIndexes.news = await create({
                schema: {
                    articleId: 'string',
                    title: 'string',
                    description: 'string',
                    source: 'string',
                    category: 'string',
                    tags: 'string',
                    pubDate: 'string',
                    url: 'string',
                    relevanceScore: 'number'
                },
                defaultLanguage: 'english'
            });

            // 初始化 AI 工具搜索索引
            this.searchIndexes.aiTools = await create({
                schema: {
                    id: 'string',
                    name: 'string',
                    description: 'string',
                    category: 'string',
                    tags: 'string',
                    url: 'string',
                    features: 'string'
                },
                defaultLanguage: 'english'
            });

            // 初始化思維模型搜索索引
            this.searchIndexes.thinkingModels = await create({
                schema: {
                    id: 'string',
                    name: 'string',
                    description: 'string',
                    category: 'string',
                    tags: 'string',
                    url: 'string',
                    complexity: 'string'
                },
                defaultLanguage: 'english'
            });

            // 初始化 MCP 服務器搜索索引
            this.searchIndexes.mcpServers = await create({
                schema: {
                    id: 'string',
                    name: 'string',
                    description: 'string',
                    category: 'string',
                    tags: 'string',
                    url: 'string',
                    features: 'string'
                },
                defaultLanguage: 'english'
            });

            this.isInitialized = true;
            console.log('✅ Lyra search indexes initialized');
        } catch (error) {
            console.error('❌ Error initializing Lyra search:', error);
        }
    }

    // 預處理文本以改善多語言搜索
    preprocessText(text) {
        if (!text) return '';
        
        // 移除特殊字符但保留中文
        let processed = text.replace(/[^\w\s\u4e00-\u9fff]/g, ' ');
        
        // 統一空格
        processed = processed.replace(/\s+/g, ' ').trim();
        
        return processed;
    }

    async indexPortals(portalsData) {
        if (!this.isInitialized || !this.searchIndexes.portals) return;

        try {
            await remove(this.searchIndexes.portals, {});
            
            for (const portal of portalsData) {
                await insert(this.searchIndexes.portals, {
                    id: portal.id.toString(),
                    title: this.preprocessText(portal.title),
                    description: this.preprocessText(portal.description),
                    category: portal.category,
                    tags: portal.tags.map(tag => this.preprocessText(tag)).join(', '),
                    url: portal.url,
                    featured: portal.featured || false,
                    disabled: portal.disabled || false
                });
            }
            console.log(`✅ Indexed ${portalsData.length} portals with ${this.userLanguage} support`);
        } catch (error) {
            console.error('❌ Error indexing portals:', error);
        }
    }

    async indexNews(newsData) {
        if (!this.isInitialized || !this.searchIndexes.news) return;

        try {
            // 清空現有索引
            await remove(this.searchIndexes.news, {});
            
            // 插入新聞數據
            for (const article of newsData) {
                await insert(this.searchIndexes.news, {
                    articleId: article.articleId || article.id,
                    title: article.title,
                    description: article.description || article.summary || '',
                    source: article.source,
                    category: article.category || 'general',
                    tags: (article.tags || []).join(', '),
                    pubDate: article.pubDate || article.timestamp,
                    url: article.url || article.link,
                    relevanceScore: article.relevanceScore || 0
                });
            }
            console.log(`✅ Indexed ${newsData.length} news articles`);
        } catch (error) {
            console.error('❌ Error indexing news:', error);
        }
    }

    async indexAiTools(aiToolsData) {
        if (!this.isInitialized || !this.searchIndexes.aiTools) return;

        try {
            await remove(this.searchIndexes.aiTools, {});
            
            for (const tool of aiToolsData) {
                await insert(this.searchIndexes.aiTools, {
                    id: tool.id.toString(),
                    name: tool.name || tool.title,
                    description: tool.description,
                    category: tool.category,
                    tags: (tool.tags || []).join(', '),
                    url: tool.url,
                    features: (tool.features || []).join(', ')
                });
            }
            console.log(`✅ Indexed ${aiToolsData.length} AI tools`);
        } catch (error) {
            console.error('❌ Error indexing AI tools:', error);
        }
    }

    async indexThinkingModels(modelsData) {
        if (!this.isInitialized || !this.searchIndexes.thinkingModels) return;

        try {
            await remove(this.searchIndexes.thinkingModels, {});
            
            for (const model of modelsData) {
                await insert(this.searchIndexes.thinkingModels, {
                    id: model.id.toString(),
                    name: model.name || model.title,
                    description: model.description,
                    category: model.category,
                    tags: (model.tags || []).join(', '),
                    url: model.url,
                    complexity: model.complexity || 'medium'
                });
            }
            console.log(`✅ Indexed ${modelsData.length} thinking models`);
        } catch (error) {
            console.error('❌ Error indexing thinking models:', error);
        }
    }

    async indexMcpServers(serversData) {
        if (!this.isInitialized || !this.searchIndexes.mcpServers) return;

        try {
            await remove(this.searchIndexes.mcpServers, {});
            
            for (const server of serversData) {
                await insert(this.searchIndexes.mcpServers, {
                    id: server.id.toString(),
                    name: server.name || server.title,
                    description: server.description,
                    category: server.category,
                    tags: (server.tags || []).join(', '),
                    url: server.url,
                    features: (server.features || []).join(', ')
                });
            }
            console.log(`✅ Indexed ${serversData.length} MCP servers`);
        } catch (error) {
            console.error('❌ Error indexing MCP servers:', error);
        }
    }

    async searchPortals(query, filters = {}) {
        if (!this.isInitialized || !this.searchIndexes.portals) return [];

        try {
            const processedQuery = this.preprocessText(query);
            const searchQuery = {
                term: processedQuery,
                properties: ['title', 'description', 'tags'],
                limit: 50
            };

            // 添加過濾條件
            if (filters.category && filters.category !== 'all') {
                searchQuery.where = { category: filters.category };
            }

            if (filters.featured !== undefined) {
                searchQuery.where = { ...searchQuery.where, featured: filters.featured };
            }

            const results = await search(this.searchIndexes.portals, searchQuery);
            return results.hits.map(hit => ({
                ...hit.document,
                score: hit.score
            }));
        } catch (error) {
            console.error('❌ Error searching portals:', error);
            return [];
        }
    }

    async searchNews(query, filters = {}) {
        if (!this.isInitialized || !this.searchIndexes.news) return [];

        try {
            const searchQuery = {
                term: query,
                properties: ['title', 'description', 'tags', 'source'],
                limit: 100
            };

            // 添加過濾條件
            if (filters.category) {
                searchQuery.where = { category: filters.category };
            }

            if (filters.source) {
                searchQuery.where = { ...searchQuery.where, source: filters.source };
            }

            const results = await search(this.searchIndexes.news, searchQuery);
            return results.hits.map(hit => ({
                ...hit.document,
                score: hit.score
            }));
        } catch (error) {
            console.error('❌ Error searching news:', error);
            return [];
        }
    }

    async searchAiTools(query, filters = {}) {
        if (!this.isInitialized || !this.searchIndexes.aiTools) return [];

        try {
            const searchQuery = {
                term: query,
                properties: ['name', 'description', 'tags', 'features'],
                limit: 50
            };

            if (filters.category) {
                searchQuery.where = { category: filters.category };
            }

            const results = await search(this.searchIndexes.aiTools, searchQuery);
            return results.hits.map(hit => ({
                ...hit.document,
                score: hit.score
            }));
        } catch (error) {
            console.error('❌ Error searching AI tools:', error);
            return [];
        }
    }

    async searchThinkingModels(query, filters = {}) {
        if (!this.isInitialized || !this.searchIndexes.thinkingModels) return [];

        try {
            const searchQuery = {
                term: query,
                properties: ['name', 'description', 'tags'],
                limit: 50
            };

            if (filters.category) {
                searchQuery.where = { category: filters.category };
            }

            if (filters.complexity) {
                searchQuery.where = { ...searchQuery.where, complexity: filters.complexity };
            }

            const results = await search(this.searchIndexes.thinkingModels, searchQuery);
            return results.hits.map(hit => ({
                ...hit.document,
                score: hit.score
            }));
        } catch (error) {
            console.error('❌ Error searching thinking models:', error);
            return [];
        }
    }

    async searchMcpServers(query, filters = {}) {
        if (!this.isInitialized || !this.searchIndexes.mcpServers) return [];

        try {
            const searchQuery = {
                term: query,
                properties: ['name', 'description', 'tags', 'features'],
                limit: 50
            };

            if (filters.category) {
                searchQuery.where = { category: filters.category };
            }

            const results = await search(this.searchIndexes.mcpServers, searchQuery);
            return results.hits.map(hit => ({
                ...hit.document,
                score: hit.score
            }));
        } catch (error) {
            console.error('❌ Error searching MCP servers:', error);
            return [];
        }
    }

    // 全局搜索 - 搜索所有索引
    async globalSearch(query, filters = {}) {
        const results = {
            portals: await this.searchPortals(query, filters),
            news: await this.searchNews(query, filters),
            aiTools: await this.searchAiTools(query, filters),
            thinkingModels: await this.searchThinkingModels(query, filters),
            mcpServers: await this.searchMcpServers(query, filters)
        };

        return results;
    }

    // 獲取搜索建議
    async getSearchSuggestions(query, type = 'all') {
        if (!query.trim()) return [];

        const suggestions = new Set();
        
        try {
            if (type === 'all' || type === 'portals') {
                const portalResults = await this.searchPortals(query, { limit: 5 });
                portalResults.forEach(result => {
                    suggestions.add(result.title);
                    result.tags.split(', ').forEach(tag => suggestions.add(tag));
                });
            }

            if (type === 'all' || type === 'news') {
                const newsResults = await this.searchNews(query, { limit: 5 });
                newsResults.forEach(result => {
                    suggestions.add(result.title);
                    result.tags.split(', ').forEach(tag => suggestions.add(tag));
                });
            }

            return Array.from(suggestions).slice(0, 10);
        } catch (error) {
            console.error('❌ Error getting search suggestions:', error);
            return [];
        }
    }

    // 添加語言切換功能
    async switchLanguage(language) {
        if (this.languageConfig[language]) {
            this.userLanguage = language;
            console.log(`🌍 Switching to ${language} language`);
            
            // 重新初始化索引
            this.isInitialized = false;
            await this.initialize();
            
            return true;
        }
        return false;
    }

    // 獲取當前語言
    getCurrentLanguage() {
        return this.userLanguage;
    }

    // 獲取支持的语言列表
    getSupportedLanguages() {
        return Object.keys(this.languageConfig);
    }
}

// 創建全局實例
const lyraSearch = new TardisLyraSearch();

export default lyraSearch; 