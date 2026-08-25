import { db } from './database.js';

export const settingsDb = {
    async getProfile() {
        try {
            const profile = await db.getById('settings', 'shopProfile');
            return profile ? profile.data : {
                name: 'Toko Kasir POS',
                address: 'Jl. Pembangunan No. 45',
                phone: '-'
            };
        } catch (error) {
            console.error('Error getting shop profile:', error);
            return null;
        }
    },

    async saveProfile(profileData) {
        return db.put('settings', { key: 'shopProfile', data: profileData });
    }
};
