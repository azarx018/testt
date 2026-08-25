import { transactionsDb } from '../db/transactions.js';
import { productsDb } from '../db/products.js';
import { formatCurrency } from '../utils/currency.js';

export async function renderDashboard() {
    return `
        <div class="dashboard animate-fade-in">
            <header class="section-header">
                <h1>Selamat datang 👋</h1>
                <p class="text-muted">Kasir POS - Ringkasan Bisnis Anda</p>
            </header>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">Penjualan Hari Ini</span>
                    <span id="today-sales" class="stat-value">Rp 0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Transaksi</span>
                    <span id="today-transactions" class="stat-value">0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Stok Menipis</span>
                    <span id="low-stock-count" class="stat-value">0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Produk</span>
                    <span id="total-products" class="stat-value">0</span>
                </div>
            </div>

            <section class="quick-actions">
                <h3>Aksi Cepat</h3>
                <div class="action-grid">
                    <a href="#/pos" class="action-button">Kasir (Transaksi Baru)</a>
                    <a href="#/products" class="action-button">Manajemen Produk</a>
                    <a href="#/history" class="action-button">Riwayat Transaksi</a>
                    <a href="#/inventory" class="action-button">Stok Masuk/Keluar</a>
                </div>
            </section>

            <section id="low-stock-section" class="quick-actions" style="display: none;">
                <h3>Peringatan Stok Menipis</h3>
                <div class="table-responsive">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Stok</th>
                                <th>Min.</th>
                            </tr>
                        </thead>
                        <tbody id="low-stock-list">
                            <!-- Low stock items will be injected here -->
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

export async function initDashboard() {
    try {
        const transactions = await transactionsDb.getAll();
        const products = await productsDb.getAll();

        // 1. Calculate Today's Stats
        const today = new Date().toISOString().slice(0, 10);
        const todayTransactions = transactions.filter(t => t.createdAt.startsWith(today));
        
        const todaySales = todayTransactions.reduce((acc, curr) => acc + curr.total, 0);
        const transactionsCount = todayTransactions.length;

        // 2. Calculate Stock Stats
        const lowStockItems = products.filter(p => p.stock <= p.minimumStock);
        const totalProducts = products.length;

        // 3. Update DOM
        document.getElementById('today-sales').textContent = formatCurrency(todaySales);
        document.getElementById('today-transactions').textContent = transactionsCount;
        document.getElementById('low-stock-count').textContent = lowStockItems.length;
        document.getElementById('total-products').textContent = totalProducts;

        // 4. Update Low Stock List
        if (lowStockItems.length > 0) {
            const lowStockSection = document.getElementById('low-stock-section');
            const lowStockList = document.getElementById('low-stock-list');
            
            lowStockSection.style.display = 'block';
            lowStockList.innerHTML = lowStockItems.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td class="text-danger"><strong>${item.stock}</strong></td>
                    <td>${item.minimumStock}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}
