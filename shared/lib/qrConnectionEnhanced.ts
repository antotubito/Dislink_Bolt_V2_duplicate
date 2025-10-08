import { supabase } from './supabase';
import { logger } from './logger';
import { createOrUpdateProfile } from './profileCreation';
import { getEmailRedirectUrl } from './authUtils';
import type { User } from '../types/user';

// =====================================================
// ENHANCED QR CONNECTION SYSTEM FOR DISLINK
// =====================================================

export interface QRConnectionData {
  userId: string;
  name: string;
  jobTitle?: string;
  company?: string;
  profileImage?: string;
  bio?: any;
  interests?: string[];
  socialLinks?: Record<string, string>;
  publicProfile?: any;
  connectionCode: string;
  publicProfileUrl: string;
}

export interface InvitationRequest {
  email: string;
  message?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export interface InvitationResult {
  success: boolean;
  message: string;
  invitationId?: string;
  connectionCode?: string;
}

export interface ConnectionRequestData {
  requesterId: string;
  targetUserId: string;
  requesterName: string;
  requesterEmail: string;
  requesterJobTitle?: string;
  requesterCompany?: string;
  requesterProfileImage?: string;
  requesterBio?: any;
  requesterInterests?: string[];
  requesterSocialLinks?: Record<string, string>;
  location?: any;
  message?: string;
  method: 'qr_invitation' | 'manual' | 'email_invitation';
}

// =====================================================
// QR CODE GENERATION & MANAGEMENT
// =====================================================

/**
 * Generate a unique QR code for authenticated user
 * Creates connection code and public profile URL
 */
export async function generateUserQRCode(): Promise<QRConnectionData> {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to generate QR code');
    }

