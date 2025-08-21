import { supabase } from './supabase';
import type { User } from '../types/user';
import type { Contact, Note, FollowUp } from '../types/contact';
import { logger } from './logger';

// Fetch contacts from Supabase
export async function listContacts(): Promise<Contact[]> {
  try {
    logger.info('Fetching contacts from Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching contacts:', error);
      throw error;
    }

    logger.info(`Fetched ${data?.length || 0} contacts`);
    return data || [];
  } catch (error) {
    logger.error('Error listing contacts:', error);
    throw error;
  }
}

export async function listRecentContacts(limit: number = 3): Promise<Contact[]> {
  try {
    logger.info('Fetching recent contacts from Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching recent contacts:', error);
      throw error;
    }

    logger.info(`Fetched ${data?.length || 0} recent contacts`);
    return data || [];
  } catch (error) {
    logger.error('Error listing recent contacts:', error);
    throw error;
  }
}

export async function getContact(contactId: string): Promise<Contact | null> {
  try {
    logger.info('Fetching contact from Supabase', { contactId });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Contact not found
      }
      logger.error('Error fetching contact:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error getting contact:', error);
    throw error;
  }
}

export async function addContact(contact: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
  try {
    logger.info('Adding new contact to Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        ...contact,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error adding contact:', error);
      throw error;
    }

    logger.info('Contact added successfully', { contactId: data.id });
    return data;
  } catch (error) {
    logger.error('Error adding contact:', error);
    throw error;
  }
}

export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact> {
  try {
    logger.info('Updating contact in Supabase', { contactId });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contact:', error);
      throw error;
    }

    logger.info('Contact updated successfully', { contactId });
    return data;
  } catch (error) {
    logger.error('Error updating contact:', error);
    throw error;
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  try {
    logger.info('Deleting contact from Supabase', { contactId });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

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
    logger.error('Error deleting contact:', error);
    throw error;
  }
}

export async function listConnectionRequests(): Promise<Contact[]> {
  try {
    logger.info('Fetching connection requests from Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('target_user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching connection requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Error listing connection requests:', error);
    throw error;
  }
}

export async function updateContactTier(contactId: string, tier: 1 | 2 | 3): Promise<Contact> {
  try {
    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    contact.tier = tier;
    return await updateContact(contactId, contact);
  } catch (error) {
    logger.error('Error updating contact tier:', error);
    throw error;
  }
}

export async function updateContactSharing(contactId: string, sharedLinks: Record<string, boolean>): Promise<Contact> {
  try {
    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // Get the current user's social links
    const userSocialLinks: Record<string, string> = {
      linkedin: 'https://linkedin.com/in/antoniotubito',
      twitter: '@antoniotubito',
      github: 'https://github.com/antoniotubito',
      medium: '@antoniotubito',
      portfolio: 'https://dislink.com'
    };

    // Create a new socialLinks object with only the links that should be shared
    const newSocialLinks: Record<string, string> = {};
    Object.entries(sharedLinks).forEach(([platform, shouldShare]) => {
      if (shouldShare && userSocialLinks[platform]) {
        newSocialLinks[platform] = userSocialLinks[platform];
      }
    });

    // Update the contact's socialLinks
    contact.socialLinks = newSocialLinks;
    return await updateContact(contactId, contact);
  } catch (error) {
    logger.error('Error updating contact sharing settings:', error);
    throw error;
  }
}

export async function addNote(contactId: string, content: string): Promise<Note> {
  try {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      createdAt: new Date()
    };

    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // In a real implementation, you would add the note to the database
    // For now, we'll just return a mock note
    return newNote;
  } catch (error) {
    logger.error('Error adding note:', error);
    throw error;
  }
}

export async function deleteNote(contactId: string): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // In a real implementation, you would delete the note from the database
    // For now, we'll just return
  } catch (error) {
    logger.error('Error deleting note:', error);
    throw error;
  }
}

export async function addFollowUp(contactId: string, description: string, dueDate: Date): Promise<FollowUp> {
  try {
    const newFollowUp: FollowUp = {
      id: `followup-${Date.now()}`,
      description,
      dueDate,
      completed: false,
      createdAt: new Date()
    };

    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // In a real implementation, you would add the follow-up to the database
    // For now, we'll just return a mock follow-up
    return newFollowUp;
  } catch (error) {
    logger.error('Error adding follow-up:', error);
    throw error;
  }
}

