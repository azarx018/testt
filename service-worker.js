const CACHE_NAME = 'kasir-pos-v1.1.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/reset.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/responsive.css',
  './js/app.js',
  './js/core/router.js',
  './js/core/state.js',
  './js/db/database.js',
  './js/db/products.js',
  './js/db/categories.js',
  './js/db/transactions.js',
  './js/db/stock.js',
  './js/utils/currency.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/modules/dashboard.js',
  './js/modules/pos.js',
  './js/modules/products.js',
  './js/modules/history.js',
  './js/modules/inventory.js',
  './js/modules/more.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