    logger.info('Generating QR code for authenticated user:', { userId: user.id });

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Generate unique connection code
    const connectionCode = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create or update connection code in database
    const { data: codeData, error: codeError } = await supabase
      .from('connection_codes')
      .upsert({
        user_id: user.id, // ✅ Use auth.uid() for RLS compliance
        code: connectionCode,
        is_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (codeError) throw codeError;

    // Generate public profile URL
    const publicProfileUrl = window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
      ? `https://dislinkboltv2duplicate.netlify.app/profile/${connectionCode}`
      : `http://localhost:3001/profile/${connectionCode}`;

    const qrData: QRConnectionData = {
      userId: profile.id,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      jobTitle: profile.job_title,
      company: profile.company,
      profileImage: profile.profile_image,
      bio: profile.bio,
      interests: profile.interests || [],
      socialLinks: profile.social_links || {},
      publicProfile: profile.public_profile,
      connectionCode,
      publicProfileUrl
    };

    logger.info('QR code generated successfully:', { 
      userId: user.id, 
      connectionCode, 
      publicProfileUrl 
    });

    return qrData;

  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Validate connection code and return user profile data
 * Used when someone scans a QR code
 */
export async function validateConnectionCode(code: string): Promise<QRConnectionData | null> {
  try {
    console.debug('🔍 [QR] Starting connection code validation:', { code });
    logger.info('Validating connection code:', { code });

    // First, check if the connection code exists and is active
    console.debug('🔍 [QR] Querying connection_codes table...');
    const { data: connectionData, error } = await supabase
      .from('connection_codes')
      .select(`
        id,
        user_id,
        code,
        is_active,
        expires_at,
        created_at
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    console.debug('🔍 [QR] Connection code query result:', { 
      connectionData, 
      error,
      hasData: !!connectionData,
      isActive: connectionData?.is_active,
      expiresAt: connectionData?.expires_at
    });

    if (error) {
      console.error('❌ [QR] Database error querying connection_codes:', error);
      logger.error('Database error querying connection_codes:', error);
      return null;
    }

    if (!connectionData) {
      console.warn('⚠️ [QR] No active connection code found:', { code });
      logger.info('Invalid or expired connection code:', { code });
      return null;
    }

    // Check if code is expired
    if (connectionData.expires_at && new Date() > new Date(connectionData.expires_at)) {
      console.warn('⚠️ [QR] Connection code expired:', { 
        code, 
        expiresAt: connectionData.expires_at,
        currentTime: new Date().toISOString()
      });
      logger.info('Connection code expired:', { code, expiresAt: connectionData.expires_at });
      return null;
    }

    // Now get the associated profile with public profile check
    console.debug('🔍 [QR] Querying profiles table for user:', connectionData.user_id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        job_title,
        company,
        profile_image,
        bio,
        interests,
        social_links,
        public_profile
      `)
      .eq('id', connectionData.user_id)
      .single();

    console.debug('🔍 [QR] Profile query result:', { 
      profile, 
      profileError,
      hasProfile: !!profile,
      publicProfileEnabled: profile?.public_profile?.enabled
    });

    if (profileError) {
      console.error('❌ [QR] Database error querying profiles:', profileError);
      logger.error('Database error querying profiles:', profileError);
      return null;
    }

    if (!profile) {
      console.error('❌ [QR] Profile not found for user:', connectionData.user_id);
      logger.error('Profile not found for connection code:', { code, userId: connectionData.user_id });
      return null;
    }

    // Check if public profile is enabled
    if (!profile.public_profile?.enabled) {
      console.warn('⚠️ [QR] Public profile not enabled for user:', {
        userId: profile.id,
        publicProfile: profile.public_profile
      });
      logger.info('Public profile not enabled for user:', { userId: profile.id });
      return null;
    }

    const qrData: QRConnectionData = {
      userId: profile.id,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      jobTitle: profile.job_title,
      company: profile.company,
      profileImage: profile.profile_image,
      bio: profile.bio,
      interests: profile.interests || [],
      socialLinks: profile.social_links || {},
      publicProfile: profile.public_profile,
      connectionCode: code,
      publicProfileUrl: window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
        ? `https://dislinkboltv2duplicate.netlify.app/profile/${code}`
        : `http://localhost:3001/profile/${code}`
    };

    console.debug('✅ [QR] Connection code validated successfully:', { 
      code, 
      userId: profile.id,
      name: qrData.name,
      publicProfileUrl: qrData.publicProfileUrl
    });
    logger.info('Connection code validated successfully:', { code, userId: profile.id });
    return qrData;

  } catch (error) {
    console.error('❌ [QR] Unexpected error validating connection code:', error);
    logger.error('Error validating connection code:', error);
    return null;
  }
}

// =====================================================
// INVITATION SYSTEM
// =====================================================

/**
 * Submit invitation request from public profile
 * Stores email temporarily until user registers
 */
export async function submitInvitationRequest(
  connectionCode: string,
  invitationData: InvitationRequest
): Promise<InvitationResult> {
  try {
    logger.info('Submitting invitation request:', { connectionCode, email: invitationData.email });

    // Validate connection code
    const qrData = await validateConnectionCode(connectionCode);
    if (!qrData) {
      return {
        success: false,
        message: 'Invalid or expired connection code'
      };
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', invitationData.email)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw userError;
    }

    if (existingUser) {
      // User exists, create direct connection request
      return await createDirectConnectionRequest(qrData.userId, existingUser.id, invitationData);
    }

    // User doesn't exist, store invitation for later
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error: invitationError } = await supabase
      .from('email_invitations')
      .insert({
        invitation_id: invitationId,
        recipient_email: invitationData.email,
        sender_user_id: qrData.userId, // ✅ Use profile owner's ID
        connection_code: connectionCode,
        scan_data: {
          location: invitationData.location,
          message: invitationData.message,
          submitted_at: new Date().toISOString()
        }, // ✅ JSONB field - Supabase handles casting automatically
        email_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: 'sent'
      });

    if (invitationError) throw invitationError;

    // Send email invitation (in production, use real email service)
    await sendInvitationEmail(invitationData.email, qrData, invitationId);

    logger.info('Invitation request submitted successfully:', { invitationId, email: invitationData.email });

    return {
      success: true,
      message: 'Invitation sent! Check your email to complete the connection.',
      invitationId,
      connectionCode
    };

  } catch (error) {
    logger.error('Error submitting invitation request:', error);
    return {
      success: false,
      message: 'Failed to send invitation. Please try again.'
    };
  }
}

/**
 * Create direct connection request for existing users
 */
async function createDirectConnectionRequest(
  targetUserId: string,
  requesterUserId: string,
  invitationData: InvitationRequest
): Promise<InvitationResult> {
  try {
    // Check if connection already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('connection_requests')
      .select('id, status')
      .eq('target_user_id', targetUserId)
      .eq('requester_id', requesterUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return {
          success: true,
          message: 'Connection request already sent and pending approval.'
        };
      } else if (existingRequest.status === 'approved') {
        return {
          success: true,
          message: 'You are already connected with this person.'
        };
      }
    }

    // Get requester profile data for connection request
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', requesterUserId)
      .single();

    if (profileError || !requesterProfile) {
      throw new Error('Requester profile not found');
    }

    // Create new connection request with proper structure
    const { error: requestError } = await supabase
      .from('connection_requests')
      .insert({
        target_user_id: targetUserId, // ✅ Target user (QR code owner)
        requester_id: requesterUserId, // ✅ Requester (existing user)
        requester_name: `${requesterProfile.first_name} ${requesterProfile.last_name}`.trim(),
        requester_email: requesterProfile.email,
        requester_job_title: requesterProfile.job_title,
        requester_company: requesterProfile.company,
        requester_profile_image: requesterProfile.profile_image,
        requester_bio: requesterProfile.bio,
        requester_interests: requesterProfile.interests || [],
        requester_social_links: requesterProfile.social_links || {},
        status: 'pending',
        metadata: {
          location: invitationData.location,
          message: invitationData.message,
          method: 'qr_invitation',
          submitted_at: new Date().toISOString()
        }, // ✅ JSONB field - Supabase handles casting automatically
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (requestError) throw requestError;

    return {
      success: true,
      message: 'Connection request sent! The person will be notified.'
    };

  } catch (error) {
    logger.error('Error creating direct connection request:', error);
    return {
      success: false,
      message: 'Failed to send connection request. Please try again.'
    };
  }
}

// =====================================================
// REGISTRATION WITH INVITATION
// =====================================================

/**
 * Process user registration with invitation
 * Creates user account and automatically establishes connection
 */
export async function processRegistrationWithInvitation(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  invitationId?: string,
  connectionCode?: string
): Promise<InvitationResult> {
  try {
    logger.info('Processing registration with invitation:', { 
      email, 
      invitationId 
    });

    // Validate invitation if provided
    let invitationData: any = null;
    if (invitationId) {
      const { data: invitation, error: invitationError } = await supabase
        .from('email_invitations')
        .select('*')
        .eq('invitation_id', invitationId)
        .eq('status', 'sent')
        .single();

      if (invitationError || !invitation) {
        return {
          success: false,
          message: 'Invalid invitation code'
        };
      }

      // Note: Expiration check removed to allow users to register anytime
      // Invitations no longer expire for registration purposes

      // Verify email matches invitation
      if (invitation.recipient_email.toLowerCase() !== email.toLowerCase()) {
        return {
          success: false,
          message: 'Email address does not match the invitation'
        };
      }

      invitationData = invitation;
    }

    // Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          invitation_id: invitationId
        },
        emailRedirectTo: getEmailRedirectUrl()
      }
    });

