import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Environment variables with proper fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bbonxxvifycwpoeaxsor.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70';

// Auto-detect environment and base URL
const isProduction = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname === 'dislinkboltv2duplicate.netlify.app');
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Get base URL with proper fallbacks
const getBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001'; // SSR fallback
  
  // Use environment variables first, then auto-detect
  const envUrl = import.meta.env.VITE_SITE_URL || import.meta.env.VITE_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, ''); // Remove trailing slash
  
  // Auto-detect based on current location
  return isProduction ? 'https://dislinkboltv2duplicate.netlify.app' : 'http://localhost:3001';
};

const currentBaseUrl = getBaseUrl();

// Debug environment loading (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Environment Check:');
  console.log('- Environment variables loaded:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log('- Using real Supabase:', supabaseUrl && !supabaseUrl.includes('placeholder'));
  console.log('- Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
  console.log('- Anon Key available:', !!supabaseAnonKey);
  console.log('- Environment mode:', import.meta.env.MODE);
  console.log('- Is production:', isProduction);
  console.log('- Is localhost:', isLocalhost);
  console.log('- Current base URL:', currentBaseUrl);
  console.log('✅ Supabase connection ready');
}

// Validate required credentials
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  const errorMsg = 'Missing or invalid Supabase environment variables';
  console.error('❌ CRITICAL ERROR:', errorMsg);
  console.error('Please set the following in your .env.local file:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  throw new Error(errorMsg);
}

// Log environment variables for debugging (safe for production)
logger.info('Supabase configuration:', {
  urlAvailable: !!supabaseUrl,
  keyAvailable: !!supabaseAnonKey,
  environment: import.meta.env.MODE,
  production: import.meta.env.PROD
});

// Create Supabase client with optimized configuration
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      flowType: 'implicit', // Use implicit flow for better compatibility
      debug: import.meta.env.DEV,
      // Add redirect URLs for better auth flow handling
      redirectTo: `${currentBaseUrl}/confirmed`
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

// Simplified session management
let isSupabaseReady = false;
let connectionHealthy = false;

// Simple connection health check
const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      logger.error('Supabase connection check failed:', error);
      connectionHealthy = false;
      return false;
    }

    connectionHealthy = true;
    return true;
  } catch (error) {
    logger.error('Supabase connection error:', error);
    connectionHealthy = false;
    return false;
  }
};

// Simplified session getter
export const getSafeSession = async () => {
  try {
    const result = await supabase.auth.getSession();
    return result;
  } catch (error) {
    logger.error('Error getting session:', error);
    return { data: { session: null }, error };
  }
};

// Initialize connection
export const initializeConnection = async (): Promise<void> => {
  try {
    logger.info('🔗 Initializing Supabase connection...');

    // Try to recover any existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      logger.warn('Session recovery error (non-critical):', sessionError);
    } else if (session) {
      logger.info('✅ Existing session recovered');
    }

    // Check connection health
    await checkConnection();

    // Mark Supabase as ready
    isSupabaseReady = true;
    logger.info('✅ Supabase connection initialized successfully');

  } catch (error) {
    logger.error('❌ Error during Supabase initialization:', error);
    // Still mark as ready to prevent indefinite waiting
    isSupabaseReady = true;
  }
};

// Export connection health checker
export const isConnectionHealthy = (): boolean => connectionHealthy;

// Export ready state checker
export const isSupabaseSessionReady = (): boolean => isSupabaseReady;

// Simple connection test
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(0);

    if (error) {
      return { success: false, error };
    }

    const { data: { session } } = await supabase.auth.getSession();
    return { 
      success: true, 
      hasSession: !!session,
      user: session?.user?.email || null
    };
  } catch (error) {
    return { success: false, error };
  }
};

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

  // Handle user already exists errors
  if (error?.message?.includes('User already registered') || 
      error?.message?.includes('already been registered') ||
      error?.message?.includes('already exists') ||
      error?.code === 'user_already_exists') {
    return 'This email is already registered. Please log in instead.';
  }

  // Handle email rate limiting
  if (error?.message?.includes('email rate limit exceeded') || 
      error?.code === 'over_email_send_rate_limit') {
    return 'Too many registration attempts. Please wait a few minutes before trying again.';
  }

  // Handle weak password
  if (error?.message?.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  // Handle invalid email format
  if (error?.message?.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }

  return error?.message || `An error occurred during ${operation}. Please try again.`;
};

// Export base URL for use in other modules (already declared above)
export { getBaseUrl };

// Define debug functions first
const debugFunctions = {
  testConnection: testConnection,
  supabase: supabase,
  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return {
        success: !error,
        session: session,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error
      };
    } catch (err) {
      return {
        success: false,
        session: null,
        hasSession: false,
        userId: null,
        email: null,
        error: err
      };
    }
  },
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      return {
        success: !error,
        session: data.session,
        user: data.user,
        error: error
      };
    } catch (err) {
      return {
        success: false,
        session: null,
        user: null,
        error: err
      };
    }
  },
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return {
        success: !error,
        error: error
      };
    } catch (err) {
      return {
        success: false,
        error: err
      };
    }
  },
  register: async (email, password, firstName, lastName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            firstName: firstName,
            lastName: lastName,
            full_name: `${firstName} ${lastName}`
          },
          emailRedirectTo: `${getBaseUrl()}/confirmed`
        }
      });
      return {
        success: !error,
        user: data.user,
        session: data.session,
        error: error
      };
    } catch (err) {
      return {
        success: false,
        user: null,
        session: null,
        error: err
      };
    }
  },
  getBaseUrl: getBaseUrl,
  isConnectionHealthy: isConnectionHealthy,
  isSupabaseSessionReady: isSupabaseSessionReady
};

// Make Supabase client and debug functions available globally for console access
if (typeof window !== 'undefined') {
  // @ts-ignore - Global debugging functions
  window.supabaseDebug = debugFunctions;

  // Also make supabase directly available for convenience
  // @ts-ignore
  window.supabase = supabase;
  
  // Ensure functions are properly bound
  Object.keys(debugFunctions).forEach(key => {
    if (typeof debugFunctions[key] === 'function') {
      // @ts-ignore
      window.supabaseDebug[key] = debugFunctions[key].bind(debugFunctions);
    }
  });
}
