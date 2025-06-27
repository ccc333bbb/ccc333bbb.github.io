// TARDIS Portal Data - Simplified Version
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
    // Future expansion ideas - currently placeholders
    {
        id: 2,
        title: "📖 Reading Collection",
        description: "Curated articles, books, and interesting reads - Coming Soon",
        url: "#",
        icon: "📖",
        category: "content",
        tags: ["reading", "collection", "articles"],
        disabled: true
    },
    {
        id: 3,
        title: "🎯 Project Showcase",
        description: "Personal projects and development works - Coming Soon", 
        url: "#",
        icon: "🎯",
        category: "tech",
        tags: ["projects", "development", "showcase"],
        disabled: true
    },
    {
        id: 4,
        title: "📊 Data Dashboard",
        description: "Personal statistics and interesting data visualizations - Coming Soon",
        url: "#",
        icon: "📊", 
        category: "data",
        tags: ["statistics", "data", "dashboard"],
        disabled: true
    },
    {
        id: 5,
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