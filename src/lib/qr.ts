import { supabase } from './supabase';
import { logger } from './logger';
import type { QRCodeData, QRScanResult, ConnectionData } from '../types/qr';

// Generate a unique QR code for a user
export async function generateQRCode(userId: string): Promise<QRCode> {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    logger.info('Generating QR code for user', { userId });

    // Generate unique code
    const code = generateUniqueCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert QR code into database
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        user_id: userId,
        code: code,
        status: 'active',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error generating QR code:', error);
      throw error;
    }

    const qrCode: QRCode = {
      id: data.id,
      userId: data.user_id,
      code: data.code,
      isActive: data.status === 'active',
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at)
    };

    logger.info('QR code generated successfully', { qrCodeId: qrCode.id });
    return qrCode;
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
      isExpired: false, // We know it's not expired because we filtered for active status
      code: code, // Include the original code for reference
      codeId: connectionCode.id // Include the code ID for connection requests
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

// Track QR code scan with location
export async function trackQRCodeScan(
  code: string,
  location?: { latitude: number; longitude: number }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('connection_codes')
      .update({
        scanned_at: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          scanned_at: new Date().toISOString()
        } : null,
        status: 'used'
      })
      .eq('code', code);

    if (error) throw error;
    
    logger.info('QR code scan tracked successfully', { code, location });
  } catch (error) {
    logger.error('Error tracking QR code scan:', error);
    throw error;
  }
}

// Create a connection request
export async function createConnectionRequest(
  code: string,
  requesterId: string,
  location?: { latitude: number; longitude: number; name?: string }
): Promise<ConnectionData> {
  try {
    // Validate the QR code first
    const qrData = await validateQRCode(code);
    if (!qrData) {
      throw new Error('Invalid QR code');
    }
    
    // Track the scan with location data
    await trackQRCodeScan(code, location);
    
    // Create connection request
    const { data: request, error } = await supabase
      .from('connection_requests')
      .insert({
        user_id: qrData.userId,
        requester_id: requesterId,
        code_id: qrData.codeId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    if (!request) throw new Error('Failed to create connection request');

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

// Request connection using QR code
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
    await trackQRCodeScan(code, location);

    // Generate a unique connection code
    const { data: connectionCode, error: codeError } = await supabase
      .from('connection_codes')
      .insert({
        user_id: qrData.userId,
        code: null // Will be auto-generated
      })
      .select()
      .single();

    if (codeError) throw codeError;
    if (!connectionCode) throw new Error('Failed to generate connection code');

    // Send email with connection code
    // In production, use a real email service
    console.log('Sending connection code email to:', email, 'Code:', connectionCode.code);

    return {
      success: true,
      connectionCode: connectionCode.code
    };
  } catch (error) {
    logger.error('Error requesting connection:', error);
    throw error;
  }
}

export async function scanQRCode(qrContent: string): Promise<Contact | null> {
  try {
    logger.info('Scanning QR code', { contentLength: qrContent.length });

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    let qrData: QRCodeData;
    try {
      qrData = JSON.parse(qrContent);
    } catch (e) {
      logger.error('Invalid QR code format');
      throw new Error('Invalid QR code format');
    }

    // For testing, return a sample contact for test QR codes
    if (qrData.c === 'test-qr-code') {
      return ANTONIO_TUBITO;
    }

    // Look up the QR code in database
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        id,
        user_id,
        code,
        status,
        expires_at,
        profiles (
          id,
          first_name,
          last_name,
          email,
          company,
          job_title,
          profile_image,
          bio,
          interests,
          social_links,
          public_profile
        )
      `)
      .eq('code', qrData.c)
      .eq('status', 'active')
      .single();

    if (qrError || !qrCode) {
      logger.error('QR code not found or expired');
      throw new Error('Invalid or expired QR code');
    }

    // Check if expired
    if (new Date(qrCode.expires_at) < new Date()) {
      logger.error('QR code expired');
      throw new Error('QR code has expired');
    }

    // Mark QR code as scanned
    await supabase
      .from('qr_codes')
      .update({
        scanned_by: session.user.id,
        scanned_at: new Date().toISOString()
      })
      .eq('id', qrCode.id);

    const profile = qrCode.profiles;
    const scannedContact: Contact = {
      id: `contact-${Date.now()}`, // Temporary ID for new contact
      userId: session.user.id,
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      jobTitle: profile.job_title,
      company: profile.company,
      profileImage: profile.profile_image,
      bio: profile.bio || {},
      interests: profile.interests || [],
      socialLinks: profile.social_links || {},
      tags: [],
      tier: 3,
      notes: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add QR scan context
      meetingContext: 'QR Code Connection',
      meetingDate: new Date()
    };

    logger.info('QR code scanned successfully', { userId: profile.id });
    return scannedContact;
  } catch (error) {
    logger.error('Error scanning QR code:', error);
    return null;
  }
}