import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being determined
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    // Store the current path to redirect back after login
    if (location.pathname !== '/app/login') {
      localStorage.setItem('redirectUrl', location.pathname);
    }
    return <Navigate to="/app/login" replace />;
  }

  // Special handling for onboarding page
  const isOnboardingPage = location.pathname === '/app/onboarding';
  
  // If user is on onboarding page and already completed onboarding, redirect to app
  if (isOnboardingPage && user.onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  // If user hasn't completed onboarding and is NOT on onboarding page, redirect to onboarding
  if (!user.onboardingComplete && !isOnboardingPage) {
    return <Navigate to="/app/onboarding" replace />;
  }

  // User is authenticated and on the correct page
  return <>{children}</>;
}
