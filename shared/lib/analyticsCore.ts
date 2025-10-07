/**
 * Core Analytics Implementation
 * Session management and event tracking
 */

import { supabase } from './supabase';
import { captureMessage } from './sentry';
import { AnalyticsEvent, UserJourney, ANALYTICS_CONFIG } from './analytics';

// Session management
class SessionManager {
  private sessionId: string;
  private startTime: number;
  private pageViews: number = 0;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.trackSessionStart();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trackSessionStart(): void {
    console.log('🚀 Session started:', this.sessionId);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime;
  }

  incrementPageViews(): void {
    this.pageViews++;
  }

  getPageViews(): number {
    return this.pageViews;
  }

  addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

// Device and browser detection
function getDeviceInfo(): { device_type: string; browser: string; os: string } {
  const userAgent = navigator.userAgent;
  
  // Device type detection
  let device_type = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    device_type = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  // Browser detection
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'chrome';
  else if (userAgent.includes('Firefox')) browser = 'firefox';
  else if (userAgent.includes('Safari')) browser = 'safari';
  else if (userAgent.includes('Edge')) browser = 'edge';
  
  // OS detection
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'windows';
  else if (userAgent.includes('Mac')) os = 'macos';
  else if (userAgent.includes('Linux')) os = 'linux';
  else if (userAgent.includes('Android')) os = 'android';
  else if (userAgent.includes('iOS')) os = 'ios';
  
  return { device_type, browser, os };
}

// Location detection (simplified)
async function getLocationInfo(): Promise<{ country?: string; city?: string }> {
  try {
    // In a real implementation, you might use a geolocation service
    // For now, we'll return empty values
    return {};
  } catch (error) {
    console.warn('Failed to get location info:', error);
    return {};
  }
}

// Global session manager
const sessionManager = new SessionManager();

// Core analytics functions
export class Analytics {
  private static instance: Analytics;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.initialize();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set up automatic flushing
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.flushInterval);

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.trackEvent('page_hidden', { session_duration: sessionManager.getSessionDuration() });
          this.flush();
        } else {
          this.trackEvent('page_visible', { session_duration: sessionManager.getSessionDuration() });
        }
      });

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackEvent('session_ended', {
          session_duration: sessionManager.getSessionDuration(),
          page_views: sessionManager.getPageViews(),
          events_count: sessionManager.getEvents().length
        });
        this.flush(true); // Force flush on unload
      });

      this.isInitialized = true;
      console.log('✅ Analytics initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize analytics:', error);
      captureMessage('Analytics initialization failed', 'error');
    }
  }

  async trackEvent(
    eventName: string,
    properties: Record<string, any> = {},
    eventType: string = ANALYTICS_CONFIG.EVENT_TYPES.USER_ACTION
  ): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const locationInfo = await getLocationInfo();
      
      const event: AnalyticsEvent = {
        session_id: sessionManager.getSessionId(),
        event_type: eventType,
        event_name: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          ...deviceInfo,
          ...locationInfo
        },
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        ...deviceInfo,
        ...locationInfo
      };

      // Add to session manager
      sessionManager.addEvent(event);
      
      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Flush if queue is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flush();
      }

      console.log('📊 Event tracked:', eventName, properties);
    } catch (error) {
      console.error('❌ Failed to track event:', error);
      captureMessage(`Failed to track event: ${eventName}`, 'error');
    }
  }

  async trackPageView(pageName: string, properties: Record<string, any> = {}): Promise<void> {
    sessionManager.incrementPageViews();
    
    await this.trackEvent('page_view', {
      page_name: pageName,
      page_title: document.title,
      page_path: window.location.pathname,
      page_query: window.location.search,
      page_hash: window.location.hash,
      ...properties
    }, ANALYTICS_CONFIG.EVENT_TYPES.PAGE_VIEW);
  }

  async trackConversion(
    conversionName: string,
    value?: number,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(conversionName, {
      conversion_value: value,
      ...properties
    }, ANALYTICS_CONFIG.EVENT_TYPES.CONVERSION);
  }

  async trackError(
    errorName: string,
    errorMessage: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(errorName, {
      error_message: errorMessage,
      error_stack: new Error().stack,
      ...properties
    }, ANALYTICS_CONFIG.EVENT_TYPES.ERROR);
  }

  async trackBusinessEvent(
    eventName: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(eventName, properties, ANALYTICS_CONFIG.EVENT_TYPES.BUSINESS);
  }

  async flush(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;
    
    if (!force && this.eventQueue.length < this.batchSize) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventsToFlush);

      if (error) {
        console.error('❌ Failed to flush analytics events:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...eventsToFlush);
      } else {
        console.log(`📊 Flushed ${eventsToFlush.length} analytics events`);
      }
    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  // Get session ID
  getSessionId(): string {
    return sessionManager.getSessionId();
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();
