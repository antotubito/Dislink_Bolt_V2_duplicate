import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@capacitor/app',
      '@capacitor/camera',
      '@capacitor/clipboard',
      '@capacitor/core',
      '@capacitor/device',
      '@capacitor/geolocation',
      '@capacitor/haptics',
      '@capacitor/network',
      '@capacitor/share',
      '@capacitor/toast',
      '@capacitor-community/barcode-scanner'
    ]
  },
  server: {
    port: 5173
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'lucide-react'],
          select: ['react-select'],
          capacitor: [
            '@capacitor/app',
            '@capacitor/camera',
            '@capacitor/clipboard',
            '@capacitor/core',
            '@capacitor/device',
            '@capacitor/geolocation',
            '@capacitor/haptics',
            '@capacitor/network',
            '@capacitor/share',
            '@capacitor/toast',
            '@capacitor-community/barcode-scanner'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    // Ensure environment variables are properly defined for production
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  }
});
