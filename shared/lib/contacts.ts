import { supabase } from './supabase';
import type { User } from '../types/user';
import type { Contact, Note, FollowUp } from '../types/contact';
import { logger } from './logger';

// 🚀 PRODUCTION-READY CONTACT MANAGEMENT SYSTEM
// Migrated from localStorage/mock data to Supabase with mobile optimizations

// Mobile-optimized contact interface
export interface MobileContact extends Contact {
  isSynced?: boolean;
  lastSyncAt?: Date;
  deviceId?: string;
}

// Contact management functions with mobile support
export async function listContacts(): Promise<Contact[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.warn('No authenticated user for listing contacts');
      return [];
    }

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_notes(*),
        contact_followups(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching contacts:', error);
      throw error;
    }
    
    return data?.map(contact => ({
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio,
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier,
      notes: contact.contact_notes?.map((note: any) => ({
        id: note.id,
        content: note.content,
        createdAt: new Date(note.created_at)
      })) || [],
      followUps: contact.contact_followups?.map((followUp: any) => ({
        id: followUp.id,
        description: followUp.description,
        dueDate: new Date(followUp.due_date),
        completed: followUp.completed,
        createdAt: new Date(followUp.created_at)
      })) || [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at),
      // Mobile-specific fields
      firstMetAt: contact.first_met_at ? new Date(contact.first_met_at) : undefined,
      firstMetLocation: contact.first_met_location,
      connectionMethod: contact.connection_method || 'manual'
    })) || [];
  } catch (error) {
    logger.error('Error listing contacts:', error);
    throw error;
  }
}

export async function listRecentContacts(limit: number = 3): Promise<Contact[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .not('meeting_date', 'is', null)
      .order('meeting_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data?.map(contact => ({
      id: contact.id,
      userId: contact.user_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.job_title,
      company: contact.company,
      profileImage: contact.profile_image,
      coverImage: contact.cover_image,
      bio: contact.bio,
      interests: contact.interests || [],
      socialLinks: contact.social_links || {},
      meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
      meetingLocation: contact.meeting_location,
      meetingContext: contact.meeting_context,
      tags: contact.tags || [],
      tier: contact.tier,
      notes: [],
      followUps: [],
      createdAt: new Date(contact.created_at),
      updatedAt: new Date(contact.updated_at)
    })) || [];
  } catch (error) {
    logger.error('Error listing recent contacts:', error);
    throw error;
  }
}

// Connection request management
export async function listConnectionRequests(): Promise<Contact[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('target_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(request => ({
      id: request.id,
      userId: request.requester_id,
      name: request.requester_name,
      email: request.requester_email,
      jobTitle: request.requester_job_title,
      company: request.requester_company,
      profileImage: request.requester_profile_image,
      bio: request.requester_bio,
      interests: request.requester_interests || [],
      socialLinks: request.requester_social_links || {},
      tags: [],
      tier: 3,
      notes: [],
      followUps: [],
      createdAt: new Date(request.created_at),
      updatedAt: new Date(request.updated_at),
      // Request specific data
      requestDate: new Date(request.created_at),
      requestLocation: request.metadata?.location
    })) || [];
  } catch (error) {
    logger.error('Error listing connection requests:', error);
    throw error;
  }
}

export async function getContact(id: string): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try contacts table first
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_notes(*),
        contact_followups(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (contact && !contactError) {
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
        bio: contact.bio,
        interests: contact.interests || [],
        socialLinks: contact.social_links || {},
        meetingDate: contact.meeting_date ? new Date(contact.meeting_date) : undefined,
        meetingLocation: contact.meeting_location,
        meetingContext: contact.meeting_context,
        tags: contact.tags || [],
        tier: contact.tier,
        notes: contact.contact_notes?.map((note: any) => ({
          id: note.id,
          content: note.content,
          createdAt: new Date(note.created_at)
        })) || [],
        followUps: contact.contact_followups?.map((followUp: any) => ({
          id: followUp.id,
          description: followUp.description,
          dueDate: new Date(followUp.due_date),
          completed: followUp.completed,
          createdAt: new Date(followUp.created_at)
        })) || [],
        createdAt: new Date(contact.created_at),
        updatedAt: new Date(contact.updated_at)
      };
    }

    // Try connection requests table
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', id)
      .eq('target_user_id', user.id)
      .single();
    
    if (request && !requestError) {
      return {
        id: request.id,
        userId: request.requester_id,
        name: request.requester_name,
        email: request.requester_email,
        jobTitle: request.requester_job_title,
        company: request.requester_company,
        profileImage: request.requester_profile_image,
        bio: request.requester_bio,
        interests: request.requester_interests || [],
        socialLinks: request.requester_social_links || {},
        tags: [],
        tier: 3,
        notes: [],
        followUps: [],
        createdAt: new Date(request.created_at),
        updatedAt: new Date(request.updated_at)
      };
    }

    throw new Error('Contact not found');
  } catch (error) {
    logger.error('Error getting contact:', error);
    throw error;
  }
}

