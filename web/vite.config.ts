import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
    // Bundle analyzer
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@dislink/shared': path.resolve(__dirname, '../shared'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@dislink/shared',
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
    ],
    // Force re-optimization in development
    force: process.env.NODE_ENV === 'development',
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
    
    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Optimize build output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
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
            
            // Other vendor libraries
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          if (id.includes('/src/components/')) {
            return 'components';
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/src/lib/')) {
            return 'lib';
          }
          if (id.includes('/shared/')) {
            return 'shared';
          }
        },
        
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Set target for better browser support
    target: 'es2015',
  },
  clearScreen: false, // Keep console output visible
});
