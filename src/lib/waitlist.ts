import { supabase } from './supabase';
import { logger } from './logger';
import { sendWaitlistConfirmationEmail } from './emailService';

export interface WaitlistEntry {
  id?: string;
  email: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ip_address?: string;
  user_agent?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  subscribed: boolean;
  confirmed: boolean;
  created_at?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
  error?: string;
}

// Add email to waitlist with full tracking
export async function addToWaitlist(data: {
  email: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  location?: { latitude: number; longitude: number; name?: string };
}): Promise<WaitlistResponse> {
  try {
    logger.info('Adding email to waitlist', { email: data.email, source: data.source });

    // Check if email already exists
    const { data: existingEntry, error: checkError } = await supabase
      .from('waitlist')
      .select('email, subscribed')
      .eq('email', data.email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingEntry) {
      logger.info('Email already exists in waitlist', { email: data.email });
      return {
        success: true,
        message: 'You\'re already on the waitlist! We\'ll notify you when Dislink is ready.',
        alreadySubscribed: true
      };
    }

    // Get client IP and user agent for analytics
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : undefined;
    
    // Create waitlist entry
    const waitlistEntry: Omit<WaitlistEntry, 'id' | 'created_at'> = {
      email: data.email,
      source: data.source,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      user_agent: userAgent,
      location: data.location ? {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        name: data.location.name
      } : undefined,
      subscribed: true,
      confirmed: false
    };

    // Insert into Supabase
    const { data: insertedEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert(waitlistEntry)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info('Successfully added to waitlist', { 
      email: data.email, 
      id: insertedEntry.id 
    });

    // Send confirmation email
    try {
      await sendWaitlistConfirmationEmail({
        email: data.email,
        source: data.source
      });
      logger.info('Waitlist confirmation email sent', { email: data.email });
    } catch (emailError) {
      logger.error('Failed to send waitlist confirmation email:', emailError);
      // Don't fail the waitlist signup if email fails
    }

    // Also send to Google Sheets as backup (existing functionality)
    try {
      await sendToGoogleSheets(data.email);
    } catch (sheetsError) {
      logger.warn('Failed to send to Google Sheets:', sheetsError);
      // Don't fail if Google Sheets fails
    }

    return {
      success: true,
      message: 'Welcome to the Dislink waitlist! Check your email for confirmation.'
    };

  } catch (error) {
    logger.error('Error adding to waitlist:', error);
    return {
      success: false,
      message: 'Failed to join waitlist. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get waitlist statistics (admin function)
export async function getWaitlistStats(): Promise<{
  total: number;
  confirmed: number;
  sources: Record<string, number>;
  recent: number; // last 7 days
}> {
  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true);

    if (totalError) throw totalError;

    // Get confirmed count
    const { count: confirmed, error: confirmedError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true)
      .eq('confirmed', true);

    if (confirmedError) throw confirmedError;

    // Get source breakdown
    const { data: sourceData, error: sourceError } = await supabase
      .from('waitlist')
      .select('source')
      .eq('subscribed', true);

    if (sourceError) throw sourceError;

    const sources: Record<string, number> = {};
    sourceData?.forEach(entry => {
      sources[entry.source] = (sources[entry.source] || 0) + 1;
    });

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recent, error: recentError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) throw recentError;

    return {
      total: total || 0,
      confirmed: confirmed || 0,
      sources,
      recent: recent || 0
    };

  } catch (error) {
    logger.error('Error getting waitlist stats:', error);
    return {
      total: 0,
      confirmed: 0,
      sources: {},
      recent: 0
    };
  }
}

// Export waitlist for admin use
export async function exportWaitlist(): Promise<WaitlistEntry[]> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('subscribed', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Error exporting waitlist:', error);
    return [];
  }
}

// Unsubscribe from waitlist
export async function unsubscribeFromWaitlist(email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('waitlist')
      .update({ subscribed: false })
      .eq('email', email);

    if (error) throw error;

    logger.info('Unsubscribed from waitlist', { email });
    return true;
  } catch (error) {
    logger.error('Error unsubscribing from waitlist:', error);
    return false;
  }
}

// Confirm email address
export async function confirmWaitlistEmail(email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('waitlist')
      .update({ 
        confirmed: true, 
        confirmed_at: new Date().toISOString() 
      })
      .eq('email', email);

    if (error) throw error;

    logger.info('Confirmed waitlist email', { email });
    return true;
  } catch (error) {
    logger.error('Error confirming waitlist email:', error);
    return false;
  }
}

// Legacy Google Sheets function (as backup)
async function sendToGoogleSheets(email: string): Promise<void> {
  const formData = new FormData();
  formData.append('email', email);

  await fetch(
    "https://script.google.com/macros/s/AKfycbwKKvizfbtw_tPGVSkEm1bNfZ39EB-PHJYZlCDGQzn4gleqgf-Ag29Q-L6snPXQ_o8V/exec",
    {
      method: "POST",
      mode: 'no-cors',
      body: formData
    }
  );
}

// Get worldwide connections count (dynamic from database)
export async function getWorldwideConnections(): Promise<number> {
  try {
    // Count confirmed waitlist entries + registered users
    const { count: waitlistCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', true);

    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Simulate growing network with some growth algorithm
    const baseConnections = 12847; // Starting point
    const totalSignups = (waitlistCount || 0) + (userCount || 0);
    const multiplier = Math.floor(totalSignups / 10); // Every 10 signups = +1000 connections
    
    return baseConnections + (totalSignups * 15) + (multiplier * 1000);
  } catch (error) {
    logger.error('Error getting worldwide connections:', error);
    // Fallback to a growing number based on time
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return 12847 + (daysSinceEpoch * 23); // Grows by ~23 per day
  }
} 