export async function createContact(contactData: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'notes' | 'followUps'>): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
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
        meeting_date: contactData.meetingDate,
        meeting_location: contactData.meetingLocation,
        meeting_context: contactData.meetingContext,
        tags: contactData.tags,
        tier: contactData.tier || 3,
        first_met_at: contactData.meetingDate,
        first_met_location: contactData.meetingLocation,
        connection_method: 'manual'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
      company: data.company,
      profileImage: data.profile_image,
      coverImage: data.cover_image,
      bio: data.bio,
      interests: data.interests || [],
      socialLinks: data.social_links || {},
      meetingDate: data.meeting_date ? new Date(data.meeting_date) : undefined,
      meetingLocation: data.meeting_location,
      meetingContext: data.meeting_context,
      tags: data.tags || [],
      tier: data.tier,
      notes: [],
      followUps: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    logger.error('Error creating contact:', error);
    throw error;
  }
}

export async function updateContactTier(contactId: string, tier: 1 | 2 | 3): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
      company: data.company,
      profileImage: data.profile_image,
      coverImage: data.cover_image,
      bio: data.bio,
      interests: data.interests || [],
      socialLinks: data.social_links || {},
      meetingDate: data.meeting_date ? new Date(data.meeting_date) : undefined,
      meetingLocation: data.meeting_location,
      meetingContext: data.meeting_context,
      tags: data.tags || [],
      tier: data.tier,
      notes: [],
      followUps: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    logger.error('Error updating contact tier:', error);
    throw error;
  }
}

export async function updateContactSharing(contactId: string, sharedLinks: Record<string, boolean>): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        social_links: sharedLinks,
        updated_at: new Date().toISOString() 
      })
      .eq('id', contactId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
      company: data.company,
      profileImage: data.profile_image,
      coverImage: data.cover_image,
      bio: data.bio,
      interests: data.interests || [],
      socialLinks: data.social_links || {},
      meetingDate: data.meeting_date ? new Date(data.meeting_date) : undefined,
      meetingLocation: data.meeting_location,
      meetingContext: data.meeting_context,
      tags: data.tags || [],
      tier: data.tier,
      notes: [],
      followUps: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    logger.error('Error updating contact sharing:', error);
    throw error;
  }
}

export async function addNote(contactId: string, content: string): Promise<Note> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // ✅ Add content validation
    if (!content || content.trim().length === 0) {
      throw new Error('Note content cannot be empty');
    }
    
    if (content.length > 5000) {
      throw new Error('Note content too long (max 5000 characters)');
    }
    
    // ✅ Sanitize rich text content
    const sanitizedContent = sanitizeRichText(content);

    // Verify contact ownership
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    
    if (!contact) throw new Error('Contact not found');

    const { data, error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contactId,
        content: sanitizedContent
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update contact's updated_at timestamp
    await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', contactId);
    
    return {
      id: data.id,
      content: data.content,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    logger.error('Error adding note:', error);
    throw error;
  }
}

export async function deleteNote(contactId: string, noteId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify contact ownership
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    
    if (!contact) throw new Error('Contact not found');

    const { error } = await supabase
      .from('contact_notes')
      .delete()
      .eq('id', noteId)
      .eq('contact_id', contactId);
    
    if (error) throw error;
    
    // Update contact's updated_at timestamp
    await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', contactId);
  } catch (error) {
    logger.error('Error deleting note:', error);
    throw error;
  }
}

export async function addFollowUp(contactId: string, data: { dueDate: Date; description: string }): Promise<FollowUp> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // ✅ Add content validation
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Follow-up description cannot be empty');
    }
    
    if (data.description.length > 2000) {
      throw new Error('Follow-up description too long (max 2000 characters)');
    }
    
    // ✅ Sanitize description content
    const sanitizedDescription = sanitizeRichText(data.description);

    // Verify contact ownership
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    
    if (!contact) throw new Error('Contact not found');

    const { data: followUpData, error } = await supabase
      .from('contact_followups')
      .insert({
        contact_id: contactId,
        description: sanitizedDescription,
        due_date: data.dueDate.toISOString(),
        completed: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update contact's updated_at timestamp
    await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', contactId);
    
    return {
      id: followUpData.id,
      description: followUpData.description,
      dueDate: new Date(followUpData.due_date),
      completed: followUpData.completed,
      createdAt: new Date(followUpData.created_at)
    };
  } catch (error) {
    logger.error('Error adding follow-up:', error);
    throw error;
  }
}

