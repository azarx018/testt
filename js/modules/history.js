import { transactionsDb } from '../db/transactions.js';
import { formatCurrency } from '../utils/currency.js';
import { Modal } from '../components/modal.js';

export async function renderHistory() {
    return `
        <div class="history-module animate-fade-in">
            <header class="module-header">
                <h1>Riwayat Transaksi</h1>
            </header>

            <div class="filter-bar">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="history-search" placeholder="Cari nomor invoice...">
                </div>
            </div>

            <div class="table-responsive">
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>No. Invoice</th>
                            <th>Tanggal</th>
                            <th>Total</th>
                            <th>Metode</th>
                            <th class="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="history-list">
                        <!-- Injected by JS -->
                    </tbody>
                </table>
                <div id="history-empty-state" class="empty-state" style="display: none; padding: var(--spacing-xl); text-align: center;">
                    <p class="text-muted">Tidak ada riwayat transaksi.</p>
                </div>
            </div>
        </div>
    `;
}

export async function initHistory() {
    const searchInput = document.getElementById('history-search');
    const historyList = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty-state');

    let allTransactions = [];

    async function loadTransactions() {
        allTransactions = await transactionsDb.getAll();
        // Sort by date desc
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderList();
    }

    function renderList() {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = allTransactions.filter(t => 
            t.invoiceNumber.toLowerCase().includes(query)
        );

        historyList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        filtered.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${t.invoiceNumber}</strong></td>
                <td>
                    <div class="product-td-info">
                        <span>${new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                        <span class="text-xs text-muted">${new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </td>
                <td class="text-primary"><strong>${formatCurrency(t.total)}</strong></td>
                <td><span class="badge ${t.paymentMethod === 'Tunai' ? 'badge-primary' : 'badge-secondary'}" style="background-color: var(--color-primary-light); color: var(--color-primary);">${t.paymentMethod}</span></td>
                <td class="text-right">
                    <button class="btn btn-sm btn-muted view-detail-btn" data-id="${t.id}">Detail</button>
                </td>
            `;
            historyList.appendChild(row);
        });

        // Bind events
        historyList.querySelectorAll('.view-detail-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const transaction = allTransactions.find(t => String(t.id) === String(id));
                if (transaction) {
                    showTransactionDetail(transaction);
                }
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderList);
    }

    await loadTransactions();
}

function showTransactionDetail(transaction) {
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
        <div class="receipt-container" style="max-width: 100%; border: none; background: transparent;">
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
        </div>
    `;

    const detailModal = new Modal({
        title: 'Detail Transaksi',
        body: bodyHtml,
        confirmText: 'Cetak Struk',
        onConfirm: () => {
            printReceipt(transaction);
            return false;
        }
    });

    detailModal.show();
}

function printReceipt(transaction) {
    const itemsListHtml = transaction.items.map(item => `
        <div class="receipt-item">
            <span class="receipt-item-name">${item.name}</span>
            <div class="receipt-item-details">
                <span>${item.quantity} x ${formatCurrency(item.sellingPrice)}</span>
                <span>${formatCurrency(item.sellingPrice * item.quantity)}</span>
            </div>
        </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Struk - ${transaction.invoiceNumber}</title>
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
                <p>${new Date(transaction.createdAt).toLocaleString('id-ID')}</p>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-info-row" style="display: flex; justify-content: space-between;">
                <span>No. Invoice:</span>
                <span>${transaction.invoiceNumber}</span>
            </div>
            <div class="receipt-divider"></div>
            ${itemsListHtml}
            <div class="receipt-divider"></div>
            <div>
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
            <div class="receipt-divider"></div>
            <div class="text-center">
                <p>Terima kasih atas kunjungan Anda :)</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}
