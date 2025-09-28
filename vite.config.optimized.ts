import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'qr-vendor': ['qr-scanner'],
          
          // Feature chunks
          'auth': [
            './src/components/auth/AuthProvider.tsx',
            './src/components/auth/ProtectedRoute.tsx',
            './src/components/auth/SessionGuard.tsx'
          ],
          'onboarding': [
            './src/components/onboarding/OnboardingStep.tsx',
            './src/components/onboarding/EnhancedSocialPlatforms.tsx',
            './src/components/onboarding/AnimatedButton.tsx'
          ],
          'qr': [
            './src/components/qr/QRCodeGenerator.tsx',
            './src/components/qr/QRScanner.tsx',
            './src/lib/qr.ts',
            './src/lib/qrEnhanced.ts'
          ],
          'contacts': [
            './src/components/contacts/ContactProfile.tsx',
            './src/components/contacts/ContactCard.tsx',
            './src/lib/contacts.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3001,
    host: true
  },
  preview: {
    port: 3001,
    host: true
  }
})
