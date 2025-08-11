import { z } from 'zod';

// Environment configuration schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  SUPABASE: z.object({
    URL: z.string().default(''),
    ANON_KEY: z.string().default('')
  })
});

// Environment configuration
export const env = envSchema.parse({
  NODE_ENV: import.meta.env.MODE,
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL || '',
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }
});

// Environment type guards
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';

// Feature flags
export const features = {
  enableAnalytics: isProduction(),
  enableDebugLogs: isDevelopment(),
  enablePerfMonitoring: isProduction(),
  enableErrorReporting: isProduction(),
  sessionPersistence: true
} as const;

// Security settings
export const security = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireEmailVerification: true
} as const;

// Data retention policies
export const dataRetention = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  logRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
  tempDataCleanup: 7 * 24 * 60 * 60 * 1000 // 7 days
} as const;

// Environment validation
export function validateEnvironment() {
  // Check required environment variables
  if (!env.SUPABASE.URL || !env.SUPABASE.ANON_KEY) {
    console.error('Missing required Supabase environment variables');
    return false;
  }

  // Check production requirements
  if (env.NODE_ENV === 'production') {
    if (!features.sessionPersistence) {
      console.error('Session persistence must be enabled in production');
      return false;
    }
    if (!features.enableErrorReporting) {
      console.error('Error reporting must be enabled in production');
      return false;
    }
    if (!features.enablePerfMonitoring) {
      console.error('Performance monitoring must be enabled in production');
      return false;
    }
  }

  return true;
}

// Initialize environment
validateEnvironment();