export async function toggleFollowUp(contactId: string, followUpId: string, completed: boolean): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify contact ownership
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', user.id)
      .single();
    
    if (!contact) throw new Error('Contact not found');

    const { error } = await supabase
      .from('contact_followups')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', followUpId)
      .eq('contact_id', contactId);
    
    if (error) throw error;
    
    // Update contact's updated_at timestamp
    await supabase
      .from('contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', contactId);
  } catch (error) {
    logger.error('Error toggling follow-up:', error);
    throw error;
  }
}

export async function approveConnectionRequest(
  requestId: string, 
  location: { name: string; latitude: number; longitude: number; venue?: string; eventContext?: string }, 
  tags: string[],
  sharedLinks: Record<string, boolean>,
  mutualConnections: string[],
  note?: string,
  badges?: string[],
  tier?: 1 | 2 | 3 // ✅ Add tier parameter for user-specific preferences
): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    logger.info('Approving connection request', { 
      requestId, 
      location, 
      tags, 
      sharedLinksCount: Object.keys(sharedLinks).length,
      mutualConnectionsCount: mutualConnections.length,
      hasNote: !!note,
      hasBadges: !!badges
    });
    
    // Get the request
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', requestId)
      .eq('target_user_id', user.id)
      .single();
    
    if (!request || requestError) {
      logger.error('Request not found', { requestId, error: requestError });
      throw new Error('Request not found');
    }
    
    // Create new contact from request
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        name: request.requester_name,
        email: request.requester_email,
        job_title: request.requester_job_title,
        company: request.requester_company,
        profile_image: request.requester_profile_image,
        bio: request.requester_bio,
        interests: request.requester_interests,
        social_links: Object.entries(sharedLinks)
          .filter(([_, isShared]) => isShared)
          .reduce((acc, [key]) => ({
            ...acc,
            [key]: request.requester_social_links?.[key]
          }), {}),
        meeting_date: new Date().toISOString(),
        meeting_location: location,
        tags,
        tier: tier || 3, // ✅ Use provided tier or default to outer circle
        first_met_at: new Date().toISOString(),
        first_met_location: location,
        connection_method: 'request'
      })
      .select()
      .single();
    
    if (contactError) throw contactError;
    
    // Add note if provided
    if (note) {
      await supabase
        .from('contact_notes')
        .insert({
          contact_id: newContact.id,
          content: note
        });
    }
    
    // Update request status
    await supabase
      .from('connection_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
    
    logger.info('Connection request approved successfully', { 
      newContactId: newContact.id,
      requestId
    });

    return {
      id: newContact.id,
      userId: newContact.user_id,
      name: newContact.name,
      email: newContact.email,
      jobTitle: newContact.job_title,
      company: newContact.company,
      profileImage: newContact.profile_image,
      bio: newContact.bio,
      interests: newContact.interests || [],
      socialLinks: newContact.social_links || {},
      meetingDate: new Date(newContact.meeting_date),
      meetingLocation: newContact.meeting_location,
      tags: newContact.tags || [],
      tier: newContact.tier,
      notes: note ? [{ id: `note-${Date.now()}`, content: note, createdAt: new Date() }] : [],
      followUps: [],
      createdAt: new Date(newContact.created_at),
      updatedAt: new Date(newContact.updated_at)
    };
  } catch (error) {
    logger.error('Error approving connection request:', error);
    throw error;
  }
}

export async function declineConnectionRequest(requestId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    logger.info('Declining connection request', { requestId });
    
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('target_user_id', user.id);
    
    if (error) {
      logger.error('Request not found or error declining', { requestId, error });
      throw new Error('Request not found');
    }
    
    logger.info('Connection request declined successfully', { requestId });
  } catch (error) {
    logger.error('Error declining connection request:', error);
    throw error;
  }
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        job_title: updates.jobTitle,
        company: updates.company,
        profile_image: updates.profileImage,
        cover_image: updates.coverImage,
        bio: updates.bio,
        interests: updates.interests,
        social_links: updates.socialLinks,
        meeting_date: updates.meetingDate,
        meeting_location: updates.meetingLocation,
        meeting_context: updates.meetingContext,
        tags: updates.tags,
        tier: updates.tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.job_title,
      company: data.company,
      profileImage: data.profile_image,
      coverImage: data.cover_image,
      bio: data.bio,
      interests: data.interests || [],
      socialLinks: data.social_links || {},
      meetingDate: data.meeting_date ? new Date(data.meeting_date) : undefined,
      meetingLocation: data.meeting_location,
      meetingContext: data.meeting_context,
      tags: data.tags || [],
      tier: data.tier,
      notes: [],
      followUps: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    logger.error('Error updating contact:', error);
    throw error;
  }
}

