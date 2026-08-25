import { state } from '../core/state.js';
import { formatCurrency } from '../utils/currency.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { transactionsDb } from '../db/transactions.js';
import { stockDb } from '../db/stock.js';
import { productsDb } from '../db/products.js';

export function renderPOS() {
    return `
        <div class="pos-module animate-fade-in">
            <!-- Left Panel (Products Grid) -->
            <div class="pos-main">
                <header class="pos-search-header">
                    <div class="search-input-wrapper">
                        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="pos-search" placeholder="Cari nama produk atau scan barcode...">
                    </div>
                </header>

                <div class="categories-chips-wrapper">
                    <div class="categories-chips" id="categories-chips-container">
                        <button class="chip active" data-category-id="">Semua</button>
                        <!-- Injected by JS -->
                    </div>
                </div>

                <div class="product-grid-container">
                    <div class="product-grid" id="pos-product-grid">
                        <!-- Injected by JS -->
                    </div>
                    <div id="pos-empty-state" class="empty-state" style="display: none;">
                        <h3>Produk tidak ditemukan</h3>
                        <p class="text-muted">Coba cari dengan kata kunci lain.</p>
                    </div>
                </div>
            </div>

            <!-- Right Panel (Persistent Cart on Desktop) -->
            <aside class="pos-sidebar" id="pos-cart-sidebar">
                <div class="cart-card">
                    <div class="cart-header">
                        <h3>Keranjang Belanja</h3>
                        <button id="clear-cart-btn" class="btn-text text-danger">Reset</button>
                    </div>
                    <div class="cart-items" id="cart-items-container">
                        <!-- Injected by JS -->
                    </div>
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal</span>
                            <span id="cart-subtotal">Rp 0</span>
                        </div>
                        <div class="summary-row">
                            <span>Diskon</span>
                            <input type="number" id="cart-discount" min="0" value="0" placeholder="Rp">
                        </div>
                        <div class="summary-row total-row">
                            <span>Total</span>
                            <span id="cart-total" class="text-bold text-primary">Rp 0</span>
                        </div>
                        <button id="checkout-btn" class="btn btn-primary btn-block btn-lg" disabled>Bayar Sekarang</button>
                    </div>
                </div>
            </aside>

            <!-- Sticky Cart Bar (Mobile Only) -->
            <div class="mobile-cart-bar" id="mobile-cart-bar" style="display: none;">
                <div class="mobile-cart-info">
                    <span id="mobile-cart-count">0 Item</span>
                    <span id="mobile-cart-total" class="text-bold">Rp 0</span>
                </div>
                <button id="mobile-cart-view-btn" class="btn btn-secondary">Lihat Keranjang</button>
            </div>
        </div>
    `;
}

