import { supabase } from './supabase';
import type { User } from '../types/user';
import type { Contact, Note, FollowUp } from '../types/contact';
import { logger } from './logger';

// Dynamic contact functions that use Supabase
export async function listContacts(): Promise<Contact[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contacts:', error);
      return [];
    }

    return contacts.map(contact => ({
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio || {},
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier || 3,
      notes: contact.notes || [],
      followUps: contact.follow_ups || [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    }));
  } catch (error) {
    logger.error('Error in listContacts:', error);
    return [];
  }
}

export async function listRecentContacts(limit: number = 10): Promise<Contact[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching recent contacts:', error);
      return [];
    }

    return contacts.map(contact => ({
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio || {},
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier || 3,
      notes: contact.notes || [],
      followUps: contact.follow_ups || [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    }));
  } catch (error) {
    logger.error('Error in listRecentContacts:', error);
    return [];
  }
}

export async function getContactById(id: string): Promise<Contact | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      logger.error('Error fetching contact:', error);
      return null;
    }

    return {
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio || {},
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier || 3,
      notes: contact.notes || [],
      followUps: contact.follow_ups || [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    };
  } catch (error) {
    logger.error('Error in getContactById:', error);
    return null;
  }
}

export async function createContact(contactData: Partial<Contact>): Promise<Contact> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        user_id: session.user.id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        job_title: contactData.jobTitle,
        company: contactData.company,
        profile_image: contactData.profileImage,
        cover_image: contactData.coverImage,
        bio: contactData.bio,
        interests: contactData.interests,
        social_links: contactData.socialLinks,
        meeting_date: contactData.meetingDate?.toISOString(),
        meeting_location: contactData.meetingLocation,
        meeting_context: contactData.meetingContext,
        tags: contactData.tags,
        tier: contactData.tier || 3,
        notes: contactData.notes || [],
        follow_ups: contactData.followUps || []
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }

    return {
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio || {},
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier || 3,
      notes: contact.notes || [],
      followUps: contact.follow_ups || [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    };
  } catch (error) {
    logger.error('Error in createContact:', error);
    throw error;
  }
}

export async function addNote(contactId: string, note: Omit<Note, 'id' | 'contactId'>): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contactId,
        user_id: session.user.id,
        content: note.content,
        tags: note.tags || [],
        is_private: note.isPrivate || false
      });

    if (error) {
      logger.error('Error adding note:', error);
      throw error;
    }

    logger.info('Note added successfully', { contactId });
  } catch (error) {
    logger.error('Error in addNote:', error);
    throw error;
  }
}

export async function addFollowUp(contactId: string, followUp: Omit<FollowUp, 'id' | 'contactId' | 'completed'>): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('follow_ups')
      .insert({
        contact_id: contactId,
        user_id: session.user.id,
        title: followUp.title,
        description: followUp.description,
        due_date: followUp.dueDate.toISOString(),
        priority: followUp.priority || 'medium',
        completed: false
      });

    if (error) {
      logger.error('Error adding follow-up:', error);
      throw error;
    }

    logger.info('Follow-up added successfully', { contactId });
  } catch (error) {
    logger.error('Error in addFollowUp:', error);
    throw error;
  }
}

export async function updateContactTier(contactId: string, tier: number): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('contacts')
      .update({ tier })
      .eq('id', contactId)
      .eq('user_id', session.user.id);

    if (error) {
      logger.error('Error updating contact tier:', error);
      throw error;
    }

    logger.info('Contact tier updated successfully', { contactId, tier });
  } catch (error) {
    logger.error('Error in updateContactTier:', error);
    throw error;
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', session.user.id);

    if (error) {
      logger.error('Error deleting contact:', error);
      throw error;
    }

    logger.info('Contact deleted successfully', { contactId });
  } catch (error) {
    logger.error('Error in deleteContact:', error);
    throw error;
  }
}

export async function listConnectionRequests(): Promise<Contact[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select(`
        id,
        requester_id,
        status,
        created_at,
        profiles:requester_id (
          id,
          first_name,
          last_name,
          email,
          company,
          job_title,
          profile_image,
          bio,
          interests,
          social_links
        )
      `)
      .eq('requested_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching connection requests:', error);
      return [];
    }

    return requests.map(request => ({
      id: request.id,
      userId: request.requester_id,
      name: `${request.profiles.first_name} ${request.profiles.last_name}`,
      email: request.profiles.email,
      jobTitle: request.profiles.job_title,
      company: request.profiles.company,
      profileImage: request.profiles.profile_image,
      bio: request.profiles.bio || {},
      interests: request.profiles.interests || [],
      socialLinks: request.profiles.social_links || {},
      tags: [],
      tier: 3,
      notes: [],
      followUps: [],
      createdAt: new Date(request.created_at),
      updatedAt: new Date(request.created_at)
    }));
  } catch (error) {
    logger.error('Error in listConnectionRequests:', error);
    return [];
  }
}

export async function approveConnectionRequest(requestId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .eq('requested_id', session.user.id);

    if (error) {
      logger.error('Error approving connection request:', error);
      throw error;
    }

    logger.info('Connection request approved', { requestId });
  } catch (error) {
    logger.error('Error in approveConnectionRequest:', error);
    throw error;
  }
}

export async function declineConnectionRequest(requestId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('requested_id', session.user.id);

    if (error) {
      logger.error('Error declining connection request:', error);
      throw error;
    }

    logger.info('Connection request declined', { requestId });
  } catch (error) {
    logger.error('Error in declineConnectionRequest:', error);
    throw error;
  }
}