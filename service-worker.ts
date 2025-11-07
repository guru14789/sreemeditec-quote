
const CACHE_NAME = 'sreemeditec-quotation-generator-v1';
// This list includes the essential files for the app shell to work offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/clients.json',
  '/products.json',
];

self.addEventListener('install', (event: any) => {
  // Perform install steps: open a cache and add the urls to it.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event: any) => {
  // Intercept network requests and serve from cache first if available.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches on activation.
self.addEventListener('activate', (event: any) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
