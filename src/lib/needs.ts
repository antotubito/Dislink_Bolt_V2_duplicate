import { supabase } from './supabase';
import { logger } from './logger';
import type { Need, NeedReply } from '../types/need';
import { formatDistanceToNow } from 'date-fns';

// Fetch needs from Supabase
export async function getNeeds(): Promise<Need[]> {
  try {
    logger.info('Fetching needs from Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching needs:', error);
      throw error;
    }

    logger.info(`Fetched ${data?.length || 0} needs`);
    return data || [];
  } catch (error) {
    logger.error('Error getting needs:', error);
    throw error;
  }
}

// Fetch user's own needs
export async function getUserNeeds(): Promise<Need[]> {
  try {
    logger.info('Fetching user needs from Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('needs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user needs:', error);
      throw error;
    }

    logger.info(`Fetched ${data?.length || 0} user needs`);
    return data || [];
  } catch (error) {
    logger.error('Error getting user needs:', error);
    throw error;
  }
}

// Create a new need
export async function createNeed(need: Omit<Need, 'id' | 'userId' | 'userName' | 'userImage' | 'createdAt'>): Promise<Need> {
  try {
    logger.info('Creating new need in Supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Get user profile for name and image
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_image')
      .eq('id', session.user.id)
      .single();

    const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Anonymous';
    const userImage = profile?.profile_image || '';

    const { data, error } = await supabase
      .from('needs')
      .insert({
        ...need,
        user_id: session.user.id,
        user_name: userName,
        user_image: userImage,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating need:', error);
      throw error;
    }

    logger.info('Need created successfully', { needId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating need:', error);
    throw error;
  }
}

// Get replies for a specific need
export async function getNeedReplies(needId: string): Promise<NeedReply[]> {
  try {
    logger.info('Fetching need replies from Supabase', { needId });
    
    const { data, error } = await supabase
      .from('need_replies')
      .select('*')
      .eq('need_id', needId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching need replies:', error);
      throw error;
    }

    logger.info(`Fetched ${data?.length || 0} replies for need ${needId}`);
    return data || [];
  } catch (error) {
    logger.error('Error getting need replies:', error);
    throw error;
  }
}

// Reply to a need
export async function replyToNeed(needId: string, message: string): Promise<NeedReply> {
  try {
    logger.info('Creating reply to need in Supabase', { needId });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // Get user profile for name and image
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_image')
      .eq('id', session.user.id)
      .single();

    const userName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Anonymous';
    const userImage = profile?.profile_image || '';

    const { data, error } = await supabase
      .from('need_replies')
      .insert({
        need_id: needId,
        user_id: session.user.id,
        user_name: userName,
        user_image: userImage,
        message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating reply:', error);
      throw error;
    }

    logger.info('Reply created successfully', { replyId: data.id });
    return data;
  } catch (error) {
    logger.error('Error replying to need:', error);
    throw error;
  }
}

// Update need satisfaction status
export async function updateNeedSatisfaction(needId: string, isSatisfied: boolean): Promise<void> {
  try {
    logger.info('Updating need satisfaction status', { needId, isSatisfied });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { error } = await supabase
      .from('needs')
      .update({ is_satisfied: isSatisfied })
      .eq('id', needId)
      .eq('user_id', session.user.id);

    if (error) {
      logger.error('Error updating need satisfaction:', error);
      throw error;
    }

    logger.info('Need satisfaction updated successfully');
  } catch (error) {
    logger.error('Error updating need satisfaction:', error);
    throw error;
  }
}

// Delete a need
export async function deleteNeed(needId: string): Promise<void> {
  try {
    logger.info('Deleting need from Supabase', { needId });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', needId)
      .eq('user_id', session.user.id);

    if (error) {
      logger.error('Error deleting need:', error);
      throw error;
    }

    logger.info('Need deleted successfully');
  } catch (error) {
    logger.error('Error deleting need:', error);
    throw error;
  }
}

// Get formatted time since creation
export function getTimeSince(createdAt: Date): string {
  return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
}