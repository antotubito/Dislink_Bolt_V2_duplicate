// Enhanced authentication flow management
import { supabase } from './supabase';
import { logger } from './logger';
import { updateProfile } from './profile';
import { getEmailRedirectUrl } from './authUtils';
import type { User } from '../types/user';

export interface AuthFlowResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  requiresOnboarding?: boolean;
  alreadyVerified?: boolean;
}

/**
 * Handle email confirmation with automatic login and proper flow management
 */
export async function handleEmailConfirmation(url: string): Promise<AuthFlowResult> {
  try {
    logger.info('🔐 Starting email confirmation flow', { url });

    // Extract parameters from URL
    const urlObj = new URL(url);
    const tokenHash = urlObj.searchParams.get('token_hash');
    const type = urlObj.searchParams.get('type');
    const code = urlObj.searchParams.get('code');
    const email = urlObj.searchParams.get('email');

    logger.info('🔐 Confirmation parameters', { 
      hasTokenHash: !!tokenHash, 
      hasCode: !!code,
      type, 
      hasEmail: !!email,
      fullUrl: url,
      codeValue: code ? code.substring(0, 10) + '...' : null,
      tokenHashValue: tokenHash ? tokenHash.substring(0, 10) + '...' : null
    });

    // Attempt email confirmation - handle both PKCE and implicit flows
    let verificationResult;
    
    if (code) {
      // Check if we have a stored code verifier for PKCE flow
      const storedCodeVerifier = localStorage.getItem('supabase.auth.code_verifier') || 
                                 localStorage.getItem('supabase_code_verifier');
      
      if (storedCodeVerifier) {
        // PKCE flow with stored verifier
        logger.info('🔐 Using stored code verifier for PKCE flow');
        verificationResult = await supabase.auth.exchangeCodeForSession(code);
      } else {
        // Fallback to verifyOtp for implicit flow
        logger.info('🔐 No code verifier found, using verifyOtp for implicit flow');
        verificationResult = await supabase.auth.verifyOtp({
          token_hash: code,
          type: 'email'
        });
      }
    } else if (tokenHash && type) {
      // PKCE flow - use token_hash and type
      if (email) {
        // Try with email first (more reliable)
        logger.info('🔐 Attempting verification with email and token_hash (PKCE flow)');
        verificationResult = await supabase.auth.verifyOtp({
          email,
          token_hash: tokenHash,
          type: type as any
        });
      } else {
        // Fallback to token_hash only
        logger.info('🔐 Attempting verification with token_hash only (PKCE flow)');
        verificationResult = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any
        });
      }
    } else {
      throw new Error('Missing required parameters in confirmation URL. Expected either "code" or "token_hash" and "type"');
    }

    const { data, error } = verificationResult;

    if (error) {
      logger.warn('🔐 Verification error:', error);

      // Handle specific error cases
      if (error.message?.includes('User already confirmed') || 
          error.message?.includes('already been confirmed')) {
        logger.info('🔐 User already confirmed, checking session');
        
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          return {
            success: true,
            user: session.user,
            session,
            alreadyVerified: true,
            requiresOnboarding: await checkOnboardingStatus(session.user.id)
          };
        } else {
          // User is verified but not logged in, redirect to login
          return {
            success: true,
            alreadyVerified: true,
            requiresOnboarding: false
          };
        }
      }

      if (error.message?.includes('rate limit') || error.message?.includes('security purposes')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        throw new Error('This confirmation link has expired or is invalid. Please request a new confirmation email.');
      }

      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Email confirmation failed. Please try again.');
    }

    logger.info('🔐 Email confirmation successful', { 
      userId: data.user.id,
      email: data.user.email 
    });

    // Clean up stored code verifier after successful confirmation
    localStorage.removeItem('supabase.auth.code_verifier');
    localStorage.removeItem('supabase_code_verifier');
    sessionStorage.removeItem('supabase_code_verifier');

    // Ensure profile exists after email confirmation
    const { createOrUpdateProfile } = await import('./profileCreation');
    const profileResult = await createOrUpdateProfile({
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.user_metadata?.firstName || data.user.user_metadata?.first_name || '',
      lastName: data.user.user_metadata?.lastName || data.user.user_metadata?.last_name || ''
    });

    if (!profileResult.success) {
      logger.warn('Profile creation/update failed during email confirmation:', profileResult.error);
      // Don't fail the confirmation, just log the warning
    }

    // Check onboarding status
    const requiresOnboarding = await checkOnboardingStatus(data.user.id);

    return {
      success: true,
      user: data.user,
      session: data.session,
      requiresOnboarding
    };

  } catch (error) {
    logger.error('🔐 Email confirmation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email confirmation failed'
    };
  }
}

