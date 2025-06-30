// MCP Servers Page JavaScript
class MCPServersApp {
    constructor() {
        this.servers = null;
        this.filteredServers = null;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.init();
    }

    async init() {
        try {
            await this.loadServers();
            this.setupEventListeners();
            this.updateStats();
            this.renderServers();
        } catch (error) {
            console.error('Failed to initialize MCP Servers:', error);
            this.showError();
        }
    }

    async loadServers() {
        try {
            const response = await fetch('../data/mcp-servers.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.servers = await response.json();
            this.filteredServers = this.servers;
        } catch (error) {
            console.error('Error loading servers:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('resourceSearch');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterServers();
        });

        // Filter tabs
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.category;
                this.updateActiveFilter(e.target);
                this.filterServers();
            });
        });
    }

    updateActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    filterServers() {
        if (!this.servers) return;

        let filtered = this.servers.servers;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(server => server.category === this.currentFilter);
        }

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(server => 
                server.name.toLowerCase().includes(this.searchTerm) ||
                server.description.toLowerCase().includes(this.searchTerm) ||
                server.author.toLowerCase().includes(this.searchTerm) ||
                server.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)) ||
                server.capabilities.some(cap => cap.toLowerCase().includes(this.searchTerm))
            );
        }

        this.filteredServers = { ...this.servers, servers: filtered };
        this.renderServers();
    }

    updateStats() {
        if (!this.servers) return;

        const metadata = this.servers.metadata;
        
        document.getElementById('totalServers').textContent = metadata.totalServers;
        document.getElementById('activeServers').textContent = metadata.activeServers;
        
        const lastUpdated = new Date(metadata.lastUpdated);
        document.getElementById('lastUpdated').textContent = lastUpdated.toLocaleDateString('en-US');
    }

    renderServers() {
        const container = document.getElementById('resourcesGrid');
        
        if (!this.filteredServers || this.filteredServers.servers.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        // Group servers by category
        const grouped = this.groupServersByCategory(this.filteredServers.servers);
        let html = '';
        
        for (const [categoryId, servers] of Object.entries(grouped)) {
            if (servers.length > 0) {
                const categoryInfo = this.servers.categories[categoryId];
                html += this.renderCategoryHeader(categoryInfo, servers.length);
                
                servers.forEach(server => {
                    html += this.renderServerCard(server);
                });
            }
        }

        container.innerHTML = html;
    }

    groupServersByCategory(servers) {
        const grouped = {};
        servers.forEach(server => {
            if (!grouped[server.category]) {
                grouped[server.category] = [];
            }
            grouped[server.category].push(server);
        });
        return grouped;
    }

    renderCategoryHeader(categoryInfo, count) {
        if (!categoryInfo) return '';
        
        return `
            <div class="category-header">
                <h2>
                    ${categoryInfo.name}
                    <span class="category-count">${count}</span>
                </h2>
                <p>${categoryInfo.description}</p>
            </div>
        `;
    }

    renderServerCard(server) {
        const statusClass = this.getStatusClass(server.status.health);
        const compatibilityIcons = this.renderCompatibility(server.status.compatibility);
        
        return `
            <div class="resource-card mcp-server-card">
                <div class="resource-header-info">
                    <div>
                        <div class="resource-name">${server.name}</div>
                        <div class="server-author">by ${server.author}</div>
                        <div class="resource-status">
                            <div class="status-indicator ${statusClass}"></div>
                            <span>${this.getStatusText(server.status.health)}</span>
                        </div>
                    </div>
                    <div class="server-stats">
                        <div class="stat">⭐ ${server.status.stars || 0}</div>
                        <div class="stat">🍴 ${server.status.forks || 0}</div>
                        <div class="stat">🐛 ${server.status.issues || 0}</div>
                    </div>
                </div>
                
                <div class="resource-description">
                    ${server.description}
                </div>
                
                <div class="server-capabilities">
                    <div class="capabilities-title">Capabilities</div>
                    <div class="capabilities-list">
                        ${server.capabilities.map(cap => `
                            <span class="capability-tag">${this.translateCapability(cap)}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="server-compatibility">
                    <div class="compatibility-title">Compatibility</div>
                    <div class="compatibility-list">
                        ${compatibilityIcons}
                    </div>
                </div>
                
                <div class="server-installation">
                    <div class="installation-title">Installation</div>
                    <div class="installation-info">
                        <div class="npm-package">📦 ${server.installation.npm}</div>
                        <div class="requirements">
                            ${server.installation.requirements.map(req => `
                                <span class="requirement-tag">${req}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="resource-tags">
                    ${server.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
                
                <div class="resource-actions">
                    <a href="${server.repository}" target="_blank" rel="noopener noreferrer" class="resource-link">
                        View Repository 🔗
                    </a>
                    <div class="last-commit">
                        Last commit: ${server.status.lastCommit || 'Unknown'}
                    </div>
                </div>
            </div>
        `;
    }

    renderCompatibility(compatibility) {
        const icons = [];
        for (const [model, status] of Object.entries(compatibility)) {
            const icon = status === '✅' ? '✅' : status === '⚠️' ? '⚠️' : '❌';
            icons.push(`<span class="compatibility-item" title="${model}">${icon} ${model}</span>`);
        }
        return icons.join('');
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>🔍 No matching MCP servers found</h3>
                <p>Try adjusting your search terms or selecting a different category.</p>
                <p>Or clear the search box to see all servers.</p>
            </div>
        `;
    }

    getStatusClass(health) {
        switch (health) {
            case 'active': return '';
            case 'maintenance': return 'warning';
            case 'inactive': return 'unhealthy';
            default: return '';
        }
    }

    getStatusText(health) {
        switch (health) {
            case 'active': return 'Active';
            case 'maintenance': return 'Maintenance';
            case 'inactive': return 'Inactive';
            default: return 'Unknown';
        }
    }

    translateCapability(capability) {
        const translations = {
            'read_pages': 'Read Pages',
            'create_pages': 'Create Pages',
            'update_pages': 'Update Pages',
            'search_content': 'Search Content',
            'manage_blocks': 'Manage Blocks',
            'repository_info': 'Repo Info',
            'file_operations': 'File Operations',
            'issue_management': 'Issue Management',
            'pull_requests': 'PR Management',
            'search_code': 'Code Search',
            'read_files': 'Read Files',
            'write_files': 'Write Files',
            'list_directories': 'List Directories',
            'file_search': 'File Search',
            'file_permissions': 'File Permissions',
            'list_files': 'List Files',
            'upload_files': 'Upload Files',
            'download_files': 'Download Files',
            'share_files': 'Share Files',
            'search_drive': 'Search Drive',
            'send_messages': 'Send Messages',
            'read_channels': 'Read Channels',
            'user_management': 'User Management',
            'file_sharing': 'File Sharing',
            'channel_management': 'Channel Management',
            'sql_queries': 'SQL Queries',
            'schema_inspection': 'Schema Inspection',
            'data_export': 'Data Export',
            'table_operations': 'Table Operations',
            'connection_pooling': 'Connection Pooling',
            'fetch_webpage': 'Fetch Webpage',
            'extract_text': 'Extract Text',
            'parse_html': 'Parse HTML',
            'follow_links': 'Follow Links',
            'screenshot_capture': 'Screenshot',
            'send_email': 'Send Email',
            'read_inbox': 'Read Inbox',
            'email_templates': 'Email Templates',
            'attachment_handling': 'Attachment Handling',
            'filter_management': 'Filter Management'
        };
        return translations[capability] || capability;
    }

    showError() {
        const container = document.getElementById('resourcesGrid');
        container.innerHTML = `
            <div class="empty-state">
                <h3>⚠️ Load Failed</h3>
                <p>Could not load MCP server data. Please check your connection or try again later.</p>
                <button onclick="location.reload()" class="resource-link" style="margin-top: 1rem; display: inline-block;">
                    Reload
                </button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MCPServersApp();
});

// Add loading animation
document.getElementById('resourcesGrid').innerHTML = `
    <div class="loading">
        Loading MCP Servers...
    </div>
`;