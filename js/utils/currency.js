/**
 * Utility for formatting currency to Indonesian Rupiah (IDR)
 * @param {number} value 
 * @returns {string}
 */
export function formatCurrency(value) {
    if (value === undefined || value === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}
