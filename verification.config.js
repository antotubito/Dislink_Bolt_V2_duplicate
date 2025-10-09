/**
 * 🔧 DISLINK VERIFICATION CONFIGURATION
 * 
 * Centralized configuration for the continuous verification system
 * Modify these settings to customize monitoring behavior
 */

module.exports = {
  // Build verification settings
  build: {
    timeout: 120000, // 2 minutes
    maxBundleSize: 1500000, // 1.5MB
    requiredScripts: ['build'],
    outputDirectory: './web/dist'
  },

  // Routing verification settings
  routing: {
    requiredComponents: [
      'Routes',
      'Route',
      'ProtectedRoute',
      'AccessGuard',
      'SessionGuard'
    ],
    requiredRedirects: [
      '/app/login',
      '/app/register',
      '/app/home',
      '/app/profile',
      '/waitlist'
    ],
    criticalRoutes: [
      '/',
      '/app/login',
      '/app/register',
      '/app/home',
      '/app/profile'
    ]
  },

  // Authentication verification settings
  authentication: {
    requiredComponents: [
      'AuthProvider',
      'useAuth',
      'supabase',
      'getSession'
    ],
    requiredEnvVars: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_APP_URL'
    ],
    criticalFiles: [
      './web/src/components/auth/AuthProvider.tsx',
      './shared/lib/supabase.ts',
      './shared/lib/authUtils.ts'
    ]
  },

  // QR flow verification settings
  qrFlow: {
    requiredFunctions: [
      'generateUserQRCode',
      'validateConnectionCode',
      'submitInvitationRequest'
    ],
    requiredComponents: [
      './web/src/components/qr/QRCodeGenerator.tsx',
      './web/src/components/qr/QRScanner.tsx',
      './web/src/components/qr/QRModal.tsx',
      './web/src/pages/PublicProfileUnified.tsx'
    ],
    requiredTypes: [
      'QRConnectionData'
    ],
    criticalFeatures: [
      'qr_generation',
      'qr_scanning',
      'public_profile_display',
      'preview_button'
    ]
  },

  // Data persistence verification settings
  dataPersistence: {
    requiredFiles: [
      './shared/lib/needs.ts',
      './shared/lib/contacts.ts',
      './shared/lib/profile.ts'
    ],
    requiredOperations: {
      needs: ['listNeeds', 'createNeed', 'updateNeed', 'deleteNeed'],
      contacts: ['listContacts', 'createContact', 'updateContact', 'deleteContact'],
      profile: ['getProfile', 'updateProfile']
    },
    supabaseTables: [
      'needs',
      'contacts',
      'profiles',
      'connection_requests'
    ]
  },

  // Caching verification settings
  caching: {
    serviceWorkerFile: './web/public/sw.js',
    devServiceWorkerFile: './web/public/sw-dev.js',
    requiredFeatures: [
      'CACHE_STRATEGIES',
      'NETWORK_FIRST',
      'CACHE_VERSION',
      'install_event',
      'fetch_event'
    ],
    criticalPaths: [
      '/',
      '/index.html'
    ],
    cacheStrategies: {
      root: 'NETWORK_FIRST',
      assets: 'CACHE_FIRST',
      api: 'NETWORK_FIRST'
    }
  },

  // Responsiveness verification settings
  responsiveness: {
    viewportRequired: true,
    requiredAttributes: ['width=device-width', 'initial-scale=1.0'],
    responsiveComponents: [
      './web/src/pages/Home.tsx',
      './web/src/pages/Profile.tsx',
      './web/src/components/qr/QRModal.tsx'
    ],
    mobileAttributes: ['inputMode', 'autoComplete'],
    breakpoints: ['sm:', 'md:', 'lg:'],
    minResponsivenessScore: 70
  },

  // Alert system settings
  alerts: {
    criticalIssues: [
      'blank_screen',
      'auth_failure',
      'supabase_error',
      'qr_malfunction',
      'build_failure',
      'routing_error',
      'data_persistence_error',
      'cache_failure',
      'responsiveness_failure'
    ],
    warningThresholds: {
      bundleSize: 1200000, // 1.2MB
      buildTime: 60000,    // 1 minute
      responsivenessScore: 80
    },
    notificationChannels: [
      'console',
      'file',
      'git_hook'
    ]
  },

  // File watching settings
  fileWatcher: {
    watchPaths: [
      './web/src',
      './shared/lib',
      './web/public',
      './web/vite.config.ts',
      './netlify.toml',
      './package.json'
    ],
    ignorePatterns: [
      /node_modules/,
      /\.git/,
      /dist/,
      /\.DS_Store/,
      /\.log$/,
      /\.tmp$/,
      /\.cache/
    ],
    debounceDelay: 2000,
    verificationCooldown: 10000
  },

  // Dashboard settings
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    maxAlertsDisplay: 5,
    showDetailedStats: true,
    autoRefresh: true
  },

  // Git hooks settings
  gitHooks: {
    postCommit: {
      enabled: true,
      timeout: 60000,
      blockOnFailure: false
    },
    prePush: {
      enabled: true,
      timeout: 120000,
      blockOnFailure: true
    }
  },

  // Reporting settings
  reporting: {
    saveJsonReport: true,
    saveMarkdownReport: true,
    reportDirectory: '.verification/reports',
    logDirectory: '.verification/logs',
    maxReportHistory: 50,
    includeTimestamps: true,
    includePerformanceMetrics: true
  },

  // Performance monitoring
  performance: {
    trackBuildTime: true,
    trackBundleSize: true,
    trackMemoryUsage: true,
    trackCpuUsage: false,
    performanceThresholds: {
      maxBuildTime: 120000,    // 2 minutes
      maxBundleSize: 1500000,  // 1.5MB
      maxMemoryUsage: 500000000 // 500MB
    }
  },

  // Environment-specific settings
  environments: {
    development: {
      enableFileWatching: true,
      enableDashboard: true,
      logLevel: 'debug',
      verificationInterval: 30000
    },
    production: {
      enableFileWatching: false,
      enableDashboard: false,
      logLevel: 'error',
      verificationInterval: 300000 // 5 minutes
    },
    ci: {
      enableFileWatching: false,
      enableDashboard: false,
      logLevel: 'info',
      verificationInterval: 0 // Run once
    }
  }
};
