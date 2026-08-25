import { db } from './database.js';

export const stockDb = {
    async getAll() {
        return db.getAll('stockMovements');
    },

    async addMovement(productId, type, quantity, note) {
        const movement = {
            productId,
            type, // 'IN' or 'OUT'
            quantity,
            note,
            createdAt: new Date().toISOString()
        };
        return db.add('stockMovements', movement);
    },

    async getByProductId(productId) {
        return db.queryByIndex('stockMovements', 'productId', productId);
    }
};
