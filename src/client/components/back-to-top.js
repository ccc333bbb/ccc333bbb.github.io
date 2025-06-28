/**
 * 回到頂部按鈕組件
 * 當用戶滾動超過一屏高度時顯示按鈕
 * 點擊按鈕平滑滾動到頁面頂部
 */

(function() {
    // 創建回到頂部按鈕
    function createBackToTopButton() {
        const button = document.createElement('button');
        button.className = 'back-to-top';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', '回到頂部');
        button.setAttribute('title', '回到頂部');
        document.body.appendChild(button);
        return button;
    }

    // 平滑滾動到頂部
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // 處理滾動事件
    function handleScroll(button) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        
        // 當滾動超過一屏高度時顯示按鈕
        if (scrollTop > windowHeight) {
            button.classList.add('show');
        } else {
            button.classList.remove('show');
        }
    }

    // 初始化回到頂部功能
    function initBackToTop() {
        const backToTopButton = createBackToTopButton();
        
        // 綁定點擊事件
        backToTopButton.addEventListener('click', scrollToTop);
        
        // 綁定滾動事件，使用節流優化性能
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    handleScroll(backToTopButton);
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // 等待DOM載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackToTop);
    } else {
        initBackToTop();
    }
})(); 