export async function toggleFollowUp(contactId: string): Promise<void> {
  try {
    const contact = await getContact(contactId);
    if (!contact) throw new Error('Contact not found');

    // In a real implementation, you would update the follow-up in the database
    // For now, we'll just return
  } catch (error) {
    logger.error('Error toggling follow-up:', error);
    throw error;
  }
}

export async function approveConnectionRequest(requestId: string): Promise<Contact> {
  try {
    logger.info('Approving connection request', { requestId });
    
    // Find the request
    const request = await getContact(requestId);
    
    if (!request) {
      logger.error('Request not found', { requestId });
      throw new Error('Request not found');
    }

    // Create new contact from request with connection timestamp
    const newContact = {
      ...request,
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      meetingDate: new Date(), // Connection timestamp
      notes: [],
      followUps: []
    };

    // Remove request-specific fields
    delete (newContact as any).requestLocation;

    // Add to Supabase
    return await addContact(newContact);
    
    logger.info('Connection request approved successfully', { 
      requestId,
      newContactId: newContact.id 
    });
  } catch (error) {
    logger.error('Error approving connection request:', error);
    throw error;
  }
}

export async function declineConnectionRequest(requestId: string): Promise<void> {
  try {
    logger.info('Declining connection request', { requestId });
    
    const request = await getContact(requestId);
    if (!request) {
      logger.error('Request not found', { requestId });
      throw new Error('Request not found');
    }

    // In a real implementation, you would delete the request from the database
    await deleteContact(requestId);
  } catch (error) {
    logger.error('Error declining connection request:', error);
    throw error;
  }
}