export function initPOS() {
    const searchInput = document.getElementById('pos-search');
    const chipsContainer = document.getElementById('categories-chips-container');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const discountInput = document.getElementById('cart-discount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const mobileCartViewBtn = document.getElementById('mobile-cart-view-btn');

    let selectedCategoryId = '';

    // Render chips
    renderCategoryChips();

    // Render Products
    renderPOSProducts();

    // Render Cart
    renderCart();

    // Subscribe state changes to re-render cart
    const unsubscribe = state.subscribe(() => {
        renderCart();
        renderPOSProducts(); // In case stock changed
    });

    // Save unsubscribe function on main container so we can clean up if navigating away
    const container = document.getElementById('main-content');
    container.addEventListener('hashchange', function cleanup() {
        unsubscribe();
        container.removeEventListener('hashchange', cleanup);
    });

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderPOSProducts();
        });
    }

    if (chipsContainer) {
        chipsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip');
            if (!btn) return;

            chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');

            selectedCategoryId = btn.getAttribute('data-category-id');
            renderPOSProducts();
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            state.clearCart();
            Toast.success('Keranjang dikosongkan');
        });
    }

    if (discountInput) {
        discountInput.addEventListener('input', () => {
            updateCartSummary();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            showPaymentModal();
        });
    }

    if (mobileCartViewBtn) {
        mobileCartViewBtn.addEventListener('click', () => {
            showMobileCartBottomSheet();
        });
    }

    function renderCategoryChips() {
        if (!chipsContainer) return;
        
        // Clear old ones except 'Semua'
        const allBtn = chipsContainer.querySelector('[data-category-id=""]');
        chipsContainer.innerHTML = '';
        chipsContainer.appendChild(allBtn);

        state.categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.setAttribute('data-category-id', cat.id);
            btn.textContent = cat.name;
            chipsContainer.appendChild(btn);
        });
    }

    function renderPOSProducts() {
        const grid = document.getElementById('pos-product-grid');
        const emptyState = document.getElementById('pos-empty-state');
        if (!grid) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filtered = state.products.filter(prod => {
            const matchesQuery = prod.name.toLowerCase().includes(query) || (prod.barcode && prod.barcode.includes(query));
            const matchesCat = selectedCategoryId === '' || String(prod.categoryId) === String(selectedCategoryId);
            return matchesQuery && matchesCat;
        });

        grid.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        filtered.forEach(prod => {
            const card = document.createElement('div');
            card.className = `pos-product-card ${prod.stock === 0 ? 'out-of-stock' : ''}`;
            
            // Subtly find if product is already in cart to display quantity badging or active borders
            const cartItem = state.cart.find(item => item.id === prod.id);
            const inCartQty = cartItem ? cartItem.quantity : 0;

            card.innerHTML = `
                <div class="product-card-img-placeholder">
                    <span>${prod.name.charAt(0)}</span>
                    ${inCartQty > 0 ? `<span class="product-card-qty-badge">${inCartQty}</span>` : ''}
                </div>
                <div class="product-card-details">
                    <h4 class="product-card-title">${prod.name}</h4>
                    <div class="product-card-bottom">
                        <div class="product-card-pricing">
                            <span class="product-card-price">${formatCurrency(prod.sellingPrice)}</span>
                            <span class="product-card-stock">Stok: ${prod.stock}</span>
                        </div>
                        <button class="btn-add-to-cart btn-primary" data-id="${prod.id}" ${prod.stock === 0 ? 'disabled' : ''}>
                            ${prod.stock === 0 ? 'Habis' : '+'}
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        // Event delegation for Add to Cart
        grid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const prod = state.products.find(p => p.id === id);
                if (prod) {
                    const success = state.addToCart(prod);
                    if (success) {
                        Toast.success(`${prod.name} ditambahkan`);
                    } else {
                        Toast.error('Gagal menambahkan: Stok tidak mencukupi');
                    }
                }
            });
        });
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    const mobileCartBar = document.getElementById('mobile-cart-bar');
    const mobileCartCount = document.getElementById('mobile-cart-count');
    const mobileCartTotal = document.getElementById('mobile-cart-total');

    if (!container) return;

    container.innerHTML = '';

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p class="text-muted">Keranjang masih kosong</p>
            </div>
        `;
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (mobileCartBar) mobileCartBar.style.display = 'none';
        updateCartSummary();
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    // Mobile bar updates
    if (mobileCartBar) {
        mobileCartBar.style.display = 'flex';
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = state.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        if (mobileCartCount) mobileCartCount.textContent = `${totalItems} Item`;
        if (mobileCartTotal) mobileCartTotal.textContent = formatCurrency(subtotal);
    }

    state.cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${formatCurrency(item.sellingPrice)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn btn-dec" data-id="${item.id}">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn btn-inc" data-id="${item.id}">+</button>
            </div>
        `;
        container.appendChild(cartItem);
    });

    // Cart controls events
    container.querySelectorAll('.btn-dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = state.cart.find(i => i.id === id);
            if (item) {
                state.updateQuantity(id, item.quantity - 1);
            }
        });
    });

    container.querySelectorAll('.btn-inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = state.cart.find(i => i.id === id);
            const product = state.products.find(p => p.id === id);
            if (item && product) {
                if (item.quantity < product.stock) {
                    state.updateQuantity(id, item.quantity + 1);
                } else {
                    Toast.error('Stok tidak mencukupi');
                }
            }
        });
    });

    updateCartSummary();
}

function updateCartSummary() {
    const subtotalSpan = document.getElementById('cart-subtotal');
    const discountInput = document.getElementById('cart-discount');
    const totalSpan = document.getElementById('cart-total');

    if (!subtotalSpan) return;

    const subtotal = state.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - discount);

    subtotalSpan.textContent = formatCurrency(subtotal);
    if (totalSpan) totalSpan.textContent = formatCurrency(total);
}

function showMobileCartBottomSheet() {
    // Implement mobile-optimized full-screen cart or Bottom Sheet modal
    const itemsHtml = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${formatCurrency(item.sellingPrice)}</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn btn-bs-dec" data-id="${item.id}">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn btn-bs-inc" data-id="${item.id}">+</button>
            </div>
        </div>
    `).join('');

    const subtotal = state.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    const bodyHtml = `
        <div class="bottom-sheet-cart">
            <div class="bs-cart-items">
                ${itemsHtml}
            </div>
            <div class="cart-summary" style="margin-top: var(--spacing-md)">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Diskon</span>
                    <input type="number" id="bs-cart-discount" min="0" value="${document.getElementById('cart-discount')?.value || 0}" placeholder="Rp">
                </div>
                <div class="summary-row total-row">
                    <span>Total</span>
                    <span id="bs-cart-total" class="text-bold text-primary">${formatCurrency(subtotal)}</span>
                </div>
            </div>
        </div>
    `;

    const bsModal = new Modal({
        title: 'Keranjang Belanja',
        body: bodyHtml,
        confirmText: 'Lanjut Pembayaran',
        onConfirm: () => {
            // Transfer discount value back to primary sidebar if synced
            const bsDiscount = parseFloat(document.getElementById('bs-cart-discount')?.value || 0);
            const mainDiscount = document.getElementById('cart-discount');
            if (mainDiscount) {
                mainDiscount.value = bsDiscount;
                updateCartSummary();
            }
            showPaymentModal();
            return false; // BUG FIX: Return false so the cart modal doesn't auto-hide and destroy the payment modal
        }
    });

    bsModal.show();

    // Bind bottom sheet item control actions
    const modalContainer = document.getElementById('modal-container');
    modalContainer.querySelectorAll('.btn-bs-dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = state.cart.find(i => i.id === id);
            if (item) {
                state.updateQuantity(id, item.quantity - 1);
                // Simple re-render
                showMobileCartBottomSheet();
            }
        });
    });

    modalContainer.querySelectorAll('.btn-bs-inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            const item = state.cart.find(i => i.id === id);
            const product = state.products.find(p => p.id === id);
            if (item && product) {
                if (item.quantity < product.stock) {
                    state.updateQuantity(id, item.quantity + 1);
                    showMobileCartBottomSheet();
                } else {
                    Toast.error('Stok tidak mencukupi');
                }
            }
        });
    });

    // Handle discount updates on bottom sheet
    const bsDiscountInput = document.getElementById('bs-cart-discount');
    if (bsDiscountInput) {
        bsDiscountInput.addEventListener('input', () => {
            const bsDisc = parseFloat(bsDiscountInput.value) || 0;
            const total = Math.max(0, subtotal - bsDisc);
            document.getElementById('bs-cart-total').textContent = formatCurrency(total);
        });
    }
}

