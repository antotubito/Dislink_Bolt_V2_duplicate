import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Building, 
  Mail, 
  Linkedin,
  Twitter,
  Github,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { validateConnectionCode } from '@dislink/shared/lib/qrConnectionEnhanced';
import { logger } from '@dislink/shared/lib/logger';
import type { QRConnectionData } from '@dislink/shared/lib/qrConnectionEnhanced';

interface PublicProfilePreviewProps {
  connectionCode: string;
  onClose: () => void;
}

export function PublicProfilePreview({ connectionCode, onClose }: PublicProfilePreviewProps) {
  const [profileData, setProfileData] = useState<QRConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectionCode) {
      loadProfileData();
    }
  }, [connectionCode]);

  const loadProfileData = async () => {
    if (!connectionCode) {
      setError('No connection code provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate connection code and get profile data (NO TRACKING)
      const data = await validateConnectionCode(connectionCode);
      
      if (!data) {
        setError('Profile not found or not publicly available');
        return;
      }

      setProfileData(data);
      console.log('🔍 [Preview] Profile data loaded (NO TRACKING):', {
        userId: data.userId,
        name: data.name,
        publicProfileEnabled: data.publicProfile?.enabled
      });

    } catch (err) {
      console.error('❌ [Preview] Error loading profile data:', err);
      setError('Failed to load profile preview');
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'twitter':
        return <Twitter className="w-4 h-4" />;
      case 'github':
        return <Github className="w-4 h-4" />;
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const formatSocialUrl = (url: string) => {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-600">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Public Profile Preview</h2>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Static View
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              {profileData.profileImage ? (
                <img
                  src={profileData.profileImage}
                  alt={profileData.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-purple-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-purple-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-purple-500" />
                </div>
              )}
            </motion.div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {profileData.name}
            </h1>
            
            {profileData.jobTitle && (
              <p className="text-lg text-gray-600 mb-1">
                {profileData.jobTitle}
                {profileData.company && ` at ${profileData.company}`}
              </p>
            )}

            <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              Public Profile Enabled
            </div>
          </div>

          {/* Bio Section */}
          {profileData.bio && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {profileData.bio}
              </p>
            </div>
          )}

          {/* Social Links */}
          {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={formatSocialUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    {getSocialIcon(platform)}
                    <span className="ml-3 text-gray-700 capitalize">{platform}</span>
                    <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start">
              <Eye className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Preview Mode</h4>
                <p className="text-sm text-blue-700">
                  This is how your public profile appears to others. No tracking, GPS, or analytics are recorded in this preview.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
