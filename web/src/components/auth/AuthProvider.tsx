import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '@dislink/shared/types';
import { supabase, isConnectionHealthy, initializeConnection } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { initUserPreferences } from "@dislink/shared/lib/userPreferences";
import { setupAuthStateListener } from '@dislink/shared/lib/authFlow';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner] = useState(false);
  const [isTestingChannel] = useState(false);
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

      // Set loading state to prevent race conditions
      setLoading(true);

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

      // Handle routing based on registration status - BUT only for protected routes
      const isOnPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

      if (!isOnPublicPath) {
        // Only enforce these redirects on protected routes
        if (profile.registration_status === 'pending' && !location.pathname.startsWith('/app/register')) {
          navigate('/app/register');
          return;
        }

        if (!profile.onboarding_complete && !location.pathname.startsWith('/app/onboarding')) {
          navigate('/app/onboarding');
          return;
        }
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
    // Skip auth check for public paths - let the auth state listener handle everything
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

    if (isPublicPath) {
      logger.info('🎯 Public path detected, auth state listener will handle session restoration');
      setLoading(false);
      setSessionChecked(true);
    } else {
      logger.info('🎯 Protected path detected, auth state listener will check session');
      // Auth state listener will handle session initialization and loading state
    }
  }, [location.pathname]);

  // Subscribe to auth state changes - Enhanced version with loop prevention
  useEffect(() => {
    let isMounted = true;
    let authStateChangeCount = 0;
    const maxAuthStateChanges = 5; // Prevent infinite loops
    const authStateChangeWindow = 10000; // 10 seconds
    let lastAuthStateChange = 0;

    // Initialize Supabase connection first
    const initializeAuth = async () => {
      try {
        logger.info('🔐 Initializing Supabase connection...');

        // Initialize Supabase connection
        await initializeConnection();

        logger.info('🔐 Supabase connection initialized, setting up auth listener...');

        // Check if user explicitly wants to stay logged in
        const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';

        if (!stayLoggedIn) {
          logger.info('🔐 User not opted to stay logged in, clearing session');
          await supabase.auth.signOut();
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Session initialization error:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (session?.user) {
          logger.info('✅ Session found on app load, restoring user');

          // Get user profile for complete user data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileError && profile && isMounted) {
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
            await initUserPreferences(profile.id);

            logger.info('✅ User session restored successfully');
          }
        } else {
          logger.info('No session found on app load');
          if (isMounted) {
            setUser(null);
          }
        }

        if (isMounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      } catch (error) {
        logger.error('Critical error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    // Initialize auth on mount
    initializeAuth();

    // Listen for auth state changes with loop prevention
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      const now = Date.now();

      // Reset counter if enough time has passed
      if (now - lastAuthStateChange > authStateChangeWindow) {
        authStateChangeCount = 0;
      }

      // Prevent auth state loops
      if (authStateChangeCount >= maxAuthStateChanges) {
        logger.warn('🔐 Too many auth state changes detected, preventing loop');
        return;
      }

      authStateChangeCount++;
      lastAuthStateChange = now;

      logger.info(`🔐 Auth state changed: ${event}, ${session ? 'Session exists' : 'No session'} (${authStateChangeCount}/${maxAuthStateChanges})`);

      // Add timeout to prevent infinite loading
      const authTimeout = setTimeout(() => {
        if (loading) {
          logger.warn('🔍 AUTH TIMEOUT: Auth state change taking too long, forcing loading to false');
          setLoading(false);
        }
      }, 15000); // 15 second timeout

      if (session?.user) {
        // User signed in or session restored
        logger.info('✅ User authenticated, updating state...');

        try {
          // Get user profile for complete user data
          logger.info('🔍 Fetching profile for user:', session.user.id);

          // Add timeout for profile query
          const profileQueryPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile query timeout')), 60000)
          );

          const { data: profile, error: profileError } = await Promise.race([
            profileQueryPromise,
            timeoutPromise
          ]) as any;

          logger.info('🔍 Profile query result:', {
            hasProfile: !!profile,
            hasError: !!profileError,
            errorMessage: profileError?.message,
            profileId: profile?.id
          });

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
            setLoading(false);
            clearTimeout(authTimeout);
            await initUserPreferences(profile.id);

            // Handle navigation for sign-in events
            if (event === 'SIGNED_IN') {
              // Only redirect if on login page
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
          } else {
            logger.error('Failed to fetch profile after auth state change:', profileError);

            // If profile doesn't exist, create a minimal user object from session data
            if (profileError?.code === 'PGRST116' || profileError?.message?.includes('No rows found')) {
              logger.info('🔍 Profile not found, creating minimal user from session data');
              const minimalUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                firstName: '',
                lastName: '',
                name: '',
                company: '',
                jobTitle: '',
                industry: undefined,
                profileImage: undefined,
                coverImage: undefined,
                bio: {},
                interests: [],
                socialLinks: {},
                onboardingComplete: false,
                registrationComplete: false,
                registrationStatus: 'pending',
                createdAt: new Date(session.user.created_at),
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
              setError(null);
              setConnectionStatus('connected');
              setLoading(false);
              clearTimeout(authTimeout);
              await initUserPreferences(minimalUser.id);

              // Handle navigation for sign-in events
              if (event === 'SIGNED_IN') {
                if (location.pathname === '/app/login') {
                  logger.info('🔄 Redirecting to onboarding (no profile found)');
                  navigate('/app/onboarding');
                }
              }
            } else {
              // Other profile errors
              setUser(null);
              setError('Failed to load user profile');
              clearTimeout(authTimeout);
              setLoading(false);
            }
          }
        } catch (error) {
          logger.error('Error processing auth state change:', error);

          // If it's a profile query timeout, create minimal user
          if (error instanceof Error && error.message === 'Profile query timeout') {
            logger.info('🔍 Profile query timed out, creating minimal user from session data');
            const minimalUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              firstName: '',
              lastName: '',
              name: '',
              company: '',
              jobTitle: '',
              industry: undefined,
              profileImage: undefined,
              coverImage: undefined,
              bio: {},
              interests: [],
              socialLinks: {},
              onboardingComplete: false,
              registrationComplete: false,
              registrationStatus: 'pending',
              createdAt: new Date(session.user.created_at),
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
            setError(null);
            setConnectionStatus('connected');
            setLoading(false);
            clearTimeout(authTimeout);
            await initUserPreferences(minimalUser.id);

            // Handle navigation for sign-in events
            if (event === 'SIGNED_IN') {
              if (location.pathname === '/app/login') {
                logger.info('🔄 Redirecting to onboarding (profile query timeout)');
                navigate('/app/onboarding');
              }
            }
          } else {
            // Other errors
            setUser(null);
            setError('Failed to process authentication');
            clearTimeout(authTimeout);
            setLoading(false);
          }
        }
      } else {
        // User signed out or no session
        logger.info('🔐 User signed out, clearing state...');
        setUser(null);
        setError(null);
        setLoading(false);
        clearTimeout(authTimeout);
        await initUserPreferences(null);

        // Only redirect to login if not already on a public path
        const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
        if (!isPublicPath && event === 'SIGNED_OUT') {
          logger.info('🔄 Redirecting to login after sign out');
          navigate('/app/login');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove location.pathname dependency to prevent infinite loops

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