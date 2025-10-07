# Analytics System Documentation

## Overview

The Dislink Analytics System provides comprehensive user behavior tracking, conversion funnel analysis, and business metrics. It's designed to be privacy-focused, performant, and easy to integrate.

## Features

- **User Behavior Tracking**: Automatic page views, clicks, form submissions, and user interactions
- **Conversion Funnels**: Track user journeys from registration to onboarding completion
- **Business Metrics**: Monitor key performance indicators and user engagement
- **Real-time Analytics**: Live event tracking and active user monitoring
- **Performance Tracking**: Page load times, API call durations, and error monitoring
- **A/B Testing Support**: Experiment tracking and conversion analysis

## Quick Start

### 1. Analytics Provider Setup

The `AnalyticsProvider` is already integrated into the main App component:

```tsx
<AnalyticsProvider
  enableAutoTracking={true}
  enablePerformanceTracking={true}
  enableErrorTracking={true}
>
  {/* Your app components */}
</AnalyticsProvider>
```

### 2. Using Analytics Hooks

```tsx
import {
  useBusinessTracking,
  useInteractionTracking,
} from "../components/analytics";

function MyComponent() {
  const { trackRegistration, trackOnboardingCompleted } = useBusinessTracking();
  const { trackButtonClick, trackFormSubmit } = useInteractionTracking();

  const handleRegistration = () => {
    trackRegistration({ source: "landing_page" });
    // ... registration logic
  };

  const handleButtonClick = () => {
    trackButtonClick("cta_button", { location: "hero_section" });
    // ... button logic
  };

  return (
    <div>
      <button onClick={handleButtonClick}>Click Me</button>
    </div>
  );
}
```

### 3. Using Analytics Components

```tsx
import {
  AnalyticsButton,
  AnalyticsForm,
  AnalyticsLink,
} from "../components/analytics";

function MyForm() {
  return (
    <AnalyticsForm
      formName="contact_form"
      analyticsProperties={{ page: "contact" }}
    >
      <input name="email" type="email" required />
      <AnalyticsButton
        analyticsName="submit_contact_form"
        analyticsProperties={{ form_type: "contact" }}
        type="submit"
      >
        Submit
      </AnalyticsButton>
    </AnalyticsForm>
  );
}
```

## Available Hooks

### useBusinessTracking()

Tracks key business events:

- `trackRegistration()` - User starts registration
- `trackRegistrationCompleted()` - Registration completed
- `trackEmailConfirmed()` - Email confirmation
- `trackOnboardingStarted()` - Onboarding begins
- `trackOnboardingCompleted()` - Onboarding finished
- `trackProfileCreated()` - Profile creation
- `trackConnectionMade()` - User makes a connection
- `trackQRCodeGenerated()` - QR code created
- `trackQRCodeScanned()` - QR code scanned

### useInteractionTracking()

Tracks user interactions:

- `trackClick()` - Generic click tracking
- `trackFormSubmit()` - Form submission
- `trackFormError()` - Form errors
- `trackButtonClick()` - Button clicks
- `trackLinkClick()` - Link clicks

### useFunnelTracking()

Tracks conversion funnels:

- `startFunnel()` - Begin a funnel
- `updateFunnelStep()` - Update funnel progress
- `completeFunnel()` - Complete funnel
- `abandonFunnel()` - Abandon funnel

### usePerformanceTracking()

Tracks performance metrics:

- `trackPageLoad()` - Page load times
- `trackApiCall()` - API call performance
- `trackError()` - Error tracking

### useEngagementTracking()

Tracks user engagement:

- `trackTimeOnPage()` - Time spent on page
- `trackScrollDepth()` - Scroll depth tracking
- `trackVideoPlay()` - Video interactions
- `trackVideoComplete()` - Video completion

## Analytics Dashboard

Access the analytics dashboard at `/app/analytics` (requires authentication).

### Features:

- **Real-time Events**: Live feed of user interactions
- **Active Users**: Current online users (5-minute window)
- **Conversion Funnels**: Visual representation of user journeys
- **Business Metrics**: Key performance indicators
- **Performance Metrics**: Page load times and API performance
- **Error Tracking**: JavaScript errors and API failures

## Event Types

### Business Events

- `registration_started`
- `registration_completed`
- `email_confirmed`
- `onboarding_started`
- `onboarding_completed`
- `profile_created`
- `connection_made`
- `qr_code_generated`
- `qr_code_scanned`

### Interaction Events

- `click`
- `form_submit`
- `form_error`
- `button_click`
- `link_click`

### Performance Events

- `page_load`
- `api_call`
- `performance_metrics`

### Engagement Events

- `time_on_page`
- `scroll_depth`
- `video_play`
- `video_complete`

## Privacy & Security

- All analytics data is stored securely in Supabase
- No personally identifiable information is tracked without consent
- Users can opt-out of analytics tracking
- Data is automatically anonymized after 90 days
- GDPR and CCPA compliant

## Performance Considerations

- Analytics tracking is non-blocking and asynchronous
- Events are batched and sent in intervals to reduce network requests
- Failed events are queued and retried automatically
- Minimal impact on page load times (< 50ms)

## Troubleshooting

### Common Issues

1. **Events not appearing in dashboard**

   - Check browser console for errors
   - Verify Supabase connection
   - Ensure user is authenticated for protected routes

2. **Performance impact**

   - Disable real-time tracking if needed
   - Reduce event frequency
   - Check for memory leaks in long-running sessions

3. **Missing conversion data**
   - Verify funnel steps are properly tracked
   - Check that business events are fired at correct times
   - Ensure user journey completion is tracked

### Debug Mode

Enable debug mode by setting `VITE_ANALYTICS_DEBUG=true` in your environment variables.

## Best Practices

1. **Event Naming**: Use consistent, descriptive event names
2. **Properties**: Include relevant context in event properties
3. **Performance**: Avoid tracking too many events per page
4. **Privacy**: Never track sensitive user data
5. **Testing**: Test analytics in development before production

## Integration Examples

### Registration Flow

```tsx
const { trackRegistration, trackRegistrationCompleted, trackEmailConfirmed } =
  useBusinessTracking();

// Start registration
trackRegistration({ source: "landing_page", method: "email" });

// Complete registration
trackRegistrationCompleted({ user_id: user.id, method: "email" });

// Email confirmed
trackEmailConfirmed({ user_id: user.id, time_to_confirm: timeDiff });
```

### Onboarding Funnel

```tsx
const { startFunnel, updateFunnelStep, completeFunnel } = useFunnelTracking();

// Start onboarding funnel
await startFunnel("user_onboarding", 5, { user_id: user.id });

// Update progress
await updateFunnelStep("user_onboarding", 2, "profile_setup", {
  user_id: user.id,
  step_duration: 120,
});

// Complete funnel
await completeFunnel("user_onboarding", {
  user_id: user.id,
  total_duration: 600,
});
```

### Performance Monitoring

```tsx
const { trackPageLoad, trackApiCall } = usePerformanceTracking();

// Track page load
const startTime = performance.now();
window.addEventListener("load", () => {
  const loadTime = performance.now() - startTime;
  trackPageLoad("dashboard", loadTime);
});

// Track API calls
const apiStart = performance.now();
const response = await fetch("/api/data");
const duration = performance.now() - apiStart;
trackApiCall("/api/data", "GET", duration, response.status);
```
