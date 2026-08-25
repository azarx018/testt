/**
 * Reusable Modal component
 */
export class Modal {
    constructor(options = {}) {
        this.title = options.title || '';
        this.body = options.body || '';
        this.onConfirm = options.onConfirm || null;
        this.confirmText = options.confirmText || 'Ya';
        this.cancelText = options.cancelText || 'Batal';
        this.showFooter = options.showFooter !== false;
        this.modalContainer = document.getElementById('modal-container');
    }

    show() {
        if (!this.modalContainer) return;

        this.modalContainer.innerHTML = `
            <div class="modal-content animate-fade-in">
                <div class="modal-header">
                    <h2>${this.title}</h2>
                    <button class="modal-close" aria-label="Tutup">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    ${this.body}
                </div>
                ${this.showFooter ? `
                <div class="modal-footer">
                    <button class="btn btn-muted modal-cancel">${this.cancelText}</button>
                    <button class="btn btn-primary modal-confirm">${this.confirmText}</button>
                </div>
                ` : ''}
            </div>
        `;

        this.modalContainer.style.display = 'flex';

        // Bind events
        this.modalContainer.querySelector('.modal-close').addEventListener('click', () => this.hide());
        
        if (this.showFooter) {
            this.modalContainer.querySelector('.modal-cancel').addEventListener('click', () => this.hide());
            this.modalContainer.querySelector('.modal-confirm').addEventListener('click', async () => {
                if (this.onConfirm) {
                    const success = await this.onConfirm();
                    if (success !== false) {
                        this.hide();
                    }
                } else {
                    this.hide();
                }
            });
        }
    }

    hide() {
        if (!this.modalContainer) return;
        this.modalContainer.style.display = 'none';
        this.modalContainer.innerHTML = '';
    }
}
