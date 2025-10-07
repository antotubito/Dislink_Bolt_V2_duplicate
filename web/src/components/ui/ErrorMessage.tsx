import React from 'react';
import { AlertCircle, Wifi, Database, User, Mail, Lock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ErrorMessageProps {
  error: string | Error | null;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  className?: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorMessage({
  error,
  type = 'error',
  showIcon = true,
  className = '',
  onRetry,
  retryText = 'Try Again'
}: ErrorMessageProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;
  
  // Categorize error types for better UX
  const getErrorCategory = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return 'network';
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sql') || lowerMessage.includes('constraint')) {
      return 'database';
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('login') || lowerMessage.includes('session')) {
      return 'auth';
    }
    if (lowerMessage.includes('email') || lowerMessage.includes('invalid email')) {
      return 'email';
    }
    if (lowerMessage.includes('password') || lowerMessage.includes('weak password')) {
      return 'password';
    }
    if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
      return 'duplicate';
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('slow')) {
      return 'timeout';
    }
    
    return 'generic';
  };

  const getErrorIcon = (category: string) => {
    switch (category) {
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'auth':
        return <User className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'password':
        return <Lock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorStyles = (category: string) => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg border';
    
    switch (category) {
      case 'network':
        return `${baseStyles} bg-orange-50 border-orange-200 text-orange-800`;
      case 'database':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'auth':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      case 'email':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'password':
        return `${baseStyles} bg-purple-50 border-purple-200 text-purple-800`;
      case 'duplicate':
        return `${baseStyles} bg-amber-50 border-amber-200 text-amber-800`;
      case 'timeout':
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
      default:
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
    }
  };

  const getErrorTitle = (category: string) => {
    switch (category) {
      case 'network':
        return 'Connection Issue';
      case 'database':
        return 'Database Error';
      case 'auth':
        return 'Authentication Error';
      case 'email':
        return 'Email Issue';
      case 'password':
        return 'Password Issue';
      case 'duplicate':
        return 'Account Already Exists';
      case 'timeout':
        return 'Request Timeout';
      default:
        return 'Error';
    }
  };

  const getErrorSuggestion = (category: string) => {
    switch (category) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'database':
        return 'There was an issue with our database. Please try again in a moment.';
      case 'auth':
        return 'Please sign in again or contact support if the issue persists.';
      case 'email':
        return 'Please check your email address and try again.';
      case 'password':
        return 'Please check your password requirements and try again.';
      case 'duplicate':
        return 'An account with this information already exists. Try signing in instead.';
      case 'timeout':
        return 'The request is taking longer than expected. Please try again.';
      default:
        return 'Please try again or contact support if the issue persists.';
    }
  };

  const category = getErrorCategory(errorMessage);
  const styles = getErrorStyles(category);
  const title = getErrorTitle(category);
  const suggestion = getErrorSuggestion(category);
  const icon = getErrorIcon(category);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${styles} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm mb-1">
          {title}
        </h4>
        <p className="text-sm mb-2">
          {errorMessage}
        </p>
        <p className="text-xs opacity-75">
          {suggestion}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline focus:outline-none focus:underline"
            aria-label={`${retryText} - ${title}`}
          >
            <RefreshCw className="w-3 h-3" />
            {retryText}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Specialized error components for common scenarios
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      error="Unable to connect to our servers. Please check your internet connection."
      type="error"
      onRetry={onRetry}
      retryText="Retry Connection"
    />
  );
}

export function AuthError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      error="Your session has expired. Please sign in again."
      type="error"
      onRetry={onRetry}
      retryText="Sign In Again"
    />
  );
}

export function DatabaseError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      error="There was an issue saving your data. Please try again."
      type="error"
      onRetry={onRetry}
      retryText="Try Again"
    />
  );
}

export function ValidationError({ errors }: { errors: string[] }) {
  return (
    <div className="space-y-2">
      {errors.map((error, index) => (
        <ErrorMessage
          key={index}
          error={error}
          type="warning"
          className="text-sm"
        />
      ))}
    </div>
  );
}
