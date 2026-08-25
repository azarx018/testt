import { state } from '../core/state.js';
import { productsDb } from '../db/products.js';
import { categoriesDb } from '../db/categories.js';
import { formatCurrency } from '../utils/currency.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export function renderProducts() {
    return `
        <div class="products-module animate-fade-in">
            <header class="module-header">
                <div class="header-left">
                    <h1>Kelola Produk</h1>
                    <p class="text-muted">Total: <span id="product-count">0</span> produk</p>
                </div>
                <button id="add-product-btn" class="btn btn-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Tambah Produk
                </button>
            </header>

            <div class="filter-bar">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="product-search" placeholder="Cari produk atau barcode...">
                </div>
                <select id="category-filter">
                    <option value="">Semua Kategori</option>
                </select>
            </div>

            <div class="product-list-container">
                <div class="table-responsive">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Kategori</th>
                                <th>Barcode</th>
                                <th>Harga Modal</th>
                                <th>Harga Jual</th>
                                <th>Stok</th>
                                <th style="text-align: right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="product-table-body">
                            <!-- Injected by JS -->
                        </tbody>
                    </table>
                </div>
                <div id="product-empty-state" class="empty-state" style="display: none;">
                    <h3>Belum ada produk</h3>
                    <p class="text-muted">Tambahkan produk pertama Anda untuk mulai mengelola inventaris.</p>
                </div>
            </div>
        </div>
    `;
}

export function initProducts() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const addProductBtn = document.getElementById('add-product-btn');

    // Populate category filter
    populateCategories();

    // Render list
    renderProductList();

    // Event listeners
    if (searchInput) searchInput.addEventListener('input', () => renderProductList());
    if (categoryFilter) categoryFilter.addEventListener('change', () => renderProductList());
    if (addProductBtn) addProductBtn.addEventListener('click', () => showProductModal());
}

async function populateCategories() {
    const filterSelect = document.getElementById('category-filter');
    if (!filterSelect) return;

    const categories = await categoriesDb.getAll();
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        filterSelect.appendChild(opt);
    });
}

function renderProductList() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const tbody = document.getElementById('product-table-body');
    const emptyState = document.getElementById('product-empty-state');
    const countSpan = document.getElementById('product-count');

    if (!tbody) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCatId = categoryFilter ? categoryFilter.value : '';

    const filtered = state.products.filter(prod => {
        const matchesQuery = prod.name.toLowerCase().includes(query) || (prod.barcode && prod.barcode.includes(query));
        const matchesCat = selectedCatId === '' || String(prod.categoryId) === String(selectedCatId);
        return matchesQuery && matchesCat;
    });

    if (countSpan) countSpan.textContent = filtered.length;

    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    filtered.forEach(prod => {
        const cat = state.categories.find(c => String(c.id) === String(prod.categoryId));
        const catName = cat ? cat.name : 'Lainnya';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="product-td-info">
                    <span class="product-name-txt">${prod.name}</span>
                    ${prod.stock <= prod.minimumStock ? `<span class="badge badge-danger">Stok Tipis</span>` : ''}
                </div>
            </td>
            <td>${catName}</td>
            <td><code>${prod.barcode || '-'}</code></td>
            <td>${formatCurrency(prod.costPrice)}</td>
            <td class="text-bold">${formatCurrency(prod.sellingPrice)}</td>
            <td>
                <span class="${prod.stock <= prod.minimumStock ? 'text-danger text-bold' : ''}">${prod.stock}</span>
            </td>
            <td style="text-align: right">
                <div class="action-buttons-cell">
                    <button class="btn-icon btn-edit" data-id="${prod.id}" title="Edit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" data-id="${prod.id}" title="Hapus">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Event Delegation
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const product = state.products.find(p => p.id === id);
            if (product) showProductModal(product);
        });
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const product = state.products.find(p => p.id === id);
            if (product) confirmDeleteProduct(product);
        });
    });
}

