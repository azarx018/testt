import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { settingsDb } from '../db/settings.js';
import { db } from '../db/database.js';
import { state } from '../core/state.js';

export function renderMore() {
    return `
        <div class="more-module animate-fade-in">
            <header class="module-header">
                <h1>Lainnya</h1>
            </header>

            <div class="more-menu">
                <section class="menu-section">
                    <h3>Pengaturan</h3>
                    <div class="menu-list">
                        <div class="menu-item" id="shop-profile-btn">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Profil Toko</span>
                                <span class="menu-item-desc">Nama toko, alamat, nomor telepon</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                        <div class="menu-item">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Printer & Struk</span>
                                <span class="menu-item-desc">Konfigurasi cetak struk</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </section>

                <section class="menu-section">
                    <h3>Data & Backup</h3>
                    <div class="menu-list">
                        <div class="menu-item" id="export-data">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Ekspor Data</span>
                                <span class="menu-item-desc">Download data sebagai JSON</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </div>
                        <div class="menu-item" id="import-data">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Impor Data</span>
                                <span class="menu-item-desc">Pulihkan data dari file JSON</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            <input type="file" id="import-file-input" style="display: none;" accept=".json">
                        </div>
                        <div class="menu-item text-danger" id="clear-database">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Hapus Semua Data</span>
                                <span class="menu-item-desc">Reset database ke awal</span>
                            </div>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </div>
                    </div>
                </section>

                <section class="menu-section">
                    <h3>Tentang</h3>
                    <div class="menu-list">
                        <div class="menu-item">
                            <div class="menu-item-info">
                                <span class="menu-item-title">Versi Aplikasi</span>
                                <span class="menu-item-desc">v1.1.3</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <style>
            .more-menu {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xl);
            }
            .menu-section h3 {
                font-size: var(--font-size-sm);
                color: var(--color-text-muted);
                margin-bottom: var(--spacing-sm);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .menu-list {
                background-color: var(--color-surface);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }
            .menu-item {
                padding: var(--spacing-md);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                border-bottom: 1px solid var(--color-divider);
                transition: background-color 0.2s;
            }
            .menu-item:last-child {
                border-bottom: none;
            }
            .menu-item:active {
                background-color: var(--color-background);
            }
            .menu-item-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .menu-item-title {
                font-weight: 600;
                font-size: var(--font-size-base);
            }
            .menu-item-desc {
                font-size: var(--font-size-xs);
                color: var(--color-text-muted);
            }
        </style>
    `;
}

export function initMore() {
    const clearDbBtn = document.getElementById('clear-database');
    const exportDataBtn = document.getElementById('export-data');
    const importDataBtn = document.getElementById('import-data');
    const importFileInput = document.getElementById('import-file-input');
    const shopProfileBtn = document.getElementById('shop-profile-btn');

    // Profil Toko
    if (shopProfileBtn) {
        shopProfileBtn.addEventListener('click', async () => {
            const profile = await settingsDb.getProfile();
            showShopProfileModal(profile);
        });
    }

    // Hapus Database
    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan.')) {
                indexedDB.deleteDatabase('KasirDB');
                alert('Database dihapus. Aplikasi akan dimuat ulang.');
                window.location.reload();
            }
        });
    }

    // Ekspor Data
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            try {
                const products = await db.getAll('products');
                const categories = await db.getAll('categories');
                const transactions = await db.getAll('transactions');
                const stockMovements = await db.getAll('stockMovements');

                const exportData = {
                    appName: 'Kasir POS Modern',
                    exportDate: new Date().toISOString(),
                    data: { products, categories, transactions, stockMovements }
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `kasir_pos_backup_${new Date().toISOString().slice(0,10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();

                Toast.success('Data berhasil diekspor!');
            } catch (error) {
                console.error('Export error:', error);
                alert('Gagal mengekspor data: ' + error.message);
            }
        });
    }

    // Impor Data
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    
                    if (imported.appName !== 'Kasir POS Modern' || !imported.data) {
                        throw new Error('File cadangan tidak valid.');
                    }

                    if (!confirm('Mengimpor data akan menimpa data yang ada. Lanjutkan?')) return;

                    const clearAndAdd = async (storeName, items) => {
                        const transaction = db.db.transaction([storeName], 'readwrite');
                        const store = transaction.objectStore(storeName);
                        await new Promise((resolve) => {
                            const req = store.clear();
                            req.onsuccess = resolve;
                        });
                        
                        for (const item of items) {
                            await new Promise((resolve) => {
                                const req = store.add(item);
                                req.onsuccess = resolve;
                            });
                        }
                    };

                    const data = imported.data;
                    if (data.categories) await clearAndAdd('categories', data.categories);
                    if (data.products) await clearAndAdd('products', data.products);
                    if (data.transactions) await clearAndAdd('transactions', data.transactions);
                    if (data.stockMovements) await clearAndAdd('stockMovements', data.stockMovements);

                    const categories = await db.getAll('categories');
                    const products = await db.getAll('products');
                    state.setState({ categories, products });

                    alert('Data berhasil diimpor. Aplikasi akan dimuat ulang.');
                    window.location.reload();
                } catch (err) {
                    console.error('Import error:', err);
                    alert('Gagal mengimpor data: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }
}

async function showShopProfileModal(profile) {
    const bodyHtml = `
        <form id="profile-form" class="modal-form">
            <div class="form-group">
                <label for="form-shop-name">Nama Toko</label>
                <input type="text" id="form-shop-name" value="${profile.name}" required>
            </div>
            <div class="form-group">
                <label for="form-shop-address">Alamat</label>
                <input type="text" id="form-shop-address" value="${profile.address}" required>
            </div>
            <div class="form-group">
                <label for="form-shop-phone">Nomor Telepon</label>
                <input type="text" id="form-shop-phone" value="${profile.phone}">
            </div>
        </form>
    `;

    const modal = new Modal({
        title: 'Profil Toko',
        body: bodyHtml,
        confirmText: 'Simpan',
        onConfirm: async () => {
            const name = document.getElementById('form-shop-name').value;
            const address = document.getElementById('form-shop-address').value;
            const phone = document.getElementById('form-shop-phone').value;

            await settingsDb.saveProfile({ name, address, phone });
            Toast.success('Profil toko berhasil diperbarui!');
            return true;
        }
    });

    modal.show();
}