/**
 * Check if user needs onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('🔐 Could not check onboarding status:', error);
      // If we can't check, assume onboarding is needed for safety
      return true;
    }

    return !profile?.onboarding_complete;
  } catch (error) {
    logger.error('🔐 Error checking onboarding status:', error);
    return true;
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(userId: string, userData: Partial<User>): Promise<void> {
  try {
    logger.info('🎯 Completing onboarding for user:', userId);

    // Update profile with onboarding completion
    await updateProfile({
      ...userData,
      onboardingComplete: true,
      onboardingCompletedAt: new Date()
    });

    // Also update the database directly to ensure consistency
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (dbError) {
      logger.error('❌ Failed to update onboarding status in database:', dbError);
      throw dbError;
    }

    logger.info('✅ Onboarding completed successfully');
  } catch (error) {
    logger.error('❌ Failed to complete onboarding:', error);
    throw error;
  }
}


/**
 * Enhanced auth state change handler
 */
export function setupAuthStateListener(
  onAuthChange: (event: string, session: any) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      logger.info('🔐 Auth state changed:', { event, hasSession: !!session });
      
      // Handle specific events
      if (event === 'SIGNED_IN' && session) {
        logger.info('🔐 User signed in:', { userId: session.user.id });
      } else if (event === 'SIGNED_OUT') {
        logger.info('🔐 User signed out');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        logger.info('🔐 Token refreshed');
      }

      onAuthChange(event, session);
    }
  );

  return () => subscription.unsubscribe();
}

/**
 * Check if user should be redirected to onboarding
 */
export async function shouldRedirectToOnboarding(
  user: any,
  currentPath: string
): Promise<boolean> {
  // Don't redirect if already on onboarding
  if (currentPath === '/app/onboarding') {
    return false;
  }

  // Don't redirect if on public paths
  const publicPaths = [
    '/',
    '/waitlist',
    '/story',
    '/app/login',
    '/app/register',
    '/app/reset-password',
    '/app/terms',
    '/app/test-terms',
    '/terms',
    '/privacy',
    '/verify',
    '/confirm',
    '/confirmed',
    '/demo'
  ];

  if (publicPaths.some(path => currentPath === path || currentPath.startsWith(`${path}/`))) {
    return false;
  }

  // If no user, don't redirect to onboarding
  if (!user) {
    return false;
  }

  // Check if user needs onboarding
  // Handle both camelCase (onboardingComplete) and snake_case (onboarding_complete) field names
  const onboardingComplete = user.onboardingComplete ?? user.onboarding_complete;
  
  logger.info('🔐 Onboarding check:', { 
    userId: user.id, 
    onboardingComplete: onboardingComplete, 
    currentPath,
    userKeys: Object.keys(user),
    userOnboardingComplete: user.onboardingComplete,
    userOnboarding_complete: user.onboarding_complete,
    type: typeof onboardingComplete
  });
  
  // If we have a clear onboarding status, use it
  if (onboardingComplete === true) {
    logger.info('🔐 User has completed onboarding (from user object)');
    return false;
  }
  
  if (onboardingComplete === false) {
    logger.info('🔐 User needs onboarding (from user object)');
    return true;
  }
  
  // If onboarding status is unclear (null/undefined), do a direct database check
  // This prevents false redirects when profile loading fails
  logger.info('🔐 Onboarding status unclear, checking database directly...');
  
  try {
    const needsOnboarding = await checkOnboardingStatus(user.id);
    logger.info('🔐 Database onboarding check result:', { userId: user.id, needsOnboarding });
    return needsOnboarding;
  } catch (error) {
    logger.error('🔐 Failed to check onboarding status from database:', error);
    
    // Additional safety check: if user has been using the app for a while, 
    // don't redirect to onboarding unless explicitly needed
    if (user.createdAt && typeof user.createdAt === 'string') {
      const createdAt = new Date(user.createdAt);
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // If user was created more than 1 day ago and we can't check onboarding status,
      // assume they've completed onboarding to prevent redirect loops
      if (daysSinceCreation > 1) {
        logger.info('🔐 User created more than 1 day ago with unclear onboarding status, assuming completed');
        return false;
      }
    }
    
    // If we can't determine onboarding status and user is relatively new,
    // assume they need onboarding for safety
    logger.warn('🔐 Cannot determine onboarding status, assuming onboarding needed for safety');
    return true;
  }
}

/**
 * Get the appropriate redirect path after authentication
 */
export async function getPostAuthRedirectPath(
  user: any,
  storedRedirectUrl?: string
): Promise<string> {
  // If user needs onboarding, go to onboarding
  if (await shouldRedirectToOnboarding(user, '/app')) {
    return '/app/onboarding';
  }

  // If there's a stored redirect URL and it's valid, use it
  if (storedRedirectUrl && 
      storedRedirectUrl.startsWith('/app') && 
      storedRedirectUrl !== '/app/onboarding') {
    return storedRedirectUrl;
  }

  // Default to home
  return '/app';
}
