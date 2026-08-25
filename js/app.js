import { Router } from './core/router.js';
import { db } from './db/database.js';
import { productsDb } from './db/products.js';
import { categoriesDb } from './db/categories.js';
import { state } from './core/state.js';
import { formatCurrency } from './utils/currency.js';

// Initialize App
async function initApp() {
    try {
        // 1. Initialize Database
        await db.init();
        
        // 2. Seed Database
        await productsDb.seed();
        await categoriesDb.seed();
        
        // 3. Load Initial Data into State
        const categories = await categoriesDb.getAll();
        const products = await productsDb.getAll();
        
        state.setState({ categories, products });

        // 4. Setup Routes
        const routes = [
            {
                path: '#/',
                render: async () => {
                    const { renderDashboard } = await import('./modules/dashboard.js');
                    return renderDashboard();
                },
                afterRender: async () => {
                    const { initDashboard } = await import('./modules/dashboard.js');
                    initDashboard();
                }
            },
            {
                path: '#/pos',
                render: async () => {
                    const { renderPOS, initPOS } = await import('./modules/pos.js');
                    return renderPOS();
                },
                afterRender: async () => {
                    const { initPOS } = await import('./modules/pos.js');
                    initPOS();
                }
            },
            {
                path: '#/products',
                render: async () => {
                    const { renderProducts } = await import('./modules/products.js');
                    return renderProducts();
                },
                afterRender: async () => {
                    const { initProducts } = await import('./modules/products.js');
                    initProducts();
                }
            },
            {
                path: '#/history',
                render: async () => {
                    const { renderHistory } = await import('./modules/history.js');
                    return renderHistory();
                },
                afterRender: async () => {
                    const { initHistory } = await import('./modules/history.js');
                    initHistory();
                }
            },
            {
                path: '#/inventory',
                render: async () => {
                    const { renderInventory } = await import('./modules/inventory.js');
                    return renderInventory();
                },
                afterRender: async () => {
                    const { initInventory } = await import('./modules/inventory.js');
                    initInventory();
                }
            },
            {
                path: '#/more',
                render: async () => {
                    const { renderMore } = await import('./modules/more.js');
                    return renderMore();
                },
                afterRender: async () => {
                    const { initMore } = await import('./modules/more.js');
                    initMore();
                }
            }
        ];

        // 5. Start Router
        new Router(routes, 'main-content');

    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}

// Start the app
initApp();
