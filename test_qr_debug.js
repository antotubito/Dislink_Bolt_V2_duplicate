// QR Code Debug Test Script
// This script tests the QR code flow to identify the issue

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bbonxxvifycwpoeaxsor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NzQ4NzEsImV4cCI6MjA1MDE1MDg3MX0.8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRFlow() {
  console.log('🔍 Testing QR Code Flow...\n');

  // Test 1: Check if we can read connection_codes as anonymous user
  console.log('1. Testing anonymous access to connection_codes table...');
  try {
    const { data, error } = await supabase
      .from('connection_codes')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing connection_codes:', error);
    } else {
      console.log('✅ Successfully accessed connection_codes:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('   Sample record:', {
          id: data[0].id,
          code: data[0].code,
          is_active: data[0].is_active,
          expires_at: data[0].expires_at
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception accessing connection_codes:', err);
  }

  // Test 2: Check if we can read profiles as anonymous user
  console.log('\n2. Testing anonymous access to profiles table...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_profile')
      .limit(5);
    
    if (error) {
      console.error('❌ Error accessing profiles:', error);
    } else {
      console.log('✅ Successfully accessed profiles:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('   Sample record:', {
          id: data[0].id,
          name: `${data[0].first_name} ${data[0].last_name}`,
          public_profile_enabled: data[0].public_profile?.enabled
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception accessing profiles:', err);
  }

  // Test 3: Test a specific connection code (if any exist)
  console.log('\n3. Testing specific connection code validation...');
  try {
    // First get a connection code
    const { data: codes, error: codesError } = await supabase
      .from('connection_codes')
      .select('code')
      .eq('is_active', true)
      .limit(1);
    
    if (codesError || !codes || codes.length === 0) {
      console.log('⚠️ No active connection codes found to test');
    } else {
      const testCode = codes[0].code;
      console.log('   Testing with code:', testCode);
      
      // Test the validation logic
      const { data: connectionData, error: connectionError } = await supabase
        .from('connection_codes')
        .select(`
          id,
          user_id,
          code,
          is_active,
          expires_at,
          created_at,
          updated_at
        `)
        .eq('code', testCode)
        .eq('is_active', true)
        .single();

      if (connectionError) {
        console.error('❌ Error validating connection code:', connectionError);
      } else if (!connectionData) {
        console.log('⚠️ Connection code not found or inactive');
      } else {
        console.log('✅ Connection code found:', {
          id: connectionData.id,
          user_id: connectionData.user_id,
          is_active: connectionData.is_active,
          expires_at: connectionData.expires_at
        });

        // Test profile access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            job_title,
            company,
            profile_image,
            bio,
            interests,
            social_links,
            public_profile
          `)
          .eq('id', connectionData.user_id)
          .single();

        if (profileError) {
          console.error('❌ Error accessing profile:', profileError);
        } else if (!profile) {
          console.log('⚠️ Profile not found for user:', connectionData.user_id);
        } else {
          console.log('✅ Profile found:', {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            public_profile_enabled: profile.public_profile?.enabled
          });
        }
      }
    }
  } catch (err) {
    console.error('❌ Exception during connection code validation:', err);
  }

  console.log('\n🔍 QR Code Flow Test Complete');
}

// Run the test
testQRFlow().catch(console.error);
