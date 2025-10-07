/**
 * Analytics Hooks for React Components
 * Provides easy-to-use hooks for tracking user behavior and business metrics
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  analytics, 
  trackEvent, 
  trackPageView, 
  trackBusinessEvent,
  trackConversion,
  trackError,
  ANALYTICS_CONFIG 
} from '@dislink/shared/lib/analytics';
import {
  startUserJourney,
  updateUserJourney,
  completeUserJourney,
  abandonUserJourney,
  trackFunnelStep
} from '@dislink/shared/lib/businessAnalytics';

// Hook for automatic page view tracking
export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only track if path has changed
    if (previousPath.current !== currentPath) {
      const pageName = getPageNameFromPath(currentPath);
      trackPageView(pageName, {
        path: currentPath,
        search: location.search,
        hash: location.hash,
        referrer: document.referrer
      });
      
      previousPath.current = currentPath;
    }
  }, [location]);
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackClick = useCallback((element: string, properties?: Record<string, any>) => {
    trackEvent('click', {
      element,
      ...properties
    });
  }, []);

  const trackFormSubmit = useCallback((formName: string, properties?: Record<string, any>) => {
    trackEvent('form_submit', {
      form_name: formName,
      ...properties
    });
  }, []);

  const trackFormError = useCallback((formName: string, error: string, properties?: Record<string, any>) => {
    trackError('form_error', error, {
      form_name: formName,
      ...properties
    });
  }, []);

  const trackButtonClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    trackEvent('button_click', {
      button_name: buttonName,
      ...properties
    });
  }, []);

  const trackLinkClick = useCallback((linkUrl: string, linkText?: string, properties?: Record<string, any>) => {
    trackEvent('link_click', {
      link_url: linkUrl,
      link_text: linkText,
      ...properties
    });
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackFormError,
    trackButtonClick,
    trackLinkClick
  };
};

// Hook for business event tracking
export const useBusinessTracking = () => {
  const trackRegistration = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.REGISTRATION_STARTED, properties);
  }, []);

  const trackRegistrationCompleted = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.REGISTRATION_COMPLETED, properties);
  }, []);

  const trackEmailConfirmed = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.EMAIL_CONFIRMED, properties);
  }, []);

  const trackOnboardingStarted = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_STARTED, properties);
  }, []);

  const trackOnboardingCompleted = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_COMPLETED, properties);
  }, []);

  const trackOnboardingAbandoned = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.ONBOARDING_ABANDONED, properties);
  }, []);

  const trackProfileCreated = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.PROFILE_CREATED, properties);
  }, []);

  const trackConnectionMade = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.CONNECTION_MADE, properties);
  }, []);

  const trackQRCodeGenerated = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_GENERATED, properties);
  }, []);

  const trackQRCodeScanned = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.QR_CODE_SCANNED, properties);
  }, []);

  const trackInvitationSent = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_SENT, properties);
  }, []);

  const trackInvitationAccepted = useCallback((properties?: Record<string, any>) => {
    trackBusinessEvent(ANALYTICS_CONFIG.BUSINESS_EVENTS.INVITATION_ACCEPTED, properties);
  }, []);

  return {
    trackRegistration,
    trackRegistrationCompleted,
    trackEmailConfirmed,
    trackOnboardingStarted,
    trackOnboardingCompleted,
    trackOnboardingAbandoned,
    trackProfileCreated,
    trackConnectionMade,
    trackQRCodeGenerated,
    trackQRCodeScanned,
    trackInvitationSent,
    trackInvitationAccepted
  };
};

// Hook for conversion funnel tracking
export const useFunnelTracking = () => {
  const startFunnel = useCallback(async (funnelName: string, totalSteps: number, properties?: Record<string, any>) => {
    await startUserJourney(funnelName, totalSteps, properties);
  }, []);

  const updateFunnelStep = useCallback(async (funnelName: string, stepNumber: number, stepName: string, properties?: Record<string, any>) => {
    await trackFunnelStep(funnelName, stepNumber, stepName, properties);
    await updateUserJourney(funnelName, stepNumber, properties);
  }, []);

  const completeFunnel = useCallback(async (funnelName: string, properties?: Record<string, any>) => {
    await completeUserJourney(funnelName, properties);
  }, []);

  const abandonFunnel = useCallback(async (funnelName: string, properties?: Record<string, any>) => {
    await abandonUserJourney(funnelName, properties);
  }, []);

  return {
    startFunnel,
    updateFunnelStep,
    completeFunnel,
    abandonFunnel
  };
};

// Hook for performance tracking
export const usePerformanceTracking = () => {
  const trackPageLoad = useCallback((pageName: string, loadTime: number, properties?: Record<string, any>) => {
    trackEvent('page_load', {
      page_name: pageName,
      load_time: loadTime,
      ...properties
    }, ANALYTICS_CONFIG.EVENT_TYPES.PERFORMANCE);
  }, []);

  const trackApiCall = useCallback((endpoint: string, method: string, duration: number, status: number, properties?: Record<string, any>) => {
    trackEvent('api_call', {
      endpoint,
      method,
      duration,
      status,
      ...properties
    }, ANALYTICS_CONFIG.EVENT_TYPES.PERFORMANCE);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, properties?: Record<string, any>) => {
    trackError(errorType, errorMessage, properties);
  }, []);

  return {
    trackPageLoad,
    trackApiCall,
    trackError
  };
};

// Hook for A/B testing and experiments
export const useExperimentTracking = () => {
  const trackExperimentView = useCallback((experimentName: string, variant: string, properties?: Record<string, any>) => {
    trackEvent('experiment_view', {
      experiment_name: experimentName,
      variant,
      ...properties
    });
  }, []);

  const trackExperimentConversion = useCallback((experimentName: string, variant: string, conversionType: string, properties?: Record<string, any>) => {
    trackConversion('experiment_conversion', undefined, {
      experiment_name: experimentName,
      variant,
      conversion_type: conversionType,
      ...properties
    });
  }, []);

  return {
    trackExperimentView,
    trackExperimentConversion
  };
};

// Hook for user engagement tracking
export const useEngagementTracking = () => {
  const trackTimeOnPage = useCallback((pageName: string, timeSpent: number, properties?: Record<string, any>) => {
    trackEvent('time_on_page', {
      page_name: pageName,
      time_spent: timeSpent,
      ...properties
    });
  }, []);

  const trackScrollDepth = useCallback((pageName: string, scrollDepth: number, properties?: Record<string, any>) => {
    trackEvent('scroll_depth', {
      page_name: pageName,
      scroll_depth: scrollDepth,
      ...properties
    });
  }, []);

  const trackVideoPlay = useCallback((videoId: string, videoTitle?: string, properties?: Record<string, any>) => {
    trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle,
      ...properties
    });
  }, []);

  const trackVideoComplete = useCallback((videoId: string, videoTitle?: string, properties?: Record<string, any>) => {
    trackEvent('video_complete', {
      video_id: videoId,
      video_title: videoTitle,
      ...properties
    });
  }, []);

  return {
    trackTimeOnPage,
    trackScrollDepth,
    trackVideoPlay,
    trackVideoComplete
  };
};

// Utility function to get page name from path
function getPageNameFromPath(path: string): string {
  const pathMap: Record<string, string> = {
    '/': 'landing_page',
    '/register': 'registration_page',
    '/login': 'login_page',
    '/confirmed': 'email_confirmed_page',
    '/onboarding': 'onboarding_page',
    '/dashboard': 'dashboard_page',
    '/profile': 'profile_page',
    '/settings': 'settings_page',
    '/connections': 'connections_page',
    '/qr': 'qr_code_page',
    '/analytics': 'analytics_dashboard'
  };

  return pathMap[path] || `page_${path.replace(/\//g, '_').replace(/^_/, '')}`;
}

// Hook for comprehensive analytics (combines all tracking)
export const useAnalytics = () => {
  const interaction = useInteractionTracking();
  const business = useBusinessTracking();
  const funnel = useFunnelTracking();
  const performance = usePerformanceTracking();
  const experiment = useExperimentTracking();
  const engagement = useEngagementTracking();

  return {
    ...interaction,
    ...business,
    ...funnel,
    ...performance,
    ...experiment,
    ...engagement
  };
};
