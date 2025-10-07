import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Home, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { completeQRConnection } from '@dislink/shared/lib/qrConnectionHandler';
import { verifyEmail } from '@dislink/shared/lib/authUtils';

export function Confirmed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [buttonLoading, setButtonLoading] = useState(false);

  // Enhanced email verification with PKCE support and retry logic
  useEffect(() => {
    const verifyEmail = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (loading && retryCount < 1) { // Reduced to 1 retry only
          logger.warn('Email verification timeout, attempting retry');
          setRetryCount(prev => prev + 1);
          // Don't call verifyEmail() recursively - let the effect handle retry
        } else if (loading) {
          logger.error('Email verification timeout after retries');
          setError('Email verification is taking too long. Please try again or contact support.');
          setVerificationStatus('error');
          setLoading(false);
        }
      }, 20000); // Reduced to 20 second timeout per attempt

      try {
        setVerificationStatus('verifying');

        // Check for error parameters first
        const urlError = searchParams.get('error');
        const urlErrorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (urlError || urlErrorCode) {
          logger.error('Email confirmation error from URL:', { urlError, urlErrorCode, errorDescription });
          setErrorCode(urlErrorCode);

          if (urlErrorCode === 'otp_expired' || errorDescription?.includes('expired')) {
            setError('The email confirmation link has expired. Please request a new one.');
          } else if (urlError === 'access_denied') {
            setError('Email confirmation was denied or cancelled. Please try again.');
          } else {
            setError(errorDescription || urlError || 'Email confirmation failed. Please try again.');
          }
          setVerificationStatus('error');
          setLoading(false);
          return;
        }

        // Use shared email confirmation handler
        logger.info('🔐 Starting email confirmation with shared handler');
        console.log('🔍 EMAIL VERIFICATION: Using shared verification with URL:', window.location.href);
        console.log('🔍 EMAIL VERIFICATION: URL parameters:', {
          code: searchParams.get('code') ? searchParams.get('code')?.substring(0, 10) + '...' : null,
          token_hash: searchParams.get('token_hash') ? searchParams.get('token_hash')?.substring(0, 10) + '...' : null,
          type: searchParams.get('type'),
          email: searchParams.get('email'),
          error: searchParams.get('error'),
          error_code: searchParams.get('error_code')
        });

        // First, check if user is already authenticated (email confirmation might have already succeeded)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔍 EMAIL VERIFICATION: User already authenticated, checking onboarding status');
          
          // Check if user needs onboarding
          try {
            const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
            const profile = await getCurrentProfile();
            
            if (profile && !profile.onboardingComplete) {
              console.log('🔍 EMAIL VERIFICATION: User needs onboarding, redirecting to onboarding');
              setVerificationStatus('success');
              setLoading(false);
              // Redirect to onboarding after a short delay
              setTimeout(() => {
                navigate('/app/onboarding');
              }, 2000);
              return;
            } else {
              console.log('🔍 EMAIL VERIFICATION: User onboarding complete, redirecting to app');
              setVerificationStatus('success');
              setLoading(false);
              // Redirect to app after a short delay
              setTimeout(() => {
                navigate('/app');
              }, 2000);
              return;
            }
          } catch (error) {
            console.error('🔍 EMAIL VERIFICATION: Error checking profile:', error);
            // Fallback to success state
            setVerificationStatus('success');
            setLoading(false);
            setTimeout(() => {
              navigate('/app');
            }, 2000);
            return;
          }
        }

        // If user is not authenticated, proceed with email confirmation
        // Check if we have parameters in URL, if not try sessionStorage
        let verificationUrl = window.location.href;
        if (!searchParams.get('code') && !searchParams.get('token_hash')) {
          const storedParams = sessionStorage.getItem('emailConfirmationParams');
          if (storedParams) {
            verificationUrl = `${window.location.origin}/confirmed?${storedParams}`;
            console.log('🔍 EMAIL VERIFICATION: Using stored parameters:', storedParams);
            // Clear the stored parameters after use
            sessionStorage.removeItem('emailConfirmationParams');
          }
        }

        const result = await verifyEmail(verificationUrl);

        console.log('🔍 EMAIL VERIFICATION: Shared verification result:', {
          success: result.success,
          hasUser: !!result.user,
          hasSession: !!result.session,
          userId: result.user?.id,
          userEmail: result.user?.email,
          error: result.error || 'none',
          alreadyVerified: result.alreadyVerified,
          requiresOnboarding: result.requiresOnboarding
        });

        if (!result.success) {
          logger.error('Email verification failed:', result.error);

          if (result.alreadyVerified) {
            logger.info('User already confirmed, redirecting to login');
            navigate('/app/login?message=email-already-confirmed');
            return;
          } else if (result.error?.includes('Invalid code') ||
            result.error?.includes('Code has expired') ||
            result.error?.includes('expired') ||
            result.error?.includes('Email link is invalid or has expired')) {
            setError('The email confirmation link has expired or is invalid. Please request a new confirmation email.');
            setErrorCode('code_expired');
          } else {
            setError(`Email confirmation failed: ${result.error || 'Unknown error'}`);
            setErrorCode(result.error || 'unknown_error');
          }
          setVerificationStatus('error');
          setLoading(false);
          return;
        }

        if (!result.user) {
          logger.error('No user data returned from verification');
          setError('Email confirmation failed. Please try again or contact support.');
          setVerificationStatus('error');
          setLoading(false);
          return;
        }

        logger.info('✅ Email verification successful, user:', result.user.id);
        console.log('✅ EMAIL VERIFICATION: Verification successful!');

        // Set email confirmation flag for AccessGuard
        sessionStorage.setItem('emailConfirmed', 'true');
        sessionStorage.setItem('emailConfirmedTimestamp', Date.now().toString());

        // Handle QR connection completion if user just registered
        try {
          await completeQRConnection(result.user.id);
          logger.info('QR connection completion processed');
        } catch (qrError) {
          logger.error('Error completing QR connection:', qrError);
          // Don't fail the verification process for QR connection errors
        }

        // Skip profile query in email confirmation - let AuthProvider handle it
        logger.info('Email confirmation successful, letting AuthProvider handle profile loading');

        // Wait a moment for session to be properly established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success state instead of auto-redirecting
        logger.info('Email verification successful, showing success page');
        setVerificationStatus('success');
        setLoading(false);

      } catch (err: any) {
        logger.error('Critical error during enhanced email verification:', err);
        setError(err.message || 'An unexpected error occurred during email confirmation.');
        setErrorCode(err.code || 'critical_error');
        setVerificationStatus('error');
        setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, retryCount]); // retryCount dependency will trigger retry

  const handleContinue = async () => {
    setButtonLoading(true);
    try {
      // Ensure user has a valid session before navigating
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.error('No valid session found when continuing:', error);
        setError('Please try logging in again to continue.');
        return;
      }

      logger.info('Continuing with valid session for user:', session.user.id);
      navigate('/app/onboarding');
    } catch (error) {
      logger.error('Error continuing:', error);
      setError('Unable to continue. Please try again.');
    } finally {
      setButtonLoading(false);
    }
  };

  const handleStartJourney = async () => {
    setButtonLoading(true);
    try {
      // Ensure user has a valid session before navigating
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        logger.error('No valid session found when starting journey:', error);
        setError('Please try logging in again to continue.');
        return;
      }

      logger.info('Starting journey with valid session for user:', session.user.id);
      navigate('/app/onboarding');
    } catch (error) {
      logger.error('Error starting journey:', error);
      setError('Unable to start your journey. Please try again.');
    } finally {
      setButtonLoading(false);
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the email from URL parameters or localStorage
      const email = searchParams.get('email') || localStorage.getItem('confirmEmail');

      if (!email) {
        setError('Email address not found. Please try registering again.');
        setLoading(false);
        return;
      }

      // Resend confirmation email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
            ? 'https://dislinkboltv2duplicate.netlify.app/confirmed'
            : 'http://localhost:3001/confirmed'
        }
      });

      if (error) {
        throw error;
      }

      // Show success message
      setError(null);
      setErrorCode(null);

      // Show success state
      setLoading(false);

      // You could show a success message here or redirect
      alert('A new confirmation email has been sent! Please check your inbox.');

    } catch (err) {
      console.error('Error resending confirmation:', err);
      setError('Failed to resend confirmation email. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-900">
            {verificationStatus === 'verifying' ? 'Verifying your email...' : 'Processing...'}
          </h2>
          <p className="mt-2 text-gray-500">
            {retryCount > 0 ? `Retry attempt ${retryCount + 1} of 3` : 'This will only take a moment'}
          </p>
          {retryCount > 0 && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Retrying verification...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl text-center"
        >
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Issue
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="flex flex-col space-y-3">
            <button
              onClick={handleStartJourney}
              disabled={buttonLoading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  🚀 Start Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
            <button
              onClick={handleGoToHome}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home Page
            </button>

            {/* Show resend option for expired links */}
            {(errorCode === 'otp_expired' || errorCode === 'code_expired' || (error && error.includes('expired'))) && (
              <button
                onClick={handleResendConfirmation}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Get New Confirmation Email
                  </>
                )}
              </button>
            )}

            {/* Show login option for users who might already be confirmed */}
            <button
              onClick={() => navigate('/app/login')}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              🔑 Try Logging In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show success state when verification is complete
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
          >
            <Check className="h-10 w-10 text-green-600" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            ✅ Your email has been successfully confirmed!
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            Thank you for verifying your email address. Your account is now active and ready! Next, we'll help you personalize your Dislink experience with a quick onboarding process.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col space-y-3"
          >
            <button
              onClick={handleStartJourney}
              disabled={buttonLoading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </>
              ) : (
                <>
                  🚀 Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            <button
              onClick={handleGoToHome}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Home Page
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // This should not be reached, but keeping as fallback
  return null;
}