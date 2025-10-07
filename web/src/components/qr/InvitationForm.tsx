import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  MapPin, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  User
} from 'lucide-react';
import { submitInvitationRequest, type InvitationRequest } from '@dislink/shared/lib/qrConnection';
import { logger } from '@dislink/shared/lib/logger';

interface InvitationFormProps {
  connectionCode: string;
  userData: {
    name: string;
    jobTitle?: string;
    company?: string;
    profileImage?: string;
  };
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface FormData {
  email: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

export function InvitationForm({ 
  connectionCode, 
  userData, 
  onSuccess, 
  onError 
}: InvitationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    message: '',
    location: undefined
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    // Request location permission on component mount
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      setFormData(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location'
        }
      }));
      setLocationPermission('granted');
    } catch (err) {
      logger.warn('Location permission denied or failed:', err);
      setLocationPermission('denied');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
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

    if (formData.message.length > 500) {
      return 'Message is too long (max 500 characters)';
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
      const invitationData: InvitationRequest = {
        email: formData.email.trim(),
        message: formData.message.trim() || undefined,
        location: formData.location
      };

      const result = await submitInvitationRequest(connectionCode, invitationData);

      if (result.success) {
        setSuccess(true);
        onSuccess?.(result);
        logger.info('Invitation submitted successfully:', result);
      } else {
        setError(result.message);
        onError?.(result.message);
      }
    } catch (err) {
      const errorMessage = 'Failed to send invitation. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
      logger.error('Error submitting invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSuccess(false);
    setError(null);
    setFormData({
      email: '',
      message: '',
      location: formData.location // Keep location if available
    });
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-6 bg-green-50 rounded-lg border border-green-200"
      >
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Invitation Sent!
        </h3>
        <p className="text-green-600 mb-4">
          We've sent an invitation to <strong>{formData.email}</strong>. 
          They'll receive an email to complete the connection.
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Send Another Invitation
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          {userData.profileImage ? (
            <img
              src={userData.profileImage}
              alt={userData.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-purple-600" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Connect with {userData.name}
          </h3>
          {userData.jobTitle && (
            <p className="text-sm text-gray-600">
              {userData.jobTitle}
              {userData.company && ` at ${userData.company}`}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Your Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              maxLength={500}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {formData.message.length}/500 characters
            </span>
            {formData.message.length > 450 && (
              <span className="text-xs text-orange-500">
                Getting close to limit
              </span>
            )}
          </div>
        </div>

        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {locationPermission === 'granted' && formData.location ? (
            <span className="text-green-600">
              ✓ Location captured: {formData.location.name}
            </span>
          ) : locationPermission === 'denied' ? (
            <span className="text-gray-500">
              Location not available
            </span>
          ) : (
            <span className="text-blue-600">
              Getting your location...
            </span>
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading || !formData.email.trim()}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Connection Request
            </>
          )}
        </motion.button>
      </form>

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Privacy:</strong> Your email will only be used to send the connection invitation. 
          We won't share your information with third parties.
        </p>
      </div>
    </motion.div>
  );
}
