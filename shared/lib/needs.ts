import { supabase } from './supabase';
import { logger } from './logger';
import type { Need, NeedReply } from '../types/need';
import { formatDistanceToNow } from 'date-fns';

// Helper function to generate category label from category
function generateCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    'professional': 'Professional Help',
    'personal': 'Personal Support',
    'social': 'Social Connection',
    'learning': 'Learning & Growth',
    'health': 'Health & Wellness',
    'creative': 'Creative Collaboration',
    'business': 'Business Opportunities',
    'mentorship': 'Mentorship',
    'collaboration': 'Collaboration',
    'advice': 'Advice & Guidance'
  };
  
  return categoryMap[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
}

// 🚀 PRODUCTION-READY NEEDS SYSTEM
// Migrated from mock data to Supabase with mobile optimizations

/**
 * List all active needs from Supabase
 */
export async function listNeeds(): Promise<Need[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.warn('No authenticated user for listing needs');
      return [];
    }

    const now = new Date();
    const { data, error } = await supabase
      .from('needs')
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
        updated_at,
        category_label,
        profiles!needs_user_id_fkey(name, profile_image)
      `)
      .eq('is_satisfied', false)
      .gt('expires_at', now.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching needs:', error);
      throw error;
    }
    
    return data?.map(need => ({
      id: need.id,
      userId: need.user_id,
      userName: need.profiles?.name || 'Unknown User',
      userImage: need.profiles?.profile_image,
      category: need.category,
      categoryLabel: need.category_label || generateCategoryLabel(need.category),
      message: need.message || 'No message provided',
      tags: need.tags || [],
      visibility: need.visibility,
      expiresAt: new Date(need.expires_at),
      isSatisfied: need.is_satisfied,
      createdAt: new Date(need.created_at)
    })) || [];
  } catch (error) {
    logger.error('Error listing needs:', error);
    return [];
  }
}

/**
 * Create a new need
 */
export async function createNeed(needData: Omit<Need, 'id' | 'userId' | 'createdAt'>): Promise<Need> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user profile for name and image
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, profile_image')
      .eq('id', user.id)
      .single();

    // Set default expiration if not provided (24 hours)
    const expiresAt = needData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('needs')
      .insert({
        user_id: user.id,
        category: needData.category,
        category_label: needData.categoryLabel || generateCategoryLabel(needData.category),
        message: needData.message || 'No message provided',
        tags: needData.tags,
        visibility: needData.visibility,
        expires_at: expiresAt.toISOString(),
        is_satisfied: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      userId: data.user_id,
      userName: profile?.name || 'Unknown User',
      userImage: profile?.profile_image,
      category: data.category,
      categoryLabel: data.category_label,
      message: data.message,
      tags: data.tags || [],
      visibility: data.visibility,
      expiresAt: new Date(data.expires_at),
      isSatisfied: data.is_satisfied,
      createdAt: new Date(data.created_at)
    };
  } catch (error) {
    logger.error('Error creating need:', error);
    throw error;
  }
}

/**
 * Get a need by ID
 */
export async function getNeed(id: string): Promise<Need | null> {
  try {
    const { data, error } = await supabase
      .from('needs')
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
        updated_at,
        category_label,
        profiles!needs_user_id_fkey(name, profile_image)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      logger.warn('Need not found:', { id, error });
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.profiles?.name || 'Unknown User',
      userImage: data.profiles?.profile_image,
      category: data.category,
      categoryLabel: data.category_label || generateCategoryLabel(data.category),
      message: data.message,
      tags: data.tags || [],
      visibility: data.visibility,
      expiresAt: new Date(data.expires_at),
      isSatisfied: data.is_satisfied,
      createdAt: new Date(data.created_at)
    };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error deleting need:', error);
    return false;
  }
}

/**
 * Get replies for a need
 */
export async function getNeedReplies(needId: string, currentUserId?: string): Promise<NeedReply[]> {
  try {
    const { data, error } = await supabase
      .from('need_replies')
      .select(`
        *,
        profiles!need_replies_user_id_fkey(name, profile_image)
      `)
      .eq('need_id', needId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return data?.map(reply => ({
      id: reply.id,
      needId: reply.need_id,
      userId: reply.user_id,
      userName: reply.profiles?.name || 'Unknown User',
      userImage: reply.profiles?.profile_image,
      message: reply.message,
      replyToUserId: reply.reply_to_user_id,
      createdAt: new Date(reply.created_at)
    })) || [];
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, profile_image')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('need_replies')
      .insert({
        need_id: replyData.needId,
        user_id: user.id,
        message: replyData.message,
        reply_to_user_id: replyData.replyToUserId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      needId: data.need_id,
      userId: data.user_id,
      userName: profile?.name || 'Unknown User',
      userImage: profile?.profile_image,
      message: data.message,
      replyToUserId: data.reply_to_user_id,
      createdAt: new Date(data.created_at)
    };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('need_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return true;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('needs')
      .update({ is_satisfied: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return true;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const now = new Date();
    const { data, error } = await supabase
      .from('needs')
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
        updated_at,
        category_label,
        profiles!needs_user_id_fkey(name, profile_image)
      `)
      .eq('user_id', user.id)
      .or(`is_satisfied.eq.true,expires_at.lt.${now.toISOString()}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data?.map(need => ({
      id: need.id,
      userId: need.user_id,
      userName: need.profiles?.name || 'Unknown User',
      userImage: need.profiles?.profile_image,
      category: need.category,
      categoryLabel: need.category_label || generateCategoryLabel(need.category),
      message: need.message || 'No message provided',
      tags: need.tags || [],
      visibility: need.visibility,
      expiresAt: new Date(need.expires_at),
      isSatisfied: need.is_satisfied,
      createdAt: new Date(need.created_at)
    })) || [];
  } catch (error) {
    logger.error('Error getting archived needs:', error);
    return [];
  }
}
