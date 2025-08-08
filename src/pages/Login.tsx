import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { ArrowLeft, Mail, Lock, Sparkles, AlertCircle, Timer, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { login } from '../lib/auth';
import { supabase, getSafeSession } from '../lib/supabase';
import { logger } from '../lib/logger';

export function Login() {
  const navigate = useNavigate();
  const { user, loading, connectionStatus } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null | React.ReactNode>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  // Create constellation stars for the login page
  const [stars, setStars] = useState<Array<{ id: number; left: string; top: string; delay: number }>>([]);

  useEffect(() => {
    const starArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 3
    }));
    setStars(starArray);
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
      const checkSessionAndRedirect = async () => {
        try {
          logger.info('🔄 Checking session for pending redirect...');
          
          // Wait a bit for auth state to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session }, error } = await getSafeSession();
          
          if (session && !error) {
            logger.info('✅ Session confirmed, proceeding with redirect');
            
            // Get user profile to check onboarding status
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('onboarding_complete')
              .eq('id', session.user.id)
              .single();
            
            const redirectUrl = localStorage.getItem('redirectUrl');
            if (redirectUrl) {
              localStorage.removeItem('redirectUrl');
              logger.info('🔄 Redirecting to stored URL:', redirectUrl);
              navigate(redirectUrl);
            } else if (profileError || !profile?.onboarding_complete) {
              logger.info('🔄 Redirecting to onboarding');
              navigate('/app/onboarding');
            } else {
              logger.info('🔄 Redirecting to app home');
              navigate('/app');
            }
            
            setPendingRedirect(false);
          } else {
            logger.warn('⚠️ No session found during pending redirect, will retry...');
            // Retry after another delay
            setTimeout(() => {
              if (pendingRedirect) {
                checkSessionAndRedirect();
              }
            }, 2000);
          }
        } catch (error) {
          logger.error('❌ Error during pending redirect:', error);
          setPendingRedirect(false);
        }
      };
      
      checkSessionAndRedirect();
    }
  }, [pendingRedirect, isLoggingIn, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingRedirect(false);

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
      // Check connection status first
      if (connectionStatus === 'disconnected') {
        setError('You appear to be offline. Please check your internet connection and try again.');
        setIsLoggingIn(false);
        return;
      }
      
      logger.info('🔐 Starting cosmic login process for:', email);
      
      const result = await login({ email, password });
      
      if (result.success) {
        logger.info('✅ Cosmic connection successful - setting up redirect');
        
        // Set pending redirect to handle the redirection
        setPendingRedirect(true);
        
        // Also set a fallback timeout to ensure redirect happens
        setTimeout(() => {
          if (pendingRedirect) {
            logger.info('🔄 Fallback redirect triggered');
            const redirectUrl = localStorage.getItem('redirectUrl');
            if (redirectUrl) {
              localStorage.removeItem('redirectUrl');
              navigate(redirectUrl);
            } else {
              navigate('/app');
            }
            setPendingRedirect(false);
          }
        }, 5000); // 5 second fallback
        
      } else if (result.emailConfirmationRequired) {
        logger.info('📧 Email confirmation required');
        setShowEmailConfirmation(true);
        localStorage.setItem('confirmEmail', email);
      } else if (result.emailNotFound) {
        logger.warn('📧 Email not found during login attempt');
        setError(
          <div className="text-sm">
            No constellation found with this email.{' '}
            <Link to="/app/register" className="cosmic-text-accent hover:opacity-80 font-medium underline">
              Create your cosmic profile
            </Link>
            {' '}or try a different email.
          </div>
        );
      } else if (result.error) {
        logger.error('❌ Login error:', result.error);
        setError(result.error.message);
      }
    } catch (err) {
      logger.error('❌ Critical login error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
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
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
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
    <div className="min-h-screen cosmic-bg-primary relative overflow-hidden">
      {/* Constellation Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="constellation-star"
          style={{
            left: star.left,
            top: star.top,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}

      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Cosmic Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 cosmic-bg-accent rounded-full flex items-center justify-center mb-6 cosmic-shadow-lg relative">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-5 h-5 cosmic-bg-secondary rounded-full flex items-center justify-center">
              <Star className="h-2 w-2 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold cosmic-text-high-contrast">
            <span className="cosmic-text-primary">Welcome Back</span> ✨
          </h1>
          <p className="mt-2 text-xl cosmic-text-medium-contrast">
            Return to your constellation
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full cosmic-card p-8 cosmic-shadow-lg"
        >
          {connectionStatus === 'disconnected' && (
            <div className="mb-4 cosmic-card border-red-500/30 bg-red-500/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div className="text-sm cosmic-text-high-contrast">
                  You appear to be offline. Please check your internet connection and try again.
                </div>
              </div>
            </div>
          )}

          {!loading && user && (
            <div className="mb-4 cosmic-card border-cyan-500/30 bg-cyan-500/10 p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-cyan-400 mr-2 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm cosmic-text-high-contrast">
                    <p className="font-medium">
                      You're already connected as <span className="cosmic-text-accent">{user.firstName} {user.lastName}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(user.onboardingComplete ? '/app' : '/app/onboarding')}
                        className="cosmic-button px-3 py-1 text-xs"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {user.onboardingComplete ? 'Enter Constellation' : 'Complete Journey'}
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.reload(); // Refresh to clear state
                        }}
                        className="px-3 py-1 text-xs font-medium bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="cosmic-card border-red-500/30 bg-red-500/10 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <div className="text-sm cosmic-text-high-contrast">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium cosmic-text-high-contrast mb-1">
                Cosmic Coordinates (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="email"
                  id="email"
                  required
                  disabled={!loading && !!user}
                  className="cosmic-input w-full pl-10 pr-3 py-3"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setResetEmail(e.target.value);
                  }}
                  placeholder="your.email@cosmos.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium cosmic-text-high-contrast mb-1">
                Stellar Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  type="password"
                  id="password"
                  required
                  disabled={!loading && !!user}
                  className="cosmic-input w-full pl-10 pr-3 py-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your stellar passkey"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  disabled={!loading && !!user}
                  onClick={handleForgotPassword}
                  className="font-medium cosmic-text-accent hover:opacity-80 disabled:text-white/40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Lost your stellar passkey?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || connectionStatus === 'disconnected' || (!loading && !!user)}
              className="cosmic-button w-full py-3 text-base font-medium flex justify-center items-center gap-3"
            >
              {!loading && user ? (
                'Already Connected'
              ) : isLoggingIn ? (
                <>
                  <div className="cosmic-spinner w-5 h-5" />
                  Connecting to constellation...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Enter Constellation
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm cosmic-text-medium-contrast">
              New to the cosmos?{' '}
              <Link
                to="/app/register"
                className="font-medium cosmic-text-accent hover:opacity-80 transition-all duration-300"
              >
                Create your stellar profile
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm cosmic-text-low-contrast hover:cosmic-text-medium-contrast transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Cosmic Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}