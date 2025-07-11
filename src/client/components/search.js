// TARDIS Search Functionality with Orama
// Note: This file uses non-module format for compatibility

class TardisSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.portalsGrid = document.getElementById('portalsGrid');
        this.portalCount = document.getElementById('portalCount');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.filteredPortals = [];
        this.lyraInitialized = false;
        
        this.init();
    }
    
    async init() {
        // Initialize Orama search
        await this.initializeLyra();
        
        // Bind search events
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterPortals();
        });
        
        // Bind category tab events
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveTab(e.target);
                this.currentCategory = e.target.dataset.category;
                this.filterPortals();
            });
        });
        
        // Initial load - show all portals
        this.filterPortals();
    }

    async initializeLyra() {
        try {
            // For now, skip Orama initialization to ensure portals display
            // Orama search can be enabled later when needed
            this.lyraInitialized = false;
            console.log('✅ Using fallback search method for portals');
        } catch (error) {
            console.error('❌ Failed to initialize search:', error);
            // Fallback to original search method
        }
    }
    
    setActiveTab(activeBtn) {
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    async filterPortals() {
        // Always use fallback method for now to ensure portals are displayed
        // Orama search will be used when there's a search term and it's initialized
        this.filteredPortals = portalsData.filter(portal => {
            const matchesCategory = this.currentCategory === 'all' || portal.category === this.currentCategory;
            const matchesSearch = this.searchTerm === '' || 
                portal.title.toLowerCase().includes(this.searchTerm) ||
                portal.description.toLowerCase().includes(this.searchTerm) ||
                portal.tags.some(tag => tag.toLowerCase().includes(this.searchTerm));
            return matchesCategory && matchesSearch;
        });
        
        this.renderPortals();
        this.updateStats();
    }
    
    renderPortals() {
        if (this.filteredPortals.length === 0) {
            this.portalsGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No matching portals found</h3>
                    <p>Try using different keywords or select another category</p>
                </div>
            `;
            return;
        }
        
        this.portalsGrid.innerHTML = this.filteredPortals.map(portal => {
            return this.createPortalCard(portal);
        }).join('');
        
        // Re-bind card events
        this.bindPortalEvents();
    }
    
    createPortalCard(portal) {
        const tagsHtml = portal.tags.map(tag => 
            `<span class="portal-tag">${tag}</span>`
        ).join('');
        
        const externalIcon = portal.external ? '<span class="external-icon">↗</span>' : '';
        const featuredClass = portal.featured ? 'featured' : '';
        const disabledClass = portal.disabled ? 'disabled' : '';
        
        return `
            <div class="portal-card ${featuredClass} ${disabledClass}" data-portal-id="${portal.id}">
                <div class="portal-icon">${portal.icon}</div>
                <h3>${portal.title} ${externalIcon}</h3>
                <p>${portal.description}</p>
                ${portal.subPortals ? this.createSubPortals(portal.subPortals) : ''}
                ${portal.disabled ? 
                    '<div class="portal-link disabled">Coming Soon...</div>' :
                    `<a href="${portal.url}" class="portal-link" ${portal.external ? 'target="_blank" rel="noopener"' : ''}>
                        ${portal.subPortals ? 'View Details' : 'Enter Portal'} →
                    </a>`
                }
                <div class="portal-tags">
                    ${tagsHtml}
                </div>
            </div>
        `;
    }
    
    createSubPortals(subPortals) {
        const subPortalsHtml = subPortals.map(sub => `
            <div class="sub-portal">
                <a href="${sub.url}" target="_blank" rel="noopener" class="sub-portal-link">
                    <span class="sub-portal-title">${sub.title}</span>
                    <span class="sub-portal-desc">${sub.description}</span>
                </a>
            </div>
        `).join('');
        
        return `
            <div class="sub-portals">
                ${subPortalsHtml}
            </div>
        `;
    }
    
    bindPortalEvents() {
        const portalCards = document.querySelectorAll('.portal-card');
        
        portalCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // If clicking on a link or sub-portal, don't trigger card click event
                if (e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                
                const portalId = parseInt(card.dataset.portalId);
                const portal = portalsData.find(p => p.id === portalId);
                
                // Skip disabled portals
                if (portal && portal.disabled) {
                    return;
                }
                
                if (portal && portal.url !== '#') {
                    if (portal.external) {
                        window.open(portal.url, '_blank');
                    } else {
                        window.location.href = portal.url;
                    }
                }
            });
        });
    }
    
    updateStats() {
        this.portalCount.textContent = this.filteredPortals.length;
    }
}

// Add additional CSS styles
const additionalStyles = `
    .no-results {
        text-align: center;
        padding: 60px 20px;
        grid-column: 1 / -1;
    }
    
    .no-results-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .no-results h3 {
        color: var(--tardis-gold);
        margin-bottom: 10px;
    }
    
    .no-results p {
        color: var(--tardis-text-secondary);
    }
    
    .external-icon {
        font-size: 0.8rem;
        color: var(--tardis-gold);
        margin-left: 5px;
    }
    
    .portal-card.featured {
        border-color: var(--tardis-gold);
        box-shadow: 0 0 20px var(--tardis-glow);
    }
    
    .portal-card.featured::after {
        content: '⭐';
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 1.2rem;
    }
    
    .sub-portals {
        margin: 15px 0;
        border-top: 1px solid rgba(255, 215, 0, 0.3);
        padding-top: 15px;
    }
    
    .sub-portal {
        margin-bottom: 8px;
    }
    
    .sub-portal-link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(0, 26, 51, 0.5);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        text-decoration: none;
        color: var(--tardis-text);
        transition: all 0.3s ease;
    }
    
    .sub-portal-link:hover {
        background: rgba(255, 215, 0, 0.1);
        border-color: var(--tardis-gold);
        transform: translateX(5px);
    }
    
    .sub-portal-title {
        font-weight: 500;
        color: var(--tardis-gold);
    }
    
    .sub-portal-desc {
        font-size: 0.8rem;
        color: var(--tardis-text-secondary);
    }
`;

// Dynamically add styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    new TardisSearch();
}); 