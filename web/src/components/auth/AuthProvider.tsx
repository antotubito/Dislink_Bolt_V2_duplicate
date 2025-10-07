import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@dislink/shared/types';
import { supabase, isConnectionHealthy, initializeConnection, getSafeSession } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { initUserPreferences } from "@dislink/shared/lib/userPreferences";

// Global flag to prevent multiple Supabase initializations
let supabaseInitialized = false;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isTestingChannel: boolean;
  refreshUser: () => Promise<void>;
  reconnectSupabase: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  invalidateProfileCache: (userId?: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export { AuthContext };

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return auth;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('🔐 AuthProvider initializing...');
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isTestingChannel] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Initialize user preferences
  useEffect(() => {
    initUserPreferences(null);
  }, []);

  // Check connection health
  const checkConnection = async () => {
    try {
      const isHealthy = isConnectionHealthy(); // Remove await - this is synchronous
      setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
      return isHealthy;
    } catch (error) {
      logger.error('Connection health check failed:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Reconnect to Supabase
  const reconnectSupabase = async (): Promise<boolean> => {
    try {
      setConnectionStatus('connecting');
      await initializeConnection();
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      logger.error('Failed to reconnect to Supabase:', error);
      setConnectionStatus('disconnected');
      return false;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        // Force a direct database query to get the most up-to-date profile data
        // This ensures we get the latest onboarding status
        const { data: freshProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError) {
          logger.warn('Direct profile query failed, falling back to getCurrentProfile:', profileError);
          
          // Fallback to the original method
          const profilePromise = (async () => {
            const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
            return await getCurrentProfile();
          })();

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile refresh timeout')), 8000);
          });

          try {
            const profile = await Promise.race([profilePromise, timeoutPromise]) as User | null;
            
            if (profile) {
              setUser(profile);
              setIsOwner(true);
              logger.info('✅ User profile refreshed successfully (fallback):', { 
                userId: profile.id, 
                onboardingComplete: profile.onboardingComplete,
                email: profile.email 
              });
            } else {
              setUser(currentUser as unknown as User);
              setIsOwner(true);
              logger.warn('Profile not found, using auth user data');
            }
          } catch (fallbackError) {
            logger.warn('Profile refresh timeout or error, using auth user data:', fallbackError);
            setUser(currentUser as unknown as User);
            setIsOwner(true);
          }
        } else if (freshProfile) {
          // Use the fresh profile data from direct database query
          setUser(freshProfile as User);
          setIsOwner(true);
          logger.info('✅ User profile refreshed successfully (direct query):', { 
            userId: freshProfile.id, 
            onboardingComplete: freshProfile.onboarding_complete,
            email: freshProfile.email 
          });
        } else {
          // Fallback to auth user if no profile found
          setUser(currentUser as unknown as User);
          setIsOwner(true);
          logger.warn('No profile found in direct query, using auth user data');
        }
      } else {
        setUser(null);
        setIsOwner(false);
      }
    } catch (error) {
      logger.error('Failed to refresh user:', error);
      setError('Failed to refresh user data');
    }
  };

  // Invalidate profile cache
  const invalidateProfileCache = (userId?: string) => {
    // Clear any cached profile data
    if (userId) {
      localStorage.removeItem(`profile_${userId}`);
    } else {
      // Clear all profile cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profile_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔐 AuthProvider: Initializing authentication...');
        
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

        // Get initial session with enhanced logging
        console.log('🔐 AuthProvider: Getting initial session...');
        const { data: { session }, error: sessionError } = await getSafeSession();
        
        console.log('🔐 AuthProvider: Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          sessionExpiresAt: session?.expires_at,
          error: sessionError?.message
        });
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        if (sessionError) {
          console.error('🔐 AuthProvider: Session check failed:', sessionError);
          logger.error('Session check failed:', sessionError);
          setError('Failed to check authentication status');
        } else if (session?.user) {
          console.log('🔐 AuthProvider: User found, loading profile...');
          // Get full profile data from database
          try {
            const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
            const profile = await getCurrentProfile();
          
          if (!isMounted) return; // Component unmounted, don't update state
          
            if (profile) {
              console.log('🔐 AuthProvider: Profile loaded successfully:', {
                userId: profile.id,
                onboardingComplete: profile.onboardingComplete,
                email: profile.email
              });
              setUser(profile);
              setIsOwner(true);
              logger.info('User profile loaded:', { userId: profile.id, onboardingComplete: profile.onboardingComplete });
            } else {
              console.warn('🔐 AuthProvider: Profile not found, using auth user data');
              // Fallback to auth user if profile not found, but mark onboarding as incomplete
              const fallbackUser = {
                ...session.user,
                onboardingComplete: false // Explicitly mark as incomplete for new users
              } as unknown as User;
              setUser(fallbackUser);
              setIsOwner(true);
              logger.warn('Profile not found, using auth user data with onboarding incomplete');
            }
          } catch (profileError) {
            console.error('🔐 AuthProvider: Failed to load user profile:', profileError);
            logger.error('Failed to load user profile:', profileError);
            // Fallback to auth user if profile loading fails
            setUser(session.user as unknown as User);
            setIsOwner(true);
            logger.warn('Using auth user data due to profile loading error');
          }
        } else {
          console.log('🔐 AuthProvider: No active session found');
          setUser(null);
          setIsOwner(false);
          logger.info('No active session found');
        }

        setSessionChecked(true);
        console.log('🔐 AuthProvider: Authentication initialization complete');
      } catch (error) {
        console.error('🔐 AuthProvider: Auth initialization failed:', error);
        logger.error('Auth initialization failed:', error);
        setError('Authentication initialization failed');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!sessionChecked) return;

    console.log('🔐 AuthProvider: Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state change detected:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
        logger.info('Auth state changed:', { event, hasSession: !!session });
        
        if (session?.user) {
          console.log('🔐 AuthProvider: User found in auth state change, loading profile...');
          try {
            // Add timeout to profile loading to prevent hanging
            const profilePromise = (async () => {
              const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
              return await getCurrentProfile();
            })();

            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile loading timeout')), 10000); // 10 second timeout
            });

            const profile = await Promise.race([profilePromise, timeoutPromise]) as User | null;
            
            if (profile) {
              setUser(profile);
              setIsOwner(true);
              setError(null);
              logger.info('User profile updated from auth state change:', { userId: profile.id, onboardingComplete: profile.onboardingComplete });
            } else {
              // Fallback to auth user if profile not found, but mark onboarding as incomplete
              const fallbackUser = {
                ...session.user,
                onboardingComplete: false // Explicitly mark as incomplete for new users
              } as unknown as User;
              setUser(fallbackUser);
              setIsOwner(true);
              setError(null);
              logger.warn('Profile not found during auth state change, using auth user data with onboarding incomplete');
            }
            
            // Initialize user preferences for new session (don't block on this)
            initUserPreferences(session.user.id).catch(error => {
              logger.warn('Failed to initialize user preferences:', error);
            });
          } catch (error) {
            logger.error('Error loading profile during auth state change:', error);
            // Fallback to auth user if profile loading fails
            setUser(session.user as unknown as User);
            setIsOwner(true);
            setError(null);
            logger.warn('Using auth user data due to profile loading error');
          }
        } else {
          setUser(null);
          setIsOwner(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    isOwner,
    isTestingChannel,
    refreshUser,
    reconnectSupabase,
    connectionStatus,
    invalidateProfileCache,
  };


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}