    if (authError) {
      logger.error('Auth signup error:', authError);
      
      // Enhanced error handling for existing users
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already exists') ||
          authError.message?.includes('User already registered')) {
        console.log("❌ Registration blocked: existing user detected");
        return {
          success: false,
          message: 'This email is already registered. Please log in instead.'
        };
      }
      
      return {
        success: false,
        message: authError.message || 'Failed to create account'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        message: 'Failed to create user account'
      };
    }

    const userId = authData.user.id;

    // Create user profile with conflict handling
    const profileResult = await createOrUpdateProfile({
      id: userId,
      email,
      firstName,
      lastName
    });

    if (!profileResult.success) {
      logger.error('Profile creation error:', profileResult.error);
      return {
        success: false,
        message: 'Account created but profile setup failed. Please try logging in.'
      };
    }

    // Process invitation if provided
    if (invitationData) {
      const connectionResult = await createConnectionFromInvitation(invitationData, userId);
      if (!connectionResult.success) {
        logger.warn('Failed to create connection from invitation:', connectionResult.message);
        // Don't fail registration, just log the warning
      }
    }

    logger.info('Registration with invitation completed successfully:', { 
      userId, 
      invitationId 
    });

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      invitationId,
      userId
    };

  } catch (error) {
    logger.error('Error processing registration with invitation:', error);
    return {
      success: false,
      message: 'Registration failed. Please try again.'
    };
  }
}

