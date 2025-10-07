import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { logger } from '@dislink/shared/lib/logger';
import { shouldRedirectToOnboarding } from '@dislink/shared/lib/authFlow';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while AuthProvider is initializing
  if (loading) {
    logger.info('🔐 ProtectedRoute: AuthProvider loading, showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-900/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login with current path stored
  if (!user) {
    logger.info('🔐 ProtectedRoute: No user found, redirecting to login');

    // Store the current path for redirect after login (only for app routes)
    if (location.pathname.startsWith('/app') && location.pathname !== '/app/login') {
      localStorage.setItem('redirectUrl', location.pathname);
    }

    return <Navigate to="/app/login" replace />;
  }

  // If user is logged in but onboarding not complete, redirect to onboarding
  if (shouldRedirectToOnboarding(user, location.pathname)) {
    logger.info('🔐 ProtectedRoute: User needs onboarding, redirecting');
    return <Navigate to="/app/onboarding" replace />;
  }

  // User is authenticated and has completed onboarding (or is on onboarding page)
  logger.info('🔐 ProtectedRoute: User authenticated, rendering protected content');
  return <>{children}</>;
}
