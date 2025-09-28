// Unified email verification page that handles all confirmation scenarios
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { handleEmailConfirmation, getPostAuthRedirectPath } from '@dislink/shared/lib/authFlow';
import { logger } from '@dislink/shared/lib/logger';

type VerificationStatus = 'loading' | 'success' | 'error' | 'already-verified';

export function EmailVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the full URL including search params
        const currentUrl = window.location.href;
        
        logger.info('🔐 Starting email verification', { url: currentUrl });
        
        const result = await handleEmailConfirmation(currentUrl);
        
        if (result.success) {
          if (result.alreadyVerified) {
            setStatus('already-verified');
            logger.info('🔐 User already verified');
          } else {
            setStatus('success');
            setUser(result.user);
            setRequiresOnboarding(result.requiresOnboarding || false);
            logger.info('🔐 Email verification successful', { 
              userId: result.user?.id,
              requiresOnboarding: result.requiresOnboarding 
            });
          }
        } else {
          setStatus('error');
          setError(result.error || 'Email verification failed');
          logger.error('🔐 Email verification failed:', result.error);
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        logger.error('🔐 Email verification error:', err);
      }
    };

    verifyEmail();
  }, []);

  // Auto-redirect after successful verification
  useEffect(() => {
    if (status === 'success' && user) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            const redirectPath = getPostAuthRedirectPath(user);
            logger.info('🔐 Auto-redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, user, navigate]);

  const handleContinue = () => {
    if (user) {
      const redirectPath = getPostAuthRedirectPath(user);
      navigate(redirectPath, { replace: true });
    } else {
      navigate('/app/login');
    }
  };

  const handleGoToLogin = () => {
    navigate('/app/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verifying your email...
            </h1>
            <p className="text-gray-600">
              Please wait while we confirm your email address.
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verified Successfully! 🎉
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been confirmed and you're now logged in.
              {requiresOnboarding 
                ? " Let's get you set up with your profile!"
                : " Welcome back!"
              }
            </p>
            
            {countdown > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {requiresOnboarding ? 'Start Your Journey' : 'Go to Dashboard'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
          </motion.div>
        );

      case 'already-verified':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Email Already Confirmed ✅
            </h1>
            <p className="text-gray-600 mb-6">
              Your email address has already been verified. You can now log in to your account.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                Log In
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'There was a problem verifying your email address.'}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-yellow-800 text-sm font-medium mb-1">
                    Common Solutions:
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Check if the link has expired (links are valid for 24 hours)</li>
                    <li>• Make sure you're using the latest confirmation email</li>
                    <li>• Try requesting a new confirmation email</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
              </button>
              
              <button
                onClick={handleGoToLogin}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {renderContent()}
        </motion.div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
