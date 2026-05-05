/**
 * PWA Utilities
 * Service Worker registration and Install Prompt handling
 */

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.installButton = null;
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.detectInstallPrompt();
    this.detectPWAInstalled();
  }

  // ─── Service Worker Registration ──────────────────────────────────────

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New service worker available');
            this.notifyAppUpdate();
          }
        });
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }

  // ─── Install Prompt Detection ─────────────────────────────────────────

  detectInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;

      // Show install button
      this.showInstallButton();
    });

    // Handle install success
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
    });
  }

  // ─── PWA Installation Detection ───────────────────────────────────────

  detectPWAInstalled() {
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
      this.isInstalled = true;
      document.documentElement.classList.add('pwa-installed');
      console.log('[PWA] Running as installed PWA');
    }

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        this.isInstalled = true;
        document.documentElement.classList.add('pwa-installed');
      }
    });
  }

  // ─── Install Button Management ───────────────────────────────────────

  showInstallButton() {
    let button = document.getElementById('installAppBtn');

    if (!button) {
      // Create install button dynamically if not in HTML
      button = document.createElement('button');
      button.id = 'installAppBtn';
      button.className = 'btn btn-install';
      button.innerHTML = '📥 Install App';
      button.addEventListener('click', (e) => this.handleInstallClick(e));

      // Add to navbar if exists, otherwise add to body
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        const navUser = navbar.querySelector('.nav-user-info');
        if (navUser) {
          navUser.insertBefore(button, navUser.firstChild);
        }
      }
    }

    if (button) {
      button.style.display = 'block';
      this.installButton = button;
    }
  }

  hideInstallButton() {
    if (this.installButton) {
      this.installButton.style.display = 'none';
    }
  }

  async handleInstallClick(event) {
    event.preventDefault();

    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);

    // Reset deferred prompt
    this.deferredPrompt = null;

    // Hide install button
    this.hideInstallButton();
  }

  // ─── App Update Notification ─────────────────────────────────────────

  notifyAppUpdate() {
    const message = 'A new version of the app is available. Refresh to update.';

    // Try to show as toast if available
    if (window.showToast) {
      window.showToast(message, 'info', 10000);
    } else if (window.confirm(`${message}\n\nRefresh now?`)) {
      window.location.reload();
    } else {
      console.log('[PWA] Update available - user deferred');
    }
  }

  // ─── Utility Methods ──────────────────────────────────────────────────

  /**
   * Clear all caches (useful for development)
   */
  async clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  }

  /**
   * Get cache info
   */
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

  /**
   * Check if device is online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Wait for online status
   */
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

      const timer = setTimeout(() => {
        window.removeEventListener('online', onOnline);
        resolve(false);
      }, timeout);

      window.addEventListener('online', onOnline);
    });
  }
}

// ─── Global Instance ──────────────────────────────────────────────────────

window.pwaManager = new PWAManager();

// Monitor online/offline status
window.addEventListener('online', () => {
  console.log('[PWA] App is online');
  if (window.showToast) {
    window.showToast('Connection restored', 'success', 3000);
  }
});

window.addEventListener('offline', () => {
  console.log('[PWA] App is offline');
  if (window.showToast) {
    window.showToast('You are offline - some features may be limited', 'warning', 5000);
  }
});

// Logging
console.log('[PWA] Manager initialized');
