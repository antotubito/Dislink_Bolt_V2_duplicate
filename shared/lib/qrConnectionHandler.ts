import { supabase } from './supabase';
import { logger } from './logger';
import { 
  updateConnectionMemoryOnRegistration, 
  createUserConnection 
} from './qrEnhanced';

export interface PendingQRConnection {
  invitationData?: any;
  qrConnectionData?: any;
  userEmail: string;
}

// Handle QR connection completion after user registration and email verification
export async function completeQRConnection(userId: string): Promise<void> {
  try {
    // Check for pending QR connection data
    const pendingConnectionData = localStorage.getItem('pending_qr_connection');
    if (!pendingConnectionData) {
      logger.info('No pending QR connection found');
      return;
    }

    const connectionData: PendingQRConnection = JSON.parse(pendingConnectionData);
    logger.info('Processing pending QR connection:', { userId, connectionData });

    // Handle email invitation connection
    if (connectionData.invitationData) {
      await handleEmailInvitationConnection(userId, connectionData.invitationData);
    }

    // Handle direct QR scan connection
    if (connectionData.qrConnectionData) {
      await handleDirectQRScanConnection(userId, connectionData.qrConnectionData);
    }

    // Clean up stored data
    localStorage.removeItem('pending_qr_connection');
    localStorage.removeItem('qr_registration_data');

    logger.info('QR connection completed successfully');

  } catch (error) {
    logger.error('Error completing QR connection:', error);
    throw error;
  }
}

// Handle connection from email invitation
async function handleEmailInvitationConnection(userId: string, invitationData: any): Promise<void> {
  try {
    // Update invitation status
    await updateConnectionMemoryOnRegistration(invitationData.invitationId, userId);

    // Create notification for the sender
    await createConnectionNotification(
      invitationData.senderUserId,
      userId,
      'invitation_accepted',
      {
        invitationId: invitationData.invitationId,
        scanData: invitationData.scanData
      }
    );

    logger.info('Email invitation connection completed:', { 
      invitationId: invitationData.invitationId, 
      userId 
    });

  } catch (error) {
    logger.error('Error handling email invitation connection:', error);
    throw error;
  }
}

// Handle connection from direct QR scan
async function handleDirectQRScanConnection(userId: string, qrConnectionData: any): Promise<void> {
  try {
    const { scannedProfile, scanData } = qrConnectionData;

    // Create user connection with first meeting context
    await createUserConnection(scannedProfile.userId, userId, {
      firstMeetingData: scanData,
      connectionMethod: 'qr_scan_direct'
    });

    // Create notification for the scanned user
    await createConnectionNotification(
      scannedProfile.userId,
      userId,
      'qr_scan_connection',
      {
        scanData,
        connectionMethod: 'qr_scan_direct'
      }
    );

    logger.info('Direct QR scan connection completed:', { 
      scannedUserId: scannedProfile.userId, 
      newUserId: userId 
    });

  } catch (error) {
    logger.error('Error handling direct QR scan connection:', error);
    throw error;
  }
}

// Create connection notification
async function createConnectionNotification(
  recipientUserId: string,
  connectedUserId: string,
  type: 'invitation_accepted' | 'qr_scan_connection',
  metadata: any
): Promise<void> {
  try {
    // Get connected user profile for notification content
    const { data: connectedUser, error: userError } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_image, job_title, company')
      .eq('id', connectedUserId)
      .single();

    if (userError) throw userError;

    const notificationTitle = type === 'invitation_accepted' 
      ? '🎉 Connection Accepted!' 
      : '🤝 New QR Connection!';

    const notificationMessage = type === 'invitation_accepted'
      ? `${connectedUser.first_name} ${connectedUser.last_name} joined Dislink and accepted your connection!`
      : `${connectedUser.first_name} ${connectedUser.last_name} joined Dislink through your QR code!`;

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        type: 'connection',
        title: notificationTitle,
        message: notificationMessage,
        data: {
          connectedUserId,
          connectionType: type,
          metadata,
          connectedUserProfile: {
            name: `${connectedUser.first_name} ${connectedUser.last_name}`,
            profileImage: connectedUser.profile_image,
            jobTitle: connectedUser.job_title,
            company: connectedUser.company
          }
        },
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) throw notificationError;

    logger.info('Connection notification created:', { recipientUserId, connectedUserId, type });

  } catch (error) {
    logger.error('Error creating connection notification:', error);
    // Don't throw - notification failure shouldn't break the connection process
  }
}

// Get user's QR connections history
export async function getUserQRConnections(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('connection_memories')
      .select(`
        *,
        from_user:profiles!connection_memories_from_user_id_fkey(first_name, last_name, profile_image, job_title, company),
        to_user:profiles!connection_memories_to_user_id_fkey(first_name, last_name, profile_image, job_title, company)
      `)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('connection_status', 'connected')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(connection => ({
      ...connection,
      isFromUser: connection.from_user_id === userId,
      connectedUser: connection.from_user_id === userId ? connection.to_user : connection.from_user,
      firstMeetingLocation: connection.first_meeting_data?.location,
      firstMeetingTime: new Date(connection.first_meeting_data?.scanTimestamp || connection.created_at),
      connectionMethod: connection.first_meeting_data?.method || 'unknown'
    }));

  } catch (error) {
    logger.error('Error getting user QR connections:', error);
    return [];
  }
}

// Check if users are connected via QR
export async function areUsersConnectedViaQR(userId1: string, userId2: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('connection_memories')
      .select('id')
      .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
      .eq('connection_status', 'connected')
      .limit(1);

    if (error) throw error;

    return (data && data.length > 0);

  } catch (error) {
    logger.error('Error checking QR connection:', error);
    return false;
  }
}

// Get QR connection details between two users
export async function getQRConnectionDetails(userId1: string, userId2: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('connection_memories')
      .select('*')
      .or(`and(from_user_id.eq.${userId1},to_user_id.eq.${userId2}),and(from_user_id.eq.${userId2},to_user_id.eq.${userId1})`)
      .eq('connection_status', 'connected')
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      firstMeetingData: data.first_meeting_data,
      connectionStatus: data.connection_status,
      createdAt: new Date(data.created_at),
      registrationCompletedAt: data.registration_completed_at ? new Date(data.registration_completed_at) : null,
      location: data.first_meeting_data?.location,
      meetingTime: new Date(data.first_meeting_data?.scanTimestamp || data.created_at),
      connectionMethod: data.first_meeting_data?.method || 'unknown'
    };

  } catch (error) {
    logger.error('Error getting QR connection details:', error);
    return null;
  }
}
