/**
 * Simple hash-based router
 */
export class Router {
    constructor(routes, containerId) {
        this.routes = routes;
        this.container = document.getElementById(containerId);
        this.currentRoute = null;

        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('load', () => this.handleRouteChange());
    }

    async handleRouteChange() {
        const hash = window.location.hash || '#/';
        const route = this.routes.find(r => {
            if (typeof r.path === 'string') {
                return r.path === hash;
            }
            return r.path.test(hash);
        });

        if (route) {
            this.currentRoute = route;
            this.updateActiveNav(hash);
            
            try {
                // Show loading state if needed
                if (this.container) {
                    this.container.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
                }

                const content = await route.render();
                if (this.container) {
                    this.container.innerHTML = '';
                    if (typeof content === 'string') {
                        this.container.innerHTML = content;
                    } else if (content instanceof Node) {
                        this.container.appendChild(content);
                    }
                }

                if (route.afterRender) {
                    await route.afterRender();
                }
            } catch (error) {
                console.error('Routing error:', error);
                if (this.container) {
                    this.container.innerHTML = `<div class="error-state">Maaf, terjadi kesalahan saat memuat halaman.</div>`;
                }
            }
        } else {
            console.warn('Route not found:', hash);
            window.location.hash = '#/';
        }
    }

    updateActiveNav(hash) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemHash = item.getAttribute('href');
            if (itemHash === hash || (hash === '#/' && itemHash === '#/')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    navigateTo(path) {
        window.location.hash = path;
    }
}
