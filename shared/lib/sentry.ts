import * as Sentry from '@sentry/react'

// Global flag to prevent multiple Sentry initializations
let sentryInitialized = false;

export function initSentry() {
  // Prevent multiple Sentry initializations
  if (sentryInitialized) {
    console.log('⚠️ Sentry already initialized, skipping...');
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://5cf6baeb345997373227ec819ed8cafe@o4510074051756032.ingest.us.sentry.io/4510074063749120'

  // Only initialize Sentry in production to avoid development connection issues
  if (import.meta.env.PROD && sentryDsn && sentryDsn !== 'your_sentry_dsn_here') {
    console.log('🔍 Initializing Sentry for production with DSN:', sentryDsn.substring(0, 20) + '...')

    // Mark as initialized before calling Sentry.init
    sentryInitialized = true;

    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 0.1, // Lower sampling in production
      replaysSessionSampleRate: 0.1, // Lower sampling in production
      replaysOnErrorSampleRate: 1.0,
      // Additional configuration for better error tracking
      beforeSend(event) {
        // Filter out development errors if needed
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.type === 'ChunkLoadError') {
            return null // Don't send chunk load errors
          }
        }
        return event
      },
    })

    console.log('✅ Sentry initialized successfully for production')
  } else {
    console.log('⚠️ Sentry disabled in development mode to prevent connection issues')
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  // Enhanced error context for better debugging
  const enhancedContext = {
    ...context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    environment: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  };

  // Only capture errors in production
  if (import.meta.env.PROD) {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://5cf6baeb345997373227ec819ed8cafe@o4510074051756032.ingest.us.sentry.io/4510074063749120'

    if (sentryDsn && sentryDsn !== 'your_sentry_dsn_here') {
      Sentry.captureException(error, {
        contexts: {
          custom: enhancedContext
        },
        tags: {
          component: context?.context || 'unknown',
          userId: context?.userId || 'unknown'
        },
        level: 'error'
      })
    } else {
      console.error('Error captured:', error, enhancedContext)
    }
  } else {
    console.error('Error captured (dev mode):', error, enhancedContext)
  }
}

export function captureMessage(message: string, level: string = 'info') {
  try {
    // Normalize the level to ensure it's a string and valid
    const normalizedLevel = typeof level === 'string' ? level.toLowerCase() : 'info';
    const validLevels = ['info', 'warning', 'error', 'debug', 'fatal'];
    const finalLevel = validLevels.includes(normalizedLevel) ? normalizedLevel : 'info';
    
    // Only capture messages in production
    if (import.meta.env.PROD) {
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://5cf6baeb345997373227ec819ed8cafe@o4510074051756032.ingest.us.sentry.io/4510074063749120'

      if (sentryDsn && sentryDsn !== 'your_sentry_dsn_here') {
        Sentry.captureMessage(message, finalLevel as any)
      } else {
        console.log(`[${finalLevel.toUpperCase()}] ${message}`)
      }
    } else {
      console.log(`[${finalLevel.toUpperCase()}] ${message} (dev mode)`)
    }
  } catch (err) {
    console.error("Failed to capture message:", err);
    console.log(`[ERROR] ${message} (fallback)`);
  }
}

export function captureProfileError(error: Error, user: any, context: string) {
  const profileContext = {
    context: `Profile-${context}`,
    userId: user?.id || 'unknown',
    userEmail: user?.email || 'unknown',
    hasUserData: !!user,
    userDataKeys: user ? Object.keys(user) : [],
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    // Profile-specific context
    profileData: {
      hasProfileImage: !!user?.profileImage,
      hasCoverImage: !!user?.coverImage,
      hasBio: !!user?.bio,
      hasInterests: !!user?.interests?.length,
      hasSocialLinks: !!user?.socialLinks && Object.keys(user.socialLinks).length > 0,
      onboardingComplete: user?.onboardingComplete,
      registrationComplete: user?.registrationComplete
    }
  };

  captureError(error, profileContext);
}

export function setUserContext(user: { id: string; email: string; name?: string }) {
  // Only set user context in production
  if (import.meta.env.PROD) {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://5cf6baeb345997373227ec819ed8cafe@o4510074051756032.ingest.us.sentry.io/4510074063749120'

    if (sentryDsn && sentryDsn !== 'your_sentry_dsn_here') {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name
      })
    }
  } else {
    console.log('User context set (dev mode):', user)
  }
}

export function clearUserContext() {
  // Only clear user context in production
  if (import.meta.env.PROD) {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 'https://5cf6baeb345997373227ec819ed8cafe@o4510074051756032.ingest.us.sentry.io/4510074063749120'

    if (sentryDsn && sentryDsn !== 'your_sentry_dsn_here') {
      Sentry.setUser(null)
    }
  } else {
    console.log('User context cleared (dev mode)')
  }
}