/**
 * Create connection request from invitation after registration
 */
async function createConnectionFromInvitation(
  invitationData: any,
  newUserId: string
): Promise<InvitationResult> {
  try {
    // Update invitation status
    await supabase
      .from('email_invitations')
      .update({
        status: 'registered',
        registered_user_id: newUserId,
        registration_completed_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationData.invitation_id);

    // Get new user profile data
    const { data: newUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUserId)
      .single();

    if (profileError || !newUserProfile) {
      throw new Error('New user profile not found');
    }

    // Create connection request
    const { error: requestError } = await supabase
      .from('connection_requests')
      .insert({
        target_user_id: invitationData.sender_user_id, // ✅ QR code owner
        requester_id: newUserId, // ✅ New user
        requester_name: `${newUserProfile.first_name} ${newUserProfile.last_name}`.trim(),
        requester_email: newUserProfile.email,
        requester_job_title: newUserProfile.job_title,
        requester_company: newUserProfile.company,
        requester_profile_image: newUserProfile.profile_image,
        requester_bio: newUserProfile.bio,
        requester_interests: newUserProfile.interests || [],
        requester_social_links: newUserProfile.social_links || {},
        status: 'pending',
        metadata: {
          ...invitationData.scan_data,
          method: 'email_invitation',
          invitation_id: invitationData.invitation_id,
          registered_at: new Date().toISOString()
        }, // ✅ JSONB field - Supabase handles casting automatically
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (requestError) throw requestError;

    logger.info('Connection request created from invitation:', { 
      invitationId: invitationData.invitation_id, 
      newUserId 
    });

    return {
      success: true,
      message: 'Connection request created successfully!'
    };

  } catch (error) {
    logger.error('Error creating connection from invitation:', error);
    return {
      success: false,
      message: 'Failed to process invitation'
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get QR scan statistics for authenticated user
 */
export async function getQRScanStats(): Promise<{
  totalScans: number;
  recentScans: any[];
  lastScanDate?: Date;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { totalScans: 0, recentScans: [] };
    }

    const { data: scans, error } = await supabase
      .from('qr_scan_tracking')
      .select('*')
      .eq('user_id', user.id) // ✅ Use auth.uid() for RLS compliance
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      totalScans: scans?.length || 0,
      recentScans: scans || [],
      lastScanDate: scans?.[0]?.scanned_at ? new Date(scans[0].scanned_at) : undefined
    };

  } catch (error) {
    logger.error('Error getting QR scan stats:', error);
    return {
      totalScans: 0,
      recentScans: []
    };
  }
}

/**
 * Mark QR code as used (one-time use system)
 * This prevents the same QR code from being used by multiple people
 */
export async function markQRCodeAsUsed(
  connectionCode: string,
  scannerUserId?: string,
  location?: { latitude: number; longitude: number },
  deviceInfo?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Marking QR code as used:', { connectionCode, scannerUserId });

    // First, check if the code is still available
    const { data: existingCode, error: checkError } = await supabase
      .from('connection_codes')
      .select('id, is_active, scan_count, scanned_by')
      .eq('code', connectionCode)
      .eq('is_active', true)
      .single();

    if (checkError) {
      logger.error('Error checking QR code status:', checkError);
      return { success: false, error: 'Failed to check QR code status' };
    }

    if (!existingCode) {
      return { success: false, error: 'QR code not found or expired' };
    }

    // Check if already used
    if (existingCode.scanned_by) {
      return { success: false, error: 'QR code has already been used' };
    }

    // Mark as used and update scan tracking
    const { error: updateError } = await supabase
      .from('connection_codes')
      .update({
        scanned_by: scannerUserId || null,
        scanned_at: new Date().toISOString(),
        scan_count: (existingCode.scan_count || 0) + 1,
        last_scanned_at: new Date().toISOString(),
        last_scan_location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString()
        } : null
      })
      .eq('code', connectionCode);

    if (updateError) {
      logger.error('Error marking QR code as used:', updateError);
      return { success: false, error: 'Failed to mark QR code as used' };
    }

    // Create detailed scan tracking entry
    if (scannerUserId) {
      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: trackingError } = await supabase
        .from('qr_scan_tracking')
        .insert({
          scan_id: scanId,
          code: connectionCode,
          scanned_at: new Date().toISOString(),
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            scanned_at: new Date().toISOString()
          } : null,
          device_info: deviceInfo || {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        });

      if (trackingError) {
        logger.error('Error creating scan tracking entry:', trackingError);
        // Don't fail the whole operation for tracking errors
      }
    }

    logger.info('QR code marked as used successfully:', { connectionCode });
    return { success: true };

  } catch (error) {
    logger.error('Error marking QR code as used:', error);
    return { success: false, error: 'Failed to mark QR code as used' };
  }
}

