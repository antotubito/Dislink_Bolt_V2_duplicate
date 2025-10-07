import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import { ArrowLeft, Mail, Lock, Sparkles, AlertCircle, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { signUp } from '@dislink/shared/lib/auth';
import { registerWithPKCE } from '@dislink/shared/lib/authUtils';
import type { RegistrationData } from '@dislink/shared/types';
import { sessionManager } from "@dislink/shared/lib/sessionManager";
import { logger } from '@dislink/shared/lib/logger';
import { supabase } from '@dislink/shared/lib/supabase';
import { getEmailRedirectUrl } from '@dislink/shared/lib/authUtils';
import {
  updateConnectionMemoryOnRegistration,
  createUserConnection,
  validateInvitationCode
} from "@dislink/shared/lib/qrEnhanced";
import { 
  validateInvitationCode as validateNewInvitationCode,
  processRegistrationWithInvitation,
  type RegistrationWithInvitation
} from '@dislink/shared/lib/invitationService';

export function Register() {
  const navigate = useNavigate();
  const { refreshUser, connectionStatus } = useAuth();
  const [formData, setFormData] = useState<RegistrationData & { confirmPassword: string }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null | React.ReactNode>(null);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [qrConnectionData, setQrConnectionData] = useState<any>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check for existing session and QR connection data
  useEffect(() => {
    if (sessionManager.hasSession()) {
      navigate('/app');
    }

    // Check for QR scan data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const invitationId = urlParams.get('invitation');
    const connectionCode = urlParams.get('code');
    const fromQrScan = urlParams.get('from') === 'qr_scan';
    const connectUserId = urlParams.get('connect');
    const scanId = urlParams.get('scan_id');

    // Handle email invitation
    if (invitationId && connectionCode) {
      validateInvitationCode(invitationId, connectionCode)
        .then(invitation => {
          if (invitation) {
            setInvitationData(invitation);
            // Pre-fill email if available
            if (invitation.recipientEmail) {
              setFormData(prev => ({ ...prev, email: invitation.recipientEmail }));
            }
            console.log('Valid invitation found:', invitation);
          } else {
            setError('Invalid or expired invitation link');
          }
        })
        .catch(err => {
          console.error('Error validating invitation:', err);
          setError('Failed to validate invitation');
        });
    }

    // Handle direct QR scan registration
    if (fromQrScan && connectUserId) {
      const storedData = localStorage.getItem('qr_registration_data');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          setQrConnectionData(parsedData);
          console.log('QR connection data loaded:', parsedData);
        } catch (err) {
          console.error('Error parsing QR registration data:', err);
        }
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRegistering(true);

    // Check if in cooldown period
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again`);
      setIsRegistering(false);
      return;
    }

    // Set a timeout to prevent infinite loading
    const registrationTimeout = setTimeout(() => {
      if (isRegistering) {
        setError(
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Registration Taking Too Long</span>
            </div>
            <p className="text-gray-600 mb-3">
              The registration process is taking longer than expected. This might be due to:
            </p>
            <ul className="text-gray-600 text-xs space-y-1 mb-3">
              <li>• Email service limits reached</li>
              <li>• Network connectivity issues</li>
              <li>• High server load</li>
            </ul>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setError(null);
                  setIsRegistering(false);
                }}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  // Run diagnostic
                  if (typeof window !== 'undefined' && (window as any).runRegistrationDiagnostic) {
                    (window as any).runRegistrationDiagnostic().then((result: any) => {
                      console.log('Registration diagnostic result:', result);
                      alert(`Diagnostic Results:\n\nIssues: ${result.issues.join(', ') || 'None'}\n\nRecommendations:\n${result.recommendations.join('\n')}`);
                    });
                  }
                }}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Run Diagnostic
              </button>
            </div>
          </div>
        );
        setIsRegistering(false);
      }
    }, 30000); // 30 second timeout

    // Validate form data
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please enter your full name');
      setIsRegistering(false);
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsRegistering(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsRegistering(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsRegistering(false);
      return;
    }

    setLoading(true);

    try {
      // 🔍 FIRST: Check if user already exists
      console.log('🔍 Checking if user exists before registration');

      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('email, id')
        .eq('email', formData.email.trim().toLowerCase());

      if (existingProfiles && existingProfiles.length > 0) {
        console.log('🔍 User already exists in profiles table');
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
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25"
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
        setIsRegistering(false);
        return;
      }

      // Check connection status first
      if (connectionStatus === 'disconnected') {
        setError('You appear to be offline. Please check your internet connection and try again.');
        setLoading(false);
        setIsRegistering(false);
        return;
      }

      // Store email temporarily for verification
      localStorage.setItem('confirmEmail', formData.email);

      logger.info('Submitting registration form', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      // Create account using enhanced PKCE registration
      const result = await registerWithPKCE({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (!result.success || result.error) {
        console.error("❌ Signup failed:", result.error?.message);
        setError(`Signup failed: ${result.error?.message || 'Unknown error'}`);
        return;
      }

      const { user, session } = result;

      logger.info('Registration successful, showing verification prompt');

      // Show verification prompt
      setShowVerificationPrompt(true);

      // Handle QR connection setup after successful registration
      if (invitationData || qrConnectionData) {
        // Store connection data for post-verification processing
        localStorage.setItem('pending_qr_connection', JSON.stringify({
          invitationData,
          qrConnectionData,
          userEmail: formData.email
        }));
      }

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
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white btn-captamundi-primary hover:shadow-lg hover:shadow-purple-500/25"
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
      clearTimeout(registrationTimeout);
      setLoading(false);
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
      const email = formData.email;
      if (!email) {
        throw new Error('Email address is missing');
      }

      logger.info('Resending verification email', { email });

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
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
            We've sent a verification link to <strong>{formData.email}</strong>.
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Hey there! 👋</h1>
        <p className="mt-2 text-xl text-gray-600">Let's get you started with Dislink</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Your first name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Your last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="email"
                id="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="password"
                id="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <input
                type="password"
                id="confirmPassword"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-purple-600 focus:border-purple-600 sm:text-sm"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="text-sm">
            <p className="text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/app/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Terms & Conditions
              </Link>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || cooldownTime > 0 || isRegistering}
            className="btn-captamundi-primary w-full flex justify-center items-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creating Account...
              </div>
            ) : cooldownTime > 0 ? (
              <div className="flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Wait {cooldownTime}s
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/app/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}