function showProductModal(product = null) {
    const isEdit = !!product;
    const title = isEdit ? 'Edit Produk' : 'Tambah Produk Baru';
    
    // Create categories options
    const catOptions = state.categories.map(cat => `
        <option value="${cat.id}" ${product && String(product.categoryId) === String(cat.id) ? 'selected' : ''}>${cat.name}</option>
    `).join('');

    const bodyHtml = `
        <form id="product-form" class="modal-form">
            <div class="form-group">
                <label for="form-name">Nama Produk*</label>
                <input type="text" id="form-name" required value="${product ? product.name : ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="form-barcode">Barcode</label>
                    <input type="text" id="form-barcode" value="${product ? (product.barcode || '') : ''}">
                </div>
                <div class="form-group">
                    <label for="form-category">Kategori*</label>
                    <select id="form-category" required>
                        ${catOptions}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="form-cost">Harga Modal (Rp)*</label>
                    <input type="number" id="form-cost" min="0" required value="${product ? product.costPrice : ''}">
                </div>
                <div class="form-group">
                    <label for="form-selling">Harga Jual (Rp)*</label>
                    <input type="number" id="form-selling" min="0" required value="${product ? product.sellingPrice : ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="form-stock">Stok*</label>
                    <input type="number" id="form-stock" min="0" required value="${product ? product.stock : ''}">
                </div>
                <div class="form-group">
                    <label for="form-min-stock">Minimum Stok*</label>
                    <input type="number" id="form-min-stock" min="0" required value="${product ? product.minimumStock : '5'}">
                </div>
            </div>
        </form>
    `;

    const modal = new Modal({
        title,
        body: bodyHtml,
        confirmText: isEdit ? 'Simpan' : 'Tambah',
        onConfirm: async () => {
            const form = document.getElementById('product-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return false;
            }

            const name = document.getElementById('form-name').value.trim();
            const barcode = document.getElementById('form-barcode').value.trim();
            const categoryId = parseInt(document.getElementById('form-category').value);
            const costPrice = parseFloat(document.getElementById('form-cost').value);
            const sellingPrice = parseFloat(document.getElementById('form-selling').value);
            const stock = parseInt(document.getElementById('form-stock').value);
            const minimumStock = parseInt(document.getElementById('form-min-stock').value);

            if (costPrice < 0 || sellingPrice < 0 || stock < 0 || minimumStock < 0) {
                Toast.error('Harga dan stok tidak boleh negatif!');
                return false;
            }

            if (sellingPrice < costPrice) {
                Toast.warning('Harga jual lebih rendah dari harga modal.');
            }

            const productData = {
                name,
                barcode,
                categoryId,
                costPrice,
                sellingPrice,
                stock,
                minimumStock,
                image: ''
            };

            try {
                if (isEdit) {
                    productData.id = product.id;
                    productData.createdAt = product.createdAt;
                    await productsDb.put(productData);
                    Toast.success('Produk berhasil diperbarui');
                } else {
                    await productsDb.add(productData);
                    Toast.success('Produk berhasil ditambahkan');
                }

                // Update central state
                const updatedProducts = await productsDb.getAll();
                state.setState({ products: updatedProducts });
                
                // Refresh list
                renderProductList();
                return true;
            } catch (error) {
                console.error('Error saving product:', error);
                Toast.error('Gagal menyimpan produk');
                return false;
            }
        }
    });

    modal.show();
}

function confirmDeleteProduct(product) {
    const modal = new Modal({
        title: 'Hapus Produk',
        body: `<p>Apakah Anda yakin ingin menghapus produk <strong>${product.name}</strong>?</p>`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        onConfirm: async () => {
            try {
                await productsDb.delete(product.id);
                Toast.success('Produk berhasil dihapus');

                // Update state
                const updatedProducts = await productsDb.getAll();
                state.setState({ products: updatedProducts });

                renderProductList();
                return true;
            } catch (error) {
                console.error('Error deleting product:', error);
                Toast.error('Gagal menghapus produk');
                return false;
            }
        }
    });
    modal.show();
}
