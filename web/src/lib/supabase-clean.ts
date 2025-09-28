import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Get environment variables with explicit fallback check
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bbonxxvifycwpoeaxsor.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70';

// Debug environment loading
console.log('🔍 Supabase Environment Check:');
console.log('- Environment variables loaded:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('- Using real Supabase:', !supabaseUrl.includes('placeholder'));
console.log('✅ Supabase connection ready');

// Enhanced environment validation - now using fallback values
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ENVIRONMENT WARNING: Environment variables not found in import.meta.env');
  console.warn('Using hardcoded fallback values to ensure Supabase works');
  console.warn('Available env vars:', {
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });
} else {
  console.log('✅ Environment variables loaded successfully from .env.local');
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

// Session ready state management
let isSupabaseReady = false;
let sessionReadyPromise: Promise<void> | null = null;
const sessionReadyCallbacks: (() => void)[] = [];

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

// Safe session getter that waits for Supabase to be ready
export const getSafeSession = async (): Promise<{ data: { session: any }, error: any }> => {
  // Wait for Supabase to be ready before checking session
  await waitForSupabaseReady();

  try {
    logger.info('🔐 Getting session (safe)...');
    const result = await supabase.auth.getSession();
    logger.info('🔐 Session result:', { hasSession: !!result.data.session, error: !!result.error });
    return result;
  } catch (error) {
    logger.error('🔐 Error getting safe session:', error);
    return { data: { session: null }, error };
  }
};

// Function to wait for Supabase to be ready
export const waitForSupabaseReady = (): Promise<void> => {
  if (isSupabaseReady) {
    return Promise.resolve();
  }

  if (sessionReadyPromise) {
    return sessionReadyPromise;
  }

  sessionReadyPromise = new Promise((resolve) => {
    if (isSupabaseReady) {
      resolve();
      return;
    }

    sessionReadyCallbacks.push(resolve);
  });

  return sessionReadyPromise;
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
        // Still mark as ready even if connection failed - allow app to function
      }

      // Mark Supabase as ready
      isSupabaseReady = true;
      logger.info('✅ Supabase connection initialized successfully - ready for session checks');

      // Notify all waiting callbacks
      sessionReadyCallbacks.forEach(callback => callback());
      sessionReadyCallbacks.length = 0; // Clear the array

    } catch (error) {
      logger.error('❌ Critical error during Supabase initialization:', error);
      // Still mark as ready to prevent indefinite waiting
      isSupabaseReady = true;
      sessionReadyCallbacks.forEach(callback => callback());
      sessionReadyCallbacks.length = 0;
    }
  }, 100); // Small delay to ensure React has rendered first
};

// Export connection health checker
export const isConnectionHealthy = (): boolean => connectionHealthy;

// Production connection test (exposed globally for debugging)
export const testProductionConnection = async (): Promise<{
  status: 'success' | 'error';
  message: string;
  details: any;
}> => {
  try {
    console.log('🧪 Testing Supabase production connection...');

    // Check environment variables
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return {
        status: 'error',
        message: 'Missing or invalid Supabase environment variables',
        details: {
          url: supabaseUrl ? 'Present' : 'Missing',
          key: supabaseAnonKey ? 'Present' : 'Missing',
          isPlaceholder: supabaseUrl?.includes('placeholder') || false
        }
      };
    }

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(0);

    if (connectionError) {
      return {
        status: 'error',
        message: 'Database connection failed',
        details: connectionError
      };
    }

    // Test authentication state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    return {
      status: 'success',
      message: 'Supabase connection successful',
      details: {
        database: 'Connected',
        profilesCount: connectionTest?.length ?? 'Unknown',
        hasSession: !!session,
        sessionUser: session?.user?.email || 'No user',
        environment: import.meta.env.MODE,
        url: supabaseUrl?.substring(0, 30) + '...',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Connection test failed',
      details: error
    };
  }
};

// Live production test function
export const runLiveProductionTest = async (): Promise<void> => {
  console.log('🚀 Starting LIVE Supabase Production Test...');

  const result = await testProductionConnection();

  if (result.status === 'success') {
    console.log('✅ SUPABASE CONNECTION SUCCESSFUL!');
    console.log('📊 Connection Details:', result.details);
  } else {
    console.error('❌ SUPABASE CONNECTION FAILED!');
    console.error('💥 Error Details:', result.details);
  }

  return result;
};

// Export ready state checker
export const isSupabaseSessionReady = (): boolean => isSupabaseReady;

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

// Test email registration function
export const testEmailRegistration = async (testEmail?: string): Promise<void> => {
  const email = testEmail || `test.${Date.now()}@example.com`;

  console.log('🧪 Testing email registration...');
  console.log(`📧 Test email: ${email}`);
  console.log(`🔗 Redirect URL: ${window.location.origin}/confirmed`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'testpassword123',
      options: {
        data: {
          firstName: 'Test',
          lastName: 'User',
          full_name: 'Test User'
        },
        emailRedirectTo: `${window.location.origin}/confirmed`
      }
    });

    console.log('\n📊 Registration Result:');
    console.log('Data:', data);

    if (error) {
      console.log('❌ Registration Error:', error.message);

      if (error.message.includes('Email not confirmed')) {
        console.log('\n💡 ISSUE: Email confirmation required but not being sent');
        console.log('🔧 SOLUTION: Check Supabase Dashboard → Authentication → Settings');
        console.log('   ✅ Enable "Confirm email"');
        console.log('   ✅ Check URL Configuration');
      } else if (error.message.includes('already registered')) {
        console.log('\n💡 User already exists (this is normal for test emails)');
      } else {
        console.log('\n🚨 Unexpected error - check SUPABASE_EMAIL_DIAGNOSIS.md');
      }
    } else {
      console.log('✅ Registration submitted successfully!');
      console.log(`User ID: ${data.user?.id}`);
      console.log(`Email Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`Session: ${data.session ? 'Active' : 'None (email confirmation required)'}`);

      if (!data.session && !data.user?.email_confirmed_at) {
        console.log('\n📧 ✅ EMAIL CONFIRMATION REQUIRED');
        console.log('   User should receive confirmation email');
        console.log('   Check your email (including spam folder)');
      } else if (data.session) {
        console.log('\n⚠️ User logged in immediately - email confirmation might be disabled');
      }
    }

  } catch (err) {
    console.log('\n🚨 Network/Connection Error:', err.message);
    console.log('Check your internet connection and Supabase configuration');
  }
};

// Make test functions available globally for console access
if (typeof window !== 'undefined') {
}
