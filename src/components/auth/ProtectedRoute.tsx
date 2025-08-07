import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

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
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
      logger.info('🔐 ProtectedRoute: Auth state changed:', event);
      if (isMounted) {
        setHasValidSession(!!session);
        setSessionChecking(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  // Show loading while checking session or while AuthProvider is loading
  if (loading || sessionChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If no valid session, redirect to login with current path stored
  if (!hasValidSession && !user) {
    logger.info('🔐 ProtectedRoute: No valid session, redirecting to login');
    
    // Store the current path for redirect after login (only for app routes)
    if (location.pathname.startsWith('/app') && location.pathname !== '/app/login') {
      localStorage.setItem('redirectUrl', location.pathname);
    }
    
    return <Navigate to="/app/login" replace />;
  }

  // If user is logged in but onboarding not complete, redirect to onboarding
  if (user && !user.onboardingComplete && location.pathname !== '/app/onboarding') {
    logger.info('🔐 ProtectedRoute: User needs onboarding, redirecting');
    return <Navigate to="/app/onboarding" replace />;
  }

  // User is authenticated and has completed onboarding (or is on onboarding page)
  return <>{children}</>;
}
