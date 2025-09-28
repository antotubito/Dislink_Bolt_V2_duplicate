import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase, waitForSupabaseReady } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/waitlist',
    '/story',
    '/app/login',
    '/app/register',
    '/app/reset-password',
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
    '/demo'
  ];

  // Initialize Supabase and check session
  useEffect(() => {
    const initializeAndCheckSession = async () => {
      try {
        const isPublicPath = publicPaths.some(path =>
          location.pathname === path || location.pathname.startsWith(`${path}/`)
        );

        // For public paths, skip Supabase initialization entirely
        if (isPublicPath) {
          logger.info('🔐 SessionGuard: Public path detected, skipping Supabase initialization');
          setIsInitializing(false);
          setSupabaseReady(true);
          return;
        }

        logger.info('🔐 SessionGuard: Initializing Supabase...');

        // Wait for Supabase to be fully ready
        await waitForSupabaseReady();
        setSupabaseReady(true);

        logger.info('🔐 SessionGuard: Supabase ready, checking session...');

        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('🔐 SessionGuard: Session error:', error);
          if (error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('refresh_token_not_found')) {
            await supabase.auth.signOut();
            // Store the attempted URL for redirect after login
            if (location.pathname.startsWith('/app')) {
              localStorage.setItem('redirectUrl', location.pathname);
            }
            navigate('/app/login');
            return;
          }
          throw error;
        }

        if (!session) {
          logger.info('🔐 SessionGuard: No session found, checking if redirect needed');
          // Store the attempted URL for redirect after login
          if (location.pathname.startsWith('/app') &&
            !location.pathname.startsWith('/app/login') &&
            !location.pathname.startsWith('/app/register') &&
            !location.pathname.startsWith('/app/reset-password')) {
            localStorage.setItem('redirectUrl', location.pathname);
            navigate('/app/login');
          }
          // Don't redirect to home for public paths - this was causing the infinite loop
          // If on login/register/reset-password, don't redirect - let them stay
        } else if (!user) {
          logger.info('🔐 SessionGuard: Session found but no user data, refreshing user');
          // We have a session but no user data, refresh the user
          await refreshUser();
        } else if (user && !user.onboardingComplete && !location.pathname.startsWith('/app/onboarding')) {
          logger.info('🔐 SessionGuard: User needs onboarding, redirecting');
          // Only check onboarding if user is authenticated
          navigate('/app/onboarding');
        } else {
          logger.info('🔐 SessionGuard: User authenticated and ready');
        }
      } catch (error) {
        logger.error('🔐 SessionGuard: Error during initialization:', error);
        // Only redirect to login if not already on auth pages
        if (!location.pathname.startsWith('/app/login') &&
          !location.pathname.startsWith('/app/register') &&
          !location.pathname.startsWith('/app/reset-password')) {
          navigate('/app/login');
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAndCheckSession();
  }, [location.pathname]); // Only depend on location.pathname to prevent infinite loops

  // Check if current path is public
  const isPublicPath = publicPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  // Show loading state only for protected paths while initializing
  if (!isPublicPath && (isInitializing || !supabaseReady)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}