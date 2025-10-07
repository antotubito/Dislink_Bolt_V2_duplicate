import { supabase } from './supabase';
import { logger } from './logger';
import { createOrUpdateProfile } from './profileCreation';
import type { User } from '../types/user';

// =====================================================
// INVITATION SERVICE - EMAIL HANDLING & REGISTRATION
// =====================================================

export interface InvitationData {
  invitationId: string;
  recipientEmail: string;
  senderUserId: string;
  connectionCode: string;
  scanData: any;
  emailSentAt: Date;
  expiresAt: Date;
  status: 'sent' | 'opened' | 'registered' | 'expired';
  registeredUserId?: string;
  registrationCompletedAt?: Date;
}

export interface RegistrationWithInvitation {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationId?: string;
  connectionCode?: string;
}

export interface InvitationResult {
  success: boolean;
  message: string;
  invitationId?: string;
  userId?: string;
}

// =====================================================
// INVITATION VALIDATION & PROCESSING
// =====================================================

/**
 * Validate invitation code and get invitation data
 */
export async function validateInvitationCode(
  invitationId: string,
  connectionCode?: string
): Promise<InvitationData | null> {
  try {
    logger.info('Validating invitation code:', { invitationId, connectionCode });

    let query = supabase
      .from('email_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('status', 'sent');

    if (connectionCode) {
      query = query.eq('connection_code', connectionCode);
    }

    const { data: invitation, error } = await query.single();

    if (error || !invitation) {
      logger.info('Invalid invitation code:', { invitationId, error: error?.message });
      return null;
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      logger.info('Invitation expired:', { invitationId, expiresAt: invitation.expires_at });
      
      // Update status to expired
      await supabase
        .from('email_invitations')
        .update({ status: 'expired' })
        .eq('invitation_id', invitationId);
      
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
      status: invitation.status,
      registeredUserId: invitation.registered_user_id,
      registrationCompletedAt: invitation.registration_completed_at 
        ? new Date(invitation.registration_completed_at) 
        : undefined
    };

  } catch (error) {
    logger.error('Error validating invitation code:', error);
    return null;
  }
}

/**
 * Process user registration with invitation
 * Creates user account and automatically establishes connection
 */
export async function processRegistrationWithInvitation(
  registrationData: RegistrationWithInvitation
): Promise<InvitationResult> {
  try {
    logger.info('Processing registration with invitation:', { 
      email: registrationData.email, 
      invitationId: registrationData.invitationId 
    });

    // Validate invitation if provided
    let invitationData: InvitationData | null = null;
    if (registrationData.invitationId) {
      invitationData = await validateInvitationCode(
        registrationData.invitationId, 
        registrationData.connectionCode
      );
      
      if (!invitationData) {
        return {
          success: false,
          message: 'Invalid or expired invitation code'
        };
      }

      // Verify email matches invitation
      if (invitationData.recipientEmail.toLowerCase() !== registrationData.email.toLowerCase()) {
        return {
          success: false,
          message: 'Email address does not match the invitation'
        };
      }
    }

    // Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: registrationData.email,
      password: registrationData.password,
      options: {
        data: {
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
          invitation_id: registrationData.invitationId
        }
      }
    });

    if (authError) {
      logger.error('Auth signup error:', authError);
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
      email: registrationData.email,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName
    });

    if (!profileResult.success) {
      logger.error('Profile creation error:', profileResult.error);
      // Note: User is created in auth but profile creation failed
      // This should be handled by the calling code
      return {
        success: false,
        message: 'Account created but profile setup failed. Please try logging in.'
      };
    }

    // Process invitation if provided
    if (invitationData) {
      const invitationResult = await linkInvitationToUser(
        invitationData.invitationId,
        userId
      );

      if (!invitationResult.success) {
        logger.warn('Failed to link invitation to user:', invitationResult.message);
        // Don't fail registration, just log the warning
      }
    }

    logger.info('Registration with invitation completed successfully:', { 
      userId, 
      invitationId: registrationData.invitationId 
    });

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      invitationId: registrationData.invitationId,
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
 * Link invitation to newly registered user
 * Creates connection request between users
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
    const { error: updateError } = await supabase
      .from('email_invitations')
      .update({
        status: 'registered',
        registered_user_id: newUserId,
        registration_completed_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationId);

    if (updateError) {
      logger.error('Failed to update invitation status:', updateError);
      return {
        success: false,
        message: 'Failed to process invitation'
      };
    }

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

    if (requestError) {
      logger.error('Failed to create connection request:', requestError);
      return {
        success: false,
        message: 'Failed to create connection request'
      };
    }

    logger.info('Invitation linked to user successfully:', { invitationId, newUserId });

    return {
      success: true,
      message: 'Connection request created successfully!'
    };

  } catch (error) {
    logger.error('Error linking invitation to user:', error);
    return {
      success: false,
      message: 'Failed to process invitation'
    };
  }
}

