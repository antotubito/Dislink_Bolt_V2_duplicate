import { supabase, handleSupabaseError } from './supabase';
import { logger } from './logger';
import { getPostAuthRedirectUrl } from './authUtils';

// Simplified login function
export async function login(email: string, password: string): Promise<{
  success: boolean;
  session: any;
  user: any;
  error: string | null;
  requiresOnboarding?: boolean;
}> {
  try {
    logger.info('🔐 Starting login for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      logger.error('Login failed:', error);
      const userFriendlyMessage = handleSupabaseError(error, 'login');
      return {
        success: false,
        session: null,
        user: null,
        error: userFriendlyMessage
      };
    }

    if (data.session && data.user) {
      logger.info('✅ Login successful');
      
      // Check if user needs onboarding
      const requiresOnboarding = !data.user.user_metadata?.onboardingComplete;
      
      return {
        success: true,
        session: data.session,
        user: data.user,
        error: null,
        requiresOnboarding
      };
    }

    return {
      success: false,
      session: null,
      user: null,
      error: 'Login failed - no session created'
    };

  } catch (err: any) {
    logger.error('Login error:', err);
    return {
      success: false,
      session: null,
      user: null,
      error: err.message || 'An unexpected error occurred during login'
    };
  }
}

// Simplified logout function
export async function logout(): Promise<{ success: boolean; error: string | null }> {
  try {
    logger.info('🔐 Starting logout');

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout failed:', error);
      return {
        success: false,
        error: handleSupabaseError(error, 'logout')
      };
    }

    logger.info('✅ Logout successful');
    return {
      success: true,
      error: null
    };

  } catch (err: any) {
    logger.error('Logout error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during logout'
    };
  }
}

// Password reset function
export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    logger.info('🔐 Starting password reset for:', email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getPostAuthRedirectUrl()}/reset-password`
    });

    if (error) {
      logger.error('Password reset failed:', error);
      return {
        success: false,
        error: handleSupabaseError(error, 'password reset')
      };
    }

    logger.info('✅ Password reset email sent');
    return {
      success: true,
      error: null
    };

  } catch (err: any) {
    logger.error('Password reset error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during password reset'
    };
  }
}

// Access request functions (placeholder implementations)
export function getAccessRequests(): Array<{ id: string; approved: boolean; [key: string]: any }> {
  // Placeholder implementation - return empty array for now
  logger.info('📋 Getting access requests (placeholder)');
  return [];
}

export function approveAccessRequest(id: string): boolean {
  // Placeholder implementation
  logger.info('✅ Approving access request (placeholder):', id);
  return true;
}

export function declineAccessRequest(id: string): boolean {
  // Placeholder implementation
  logger.info('❌ Declining access request (placeholder):', id);
  return true;
}

// Password validation function
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}