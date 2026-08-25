import { db } from './database.js';
import { categoriesDb } from './categories.js';

export const productsDb = {
    async getAll() {
        return db.getAll('products');
    },

    async getById(id) {
        return db.getById('products', id);
    },

    async add(product) {
        const timestamp = new Date().toISOString();
        product.createdAt = timestamp;
        product.updatedAt = timestamp;
        return db.add('products', product);
    },

    async put(product) {
        product.updatedAt = new Date().toISOString();
        return db.put('products', product);
    },

    async delete(id) {
        return db.delete('products', id);
    },

    async getByCategoryId(categoryId) {
        return db.queryByIndex('products', 'categoryId', categoryId);
    },

    // Seed default products
    async seed() {
        const list = await this.getAll();
        if (list.length === 0) {
            // Ensure categories are seeded first
            await categoriesDb.seed();
            const categories = await categoriesDb.getAll();

            const findCatId = (name) => {
                const cat = categories.find(c => c.name === name);
                return cat ? cat.id : null;
            };

            const foodId = findCatId('Makanan');
            const drinkId = findCatId('Minuman');
            const snackId = findCatId('Snack');
            const sembakoId = findCatId('Sembako');

            const defaults = [
                {
                    name: 'Indomie Goreng',
                    barcode: '8998866200225',
                    categoryId: foodId,
                    costPrice: 2800,
                    sellingPrice: 3500,
                    stock: 50,
                    minimumStock: 5,
                    image: ''
                },
                {
                    name: 'Indomie Soto',
                    barcode: '8998866200232',
                    categoryId: foodId,
                    costPrice: 2800,
                    sellingPrice: 3500,
                    stock: 40,
                    minimumStock: 5,
                    image: ''
                },
                {
                    name: 'Aqua 600ml',
                    barcode: '8886008101053',
                    categoryId: drinkId,
                    costPrice: 2500,
                    sellingPrice: 4000,
                    stock: 100,
                    minimumStock: 10,
                    image: ''
                },
                {
                    name: 'Teh Pucuk Harum 350ml',
                    barcode: '8992222053124',
                    categoryId: drinkId,
                    costPrice: 3000,
                    sellingPrice: 4500,
                    stock: 60,
                    minimumStock: 10,
                    image: ''
                },
                {
                    name: 'Chitato Sapi Panggang 68g',
                    barcode: '8992121332124',
                    categoryId: snackId,
                    costPrice: 8500,
                    sellingPrice: 10500,
                    stock: 30,
                    minimumStock: 5,
                    image: ''
                },
                {
                    name: 'SilverQueen Almond 58g',
                    barcode: '8991001112345',
                    categoryId: snackId,
                    costPrice: 12000,
                    sellingPrice: 15000,
                    stock: 20,
                    minimumStock: 3,
                    image: ''
                },
                {
                    name: 'Kopi Good Day Mocacinno',
                    barcode: '8991234567890',
                    categoryId: drinkId,
                    costPrice: 1500,
                    sellingPrice: 2500,
                    stock: 80,
                    minimumStock: 10,
                    image: ''
                },
                {
                    name: 'Beras Pandan Wangi 5kg',
                    barcode: '8999888777666',
                    categoryId: sembakoId,
                    costPrice: 65000,
                    sellingPrice: 75000,
                    stock: 15,
                    minimumStock: 2,
                    image: ''
                },
                {
                    name: 'Gula Pasir Gulaku 1kg',
                    barcode: '8999888777111',
                    categoryId: sembakoId,
                    costPrice: 14500,
                    sellingPrice: 17000,
                    stock: 25,
                    minimumStock: 5,
                    image: ''
                },
                {
                    name: 'Minyak Goreng Bimoli 1L',
                    barcode: '8999888777222',
                    categoryId: sembakoId,
                    costPrice: 16000,
                    sellingPrice: 19500,
                    stock: 20,
                    minimumStock: 5,
                    image: ''
                }
            ];

            for (const prod of defaults) {
                await this.add(prod);
            }
        }
    }
};
