// =====================================================
// DISLINK TEST DATA INSERTION - PRODUCTION READY
// TypeScript implementation with full auth.uid() compliance
// =====================================================

import { supabase } from './supabase';
import { logger } from './logger';

export interface TestDataResult {
  success: boolean;
  data?: {
    contact: any;
    note: any;
    followUp: any;
    connectionRequest: any;
  };
  error?: string;
}

export interface VerificationResult {
  contacts: number;
  notes: number;
  followUps: number;
  connectionRequests: number;
  jsonbValidation: boolean;
  arrayValidation: boolean;
}

/**
 * Insert comprehensive test data for the authenticated user
 * This function ensures full RLS compliance and proper data formatting
 */
export async function insertTestData(): Promise<TestDataResult> {
  try {
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to insert test data');
    }

    logger.info('🚀 Starting test data insertion for user:', user.id);

    // 2. Insert test contact with all fields properly formatted
    const contactData = {
      user_id: user.id, // Always use auth.uid() equivalent
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1-555-0199',
      job_title: 'Senior Product Manager',
      company: 'TechCorp Solutions',
      profile_image: 'https://example.com/avatars/sarah.jpg',
      cover_image: 'https://example.com/covers/sarah-cover.jpg',
      bio: {
        location: 'San Francisco, CA',
        about: 'Passionate about user experience and product innovation. Loves hiking and coffee.'
      },
      interests: ['product management', 'user experience', 'coffee', 'outdoor activities', 'startups'],
      social_links: {
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        twitter: 'https://twitter.com/sarahj',
        github: 'https://github.com/sarahj'
      },
      meeting_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      meeting_location: {
        name: 'Blue Bottle Coffee',
        latitude: 37.7749,
        longitude: -122.4194,
        venue: 'Blue Bottle Coffee - Mission District',
        eventContext: 'Product Management Meetup'
      },
      meeting_context: 'Met at a product management meetup where we discussed user research methodologies and design thinking approaches.',
      tags: ['colleague', 'product management', 'networking', 'coffee enthusiast'],
      tier: 2,
      first_met_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      first_met_location: {
        name: 'Blue Bottle Coffee',
        latitude: 37.7749,
        longitude: -122.4194,
        venue: 'Blue Bottle Coffee - Mission District'
      },
      connection_method: 'networking_event'
    };

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (contactError) {
      logger.error('❌ Contact insertion failed:', contactError);
      throw contactError;
    }
    logger.info('✅ Contact inserted:', contact.id);

    // 3. Insert test note linked to the contact
    const noteData = {
      contact_id: contact.id,
      content: 'Had an excellent conversation about product management best practices. Sarah mentioned she\'s working on a new user research framework that could be valuable for our team. She\'s very knowledgeable about design thinking and has experience with both B2B and B2C products. Follow up in 2 weeks to discuss potential collaboration on user research methodologies.'
    };

    const { data: note, error: noteError } = await supabase
      .from('contact_notes')
      .insert(noteData)
      .select()
      .single();

    if (noteError) {
      logger.error('❌ Note insertion failed:', noteError);
      throw noteError;
    }
    logger.info('✅ Note inserted:', note.id);

    // 4. Insert test follow-up linked to the same contact
    const followUpData = {
      contact_id: contact.id,
      description: 'Schedule a follow-up call to discuss the user research framework collaboration opportunity. Also share our latest product roadmap and get her thoughts on user testing methodologies.',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      completed: false
    };

    const { data: followUp, error: followUpError } = await supabase
      .from('contact_followups')
      .insert(followUpData)
      .select()
      .single();

    if (followUpError) {
      logger.error('❌ Follow-up insertion failed:', followUpError);
      throw followUpError;
    }
    logger.info('✅ Follow-up inserted:', followUp.id);

    // 5. Insert test connection request
    const connectionRequestData = {
      requester_id: user.id, // Always use auth.uid() equivalent
      target_user_id: '00000000-0000-0000-0000-000000000001', // Test target user
      requester_name: 'Test User',
      requester_email: 'testuser@example.com',
      requester_job_title: 'Software Engineer',
      requester_company: 'Dislink Inc',
      requester_profile_image: 'https://example.com/avatars/testuser.jpg',
      requester_bio: {
        location: 'Remote',
        about: 'Building meaningful connections through technology'
      },
      requester_interests: ['software development', 'networking', 'technology', 'coffee'],
      requester_social_links: {
        linkedin: 'https://linkedin.com/in/testuser',
        github: 'https://github.com/testuser'
      },
      status: 'pending',
      metadata: {
        connectionMethod: 'manual',
        source: 'test_data',
        notes: 'Test connection request for validation'
      }
    };

    const { data: connectionRequest, error: connectionRequestError } = await supabase
      .from('connection_requests')
      .insert(connectionRequestData)
      .select()
      .single();

    if (connectionRequestError) {
      logger.error('❌ Connection request insertion failed:', connectionRequestError);
      throw connectionRequestError;
    }
    logger.info('✅ Connection request inserted:', connectionRequest.id);

    // 6. Verify all data was inserted correctly
    const verificationResults = await verifyTestData(user.id);
    logger.info('✅ Test data verification completed:', verificationResults);

    return {
      success: true,
      data: {
        contact,
        note,
        followUp,
        connectionRequest
      }
    };

  } catch (error) {
    logger.error('❌ Error inserting test data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Verify that test data was inserted correctly with RLS compliance
 */
export async function verifyTestData(userId: string): Promise<VerificationResult> {
  try {
    // Get contacts with related data
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_notes(*),
        contact_followups(*)
      `)
      .eq('user_id', userId)
      .eq('name', 'Sarah Johnson');

    if (contactsError) {
      logger.error('❌ Error fetching contacts for verification:', contactsError);
      throw contactsError;
    }

    // Get connection requests
    const { data: connectionRequests, error: connectionRequestsError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('requester_id', userId)
      .eq('requester_name', 'Test User');

    if (connectionRequestsError) {
      logger.error('❌ Error fetching connection requests for verification:', connectionRequestsError);
      throw connectionRequestsError;
    }

    // Validate JSONB and array fields
    const contact = contacts?.[0];
    const jsonbValidation = !!(
      contact?.bio &&
      typeof contact.bio === 'object' &&
      contact.bio.location &&
      contact.social_links &&
      typeof contact.social_links === 'object'
    );

    const arrayValidation = !!(
      Array.isArray(contact?.interests) &&
      Array.isArray(contact?.tags) &&
      contact.interests.length > 0 &&
      contact.tags.length > 0
    );

    const result: VerificationResult = {
      contacts: contacts?.length || 0,
      notes: contacts?.[0]?.contact_notes?.length || 0,
      followUps: contacts?.[0]?.contact_followups?.length || 0,
      connectionRequests: connectionRequests?.length || 0,
      jsonbValidation,
      arrayValidation
    };

    logger.info('📊 Verification results:', result);
    return result;

  } catch (error) {
    logger.error('❌ Error verifying test data:', error);
    throw error;
  }
}

/**
 * Clean up test data (useful for testing)
 */
export async function cleanupTestData(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to cleanup test data');
    }

    logger.info('🧹 Cleaning up test data for user:', user.id);

    // Delete in reverse order to respect foreign key constraints
    // 1. Delete connection requests
    const { error: connectionRequestsError } = await supabase
      .from('connection_requests')
      .delete()
      .eq('requester_id', user.id)
      .eq('requester_name', 'Test User');

    if (connectionRequestsError) {
      logger.error('❌ Error deleting connection requests:', connectionRequestsError);
    }

    // 2. Delete follow-ups and notes (will be deleted by CASCADE when contact is deleted)
    // 3. Delete contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', user.id)
      .eq('name', 'Sarah Johnson');

    if (contactsError) {
      logger.error('❌ Error deleting contacts:', contactsError);
    }

    logger.info('✅ Test data cleanup completed');
    return true;

  } catch (error) {
    logger.error('❌ Error cleaning up test data:', error);
    return false;
  }
}

/**
 * Get test data summary for the authenticated user
 */
export async function getTestDataSummary(): Promise<{
  totalContacts: number;
  totalNotes: number;
  totalFollowUps: number;
  totalConnectionRequests: number;
  hasTestData: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to get test data summary');
    }

    // Get counts for all data types
    const [contactsResult, notesResult, followUpsResult, connectionRequestsResult] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('contact_notes').select('id', { count: 'exact' }).eq('contact_id', supabase.from('contacts').select('id').eq('user_id', user.id)),
      supabase.from('contact_followups').select('id', { count: 'exact' }).eq('contact_id', supabase.from('contacts').select('id').eq('user_id', user.id)),
      supabase.from('connection_requests').select('id', { count: 'exact' }).eq('requester_id', user.id)
    ]);

    const totalContacts = contactsResult.count || 0;
    const totalNotes = notesResult.count || 0;
    const totalFollowUps = followUpsResult.count || 0;
    const totalConnectionRequests = connectionRequestsResult.count || 0;

    return {
      totalContacts,
      totalNotes,
      totalFollowUps,
      totalConnectionRequests,
      hasTestData: totalContacts > 0 || totalNotes > 0 || totalFollowUps > 0 || totalConnectionRequests > 0
    };

  } catch (error) {
    logger.error('❌ Error getting test data summary:', error);
    throw error;
  }
}