// =====================================================
// INVITATION MANAGEMENT
// =====================================================

/**
 * Get pending invitations for a user
 */
export async function getPendingInvitations(userId: string): Promise<InvitationData[]> {
  try {
    const { data: invitations, error } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('sender_user_id', userId)
      .eq('status', 'sent')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting pending invitations:', error);
      return [];
    }

    return (invitations || []).map(invitation => ({
      invitationId: invitation.invitation_id,
      recipientEmail: invitation.recipient_email,
      senderUserId: invitation.sender_user_id,
      connectionCode: invitation.connection_code,
      scanData: invitation.scan_data,
      emailSentAt: new Date(invitation.email_sent_at),
      expiresAt: new Date(invitation.expires_at),
      status: invitation.status,
      registeredUserId: invitation.registered_user_id,
      registrationCompletedAt: invitation.registration_completed_at 
        ? new Date(invitation.registration_completed_at) 
        : undefined
    }));

  } catch (error) {
    logger.error('Error getting pending invitations:', error);
    return [];
  }
}

/**
 * Cancel/expire an invitation
 */
export async function cancelInvitation(invitationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_invitations')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationId)
      .eq('sender_user_id', userId)
      .eq('status', 'sent');

    if (error) {
      logger.error('Error canceling invitation:', error);
      return false;
    }

    logger.info('Invitation canceled successfully:', { invitationId, userId });
    return true;

  } catch (error) {
    logger.error('Error canceling invitation:', error);
    return false;
  }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(invitationId: string, userId: string): Promise<InvitationResult> {
  try {
    // Get invitation data
    const { data: invitation, error: invitationError } = await supabase
      .from('email_invitations')
      .select('*')
      .eq('invitation_id', invitationId)
      .eq('sender_user_id', userId)
      .eq('status', 'sent')
      .single();

    if (invitationError || !invitation) {
      return {
        success: false,
        message: 'Invitation not found'
      };
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitation.expires_at)) {
      return {
        success: false,
        message: 'Invitation has expired'
      };
    }

    // Get sender profile for email content
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, job_title, company, profile_image')
      .eq('id', userId)
      .single();

    if (profileError || !senderProfile) {
      return {
        success: false,
        message: 'Sender profile not found'
      };
    }

    // Send email (in production, use real email service)
    await sendInvitationEmail(
      invitation.recipient_email,
      senderProfile,
      invitationId,
      invitation.connection_code
    );

    // Update email sent timestamp
    await supabase
      .from('email_invitations')
      .update({ 
        email_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('invitation_id', invitationId);

    return {
      success: true,
      message: 'Invitation email resent successfully'
    };

  } catch (error) {
    logger.error('Error resending invitation:', error);
    return {
      success: false,
      message: 'Failed to resend invitation'
    };
  }
}

// =====================================================
// EMAIL SERVICE (PRODUCTION INTEGRATION)
// =====================================================

async function sendInvitationEmail(
  email: string,
  senderProfile: any,
  invitationId: string,
  connectionCode: string
): Promise<void> {
  // In production, replace this with actual email service integration
  // Example services: SendGrid, Mailgun, AWS SES, etc.
  
  const registrationUrl = window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
    ? `https://dislinkboltv2duplicate.netlify.app/app/register?invitation=${invitationId}&code=${connectionCode}`
    : `http://localhost:3001/app/register?invitation=${invitationId}&code=${connectionCode}`;
  
  const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`.trim();
  const senderTitle = senderProfile.job_title ? ` (${senderProfile.job_title}${senderProfile.company ? ` at ${senderProfile.company}` : ''})` : '';
  
  const emailSubject = `🤝 ${senderName} wants to connect with you on Dislink`;
  
  const emailBody = `
Hi there! 👋

${senderName}${senderTitle} scanned your QR code and would like to connect with you on Dislink!

🚀 Get Started:
Click the link below to create your Dislink account and automatically connect with ${senderName}:

${registrationUrl}

✨ What happens next:
1. Create your profile in under 2 minutes
2. Your connection with ${senderName} will be automatically established
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
