// 📧 EMAIL REGISTRATION DIAGNOSTIC SCRIPT
// Run this in your browser console at http://localhost:3001

console.log('🧪 Starting Email Registration Diagnostic...');

// Test email registration function
async function testEmailRegistration(testEmail = null) {
    const email = testEmail || `test.${Date.now()}@example.com`;

    console.log('📧 Test email:', email);
    console.log('🔗 Redirect URL:', `${window.location.origin}/confirmed`);

    try {
        // Get Supabase client from window (if available)
        const supabase = window.supabase || window.supabaseClient;

        if (!supabase) {
            console.log('❌ Supabase client not found. Make sure you\'re on the app page.');
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: 'testpassword123',
            options: {
                data: {
                    firstName: 'Test',
                    lastName: 'User',
                    full_name: 'Test User'
                },
                emailRedirectTo: `${window.location.origin}/confirmed`
            }
        });

        console.log('\n📊 Registration Result:');
        console.log('Data:', data);

        if (error) {
            console.log('❌ Registration Error:', error.message);

            if (error.message.includes('Email not confirmed')) {
                console.log('\n💡 ISSUE: Email confirmation required but not being sent');
                console.log('🔧 SOLUTION: Check Supabase Dashboard → Authentication → Settings');
                console.log('   ✅ Enable "Confirm email"');
                console.log('   ✅ Check URL Configuration');
            } else if (error.message.includes('already registered')) {
                console.log('\n💡 User already exists (this is normal for test emails)');
                console.log('🔧 Try with a different email address');
            } else if (error.message.includes('Invalid email')) {
                console.log('\n💡 Invalid email format');
                console.log('🔧 Use a valid email address');
            } else if (error.message.includes('Password')) {
                console.log('\n💡 Password validation error');
                console.log('🔧 Password must be at least 6 characters');
            } else {
                console.log('\n🚨 Unexpected error - check SUPABASE_EMAIL_DIAGNOSIS.md');
                console.log('Error details:', error);
            }
        } else {
            console.log('✅ Registration submitted successfully!');

            if (data.user && !data.session) {
                console.log('\n📧 ✅ EMAIL CONFIRMATION REQUIRED');
                console.log('📧 User should receive confirmation email at:', email);
                console.log('⏰ Email should arrive within 1-2 minutes');
                console.log('📁 Check spam folder if not in inbox');
                console.log('🔗 Email will redirect to:', `${window.location.origin}/confirmed`);
            } else if (data.session) {
                console.log('\n⚠️ USER LOGGED IN IMMEDIATELY');
                console.log('⚠️ This suggests email confirmation is DISABLED in Supabase');
                console.log('🔧 Check Supabase Dashboard → Authentication → Settings');
                console.log('   ✅ Enable "Confirm email"');
            }
        }

    } catch (err) {
        console.log('❌ Connection Error:', err.message);
        console.log('🔧 Check your internet connection and Supabase configuration');
    }
}

// Export function to window for easy access
window.testEmailRegistration = testEmailRegistration;

console.log('\n🎯 DIAGNOSTIC READY!');
console.log('📝 To test with your email, run:');
console.log('   testEmailRegistration("your.email@gmail.com")');
console.log('\n📝 To test with random email, run:');
console.log('   testEmailRegistration()');
console.log('\n📋 Check the results above for specific error messages and solutions.');
