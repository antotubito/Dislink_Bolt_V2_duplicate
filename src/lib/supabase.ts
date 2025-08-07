import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced environment validation
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing Supabase environment variables. Please check your configuration.';
  console.error('❌ Supabase Configuration Error:', errorMessage);
  console.error('Available env vars:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  
  // In production, we want to fail gracefully but still initialize
  if (import.meta.env.PROD) {
    console.warn('🚨 Production mode: Attempting to continue with fallback configuration');
  }
}

// Log environment variables for debugging (safe for production)
logger.info('Supabase configuration:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseAnonKey,
  environment: import.meta.env.MODE,
  production: import.meta.env.PROD
});

// Create Supabase client with enhanced production configuration
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      flowType: 'pkce',
      debug: import.meta.env.DEV
    },
    global: {
      headers: {
        'x-application-name': 'dislink',
        'x-environment': import.meta.env.MODE,
        'x-client-info': 'dislink-web@1.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: import.meta.env.PROD ? 5 : 10
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Connection health check
let connectionHealthy = false;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

const checkConnection = async (): Promise<boolean> => {
  try {
    const now = Date.now();
    if (connectionHealthy && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
      return true;
    }

    // Simple health check
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase connection check failed:', error);
      connectionHealthy = false;
      return false;
    }

    connectionHealthy = true;
    lastConnectionCheck = now;
    logger.info('✅ Supabase connection healthy');
    return true;
  } catch (error) {
    logger.error('Supabase connection error:', error);
    connectionHealthy = false;
    return false;
  }
};

const retryConnection = async (maxRetries = 3, delay = 1000): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    const isHealthy = await checkConnection();
    if (isHealthy) return true;
    
    if (i < maxRetries - 1) {
      logger.info(`🔄 Retrying connection in ${delay}ms... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  return false;
};

// Initialize connection in background (non-blocking)
export const initializeConnection = async (): Promise<void> => {
  // Use setTimeout to ensure this runs after the initial render
  setTimeout(async () => {
    try {
      // Check if credentials are available
      if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('Missing Supabase credentials. Skipping connection initialization.');
        return;
      }

      logger.info('🔗 Initializing Supabase connection...');

      // Try to recover any existing session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.warn('Session recovery error (non-critical):', sessionError);
      } else if (session) {
        logger.info('✅ Existing session recovered');
      }

      // Check connection health
      const isHealthy = await retryConnection();
      
      if (!isHealthy) {
        logger.error('❌ Failed to establish healthy Supabase connection after retries');
        return;
      }

      logger.info('✅ Supabase connection initialized successfully');
      
    } catch (error) {
      logger.error('❌ Critical error during Supabase initialization:', error);
    }
  }, 0);
};

// Export connection health checker
export const isConnectionHealthy = (): boolean => connectionHealthy;

// Graceful error handling for auth operations
export const handleSupabaseError = (error: any, operation: string) => {
  logger.error(`Supabase ${operation} error:`, error);
  
  // Return user-friendly error messages
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (error?.message?.includes('Too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  
  if (error?.message?.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return error?.message || `An error occurred during ${operation}. Please try again.`;
};