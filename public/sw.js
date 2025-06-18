const CACHE_NAME = 'vocabmaster-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', event => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Active');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching');
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(err => {
        console.log('Service Worker: Fetch failed', err);
        return fetch(event.request);
      })
  );
});