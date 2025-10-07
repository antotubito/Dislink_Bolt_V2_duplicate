import { supabase } from './supabase';
import { logger } from './logger';
import type { User } from '../types/user';

// =====================================================
// QR CODE CONNECTION & INVITATION SYSTEM
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

export interface QRScanResult {
  success: boolean;
  data?: QRConnectionData;
  error?: string;
}

// =====================================================
// QR CODE GENERATION & TRACKING
// =====================================================

/**
 * Generate a unique QR code for a user's public profile
 * Creates a unique connection code and public profile URL
 */
export async function generateUserQRCode(userId: string): Promise<QRConnectionData> {
  try {
    logger.info('Generating QR code for user:', { userId });

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Generate unique connection code
    const connectionCode = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create or update connection code in database with one-time use tracking
    const { data: codeData, error: codeError } = await supabase
      .from('connection_codes')
      .upsert({
        user_id: userId,
        code: connectionCode,
        is_active: true,
        status: 'active', // active, used, expired
        scan_count: 0,
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
      userId, 
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
      .select('id, status, scan_count, scanned_by')
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
    if (existingCode.status === 'used') {
      return { success: false, error: 'QR code has already been used' };
    }

    // Mark as used and update scan tracking
    const { error: updateError } = await supabase
      .from('connection_codes')
      .update({
        status: 'used',
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
      const { error: trackingError } = await supabase
        .from('qr_scan_tracking')
        .insert({
          code: connectionCode,
          user_id: existingCode.id,
          scanner_user_id: scannerUserId,
          scanned_at: new Date().toISOString(),
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date().toISOString()
          } : null,
          device_info: deviceInfo || {},
          session_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      if (trackingError) {
        logger.warn('Failed to create detailed scan tracking:', trackingError);
      }
    }

    logger.info('QR code marked as used successfully:', { connectionCode });
    return { success: true };

  } catch (error) {
    logger.error('Error marking QR code as used:', error);
    return { success: false, error: 'Internal error' };
  }
}

/**
 * Track QR code scan with user isolation
 * Stores scan data with proper user_id for privacy
 */
export async function trackQRScan(
  connectionCode: string,
  scannerUserId?: string,
  location?: { latitude: number; longitude: number },
  deviceInfo?: any
): Promise<void> {
  try {
    logger.info('Tracking QR scan:', { connectionCode, scannerUserId, location });

    // Get the owner of the QR code
    const { data: codeData, error: codeError } = await supabase
      .from('connection_codes')
      .select('user_id')
      .eq('code', connectionCode)
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      throw new Error('Invalid or expired connection code');
    }

    const ownerUserId = codeData.user_id;

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
        },
        user_id: ownerUserId, // ✅ User isolation - only owner can see their scan data
        scanner_user_id: scannerUserId, // Optional - for authenticated scanners
        session_id: getOrCreateSessionId()
      });

    if (trackingError) {
      logger.error('Failed to track QR scan:', trackingError);
      throw trackingError;
    }

    // Update connection code scan count
    await supabase
      .from('connection_codes')
      .update({
        scan_count: supabase.sql`scan_count + 1`,
        last_scanned_at: new Date().toISOString(),
        last_scan_location: location
      })
      .eq('code', connectionCode);

    logger.info('QR scan tracked successfully:', { scanId, connectionCode, ownerUserId });

  } catch (error) {
    logger.error('Error tracking QR scan:', error);
    throw error;
  }
}

/**
 * Validate connection code and return user profile data
 */
export async function validateConnectionCode(code: string): Promise<QRConnectionData | null> {
  try {
    logger.info('Validating connection code:', { code });

    // Get connection code and associated profile
    const { data: connectionData, error } = await supabase
      .from('connection_codes')
      .select(`
        *,
        profiles!connection_codes_user_id_fkey (
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
        )
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !connectionData) {
      logger.info('Invalid or expired connection code:', { code });
      return null;
    }

    // Check if code is expired
    if (new Date() > new Date(connectionData.expires_at)) {
      logger.info('Connection code expired:', { code, expiresAt: connectionData.expires_at });
      return null;
    }

    // Note: We don't check for 'used' status here because we want to allow
    // the markQRCodeAsUsed function to handle the one-time use logic

    const profile = connectionData.profiles;
    if (!profile) {
      logger.error('Profile not found for connection code:', { code });
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

    logger.info('Connection code validated successfully:', { code, userId: profile.id });
    return qrData;

  } catch (error) {
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
        sender_user_id: qrData.userId,
        connection_code: connectionCode,
        scan_data: {
          location: invitationData.location,
          message: invitationData.message,
          submitted_at: new Date().toISOString()
        },
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
      .eq('user_id', targetUserId)
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

    // Create new connection request
    const { error: requestError } = await supabase
      .from('connection_requests')
      .insert({
        user_id: targetUserId,
        requester_id: requesterUserId,
        status: 'pending',
        metadata: {
          location: invitationData.location,
          message: invitationData.message,
          method: 'qr_invitation',
          submitted_at: new Date().toISOString()
        },
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

/**
 * Link invitation to newly registered user
 * Called when user completes registration with invitation
 */
export async function linkInvitationToUser(
  invitationId: string,
  newUserId: string
): Promise<InvitationResult> {
  try {
    logger.info('Linking invitation to user:', { invitationId, newUserId });

    // Get invitation data
    const { data: invitation, error: invitationError } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('status', 'sent')
      .single();

    if (invitationError || !invitation) {
      return {
        success: false,
        message: 'Invalid or expired invitation'
      };
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return {
        success: false,
        message: 'Invitation has expired'
      };
    }

    // Update invitation status
    await supabase
      .from('email_invitations')
      .update({
        status: 'registered',
        registered_user_id: newUserId,
        registration_completed_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationId);

    // Create connection request
    const { error: requestError } = await supabase
      .from('connection_requests')
      .insert({
        user_id: invitation.sender_user_id,
        requester_id: newUserId,
        status: 'pending',
        metadata: {
          ...invitation.scan_data,
          method: 'email_invitation',
          invitation_id: invitationId,
          registered_at: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (requestError) throw requestError;

    logger.info('Invitation linked to user successfully:', { invitationId, newUserId });

    return {
      success: true,
      message: 'Connection request created! The person will be notified.'
    };

  } catch (error) {
    logger.error('Error linking invitation to user:', error);
    return {
      success: false,
      message: 'Failed to process invitation. Please try again.'
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get QR scan statistics for a user
 */
export async function getQRScanStats(userId: string): Promise<{
  totalScans: number;
  recentScans: any[];
  lastScanDate?: Date;
}> {
  try {
    const { data: scans, error } = await supabase
      .from('qr_scan_tracking')
      .select('*')
      .eq('user_id', userId)
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
 * Get pending invitations for a user
 */
export async function getPendingInvitations(userId: string): Promise<any[]> {
  try {
    const { data: invitations, error } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('sender_user_id', userId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return invitations || [];

  } catch (error) {
    logger.error('Error getting pending invitations:', error);
    return [];
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

  console.log('📧 Email would be sent:');
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
