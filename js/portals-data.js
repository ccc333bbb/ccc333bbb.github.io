// TARDIS 門戶數據
const portalsData = [
    {
        id: 1,
        title: "📝 Memo 知識庫",
        description: "個人知識管理系統 - 多語言博客、隨想、項目展示",
        url: "/memo/",
        icon: "📝",
        category: "tech",
        tags: ["blog", "knowledge", "multilingual", "astro"],
        featured: true
    },
    {
        id: 2,
        title: "💻 GitHub Profile",
        description: "我的 GitHub 主頁 - 開源項目和代碼倉庫",
        url: "https://github.com/ccc333bbb",
        icon: "💻",
        category: "tech",
        tags: ["github", "opensource", "coding"],
        external: true
    },
    {
        id: 3,
        title: "🔧 開發工具集",
        description: "常用開發工具和資源集合",
        url: "#",
        icon: "🔧",
        category: "tools",
        tags: ["development", "tools", "resources"],
        subPortals: [
            {
                title: "VS Code",
                url: "https://code.visualstudio.com/",
                description: "代碼編輯器"
            },
            {
                title: "GitHub",
                url: "https://github.com/",
                description: "代碼託管平台"
            },
            {
                title: "Stack Overflow",
                url: "https://stackoverflow.com/",
                description: "開發者問答社區"
            }
        ]
    },
    {
        id: 4,
        title: "📚 學習資源",
        description: "技術學習和知識獲取平台",
        url: "#",
        icon: "📚",
        category: "tech",
        tags: ["learning", "education", "tutorials"],
        subPortals: [
            {
                title: "MDN Web Docs",
                url: "https://developer.mozilla.org/",
                description: "Web 開發文檔"
            },
            {
                title: "W3Schools",
                url: "https://www.w3schools.com/",
                description: "Web 技術教程"
            },
            {
                title: "freeCodeCamp",
                url: "https://www.freecodecamp.org/",
                description: "免費編程學習"
            }
        ]
    },
    {
        id: 5,
        title: "🎨 設計資源",
        description: "UI/UX 設計工具和靈感來源",
        url: "#",
        icon: "🎨",
        category: "tools",
        tags: ["design", "ui", "ux", "inspiration"],
        subPortals: [
            {
                title: "Figma",
                url: "https://www.figma.com/",
                description: "設計協作工具"
            },
            {
                title: "Dribbble",
                url: "https://dribbble.com/",
                description: "設計靈感社區"
            },
            {
                title: "Behance",
                url: "https://www.behance.net/",
                description: "創意作品展示"
            }
        ]
    },
    {
        id: 6,
        title: "🎵 音樂娛樂",
        description: "音樂播放和娛樂平台",
        url: "#",
        icon: "🎵",
        category: "entertainment",
        tags: ["music", "entertainment", "streaming"],
        subPortals: [
            {
                title: "Spotify",
                url: "https://open.spotify.com/",
                description: "音樂流媒體"
            },
            {
                title: "YouTube Music",
                url: "https://music.youtube.com/",
                description: "YouTube 音樂服務"
            },
            {
                title: "Netflix",
                url: "https://www.netflix.com/",
                description: "影視流媒體"
            }
        ]
    },
    {
        id: 7,
        title: "📰 新聞資訊",
        description: "技術新聞和行業資訊",
        url: "#",
        icon: "📰",
        category: "life",
        tags: ["news", "tech", "information"],
        subPortals: [
            {
                title: "TechCrunch",
                url: "https://techcrunch.com/",
                description: "科技新聞"
            },
            {
                title: "The Verge",
                url: "https://www.theverge.com/",
                description: "科技媒體"
            },
            {
                title: "Hacker News",
                url: "https://news.ycombinator.com/",
                description: "技術社區"
            }
        ]
    },
    {
        id: 8,
        title: "🛒 購物平台",
        description: "常用購物和電商平台",
        url: "#",
        icon: "🛒",
        category: "life",
        tags: ["shopping", "ecommerce", "retail"],
        subPortals: [
            {
                title: "Amazon",
                url: "https://www.amazon.com/",
                description: "綜合電商平台"
            },
            {
                title: "Apple Store",
                url: "https://www.apple.com/",
                description: "蘋果官方商店"
            },
            {
                title: "Steam",
                url: "https://store.steampowered.com/",
                description: "遊戲平台"
            }
        ]
    },
    {
        id: 9,
        title: "🚀 生產力工具",
        description: "提升工作效率的工具集合",
        url: "#",
        icon: "🚀",
        category: "tools",
        tags: ["productivity", "tools", "efficiency"],
        subPortals: [
            {
                title: "Notion",
                url: "https://www.notion.so/",
                description: "筆記和協作工具"
            },
            {
                title: "Trello",
                url: "https://trello.com/",
                description: "項目管理工具"
            },
            {
                title: "Slack",
                url: "https://slack.com/",
                description: "團隊溝通工具"
            }
        ]
    },
    {
        id: 10,
        title: "🌐 社交媒體",
        description: "社交網絡和溝通平台",
        url: "#",
        icon: "🌐",
        category: "life",
        tags: ["social", "communication", "networking"],
        subPortals: [
            {
                title: "Twitter",
                url: "https://twitter.com/",
                description: "社交媒體平台"
            },
            {
                title: "LinkedIn",
                url: "https://www.linkedin.com/",
                description: "職業社交網絡"
            },
            {
                title: "Discord",
                url: "https://discord.com/",
                description: "遊戲和社區聊天"
            }
        ]
    }
];

// 導出數據供其他腳本使用
window.portalsData = portalsData; 