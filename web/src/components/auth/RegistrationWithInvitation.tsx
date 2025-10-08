import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { registerUser } from '@dislink/shared/lib/authUtils';
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export function RegistrationWithInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [inviterInfo, setInviterInfo] = useState<{name: string, email: string} | null>(null);

  // Get invitation parameters from URL
  const invitationId = searchParams.get('invitation');
  const connectionCode = searchParams.get('code');

  useEffect(() => {
    // Fetch invitation data and inviter information
    if (invitationId && connectionCode) {
      fetchInvitationData();
    }
  }, [invitationId, connectionCode]);

  const fetchInvitationData = async () => {
    if (!invitationId) return;

    try {
      // Fetch invitation data
      const { data: invitation, error: invitationError } = await supabase
        .from('email_invitations')
        .select(`
          *,
          inviter:profiles!email_invitations_inviter_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('invitation_id', invitationId)
        .single();

      if (invitationError || !invitation) {
        logger.warn('Could not fetch invitation data:', invitationError);
        return;
      }

      setInvitationData(invitation);
      
      // Set inviter info
      if (invitation.inviter) {
        setInviterInfo({
          name: `${invitation.inviter.first_name || ''} ${invitation.inviter.last_name || ''}`.trim() || 'Someone',
          email: invitation.inviter.email || ''
        });
      }

      // Pre-fill email if available from invitation
      if (invitation.recipient_email) {
        setFormData(prev => ({
          ...prev,
          email: invitation.recipient_email
        }));
      }

      logger.info('Invitation data loaded:', { 
        invitationId, 
        connectionCode,
        inviterName: invitation.inviter ? `${invitation.inviter.first_name} ${invitation.inviter.last_name}` : 'Unknown'
      });
    } catch (error) {
      logger.error('Error fetching invitation data:', error);
    }
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    if (!formData.password) {
      return 'Password is required';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (!formData.firstName.trim()) {
      return 'First name is required';
    }

    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use simplified registration
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (result.success) {
        setSuccess(true);
        logger.info('Registration with invitation completed:', result);
        
        // Redirect to login after successful registration with email parameter
        setTimeout(() => {
          navigate(`/app/login?message=registration-success&email=${encodeURIComponent(formData.email)}`);
        }, 3000);
      } else {
        // Enhanced error handling for existing users
        const errorMessage = result.error?.message || 'Registration failed';
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') ||
            errorMessage.includes('User already registered')) {
          console.log("❌ Registration blocked: existing user detected");
          setError('This email is already registered. Please log in instead.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      logger.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-4">
            Your account has been created successfully. Please check your email to verify your account.
          </p>
          {invitationId && inviterInfo && (
            <div className="text-sm text-purple-600 mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="font-medium">
                🎉 Your connection with <span className="font-semibold">{inviterInfo.name}</span> has been automatically created!
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Once you verify your email, you'll be able to see your first connection in the app.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {invitationId ? 'Complete Your Connection' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {invitationId 
              ? 'Finish setting up your account to connect with your new contact'
              : 'Join Dislink to start building meaningful connections'
            }
          </p>
          
          {/* Invitation Message */}
          {invitationId && inviterInfo && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-900">
                    You've been invited by <span className="font-semibold">{inviterInfo.name}</span>
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    Once you complete registration, your first connection will be automatically created!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  {invitationId ? 'Complete Registration & Connect' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/app/login')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Invitation Notice */}
          {invitationId && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Invitation:</strong> You're registering with a connection invitation. 
                Your connection will be automatically established after registration.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
