import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { logger } from '@dislink/shared/lib/logger';

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { loading } = useAuth();
  const location = useLocation();

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

  // Check if current path is public
  const isPublicPath = publicPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  // For public paths, render immediately
  if (isPublicPath) {
    logger.info('🔐 SessionGuard: Public path detected, rendering immediately');
    return <>{children}</>;
  }

  // For protected paths, show loading while AuthProvider initializes
  if (loading) {
    logger.info('🔐 SessionGuard: Protected path detected, waiting for AuthProvider');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // AuthProvider has finished loading, render children
  return <>{children}</>;
}