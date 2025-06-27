// TARDIS Portal Data - Resource Hub Edition
const portalsData = [
    {
        id: 1,
        title: "📝 Memo Knowledge Base",
        description: "Personal knowledge management system - multilingual blog, thoughts, project showcase",
        url: "/memo/",
        icon: "📝",
        category: "main",
        tags: ["blog", "knowledge", "multilingual", "astro"],
        featured: true
    },
    {
        id: 2,
        title: "🆓 FTDD Resources",
        description: "Free-to-Deploy Development resources - hosting, databases, APIs, and more",
        url: "/ftdd/",
        icon: "🆓",
        category: "main",
        tags: ["free", "hosting", "database", "api", "development"],
        featured: true
    },
    {
        id: 3,
        title: "🔌 MCP Ecosystem",
        description: "Model Context Protocol servers - enhance AI capabilities with external tools",
        url: "/mcp/",
        icon: "🔌",
        category: "main",
        tags: ["mcp", "ai", "protocol", "servers", "integration"],
        featured: true
    },
    {
        id: 4,
        title: "🤖 AI Tools Hub",
        description: "Comprehensive AI tools ecosystem - from Google AI to local LLMs",
        url: "/ai-tools/",
        icon: "🤖",
        category: "main",
        tags: ["ai", "tools", "llm", "automation", "platforms"],
        featured: true
    },
    {
        id: 5,
        title: "🧠 Thinking Models",
        description: "AI reasoning patterns and thinking methodologies - CoT, ToT, ReAct and more",
        url: "/thinking/",
        icon: "🧠",
        category: "main",
        tags: ["reasoning", "cot", "react", "thinking", "ai"],
        featured: true
    },
    // Future expansion ideas - currently placeholders
    {
        id: 6,
        title: "📖 Reading Collection",
        description: "Curated articles, books, and interesting reads - Coming Soon",
        url: "#",
        icon: "📖",
        category: "content",
        tags: ["reading", "collection", "articles"],
        disabled: true
    },
    {
        id: 7,
        title: "🎯 Project Showcase",
        description: "Personal projects and development works - Coming Soon", 
        url: "#",
        icon: "🎯",
        category: "tech",
        tags: ["projects", "development", "showcase"],
        disabled: true
    },
    {
        id: 8,
        title: "📊 Data Dashboard",
        description: "Personal statistics and interesting data visualizations - Coming Soon",
        url: "#",
        icon: "📊", 
        category: "data",
        tags: ["statistics", "data", "dashboard"],
        disabled: true
    },
    {
        id: 9,
        title: "🎨 Creative Workshop",
        description: "Design works, creative ideas and artistic expressions - Coming Soon",
        url: "#",
        icon: "🎨",
        category: "creative", 
        tags: ["design", "creative", "art"],
        disabled: true
    }
];

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = portalsData;
}

// Make data available globally for web use
window.portalsData = portalsData; 