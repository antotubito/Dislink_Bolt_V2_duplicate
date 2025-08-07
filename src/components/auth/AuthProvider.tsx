import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../../types/user';
import { supabase, retryConnection } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { initUserPreferences } from '../../lib/userPreferences';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isTestingChannel: boolean;
  refreshUser: (forceRefresh?: boolean) => Promise<void>;
  reconnectSupabase: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isOwner: false,
  isTestingChannel: false,
  refreshUser: async () => {},
  reconnectSupabase: async () => false,
  connectionStatus: 'connecting'
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isTestingChannel, setIsTestingChannel] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/waitlist',
    '/story',
    '/app/login',
    '/app/register',
    '/app/terms',
    '/app/test-terms',
    '/terms',
    '/privacy',
    '/testing',
    '/testing/login',
    '/verify',
    '/confirm',
    '/confirmed',
    '/share',
    '/app/reset-password',
    '/demo'
  ];

  const handleAuthError = async (error: any) => {
    logger.error('Auth error:', error);
    
    // Check for refresh token errors
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('refresh_token_not_found')) {
      logger.info('Invalid refresh token detected, signing out user');
      await supabase.auth.signOut();
      setUser(null);
      setError('Session expired. Please sign in again.');
      
      // Store current path for redirect after login if it's not a public path
      if (!publicPaths.some(path => location.pathname.startsWith(path))) {
        localStorage.setItem('redirectUrl', location.pathname);
      }
      
      navigate('/app/login');
      return true;
    }
    
    // Check for connection errors
    if (error.message?.includes('Failed to fetch') || 
        error.message?.includes('Network Error') ||
        error.message?.includes('connection')) {
      setConnectionStatus('disconnected');
      setError('Connection to Supabase lost. Please check your internet connection.');
      return true;
    }
    
    return false;
  };

  const reconnectSupabase = async (): Promise<boolean> => {
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      const reconnected = await retryConnection();
      setConnectionStatus(reconnected ? 'connected' : 'disconnected');
      
      if (reconnected) {
        await refreshUser();
        return true;
      } else {
        setError('Failed to reconnect to Supabase. Please try again later.');
        return false;
      }
    } catch (error) {
      logger.error('Error reconnecting to Supabase:', error);
      setConnectionStatus('disconnected');
      setError('Failed to reconnect to Supabase. Please try again later.');
      return false;
    }
  };

  const refreshUser = async (forceRefresh: boolean = false) => {
    try {
      logger.info('Refreshing user data', { forceRefresh, currentPath: location.pathname });
      
      setLoading(true);
      setError(null);

      // Get session first - this is fastest
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error('Session error during refresh:', sessionError);
        setError(sessionError.message);
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      if (!session) {
        logger.info('No session found during refresh');
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      logger.info('Session found, fetching profile data');
      
      // Fetch profile data with timeout protection
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Add timeout to profile fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
      );

      try {
        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as any;

        if (profileError) {
          if (profileError.message === 'Profile fetch timeout') {
            logger.warn('Profile fetch timed out, creating minimal user object');
            // Create minimal user object from session data
            const minimalUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: session.user.user_metadata?.first_name || '',
              lastName: session.user.user_metadata?.last_name || '',
              name: session.user.user_metadata?.name || session.user.email || '',
              company: '',
              jobTitle: '',
              industry: undefined,
              profileImage: '',
              coverImage: '',
              bio: {},
              interests: [],
              socialLinks: {},
              onboardingComplete: false, // Default to incomplete
              registrationComplete: true,
              registrationStatus: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
              twoFactorEnabled: false,
              publicProfile: {
                enabled: true,
                defaultSharedLinks: {},
                allowedFields: {
                  email: false,
                  phone: false,
                  company: true,
                  jobTitle: true,
                  bio: true,
                  interests: true,
                  location: true
                }
              }
            };
            
            setUser(minimalUser);
            setLoading(false);
            setSessionChecked(true);
            return;
          }
          
          logger.error('Profile error during refresh:', profileError);
          setError(profileError.message);
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        if (!profile) {
          logger.warn('No profile found for user');
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        // Create user object from profile
        const userData: User = {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          middleName: profile.middle_name,
          lastName: profile.last_name,
          name: `${profile.first_name} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name}`.trim(),
          company: profile.company,
          jobTitle: profile.job_title,
          industry: profile.industry,
          profileImage: profile.profile_image,
          coverImage: profile.cover_image,
          bio: profile.bio,
          interests: profile.interests,
          socialLinks: profile.social_links || {},
          onboardingComplete: profile.onboarding_complete,
          registrationComplete: profile.registration_complete,
          registrationStatus: profile.registration_status,
          registrationCompletedAt: profile.registration_completed_at ? new Date(profile.registration_completed_at) : undefined,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
          twoFactorEnabled: false,
          publicProfile: profile.public_profile || {
            enabled: true,
            defaultSharedLinks: {},
            allowedFields: {
              email: false,
              phone: false,
              company: true,
              jobTitle: true,
              bio: true,
              interests: true,
              location: true
            }
          }
        };

        setUser(userData);
        logger.info('User data updated successfully');

        // Initialize user preferences in background (non-blocking)
        initUserPreferences(userData).catch(error => {
          logger.warn('Failed to initialize user preferences:', error);
        });

      } catch (timeoutError) {
        logger.error('Profile fetch failed with timeout:', timeoutError);
        // Continue with minimal user data rather than failing completely
        const minimalUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: session.user.user_metadata?.first_name || '',
          lastName: session.user.user_metadata?.last_name || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          company: '',
          jobTitle: '',
          industry: undefined,
          profileImage: '',
          coverImage: '',
          bio: {},
          interests: [],
          socialLinks: {},
          onboardingComplete: false,
          registrationComplete: true,
          registrationStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          twoFactorEnabled: false,
          publicProfile: {
            enabled: true,
            defaultSharedLinks: {},
            allowedFields: {
              email: false,
              phone: false,
              company: true,
              jobTitle: true,
              bio: true,
              interests: true,
              location: true
            }
          }
        };
        
        setUser(minimalUser);
      }

      setLoading(false);
      setSessionChecked(true);
    } catch (error) {
      logger.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user data');
      setUser(null);
      setLoading(false);
      setSessionChecked(true);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.info('🔄 Initializing auth state...');
        
        // Always check session on mount, regardless of path
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          logger.error('Session error during initialization:', error);
          setError(error.message);
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        if (session) {
          logger.info('🔍 Session found during initialization, loading user data');
          await refreshUser(true);
        } else {
          logger.info('🔍 No session found during initialization');
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
        }
      } catch (error) {
        logger.error('Error during auth initialization:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication initialization failed');
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshUser(true); // Force refresh to ensure user data is loaded
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setError(null);
        setLoading(false);
        setSessionChecked(true);
        // Initialize user preferences with null user ID
        initUserPreferences(null).catch(error => {
          logger.error('Error clearing user preferences:', error);
        });
        
        // Only redirect to login if user was on a protected route
        if (location.pathname.startsWith('/app') && !publicPaths.some(path => location.pathname.startsWith(path))) {
          navigate('/app/login');
        }
        // For public paths, let them stay where they are
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate, refreshUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isOwner, 
      isTestingChannel,
      refreshUser,
      reconnectSupabase,
      connectionStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}