function showPaymentModal() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const discount = parseFloat(document.getElementById('cart-discount')?.value || 0);
    const total = Math.max(0, subtotal - discount);

    const bodyHtml = `
        <div class="payment-flow">
            <div class="payment-total-section">
                <span class="text-muted">Total Tagihan</span>
                <span class="payment-total-value text-primary">${formatCurrency(total)}</span>
            </div>

            <div class="form-group">
                <label>Metode Pembayaran</label>
                <div class="payment-methods-grid">
                    <button class="pay-method-btn active" data-method="Tunai">Tunai</button>
                    <button class="pay-method-btn" data-method="QRIS">QRIS</button>
                    <button class="pay-method-btn" data-method="Debit">Debit</button>
                </div>
            </div>

            <div class="form-group cash-received-group">
                <label for="cash-received">Uang Diterima (Tunai)</label>
                <input type="number" id="cash-received" min="${total}" placeholder="Masukkan nominal...">
                <div class="quick-cash-grid">
                    <button class="quick-cash-btn" data-value="${total}">${formatCurrency(total)}</button>
                    <button class="quick-cash-btn" data-value="10000">Rp 10.000</button>
                    <button class="quick-cash-btn" data-value="20000">Rp 20.000</button>
                    <button class="quick-cash-btn" data-value="50000">Rp 50.000</button>
                    <button class="quick-cash-btn" data-value="100000">Rp 100.000</button>
                </div>
            </div>

            <div class="payment-change-section" style="display: none;">
                <span class="text-muted">Uang Kembalian</span>
                <span id="payment-change-val" class="text-bold text-lg">Rp 0</span>
            </div>
        </div>
    `;

    const paymentModal = new Modal({
        title: 'Pembayaran',
        body: bodyHtml,
        confirmText: 'Proses Bayar',
        onConfirm: async () => {
            const method = document.querySelector('.pay-method-btn.active').getAttribute('data-method');
            const cashReceivedInput = document.getElementById('cash-received');
            const cashReceived = parseFloat(cashReceivedInput?.value || 0);

            if (method === 'Tunai') {
                if (isNaN(cashReceived) || cashReceived < total) {
                    Toast.error('Uang diterima kurang dari total tagihan!');
                    return false;
                }
            }

            // Save Transaction & Show Receipt
            await processTransaction(method, cashReceived, total, discount);
            return false; // Return false so the Modal class doesn't auto-hide and destroy the success modal
        }
    });

    paymentModal.show();

    // Bind Payment modal specific actions
    const modalContainer = document.getElementById('modal-container');
    const cashInput = document.getElementById('cash-received');
    const changeSection = modalContainer.querySelector('.payment-change-section');
    const changeValue = document.getElementById('payment-change-val');

    modalContainer.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modalContainer.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const selectedMethod = e.currentTarget.getAttribute('data-method');
            const cashGroup = modalContainer.querySelector('.cash-received-group');

            if (selectedMethod === 'Tunai') {
                cashGroup.style.display = 'flex';
                changeSection.style.display = 'flex';
            } else {
                cashGroup.style.display = 'none';
                changeSection.style.display = 'none';
            }
        });
    });

    if (cashInput) {
        cashInput.addEventListener('input', () => {
            calculateChange(total);
        });
    }

    modalContainer.querySelectorAll('.quick-cash-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = parseFloat(e.currentTarget.getAttribute('data-value'));
            if (val === total) {
                cashInput.value = val;
            } else {
                const cur = parseFloat(cashInput.value) || 0;
                cashInput.value = cur + val;
            }
            calculateChange(total);
        });
    });

    function calculateChange(totalAmount) {
        const received = parseFloat(cashInput.value) || 0;
        const change = received - totalAmount;

        if (change >= 0) {
            changeSection.style.display = 'flex';
            changeValue.textContent = formatCurrency(change);
            changeValue.className = 'text-bold text-lg text-primary';
        } else {
            changeSection.style.display = 'flex';
            changeValue.textContent = 'Uang Kurang';
            changeValue.className = 'text-bold text-lg text-danger';
        }
    }
}

