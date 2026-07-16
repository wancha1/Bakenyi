const CACHE_NAME = 'bakenye-heritage-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event - Pre-cache core guaranteed files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core shell...');
      return cache.addAll(PRECACHE_ASSETS);
    })
    .then(() => self.skipWaiting())
    .catch((err) => {
      console.error('[Service Worker] Pre-caching failed during install:', err);
    })
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache storage:', key);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic routing & multi-strategy caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Ignore Chrome extensions, internal schemes, and live development HMR web sockets
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Bypass third-party Auth, Supabase APIs, or backend API mutations
  if (url.pathname.includes('/api/') || url.pathname.includes('/auth/v1/')) {
    return;
  }

  // Strategy A: SPA Navigation requests (e.g., browsing pages like /clans, /about while offline)
  // Pattern: Network-First with Cache Fallback to index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Keep a copy in cache for offline fallback
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          console.log('[Service Worker] Offline detected. Serving SPA root shell...');
          return caches.match('/').then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Strategy B: Compiled immutable static assets (Vite hashed CSS, JS, etc.)
  // Pattern: Cache-First with Network Fallback
  if (url.origin === self.location.origin && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy C: Static images, web fonts, or public icons (Google Fonts, Unsplash portraits, local assets)
  // Pattern: Stale-While-Revalidate (renders instantly from cache, updates in background)
  const isWebFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
  const isImage = request.destination === 'image' || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.webp');

  if (isWebFont || isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback gracefully on network failures
            return null;
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy D: General app shell assets
  // Pattern: Cache with Network Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached root index for generic HTML navigation requests
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

