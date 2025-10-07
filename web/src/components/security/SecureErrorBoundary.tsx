import React, { Component, ReactNode, ErrorInfo } from 'react';
import { captureError, captureMessage } from '@dislink/shared/lib/sentry';

interface SecureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isRetrying: boolean;
}

interface SecureErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

/**
 * Secure Error Boundary with enhanced security features:
 * - Sanitizes error messages to prevent information leakage
 * - Rate limits error reporting to prevent spam
 * - Provides secure fallback UI
 * - Logs errors securely without exposing sensitive data
 */
export class SecureErrorBoundary extends Component<SecureErrorBoundaryProps, SecureErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;
  private lastErrorTime = 0;
  private errorReportingCooldown = 30000; // 30 seconds

  constructor(props: SecureErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SecureErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      console.warn('🚨 Error reporting rate limited to prevent spam');
      return;
    }
    
    this.lastErrorTime = now;

    // Sanitize error information to prevent data leakage
    const sanitizedError = this.sanitizeError(error);
    const sanitizedErrorInfo = this.sanitizeErrorInfo(errorInfo);

    console.error('🚨 SecureErrorBoundary caught an error:', {
      message: sanitizedError.message,
      name: sanitizedError.name,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    });

    // Capture error with Sentry (sanitized)
    try {
      captureError(sanitizedError, {
        context: 'SecureErrorBoundary',
        errorId: this.state.errorId,
        retryCount: this.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        // Don't include component stack in production to prevent info leakage
        componentStack: import.meta.env.DEV ? sanitizedErrorInfo.componentStack : undefined
      });
    } catch (sentryError) {
      console.error('❌ Failed to capture error with Sentry:', sentryError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(sanitizedError, sanitizedErrorInfo);
      } catch (handlerError) {
        console.error('❌ Error in custom error handler:', handlerError);
      }
    }

    this.setState({ error: sanitizedError, errorInfo: sanitizedErrorInfo });
  }

  componentDidUpdate(prevProps: SecureErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys have changed
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  private sanitizeError(error: Error): Error {
    // Create a sanitized version of the error
    const sanitizedError = new Error('An unexpected error occurred');
    sanitizedError.name = error.name;
    
    // Only include safe error messages in production
    if (import.meta.env.DEV) {
      sanitizedError.message = error.message;
    } else {
      // In production, use generic messages to prevent information leakage
      sanitizedError.message = 'An unexpected error occurred. Please try again.';
    }
    
    return sanitizedError;
  }

  private sanitizeErrorInfo(errorInfo: ErrorInfo): ErrorInfo {
    return {
      ...errorInfo,
      // Remove sensitive information from component stack in production
      componentStack: import.meta.env.DEV 
        ? errorInfo.componentStack 
        : 'Component stack hidden for security'
    };
  }

  private resetErrorBoundary = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      isRetrying: false
    });
  };

  private handleRetry = async () => {
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Maximum retry attempts reached');
      return;
    }

    this.setState({ isRetrying: true });
    this.retryCount++;

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));

    try {
      this.resetErrorBoundary();
    } catch (error) {
      console.error('❌ Failed to reset error boundary:', error);
      this.setState({ isRetrying: false });
    }
  };

  private handleReload = () => {
    // Clear any cached data that might be causing issues
    try {
      localStorage.removeItem('error_boundary_cache');
      sessionStorage.clear();
    } catch (error) {
      console.warn('⚠️ Failed to clear storage:', error);
    }
    
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default secure fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-4">
                We're having trouble loading this part of the application. 
                This has been reported to our team.
              </p>
              {this.state.errorId && (
                <p className="text-sm text-gray-500 mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying || this.retryCount >= this.maxRetries}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors block w-full"
              >
                {this.state.isRetrying ? 'Retrying...' : 
                 this.retryCount >= this.maxRetries ? 'Max Retries Reached' : 
                 `Try Again (${this.retryCount}/${this.maxRetries})`}
              </button>
              
              <button
                onClick={this.handleReload}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors block w-full"
              >
                Reload Page
              </button>
            </div>

            {/* Development-only error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SecureErrorBoundary;