async function processTransaction(method, cashReceived, total, discount) {
    try {
        const subtotal = state.cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
        
        // Robust invoice number generation with a reliable local fallback
        let invoiceNumber = '';
        try {
            invoiceNumber = await transactionsDb.generateInvoiceNumber();
        } catch (dbErr) {
            console.warn('Could not generate invoice from DB, using fallback:', dbErr);
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomSecs = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            invoiceNumber = `TRX-${dateStr}-${randomSecs}`;
        }

        const change = method === 'Tunai' ? Math.max(0, cashReceived - total) : 0;
        
        const transaction = {
            invoiceNumber,
            items: state.cart.map(item => ({
                id: item.id,
                name: item.name,
                sellingPrice: item.sellingPrice,
                costPrice: item.costPrice,
                quantity: item.quantity
            })),
            subtotal,
            discount,
            total,
            paymentMethod: method,
            amountPaid: method === 'Tunai' ? cashReceived : total,
            change,
            createdAt: new Date().toISOString()
        };

        // 1. Try to Save Transaction to IndexedDB (Bypass if fails)
        try {
            await transactionsDb.add(transaction);
        } catch (dbErr) {
            console.error('Failed to save transaction to IndexedDB (Bypassing for testing):', dbErr);
        }

        // 2. Try to Decrease Stock & Record Movement (Bypass if fails, but keep in-memory update)
        for (const item of state.cart) {
            const product = state.products.find(p => p.id === item.id);
            if (product) {
                // Perform in-memory stock reduction so the app's current session UI updates correctly
                product.stock = Math.max(0, product.stock - item.quantity);
                
                try {
                    await productsDb.put(product);
                    await stockDb.addMovement(product.id, 'OUT', item.quantity, `Penjualan ${invoiceNumber}`);
                } catch (dbErr) {
                    console.error(`Failed to update stock in IndexedDB for product ${product.id} (Bypassing):`, dbErr);
                }
            }
        }

        // 3. Clear Cart & Update Central State
        state.clearCart();
        
        // Try to fetch updated products list from DB, or fallback to current state.products
        let updatedProducts = [...state.products];
        try {
            updatedProducts = await productsDb.getAll();
        } catch (dbErr) {
            console.warn('Failed to retrieve products from DB, using in-memory state:', dbErr);
        }
        state.setState({ products: updatedProducts });

        Toast.success('Pembayaran Berhasil! (Mode Tester)');

        // 4. Show Success modal with Receipt preview
        showSuccessModal(transaction);

        // 5. Automatically trigger print dialog
        setTimeout(() => {
            printReceipt();
        }, 300); // Small timeout to ensure DOM is fully rendered and styles applied

    } catch (error) {
        console.error('Checkout error:', error);
        Toast.error('Gagal memproses transaksi!');
    }
}

