// TARDIS Orama Search Service with Multilingual Support
import { create, insert, remove, search } from '@orama/orama';
// Orama 目前不直接支持自定義 stemmer，暫時移除多語言 stemmer 配置

class TardisOramaSearch {
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
        // 多語言配置（Orama 暫不支持自定義 stemmer，僅保留語言標記）
        this.languageConfig = {
            chinese: {
                language: 'zh',
            },
            english: {
                language: 'en',
            }
        };
        this.userLanguage = this.detectUserLanguage();
    }

    detectUserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const pageLang = document.documentElement.lang;
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
            console.log(`🌍 Initializing Orama search with language: ${this.userLanguage}`);
            // Orama 的 create 需指定 schema 和可選 language
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
                language: langConfig.language
            });
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
                language: 'en'
            });
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
                language: 'en'
            });
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
                language: 'en'
            });
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
                language: 'en'
            });
            this.isInitialized = true;
            console.log('✅ Orama search indexes initialized');
        } catch (error) {
            console.error('❌ Error initializing Orama search:', error);
        }
    }

    preprocessText(text) {
        if (!text) return '';
        let processed = text.replace(/[^-\uFFFF]/g, ' ');
        processed = processed.replace(/\s+/g, ' ').trim();
        return processed;
    }

    async indexPortals(portalsData) {
        if (!this.isInitialized || !this.searchIndexes.portals) return;
        try {
            await remove(this.searchIndexes.portals, () => true);
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
            await remove(this.searchIndexes.news, () => true);
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
            await remove(this.searchIndexes.aiTools, () => true);
            for (const tool of aiToolsData) {
                await insert(this.searchIndexes.aiTools, {
                    id: tool.id.toString(),
                    name: tool.name,
                    description: tool.description,
                    category: tool.category,
                    tags: (tool.tags || []).join(', '),
                    url: tool.url,
                    features: tool.features || ''
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
            await remove(this.searchIndexes.thinkingModels, () => true);
            for (const model of modelsData) {
                await insert(this.searchIndexes.thinkingModels, {
                    id: model.id.toString(),
                    name: model.name,
                    description: model.description,
                    category: model.category,
                    tags: (model.tags || []).join(', '),
                    url: model.url,
                    complexity: model.complexity || ''
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
            await remove(this.searchIndexes.mcpServers, () => true);
            for (const server of serversData) {
                await insert(this.searchIndexes.mcpServers, {
                    id: server.id.toString(),
                    name: server.name,
                    description: server.description,
                    category: server.category,
                    tags: (server.tags || []).join(', '),
                    url: server.url,
                    features: server.features || ''
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
            if (filters.category && filters.category !== 'all') {
                searchQuery.where = { category: filters.category };
            }
            if (filters.featured !== undefined) {
                searchQuery.where = { ...searchQuery.where, featured: filters.featured };
            }
            const results = await search(this.searchIndexes.portals, searchQuery);
            return results.hits.map(hit => ({ ...hit.document, score: hit.score }));
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
            if (filters.category) {
                searchQuery.where = { category: filters.category };
            }
            if (filters.source) {
                searchQuery.where = { ...searchQuery.where, source: filters.source };
            }
            const results = await search(this.searchIndexes.news, searchQuery);
            return results.hits.map(hit => ({ ...hit.document, score: hit.score }));
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
            return results.hits.map(hit => ({ ...hit.document, score: hit.score }));
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
            return results.hits.map(hit => ({ ...hit.document, score: hit.score }));
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
            return results.hits.map(hit => ({ ...hit.document, score: hit.score }));
        } catch (error) {
            console.error('❌ Error searching MCP servers:', error);
            return [];
        }
    }

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

    // 語言切換功能
    async switchLanguage(language) {
        if (this.languageConfig[language]) {
            this.userLanguage = language;
            console.log(`🌍 Switching to ${language} language`);
            this.isInitialized = false;
            await this.initialize();
            return true;
        }
        return false;
    }

    getCurrentLanguage() {
        return this.userLanguage;
    }

    getSupportedLanguages() {
        return Object.keys(this.languageConfig);
    }
}

const oramaSearch = new TardisOramaSearch();
export default oramaSearch; 