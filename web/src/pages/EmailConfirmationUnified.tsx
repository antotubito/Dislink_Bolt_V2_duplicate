import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, ArrowRight, Check, Lock, AlertCircle, Home, Timer, RefreshCw,
  CheckCircle, XCircle, Clock, Loader
} from 'lucide-react';
import { handleEmailConfirmation } from '@dislink/shared/lib/authFlow';
import { logger } from '@dislink/shared/lib/logger';

type VerificationStatus = 'loading' | 'success' | 'error' | 'already-verified' | 'expired';

interface EmailConfirmationUnifiedProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export function EmailConfirmationUnified({ onSuccess, onError }: EmailConfirmationUnifiedProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setStatus('loading');
        setError(null);

        // Get current URL for verification
        const currentUrl = window.location.href;
        logger.info('🔐 Starting email verification with URL:', currentUrl);

        // Use the enhanced email confirmation handler
        const result = await handleEmailConfirmation(currentUrl);

        if (result.success) {
          if (result.alreadyVerified) {
            setStatus('already-verified');
            logger.info('✅ User already verified');
          } else {
            setStatus('success');
            logger.info('✅ Email verification successful');

            // Handle QR connection completion if user just registered
            if (result.user) {
              try {
                // TODO: Implement QR connection completion when available
                logger.info('QR connection completion would be processed here');
              } catch (qrError) {
                logger.error('Error completing QR connection:', qrError);
                // Don't fail the verification process for QR connection errors
              }
            }

            // Wait a moment for session to be properly established
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call success callback if provided
            onSuccess?.(result.user);

            // Redirect to onboarding or home
            if (result.requiresOnboarding) {
              navigate('/app/onboarding');
            } else {
              navigate('/app');
            }
          }
        } else {
          // Handle different error types
          if (result.error?.includes('expired') || result.error?.includes('invalid')) {
            setStatus('expired');
            setError('This confirmation link has expired or is invalid. Please request a new confirmation email.');
          } else {
            setStatus('error');
            setError(result.error || 'Email confirmation failed. Please try again.');
          }
          onError?.(result.error || 'Email confirmation failed');
        }
      } catch (err) {
        logger.error('Email verification error:', err);
        setStatus('error');
        setError('An unexpected error occurred. Please try again.');
        onError?.('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [navigate, onSuccess, onError]);

  const handleResendEmail = async () => {
    if (cooldownTime > 0) return;

    setResendingEmail(true);
    setResendSuccess(false);

    try {
      const email = searchParams.get('email') || localStorage.getItem('confirmEmail');
      
      if (!email) {
        setError('Email address not found. Please try registering again.');
        return;
      }

      // TODO: Implement resend email functionality
      // This would typically call a resend email API endpoint
      
      setResendSuccess(true);
      setCooldownTime(60); // 60 second cooldown
      
      logger.info('Resend email requested for:', email);
    } catch (err) {
      logger.error('Error resending email:', err);
      setError('Failed to resend email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToLogin = () => {
    navigate('/app/login');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'already-verified':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'expired':
        return <Clock className="w-16 h-16 text-orange-500" />;
      default:
        return <Mail className="w-16 h-16 text-blue-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        return 'Email verified successfully!';
      case 'error':
        return 'Verification failed';
      case 'already-verified':
        return 'Email already verified';
      case 'expired':
        return 'Verification link expired';
      default:
        return 'Email verification';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we verify your email address.';
      case 'success':
        return 'Your email has been successfully verified. You can now access your account.';
      case 'error':
        return error || 'There was an error verifying your email. Please try again.';
      case 'already-verified':
        return 'Your email has already been verified. You can now log in to your account.';
      case 'expired':
        return 'This verification link has expired. Please request a new confirmation email.';
      default:
        return 'Processing your email verification...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="card-captamundi-strong w-full max-w-md text-center"
      >
        {/* Status Icon */}
        <div className="mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-4">
          {getStatusTitle()}
        </h1>

        {/* Status Message */}
        <p className="font-body text-gray-600 mb-6">
          {getStatusMessage()}
        </p>

        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && debugInfo && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate('/app')}
              className="btn-captamundi-primary w-full flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Dashboard
            </motion.button>
          )}

          {status === 'already-verified' && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleGoToLogin}
              className="btn-captamundi-primary w-full flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Login
            </motion.button>
          )}

          {(status === 'error' || status === 'expired') && (
            <>
              <button
                onClick={handleResendEmail}
                disabled={resendingEmail || cooldownTime > 0}
                className="btn-captamundi-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingEmail ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend Email'}
              </button>

              {resendSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <p className="text-green-800 text-sm">
                    <Check className="w-4 h-4 inline mr-1" />
                    New verification email sent!
                  </p>
                </motion.div>
              )}
            </>
          )}

          {/* Always show home button */}
          <button
            onClick={handleGoHome}
            className="btn-captamundi-secondary w-full flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Additional Help */}
        {status === 'error' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team or try registering again.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}