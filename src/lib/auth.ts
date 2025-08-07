import { supabase } from './supabase';
import type { User, LoginCredentials, RegistrationData } from '../types/user';
import { logger } from './logger';
import { apiService } from './apiService';

// Get current user based on Supabase session
export async function getCurrentUser(): Promise<User | null> {
  try {
    logger.info('Getting current user');
    
    // Check Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      logger.error('Session error:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      logger.debug('No active session');
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // Check if it's a network error
      if (profileError.message?.includes('Failed to fetch')) {
        logger.error('Network error fetching profile:', profileError);
        throw new Error('Network error. Please check your internet connection.');
      }
      
      logger.error('Profile error:', profileError);
      throw profileError;
    }

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      middleName: profile.middle_name,
      lastName: profile.last_name,
      name: `${profile.first_name} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name}`.trim(),
      company: profile.company,
      jobTitle: profile.job_title,
      industry: profile.industry,
      profileImage: profile.profile_image,
      coverImage: profile.cover_image,
      bio: profile.bio,
      interests: profile.interests,
      socialLinks: profile.social_links || {},
      onboardingComplete: profile.onboarding_complete,
      registrationComplete: profile.registration_complete,
      registrationStatus: profile.registration_status,
      registrationCompletedAt: profile.registration_completed_at ? new Date(profile.registration_completed_at) : undefined,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      twoFactorEnabled: false,
      publicProfile: profile.public_profile || {
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
    };
  } catch (error) {
    logger.error('Error getting current user:', error);
    throw error;
  }
}

// Login using Supabase authentication
export async function login(credentials: LoginCredentials): Promise<{ 
  success: boolean; 
  requiresOnboarding?: boolean;
  emailConfirmationRequired?: boolean;
  emailNotFound?: boolean;
  error?: string;
}> {
  try {
    logger.info('🔑 Starting login attempt', { email: credentials.email });

    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔧 Supabase Environment Check:', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING',
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('❌ Supabase not configured - login cannot proceed');
      console.error('❌ SUPABASE CONFIG ERROR:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
      });
      
      return {
        success: false,
        error: 'Application configuration error. Please check Supabase credentials.'
      };
    }

    // Handle regular email/password login (simplified - no access key logic)
    if (!credentials.email?.trim() || !credentials.password?.trim()) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    console.log('📧 Preparing regular email/password login:', {
      email: credentials.email,
      emailLength: credentials.email.length,
      passwordLength: credentials.password.length
    });

    console.log('🚀 Calling supabase.auth.signInWithPassword...');
    const loginStartTime = Date.now();
    
    // Direct Supabase authentication - this should be fast for invalid credentials
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password
    });

    const loginDuration = Date.now() - loginStartTime;
    console.log('⏱️ Login attempt completed:', {
      duration: `${loginDuration}ms`,
      hasData: !!userData,
      hasSession: !!userData?.session,
      hasUser: !!userData?.user,
      hasError: !!userError,
      errorType: userError?.message || 'none'
    });

    // Handle errors first - this should be immediate for wrong credentials
    if (userError) {
      console.error('❌ Supabase login error details:', {
        message: userError.message,
        status: userError.status,
        statusText: userError.statusText
      });
      
      logger.error('Login error from Supabase:', userError);
      
      // Network errors
      if (userError.message.includes('Failed to fetch') || userError.message.includes('fetch')) {
        console.error('🌐 Network error detected during login');
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }
      
      // Email not confirmed
      if (userError.message.includes('Email not confirmed')) {
        console.log('📧 Email confirmation required');
        localStorage.setItem('confirmEmail', credentials.email);
        return {
          success: false,
          emailConfirmationRequired: true
        };
      }

      // Invalid credentials - this should be the most common case
      if (userError.message.includes('Invalid login credentials') || 
          userError.message.includes('Invalid') || 
          userError.status === 400) {
        console.log('🔐 Invalid credentials provided');
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.'
        };
      }

      // Rate limiting
      if (userError.message.includes('rate limit') || userError.message.includes('too many')) {
        console.log('⏰ Rate limit hit');
        return {
          success: false,
          error: 'Too many login attempts. Please wait a few minutes before trying again.'
        };
      }

      // Any other auth error
      console.error('❌ Other auth error:', userError.message);
      return {
        success: false,
        error: userError.message || 'Authentication failed. Please try again.'
      };
    }

    // Validate successful response
    if (!userData || !userData.session || !userData.user) {
      console.error('❌ Invalid response from Supabase - missing session or user data');
      return {
        success: false,
        error: 'Invalid response from authentication service. Please try again.'
      };
    }

    console.log('✅ Supabase login successful:', {
      hasSession: !!userData.session,
      sessionId: userData.session.access_token ? `${userData.session.access_token.substring(0, 10)}...` : 'none',
      userId: userData.user.id,
      userEmail: userData.user.email
    });

    console.log('👤 Fetching user profile from database...');
    
    // Get user profile with minimal data for login check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_complete, registration_status')
      .eq('id', userData.session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      // Don't fail login if profile fetch fails - user can still access the app
      logger.warn('Profile fetch failed during login, continuing anyway:', profileError);
      
      console.log('🎉 Login flow completed successfully (no profile data)');
      return { 
        success: true,
        requiresOnboarding: true // Default to requiring onboarding if we can't check
      };
    }

    console.log('📊 Profile fetch result:', {
      hasProfile: !!profile,
      onboardingComplete: profile?.onboarding_complete,
      registrationStatus: profile?.registration_status
    });

    logger.info('Login successful', { userId: userData.user?.id });
    
    console.log('🎉 Login flow completed successfully');
    
    return { 
      success: true,
      requiresOnboarding: !profile?.onboarding_complete
    };

  } catch (error) {
    console.error('💥 Top-level login error:', {
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : 'unknown',
      error
    });
    
    logger.error('Login error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    logger.info('Logging out user');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear any local storage items
    localStorage.removeItem('redirectUrl');
    localStorage.removeItem('confirmEmail');
    localStorage.removeItem('onboarding_progress');
    
    logger.info('Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
}

// Sign up
export async function signUp(data: RegistrationData): Promise<boolean> {
  try {
    logger.info('Starting user registration', { email: data.email });

    // Create Supabase user with email verification
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          middle_name: data.middleName,
          last_name: data.lastName,
          name: `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`.trim(),
          company: data.company,
          onboarding_complete: false,
          registration_complete: false,
          registration_status: 'pending'
        },
        emailRedirectTo: data.emailRedirectTo || `${window.location.origin}/confirmed`
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Handle rate limit errors
      if (signUpError.message.includes('security purposes') || 
          signUpError.message.includes('rate limit') ||
          signUpError.message.includes('over_email_send_rate_limit')) {
        throw new Error('For security purposes, you can only request this after 50 seconds.');
      }
      
      throw signUpError;
    }
    
    if (!authData.user) throw new Error('No user data returned');

    // Store email temporarily for verification
    localStorage.setItem('confirmEmail', data.email);

    logger.info('User registration successful', { userId: authData.user.id });
    return true;
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

// Password validation helper
export function validatePassword(password: string) {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!hasUppercase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!hasLowercase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!hasSpecial) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }

  return { isValid: true, message: '' };
}