export async function deleteContact(id: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting contact:', error);
    throw error;
  }
}

export function getPredictiveFilters(contacts: Contact[]) {
  if (!contacts.length) return [];
  
  // Count occurrences of various attributes
  const companyCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  
  contacts.forEach(contact => {
    // Count companies
    if (contact.company) {
      companyCounts.set(
        contact.company, 
        (companyCounts.get(contact.company) || 0) + 1
      );
    }
    
    // Count locations
    if (contact.meetingLocation?.name) {
      locationCounts.set(
        contact.meetingLocation.name,
        (locationCounts.get(contact.meetingLocation.name) || 0) + 1
      );
    }
    
    // Count tags
    contact.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
    
    // Count months
    if (contact.meetingDate) {
      const month = new Date(contact.meetingDate).toLocaleString('en-US', { month: 'long' });
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }
  });
  
  // Sort by frequency and get top items
  const topCompanies = Array.from(companyCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([company]) => company);
    
  const topLocations = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([location]) => location);
    
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
    
  const topMonths = Array.from(monthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([month]) => month);
  
  // Build suggestions
  const suggestions = [
    ...topCompanies.map(company => ({
      type: 'company',
      value: company,
      label: `${company} (Company)`,
      category: 'profession',
      subCategory: 'company'
    })),
    ...topLocations.map(location => ({
      type: 'location',
      value: location,
      label: `${location} (Location)`,
      category: 'location',
      subCategory: 'city'
    })),
    ...topTags.map(tag => ({
      type: 'tag',
      value: tag,
      label: `${tag} (Tag)`,
      category: 'all'
    })),
    ...topMonths.map(month => ({
      type: 'month',
      value: month,
      label: `${month} (Month)`,
      category: 'date',
      subCategory: 'month'
    }))
  ];
  
  return suggestions;
}

// Mobile-optimized contact synchronization
export async function syncContactsToDevice(): Promise<boolean> {
  try {
    // For offline support in mobile apps
    const contacts = await listContacts();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('dislink_contacts_cache', JSON.stringify({
        contacts,
        lastSync: new Date().toISOString()
      }));
      logger.info('Contacts synced to device cache', { count: contacts.length });
    }
    return true;
  } catch (error) {
    logger.error('Error syncing contacts to device:', error);
    return false;
  }
}

// Get cached contacts for offline use
export async function getCachedContacts(): Promise<Contact[]> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = window.localStorage.getItem('dislink_contacts_cache');
      if (cached) {
        const { contacts } = JSON.parse(cached);
        return contacts || [];
      }
    }
    return [];
  } catch (error) {
    logger.error('Error getting cached contacts:', error);
    return [];
  }
}

export async function createConnectionRequest(user: User | any): Promise<void> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Not authenticated');
    
    const now = new Date();
    
    // Get location data if provided
    const requestLocation = user.location ? {
      name: user.location.name || 'Unknown Location',
      latitude: user.location.latitude,
      longitude: user.location.longitude,
      venue: user.location.venue,
      eventContext: user.location.eventContext
    } : {
      name: 'Unknown Location',
      latitude: 0,
      longitude: 0
    };
    
    const { error } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: currentUser.id,
        target_user_id: user.id || user.userId,
        requester_name: user.name,
        requester_email: user.email,
        requester_job_title: user.jobTitle,
        requester_company: user.company,
        requester_profile_image: user.profileImage,
        requester_bio: user.bio,
        requester_interests: user.interests,
        requester_social_links: user.socialLinks,
        status: 'pending',
        metadata: {
          location: requestLocation,
          timestamp: now.toISOString()
        }
      });
    
    if (error) throw error;
    
    logger.info('Connection request created successfully');
  } catch (error) {
    logger.error('Error creating connection request:', error);
    throw error;
  }
}

// ✅ Add content sanitization function
function sanitizeRichText(content: string): string {
  // Remove potentially dangerous HTML tags and attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<link\b[^<]*>/gi, '')
    .replace(/<meta\b[^<]*>/gi, '')
    .trim();
}
