# 📋 PWA Code Reference

Quick reference for all PWA code additions.

---

## 1️⃣ manifest.json Structure

```json
{
  "name": "Attendance System",
  "short_name": "Attendance",
  "description": "A comprehensive employee attendance tracking system",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",          // Fullscreen, minimal UI
  "background_color": "#ffffff",
  "theme_color": "#16a34a",         // Status bar color
  "orientation": "portrait-primary",
  
  "icons": [
    {
      "src": "data:image/svg+xml,...",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,...",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,...",  // Maskable for adaptive icons
      "sizes": "192x192",
      "purpose": "maskable"
    },
    {
      "src": "data:image/svg+xml,...",  // Maskable for adaptive icons
      "sizes": "512x512",
      "purpose": "maskable"
    }
  ],
  
  "shortcuts": [
    {
      "name": "Check In",
      "url": "/?action=checkin",
      "icons": [{"src": "...", "sizes": "192x192"}]
    },
    {
      "name": "Check Out",
      "url": "/?action=checkout",
      "icons": [{"src": "...", "sizes": "192x192"}]
    }
  ],
  
  "categories": ["business", "productivity"],
  "screenshots": [
    {
      "src": "...",
      "sizes": "540x720",
      "form_factor": "narrow"
    },
    {
      "src": "...",
      "sizes": "1280x720",
      "form_factor": "wide"
    }
  ]
}
```

---

## 2️⃣ service-worker.js Key Sections

### Installation
```javascript
const CACHE_VERSION = 'attendance-v1';
const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/admin.html',
  '/css/login-style.css',
  '/css/style.css',
  '/css/admin-style.css',
  '/js/login.js',
  '/js/main.js',
  '/js/admin.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});
```

### Cache-First Strategy
```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API calls - always use network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => ({
        status: 503,
        statusText: 'Service Unavailable'
      }))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((networkResponse) => {
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      });
    })
  );
});
```

### Cleanup Old Caches
```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
```

---

## 3️⃣ pwa-manager.js Key Methods

### Registration
```javascript
async registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/service-worker.js',
      { scope: '/' }
    );
    console.log('Service Worker registered:', registration);

    // Check for updates every minute
    setInterval(() => {
      registration.update();
    }, 60000);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
```

### Install Prompt Detection
```javascript
detectInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    this.deferredPrompt = event;
    this.showInstallButton();  // Show button to user
  });

  window.addEventListener('appinstalled', () => {
    console.log('App installed successfully');
    this.isInstalled = true;
    this.hideInstallButton();
  });
}
```

### Handle Install Click
```javascript
async handleInstallClick(event) {
  event.preventDefault();

  if (!this.deferredPrompt) {
    return;
  }

  // Show the browser's install prompt
  this.deferredPrompt.prompt();

  const { outcome } = await this.deferredPrompt.userChoice;
  console.log(`User response: ${outcome}`);
  
  // outcome: 'accepted' or 'dismissed'
  
  this.deferredPrompt = null;
  this.hideInstallButton();
}
```

### Online/Offline Monitoring
```javascript
window.addEventListener('online', () => {
  console.log('App is online');
  if (window.showToast) {
    window.showToast('Connection restored', 'success', 3000);
  }
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  if (window.showToast) {
    window.showToast('You are offline - some features may be limited', 
                     'warning', 5000);
  }
});
```

### Utility Methods
```javascript
// Clear all caches
async clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Get cache info
async getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = keys.length;
  }
  return info;
}

// Check online status
isOnline() {
  return navigator.onLine;
}

// Wait for online (with timeout)
waitForOnline(timeout = 30000) {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }
    const onOnline = () => {
      window.removeEventListener('online', onOnline);
      resolve(true);
    };
    setTimeout(() => {
      window.removeEventListener('online', onOnline);
      resolve(false);
    }, timeout);
    window.addEventListener('online', onOnline);
  });
}
```

---

## 4️⃣ HTML Changes (All 3 Files)

### Head Section
```html
<head>
  <!-- Existing meta tags -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  
  <!-- NEW: PWA Meta Tags -->
  <meta name="theme-color" content="#16a34a">
  <meta name="description" content="Description of your app">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Attendance">
  
  <!-- NEW: Apple Touch Icon -->
  <link rel="apple-touch-icon" href="data:image/svg+xml,...">
  
  <!-- NEW: Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">
  
  <!-- NEW: Web Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Existing stylesheets -->
  <link rel="stylesheet" href="css/login-style.css">
  
  <!-- NEW: PWA Styles -->
  <link rel="stylesheet" href="css/pwa.css">
</head>
```

