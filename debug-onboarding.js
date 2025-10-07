// 🐛 DISLINK ONBOARDING DEBUG SCRIPT
// Copy and paste this into your browser console to debug onboarding redirects

console.log('🐛 Dislink Onboarding Debug Script Loaded!');
console.log('Available functions:');
console.log('- debugOnboardingStatus() - Check current onboarding status');
console.log('- debugUserData() - Show current user data');
console.log('- debugAuthState() - Show authentication state');
console.log('- fixOnboardingRedirect() - Attempt to fix redirect issues');

// Debug onboarding status
async function debugOnboardingStatus() {
  console.log('🔍 Debugging Onboarding Status...');
  
  try {
    // Check if we have access to Supabase
    if (typeof window.supabase === 'undefined') {
      console.log('❌ Supabase client not available');
      return;
    }

    // Get current session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError);
      return;
    }

    if (!session?.user) {
      console.log('❌ No active session');
      return;
    }

    console.log('✅ Active session found:', {
      userId: session.user.id,
      email: session.user.email,
      createdAt: session.user.created_at
    });

    // Get profile data
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.log('❌ Profile error:', profileError);
      return;
    }

    console.log('📊 Profile Data:', {
      id: profile.id,
      email: profile.email,
      onboarding_complete: profile.onboarding_complete,
      onboarding_completed_at: profile.onboarding_completed_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    });

    // Check onboarding status
    const needsOnboarding = !profile.onboarding_complete;
    console.log('🎯 Onboarding Status:', {
      needsOnboarding: needsOnboarding,
      onboardingComplete: profile.onboarding_complete,
      shouldRedirect: needsOnboarding
    });

    return {
      session: session,
      profile: profile,
      needsOnboarding: needsOnboarding
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
}

// Debug user data
function debugUserData() {
  console.log('🔍 Debugging User Data...');
  
  try {
    // Check if we have access to auth context
    if (typeof window.supabaseDebug === 'undefined') {
      console.log('❌ Supabase debug functions not available');
      return;
    }

    // Get current user from auth context
    const user = window.supabaseDebug.supabase?.auth?.user;
    console.log('👤 Current User:', user);

    // Check onboarding status
    const onboardingComplete = user?.onboardingComplete ?? user?.onboarding_complete;
    console.log('🎯 Onboarding Status:', {
      onboardingComplete: onboardingComplete,
      type: typeof onboardingComplete,
      needsOnboarding: onboardingComplete === false || onboardingComplete === undefined || onboardingComplete === null
    });

    return {
      user: user,
      onboardingComplete: onboardingComplete
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
}

// Debug auth state
function debugAuthState() {
  console.log('🔍 Debugging Auth State...');
  
  try {
    console.log('🌐 Current URL:', window.location.href);
    console.log('📍 Current Path:', window.location.pathname);
    
    // Check if we're on onboarding page
    const isOnOnboarding = window.location.pathname === '/app/onboarding';
    console.log('🎯 On Onboarding Page:', isOnOnboarding);

    // Check localStorage for any stored data
    const redirectUrl = localStorage.getItem('redirectUrl');
    console.log('🔄 Stored Redirect URL:', redirectUrl);

    // Check for any auth-related localStorage keys
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('session') || key.includes('user')
    );
    console.log('🔑 Auth-related localStorage keys:', authKeys);

    return {
      currentUrl: window.location.href,
      currentPath: window.location.pathname,
      isOnOnboarding: isOnOnboarding,
      redirectUrl: redirectUrl,
      authKeys: authKeys
    };

  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error: error.message };
  }
}

// Fix onboarding redirect issues
async function fixOnboardingRedirect() {
  console.log('🔧 Attempting to Fix Onboarding Redirect...');
  
  try {
    // First, debug the current status
    const status = await debugOnboardingStatus();
    
    if (status.error) {
      console.log('❌ Cannot fix - debug failed:', status.error);
      return;
    }

    if (!status.needsOnboarding) {
      console.log('✅ User already has onboarding complete, no fix needed');
      return;
    }

    // If user has been using the app for a while, mark onboarding as complete
    if (status.profile.created_at) {
      const createdAt = new Date(status.profile.created_at);
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > 1) {
        console.log('🔧 User created more than 1 day ago, marking onboarding as complete...');
        
        const { error: updateError } = await window.supabase
          .from('profiles')
          .update({
            onboarding_complete: true,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', status.session.user.id);

        if (updateError) {
          console.log('❌ Failed to update onboarding status:', updateError);
          return;
        }

        console.log('✅ Onboarding marked as complete!');
        console.log('🔄 Please refresh the page to see changes');
        
        return { success: true, message: 'Onboarding marked as complete' };
      }
    }

    console.log('ℹ️ User is new or recently created, onboarding redirect is expected');
    return { success: false, message: 'User needs to complete onboarding' };

  } catch (error) {
    console.error('❌ Fix error:', error);
    return { error: error.message };
  }
}

// Complete debug function
async function debugOnboardingComplete() {
  console.log('🧪 Running Complete Onboarding Debug...');
  
  try {
    const results = {
      authState: debugAuthState(),
      userData: debugUserData(),
      onboardingStatus: await debugOnboardingStatus()
    };
    
    console.log('📊 Complete Debug Results:', results);
    
    // Provide recommendations
    if (results.onboardingStatus?.needsOnboarding) {
      console.log('💡 Recommendation: User needs onboarding or there may be a redirect loop');
      console.log('🔧 Try: fixOnboardingRedirect()');
    } else {
      console.log('✅ Onboarding status looks good');
    }
    
    return results;

  } catch (error) {
    console.error('❌ Complete debug failed:', error);
    return { error: error.message };
  }
}

console.log('🎉 Onboarding debug suite ready!');
console.log('Try: debugOnboardingComplete()');
