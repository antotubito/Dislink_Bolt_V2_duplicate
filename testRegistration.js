// testRegistration.js

async function testRegistration() {
    try {
      // Simulated API response for testing — replace with real Supabase call later
      const data = { session: null }; // session will be null if user is not logged in
  
      console.log('Session active:', data.session ? 'Yes' : 'No');
  
      if (!data.session) {
        console.log('📧 Email confirmation required - check email for confirmation link');
        console.log('🔗 Expected redirect URLs:');
        const redirectURLs = [
          'http://localhost:3001/*',
          'http://localhost:3001/confirmed',
          'https://dislinkboltv2duplicate.netlify.app/*',
          'https://dislinkboltv2duplicate.netlify.app/confirmed'
        ];
        
        redirectURLs.forEach(url => console.log('  ' + url));
  
        console.log('🔧 CRITICAL: Supabase redirect URLs need to be updated immediately!');
      }
  
    } catch (err) {
      console.log('🚨 Network error:', err.message);
    }
  }
  
  // Run the function
  testRegistration();
  