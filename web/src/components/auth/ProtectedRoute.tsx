import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase, getSafeSession, waitForSupabaseReady } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { shouldRedirectToOnboarding } from '../../lib/authFlow';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        logger.info('🔐 ProtectedRoute: Checking session for:', location.pathname);

        // If AuthProvider is still loading, wait for it
        if (loading) {
          logger.info('🔐 ProtectedRoute: AuthProvider still loading, waiting...');
          return;
        }

        // If we have a user from AuthProvider, trust it
        if (user) {
          logger.info('🔐 ProtectedRoute: User found in AuthProvider');
          if (isMounted) {
            setHasValidSession(true);
            setSessionChecking(false);
          }
          return;
        }

        // Only do direct session check if AuthProvider doesn't have user
        await waitForSupabaseReady();
        const { data: { session }, error } = await getSafeSession();

        if (error) {
          logger.error('ProtectedRoute: Session check error:', error);
          if (isMounted) {
            setHasValidSession(false);
            setSessionChecking(false);
          }
          return;
        }

        if (isMounted) {
          setHasValidSession(!!session);
          setSessionChecking(false);
          logger.info('🔐 ProtectedRoute: Session check complete. Valid session:', !!session);
        }
      } catch (error) {
        logger.error('ProtectedRoute: Critical session check error:', error);
        if (isMounted) {
          setHasValidSession(false);
          setSessionChecking(false);
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        logger.info('🔐 ProtectedRoute: Auth state changed:', event);
        setHasValidSession(!!session);
        if (event === 'SIGNED_OUT') {
          setSessionChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user, loading, location.pathname]);

  // Show loading while checking session or while AuthProvider is loading
  if (loading || sessionChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-900/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If no valid session and no user, redirect to login with current path stored
  if (!hasValidSession && !user) {
    logger.info('🔐 ProtectedRoute: No valid session, redirecting to login');

    // Store the current path for redirect after login (only for app routes)
    if (location.pathname.startsWith('/app') && location.pathname !== '/app/login') {
      localStorage.setItem('redirectUrl', location.pathname);
    }

    return <Navigate to="/app/login" replace />;
  }

  // If user is logged in but onboarding not complete, redirect to onboarding
  if (user && hasValidSession && shouldRedirectToOnboarding(user, location.pathname)) {
    logger.info('🔐 ProtectedRoute: User needs onboarding, redirecting');
    return <Navigate to="/app/onboarding" replace />;
  }

  // User is authenticated and has completed onboarding (or is on onboarding page)
  return <>{children}</>;
}
