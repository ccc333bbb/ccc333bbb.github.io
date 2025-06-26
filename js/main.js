// TARDIS 主腳本
class TardisApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.addKeyboardShortcuts();
        this.addAnimations();
        this.addThemeToggle();
        this.addLoadingAnimation();
        this.initNewsSection();
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // ESC 清空搜索
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchInput');
                if (document.activeElement === searchInput) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                }
            }
            
            // 數字鍵快速選擇分類
            const categoryMap = {
                '1': 'all',
                '2': 'tech',
                '3': 'life',
                '4': 'entertainment',
                '5': 'tools'
            };
            
            if (e.key in categoryMap && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const category = categoryMap[e.key];
                const tabBtn = document.querySelector(`[data-category="${category}"]`);
                if (tabBtn) {
                    tabBtn.click();
                }
            }
        });
    }
    
    addAnimations() {
        // 添加滾動動畫
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // 觀察所有門戶卡片
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.portal-card');
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(card);
            });
        });
    }
    
    addThemeToggle() {
        // 創建主題切換按鈕
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙';
        themeToggle.title = '切換主題 (T)';
        
        // 添加到頁面
        const header = document.querySelector('.tardis-header');
        header.appendChild(themeToggle);
        
        // 主題切換邏輯
        let isDark = true;
        themeToggle.addEventListener('click', () => {
            isDark = !isDark;
            document.body.classList.toggle('light-theme', !isDark);
            themeToggle.innerHTML = isDark ? '🌙' : '☀️';
            themeToggle.title = isDark ? '切換到淺色主題 (T)' : '切換到深色主題 (T)';
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                themeToggle.click();
            }
        });
    }
    
    addLoadingAnimation() {
        // 頁面加載動畫
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            
            // 添加歡迎動畫
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1000);
        });
    }
    
    initNewsSection() {
        // 初始化新聞區塊
        document.addEventListener('DOMContentLoaded', () => {
            const newsSection = document.getElementById('newsSection');
            if (newsSection && window.newsSearch) {
                newsSection.innerHTML = window.newsSearch.renderNewsSection();
                // 延遲加載新聞，避免影響主頁面加載
                setTimeout(() => {
                    window.newsSearch.displayLatestNews();
                }, 2000);
            }
        });
    }
    
    showWelcomeMessage() {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `
            <div class="welcome-content">
                <h3>🚀 歡迎來到 TARDIS Navigation</h3>
                <p>使用 Ctrl+K 快速搜索，數字鍵切換分類</p>
                <p>📰 新聞區塊支持全文檢索和關鍵詞搜索</p>
                <button class="welcome-close">知道了</button>
            </div>
        `;
        
        document.body.appendChild(welcomeMsg);
        
        // 自動消失
        setTimeout(() => {
            welcomeMsg.classList.add('fade-out');
            setTimeout(() => {
                welcomeMsg.remove();
            }, 500);
        }, 5000);
        
        // 手動關閉
        welcomeMsg.querySelector('.welcome-close').addEventListener('click', () => {
            welcomeMsg.classList.add('fade-out');
            setTimeout(() => {
                welcomeMsg.remove();
            }, 500);
        });
    }
}

// 添加額外的 CSS 樣式
const mainStyles = `
    .theme-toggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 26, 51, 0.8);
        border: 2px solid var(--tardis-gold);
        color: var(--tardis-gold);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }
    
    .theme-toggle:hover {
        background: var(--tardis-gold);
        color: var(--tardis-dark);
        transform: scale(1.1);
    }
    
    .tardis-header {
        position: relative;
    }
    
    .welcome-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(0, 59, 111, 0.95), rgba(0, 26, 51, 0.95));
        border: 2px solid var(--tardis-gold);
        border-radius: 15px;
        padding: 30px;
        z-index: 1000;
        backdrop-filter: blur(20px);
        box-shadow: 0 0 30px var(--tardis-shadow);
        animation: welcomeSlideIn 0.5s ease;
    }
    
    .welcome-content h3 {
        color: var(--tardis-gold);
        margin-bottom: 15px;
        text-align: center;
    }
    
    .welcome-content p {
        color: var(--tardis-text);
        margin-bottom: 20px;
        text-align: center;
    }
    
    .welcome-close {
        display: block;
        margin: 0 auto;
        padding: 10px 20px;
        background: var(--tardis-gold);
        color: var(--tardis-dark);
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .welcome-close:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px var(--tardis-glow);
    }
    
    .welcome-message.fade-out {
        animation: welcomeSlideOut 0.5s ease forwards;
    }
    
    @keyframes welcomeSlideIn {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes welcomeSlideOut {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
    }
    
    body.loaded .tardis-container {
        animation: fadeInUp 0.8s ease;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* 淺色主題 */
    body.light-theme {
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e3f2fd 100%);
        color: #333;
    }
    
    body.light-theme .tardis-header {
        background: linear-gradient(135deg, rgba(187, 222, 251, 0.8), rgba(227, 242, 253, 0.8));
        border-color: #1976d2;
    }
    
    body.light-theme .portal-card {
        background: linear-gradient(135deg, rgba(187, 222, 251, 0.8), rgba(227, 242, 253, 0.8));
        border-color: #1976d2;
        color: #333;
    }
    
    body.light-theme .portal-card h3 {
        color: #1976d2;
    }
    
    body.light-theme .portal-card p {
        color: #666;
    }
    
    body.light-theme .tab-btn {
        background: rgba(187, 222, 251, 0.6);
        border-color: #1976d2;
        color: #333;
    }
    
    body.light-theme .tab-btn:hover,
    body.light-theme .tab-btn.active {
        background: #1976d2;
        color: white;
    }
`;

// 動態添加樣式
const mainStyleSheet = document.createElement('style');
mainStyleSheet.textContent = mainStyles;
document.head.appendChild(mainStyleSheet);

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new TardisApp();
}); 