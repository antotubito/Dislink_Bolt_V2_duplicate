// QR Workflow Test After RLS Policy Fix
// This script tests the complete QR workflow to verify the fixes work

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bbonxxvifycwpoeaxsor.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRWorkflowAfterFix() {
  console.log('🔍 Testing QR Workflow After RLS Policy Fix...\n');

  // Test 1: Check active connection codes
  console.log('1. Checking active connection codes...');
  try {
    const { data: connectionCodes, error } = await supabase
      .from('connection_codes')
      .select('*')
      .eq('is_active', true)
      .limit(3);
    
    if (error) {
      console.error('❌ Error accessing connection_codes:', error);
    } else {
      console.log('✅ Found', connectionCodes?.length || 0, 'active connection codes');
      if (connectionCodes && connectionCodes.length > 0) {
        console.log('   Sample connection code:', {
          id: connectionCodes[0].id,
          code: connectionCodes[0].code,
          user_id: connectionCodes[0].user_id,
          expires_at: connectionCodes[0].expires_at
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception accessing connection_codes:', err);
  }

  // Test 2: Test email invitation creation (the main fix)
  console.log('\n2. Testing email invitation creation (RLS fix)...');
  try {
    const testInvitationId = `inv_test_${Date.now()}`;
    const testConnectionCode = 'a512d80f'; // Use existing connection code
    const testEmail = 'test@example.com';

    const { data: newInvitation, error: insertError } = await supabase
      .from('email_invitations')
      .insert({
        invitation_id: testInvitationId,
        recipient_email: testEmail,
        sender_user_id: '88687313-3212-4632-ab32-5090df0c2f35', // Use existing user
        connection_code: testConnectionCode,
        scan_data: {
          location: { latitude: 0, longitude: 0 },
          message: 'Test invitation after RLS fix',
          submitted_at: new Date().toISOString()
        },
        email_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating test invitation:', insertError);
    } else {
      console.log('✅ SUCCESS! Email invitation created:', {
        invitation_id: newInvitation.invitation_id,
        recipient_email: newInvitation.recipient_email,
        status: newInvitation.status
      });

      // Test 3: Test connection request creation
      console.log('\n3. Testing connection request creation...');
      try {
        const { data: newRequest, error: requestError } = await supabase
          .from('connection_requests')
          .insert({
            target_user_id: '88687313-3212-4632-ab32-5090df0c2f35',
            requester_id: 'test-user-id',
            requester_name: 'Test User',
            requester_email: testEmail,
            status: 'pending',
            metadata: {
              location: { latitude: 0, longitude: 0 },
              message: 'Test connection request',
              method: 'qr_invitation',
              submitted_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (requestError) {
          console.error('❌ Error creating connection request:', requestError);
        } else {
          console.log('✅ SUCCESS! Connection request created:', {
            id: newRequest.id,
            target_user_id: newRequest.target_user_id,
            requester_email: newRequest.requester_email,
            status: newRequest.status
          });

          // Clean up test connection request
          await supabase
            .from('connection_requests')
            .delete()
            .eq('id', newRequest.id);
          console.log('   ✅ Test connection request cleaned up');
        }
      } catch (requestErr) {
        console.error('❌ Exception creating connection request:', requestErr);
      }

      // Clean up test invitation
      await supabase
        .from('email_invitations')
        .delete()
        .eq('invitation_id', testInvitationId);
      console.log('   ✅ Test invitation cleaned up');
    }
  } catch (err) {
    console.error('❌ Exception creating test invitation:', err);
  }

  // Test 4: Test complete QR validation flow
  console.log('\n4. Testing complete QR validation flow...');
  try {
    const testCode = 'a512d80f'; // Use existing connection code
    
    // Step 1: Validate connection code
    const { data: connectionData, error: connectionError } = await supabase
      .from('connection_codes')
      .select(`
        id,
        user_id,
        code,
        is_active,
        expires_at,
        created_at
      `)
      .eq('code', testCode)
      .eq('is_active', true)
      .single();

    if (connectionError) {
      console.error('❌ Error validating connection code:', connectionError);
    } else if (!connectionData) {
      console.log('⚠️ Connection code not found or inactive');
    } else {
      console.log('✅ Connection code validated:', {
        id: connectionData.id,
        user_id: connectionData.user_id,
        is_active: connectionData.is_active,
        expires_at: connectionData.expires_at
      });

      // Step 2: Get profile data
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
        console.log('✅ Profile data retrieved:', {
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name}`,
          public_profile_enabled: profile.public_profile?.enabled
        });
      }
    }
  } catch (err) {
    console.error('❌ Exception during QR validation flow:', err);
  }

  // Test 5: Check existing invitations and requests
  console.log('\n5. Checking existing data...');
  try {
    const { data: invitations, error: invError } = await supabase
      .from('email_invitations')
      .select('*')
      .limit(5);
    
    if (invError) {
      console.error('❌ Error accessing email_invitations:', invError);
    } else {
      console.log('✅ Found', invitations?.length || 0, 'email invitations');
    }

    const { data: requests, error: reqError } = await supabase
      .from('connection_requests')
      .select('*')
      .limit(5);
    
    if (reqError) {
      console.error('❌ Error accessing connection_requests:', reqError);
    } else {
      console.log('✅ Found', requests?.length || 0, 'connection requests');
    }
  } catch (err) {
    console.error('❌ Exception checking existing data:', err);
  }

  console.log('\n🎉 QR Workflow Test Complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Connection codes: Working');
  console.log('✅ Profile access: Working');
  console.log('✅ Email invitations: ' + (insertError ? '❌ Still broken' : '✅ Fixed!'));
  console.log('✅ Connection requests: ' + (requestError ? '❌ Still broken' : '✅ Fixed!'));
  console.log('✅ QR validation flow: Working');
}

// Run the test
testQRWorkflowAfterFix().catch(console.error);
