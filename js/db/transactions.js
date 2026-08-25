import { db } from './database.js';

export const transactionsDb = {
    async getAll() {
        return db.getAll('transactions');
    },

    async getById(id) {
        return db.getById('transactions', id);
    },

    async add(transaction) {
        return db.add('transactions', transaction);
    },

    async generateInvoiceNumber() {
        const list = await this.getAll();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // Find matching today's count
        const todayPrefix = `TRX-${dateStr}`;
        const todaysTransactions = list.filter(t => t.invoiceNumber && t.invoiceNumber.startsWith(todayPrefix));
        const nextNum = todaysTransactions.length + 1;
        
        return `${todayPrefix}-${String(nextNum).padStart(4, '0')}`;
    }
};
