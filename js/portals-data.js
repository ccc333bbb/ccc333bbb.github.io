// TARDIS Portal Data
const portalsData = [
    {
        id: 1,
        title: "📝 Memo Knowledge Base",
        description: "Personal knowledge management system - multilingual blog, thoughts, project showcase",
        url: "/memo/",
        icon: "📝",
        category: "tech",
        tags: ["blog", "knowledge", "multilingual", "astro"],
        featured: true
    },
    {
        id: 2,
        title: "💻 GitHub Profile",
        description: "My GitHub homepage - open source projects and code repositories",
        url: "https://github.com/ccc333bbb",
        icon: "💻",
        category: "tech",
        tags: ["github", "opensource", "coding"],
        external: true
    },
    {
        id: 3,
        title: "🔧 Development Tools",
        description: "Common development tools and resources collection",
        url: "#",
        icon: "🔧",
        category: "tools",
        tags: ["development", "tools", "resources"],
        subPortals: [
            {
                title: "VS Code",
                url: "https://code.visualstudio.com/",
                description: "Code editor"
            },
            {
                title: "GitHub",
                url: "https://github.com/",
                description: "Code hosting platform"
            },
            {
                title: "Stack Overflow",
                url: "https://stackoverflow.com/",
                description: "Developer Q&A community"
            }
        ]
    },
    {
        id: 4,
        title: "📚 Learning Resources",
        description: "Technology learning and knowledge acquisition platforms",
        url: "#",
        icon: "📚",
        category: "tech",
        tags: ["learning", "education", "tutorials"],
        subPortals: [
            {
                title: "MDN Web Docs",
                url: "https://developer.mozilla.org/",
                description: "Web development documentation"
            },
            {
                title: "W3Schools",
                url: "https://www.w3schools.com/",
                description: "Web technology tutorials"
            },
            {
                title: "freeCodeCamp",
                url: "https://www.freecodecamp.org/",
                description: "Free programming learning"
            }
        ]
    },
    {
        id: 5,
        title: "🎨 Design Resources",
        description: "UI/UX design tools and inspiration sources",
        url: "#",
        icon: "🎨",
        category: "tools",
        tags: ["design", "ui", "ux", "inspiration"],
        subPortals: [
            {
                title: "Figma",
                url: "https://www.figma.com/",
                description: "Design collaboration tool"
            },
            {
                title: "Dribbble",
                url: "https://dribbble.com/",
                description: "Design inspiration community"
            },
            {
                title: "Behance",
                url: "https://www.behance.net/",
                description: "Creative work showcase"
            }
        ]
    },
    {
        id: 6,
        title: "🎵 Music & Entertainment",
        description: "Music streaming and entertainment platforms",
        url: "#",
        icon: "🎵",
        category: "entertainment",
        tags: ["music", "entertainment", "streaming"],
        subPortals: [
            {
                title: "Spotify",
                url: "https://open.spotify.com/",
                description: "Music streaming service"
            },
            {
                title: "YouTube Music",
                url: "https://music.youtube.com/",
                description: "YouTube music service"
            },
            {
                title: "Netflix",
                url: "https://www.netflix.com/",
                description: "Video streaming service"
            }
        ]
    },
    {
        id: 7,
        title: "📰 News & Information",
        description: "Technology news and industry information",
        url: "#",
        icon: "📰",
        category: "life",
        tags: ["news", "tech", "information"],
        subPortals: [
            {
                title: "TechCrunch",
                url: "https://techcrunch.com/",
                description: "Technology news"
            },
            {
                title: "The Verge",
                url: "https://www.theverge.com/",
                description: "Technology media"
            },
            {
                title: "Hacker News",
                url: "https://news.ycombinator.com/",
                description: "Technology community"
            }
        ]
    },
    {
        id: 8,
        title: "🛒 Shopping Platforms",
        description: "Common shopping and e-commerce platforms",
        url: "#",
        icon: "🛒",
        category: "life",
        tags: ["shopping", "ecommerce", "retail"],
        subPortals: [
            {
                title: "Amazon",
                url: "https://www.amazon.com/",
                description: "Comprehensive e-commerce platform"
            },
            {
                title: "Apple Store",
                url: "https://www.apple.com/",
                description: "Apple official store"
            },
            {
                title: "Steam",
                url: "https://store.steampowered.com/",
                description: "Gaming platform"
            }
        ]
    },
    {
        id: 9,
        title: "🚀 Productivity Tools",
        description: "Tools collection to improve work efficiency",
        url: "#",
        icon: "🚀",
        category: "tools",
        tags: ["productivity", "tools", "efficiency"],
        subPortals: [
            {
                title: "Notion",
                url: "https://www.notion.so/",
                description: "Note-taking and collaboration tool"
            },
            {
                title: "Trello",
                url: "https://trello.com/",
                description: "Project management tool"
            },
            {
                title: "Slack",
                url: "https://slack.com/",
                description: "Team communication tool"
            }
        ]
    },
    {
        id: 10,
        title: "🌐 Social Media",
        description: "Social networks and communication platforms",
        url: "#",
        icon: "🌐",
        category: "life",
        tags: ["social", "communication", "networking"],
        subPortals: [
            {
                title: "Twitter",
                url: "https://twitter.com/",
                description: "Social media platform"
            },
            {
                title: "LinkedIn",
                url: "https://www.linkedin.com/",
                description: "Professional social network"
            },
            {
                title: "Discord",
                url: "https://discord.com/",
                description: "Gaming and community chat"
            }
        ]
    }
];

// Export data for use by other scripts
window.portalsData = portalsData; 