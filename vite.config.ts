import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3001, // ✅ FIXED: Set to your expected port
    host: true,
    strictPort: true, // Force port 3001, don't try alternatives
    hmr: {
      port: 3001, // Ensure HMR uses the same port
      overlay: false, // Disable error overlay to prevent reload loops
    },
    watch: {
      usePolling: false, // Disable polling to prevent excessive file watching
      ignored: ['**/node_modules/**', '**/dist/**'], // Ignore unnecessary files
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear dist folder on each build
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React and routing - most stable, cache for long periods
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Supabase and auth - stable, good for caching
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          
          // UI and animations - stable, good for caching
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Utilities - stable, good for caching
          if (id.includes('date-fns') || id.includes('fuse.js') || id.includes('zod')) {
            return 'utils-vendor';
          }
          
          // QR and scanner components - feature-specific chunk
          if (id.includes('qr') || id.includes('scanner') || id.includes('qrcode')) {
            return 'qr-vendor';
          }
          
          // Maps and location - feature-specific chunk
          if (id.includes('city') || id.includes('location') || id.includes('nominatim') || id.includes('geolocation')) {
            return 'maps-vendor';
          }
          
          // Capacitor plugins - mobile-specific chunk
          if (id.includes('@capacitor')) {
            return 'capacitor-vendor';
          }
          
          // React Select - form components chunk
          if (id.includes('react-select')) {
            return 'forms-vendor';
          }
          
          // Sentry - monitoring chunk
          if (id.includes('@sentry')) {
            return 'monitoring-vendor';
          }
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Minify for production
    minify: 'esbuild',
  },
  clearScreen: false, // Keep console output visible
});
