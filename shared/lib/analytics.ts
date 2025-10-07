/**
 * Business Analytics and User Behavior Tracking
 * Provides comprehensive tracking for business insights and conversion funnels
 */

import { supabase } from './supabase';
import { captureMessage } from './sentry';

// Types for analytics events
export interface AnalyticsEvent {
  id?: string;
  user_id?: string;
  session_id: string;
  event_type: string;
  event_name: string;
  properties: Record<string, any>;
  timestamp: string;
  page_url: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

export interface ConversionFunnel {
  id?: string;
  name: string;
  steps: FunnelStep[];
  created_at?: string;
  updated_at?: string;
}

export interface FunnelStep {
  step_number: number;
  step_name: string;
  event_name: string;
  properties?: Record<string, any>;
  is_conversion?: boolean;
}

export interface UserJourney {
  id?: string;
  user_id?: string;
  session_id: string;
  journey_type: 'registration' | 'onboarding' | 'profile_creation' | 'connection' | 'engagement';
  current_step: number;
  total_steps: number;
  started_at: string;
  completed_at?: string;
  abandoned_at?: string;
  properties: Record<string, any>;
}

// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Event types to track
  EVENT_TYPES: {
    PAGE_VIEW: 'page_view',
    USER_ACTION: 'user_action',
    CONVERSION: 'conversion',
    ERROR: 'error',
    PERFORMANCE: 'performance',
    BUSINESS: 'business'
  },
  
  // Key business events
  BUSINESS_EVENTS: {
    REGISTRATION_STARTED: 'registration_started',
    REGISTRATION_COMPLETED: 'registration_completed',
    EMAIL_CONFIRMED: 'email_confirmed',
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    ONBOARDING_ABANDONED: 'onboarding_abandoned',
    PROFILE_CREATED: 'profile_created',
    PROFILE_UPDATED: 'profile_updated',
    CONNECTION_MADE: 'connection_made',
    QR_CODE_GENERATED: 'qr_code_generated',
    QR_CODE_SCANNED: 'qr_code_scanned',
    INVITATION_SENT: 'invitation_sent',
    INVITATION_ACCEPTED: 'invitation_accepted',
    SETTINGS_UPDATED: 'settings_updated',
    ACCOUNT_DELETED: 'account_deleted'
  },
  
  // Conversion funnels
  FUNNELS: {
    REGISTRATION: 'registration_funnel',
    ONBOARDING: 'onboarding_funnel',
    PROFILE_CREATION: 'profile_creation_funnel',
    CONNECTION: 'connection_funnel',
    ENGAGEMENT: 'engagement_funnel'
  }
};

// Export core analytics
export { analytics } from './analyticsCore';

// Export business analytics functions
export * from './businessAnalytics';

// Export convenience functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => 
  analytics.trackEvent(eventName, properties);

export const trackPageView = (pageName: string, properties?: Record<string, any>) => 
  analytics.trackPageView(pageName, properties);

export const trackConversion = (conversionName: string, value?: number, properties?: Record<string, any>) => 
  analytics.trackConversion(conversionName, value, properties);

export const trackError = (errorName: string, errorMessage: string, properties?: Record<string, any>) => 
  analytics.trackError(errorName, errorMessage, properties);

export const trackBusinessEvent = (eventName: string, properties?: Record<string, any>) => 
  analytics.trackBusinessEvent(eventName, properties);