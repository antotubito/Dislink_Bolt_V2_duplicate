import { supabase } from './supabase';
import { logger } from './logger';
import { sendConnectionRequestEmail } from './emailService';
import type { QRCodeData, QRScanResult, ConnectionData } from '../types/qr';

// Generate a unique QR code for a user
export async function generateQRCode(userId: string): Promise<string> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    logger.info('Generating QR code for user', { userId });

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, company, profile_image, public_profile')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Check if user already has an active QR code
    const { data: existingCode, error: existingError } = await supabase
      .from('connection_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    let connectionCode;

    if (existingCode) {
      // Use existing active code
      connectionCode = existingCode;
      logger.info('Using existing QR code', { userId, code: existingCode.code });
    } else {
      // Generate a new unique code
      const { data: newCode, error: codeError } = await supabase
        .from('connection_codes')
        .insert({
          user_id: userId,
          status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (codeError) throw codeError;
      if (!newCode) throw new Error('Failed to generate connection code');

      connectionCode = newCode;
      logger.info('Generated new QR code', { userId, code: newCode.code });
    }

    // Create minimal QR code data - only include essential identifiers
    const qrData: QRCodeData = {
      c: connectionCode.code, // code
      n: `${profile.first_name} ${profile.last_name}`.trim(), // name
      j: profile.job_title || undefined, // job title
      o: profile.company || undefined, // organization
      t: Date.now() // timestamp
    };

    return JSON.stringify(qrData);
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw error;
  }
}

// Validate a QR code and return user profile if valid
export async function validateQRCode(code: string): Promise<QRScanResult | null> {
  try {
    logger.info('Validating QR code:', { code });

    // First try to parse the code as JSON (for direct QR code data)
    try {
      const qrData = JSON.parse(code);
      
      // If it's a QR code data object with the expected format
      if (qrData && qrData.c) {
        // Use the embedded code to look up the connection code
        return await validateConnectionCode(qrData.c);
      }
    } catch (parseError) {
      // Not JSON, try as direct connection code
      logger.debug('Code is not JSON format, trying as direct connection code');
    }
    
    // If not JSON or missing required fields, try as a direct connection code
    return await validateConnectionCode(code);
  } catch (error) {
    // Log error but don't throw - return null for invalid codes
    logger.error('Error validating QR code:', error);
    return null;
  }
}

// Helper function to validate a connection code
async function validateConnectionCode(code: string): Promise<QRScanResult | null> {
  try {
    logger.debug('Validating connection code:', { code });

    // Get code data and associated profile
    const { data: connectionCode, error } = await supabase
      .from('connection_codes')
      .select(`
        id,
        user_id,
        status,
        expires_at,
        profiles!connection_codes_user_id_fkey (
          id,
          first_name,
          last_name,
          job_title,
          company,
          profile_image,
          bio,
          social_links,
          interests,
          public_profile
        )
      `)
      .eq('code', code)
      .eq('status', 'active')
      .maybeSingle();

    // Handle query errors
    if (error) {
      logger.error('Database error while validating connection code:', error);
      return null;
    }

    // Handle no results found
    if (!connectionCode) {
      logger.info('No active connection code found:', { code });
      return null;
    }

    // Check if code is expired
    if (new Date(connectionCode.expires_at) < new Date()) {
      logger.info('Connection code expired:', { code, expires_at: connectionCode.expires_at });
      
      // Mark as expired
      await supabase
        .from('connection_codes')
        .update({ status: 'expired' })
        .eq('code', code);
      
      return null;
    }

    // Ensure profile data exists
    if (!connectionCode.profiles) {
      logger.error('Profile not found for connection code:', { code });
      return null;
    }

    return {
      userId: connectionCode.profiles.id,
      name: `${connectionCode.profiles.first_name} ${connectionCode.profiles.last_name}`.trim(),
      jobTitle: connectionCode.profiles.job_title,
      company: connectionCode.profiles.company,
      profileImage: connectionCode.profiles.profile_image,
      bio: connectionCode.profiles.bio,
      socialLinks: connectionCode.profiles.social_links,
      interests: connectionCode.profiles.interests,
      publicProfile: connectionCode.profiles.public_profile,
      isExpired: false,
      code: code,
      codeId: connectionCode.id
    };
  } catch (error) {
    logger.error('Error validating connection code:', error);
    return null;
  }
}

// Get public profile URL
export function getPublicProfileUrl(code: string): string {
  return `${window.location.origin}/share/${code}`;
}

// Track QR code scan with location and analytics
export async function trackQRCodeScan(
  code: string,
  location?: { latitude: number; longitude: number },
  scanMethod: string = 'camera'
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update the connection code scan info
    const { error: updateError } = await supabase
      .from('connection_codes')
      .update({
        scanned_at: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          scanned_at: new Date().toISOString()
        } : null
      })
      .eq('code', code);

    if (updateError) {
      logger.error('Error updating connection code scan info:', updateError);
    }

    // Log scan event for analytics
    const { error: analyticsError } = await supabase
      .from('qr_scan_events')
      .insert({
        code_id: null, // Will be updated if we can resolve the code ID
        scanner_id: user?.id || null,
        scan_location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString()
        } : null,
        scan_method: scanMethod,
        device_info: typeof window !== 'undefined' ? {
          user_agent: navigator.userAgent,
          screen_width: window.screen.width,
          screen_height: window.screen.height
        } : null,
        success: true
      });

    if (analyticsError) {
      logger.error('Error logging scan analytics:', analyticsError);
    }
    
    logger.info('QR code scan tracked successfully', { code, location, scanMethod });
  } catch (error) {
    logger.error('Error tracking QR code scan:', error);
    throw error;
  }
}

