import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { ArrowLeft, Mail, Lock, Sparkles, AlertCircle, Timer, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { signUp } from '../lib/auth';
import type { RegistrationData } from '../types/user';
import { sessionManager } from '../lib/sessionManager';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { User, Star } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { refreshUser, connectionStatus, user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null | React.ReactNode>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check for existing session
  useEffect(() => {
    if (sessionManager.hasSession()) {
      navigate('/app');
    }
  }, [navigate]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if in cooldown period
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again`);
      return;
    }

    // Validate form data
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsRegistering(true);

    try {
      // Check connection status first
      if (connectionStatus === 'disconnected') {
        setError('You appear to be offline. Please check your internet connection and try again.');
        setIsRegistering(false);
        return;
      }
      
      // Store email temporarily for verification
      localStorage.setItem('confirmEmail', email);
      
      logger.info('Submitting registration form', { 
        email: email,
        firstName: firstName,
        lastName: lastName
      });
      
      // Create account with explicit redirect URL
      await signUp({
        email,
        password,
        firstName,
        lastName
      });
      
      logger.info('Registration successful, showing verification prompt');
      
      // Show verification prompt
      setShowVerificationPrompt(true);
      
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('already exists') || err.message.includes('already registered')) {
          setError(
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Account Already Exists</span>
              </div>
              <p className="text-gray-600 mb-3">
                An account with this email address is already registered.
              </p>
              <div className="flex flex-col gap-2">
                <Link 
                  to="/app/login" 
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign In Instead
                </Link>
                <button
                  onClick={() => setError(null)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          );
        } else if (err.message.includes('security purposes') || err.message.includes('rate limit')) {
          // Set cooldown timer for 50 seconds
          setCooldownTime(50);
          setError(
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-yellow-500" />
              <span>Please wait {cooldownTime} seconds before trying again</span>
            </div>
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create account. Please try again.');
      }
      
      // Clear stored email on error
      localStorage.removeItem('confirmEmail');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResendVerification = async () => {
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userEmail = email;
      if (!userEmail) {
        throw new Error('Email address is missing');
      }
      
      logger.info('Resending verification email', { email: userEmail });
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmed`
        }
      });
      
      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
          setCooldownTime(50);
          throw new Error('For security purposes, you can only request this after 50 seconds.');
        }
        throw error;
      }
      
      setError(
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700">Email Resent Successfully</span>
          </div>
          <p className="text-gray-600 mb-2">
            A new verification email has been sent to your inbox.
          </p>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800">Reminder</span>
            </div>
            <p className="text-xs text-yellow-700">
              The verification link will expire in <strong>30 minutes</strong>.
            </p>
          </div>
        </div>
      );
    } catch (err) {
      console.error('Error resending verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationPrompt) {
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
            Check Your Email! ✨
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>. 
            Click the link to activate your account and start connecting!
          </p>
          
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Important</span>
            </div>
            <p className="text-sm text-yellow-700">
              The verification link will expire in <strong>30 minutes</strong>. 
              Please check your email and click the link as soon as possible.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <p className="text-sm text-gray-500 mb-4">
            Can't find the email? Check your spam folder
            {cooldownTime === 0 ? (
              <> or{' '}
                <button
                  onClick={handleResendVerification}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  click here to resend
                </button>
              </>
            ) : (
              <> • Can resend in {cooldownTime}s</>
            )}
          </p>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/app/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Return to login page
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-constellation-field py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-nebula-gradient rounded-full flex items-center justify-center mb-6 animate-constellation-twinkle">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-nebula-gradient">Join the Cosmic Web! ✨</h1>
        <p className="mt-2 text-xl text-cosmic-200">Create your stellar profile</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-cosmic-300/30"
      >
        {!loading && user && (
          <div className="mb-4 rounded-md bg-stardust-100 p-4 border border-stardust-200">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-stardust-700 mr-2 mt-0.5 animate-starlight-pulse" />
              <div className="flex-1">
                <div className="text-sm text-stardust-800">
                  <p className="font-medium">You're already signed in as {user.firstName} {user.lastName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(user.onboardingComplete ? '/app' : '/app/onboarding')}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-cosmic-600 text-white hover:bg-cosmic-700 animate-cosmic-float"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {user.onboardingComplete ? 'Go to App' : 'Complete Onboarding'}
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                      }}
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-cosmic-200 text-cosmic-800 hover:bg-cosmic-300"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="rounded-md bg-constellation-100 p-4 border border-constellation-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-constellation-700 mr-2" />
                <div className="text-sm text-constellation-800">{error}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-cosmic-200 mb-1">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-400" />
                <input
                  type="text"
                  id="firstName"
                  required
                  disabled={!loading && !!user}
                  className="block w-full pl-10 pr-3 py-2 border border-cosmic-300/50 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-cosmic-500 focus:border-cosmic-400 sm:text-sm disabled:bg-cosmic-600/20 disabled:text-cosmic-300 text-white placeholder-cosmic-300"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-cosmic-200 mb-1">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-400" />
                <input
                  type="text"
                  id="lastName"
                  required
                  disabled={!loading && !!user}
                  className="block w-full pl-10 pr-3 py-2 border border-cosmic-300/50 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-cosmic-500 focus:border-cosmic-400 sm:text-sm disabled:bg-cosmic-600/20 disabled:text-cosmic-300 text-white placeholder-cosmic-300"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-cosmic-200 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-400" />
              <input
                type="email"
                id="email"
                required
                disabled={!loading && !!user}
                className="block w-full pl-10 pr-3 py-2 border border-cosmic-300/50 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-cosmic-500 focus:border-cosmic-400 sm:text-sm disabled:bg-cosmic-600/20 disabled:text-cosmic-300 text-white placeholder-cosmic-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-cosmic-200 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-400" />
              <input
                type="password"
                id="password"
                required
                disabled={!loading && !!user}
                className="block w-full pl-10 pr-3 py-2 border border-cosmic-300/50 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-cosmic-500 focus:border-cosmic-400 sm:text-sm disabled:bg-cosmic-600/20 disabled:text-cosmic-300 text-white placeholder-cosmic-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-cosmic-200 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-400" />
              <input
                type="password"
                id="confirmPassword"
                required
                disabled={!loading && !!user}
                className="block w-full pl-10 pr-3 py-2 border border-cosmic-300/50 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-cosmic-500 focus:border-cosmic-400 sm:text-sm disabled:bg-cosmic-600/20 disabled:text-cosmic-300 text-white placeholder-cosmic-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              disabled={!loading && !!user}
              className="h-4 w-4 text-cosmic-600 focus:ring-cosmic-500 border-cosmic-300 rounded"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="acceptTerms" className="ml-2 block text-sm text-cosmic-200">
              I agree to the{' '}
              <Link to="/terms" className="text-stardust-400 hover:text-stardust-300 transition-colors duration-200">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-stardust-400 hover:text-stardust-300 transition-colors duration-200">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isRegistering || (!loading && !!user)}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-nebula-gradient hover:shadow-lg hover:shadow-nebula-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nebula-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 animate-cosmic-float"
          >
            {!loading && user ? (
              'Already Signed In'
            ) : isRegistering ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creating your cosmic profile...
              </div>
            ) : (
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 animate-constellation-twinkle" />
                Create Account
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-cosmic-300">
            Already have an account?{' '}
            <Link
              to="/app/login"
              className="font-medium text-stardust-400 hover:text-stardust-300 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/waitlist"
            className="inline-flex items-center text-sm text-cosmic-400 hover:text-cosmic-200 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}