// Get test users
export function getTestUsers() {
  return [
    { email: "john@techinnovations.dev", name: "John Developer" },
    { email: "user1@example.com", name: "User One" },
    { email: "user2@example.com", name: "User Two" }
  ];
}

// Get access requests
export function getAccessRequests() {
  return []; // Example empty access requests list
}

// Approve access request
export function approveAccessRequest(userId: string) {
  logger.info('Approving access request', { userId });
  return `User ${userId} has been approved for testing access.`;
}

// Decline access request
export function declineAccessRequest(userId: string) {
  logger.info('Declining access request', { userId });
  return `User ${userId} access request has been declined.`;
}

// Check if user is already registered and get their status
export async function checkUserRegistration(email: string): Promise<{
  exists: boolean;
  confirmed: boolean;
  createdAt?: Date;
  timeSinceRegistration?: number; // in minutes
}> {
  try {
    logger.info('Checking user registration status', { email });

    // Try to sign up with the same email to see if it already exists
    // This will fail with a specific error if the user already exists
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'temporary_password_for_check',
      options: {
        emailRedirectTo: `${window.location.origin}/confirmed`
      }
    });

    // If no error, this means the user doesn't exist (which shouldn't happen in this flow)
    if (!error) {
      // Clean up the temporary user
      if (data.user) {
        await supabase.auth.admin.deleteUser(data.user.id);
      }
      return { exists: false, confirmed: false };
    }

    // Check if the error indicates user already exists
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      // Try to get user info by attempting a password reset (this will work if user exists)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/confirmed`
      });

      // If reset email was sent successfully, user exists
      if (!resetError) {
        return {
          exists: true,
          confirmed: false, // We can't determine this without admin access
          timeSinceRegistration: undefined
        };
      }
    }

    // If we get here, user doesn't exist
    return { exists: false, confirmed: false };
  } catch (error) {
    logger.error('Error checking user registration:', error);
    throw error;
  }
}