// Create a connection request with email notification
export async function createConnectionRequest(
  code: string,
  requesterId: string,
  location?: { latitude: number; longitude: number; name?: string }
): Promise<ConnectionData> {
  try {
    logger.info('Creating connection request', { code, requesterId, location });

    // Validate the QR code first
    const qrData = await validateQRCode(code);
    if (!qrData) {
      throw new Error('Invalid QR code');
    }
    
    // Track the scan with location data
    await trackQRCodeScan(code, location);

    // Get requester profile for email
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requesterProfile) {
      throw new Error('Requester profile not found');
    }

    // Get target user profile for email
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', qrData.userId)
      .single();

    if (targetError || !targetProfile) {
      throw new Error('Target profile not found');
    }

    // Check if connection request already exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('connection_requests')
      .select('id, status')
      .eq('user_id', qrData.userId)
      .eq('requester_id', requesterId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingRequest) {
      return {
        success: true,
        message: `Connection request already sent to ${qrData.name}`,
        connectionId: existingRequest.id
      };
    }
    
    // Create connection request
    const { data: request, error } = await supabase
      .from('connection_requests')
      .insert({
        user_id: qrData.userId,
        requester_id: requesterId,
        code_id: qrData.codeId,
        status: 'pending',
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name
        } : null
      })
      .select()
      .single();

    if (error) throw error;
    if (!request) throw new Error('Failed to create connection request');

    // Send email notification to target user
    try {
      await sendConnectionRequestEmail({
        requesterName: `${requesterProfile.first_name} ${requesterProfile.last_name}`.trim(),
        requesterEmail: requesterProfile.email,
        targetName: `${targetProfile.first_name} ${targetProfile.last_name}`.trim(),
        targetEmail: targetProfile.email,
        connectionCode: request.id,
        location: location
      });
      logger.info('Connection request email sent', { requestId: request.id });
    } catch (emailError) {
      logger.error('Failed to send connection request email:', emailError);
      // Don't fail the request if email fails
    }

    // Create notification in database
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: qrData.userId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${requesterProfile.first_name} ${requesterProfile.last_name} wants to connect with you`,
          data: {
            request_id: request.id,
            requester_id: requesterId,
            requester_name: `${requesterProfile.first_name} ${requesterProfile.last_name}`.trim(),
            location: location
          }
        });
    } catch (notificationError) {
      logger.error('Failed to create notification:', notificationError);
    }

    return {
      success: true,
      message: `Connection request sent to ${qrData.name}`,
      connectionId: request.id
    };
  } catch (error) {
    logger.error('Error creating connection request:', error);
    throw error;
  }
}

// Request connection using QR code (for non-users)
export async function requestConnection(
  code: string,
  email: string,
  location?: { latitude: number; longitude: number }
): Promise<{ success: boolean; connectionCode: string }> {
  try {
    // First validate the QR code
    const qrData = await validateQRCode(code);
    if (!qrData || qrData.isExpired) {
      throw new Error('Invalid or expired QR code');
    }

    // Track the scan
    await trackQRCodeScan(code, location, 'guest');

    // Generate a unique connection code for the guest
    const { data: connectionCode, error: codeError } = await supabase
      .from('connection_codes')
      .insert({
        user_id: qrData.userId,
        status: 'active'
      })
      .select()
      .single();

    if (codeError) throw codeError;
    if (!connectionCode) throw new Error('Failed to generate connection code');

    // Send email with connection code (this would be for guest users)
    logger.info('Sending connection code email to guest:', email, 'Code:', connectionCode.code);

    return {
      success: true,
      connectionCode: connectionCode.code
    };
  } catch (error) {
    logger.error('Error requesting connection:', error);
    throw error;
  }
}

// Cleanup expired QR codes (run as a scheduled job)
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('connection_codes')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active')
      .select('id');

    if (error) throw error;

    const cleanedCount = data?.length || 0;
    logger.info('Cleaned up expired QR codes', { count: cleanedCount });
    
    return cleanedCount;
  } catch (error) {
    logger.error('Error cleaning up expired codes:', error);
    return 0;
  }
}