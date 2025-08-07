import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('❌ CRITICAL: Missing Supabase credentials!', {
    urlMissing: !supabaseUrl,
    keyMissing: !supabaseAnonKey,
    envMode: import.meta.env.MODE
  });
  
  // Show user-friendly error in development
  if (import.meta.env.DEV) {
    console.error(`
🚨 CONFIGURATION ERROR: Missing Supabase credentials!

Please add the following to your .env file:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Contact your developer to get the correct values.
    `);
  }
}

// Log environment variables for debugging
console.log('🔧 Supabase Configuration Debug:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 30) + '...' || 'MISSING',
  key: supabaseAnonKey?.substring(0, 10) + '...' || 'MISSING',
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  allViteEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  supabaseEnvVars: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
});

logger.info('Supabase configuration:', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseAnonKey,
  url: supabaseUrl?.substring(0, 30) + '...' || 'MISSING' // Only show partial URL for security
});

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  },
  global: {
    headers: {
      'x-application-name': 'dislink',
      'x-environment': import.meta.env.MODE
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Initialize connection in background (non-blocking)
export const initializeConnection = async (): Promise<void> => {
  // Use setTimeout to ensure this runs after the initial render
  setTimeout(async () => {
    try {
      // Check if credentials are available
      if (!supabaseUrl || !supabaseAnonKey) {
        logger.error('Missing Supabase credentials. Please check your .env file.');
        return;
      }

      // Try to recover any existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        if (error.message?.includes('Invalid API key')) {
          logger.error('Invalid Supabase API key. Please check your credentials.');
        } else {
          logger.error('Error getting session:', error);
        }
        return;
      }
      
      if (session) {
        logger.info('Existing session found');
        
        // Calculate time until session expires
        const expiresAt = new Date(session.expires_at!).getTime();
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        
        // If session expires soon (within 5 minutes), refresh it
        if (timeUntilExpiry < 5 * 60 * 1000) {
          logger.info('Session expiring soon, refreshing');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            logger.error('Error refreshing session:', refreshError);
          }
        }
      } else {
        logger.info('No session found');
      }
    } catch (error) {
      logger.error('Error initializing connection:', error);
      // Don't throw the error, just log it
    }
  }, 0);
};

// Export helper to check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Check if credentials are available
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Missing Supabase credentials');
      return false;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (error.message?.includes('Invalid API key')) {
        logger.error('Invalid Supabase API key detected during connection check');
      } else {
        logger.error('Connection check failed:', error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Connection check error:', error);
    return false;
  }
};

// Retry connection with exponential backoff
export const retryConnection = async (maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isConnected = await checkConnection();
      if (isConnected) {
        logger.info(`Connection successful on attempt ${attempt}`);
        return true;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logger.info(`Connection attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      logger.error(`Connection attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        return false;
      }
    }
  }
  
  logger.error(`Connection failed after ${maxRetries} attempts`);
  return false;
};