function showSuccessModal(transaction) {
    const itemsListHtml = transaction.items.map(item => `
        <div class="receipt-item">
            <span class="receipt-item-name">${item.name}</span>
            <div class="receipt-item-details">
                <span>${item.quantity} x ${formatCurrency(item.sellingPrice)}</span>
                <span>${formatCurrency(item.sellingPrice * item.quantity)}</span>
            </div>
        </div>
    `).join('');

    const bodyHtml = `
        <div class="success-screen">
            <div class="success-icon-wrapper">
                <div class="success-checkmark">✔</div>
            </div>
            <h2>Pembayaran Berhasil</h2>
            <p class="success-amount text-bold text-primary">${formatCurrency(transaction.total)}</p>
            
            <div class="receipt-container" id="printable-receipt">
                <div class="receipt-header-brand">
                    <h3>TOKO KASIR POS</h3>
                    <p class="text-sm text-muted">Jl. Pembangunan No. 45</p>
                    <p class="text-xs text-muted">${new Date(transaction.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div class="receipt-info-row">
                    <span>No. Invoice:</span>
                    <span>${transaction.invoiceNumber}</span>
                </div>
                <div class="receipt-divider"></div>
                
                <div class="receipt-items-list">
                    ${itemsListHtml}
                </div>
                
                <div class="receipt-divider"></div>
                
                <div class="receipt-summary">
                    <div class="receipt-summary-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(transaction.subtotal)}</span>
                    </div>
                    <div class="receipt-summary-row">
                        <span>Diskon:</span>
                        <span>${formatCurrency(transaction.discount)}</span>
                    </div>
                    <div class="receipt-summary-row total-row">
                        <span>TOTAL:</span>
                        <span>${formatCurrency(transaction.total)}</span>
                    </div>
                    <div class="receipt-summary-row">
                        <span>${transaction.paymentMethod}:</span>
                        <span>${formatCurrency(transaction.amountPaid)}</span>
                    </div>
                    ${transaction.paymentMethod === 'Tunai' ? `
                    <div class="receipt-summary-row">
                        <span>Kembali:</span>
                        <span>${formatCurrency(transaction.change)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="receipt-footer">
                    <p>Terima kasih atas kunjungan Anda :)</p>
                </div>
            </div>
        </div>
    `;

    const successModal = new Modal({
        title: 'Status Transaksi',
        body: bodyHtml,
        confirmText: 'Cetak Struk',
        cancelText: 'Transaksi Baru',
        onConfirm: () => {
            printReceipt();
            return false; // Don't close modal immediately, so they can still trigger New Transaction
        }
    });

    successModal.show();
}

function printReceipt() {
    const printableArea = document.getElementById('printable-receipt');
    if (!printableArea) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Struk</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-muted { color: #555; }
                .receipt-divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                .receipt-summary-row { display: flex; justify-content: space-between; margin: 2px 0; }
                .total-row { font-weight: bold; }
                .receipt-item { margin-bottom: 6px; }
                .receipt-item-details { display: flex; justify-content: space-between; }
                @media print {
                    body { width: 100%; margin: 0; }
                }
            </style>
        </head>
        <body onload="window.print();window.close();">
            <div class="text-center">
                <h2>TOKO KASIR POS</h2>
                <p>Jl. Pembangunan No. 45</p>
                <p>${new Date().toLocaleString('id-ID')}</p>
            </div>
            <div class="receipt-divider"></div>
            ${printableArea.querySelector('.receipt-items-list').innerHTML}
            <div class="receipt-divider"></div>
            <div>
                ${printableArea.querySelector('.receipt-summary').innerHTML}
            </div>
            <div class="receipt-divider"></div>
            <div class="text-center">
                <p>Terima kasih atas kunjungan Anda :)</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

