import { supabase, handleSupabaseError } from './supabase';
import { logger } from './logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Enhanced login function with better error handling
export async function login(credentials: LoginCredentials): Promise<{ 
  user: any; 
  session: any; 
  error: AuthError | null;
  success: boolean;
  requiresOnboarding?: boolean;
  emailConfirmationRequired?: boolean;
  emailNotFound?: boolean;
}> {
  try {
    // 🔍 PRODUCTION DEBUG LOGGING
    console.log('🔍 AUTH: Starting login function', {
      email: credentials.email.substring(0, 5) + '...',
      hasPassword: !!credentials.password,
      supabaseReady: typeof supabase !== 'undefined'
    });
    
    logger.info('🔐 Attempting login for:', credentials.email);
    
    // Validate input
    if (!credentials.email || !credentials.password) {
      console.log('🔍 AUTH: Validation failed - missing credentials');
      return {
        user: null,
        session: null,
        error: { message: 'Email and password are required' },
        success: false
      };
    }

    console.log('🔍 AUTH: About to call signInWithPassword');
    
    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    console.log('🔍 AUTH: signInWithPassword result:', {
      hasData: !!data,
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message,
      errorCode: error?.code || error?.status
    });

    if (error) {
      console.error('🔍 AUTH: Login error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error
      });
      
      logger.error('Login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        return {
          user: null,
          session: null,
          error: null,
          success: false,
          emailConfirmationRequired: true
        };
      }
      
      if (error.message.includes('Invalid login credentials')) {
        // Check if user exists but password is wrong vs user doesn't exist
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', credentials.email.trim().toLowerCase())
            .limit(1);
            
          if (!profiles || profiles.length === 0) {
            return {
              user: null,
              session: null,
              error: null,
              success: false,
              emailNotFound: true
            };
          }
        } catch (profileError) {
          logger.error('Error checking profile existence:', profileError);
        }
      }
      
      return {
        user: null,
        session: null,
        error: { 
          message: handleSupabaseError(error, 'login'),
          code: error.message 
        },
        success: false
      };
    }

    if (!data.user || !data.session) {
      return {
        user: null,
        session: null,
        error: { message: 'Login failed: No user data received' },
        success: false
      };
    }

    // Check if user has completed onboarding
    let requiresOnboarding = false;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single();
        
      if (!profileError && profile) {
        requiresOnboarding = !profile.onboarding_complete;
      }
    } catch (profileError) {
      logger.warn('Could not check onboarding status:', profileError);
    }

    logger.info('✅ Login successful for:', credentials.email);
    
    return {
      user: data.user,
      session: data.session,
      error: null,
      success: true,
      requiresOnboarding
    };
    
  } catch (error) {
    logger.error('Critical login error:', error);
    return {
      user: null,
      session: null,
      error: { 
        message: 'A network error occurred. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      },
      success: false
    };
  }
}

// Enhanced registration function
export async function register(userData: RegisterData): Promise<{ user: any; session: any; error: AuthError | null }> {
  try {
    logger.info('📝 Attempting registration for:', userData.email);
    
    // Validate input
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      return {
        user: null,
        session: null,
        error: { message: 'All fields are required' }
      };
    }

    if (userData.password.length < 6) {
      return {
        user: null,
        session: null,
        error: { message: 'Password must be at least 6 characters long' }
      };
    }

    // Attempt sign up
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      options: {
        data: {
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`
        },
        emailRedirectTo: `${window.location.origin}/confirmed`
      }
    });

    if (error) {
      logger.error('Registration error:', error);
      return {
        user: null,
        session: null,
        error: { 
          message: handleSupabaseError(error, 'registration'),
          code: error.message 
        }
      };
    }

    logger.info('✅ Registration initiated for:', userData.email);
    
    return {
      user: data.user,
      session: data.session,
      error: null
    };
    
  } catch (error) {
    logger.error('Critical registration error:', error);
    return {
      user: null,
      session: null,
      error: { 
        message: 'A network error occurred. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      }
    };
  }
}

// Enhanced logout function
export async function logout(): Promise<{ error: AuthError | null }> {
  try {
    logger.info('🚪 Attempting logout...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Logout error:', error);
      return {
        error: { 
          message: handleSupabaseError(error, 'logout'),
          code: error.message 
        }
      };
    }

    logger.info('✅ Logout successful');
    
    return { error: null };
    
  } catch (error) {
    logger.error('Critical logout error:', error);
    return {
      error: { 
        message: 'Failed to logout properly. Please refresh the page.',
        code: 'LOGOUT_ERROR'
      }
    };
  }
}

// Enhanced password reset function
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    logger.info('🔄 Attempting password reset for:', email);
    
    if (!email) {
      return {
        error: { message: 'Email is required for password reset' }
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/app/reset-password`
    });
    
    if (error) {
      logger.error('Password reset error:', error);
      return {
        error: { 
          message: handleSupabaseError(error, 'password reset'),
          code: error.message 
        }
      };
    }

    logger.info('✅ Password reset email sent to:', email);
    
    return { error: null };
    
  } catch (error) {
    logger.error('Critical password reset error:', error);
    return {
      error: { 
        message: 'Failed to send password reset email. Please try again.',
        code: 'RESET_ERROR'
      }
    };
  }
}