// Emily Tech mock profile for demo/testing
export const EMILY_TECH: User = {
  id: 'emily-tech-demo',
  email: 'emily@techinnovations.dev',
  firstName: 'Emily',
  lastName: 'Tech',
  name: 'Emily Tech',
  jobTitle: 'Senior Full-Stack Developer',
  company: 'Tech Innovations Inc.',
  industry: 'technology',
  profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80',
  bio: {
    location: 'San Francisco, CA',
    from: 'Boston, MA',
    about: 'Passionate full-stack developer with 8+ years of experience building scalable web applications. Love working with React, Node.js, and cloud technologies. Always eager to connect with fellow developers and share knowledge!'
  },
  interests: [
    'Full-Stack Development',
    'React & Node.js',
    'Cloud Architecture',
    'DevOps',
    'Open Source',
    'Tech Meetups',
    'Hiking',
    'Coffee'
  ],
  socialLinks: {
    linkedin: 'https://linkedin.com/in/emilytech',
    github: 'https://github.com/emilytech',
    twitter: '@emilytech_dev',
    portfolio: 'https://emilytech.dev'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  twoFactorEnabled: false,
  publicProfile: {
    enabled: true,
    defaultSharedLinks: {
      linkedin: true,
      github: true,
      twitter: true,
      portfolio: true
    },
    allowedFields: {
      email: false,
      phone: false,
      company: true,
      jobTitle: true,
      bio: true,
      interests: true,
      location: true
    }
  }
};

export async function createConnectionRequestFromQR(
  userData: {
    userId: string;
    name: string;
    email?: string;
    jobTitle?: string;
    company?: string;
    profileImage?: string;
    bio?: any;
    interests?: string[];
    socialLinks?: Record<string, string>;
    location?: {
      latitude: number;
      longitude: number;
      name: string;
      timestamp: Date;
    };
  },
  location?: { latitude: number; longitude: number; name?: string }
): Promise<Contact> {
  try {
    logger.info('Creating connection request from QR scan', { userData, location });

    // For testing, return Emily Tech profile when scanning test QR code
    if (userData.userId === 'test-qr-code') {
      return {
        id: 'test-qr-code',
        name: userData.name,
        jobTitle: userData.jobTitle,
        company: userData.company,
        profileImage: userData.profileImage,
        coverImage: undefined,
        bio: userData.bio,
        interests: userData.interests,
        socialLinks: userData.socialLinks,
        createdAt: new Date(),
        updatedAt: new Date(),
        twoFactorEnabled: false,
        publicProfile: {
          enabled: true,
          defaultSharedLinks: {},
          allowedFields: {
            email: false,
            phone: false,
            company: true,
            jobTitle: true,
            bio: true,
            interests: true,
            location: true
          }
        }
      } as any;
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the provided location from user data, or fallback to the location parameter
    const meetingLocation = userData.location || location;
    
    const newRequest: Contact = {
      id: requestId,
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      phone: undefined,
      jobTitle: userData.jobTitle,
      company: userData.company,
      profileImage: userData.profileImage,
      coverImage: undefined,
      bio: userData.bio,
      interests: userData.interests || [],
      socialLinks: userData.socialLinks || {},
      meetingDate: new Date(),
      meetingLocation: meetingLocation ? {
        name: meetingLocation.name || 'QR Code Location',
        latitude: meetingLocation.latitude,
        longitude: meetingLocation.longitude,
        venue: 'QR Code Scan',
        eventContext: 'Digital Connection'
      } : undefined,
      meetingContext: 'Connected via QR code scan',
      tags: ['QR Connection'],
      tier: 3,
      notes: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to Supabase
    await addContact(newRequest);
    
    logger.info('Connection request created', { requestId });
    return newRequest;
  } catch (error) {
    logger.error('Error creating connection request from QR:', error);
    throw error;
  }
}

export async function createEmilyTechConnectionRequest(): Promise<string> {
  try {
    const requestId = `req-emily-${Date.now()}`;
    
    const newRequest: Contact = {
      id: requestId,
      userId: EMILY_TECH.id,
      name: EMILY_TECH.name,
      email: EMILY_TECH.email,
      jobTitle: EMILY_TECH.jobTitle,
      company: EMILY_TECH.company,
      profileImage: EMILY_TECH.profileImage,
      coverImage: EMILY_TECH.coverImage,
      bio: EMILY_TECH.bio,
      interests: EMILY_TECH.interests,
      socialLinks: EMILY_TECH.socialLinks,
      meetingDate: new Date(),
      meetingLocation: {
        name: 'Demo Connection',
        latitude: 37.7749,
        longitude: -122.4194,
        venue: 'Dislink Demo',
        eventContext: 'Demo Connection Request'
      },
      meetingContext: 'Demo connection request for Emily Tech',
      tags: ['Demo', 'Tech', 'Developer'],
      tier: 2,
      notes: [],
      followUps: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to Supabase
    addContact(newRequest);
    
    logger.info('Emily Tech connection request created', { requestId });
    return requestId;
  } catch (error) {
    logger.error('Error creating Emily Tech connection request:', error);
    throw error;
  }
}

export async function createLisbonConnectionRequest(): Promise<string> {
  try {
    const requestId = `req-lisbon-${Date.now()}`;
    
    const newRequest: Contact = {
    id: requestId,
      userId: 'lisbon-user',
      name: 'Maria Silva',
      email: 'maria@example.com',
      jobTitle: 'UX Designer',
      company: 'Lisbon Design Studio',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      bio: {
        location: 'Lisbon, Portugal',
        from: 'Porto, Portugal',
        about: 'Passionate UX designer creating beautiful and intuitive digital experiences.'
      },
      interests: ['UX Design', 'Prototyping', 'User Research'],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/mariasilva',
        dribbble: 'https://dribbble.com/mariasilva'
      },
      meetingDate: new Date(),
      meetingLocation: {
        name: 'Lisbon, Portugal',
        latitude: 38.7223,
        longitude: -9.1393,
        venue: 'Tech Conference Lisbon',
        eventContext: 'UX Workshop'
      },
      meetingContext: 'Met at UX workshop in Lisbon',
      tags: ['Design', 'UX', 'Lisbon'],
      tier: 2,
    notes: [],
    followUps: [],
      createdAt: new Date(),
      updatedAt: new Date()
  };

    // Add to Supabase
    addContact(newRequest);
  
  logger.info('Lisbon connection request created', { requestId });
  return requestId;
  } catch (error) {
    logger.error('Error creating Lisbon connection request:', error);
    throw error;
  }
}