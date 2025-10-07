import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@dislink/shared/types';
import { supabase, isConnectionHealthy, initializeConnection } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { initUserPreferences } from "@dislink/shared/lib/userPreferences";
import { redisCache } from '../../lib/cache/RedisCache';
import { abTestingFramework } from '../../lib/ab-testing/ABTestingFramework';
import { analytics } from '@dislink/shared/lib/analytics';

// Global flag to prevent multiple Supabase initializations
let supabaseInitialized = false;

interface EnhancedAuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isTestingChannel: boolean;
  refreshUser: () => Promise<void>;
  reconnectSupabase: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  invalidateProfileCache: (userId?: string) => void;
  // Enhanced features
  sessionMetrics: {
    loginTime: number | null;
    sessionDuration: number;
    pageViews: number;
    lastActivity: number;
  };
  experimentAssignments: Record<string, string>;
  cacheStats: {
    hitRate: number;
    totalRequests: number;
    cacheSize: number;
  };
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null);

export { EnhancedAuthContext };

export function useEnhancedAuth() {
  const auth = useContext(EnhancedAuthContext);
  if (!auth) {
    throw new Error("useEnhancedAuth must be used within an EnhancedAuthProvider");
  }
  return auth;
}

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  console.log('🔐 EnhancedAuthProvider initializing...');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isTestingChannel] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Enhanced metrics
  const [sessionMetrics, setSessionMetrics] = useState({
    loginTime: null as number | null,
    sessionDuration: 0,
    pageViews: 0,
    lastActivity: Date.now()
  });
  
  const [experimentAssignments, setExperimentAssignments] = useState<Record<string, string>>({});
  const [cacheStats, setCacheStats] = useState({
    hitRate: 0,
    totalRequests: 0,
    cacheSize: 0
  });

  // Initialize user preferences
  useEffect(() => {
    initUserPreferences(null);
  }, []);

  // Update session metrics
  const updateSessionMetrics = () => {
    setSessionMetrics(prev => ({
      ...prev,
      lastActivity: Date.now(),
      pageViews: prev.pageViews + 1,
      sessionDuration: prev.loginTime ? Date.now() - prev.loginTime : 0
    }));
  };

  // Track page view
  useEffect(() => {
    updateSessionMetrics();
  }, []);

  // Update cache stats
  const updateCacheStats = async () => {
    try {
      const stats = await redisCache.getStats();
      setCacheStats({
        hitRate: stats.hitRate,
        totalRequests: stats.hits + stats.misses,
        cacheSize: stats.totalKeys
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
  };

  // Check connection health
  const checkConnection = async () => {
    try {
      const isHealthy = await isConnectionHealthy();
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
      
      // Track connection health
      analytics.trackEvent('connection_health_check', {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: Date.now()
      });
      
      return isHealthy;
    } catch (error) {
      logger.error('Connection health check failed:', error);
      setConnectionStatus('disconnected');
      
      analytics.trackEvent('connection_health_check', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
      return false;
    }
  };

  // Reconnect to Supabase
  const reconnectSupabase = async (): Promise<boolean> => {
    try {
      setConnectionStatus('connecting');
      await initializeConnection();
      setConnectionStatus('connected');
      
      analytics.trackEvent('supabase_reconnect', {
        success: true,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to reconnect to Supabase:', error);
      setConnectionStatus('disconnected');
      
      analytics.trackEvent('supabase_reconnect', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
      return false;
    }
  };

  // Assign user to experiments
  const assignUserToExperiments = async (userId: string) => {
    try {
      const experiments = abTestingFramework.getExperiments();
      const assignments: Record<string, string> = {};
      
      for (const experiment of experiments) {
        if (experiment.status === 'running') {
          const variantId = await abTestingFramework.assignUserToExperiment(userId, experiment.id);
          if (variantId) {
            assignments[experiment.id] = variantId;
          }
        }
      }
      
      setExperimentAssignments(assignments);
      
      // Track experiment assignments
      analytics.trackEvent('experiment_assignments', {
        userId,
        assignments,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Failed to assign user to experiments:', error);
    }
  };

  // Refresh user data with caching
  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Try to get profile from cache first
        const cacheKey = `profile:${currentUser.id}`;
        let profile = await redisCache.get<User>(cacheKey);
        
        if (!profile) {
          // Get full profile data from database
          const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
          profile = await getCurrentProfile();
          
          // Cache the profile for 5 minutes
          if (profile) {
            await redisCache.set(cacheKey, profile, { ttl: 300 });
          }
        }
        
        if (profile) {
          setUser(profile);
          setIsOwner(true);
          
          // Update session metrics
          setSessionMetrics(prev => ({
            ...prev,
            loginTime: prev.loginTime || Date.now()
          }));
          
          // Assign to experiments
          await assignUserToExperiments(profile.id);
          
          logger.info('User profile refreshed:', { userId: profile.id, onboardingComplete: profile.onboardingComplete });
        } else {
          // Fallback to auth user if profile not found
          setUser(currentUser as unknown as User);
          setIsOwner(true);
          logger.warn('Profile not found, using auth user data');
        }
      } else {
        setUser(null);
        setIsOwner(false);
        setExperimentAssignments({});
      }
      
      // Update cache stats
      await updateCacheStats();
    } catch (error) {
      logger.error('Failed to refresh user:', error);
      setError('Failed to refresh user data');
    }
  };

  // Invalidate profile cache
  const invalidateProfileCache = async (userId?: string) => {
    try {
      if (userId) {
        await redisCache.del(`profile:${userId}`);
        localStorage.removeItem(`profile_${userId}`);
      } else {
        // Clear all profile cache
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('profile_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear Redis cache for all profiles
        await redisCache.invalidateByTags(['profile']);
      }
      
      // Update cache stats
      await updateCacheStats();
    } catch (error) {
      logger.error('Failed to invalidate profile cache:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Prevent multiple Supabase initializations
        if (!supabaseInitialized) {
          supabaseInitialized = true;
          
          // Check connection first
          const isConnected = await checkConnection();
          if (!isConnected) {
            logger.warn('Supabase connection not healthy, attempting to reconnect...');
            await reconnectSupabase();
          }
        }

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Session check failed:', sessionError);
          setError('Failed to check authentication status');
        } else if (session?.user) {
          // Get full profile data from database
          const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
          const profile = await getCurrentProfile();
          
          if (profile) {
            setUser(profile);
            setIsOwner(true);
            
            // Update session metrics
            setSessionMetrics(prev => ({
              ...prev,
              loginTime: Date.now()
            }));
            
            // Assign to experiments
            await assignUserToExperiments(profile.id);
            
            logger.info('User profile loaded:', { userId: profile.id, onboardingComplete: profile.onboardingComplete });
          } else {
            // Fallback to auth user if profile not found
            setUser(session.user as unknown as User);
            setIsOwner(true);
            logger.warn('Profile not found, using auth user data');
          }
        } else {
          setUser(null);
          setIsOwner(false);
          logger.info('No active session found');
        }

        setSessionChecked(true);
        
        // Update cache stats
        await updateCacheStats();
      } catch (error) {
        logger.error('Auth initialization failed:', error);
        setError('Authentication initialization failed');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!sessionChecked) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed:', { event, hasSession: !!session });
        
        // Track auth state changes
        analytics.trackEvent('auth_state_change', {
          event,
          hasSession: !!session,
          timestamp: Date.now()
        });
        
        if (session?.user) {
          // Get full profile data from database
          const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
          const profile = await getCurrentProfile();
          
          if (profile) {
            setUser(profile);
            setIsOwner(true);
            setError(null);
            
            // Update session metrics
            setSessionMetrics(prev => ({
              ...prev,
              loginTime: Date.now(),
              pageViews: 0
            }));
            
            // Assign to experiments
            await assignUserToExperiments(profile.id);
            
            logger.info('User profile updated from auth state change:', { userId: profile.id, onboardingComplete: profile.onboardingComplete });
          } else {
            // Fallback to auth user if profile not found
            setUser(session.user as unknown as User);
            setIsOwner(true);
            setError(null);
            logger.warn('Profile not found during auth state change, using auth user data');
          }
          
          // Initialize user preferences for new session
          await initUserPreferences(session.user.id);
        } else {
          setUser(null);
          setIsOwner(false);
          setExperimentAssignments({});
          
          // Reset session metrics
          setSessionMetrics({
            loginTime: null,
            sessionDuration: 0,
            pageViews: 0,
            lastActivity: Date.now()
          });
        }
        
        // Update cache stats
        await updateCacheStats();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  // Periodic cache stats update
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const contextValue: EnhancedAuthContextType = {
    user,
    loading,
    error,
    isOwner,
    isTestingChannel,
    refreshUser,
    reconnectSupabase,
    connectionStatus,
    invalidateProfileCache,
    sessionMetrics,
    experimentAssignments,
    cacheStats,
  };

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}
