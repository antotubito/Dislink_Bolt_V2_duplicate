import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session && !user) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, [user, refreshUser]);

  if (loading || checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  const isAuthenticated = !!user || !!session;

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace />;
  }

  // Special handling for onboarding page
  const isOnboardingPage = location.pathname === '/app/onboarding';
  
  // If user is on onboarding page and already completed onboarding, redirect to app
  if (isOnboardingPage && user?.onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  // If user hasn't completed onboarding and is NOT on onboarding page, redirect to onboarding
  if (user && !user.onboardingComplete && !isOnboardingPage) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <>{children}</>;
}
