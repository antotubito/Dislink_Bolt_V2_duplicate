import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, loading, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Public paths that don't require authentication
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
    '/app/reset-password'
  ];

  useEffect(() => {
    // Check if current path is public
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
    
    if (isPublicPath) {
      // For public paths, render immediately without auth checks
      setIsCheckingSession(false);
      return;
    }

    // For protected paths, let ProtectedRoute handle authentication
    // SessionGuard only handles session management, not redirects
    const checkSession = async () => {
      if (!user || !sessionChecked) {
        setIsCheckingSession(true);
        try {
          // Just refresh user data if needed, don't handle redirects
          if (!user) {
            await refreshUser();
          }
        } catch (error) {
          logger.error('Error checking session:', error);
        } finally {
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [location.pathname, user, sessionChecked, refreshUser]);

  // Show loading state while checking auth
  if (loading && isCheckingSession) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}