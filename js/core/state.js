/**
 * Simple centralized state management
 */
export const state = {
    currentPage: 'home',
    cart: [],
    products: [],
    categories: [],
    settings: {
        shopName: 'Toko Saya',
        currency: 'IDR',
        lowStockThreshold: 5
    },
    
    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(listener => listener(this));
    },

    setState(newState) {
        Object.assign(this, newState);
        this.notify();
    },

    // Cart actions
    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity += 1;
            } else {
                return false; // Stock limit reached
            }
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.notify();
        return true;
    },

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.notify();
    },

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeFromCart(productId);
            } else {
                this.notify();
            }
        }
    },

    clearCart() {
        this.cart = [];
        this.notify();
    }
};
