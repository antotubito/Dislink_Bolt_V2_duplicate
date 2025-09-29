import { supabase } from './supabase';
import { logger } from './logger';
import type { QRCodeData, QRScanResult } from '../types/qr';

export interface QRScanTracking {
  scanId: string;
  code: string;
  scannedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
  };
  referrer?: string;
  sessionId: string;
}

export interface ConnectionMemory {
  id: string;
  fromUserId: string;
  toUserId: string;
  firstMeetingData: {
    scanTimestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      country?: string;
    };
    method: 'qr_scan' | 'manual' | 'email_invitation';
    deviceInfo?: {
      userAgent: string;
      platform: string;
      isMobile: boolean;
    };
  };
  connectionStatus: 'pending' | 'connected' | 'declined';
  emailInvitationSent?: Date;
  registrationCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailInvitationData {
  invitationId: string;
  recipientEmail: string;
  senderUserId: string;
  connectionCode: string;
  scanData: QRScanTracking;
  emailSentAt: Date;
  expiresAt: Date;
  status: 'sent' | 'opened' | 'registered' | 'expired';
}

// Enhanced QR code scanning with comprehensive tracking
export async function trackEnhancedQRScan(
  code: string,
  location?: { latitude: number; longitude: number },
  userId?: string
): Promise<QRScanTracking> {
  try {
    // Generate unique scan ID
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = getOrCreateSessionId();
    
    // Get device information
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'unknown',
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };

    // Reverse geocode location if provided
    let enhancedLocation = location;
    if (location) {
      try {
        const geocodeResult = await reverseGeocode(location.latitude, location.longitude);
        enhancedLocation = {
          ...location,
          address: geocodeResult.address,
          city: geocodeResult.city,
          country: geocodeResult.country
        };
      } catch (geocodeError) {
        logger.warn('Geocoding failed:', geocodeError);
      }
    }

    const scanData: QRScanTracking = {
      scanId,
      code,
      scannedAt: new Date(),
      location: enhancedLocation,
      deviceInfo,
      referrer: document.referrer || undefined,
      sessionId
    };

    // Store scan tracking data in database with user isolation
    const { error: trackingError } = await supabase
      .from('qr_scan_tracking')
      .insert({
        scan_id: scanId,
        code: code,
        scanned_at: scanData.scannedAt.toISOString(),
        location: enhancedLocation,
        device_info: deviceInfo,
        referrer: scanData.referrer,
        session_id: sessionId,
        user_id: userId // ✅ Add user isolation for privacy
      });

    if (trackingError) {
      logger.error('Failed to store scan tracking:', trackingError);
    }

    // Update connection codes table with scan information
    const { error: updateError } = await supabase
      .from('connection_codes')
      .update({
        last_scanned_at: scanData.scannedAt.toISOString(),
        scan_count: supabase.sql`scan_count + 1`,
        last_scan_location: enhancedLocation
      })
      .eq('code', code);

    if (updateError) {
      logger.error('Failed to update connection code scan data:', updateError);
    }

    logger.info('QR scan tracked successfully:', { scanId, code, location: enhancedLocation });
    return scanData;

  } catch (error) {
    logger.error('Error tracking QR scan:', error);
    throw error;
  }
}

