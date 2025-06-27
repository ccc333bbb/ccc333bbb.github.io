// TARDIS Main Script
class TardisApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.addAnimations();
        this.addThemeToggle();
        this.addLoadingAnimation();
        this.initNewsSection();
    }
    
    // Keyboard shortcuts functionality removed
    
    addAnimations() {
        // Add scroll animations
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
        
        // Observe all portal cards
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
        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙';
        themeToggle.title = 'Toggle Theme';
        
        // Add to page
        const header = document.querySelector('.tardis-header');
        header.appendChild(themeToggle);
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('tardis-theme');
        let isDark = savedTheme !== 'light';
        
        // Apply initial theme
        document.body.classList.toggle('light-theme', !isDark);
        themeToggle.innerHTML = isDark ? '🌙' : '☀️';
        themeToggle.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
        
        // Theme toggle logic
        themeToggle.addEventListener('click', () => {
            isDark = !isDark;
            document.body.classList.toggle('light-theme', !isDark);
            themeToggle.innerHTML = isDark ? '🌙' : '☀️';
            themeToggle.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
            
            // Save theme preference
            localStorage.setItem('tardis-theme', isDark ? 'dark' : 'light');
        });
    }
    
    addLoadingAnimation() {
        // Page loading animation
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            
            // Add welcome animation
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1000);
        });
    }
    
    initNewsSection() {
        // Initialize news section - execute in window.load event to ensure all scripts are loaded
        window.addEventListener('load', () => {
            const newsSection = document.getElementById('newsSection');
            if (newsSection && window.newsSearch) {
                newsSection.innerHTML = window.newsSearch.renderNewsSection();
                // Delay loading news to avoid affecting main page loading
                setTimeout(() => {
                    window.newsSearch.displayLatestNews();
                }, 2000);
            } else {
                console.warn('News section or newsSearch not found');
            }
        });
    }
    
    showWelcomeMessage() {
        // Welcome message disabled per user request
        return;
    }
}

// Add additional CSS styles
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
    
    /* Light theme - Improved contrast */
    body.light-theme {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #f5f7fa 100%);
        color: #2c3e50;
    }
    
    body.light-theme .tardis-header {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 248, 255, 0.95));
        border-color: #3498db;
        box-shadow: 0 2px 10px rgba(52, 152, 219, 0.2);
    }
    
    body.light-theme .tardis-title h1 {
        color: #2c3e50;
        text-shadow: 0 1px 2px rgba(44, 62, 80, 0.1);
    }
    
    body.light-theme .subtitle {
        color: #34495e;
    }
    
    body.light-theme .description {
        color: #5a6c7d;
    }
    
    body.light-theme .search-container {
        background: rgba(255, 255, 255, 0.9);
        border-color: #3498db;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.15);
    }
    
    body.light-theme #searchInput {
        background: rgba(255, 255, 255, 0.95);
        color: #2c3e50;
        border-color: #bdc3c7;
    }
    
    body.light-theme #searchInput:focus {
        border-color: #3498db;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    body.light-theme #searchInput::placeholder {
        color: #7f8c8d;
    }
    
    body.light-theme .search-icon {
        color: #3498db;
    }
    
    body.light-theme .search-stats {
        color: #5a6c7d;
    }
    
    body.light-theme .portal-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
        border-color: #3498db;
        color: #2c3e50;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
    }
    
    body.light-theme .portal-card:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(240, 248, 255, 1));
        border-color: #2980b9;
        box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
        transform: translateY(-2px);
    }
    
    body.light-theme .portal-card h3 {
        color: #2c3e50;
    }
    
    body.light-theme .portal-card p {
        color: #34495e;
    }
    
    body.light-theme .portal-link {
        background: #3498db;
        color: #ffffff;
        border-color: #2980b9;
    }
    
    body.light-theme .portal-link:hover {
        background: #2980b9;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }
    
    body.light-theme .portal-tag {
        background: rgba(52, 152, 219, 0.1);
        color: #2980b9;
        border-color: #3498db;
    }
    
    body.light-theme .tab-btn {
        background: rgba(255, 255, 255, 0.8);
        border-color: #3498db;
        color: #2c3e50;
        box-shadow: 0 1px 3px rgba(52, 152, 219, 0.1);
    }
    
    body.light-theme .tab-btn:hover {
        background: rgba(52, 152, 219, 0.1);
        border-color: #2980b9;
        color: #2c3e50;
    }
    
    body.light-theme .tab-btn.active {
        background: #3498db;
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
    }
    
    body.light-theme .tardis-footer {
        background: rgba(255, 255, 255, 0.9);
        border-color: #3498db;
        color: #5a6c7d;
    }
    
    body.light-theme .theme-toggle {
        background: rgba(255, 255, 255, 0.9);
        border-color: #3498db;
        color: #3498db;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.15);
    }
    
    body.light-theme .theme-toggle:hover {
        background: #3498db;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
    
    body.light-theme .welcome-message {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
        border-color: #3498db;
        box-shadow: 0 4px 20px rgba(52, 152, 219, 0.2);
    }
    
    body.light-theme .welcome-content h3 {
        color: #2c3e50;
    }
    
    body.light-theme .welcome-content p {
        color: #34495e;
    }
    
    body.light-theme .welcome-close {
        background: #3498db;
        color: #ffffff;
    }
    
    body.light-theme .welcome-close:hover {
        background: #2980b9;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }
`;

// Dynamically add styles
const mainStyleSheet = document.createElement('style');
mainStyleSheet.textContent = mainStyles;
document.head.appendChild(mainStyleSheet);

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new TardisApp();
}); 