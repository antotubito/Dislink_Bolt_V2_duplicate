import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../../types/user';
import { supabase, isConnectionHealthy } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { initUserPreferences } from '../../lib/userPreferences';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  isTestingChannel: boolean;
  refreshUser: () => Promise<void>;
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
      const reconnected = await isConnectionHealthy();
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

  const refreshUser = async () => {
    try {
      // Skip auth check for public paths
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
      if (isPublicPath) {
        console.log('🎯 Public path in refreshUser, skipping auth check');
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      logger.info('Refreshing user data');
      
      // Check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        const handled = await handleAuthError(sessionError);
        if (handled) return;
        throw sessionError;
      }
      
      if (!session) {
        logger.debug('No active session');
        setUser(null);
        setLoading(false);
        // Initialize user preferences with null user ID
        await initUserPreferences(null);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        // Check if it's a connection error
        if (profileError.message?.includes('Failed to fetch')) {
          setConnectionStatus('disconnected');
          setError('Connection to Supabase lost. Please check your internet connection.');
          setLoading(false);
          return;
        }
        
        logger.error('Profile error:', profileError);
        throw profileError;
      }

      if (!profile) {
        setUser(null);
        setLoading(false);
        // Initialize user preferences with null user ID
        await initUserPreferences(null);
        return;
      }

      // Set user data
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
      setError(null);
      setConnectionStatus('connected');
      
      // Initialize user preferences with user ID
      await initUserPreferences(profile.id);

      // Handle routing based on registration status
      if (profile.registration_status === 'pending' && !location.pathname.startsWith('/app/register')) {
        navigate('/app/register');
        return;
      }

      if (!profile.onboarding_complete && !location.pathname.startsWith('/app/onboarding')) {
        navigate('/app/onboarding');
        return;
      }

      // Only redirect to app if user is on login/register pages after successful auth
      if (location.pathname === '/app/login' || location.pathname === '/app/register') {
        navigate('/app');
        return;
      }
    } catch (error) {
      const handled = await handleAuthError(error);
      if (!handled) {
        logger.error('Error getting current user:', error);
        setUser(null);
        setError('Failed to load user data');
      }
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Check if current path is public
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
      
      if (isPublicPath) {
        // For public paths, skip auth check entirely and render immediately
        logger.info('🎯 Public path detected in AuthProvider, skipping auth check');
        if (isMounted) {
          setLoading(false);
          setSessionChecked(true);
        }
        return;
      }
      
      // Only check auth for protected paths
      logger.info('🎯 Protected path detected in AuthProvider, checking auth');
      
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('Session initialization error:', sessionError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (!session) {
          logger.info('No session found during initialization');
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        // Session exists, get user profile
        logger.info('Session found, fetching user profile');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          logger.error('Profile fetch error during initialization:', profileError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (profile && isMounted) {
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
          setError(null);
          setConnectionStatus('connected');
          
          // Initialize user preferences
          await initUserPreferences(profile.id);
          
          logger.info('✅ User initialized successfully');
        }
      } catch (error) {
        logger.error('Critical error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setError('Failed to initialize authentication');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN') {
        // User just signed in - refresh user data and handle redirect
        logger.info('🔐 User signed in, refreshing user data');
        
        if (session?.user) {
          try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!profileError && profile) {
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
              setError(null);
              setConnectionStatus('connected');
              
              // Initialize user preferences
              await initUserPreferences(profile.id);
              
              logger.info('✅ User data refreshed after sign in');
              
              // Handle post-login redirect only if currently on login page
              if (location.pathname === '/app/login') {
                const redirectUrl = localStorage.getItem('redirectUrl');
                if (redirectUrl) {
                  localStorage.removeItem('redirectUrl');
                  logger.info('🔄 Redirecting to stored URL:', redirectUrl);
                  navigate(redirectUrl);
                } else if (!profile.onboarding_complete) {
                  logger.info('🔄 Redirecting to onboarding');
                  navigate('/app/onboarding');
                } else {
                  logger.info('🔄 Redirecting to app home');
                  navigate('/app');
                }
              }
            }
          } catch (error) {
            logger.error('Error refreshing user after sign in:', error);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed - just log it, don't redirect
        logger.info('🔐 Token refreshed');
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        logger.info('🔐 User signed out');
        setUser(null);
        setError(null);
        // Initialize user preferences with null user ID
        await initUserPreferences(null);
        
        // Only redirect if not already on a public path
        const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
        if (!isPublicPath) {
          navigate('/app/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: loading && !sessionChecked, 
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