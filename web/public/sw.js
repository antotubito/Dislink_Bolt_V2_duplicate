/**
 * Advanced Service Worker with Multiple Caching Strategies
 * Implements Cache First, Network First, Stale While Revalidate, and Network Only strategies
 */

const CACHE_VERSION = 'v1.0.3';
const STATIC_CACHE_NAME = `dislink-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dislink-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `dislink-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `dislink-images-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Static assets to cache immediately (excluding root path to prevent blank page issues)
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/auth',
  '/api/profile',
  '/api/connections',
  '/api/analytics'
];

// Image patterns that should use cache-first strategy
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /\/images\//,
  /\/avatars\//,
  /\/qr-codes\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
        // Don't fail the installation if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== API_CACHE_NAME &&
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  try {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
      return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
      return;
    }

    // Determine caching strategy based on request type
    const strategy = getCachingStrategy(request);
    
    event.respondWith(
      handleRequest(request, strategy)
        .catch((error) => {
          console.error('❌ Fetch failed:', error);
          return handleOfflineFallback(request);
        })
    );
  } catch (error) {
    console.error('❌ Service Worker fetch event error:', error);
    // Don't interfere with the request if there's an error
  }
});

// Determine caching strategy for a request
function getCachingStrategy(request) {
  const url = new URL(request.url);
  
  // Root path - always network first to prevent blank page issues
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // API requests - network first
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  // Images - cache first
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }
  
  // HTML pages - stale while revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }
  
  // Default - network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Handle request based on strategy
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request);
    default:
      return networkFirst(request);
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cacheName = getCacheName(request);
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse.clone();
}

// Network First Strategy
async function networkFirst(request) {
  const cacheName = getCacheName(request);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse.clone();
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cacheName = getCacheName(request);
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse.clone();
  });
  
  return cachedResponse || fetchPromise;
}

// Network Only Strategy
async function networkOnly(request) {
  return fetch(request);
}

// Cache Only Strategy
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);
  if (!cachedResponse) {
    throw new Error('No cached response available');
  }
  return cachedResponse;
}

// Get appropriate cache name for request
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
    return API_CACHE_NAME;
  }
  
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return IMAGE_CACHE_NAME;
  }
  
  return DYNAMIC_CACHE_NAME;
}

// Handle offline fallback
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return cached version if available
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return a generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('🔄 Performing background sync...');
  
  // Implement background sync logic here
  // This could include retrying failed API calls, uploading queued data, etc.
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle specific action clicks
    console.log('Action clicked:', event.action);
  } else {
    // Handle notification body click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Cache management utilities
const cacheManager = {
  // Clear all caches
  clearAll: async () => {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  },
  
  // Get cache statistics
  getStats: async () => {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        size: keys.length,
        urls: keys.map(request => request.url)
      };
    }
    
    return stats;
  },
  
  // Preload important resources
  preload: async (urls) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    return cache.addAll(urls);
  }
};

// Expose cache manager to main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MANAGER') {
    const { action, payload } = event.data;
    
    switch (action) {
      case 'CLEAR_ALL':
        cacheManager.clearAll().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
      case 'GET_STATS':
        cacheManager.getStats().then(stats => {
          event.ports[0].postMessage({ success: true, data: stats });
        });
        break;
      case 'PRELOAD':
        cacheManager.preload(payload.urls).then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

console.log('🎯 Advanced Service Worker loaded successfully');