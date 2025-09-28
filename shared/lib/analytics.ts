import { captureMessage } from './sentry'

interface AnalyticsEvent {
    event: string
    properties?: Record<string, any>
    userId?: string
    timestamp?: number
}

class AnalyticsService {
    private events: AnalyticsEvent[] = []
    private isProduction = import.meta.env.PROD

    track(event: string, properties?: Record<string, any>) {
        const analyticsEvent: AnalyticsEvent = {
            event,
            properties,
            timestamp: Date.now()
        }

        this.events.push(analyticsEvent)

        if (this.isProduction) {
            // Send to your analytics service (e.g., PostHog, Mixpanel, etc.)
            this.sendToService(analyticsEvent)
        } else {
            console.log('Analytics Event:', analyticsEvent)
        }
    }

    private sendToService(event: AnalyticsEvent) {
        // Implement your analytics service integration
        // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })
        captureMessage(`Analytics: ${event}`, 'info')
    }

    // Track page views
    trackPageView(path: string) {
        this.track('page_view', { path })
    }

    // Track user actions
    trackUserAction(action: string, properties?: Record<string, any>) {
        this.track('user_action', { action, ...properties })
    }

    // Track errors
    trackError(error: Error, context?: string) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context
        })
    }

    // Track performance metrics
    trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
        this.track('performance', {
            metric,
            value,
            ...properties
        })
    }

    // Track authentication events
    trackAuth(event: 'login' | 'logout' | 'register' | 'password_reset', properties?: Record<string, any>) {
        this.track('auth', { event, ...properties })
    }

    // Track QR code events
    trackQR(event: 'generate' | 'scan' | 'connect', properties?: Record<string, any>) {
        this.track('qr', { event, ...properties })
    }

    // Track contact events
    trackContact(event: 'create' | 'update' | 'delete' | 'view', properties?: Record<string, any>) {
        this.track('contact', { event, ...properties })
    }
}

export const analytics = new AnalyticsService()

// Web Vitals tracking
export function initWebVitals() {
    if (import.meta.env.PROD) {
        // Import web-vitals dynamically to avoid bundle size impact
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(sendToAnalytics)
            getFID(sendToAnalytics)
            getFCP(sendToAnalytics)
            getLCP(sendToAnalytics)
            getTTFB(sendToAnalytics)
        })
    }
}

function sendToAnalytics(metric: any) {
    analytics.trackPerformance(metric.name, metric.value, {
        rating: metric.rating,
        delta: metric.delta
    })

    // Log to console in development
    if (import.meta.env.DEV) {
        console.log('Web Vital:', metric.name, metric.value)
    }
}
