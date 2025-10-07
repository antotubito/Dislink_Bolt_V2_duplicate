import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Building, 
  Mail, 
  Globe,
  Linkedin,
  Twitter,
  Github,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { validateConnectionCode, trackQRScan } from '@dislink/shared/lib/qrConnection';
import { InvitationForm } from '../components/qr/InvitationForm';
import { logger } from '@dislink/shared/lib/logger';
import type { QRConnectionData } from '@dislink/shared/lib/qrConnection';

export function QRProfilePage() {
  const { connectionCode } = useParams<{ connectionCode: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<QRConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [scanTracked, setScanTracked] = useState(false);

  useEffect(() => {
    if (connectionCode) {
      loadProfileData();
    }
  }, [connectionCode]);

  const loadProfileData = async () => {
    if (!connectionCode) return;

    try {
      setLoading(true);
      setError(null);

      // Validate connection code and get profile data
      const data = await validateConnectionCode(connectionCode);
      
      if (!data) {
        setError('Invalid or expired connection code');
        return;
      }

      setProfileData(data);

      // Track the scan (without user ID for anonymous visitors)
      try {
        await trackQRScan(connectionCode, undefined, undefined, {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString(),
          page_url: window.location.href
        });
        setScanTracked(true);
        logger.info('QR scan tracked successfully for anonymous visitor');
      } catch (trackError) {
        logger.warn('Failed to track QR scan:', trackError);
        // Don't fail the page load if tracking fails
      }

    } catch (err) {
      logger.error('Error loading profile data:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationSuccess = (result: any) => {
    logger.info('Invitation sent successfully:', result);
    // Could show a success message or redirect
  };

  const handleInvitationError = (error: string) => {
    logger.error('Invitation failed:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Dislink Profile</h1>
              <p className="text-sm text-gray-600">Connect with {profileData.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              {/* Profile Header */}
              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt={profileData.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-purple-600" />
                    </div>
                  )}
                  {scanTracked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {profileData.name}
                  </h1>
                  
                  {profileData.jobTitle && (
                    <div className="flex items-center gap-2 text-lg text-gray-600 mb-2">
                      <Building className="w-5 h-5" />
                      <span>{profileData.jobTitle}</span>
                      {profileData.company && (
                        <span>at <strong>{profileData.company}</strong></span>
                      )}
                    </div>
                  )}

                  {profileData.bio?.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.bio.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              {profileData.bio && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">About</h3>
                  <div className="space-y-2 text-gray-600">
                    {profileData.bio.about && (
                      <p>{profileData.bio.about}</p>
                    )}
                    {profileData.bio.from && (
                      <p><strong>From:</strong> {profileData.bio.from}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Interests */}
              {profileData.interests && profileData.interests.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Interests</h3>
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

              {/* Social Links */}
              {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Connect</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                      url && (
                        <a
                          key={platform}
                          href={formatSocialUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          {getSocialIcon(platform)}
                          <span className="capitalize">{platform}</span>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Dislink Branding */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">D</span>
                  </div>
                  <span>Powered by Dislink - Building Meaningful Connections</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Invitation Form */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {!showInvitationForm ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Connect with {profileData.name}
                    </h2>
                    <p className="text-gray-600">
                      Send a connection request to start building a meaningful relationship
                    </p>
                  </div>

                  <button
                    onClick={() => setShowInvitationForm(true)}
                    className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                  >
                    Send Connection Request
                  </button>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">What happens next?</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• You'll receive an email invitation</li>
                      <li>• Create your Dislink account</li>
                      <li>• Connection is automatically established</li>
                      <li>• Start building meaningful relationships</li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                >
                  <InvitationForm
                    connectionCode={connectionCode!}
                    userData={{
                      name: profileData.name,
                      jobTitle: profileData.jobTitle,
                      company: profileData.company,
                      profileImage: profileData.profileImage
                    }}
                    onSuccess={handleInvitationSuccess}
                    onError={handleInvitationError}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
