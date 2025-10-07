import { supabase } from './supabase';
import { logger } from './logger';

export interface ProfileCreationData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
}

export interface ProfileCreationResult {
  success: boolean;
  error?: string;
  profile?: any;
}

/**
 * Safely create or update a user profile with conflict handling
 * This prevents duplicate key errors during registration
 */
export async function createOrUpdateProfile(
  profileData: ProfileCreationData
): Promise<ProfileCreationResult> {
  try {
    logger.info('Creating or updating profile', { 
      userId: profileData.id, 
      email: profileData.email 
    });

    // Use the database function for better error handling
    const { data, error } = await supabase.rpc('upsert_profile', {
      profile_data: {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        middle_name: profileData.middleName,
        company: profileData.company,
        job_title: profileData.jobTitle,
        industry: profileData.industry,
        onboarding_complete: false,
        registration_complete: true,
        registration_status: 'completed',
        registration_completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    });

    if (error) {
      logger.error('Profile creation/update error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Check if the function returned an error
    if (data && data.error) {
      logger.error('Database function error:', data.message);
      return {
        success: false,
        error: data.message
      };
    }

    logger.info('Profile created/updated successfully', { 
      userId: profileData.id 
    });

    return {
      success: true,
      profile: data
    };

  } catch (error) {
    logger.error('Unexpected error in profile creation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a profile exists for a given user ID
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist
      return false;
    }

    return !error && !!data;
  } catch (error) {
    logger.error('Error checking profile existence:', error);
    return false;
  }
}

/**
 * Ensure a profile exists for a user, creating it if necessary
 * This is useful for ensuring profile consistency after auth operations
 */
export async function ensureProfileExists(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<ProfileCreationResult> {
  try {
    // Check if profile already exists
    const exists = await profileExists(userId);
    
    if (exists) {
      logger.info('Profile already exists', { userId });
      return { success: true };
    }

    // Get user data from auth if not provided
    if (!firstName || !lastName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        firstName = firstName || user.user_metadata?.firstName || '';
        lastName = lastName || user.user_metadata?.lastName || '';
      }
    }

    // Create the profile
    return await createOrUpdateProfile({
      id: userId,
      email,
      firstName: firstName || '',
      lastName: lastName || ''
    });

  } catch (error) {
    logger.error('Error ensuring profile exists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
