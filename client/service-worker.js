/**
 * Service Worker for PWA
 * Implements cache-first strategy with network fallback
 */

const CACHE_VERSION = 'attendance-v3';
const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/admin.html',
  '/css/login-style.css',
  '/css/style.css',
  '/css/admin-style.css',
  '/css/pwa.css',
  '/js/login.js',
  '/js/main.js',
  '/js/admin.js',
  '/js/pwa-manager.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'
];

const OFFLINE_FALLBACK = '/login.html';

// ─── Installation ─────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Installing and caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[SW] Cache addAll failed, continuing:', error);
        // Cache only essential files if addAll fails
        return Promise.all(
          STATIC_ASSETS.filter(url => !url.includes('cdn.jsdelivr.net'))
            .map(url => cache.add(url).catch(() => console.warn(`Failed to cache ${url}`)))
        );
      });
    })
  );
  self.skipWaiting();
});

// ─── Activation ──────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch Handler (Cache-First Strategy) ────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls - always use network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline response for API calls
          return new Response(
            JSON.stringify({
              status: 'error',
              message: 'Offline - API unavailable',
              data: null
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Don't cache non-successful responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }

          // Clone the response
          const responseToCache = networkResponse.clone();

          // Cache successful responses
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Return offline fallback for HTML requests
          if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match(OFFLINE_FALLBACK);
          }

          // Return generic offline response
          return new Response(
            'Offline - Resource unavailable',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            }
          );
        });
    })
  );
});

// ─── Message Handler (for communication with clients) ────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_VERSION).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// ─── Background Sync (optional - for offline attendance tracking) ────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

async function syncAttendanceData() {
  try {
    // This would sync any pending attendance records when back online
    console.log('[SW] Syncing attendance data...');
    // Implementation depends on your offline queue strategy
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

console.log('[SW] Service Worker loaded');
