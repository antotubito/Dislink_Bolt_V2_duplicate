// 🚀 DISLINK SERVICE WORKER
// Enhanced PWA capabilities with offline support and background sync

const CACHE_NAME = 'dislink-v1.0.0';
const STATIC_CACHE_NAME = 'dislink-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dislink-dynamic-v1.0.0';

// Cache strategies
const CACHE_FIRST = 'cache-first';
const NETWORK_FIRST = 'network-first';
const STALE_WHILE_REVALIDATE = 'stale-while-revalidate';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add your built assets here - these will be updated by build process
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/',
  'https://bbonxxvifycwpoeaxsor.supabase.co/'
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/app/contacts',
  '/app/profile',
  '/app/qr-scanner',
  '/app/share'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine caching strategy
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('❌ Fetch error:', error);
        return handleOfflineResponse(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'contact-sync') {
    event.waitUntil(syncContacts());
  } else if (event.tag === 'qr-scan-sync') {
    event.waitUntil(syncQRScans());
  } else if (event.tag === 'profile-update-sync') {
    event.waitUntil(syncProfileUpdates());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  const options = {
    body: 'You have new activity on Dislink',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'dislink-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = data;
  }
  
  event.waitUntil(
    self.registration.showNotification('Dislink', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/app/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('/app/') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow('/app/dashboard');
        }
      })
    );
  }
});

// Helper functions
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API endpoints - network first
  if (API_ENDPOINTS.some(endpoint => url.href.includes(endpoint))) {
    return NETWORK_FIRST;
  }
  
  // Static assets - cache first
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    return CACHE_FIRST;
  }
  
  // HTML pages - stale while revalidate
  if (request.destination === 'document') {
    return STALE_WHILE_REVALIDATE;
  }
  
  // Default to network first
  return NETWORK_FIRST;
}

async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_FIRST:
      return handleCacheFirst(request);
    case NETWORK_FIRST:
      return handleNetworkFirst(request);
    case STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

async function handleCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Update cache in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

async function handleOfflineResponse(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return offline page
  if (request.destination === 'document') {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    return offlinePage || new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  // For images, return placeholder
  if (request.destination === 'image') {
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af">Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // For other requests, return generic offline response
  return new Response(JSON.stringify({
    error: 'Offline',
    message: 'This feature requires an internet connection'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync functions
async function syncContacts() {
  try {
    console.log('🔄 Syncing contacts...');
    // Implementation would sync cached contact changes to server
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Contact sync failed:', error);
    throw error;
  }
}

async function syncQRScans() {
  try {
    console.log('🔄 Syncing QR scans...');
    // Implementation would sync cached QR scan data to server
    return Promise.resolve();
  } catch (error) {
    console.error('❌ QR scan sync failed:', error);
    throw error;
  }
}

async function syncProfileUpdates() {
  try {
    console.log('🔄 Syncing profile updates...');
    // Implementation would sync cached profile changes to server
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Profile sync failed:', error);
    throw error;
  }
}

// Utility to clean up old cache entries
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    !name.includes('v1.0.0') && name.startsWith('dislink-')
  );
  
  return Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
}

// Run cleanup periodically
setInterval(cleanupOldCaches, 24 * 60 * 60 * 1000); // Daily cleanup
