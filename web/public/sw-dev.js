// 🚀 DISLINK DEVELOPMENT SERVICE WORKER
// Simplified service worker for local development that won't block caching

const CACHE_NAME = 'dislink-dev-v1';

// Minimal caching for development
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('🔧 Development Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching minimal assets for development');
      // Only cache essential assets, ignore failures
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('⚠️ Some assets failed to cache (development mode):', err);
        return Promise.resolve(); // Don't fail the installation
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔧 Development Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for development
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // For development, always try network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200 && 
            (event.request.destination === 'document' || 
             event.request.destination === 'script' ||
             event.request.destination === 'style')) {
          
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(err => {
              console.warn('⚠️ Failed to cache response (development mode):', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache only if network fails
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Return a basic offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Development Service Worker loaded successfully');
