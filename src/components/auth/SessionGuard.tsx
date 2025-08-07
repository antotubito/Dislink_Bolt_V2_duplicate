import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

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

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  // For public paths, render immediately without loading states
  if (isPublicPath) {
    return <>{children}</>;
  }

  // For protected paths, show loading until auth is determined
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Let ProtectedRoute handle auth logic for protected paths
  return <>{children}</>;
}