// Send email invitation with connection tracking
export async function sendEmailInvitation(
  recipientEmail: string,
  senderUserId: string,
  scanData: QRScanTracking
): Promise<EmailInvitationData> {
  try {
    // Generate unique invitation ID and connection code
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connectionCode = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get sender profile for email content
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, company, profile_image')
      .eq('id', senderUserId)
      .single();

    if (profileError) throw profileError;

    const invitationData: EmailInvitationData = {
      invitationId,
      recipientEmail,
      senderUserId,
      connectionCode,
      scanData,
      emailSentAt: new Date(),
      expiresAt,
      status: 'sent'
    };

    // Store invitation in database
    const { error: invitationError } = await supabase
      .from('email_invitations')
      .insert({
        invitation_id: invitationId,
        recipient_email: recipientEmail,
        sender_user_id: senderUserId,
        connection_code: connectionCode,
        scan_data: scanData,
        email_sent_at: invitationData.emailSentAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'sent'
      });

    if (invitationError) throw invitationError;

    // Create email content
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`.trim();
    const senderTitle = senderProfile.job_title ? ` (${senderProfile.job_title}${senderProfile.company ? ` at ${senderProfile.company}` : ''})` : '';
    
    const emailSubject = `🤝 ${senderName} wants to connect with you on Dislink`;
    
    const registrationUrl = `${window.location.origin}/app/register?invitation=${invitationId}&code=${connectionCode}`;
    
    const emailBody = `
Hi there! 👋

${senderName}${senderTitle} scanned your QR code and would like to connect with you on Dislink!

📍 Meeting Details:
• Scanned on: ${scanData.scannedAt.toLocaleDateString()} at ${scanData.scannedAt.toLocaleTimeString()}
${scanData.location ? `• Location: ${scanData.location.address || `${scanData.location.latitude}, ${scanData.location.longitude}`}` : ''}
${scanData.location?.city ? `• City: ${scanData.location.city}` : ''}

🚀 Get Started:
Click the link below to create your Dislink account and automatically connect with ${senderName}:

${registrationUrl}

✨ What happens next:
1. Create your profile in under 2 minutes
2. Your connection with ${senderName} will be automatically established
3. Start building meaningful relationships with context and follow-ups

This invitation expires on ${expiresAt.toLocaleDateString()}.

---
Dislink - Building Meaningful Connections
${window.location.origin}
    `.trim();

    // Send email (in production, use a real email service like SendGrid, Mailgun, etc.)
    await sendEmail(recipientEmail, emailSubject, emailBody);

    logger.info('Email invitation sent successfully:', { invitationId, recipientEmail, senderUserId });
    return invitationData;

  } catch (error) {
    logger.error('Error sending email invitation:', error);
    throw error;
  }
}

// Create connection memory record
export async function createConnectionMemory(
  fromUserId: string,
  toUserId: string,
  scanData: QRScanTracking,
  method: 'qr_scan' | 'manual' | 'email_invitation' = 'qr_scan'
): Promise<ConnectionMemory> {
  try {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connectionMemory: ConnectionMemory = {
      id: memoryId,
      fromUserId,
      toUserId,
      firstMeetingData: {
        scanTimestamp: scanData.scannedAt,
        location: scanData.location,
        method,
        deviceInfo: scanData.deviceInfo
      },
      connectionStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store connection memory
    const { error } = await supabase
      .from('connection_memories')
      .insert({
        id: memoryId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        first_meeting_data: connectionMemory.firstMeetingData,
        connection_status: 'pending',
        created_at: connectionMemory.createdAt.toISOString(),
        updated_at: connectionMemory.updatedAt.toISOString()
      });

    if (error) throw error;

    logger.info('Connection memory created:', { memoryId, fromUserId, toUserId });
    return connectionMemory;

  } catch (error) {
    logger.error('Error creating connection memory:', error);
    throw error;
  }
}

// Update connection memory when user registers
export async function updateConnectionMemoryOnRegistration(
  invitationId: string,
  newUserId: string
): Promise<void> {
  try {
    // Get invitation data
    const { data: invitation, error: invitationError } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .single();

    if (invitationError) throw invitationError;
    if (!invitation) throw new Error('Invitation not found');

    // Update invitation status
    await supabase
      .from('email_invitations')
      .update({
        status: 'registered',
        registered_user_id: newUserId,
        registration_completed_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationId);

    // Find and update connection memory
    const { data: memory, error: memoryError } = await supabase
      .from('connection_memories')
      .select('*')
      .eq('from_user_id', invitation.sender_user_id)
      .eq('connection_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!memoryError && memory && memory.length > 0) {
      await supabase
        .from('connection_memories')
        .update({
          to_user_id: newUserId,
          connection_status: 'connected',
          registration_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', memory[0].id);
    }

    // Create actual connection between users
    await createUserConnection(invitation.sender_user_id, newUserId, {
      firstMeetingData: invitation.scan_data,
      connectionMethod: 'email_invitation',
      invitationId
    });

    logger.info('Connection memory updated on registration:', { invitationId, newUserId });

  } catch (error) {
    logger.error('Error updating connection memory on registration:', error);
    throw error;
  }
}

// Create user connection with first meeting context
export async function createUserConnection(
  fromUserId: string,
  toUserId: string,
  metadata: {
    firstMeetingData?: any;
    connectionMethod?: string;
    invitationId?: string;
  }
): Promise<void> {
  try {
    // Create connection request (always pending - requires manual approval)
    const { error: connectionError } = await supabase
      .from('connection_requests')
      .insert({
        user_id: toUserId,
        requester_id: fromUserId,
        status: 'pending', // ✅ Always require approval
        metadata: {
          ...metadata,
          autoAccepted: false, // ✅ Remove auto-acceptance
          reason: 'QR code scan connection'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (connectionError) throw connectionError;

    // ✅ Don't create contacts until approved
    // Contact creation will happen in the approval flow
    // This ensures all connections require explicit user consent

    logger.info('Connection request created successfully (pending approval):', { fromUserId, toUserId, metadata });

  } catch (error) {
    logger.error('Error creating user connection:', error);
    throw error;
  }
}

// Utility functions
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('dislink_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('dislink_session_id', sessionId);
  }
  return sessionId;
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    // Using OpenCage Geocoding API (replace with your preferred service)
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=demo&limit=1&no_annotations=1`
    );
    
    if (!response.ok) throw new Error('Geocoding request failed');
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        address: result.formatted,
        city: result.components.city || result.components.town || result.components.village,
        country: result.components.country
      };
    }
    
    throw new Error('No geocoding results');
  } catch (error) {
    logger.warn('Reverse geocoding failed:', error);
    return {
      address: `${latitude}, ${longitude}`,
      city: undefined,
      country: undefined
    };
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  // In production, replace this with actual email service integration
  // Example services: SendGrid, Mailgun, AWS SES, etc.
  
  console.log('📧 Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Body:', body);
  
  // For now, we'll simulate email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.info('Email sent successfully (simulated)', { to, subject });
      resolve();
    }, 1000);
  });
}