// Function to check if user is already registered
export async function checkUserRegistration(email: string): Promise<{ exists: boolean; confirmed: boolean; error: AuthError | null }> {
  try {
    // Try to sign up with a temporary password to check if user exists
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: 'temporary-check-password-' + Math.random(),
      options: {
        emailRedirectTo: `${window.location.origin}/confirmed`
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { exists: true, confirmed: true, error: null };
      }
      
      return { 
        exists: false, 
        confirmed: false, 
        error: { 
          message: handleSupabaseError(error, 'user check'),
          code: error.message 
        }
      };
    }

    // If no error, user doesn't exist or needs confirmation
    return { 
      exists: data.user ? true : false, 
      confirmed: data.session ? true : false, 
      error: null 
    };
    
  } catch (error) {
    logger.error('Error checking user registration:', error);
    return { 
      exists: false, 
      confirmed: false, 
      error: { 
        message: 'Unable to verify user status. Please try again.',
        code: 'CHECK_ERROR'
      }
    };
  }
}

// Backward compatibility aliases
export const signUp = register;

// Stub functions for backward compatibility (admin/testing features)
export function getAccessRequests() {
  return []; // Return empty array for now
}

export function approveAccessRequest(userId: string) {
  logger.info('Approving access request', { userId });
  return `User ${userId} has been approved for testing access.`;
}

export function declineAccessRequest(userId: string) {
  logger.info('Declining access request', { userId });
  return `User ${userId} access request has been declined.`;
}

export function getTestUsers() {
  return [
    { email: "john@techinnovations.dev", name: "John Developer" },
    { email: "user1@example.com", name: "User One" },
    { email: "user2@example.com", name: "User Two" }
  ];
}

// Current user function for backward compatibility
export async function getCurrentUser(): Promise<any> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      company: profile.company,
      jobTitle: profile.job_title,
      industry: profile.industry,
      profileImage: profile.profile_image,
      bio: profile.bio,
      interests: profile.interests,
      socialLinks: profile.social_links || {},
      onboardingComplete: profile.onboarding_complete,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at)
    };
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
}

// Password validation helper
export function validatePassword(password: string) {
  const minLength = 6; // Reduced from 8 for better UX
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: `Password must be at least ${minLength} characters long` };
  }

  // Basic validation - just check length for now to improve UX
  return { isValid: true, message: '' };
}

// 🔍 DIAGNOSTIC: Check user account state in Supabase
export async function diagnoseUserAccount(email: string): Promise<{
  exists: boolean;
  confirmed: boolean;
  inAuthUsers: boolean;
  inProfiles: boolean;
  details: any;
}> {
  try {
    console.log('🔍 DIAGNOSING USER ACCOUNT:', email);
    
    const result = {
      exists: false,
      confirmed: false,
      inAuthUsers: false,
      inProfiles: false,
      details: {}
    };
    
    // Check if user exists in profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase());
    
    if (!profileError && profiles && profiles.length > 0) {
      result.inProfiles = true;
      result.exists = true;
      result.details.profile = profiles[0];
      console.log('🔍 User found in profiles:', profiles[0]);
    }
    
    // Try to sign up with a dummy password to check auth state
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: 'dummy-password-for-testing-' + Math.random()
    });
    
    if (signupError) {
      console.log('🔍 Signup test error:', signupError.message);
      
      if (signupError.message.includes('already registered') || 
          signupError.message.includes('already exists')) {
        result.inAuthUsers = true;
        result.exists = true;
        result.confirmed = true;
      } else if (signupError.message.includes('not confirmed')) {
        result.inAuthUsers = true;
        result.exists = true;
        result.confirmed = false;
      }
    } else if (signupData.user) {
      // User was created (shouldn't happen if they exist)
      result.exists = false;
      console.log('🔍 New user created during test');
    }
    
    console.log('🔍 DIAGNOSIS COMPLETE:', result);
    return result;
    
  } catch (error) {
    console.error('🔍 Error diagnosing user account:', error);
    return {
      exists: false,
      confirmed: false,
      inAuthUsers: false,
      inProfiles: false,
      details: { error: error.message }
    };
  }
}

// 🔧 ENHANCED LOGIN with proper error handling
export async function enhancedLogin(credentials: LoginCredentials): Promise<{ 
  user: any; 
  session: any; 
  error: AuthError | null;
  success: boolean;
  requiresOnboarding?: boolean;
  emailConfirmationRequired?: boolean;
  emailNotFound?: boolean;
  diagnosis?: any;
}> {
  try {
    console.log('🔍 ENHANCED LOGIN: Starting diagnosis for:', credentials.email);
    
    // First, diagnose the user account state
    const diagnosis = await diagnoseUserAccount(credentials.email);
    console.log('🔍 Account diagnosis:', diagnosis);
    
    // Attempt normal login
    const loginResult = await login(credentials);
    
    // If login failed, provide enhanced error info
    if (!loginResult.success && loginResult.error) {
      return {
        ...loginResult,
        diagnosis
      };
    }
    
    return loginResult;
    
  } catch (error) {
    console.error('🔍 Enhanced login error:', error);
    return {
      user: null,
      session: null,
      error: { message: error.message },
      success: false
    };
  }
}