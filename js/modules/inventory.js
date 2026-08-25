import { productsDb } from '../db/products.js';
import { stockDb } from '../db/stock.js';
import { state } from '../core/state.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export async function renderInventory() {
    return `
        <div class="inventory-module animate-fade-in">
            <header class="module-header">
                <h1>Manajemen Stok</h1>
                <button id="add-stock-btn" class="btn btn-primary">Input Stok Baru</button>
            </header>

            <div class="filter-bar">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="inventory-search" placeholder="Cari riwayat stok atau produk...">
                </div>
            </div>

            <div class="table-responsive">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Produk</th>
                            <th>Tipe</th>
                            <th>Qty</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list">
                        <!-- Injected by JS -->
                    </tbody>
                </table>
                <div id="inventory-empty-state" class="empty-state" style="display: none; padding: var(--spacing-xl); text-align: center;">
                    <p class="text-muted">Tidak ada riwayat pergerakan stok.</p>
                </div>
            </div>
        </div>
    `;
}

export async function initInventory() {
    const addStockBtn = document.getElementById('add-stock-btn');
    const searchInput = document.getElementById('inventory-search');
    const inventoryList = document.getElementById('inventory-list');
    const emptyState = document.getElementById('inventory-empty-state');

    let allMovements = [];

    async function loadMovements() {
        allMovements = await stockDb.getAll();
        // Sort by date desc
        allMovements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderList();
    }

    function renderList() {
        const query = searchInput.value.toLowerCase().trim();
        
        // Enhance movements with product names
        const enriched = allMovements.map(m => {
            const product = state.products.find(p => p.id === m.productId);
            return { ...m, productName: product ? product.name : 'Produk Dihapus' };
        });

        const filtered = enriched.filter(m => 
            m.productName.toLowerCase().includes(query) || 
            (m.note && m.note.toLowerCase().includes(query))
        );

        inventoryList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        filtered.forEach(m => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="product-td-info">
                        <span>${new Date(m.createdAt).toLocaleDateString('id-ID')}</span>
                        <span class="text-xs text-muted">${new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </td>
                <td><strong>${m.productName}</strong></td>
                <td>
                    <span class="badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}" 
                          style="background-color: ${m.type === 'IN' ? '#e8f5e9' : '#ffebee'}; color: ${m.type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)'};">
                        ${m.type === 'IN' ? 'MASUK' : 'KELUAR'}
                    </span>
                </td>
                <td><strong>${m.quantity}</strong></td>
                <td class="text-muted">${m.note || '-'}</td>
            `;
            inventoryList.appendChild(row);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderList);
    }

    if (addStockBtn) {
        addStockBtn.addEventListener('click', () => {
            showAddStockModal();
        });
    }

    await loadMovements();

    function showAddStockModal() {
        const productOptions = state.products.map(p => `<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`).join('');
        
        const bodyHtml = `
            <form id="stock-form" class="modal-form">
                <div class="form-group">
                    <label for="stock-product">Produk</label>
                    <select id="stock-product" required>
                        <option value="">Pilih Produk...</option>
                        ${productOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="stock-type">Tipe</label>
                        <select id="stock-type" required>
                            <option value="IN">Stok Masuk</option>
                            <option value="OUT">Stok Keluar</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="stock-qty">Jumlah (Qty)</label>
                        <input type="number" id="stock-qty" min="1" required placeholder="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="stock-note">Keterangan (Opsional)</label>
                    <input type="text" id="stock-note" placeholder="Contoh: Kulakan, Barang Rusak, dll">
                </div>
            </form>
        `;

        const modal = new Modal({
            title: 'Input Pergerakan Stok',
            body: bodyHtml,
            confirmText: 'Simpan',
            onConfirm: async () => {
                const form = document.getElementById('stock-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                const productId = parseInt(document.getElementById('stock-product').value);
                const type = document.getElementById('stock-type').value;
                const quantity = parseInt(document.getElementById('stock-qty').value);
                const note = document.getElementById('stock-note').value;

                try {
                    const product = await productsDb.getById(productId);
                    if (!product) throw new Error('Produk tidak ditemukan');

                    // Update product stock
                    if (type === 'IN') {
                        product.stock += quantity;
                    } else {
                        if (product.stock < quantity) {
                            Toast.error('Stok tidak cukup untuk dikurangi!');
                            return false;
                        }
                        product.stock -= quantity;
                    }

                    await productsDb.put(product);
                    await stockDb.addMovement(productId, type, quantity, note);

                    // Update global state
                    const updatedProducts = await productsDb.getAll();
                    state.setState({ products: updatedProducts });

                    Toast.success('Stok berhasil diperbarui');
                    loadMovements(); // Refresh list
                    return true;
                } catch (error) {
                    console.error('Error updating stock:', error);
                    Toast.error('Gagal memperbarui stok');
                    return false;
                }
            }
        });

        modal.show();
    }
}
