// Minimal service worker — just enough to make the PWA installable on Android.
// It doesn't cache anything special; the app always fetches fresh from the network.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through — no offline caching, just network as usual.
  event.respondWith(fetch(event.request));
});
