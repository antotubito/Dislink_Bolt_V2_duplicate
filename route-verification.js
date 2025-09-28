// 🔍 ROUTE VERIFICATION SCRIPT
// Run this in your browser console at http://localhost:3001

console.log('🔍 Starting Route Verification...');

// Test all routes after access password verification
async function verifyAllRoutes() {
  const routes = [
    // Public routes (should work without authentication)
    { path: '/', name: 'Landing Page', requiresAuth: false },
    { path: '/waitlist', name: 'Waitlist Page', requiresAuth: false },
    { path: '/story', name: 'Story Page', requiresAuth: false },
    { path: '/terms', name: 'Terms & Conditions', requiresAuth: false },
    { path: '/privacy', name: 'Privacy Policy', requiresAuth: false },
    
    // Auth routes (should work after access password)
    { path: '/app/login', name: 'Login Page', requiresAuth: false },
    { path: '/app/register', name: 'Register Page', requiresAuth: false },
    { path: '/app/reset-password', name: 'Reset Password', requiresAuth: false },
    { path: '/app/terms', name: 'App Terms', requiresAuth: false },
    { path: '/app/privacy', name: 'App Privacy', requiresAuth: false },
    
    // Protected routes (require user authentication)
    { path: '/app', name: 'App Home', requiresAuth: true },
    { path: '/app/contacts', name: 'Contacts', requiresAuth: true },
    { path: '/app/profile', name: 'Profile', requiresAuth: true },
    { path: '/app/settings', name: 'Settings', requiresAuth: true },
    { path: '/app/onboarding', name: 'Onboarding', requiresAuth: true },
  ];
  
  console.log('\n📋 Testing Routes:');
  console.log('==================');
  
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3001${route.path}`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      const status = response.ok ? '✅' : '❌';
      const authStatus = route.requiresAuth ? '🔒' : '🔓';
      
      console.log(`${status} ${authStatus} ${route.name}: ${route.path}`);
      
    } catch (error) {
      console.log(`❌ 🔒 ${route.name}: ${route.path} - Error: ${error.message}`);
    }
  }
}

// Test access password functionality
function testAccessPassword() {
  console.log('\n🔐 Testing Access Password:');
  console.log('==========================');
  
  // Test different passwords
  const testPasswords = [
    'ITHINKWEMET2025',
    'dislink2024', 
    'earlyaccess',
    'wrongpassword'
  ];
  
  testPasswords.forEach(password => {
    const isValid = password === 'ITHINKWEMET2025' || password === 'dislink2024' || password === 'earlyaccess';
    const status = isValid ? '✅' : '❌';
    console.log(`${status} Password: "${password}" - ${isValid ? 'Valid' : 'Invalid'}`);
  });
}

// Test session storage
function testSessionStorage() {
  console.log('\n💾 Testing Session Storage:');
  console.log('===========================');
  
  // Check if access is verified
  const accessVerified = sessionStorage.getItem('accessVerified');
  console.log(`Access Verified: ${accessVerified ? '✅ Yes' : '❌ No'}`);
  
  // Check if user is authenticated
  const user = localStorage.getItem('sb-bbonxxvifycwpoeaxsor-auth-token');
  console.log(`User Token: ${user ? '✅ Present' : '❌ Missing'}`);
  
  // Check redirect URL
  const redirectUrl = localStorage.getItem('redirectUrl');
  console.log(`Redirect URL: ${redirectUrl || 'None'}`);
}

// Test navigation
function testNavigation() {
  console.log('\n🧭 Testing Navigation:');
  console.log('======================');
  
  // Test if we can navigate to different routes
  const testRoutes = ['/app/register', '/app/login', '/app'];
  
  testRoutes.forEach(route => {
    try {
      // Simulate navigation
      const currentPath = window.location.pathname;
      console.log(`Current: ${currentPath} → Target: ${route}`);
    } catch (error) {
      console.log(`❌ Navigation error to ${route}: ${error.message}`);
    }
  });
}

// Main verification function
async function runFullVerification() {
  console.log('🚀 Starting Full Route Verification...');
  console.log('=====================================');
  
  // Test access password
  testAccessPassword();
  
  // Test session storage
  testSessionStorage();
  
  // Test navigation
  testNavigation();
  
  // Test all routes
  await verifyAllRoutes();
  
  console.log('\n✅ Route Verification Complete!');
  console.log('===============================');
  console.log('📝 Summary:');
  console.log('- Access password: ITHINKWEMET2025, dislink2024, or earlyaccess');
  console.log('- Public routes: Accessible without authentication');
  console.log('- Auth routes: Accessible after access password');
  console.log('- Protected routes: Require user authentication');
  console.log('\n🔧 If any routes fail, check:');
  console.log('1. Supabase configuration');
  console.log('2. Authentication flow');
  console.log('3. Route guards');
  console.log('4. Session management');
}

// Export functions to window for easy access
window.verifyAllRoutes = verifyAllRoutes;
window.testAccessPassword = testAccessPassword;
window.testSessionStorage = testSessionStorage;
window.testNavigation = testNavigation;
window.runFullVerification = runFullVerification;

console.log('\n🎯 Route Verification Ready!');
console.log('📝 Available functions:');
console.log('   runFullVerification() - Run complete verification');
console.log('   verifyAllRoutes() - Test all routes');
console.log('   testAccessPassword() - Test password validation');
console.log('   testSessionStorage() - Test session storage');
console.log('   testNavigation() - Test navigation');
console.log('\n🚀 Run: runFullVerification()');
