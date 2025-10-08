import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
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
  Globe,
  Phone,
  Calendar,
  Heart,
  Share2,
  Copy,
  Download,
  QrCode
} from 'lucide-react';
import { validateConnectionCode, markQRCodeAsUsed } from '@dislink/shared/lib/qrConnectionEnhanced';
import { logger } from '@dislink/shared/lib/logger';
import type { QRConnectionData } from '@dislink/shared/lib/qrConnectionEnhanced';

export function PublicProfileUnified() {
  const { connectionCode } = useParams<{ connectionCode: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<QRConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (connectionCode) {
      loadProfileData();
    }
  }, [connectionCode]);

  const loadProfileData = async () => {
    if (!connectionCode) {
      console.warn('⚠️ [PublicProfile] No connection code provided');
      setError('Invalid profile link - no connection code found');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 [PublicProfile] Loading profile data for connection code:', connectionCode);
      setLoading(true);
      setError(null);

      // Validate connection code and get profile data
      const data = await validateConnectionCode(connectionCode);
      
      if (!data) {
        console.warn('⚠️ [PublicProfile] Connection code validation failed:', connectionCode);
        setError('Profile not found or not publicly available. This QR code may have expired or the profile may not be set to public.');
        return;
      }

      console.log('✅ [PublicProfile] Profile data loaded successfully:', {
        userId: data.userId,
        name: data.name,
        publicProfileEnabled: data.publicProfile?.enabled
      });

      setProfileData(data);

    } catch (err) {
      console.error('❌ [PublicProfile] Error loading profile data:', err);
      logger.error('Error loading profile data:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const profileUrl = window.location.href;
      await navigator.clipboard.writeText(profileUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && profileData) {
      try {
        await navigator.share({
          title: `${profileData.name}'s Profile`,
          text: `Check out ${profileData.name}'s profile on Dislink`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'github': return <Github className="w-5 h-5" />;
      case 'mail': return <Mail className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'website': return <Globe className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dislink
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Profile Data</h1>
          <p className="text-gray-600 mb-6">No profile data available.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Dislink
          </button>
        </div>
      </div>
    );
  }

  const { name, jobTitle, company, profileImage, bio, interests, socialLinks, publicProfile } = profileData;

  // Filter social links based on publicProfile settings
  const filteredSocialLinks = Object.entries(socialLinks || {}).filter(([platform, link]) => {
    return publicProfile?.defaultSharedLinks ? publicProfile.defaultSharedLinks[platform] : true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dislink
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12 text-center text-white">
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${name}'s profile`}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg mb-6"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto bg-white bg-opacity-20 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg mb-6">
                {name ? name[0].toUpperCase() : <User className="w-16 h-16" />}
              </div>
            )}
            
            <h1 className="text-4xl font-bold mb-2">{name}</h1>
            
            {(jobTitle || company) && (
              <div className="flex items-center justify-center text-purple-100 text-lg">
                {jobTitle && <span>{jobTitle}</span>}
                {jobTitle && company && <span className="mx-2">•</span>}
                {company && <span>{company}</span>}
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {/* Bio Section */}
            {bio?.text && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 text-lg leading-relaxed">{bio.text}</p>
              </div>
            )}

            {/* Interests Section */}
            {interests && interests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Interests</h2>
                <div className="flex flex-wrap gap-3">
                  {interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links Section */}
            {filteredSocialLinks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connect</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSocialLinks.map(([platform, link]) => (
                    <a
                      key={platform}
                      href={formatSocialUrl(link as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                        {getSocialIcon(platform)}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{platform}</p>
                        <p className="text-sm text-gray-500 truncate">{link as string}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Join Dislink</h3>
              <p className="text-gray-600 mb-4">
                Create your own professional profile and connect with {name} and others.
              </p>
              <button
                onClick={() => navigate('/app/register')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PublicProfileUnified;
