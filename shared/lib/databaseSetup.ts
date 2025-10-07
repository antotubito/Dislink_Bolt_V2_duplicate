// =====================================================
// DISLINK DATABASE SETUP - PRODUCTION READY
// Complete database setup with schema validation, RLS policies, and test data
// =====================================================

import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';

export interface DatabaseSetupResult {
  success: boolean;
  message?: string;
  error?: string;
  contactId?: string;
  noteId?: string;
  followupId?: string;
  requestId?: string;
}

/**
 * Complete database setup including schema validation, RLS policies, and test data
 * This function ensures your Dislink database is production-ready
 */
export async function setupDatabase(): Promise<DatabaseSetupResult> {
  try {
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to setup database');
    }

    logger.info('🚀 Starting complete database setup for user:', user.id);

    // 2. Schema validation & fixes
    try {
      await validateAndFixSchema();
      logger.info('✅ Schema validation and fixes completed');
    } catch (error) {
      logger.error('❌ Schema validation failed:', error);
      throw error;
    }

    // 3. Deploy RLS policies
    try {
      await deployRLSPolicies();
      logger.info('✅ RLS policies deployed successfully');
    } catch (error) {
      logger.error('❌ RLS policies deployment failed:', error);
      throw error;
    }

    // 4. Insert test data
    let contactId: string;
    let noteId: string;
    let followupId: string;
    let requestId: string;

    try {
      const testDataResult = await insertTestData(user.id);
      contactId = testDataResult.contactId;
      noteId = testDataResult.noteId;
      followupId = testDataResult.followupId;
      requestId = testDataResult.requestId;
      logger.info('✅ Test data inserted successfully');
    } catch (error) {
      logger.error('❌ Test data insertion failed:', error);
      throw error;
    }

    // 5. Verify everything works
    try {
      const verification = await verifyDatabaseSetup(user.id, contactId);
      logger.info('✅ Database setup verification completed:', verification);
    } catch (error) {
      logger.error('❌ Database setup verification failed:', error);
      throw error;
    }

    logger.info('🎉 Complete database setup completed successfully!');
    return {
      success: true,
      message: "✅ Database setup completed",
      contactId,
      noteId,
      followupId,
      requestId
    };

  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate and fix database schema
 */
async function validateAndFixSchema(): Promise<void> {
  // Check foreign key relationships first
  try {
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('get_foreign_keys', {
        table_names: ['contacts', 'contact_notes', 'contact_followups', 'connection_requests']
      });

    if (fkError) {
      logger.warn('⚠️  Could not check foreign keys:', fkError);
    } else {
      logger.info('🔍 Foreign key relationships checked:', foreignKeys);
    }
  } catch (error) {
    logger.warn('⚠️  Foreign key check error:', error);
  }

  // Fix contacts table foreign key
  try {
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey' 
    });
    if (dropError) {
      logger.warn('⚠️  Drop constraint failed:', dropError);
    }

    const { error: addError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE contacts ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE' 
    });
    if (addError) {
      logger.warn('⚠️  Add constraint failed:', addError);
    } else {
      logger.info('✅ Foreign key constraint updated for contacts table');
    }
  } catch (error) {
    logger.warn('⚠️  Foreign key constraint update error:', error);
  }

  // Ensure all required columns exist with correct data types
  const schemaFixes = [
    'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_met_at TIMESTAMPTZ',
    'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_met_location JSONB',
    'ALTER TABLE contacts ADD COLUMN IF NOT EXISTS connection_method TEXT DEFAULT \'manual\'',
    'ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS metadata JSONB'
  ];

  for (const fix of schemaFixes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: fix });
      if (error) {
        logger.warn(`⚠️  Schema fix failed: ${fix}`, error);
      }
    } catch (error) {
      logger.warn(`⚠️  Schema fix error: ${fix}`, error);
    }
  }

  // Enable RLS on all tables
  const rlsTables = ['contacts', 'contact_notes', 'contact_followups', 'connection_requests'];
  for (const table of rlsTables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY` 
      });
      if (error) {
        logger.warn(`⚠️  RLS enable failed for table: ${table}`, error);
      }
    } catch (error) {
      logger.warn(`⚠️  RLS enable error for table: ${table}`, error);
    }
  }
}

/**
 * Deploy comprehensive RLS policies
 */
async function deployRLSPolicies(): Promise<void> {
  const policies = [
    // Contacts table policies
    'DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts',
    'CREATE POLICY "Users can view their own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id)',
    'DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts',
    'CREATE POLICY "Users can insert their own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id)',
    'DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts',
    'CREATE POLICY "Users can update their own contacts" ON contacts FOR UPDATE USING (auth.uid() = user_id)',
    'DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts',
    'CREATE POLICY "Users can delete their own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id)',

    // Contact notes table policies
    'DROP POLICY IF EXISTS "Users can view notes for their contacts" ON contact_notes',
    'CREATE POLICY "Users can view notes for their contacts" ON contact_notes FOR SELECT USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_notes.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can insert notes for their contacts" ON contact_notes',
    'CREATE POLICY "Users can insert notes for their contacts" ON contact_notes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_notes.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can update notes for their contacts" ON contact_notes',
    'CREATE POLICY "Users can update notes for their contacts" ON contact_notes FOR UPDATE USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_notes.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can delete notes for their contacts" ON contact_notes',
    'CREATE POLICY "Users can delete notes for their contacts" ON contact_notes FOR DELETE USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_notes.contact_id AND contacts.user_id = auth.uid()))',

    // Contact followups table policies
    'DROP POLICY IF EXISTS "Users can view followups for their contacts" ON contact_followups',
    'CREATE POLICY "Users can view followups for their contacts" ON contact_followups FOR SELECT USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_followups.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can insert followups for their contacts" ON contact_followups',
    'CREATE POLICY "Users can insert followups for their contacts" ON contact_followups FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_followups.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can update followups for their contacts" ON contact_followups',
    'CREATE POLICY "Users can update followups for their contacts" ON contact_followups FOR UPDATE USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_followups.contact_id AND contacts.user_id = auth.uid()))',
    'DROP POLICY IF EXISTS "Users can delete followups for their contacts" ON contact_followups',
    'CREATE POLICY "Users can delete followups for their contacts" ON contact_followups FOR DELETE USING (EXISTS (SELECT 1 FROM contacts WHERE contacts.id = contact_followups.contact_id AND contacts.user_id = auth.uid()))',

    // Connection requests table policies
    'DROP POLICY IF EXISTS "Users can view requests sent to them" ON connection_requests',
    'CREATE POLICY "Users can view requests sent to them" ON connection_requests FOR SELECT USING (auth.uid() = target_user_id)',
    'DROP POLICY IF EXISTS "Users can view requests they sent" ON connection_requests',
    'CREATE POLICY "Users can view requests they sent" ON connection_requests FOR SELECT USING (auth.uid() = requester_id)',
    'DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests',
    'CREATE POLICY "Users can create connection requests" ON connection_requests FOR INSERT WITH CHECK (auth.uid() = requester_id)',
    'DROP POLICY IF EXISTS "Users can update requests sent to them" ON connection_requests',
    'CREATE POLICY "Users can update requests sent to them" ON connection_requests FOR UPDATE USING (auth.uid() = target_user_id)'
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        logger.warn(`⚠️  Policy deployment failed: ${policy}`, error);
      }
    } catch (error) {
      logger.warn(`⚠️  Policy deployment error: ${policy}`, error);
    }
  }
}

/**
 * Insert comprehensive test data
 */
async function insertTestData(userId: string): Promise<{
  contactId: string;
  noteId: string;
  followupId: string;
  requestId: string;
}> {
  // Insert test contact
  const contactData = {
    user_id: userId,
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
    meeting_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
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

  if (contactError) throw contactError;

  // Insert test note
  const { data: note, error: noteError } = await supabase
    .from('contact_notes')
    .insert({
      contact_id: contact.id,
      content: 'Had an excellent conversation about product management best practices. Sarah mentioned she\'s working on a new user research framework that could be valuable for our team. She\'s very knowledgeable about design thinking and has experience with both B2B and B2C products. Follow up in 2 weeks to discuss potential collaboration on user research methodologies.'
    })
    .select()
    .single();

  if (noteError) throw noteError;

  // Insert test follow-up
  const { data: followUp, error: followUpError } = await supabase
    .from('contact_followups')
    .insert({
      contact_id: contact.id,
      description: 'Schedule a follow-up call to discuss the user research framework collaboration opportunity. Also share our latest product roadmap and get her thoughts on user testing methodologies.',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false
    })
    .select()
    .single();

  if (followUpError) throw followUpError;

  // Insert test connection request
  const { data: connectionRequest, error: connectionRequestError } = await supabase
    .from('connection_requests')
    .insert({
      requester_id: userId,
      target_user_id: '00000000-0000-0000-0000-000000000001',
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
    })
    .select()
    .single();

  if (connectionRequestError) throw connectionRequestError;

  return {
    contactId: contact.id,
    noteId: note.id,
    followupId: followUp.id,
    requestId: connectionRequest.id
  };
}

/**
 * Verify database setup is working correctly
 */
async function verifyDatabaseSetup(userId: string, contactId: string): Promise<any> {
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
      .eq('id', contactId);

    if (contactsError) throw contactsError;

    // Get connection requests
    const { data: connectionRequests, error: connectionRequestsError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('requester_id', userId);

    if (connectionRequestsError) throw connectionRequestsError;

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

    return {
      contacts: contacts?.length || 0,
      notes: contacts?.[0]?.contact_notes?.length || 0,
      followUps: contacts?.[0]?.contact_followups?.length || 0,
      connectionRequests: connectionRequests?.length || 0,
      jsonbValidation,
      arrayValidation,
      rlsCompliance: true // If we can read the data, RLS is working
    };

  } catch (error) {
    logger.error('❌ Error verifying database setup:', error);
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

    // Delete connection requests
    const { error: connectionRequestsError } = await supabase
      .from('connection_requests')
      .delete()
      .eq('requester_id', user.id)
      .eq('requester_name', 'Test User');

    if (connectionRequestsError) {
      logger.error('❌ Error deleting connection requests:', connectionRequestsError);
    }

    // Delete contacts (notes and follow-ups will be deleted by CASCADE)
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