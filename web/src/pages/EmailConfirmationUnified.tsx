import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { handleEmailConfirmation } from '@dislink/shared/lib/authFlow';
import { completeQRConnection } from '@dislink/shared/lib/qrEnhanced';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already-verified';

export function EmailConfirmationUnified() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Get email from URL params or localStorage
  const emailFromUrl = searchParams.get('email');
  const emailFromStorage = localStorage.getItem('confirmEmail');
  const currentEmail = emailFromUrl || emailFromStorage;

  useEffect(() => {
    if (currentEmail) {
      setUserEmail(currentEmail);
    }
  }, [currentEmail]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
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
                await completeQRConnection(result.user.id);
                logger.info('QR connection completion processed');
              } catch (qrError) {
                logger.error('Error completing QR connection:', qrError);
                // Don't fail the verification process for QR connection errors
              }
            }

            // Wait a moment for session to be properly established
            await new Promise(resolve => setTimeout(resolve, 1000));

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
        }
      } catch (err) {
        logger.error('Email verification error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!userEmail || cooldownTime > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmed`
        }
      });

      if (error) {
        logger.error('Failed to resend confirmation email:', error);
        setError('Failed to resend confirmation email. Please try again.');
      } else {
        logger.info('Confirmation email resent successfully');
        setError(null);
        setCooldownTime(60); // 60 second cooldown
      }
    } catch (err) {
      logger.error('Error resending confirmation email:', err);
      setError('An unexpected error occurred while resending the email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/app/login');
  };

  const handleGoToRegister = () => {
    navigate('/app/register');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we confirm your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email confirmed successfully!</h2>
            <p className="text-gray-600 mb-4">Your email has been verified. Redirecting you to complete your profile...</p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        );

      case 'already-verified':
        return (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email already confirmed!</h2>
            <p className="text-gray-600 mb-6">Your email has already been verified. You can now log in to your account.</p>
            <button
              onClick={handleGoToLogin}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmation link expired</h2>
            <p className="text-gray-600 mb-6">
              This confirmation link has expired or is invalid. Don't worry - you can request a new one.
            </p>
            {userEmail && (
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={cooldownTime > 0 || isResending}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldownTime > 0 ? (
                    `Resend in ${cooldownTime}s`
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500">
                  We'll send a new confirmation email to <strong>{userEmail}</strong>
                </p>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleGoToLogin}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Try logging in
                </button>
                <button
                  onClick={handleGoToRegister}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Create new account
                </button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-600 mb-6">
              {error || 'There was a problem verifying your email. Please try again.'}
            </p>
            {userEmail && (
              <div className="space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={cooldownTime > 0 || isResending}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldownTime > 0 ? (
                    `Resend in ${cooldownTime}s`
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </button>
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleGoToLogin}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Try logging in
                </button>
                <button
                  onClick={handleGoToRegister}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Create new account
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
