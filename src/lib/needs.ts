import { logger } from './logger';
import type { Need, NeedReply } from '../types/need';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from './supabase';

// Dynamic needs functions that use Supabase
export async function listNeeds(): Promise<Need[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data: needs, error } = await supabase
      .from('daily_needs')
      .select(`
        id,
        user_id,
        category,
        message,
        tags,
        visibility,
        expires_at,
        is_satisfied,
        created_at,
        profiles (
          first_name,
          last_name,
          profile_image
        )
      `)
      .eq('expires_at', null) // Only get active needs
      .or(`visibility.eq.open,user_id.eq.${session.user.id}`) // Open visibility or user's own needs
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching needs:', error);
      return [];
    }

    return needs.map(need => ({
      id: need.id,
      userId: need.user_id,
      userName: `${need.profiles.first_name} ${need.profiles.last_name}`,
      userImage: need.profiles.profile_image,
      category: need.category,
      categoryLabel: getCategoryLabel(need.category),
      message: need.message,
      tags: need.tags || [],
      visibility: need.visibility,
      expiresAt: need.expires_at ? new Date(need.expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
      isSatisfied: need.is_satisfied,
      createdAt: new Date(need.created_at)
    }));
  } catch (error) {
    logger.error('Error in listNeeds:', error);
    return [];
  }
}

export async function createNeed(needData: {
  category: string;
  message: string;
  tags?: string[];
  visibility: 'open' | 'private';
  expiresAt?: Date;
}): Promise<Need> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data: need, error } = await supabase
      .from('daily_needs')
      .insert({
        user_id: session.user.id,
        category: needData.category,
        message: needData.message,
        tags: needData.tags || [],
        visibility: needData.visibility,
        expires_at: needData.expiresAt?.toISOString(),
        is_satisfied: false
      })
      .select(`
        id,
        user_id,
        category,
        message,
        tags,
        visibility,
        expires_at,
        is_satisfied,
        created_at,
        profiles (
          first_name,
          last_name,
          profile_image
        )
      `)
      .single();

    if (error) {
      logger.error('Error creating need:', error);
      throw error;
    }

    return {
      id: need.id,
      userId: need.user_id,
      userName: `${need.profiles.first_name} ${need.profiles.last_name}`,
      userImage: need.profiles.profile_image,
      category: need.category,
      categoryLabel: getCategoryLabel(need.category),
      message: need.message,
      tags: need.tags || [],
      visibility: need.visibility,
      expiresAt: need.expires_at ? new Date(need.expires_at) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      isSatisfied: need.is_satisfied,
      createdAt: new Date(need.created_at)
    };
  } catch (error) {
    logger.error('Error in createNeed:', error);
    throw error;
  }
}

function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    'socialize': 'Socialize',
    'events': 'Events',
    'work-career': 'Work & Career',
    'help': 'Help',
    'travel': 'Travel',
    'hobbies': 'Hobbies'
  };
  return categoryLabels[category] || 'Other';
}

/**
 * Get a need by ID
 */
export async function getNeed(id: string): Promise<Need | null> {
  try {
    // In a real implementation, this would fetch a need from the database
    // For now, find in mock data
    const need = MOCK_NEEDS.find(n => n.id === id);
    return need || null;
  } catch (error) {
    logger.error('Error getting need:', error);
    return null;
  }
}

/**
 * Delete a need
 */
export async function deleteNeed(id: string): Promise<boolean> {
  try {
    // In a real implementation, this would delete a need from the database
    // For now, remove from mock data
    const index = MOCK_NEEDS.findIndex(n => n.id === id);
    if (index !== -1) {
      MOCK_NEEDS.splice(index, 1);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting need:', error);
    return false;
  }
}

/**
 * Get replies for a need
 * If currentUserId is provided, filter replies based on visibility and user
 */
export async function getNeedReplies(needId: string, currentUserId?: string): Promise<NeedReply[]> {
  try {
    // In a real implementation, this would fetch replies from the database
    // For now, return mock data
    const allReplies = MOCK_REPLIES[needId] || [];
    const need = MOCK_NEEDS.find(n => n.id === needId);
    
    if (!need) return [];
    
    // If currentUserId is provided, filter replies based on visibility
    if (currentUserId) {
      // If current user created the need, they can see all replies
      if (need.userId === currentUserId) {
        return allReplies;
      }
      
      // For open needs, everyone can see all replies
      if (need.visibility === 'open') {
        return allReplies;
      }
      
      // For private needs, users can only see their own replies and responses to those replies
      return allReplies.filter(reply => 
        reply.userId === currentUserId || // User's own replies
        reply.replyToUserId === currentUserId // Replies to the user
      );
    }
    
    return allReplies;
  } catch (error) {
    logger.error('Error getting need replies:', error);
    return [];
  }
}

/**
 * Send a reply to a need
 */
export async function sendNeedReply(replyData: Omit<NeedReply, 'id' | 'userId' | 'createdAt'>): Promise<NeedReply> {
  try {
    // In a real implementation, this would create a reply in the database
    // Get the need to check visibility
    const need = MOCK_NEEDS.find(n => n.id === replyData.needId);
    
    const newReply: NeedReply = {
      id: `reply-${replyData.needId}-${Date.now()}`,
      userId: ANTONIO_TUBITO.id,
      ...replyData,
      // For private needs, set replyToUserId to the need creator's ID
      // For public needs, only set if explicitly provided
      replyToUserId: need?.visibility === 'private' ? need.userId : replyData.replyToUserId,
      createdAt: new Date()
    };

    // Add to mock data
    if (!MOCK_REPLIES[replyData.needId]) {
      MOCK_REPLIES[replyData.needId] = [];
    }
    MOCK_REPLIES[replyData.needId].push(newReply);

    return newReply;
  } catch (error) {
    logger.error('Error sending need reply:', error);
    throw error;
  }
}

/**
 * Delete a reply
 */
export async function deleteNeedReply(needId: string, replyId: string): Promise<boolean> {
  try {
    // In a real implementation, this would delete a reply from the database
    // For now, remove from mock data
    if (!MOCK_REPLIES[needId]) return false;
    
    const index = MOCK_REPLIES[needId].findIndex(r => r.id === replyId);
    if (index !== -1) {
      MOCK_REPLIES[needId].splice(index, 1);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting need reply:', error);
    return false;
  }
}

/**
 * Mark a need as satisfied
 */
export async function markNeedAsSatisfied(id: string): Promise<boolean> {
  try {
    // Find the need in the mock data
    const index = MOCK_NEEDS.findIndex(n => n.id === id);
    if (index !== -1) {
      // Mark as satisfied
      MOCK_NEEDS[index].isSatisfied = true;
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error marking need as satisfied:', error);
    return false;
  }
}

/**
 * Get archived needs (satisfied or expired)
 */
export async function getArchivedNeeds(): Promise<Need[]> {
  try {
    // Get current date for comparison
    const now = new Date();
    
    // Return needs that are either satisfied or expired
    return MOCK_NEEDS.filter(need => {
      return need.isSatisfied || (need.expiresAt && new Date(need.expiresAt) <= now);
    });
  } catch (error) {
    logger.error('Error getting archived needs:', error);
    return [];
  }
}