import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    fastRefresh: false,
    jsxRuntime: 'automatic'
  })],
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
    host: true,
    port: 3000,
    strictPort: true,
    // Remove problematic HMR configuration
    historyApiFallback: true,
  }
});
