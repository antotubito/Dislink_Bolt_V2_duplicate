// 🧹 CACHE BUSTER SCRIPT
// Copy and paste this into your browser console to clear all caches

console.log('🧹 Starting cache clearing process...');

// Clear all caches
async function clearAllCaches() {
  try {
    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('📦 Found caches:', cacheNames);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('🗑️ Deleted cache:', cacheName);
      }
    }
    
    // Clear localStorage
    localStorage.clear();
    console.log('🗑️ Cleared localStorage');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('🗑️ Cleared sessionStorage');
    
    // Clear IndexedDB (if any)
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          indexedDB.deleteDatabase(db.name);
          console.log('🗑️ Deleted IndexedDB:', db.name);
        }
      } catch (e) {
        console.log('ℹ️ No IndexedDB to clear');
      }
    }
    
    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Unregistered service worker');
      }
    }
    
    console.log('✅ All caches cleared successfully!');
    console.log('🔄 Please refresh the page to see changes');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    return false;
  }
}

// Run the cache clearing
clearAllCaches().then(success => {
  if (success) {
    console.log('🎉 Cache clearing completed! Refresh the page now.');
  } else {
    console.log('⚠️ Cache clearing had some issues, but you can still try refreshing.');
  }
});

// Also provide a manual refresh function
window.forceRefresh = function() {
  console.log('🔄 Force refreshing page...');
  window.location.reload(true);
};

console.log('💡 You can also run: forceRefresh() to force a hard refresh');