### Body Section
```html
<body>
  <!-- Existing content -->
  
  <!-- Existing scripts -->
  <script src="js/login.js"></script>
  
  <!-- NEW: PWA Manager (auto-registers service worker) -->
  <script src="js/pwa-manager.js"></script>
</body>
```

---

## 5️⃣ CSS Styling for Install Button

```css
/* Install button - appears in navbar */
.btn-install {
  display: none;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
}

/* Show button when install prompt available */
.btn-install[style*="display: block"] {
  animation: slideDown 0.3s ease;
}

/* Hover state */
.btn-install:hover:not(:disabled) {
  background: linear-gradient(135deg, #15803d, #166534);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
}

/* Disabled state */
.btn-install:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 6️⃣ Testing Code

### Test Installation
```javascript
// In browser console:
// Check if service worker is registered
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});

// Check if install prompt is available
console.log('Install prompt available:', !!window.pwaManager.deferredPrompt);
```

### Test Offline
```javascript
// Simulate offline mode
navigator.onLine = false;

// Try navigation - should load from cache

// Go back online
navigator.onLine = true;
```

### Check Cache
```javascript
// View all cached files
window.pwaManager.getCacheInfo().then(info => {
  console.log('Cache info:', info);
});

// Clear cache (development only)
window.pwaManager.clearCache().then(() => {
  console.log('Cache cleared');
});
```

### Monitor Status
```javascript
// Check if PWA is installed
console.log('PWA installed:', window.pwaManager.isInstalled);

// Check if online
console.log('Is online:', window.pwaManager.isOnline());

// Wait for online (with 30 second timeout)
window.pwaManager.waitForOnline().then(online => {
  console.log('Online:', online);
});
```

---

## 7️⃣ Debugging Guide

### Service Worker Issues
```javascript
// Check registration status
navigator.serviceWorker.controller
  ? console.log('Service Worker ACTIVE')
  : console.log('Service Worker NOT ACTIVE');

// View service worker scope
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('Scope:', reg.scope);
    console.log('State:', reg.active?.state);
  });
});
```

### Cache Issues
```javascript
// List all cache names
caches.keys().then(names => {
  console.log('Caches:', names);
});

// View files in specific cache
caches.open('attendance-v1').then(cache => {
  cache.keys().then(requests => {
    console.log('Cached files:');
    requests.forEach(req => console.log(' -', req.url));
  });
});

// Delete specific cache
caches.delete('attendance-v1');
```

### Manifest Issues
```javascript
// Check manifest validity
fetch('/manifest.json')
  .then(res => res.json())
  .then(manifest => {
    console.log('Manifest valid:', manifest);
  })
  .catch(err => console.error('Manifest error:', err));
```

---

## 8️⃣ Browser DevTools Tips

### Chrome/Edge DevTools
```
1. Open DevTools (F12)
2. Go to Application tab
3. Check these sections:
   - Manifest: Shows PWA readiness
   - Service Workers: Shows registration status
   - Cache Storage: Shows cached files
   - Application: App metadata
```

### Simulate Offline
```
1. DevTools → Network tab
2. Enable "Offline" checkbox
3. Page should load from cache
4. API calls should return 503
```

### Clear Everything
```
1. DevTools → Application tab
2. Click "Clear site data"
3. Selects all (cache, storage, etc)
4. Click "Clear"
```

---

## 9️⃣ Common Issues & Solutions

### Install button not showing
```javascript
// Check if prompt is available
console.log(window.pwaManager.deferredPrompt);
// Should not be null if available

// Ensure browser supports PWAs
console.log('ServiceWorker:', 'serviceWorker' in navigator);
```

### Service worker not installing
```javascript
// Check for errors in console
// Verify manifest.json exists
// Check service-worker.js syntax
// Try: DevTools → Application → Service Workers → Update
```

### Cache not working
```javascript
// Check if service worker is active
navigator.serviceWorker.controller || console.log('NOT ACTIVE');

// Verify cache exists
caches.keys().then(names => console.log(names));

// Clear and reinstall
caches.delete('attendance-v1');
// Reload page
```

---

## 🔟 Production Checklist

```javascript
// Before deploying, verify:
✅ manifest.json exists at /manifest.json
✅ service-worker.js exists at /service-worker.js
✅ All HTML files have PWA meta tags
✅ All HTML files link to manifest
✅ All HTML files register service worker
✅ HTTPS is enabled (required for PWA)
✅ Icons load without 404 errors
✅ Cache strategy matches your needs
✅ Tested offline mode works
✅ Tested installation works
```

---

**Quick Start for Production:**
1. Verify HTTPS enabled
2. Run PWA audit in DevTools
3. Deploy to hosting (Railway, Netlify)
4. Test installation on real device
5. Monitor user feedback

Done! 🚀
