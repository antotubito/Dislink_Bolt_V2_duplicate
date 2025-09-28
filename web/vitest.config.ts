import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Enable globals for better DX
    globals: true,
    
    // Use happy-dom for DOM testing (more compatible with Vitest 3.2.4)
    environment: 'happy-dom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'android',
      'ios'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'android/',
        'ios/'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // UI mode configuration
    ui: {
      enabled: true
    },
    
    // Watch mode
    watch: false,
    
    // Reporter configuration
    reporter: ['verbose', 'html'],
    
    // Output directory for test results
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json'
    }
  },
  
  // Resolve aliases (same as vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Define global constants
  define: {
    // Mock environment variables for testing
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    'import.meta.env.VITE_APP_URL': JSON.stringify('http://localhost:3001'),
    'import.meta.env.MODE': JSON.stringify('test'),
    'import.meta.env.PROD': false,
    'import.meta.env.DEV': true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ]
  }
})
