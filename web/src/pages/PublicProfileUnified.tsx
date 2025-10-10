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
  QrCode,
  Clock,
  RefreshCw
} from 'lucide-react';
import { validateConnectionCode, markQRCodeAsUsed, submitInvitationRequest } from '@dislink/shared/lib/qrConnectionEnhanced';
import { logger } from '@dislink/shared/lib/logger';
import { captureError } from '@dislink/shared/lib/sentry';
import type { QRConnectionData, InvitationRequest } from '@dislink/shared/lib/qrConnectionEnhanced';

export function PublicProfileUnified() {
  const { connectionCode } = useParams<{ connectionCode: string }>();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<QRConnectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isNotPublic, setIsNotPublic] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationMessage, setInvitationMessage] = useState('');
  const [submittingInvitation, setSubmittingInvitation] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState(false);

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
      setIsExpired(false);
      setIsNotPublic(false);

      // Validate connection code and get profile data
      const data = await validateConnectionCode(connectionCode);
      
      if (!data) {
        console.warn('⚠️ [PublicProfile] Connection code validation failed:', connectionCode);
        
        // Check if it's an expired code or not public
        if (data && typeof data === 'object' && 'error' in data) {
          if (data.error === 'expired') {
            setIsExpired(true);
            setError('This QR code has expired. Please ask the profile owner to share a new QR code.');
          } else if (data.error === 'not_public') {
            setIsNotPublic(true);
            setError('This profile is not publicly available. The owner has not enabled public profile sharing.');
          } else {
            setError('Profile not found or not publicly available. This QR code may have expired, been used already, or the profile may not be set to public.');
          }
        } else {
          setError('Profile not found or not publicly available. This QR code may have expired, been used already, or the profile may not be set to public.');
        }
        
        // Send error to Sentry with context
        captureError(new Error('Connection code validation failed'), {
          tags: {
            component: 'PublicProfileUnified',
            operation: 'validateConnectionCode'
          },
          extra: {
            connectionCode,
            errorType: data && typeof data === 'object' && 'error' in data ? data.error : 'unknown',
            timestamp: new Date().toISOString()
          }
        });
        return;
      }

      // Check if public profile is enabled
      if (!data.publicProfile || data.publicProfile.enabled !== true) {
        console.warn('⚠️ [PublicProfile] Public profile not enabled:', data.publicProfile);
        setIsNotPublic(true);
        setError('This profile is not publicly available. The owner has not enabled public profile sharing.');
        
        // Send error to Sentry
        captureError(new Error('Public profile not enabled'), {
          tags: {
            component: 'PublicProfileUnified',
            operation: 'checkPublicProfile'
          },
          extra: {
            connectionCode,
            userId: data.userId,
            publicProfile: data.publicProfile,
            timestamp: new Date().toISOString()
          }
        });
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
      
      // Send error to Sentry with context
      captureError(err instanceof Error ? err : new Error('Unknown error loading profile'), {
        tags: {
          component: 'PublicProfileUnified',
          operation: 'loadProfileData'
        },
        extra: {
          connectionCode,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
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

  const handleInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionCode || !invitationEmail.trim()) return;

    try {
      setSubmittingInvitation(true);
      
      const invitationData: InvitationRequest = {
        email: invitationEmail.trim(),
        message: invitationMessage.trim() || undefined,
        location: undefined // Could add location tracking here
      };

      const result = await submitInvitationRequest(connectionCode, invitationData);
      
      if (result.success) {
        setInvitationSuccess(true);
        setShowInvitationForm(false);
        setInvitationEmail('');
        setInvitationMessage('');
      } else {
        setError(result.message || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error submitting invitation:', err);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setSubmittingInvitation(false);
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
          {isExpired ? (
            <>
              <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code Expired</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>What to do:</strong> Ask the profile owner to generate a new QR code for you to scan.
                </p>
              </div>
            </>
          ) : isNotPublic ? (
            <>
              <AlertCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Public</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Privacy First:</strong> This user has chosen to keep their profile private. Only they can share their information with you.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
              <p className="text-gray-600 mb-6">{error}</p>
            </>
          )}
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={loadProfileData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dislink
            </button>
          </div>
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

  // Safely sanitize and filter profile data based on publicProfile settings
  const sanitizeProfileData = () => {
    const allowedFields = publicProfile?.allowedFields || {
      email: false,
      phone: false,
      company: true,
      jobTitle: true,
      bio: true,
      interests: true,
      location: true
    };

    const sharedLinks = publicProfile?.defaultSharedLinks || {};

    return {
      allowedFields,
      sharedLinks,
      // Safely extract bio data
      bioText: bio?.text || bio?.about || '',
      bioLocation: bio?.location || '',
      bioFrom: bio?.from || '',
      // Safely extract interests
      safeInterests: Array.isArray(interests) ? interests.filter(interest => 
        typeof interest === 'string' && interest.trim().length > 0
      ) : [],
      // Safely extract social links
      safeSocialLinks: Object.entries(socialLinks || {}).filter(([platform, link]) => {
        return typeof link === 'string' && link.trim().length > 0 && 
               (sharedLinks[platform] !== false);
      })
    };
  };

  const { allowedFields, sharedLinks, bioText, bioLocation, bioFrom, safeInterests, safeSocialLinks } = sanitizeProfileData();

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
            {allowedFields.bio && bioText && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{bioText}</p>
                
                {/* Location and From info */}
                {(allowedFields.location && (bioLocation || bioFrom)) && (
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    {bioLocation && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Located in {bioLocation}</span>
                      </div>
                    )}
                    {bioFrom && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        <span>From {bioFrom}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Interests Section */}
            {allowedFields.interests && safeInterests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Interests</h2>
                <div className="flex flex-wrap gap-3">
                  {safeInterests.map((interest, index) => (
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
            {safeSocialLinks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connect</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeSocialLinks.map(([platform, link]) => (
                    <a
                      key={platform}
                      href={formatSocialUrl(link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                        {getSocialIcon(platform)}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">{platform}</p>
                        <p className="text-sm text-gray-500 truncate">{link}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Invitation Form */}
            {!invitationSuccess && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Connect with {name}</h2>
                {!showInvitationForm ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Want to connect with {name}? Enter your email to send a connection request.
                    </p>
                    <button
                      onClick={() => setShowInvitationForm(true)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Request Connection
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInvitationSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={invitationEmail}
                        onChange={(e) => setInvitationEmail(e.target.value)}
                        required
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        id="message"
                        value={invitationMessage}
                        onChange={(e) => setInvitationMessage(e.target.value)}
                        rows={3}
                        inputMode="text"
                        autoComplete="off"
                        autoCapitalize="sentences"
                        autoCorrect="on"
                        spellCheck="true"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Hi! I'd like to connect with you..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={submittingInvitation || !invitationEmail.trim()}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingInvitation ? 'Sending...' : 'Send Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInvitationForm(false)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Success Message */}
            {invitationSuccess && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">Request Sent!</h3>
                <p className="text-green-700 mb-4">
                  Your connection request has been sent to {name}. You'll receive an email when they respond.
                </p>
                <button
                  onClick={() => setInvitationSuccess(false)}
                  className="px-4 py-2 text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Send Another Request
                </button>
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
