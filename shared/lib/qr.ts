import { supabase } from './supabase';
import { logger } from './logger';
import type { QRCodeData, QRScanResult, ConnectionData } from '../types/qr';

// Generate a unique QR code for a user - creates a unique scan URL for each generation
export async function generateQRCode(userId: string): Promise<string> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, company, profile_image, public_profile')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Generate a UNIQUE scan code for THIS specific QR generation
    // This ensures each QR code tracks a specific moment/intent
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    const connectionCode = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a unique connection code for THIS scan
    const { data: newCode, error: codeError } = await supabase
      .from('connection_codes')
      .insert({
        user_id: userId,
        code: connectionCode,
        is_active: true,
        created_at: new Date().toISOString(),
        scan_count: 0,
        // This code expires after 24 hours to prevent sharing
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('code')
      .single();

    if (codeError) throw codeError;
    if (!newCode) throw new Error('Failed to generate connection code');

    // Create initial scan tracking entry for this unique QR
    const { error: trackingError } = await supabase
      .from('qr_scan_tracking')
      .insert({
        scan_id: scanId,
        code: connectionCode,
        scanned_at: new Date().toISOString(),
        device_info: {
          generated_at: new Date().toISOString(),
          purpose: 'qr_generation',
          user_id: userId
        },
        session_id: scanId
      });

    if (trackingError) {
      logger.warn('Failed to create initial tracking entry:', trackingError);
    }

    // Return the unique scan URL that includes the scan ID
    const uniqueScanUrl = `${window.location.origin}/scan/${scanId}?code=${connectionCode}`;
    logger.info('Generated UNIQUE QR code URL:', {
      url: uniqueScanUrl,
      userId,
      code: connectionCode,
      scanId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return uniqueScanUrl;
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw error;
  }
}

// Validate a QR code and return user profile if valid
export async function validateQRCode(code: string): Promise<QRScanResult | null> {
  try {
    logger.info('Validating QR code:', { code });

    // Extract code from URL if it's a full URL
    let connectionCode = code;

    // Check if it's a URL (starts with http or is a path)
    if (code.startsWith('http') || code.startsWith('/')) {
      // Extract the code from URL patterns like:
      // - https://domain.com/share/qr_123456789
      // - https://domain.com/scan/scan_123?code=qr_456
      // - /share/qr_123456789
      // - /scan/scan_123?code=qr_456

      // First try to extract from /scan/ URLs with query parameters
      const scanUrlMatch = code.match(/\/scan\/[^?]+\?code=([^&]+)/);
      if (scanUrlMatch) {
        connectionCode = scanUrlMatch[1];
        logger.info('Extracted connection code from scan URL:', { originalCode: code, extractedCode: connectionCode });
      } else {
        // Try to extract from /share/ URLs
        const shareUrlMatch = code.match(/\/share\/([^/?]+)/);
        if (shareUrlMatch) {
          connectionCode = shareUrlMatch[1];
          logger.info('Extracted connection code from share URL:', { originalCode: code, extractedCode: connectionCode });
        } else {
          logger.warn('URL format not recognized:', { code });
          return null;
        }
      }
    }

    // First try to parse the code as JSON (for legacy QR codes)
    try {
      const qrData = JSON.parse(connectionCode);

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
    return await validateConnectionCode(connectionCode);
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
        is_active,
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
      .eq('is_active', true)
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
      isExpired: !connectionCode.is_active, // Use is_active field
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