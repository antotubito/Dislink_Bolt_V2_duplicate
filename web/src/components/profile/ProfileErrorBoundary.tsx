import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, User } from 'lucide-react';
import { captureError } from '@dislink/shared/lib/sentry';
import { logger } from '@dislink/shared/lib/logger';
import type { User } from '../../types/user';

interface ProfileErrorBoundaryProps {
  children: ReactNode;
  user?: User | null;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ProfileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

export class ProfileErrorBoundary extends Component<ProfileErrorBoundaryProps, ProfileErrorBoundaryState> {
  private lastErrorTime = 0;
  private errorReportingCooldown = 5000; // 5 seconds

  constructor(props: ProfileErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ProfileErrorBoundaryState> {
    const errorId = `profile-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    
    // Rate limit error reporting to prevent spam
    if (now - this.lastErrorTime < this.errorReportingCooldown) {
      logger.warn('🚨 Profile error reporting rate limited to prevent spam');
      return;
    }
    
    this.lastErrorTime = now;

    // Enhanced error context for profile-specific debugging
    const errorContext = {
      context: 'ProfileErrorBoundary',
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.user?.id || 'unknown',
      userEmail: this.props.user?.email || 'unknown',
      hasUserData: !!this.props.user,
      userDataKeys: this.props.user ? Object.keys(this.props.user) : [],
      componentStack: import.meta.env.DEV ? errorInfo.componentStack : undefined,
      // Profile-specific context
      profileData: {
        hasProfileImage: !!this.props.user?.profileImage,
        hasCoverImage: !!this.props.user?.coverImage,
        hasBio: !!this.props.user?.bio,
        hasInterests: !!this.props.user?.interests?.length,
        hasSocialLinks: !!this.props.user?.socialLinks && Object.keys(this.props.user.socialLinks).length > 0,
        onboardingComplete: this.props.user?.onboardingComplete,
        registrationComplete: this.props.user?.registrationComplete
      }
    };

    logger.error('🚨 ProfileErrorBoundary caught an error:', {
      message: error.message,
      name: error.name,
      errorId: this.state.errorId,
      userId: this.props.user?.id,
      timestamp: new Date().toISOString()
    });

    // Capture error with enhanced context
    try {
      captureError(error, errorContext);
    } catch (sentryError) {
      logger.error('❌ Failed to capture profile error with Sentry:', sentryError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('❌ Error in custom profile error handler:', handlerError);
      }
    }
  }

  componentDidUpdate(prevProps: ProfileErrorBoundaryProps) {
    // Reset error state when user changes (e.g., after login/logout)
    if (prevProps.user?.id !== this.props.user?.id) {
      this.setState({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: 0
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default profile error fallback
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Profile Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We encountered an unexpected error while loading your profile.
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                  {this.props.user?.id && (
                    <p><strong>User ID:</strong> {this.props.user.id}</p>
                  )}
                </div>

                {this.state.retryCount > 0 && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                    <p>Retry attempt: {this.state.retryCount}</p>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </button>
                </div>

                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      Technical Details (Development Only)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded-md text-xs font-mono text-gray-800 overflow-auto">
                      <p><strong>Error:</strong> {this.state.error.message}</p>
                      <p><strong>Stack:</strong></p>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  </details>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the Error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
