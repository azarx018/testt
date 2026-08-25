import { db } from './database.js';

export const categoriesDb = {
    async getAll() {
        return db.getAll('categories');
    },

    async add(category) {
        return db.add('categories', category);
    },

    async put(category) {
        return db.put('categories', category);
    },

    async delete(id) {
        return db.delete('categories', id);
    },

    // Seed default categories if empty
    async seed() {
        const list = await this.getAll();
        if (list.length === 0) {
            const defaults = [
                { name: 'Makanan' },
                { name: 'Minuman' },
                { name: 'Snack' },
                { name: 'Rokok' },
                { name: 'Sembako' },
                { name: 'Lainnya' }
            ];
            for (const cat of defaults) {
                await this.add(cat);
            }
        }
    }
};