/**
 * Validate QR code (alias for validateConnectionCode for backward compatibility)
 */
export async function validateQRCode(code: string): Promise<QRConnectionData | null> {
  return validateConnectionCode(code);
}

/**
 * Track QR scan (for analytics)
 */
export async function trackQRScan(
  connectionCode: string,
  location?: { latitude: number; longitude: number },
  deviceInfo?: any
): Promise<void> {
  try {
    // Get the owner of the QR code
    const { data: codeData, error: codeError } = await supabase
      .from('connection_codes')
      .select('user_id')
      .eq('code', connectionCode)
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      logger.warn('Invalid connection code for tracking:', connectionCode);
      return;
    }

    const ownerUserId = codeData.user_id;

    // ✅ SECURITY FIX: Get current authenticated user for proper user isolation
    const { data: { user } } = await supabase.auth.getUser();
    const scannerUserId = user?.id; // This will be null for anonymous users

    // Generate unique scan ID
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store scan tracking with user isolation
    const { error: trackingError } = await supabase
      .from('qr_scan_tracking')
      .insert({
        scan_id: scanId,
        code: connectionCode,
        scanned_at: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          scanned_at: new Date().toISOString()
        } : null,
        device_info: deviceInfo || {
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }, // ✅ JSONB field - Supabase handles casting automatically
        user_id: ownerUserId, // ✅ User isolation - only owner can see their scan data
        session_id: getOrCreateSessionId()
      });

    if (trackingError) {
      logger.error('Failed to track QR scan:', trackingError);
    } else {
      logger.info('QR scan tracked successfully:', { scanId, connectionCode, ownerUserId });
    }

  } catch (error) {
    logger.error('Error tracking QR scan:', error);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('dislink_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('dislink_session_id', sessionId);
  }
  return sessionId;
}

async function sendInvitationEmail(
  email: string,
  qrData: QRConnectionData,
  invitationId: string
): Promise<void> {
  // In production, replace this with actual email service integration
  // Example services: SendGrid, Mailgun, AWS SES, etc.
  
  const registrationUrl = window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
    ? `https://dislinkboltv2duplicate.netlify.app/app/register?invitation=${invitationId}`
    : `http://localhost:3001/app/register?invitation=${invitationId}`;
  
  const emailSubject = `🤝 ${qrData.name} wants to connect with you on Dislink`;
  
  const emailBody = `
Hi there! 👋

${qrData.name}${qrData.jobTitle ? ` (${qrData.jobTitle}${qrData.company ? ` at ${qrData.company}` : ''})` : ''} scanned your QR code and would like to connect with you on Dislink!

🚀 Get Started:
Click the link below to create your Dislink account and automatically connect with ${qrData.name}:

${registrationUrl}

✨ What happens next:
1. Create your profile in under 2 minutes
2. Your connection with ${qrData.name} will be automatically established
3. Start building meaningful relationships with context and follow-ups

This invitation expires in 7 days.

---
Dislink - Building Meaningful Connections
${window.location.hostname === 'dislinkboltv2duplicate.netlify.app' ? 'https://dislinkboltv2duplicate.netlify.app' : 'http://localhost:3001'}
  `.trim();

  console.log('📧 Invitation email would be sent:');
  console.log('To:', email);
  console.log('Subject:', emailSubject);
  console.log('Body:', emailBody);
  
  // For now, we'll simulate email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.info('Invitation email sent successfully (simulated)', { email, invitationId });
      resolve();
    }, 1000);
  });
}