// Validate invitation and get connection data
export async function validateInvitationCode(
  invitationId: string,
  connectionCode: string
): Promise<EmailInvitationData | null> {
  try {
    const { data: invitation, error } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('connection_code', connectionCode)
      .eq('status', 'sent')
      .single();

    if (error || !invitation) {
      logger.info('Invalid or expired invitation:', { invitationId, connectionCode });
      return null;
    }

    // Check if expired
    if (new Date() > new Date(invitation.expires_at)) {
      logger.info('Invitation expired:', { invitationId, expiresAt: invitation.expires_at });
      return null;
    }

    return {
      invitationId: invitation.invitation_id,
      recipientEmail: invitation.recipient_email,
      senderUserId: invitation.sender_user_id,
      connectionCode: invitation.connection_code,
      scanData: invitation.scan_data,
      emailSentAt: new Date(invitation.email_sent_at),
      expiresAt: new Date(invitation.expires_at),
      status: invitation.status
    };

  } catch (error) {
    logger.error('Error validating invitation code:', error);
    return null;
  }
}

// Get connection memories for a user
export async function getUserConnectionMemories(userId: string): Promise<ConnectionMemory[]> {
  try {
    const { data, error } = await supabase
      .from('connection_memories')
      .select(`
        *,
        from_user:profiles!connection_memories_from_user_id_fkey(first_name, last_name, profile_image),
        to_user:profiles!connection_memories_to_user_id_fkey(first_name, last_name, profile_image)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      firstMeetingData: row.first_meeting_data,
      connectionStatus: row.connection_status,
      emailInvitationSent: row.email_invitation_sent ? new Date(row.email_invitation_sent) : undefined,
      registrationCompletedAt: row.registration_completed_at ? new Date(row.registration_completed_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

  } catch (error) {
    logger.error('Error getting user connection memories:', error);
    return [];
  }
}
