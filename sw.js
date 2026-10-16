// Solaria Resort Staff Booking - Service Worker for Android PWA
var CACHE_NAME = 'solaria-resort-v4';
var ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './realtime-sync.js',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE).catch(function(err) {
        console.log('Cache prefill warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('broker') !== -1 || 
      event.request.url.indexOf('firebase') !== -1 || 
      event.request.url.indexOf('supabase') !== -1 ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(function() {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
