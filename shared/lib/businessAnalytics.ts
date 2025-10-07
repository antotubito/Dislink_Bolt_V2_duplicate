/**
 * Business Analytics Functions
 * Conversion funnels, user journeys, and business metrics
 */

import { supabase } from './supabase';
import { analytics } from './analyticsCore';
import { UserJourney, ANALYTICS_CONFIG } from './analytics';

// Conversion funnel tracking
export async function trackFunnelStep(
  funnelName: string,
  stepNumber: number,
  stepName: string,
  properties: Record<string, any> = {}
): Promise<void> {
  await analytics.trackEvent('funnel_step', {
    funnel_name: funnelName,
    step_number: stepNumber,
    step_name: stepName,
    ...properties
  }, ANALYTICS_CONFIG.EVENT_TYPES.BUSINESS);
}

// User journey tracking
export async function startUserJourney(
  journeyType: string,
  totalSteps: number,
  properties: Record<string, any> = {}
): Promise<void> {
  const journey: UserJourney = {
    session_id: analytics.getSessionId(),
    journey_type: journeyType as any,
    current_step: 1,
    total_steps: totalSteps,
    started_at: new Date().toISOString(),
    properties
  };

  try {
    const { error } = await supabase
      .from('user_journeys')
      .insert(journey);

    if (error) {
      console.error('❌ Failed to start user journey:', error);
    } else {
      console.log('🚀 User journey started:', journeyType);
    }
  } catch (error) {
    console.error('❌ Failed to start user journey:', error);
  }
}

export async function updateUserJourney(
  journeyType: string,
  currentStep: number,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_journeys')
      .update({
        current_step: currentStep,
        properties: { ...properties, updated_at: new Date().toISOString() }
      })
      .eq('session_id', analytics.getSessionId())
      .eq('journey_type', journeyType);

    if (error) {
      console.error('❌ Failed to update user journey:', error);
    }
  } catch (error) {
    console.error('❌ Failed to update user journey:', error);
  }
}

export async function completeUserJourney(
  journeyType: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_journeys')
      .update({
        completed_at: new Date().toISOString(),
        properties: { ...properties, completed_at: new Date().toISOString() }
      })
      .eq('session_id', analytics.getSessionId())
      .eq('journey_type', journeyType);

    if (error) {
      console.error('❌ Failed to complete user journey:', error);
    } else {
      console.log('✅ User journey completed:', journeyType);
    }
  } catch (error) {
    console.error('❌ Failed to complete user journey:', error);
  }
}

export async function abandonUserJourney(
  journeyType: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_journeys')
      .update({
        abandoned_at: new Date().toISOString(),
        properties: { ...properties, abandoned_at: new Date().toISOString() }
      })
      .eq('session_id', analytics.getSessionId())
      .eq('journey_type', journeyType);

    if (error) {
      console.error('❌ Failed to abandon user journey:', error);
    } else {
      console.log('❌ User journey abandoned:', journeyType);
    }
  } catch (error) {
    console.error('❌ Failed to abandon user journey:', error);
  }
}

// Business metrics
export async function getConversionRate(funnelName: string, dateRange?: { start: string; end: string }): Promise<number> {
  try {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('event_name', 'funnel_step')
      .contains('properties', { funnel_name: funnelName });

    if (dateRange) {
      query = query
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to get conversion rate:', error);
      return 0;
    }

    if (!data || data.length === 0) return 0;

    // Calculate conversion rate based on funnel steps
    const steps = data.map(event => event.properties.step_number);
    const maxStep = Math.max(...steps);
    const completedJourneys = data.filter(event => event.properties.step_number === maxStep).length;
    const totalJourneys = data.filter(event => event.properties.step_number === 1).length;

    return totalJourneys > 0 ? (completedJourneys / totalJourneys) * 100 : 0;
  } catch (error) {
    console.error('❌ Failed to get conversion rate:', error);
    return 0;
  }
}

export async function getBusinessMetrics(dateRange?: { start: string; end: string }): Promise<Record<string, any>> {
  try {
    let query = supabase
      .from('analytics_events')
      .select('*');

    if (dateRange) {
      query = query
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to get business metrics:', error);
      return {};
    }

    if (!data) return {};

    const metrics = {
      total_events: data.length,
      unique_sessions: new Set(data.map(event => event.session_id)).size,
      page_views: data.filter(event => event.event_name === 'page_view').length,
      registrations: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.REGISTRATION_COMPLETED).length,
      email_confirmations: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.EMAIL_CONFIRMED).length,
      onboarding_completions: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_COMPLETED).length,
      profile_creations: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.PROFILE_CREATED).length,
      connections_made: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.CONNECTION_MADE).length,
      qr_codes_generated: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_GENERATED).length,
      qr_codes_scanned: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_SCANNED).length,
      invitations_sent: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_SENT).length,
      invitations_accepted: data.filter(event => event.event_name === ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_ACCEPTED).length
    };

    // Calculate conversion rates
    metrics.registration_to_email_confirmation = metrics.email_confirmations / Math.max(metrics.registrations, 1) * 100;
    metrics.email_confirmation_to_onboarding = metrics.onboarding_completions / Math.max(metrics.email_confirmations, 1) * 100;
    metrics.onboarding_to_profile_creation = metrics.profile_creations / Math.max(metrics.onboarding_completions, 1) * 100;
    metrics.qr_scan_to_connection = metrics.connections_made / Math.max(metrics.qr_codes_scanned, 1) * 100;
    metrics.invitation_acceptance_rate = metrics.invitations_accepted / Math.max(metrics.invitations_sent, 1) * 100;

    return metrics;
  } catch (error) {
    console.error('❌ Failed to get business metrics:', error);
    return {};
  }
}

// Convenience functions for common business events
export const trackRegistration = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.REGISTRATION_STARTED, properties);

export const trackRegistrationCompleted = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.REGISTRATION_COMPLETED, properties);

export const trackEmailConfirmed = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.EMAIL_CONFIRMED, properties);

export const trackOnboardingStarted = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_STARTED, properties);

export const trackOnboardingCompleted = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_COMPLETED, properties);

export const trackOnboardingAbandoned = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_ABANDONED, properties);

export const trackProfileCreated = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.PROFILE_CREATED, properties);

export const trackConnectionMade = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.CONNECTION_MADE, properties);

export const trackQRCodeGenerated = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_GENERATED, properties);

export const trackQRCodeScanned = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_SCANNED, properties);

export const trackInvitationSent = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_SENT, properties);

export const trackInvitationAccepted = (properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_ACCEPTED, properties);
