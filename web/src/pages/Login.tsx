import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { ArrowLeft, Mail, Lock, Sparkles, AlertCircle, Timer, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { login } from '../lib/auth';
import { supabase, getSafeSession } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useCosmicTheme } from '../lib/cosmicThemes';

export function Login() {
  const navigate = useNavigate();
  const { user, loading, connectionStatus } = useAuth();
  const { currentPalette } = useCosmicTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null | React.ReactNode>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for email confirmation message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');

    if (message === 'email-confirmed') {
      setSuccessMessage('Email confirmed successfully! Please log in to continue.');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Redirect if user is already authenticated - BUT only if they came from a protected route
  useEffect(() => {
    if (!loading && user) {
      // Check if there's a stored redirectUrl indicating they came from a protected route
      const redirectUrl = localStorage.getItem('redirectUrl');

      if (redirectUrl) {
        // User was redirected here from a protected route, so redirect them after auth
        logger.info('🔄 User already authenticated with stored redirect URL, redirecting to:', redirectUrl);
        localStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        // User navigated to login page directly while already authenticated
        // Don't auto-redirect, let them stay on the login page or navigate manually
        logger.info('🔄 User already authenticated but no redirect URL - staying on login page');

        // Optionally show a message or state that they're already logged in
        // But don't force redirect to /app
      }
    }
  }, [user, loading, navigate]);

  // Handle pending redirect after successful login
  useEffect(() => {
    if (pendingRedirect && !isLoggingIn) {
      // Simple timeout fallback - but let AuthProvider handle the primary redirect
      const timeoutId = setTimeout(() => {
        if (pendingRedirect) {
          logger.info('🔄 Fallback redirect triggered after timeout');
          const redirectUrl = localStorage.getItem('redirectUrl');
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
          } else {
            navigate('/app');
          }
          setPendingRedirect(false);
        }
      }, 3000); // 3 second fallback

      return () => clearTimeout(timeoutId);
    }
  }, [pendingRedirect, isLoggingIn, navigate]);

  // Clear pending redirect when user is authenticated
  useEffect(() => {
    if (user && pendingRedirect) {
      logger.info('✅ User authenticated, clearing pending redirect');
      setPendingRedirect(false);
    }
  }, [user, pendingRedirect]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingRedirect(false);

    // Add timeout to prevent infinite loading
    const loginTimeout = setTimeout(() => {
      if (isLoggingIn) {
        console.error('🔍 LOGIN TIMEOUT: Login taking too long, resetting state');
        setError('Login is taking longer than expected. Please try again.');
        setRetryCount(prev => prev + 1);
        setIsLoggingIn(false);
      }
    }, 30000); // 30 second timeout

    // 🔍 PRODUCTION DEBUG LOGGING - START
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        prod: import.meta.env.PROD,
        dev: import.meta.env.DEV
      },
      supabase: {
        urlPresent: !!import.meta.env.VITE_SUPABASE_URL,
        keyPresent: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      },
      auth: {
        connectionStatus,
        userPresent: !!user,
        loading
      },
      browser: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: typeof localStorage !== 'undefined'
      }
    };

    console.log('🔍 PRODUCTION LOGIN DEBUG:', debugInfo);
    logger.info('🔍 Production login attempt starting', debugInfo);
    // 🔍 PRODUCTION DEBUG LOGGING - END

    // Validate input
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoggingIn(true);

    try {
      // Clear timeout on successful start
      clearTimeout(loginTimeout);
      // Check connection status first
      if (connectionStatus === 'disconnected') {
        console.error('🔍 CONNECTION ERROR: Status is disconnected');
        setError('You appear to be offline. Please check your internet connection and try again.');
        setRetryCount(prev => prev + 1);
        setIsLoggingIn(false);
        return;
      }

      logger.info('🔐 Starting login process for:', email);
      console.log('🔍 About to call login function with:', { email: email.substring(0, 5) + '...' });

      // Set remember me flag before login
      if (rememberMe) {
        localStorage.setItem('stayLoggedIn', 'true');
      } else {
        localStorage.removeItem('stayLoggedIn');
      }

      // Try the enhanced login function first
      const result = await login({ email, password });

      console.log('🔍 Login function result:', {
        success: result.success,
        hasUser: !!result.user,
        hasSession: !!result.session,
        error: result.error?.message,
        errorCode: result.error?.code,
        requiresOnboarding: result.requiresOnboarding,
        emailConfirmationRequired: result.emailConfirmationRequired,
        emailNotFound: result.emailNotFound
      });

      if (result.success && result.session) {
        logger.info('✅ Login successful with session - navigating immediately');
        console.log('🔍 SUCCESS: Login completed, preparing navigation');

        // Direct navigation after successful login with session
        const redirectUrl = localStorage.getItem('redirectUrl');
        if (redirectUrl) {
          localStorage.removeItem('redirectUrl');
          logger.info('🔄 Redirecting to stored URL:', redirectUrl);
          navigate(redirectUrl);
        } else if (result.requiresOnboarding) {
          logger.info('🔄 Redirecting to onboarding');
          navigate('/app/onboarding');
        } else {
          logger.info('🔄 Redirecting to app home');
          navigate('/app');
        }

        // Clear any pending redirect since we've handled it
        setPendingRedirect(false);
        return;

      } else if (result.success) {
        logger.info('✅ Login successful but no session yet - waiting for AuthProvider');
        // Fallback: AuthProvider will handle the redirect via onAuthStateChange
        setPendingRedirect(true);

      } else if (result.emailConfirmationRequired) {
        logger.info('📧 Email confirmation required');
        setShowEmailConfirmation(true);
        localStorage.setItem('confirmEmail', email);
      } else if (result.emailNotFound) {
        logger.warn('📧 Email not found during login attempt');
        setError(
          <div className="text-sm">
            No account found with this email.{' '}
            <Link to="/app/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Create an account
            </Link>
            {' '}or try a different email.
          </div>
        );
      } else if (result.error) {
        logger.error('❌ Login error:', result.error);

        // If the enhanced login failed, try direct Supabase approach as backup
        logger.info('🔄 Trying direct Supabase sign-in as backup...');

        const { data, error: directError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (directError) {
          logger.error('❌ Direct login also failed:', directError.message);
          setError(result.error.message);
        } else if (data.session) {
          logger.info('✅ Direct login successful with session');

          // Direct navigation after successful direct login
          const redirectUrl = localStorage.getItem('redirectUrl');
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
          } else {
            navigate('/app');
          }
          return;
        }
      }
    } catch (err) {
      clearTimeout(loginTimeout);
      logger.error('❌ Critical login error:', err);

      // Final fallback: try direct Supabase sign-in
      try {
        logger.info('🔄 Final fallback: direct Supabase sign-in...');

        const { data, error: directError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (directError) {
          logger.error('❌ All login methods failed:', directError.message);
          if (directError.message.includes('Failed to fetch') || directError.message.includes('Network Error')) {
            setError('Network error. Please check your internet connection and try again.');
          } else if (directError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(directError.message);
          }
        } else if (data.session) {
          logger.info('✅ Final fallback login successful with session');

          // Navigate after successful fallback login
          const redirectUrl = localStorage.getItem('redirectUrl');
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl');
            navigate(redirectUrl);
          } else {
            navigate('/app');
          }
          return;
        }
      } catch (fallbackErr) {
        logger.error('❌ All login attempts failed:', fallbackErr);
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      clearTimeout(loginTimeout);
      setIsLoggingIn(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoggingIn(true);
    setError(null);

    try {
      logger.info('Resending confirmation email to:', email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmed`
        }
      });

      if (error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }

      setError('Confirmation email resent. Please check your inbox.');
    } catch (err) {
      console.error('Error resending confirmation:', err);
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${window.location.origin}/app/reset-password`
        }
      );

      if (resetError) {
        if (resetError.message.includes('Failed to fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw resetError;
      }

      setResetSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('If an account exists with this email, you will receive password reset instructions.');
    } finally {
      setIsLoggingIn(false);
    }
  };


  if (showEmailConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      >
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please Verify Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>. Please check your email and click the link to activate your account.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleResendConfirmation}
              disabled={isLoggingIn}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Resending...
                </div>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            <button
              onClick={() => {
                setShowEmailConfirmation(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full text-center text-sm text-accessible-muted hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (resetSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      >
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-6">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            If an account exists with <strong>{resetEmail}</strong>, you will receive password reset instructions shortly.
          </p>
          <button
            onClick={() => {
              setResetSent(false);
              setResetEmail('');
            }}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-purple-600/10 rounded-full flex items-center justify-center mb-6 hover:shadow-lg hover:shadow-purple-500/25">
          <Sparkles className="h-10 w-10 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
        <p className="mt-2 text-xl text-gray-900/70">Great to see you again</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-purple-600/10"
      >
        {connectionStatus === 'disconnected' && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-700">
                You appear to be offline. Please check your internet connection and try again.
              </div>
            </div>
          </div>
        )}

        {!loading && user && (
          <div className="mb-4 rounded-md bg-blue-50 p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-blue-700">
                  <p className="font-medium">You're already signed in as {user.firstName} {user.lastName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(user.onboardingComplete ? '/app' : '/app/onboarding')}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {user.onboardingComplete ? 'Go to App' : 'Complete Onboarding'}
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload(); // Refresh to clear state
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6" role="form" aria-label="Login form">
          {error && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" aria-hidden="true" />
                <div className="flex-1">
                  <div className="text-sm text-red-700" id="error-message">{error}</div>
                  {retryCount > 0 && (
                    <button
                      onClick={() => {
                        setError(null);
                        setRetryCount(0);
                        setIsLoggingIn(false);
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div className="flex-1">
                  <div className="text-sm text-green-700">{successMessage}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accessible-muted" aria-hidden="true" />
              <input
                type="email"
                id="email"
                required
                disabled={!loading && !!user}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 input-focus touch-target"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetEmail(e.target.value);
                }}
                placeholder="you@example.com"
                aria-describedby="error-message"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accessible-muted" aria-hidden="true" />
              <input
                type="password"
                id="password"
                required
                disabled={!loading && !!user}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 input-focus touch-target"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-describedby="error-message"
                aria-invalid={error ? "true" : "false"}
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={!loading && !!user}
              className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 disabled:text-accessible-muted">
              Remember me (stay logged in)
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                disabled={!loading && !!user}
                onClick={handleForgotPassword}
                className="font-medium text-purple-600 hover:text-indigo-600 disabled:text-accessible-muted disabled:cursor-not-allowed"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || connectionStatus === 'disconnected' || (!loading && !!user)}
            className="btn-captamundi-primary w-full flex justify-center items-center"
            aria-label={isLoggingIn ? "Signing in, please wait" : "Sign in to your account"}
          >
            {!loading && user ? (
              'Already Signed In'
            ) : isLoggingIn ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-900/70">
            Don't have an account yet?{' '}
            <Link
              to="/app/register"
              className="font-medium text-purple-600 hover:text-indigo-600"
            >
              Create one now
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-900/60 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}