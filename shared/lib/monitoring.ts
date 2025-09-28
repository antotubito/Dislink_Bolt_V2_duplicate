// Monitoring and analytics utilities
export class MonitoringUtils {
    private static isProduction = import.meta.env.PROD;

    // Error tracking
    static trackError(error: Error, context?: string, metadata?: Record<string, any>): void {
        if (!this.isProduction) {
            console.error('Error tracked:', { error: error.message, context, metadata });
            return;
        }

        // In production, you would send to your error tracking service
        // Example: Sentry, LogRocket, etc.
        try {
            // Simulate error tracking service
            const errorData = {
                message: error.message,
                stack: error.stack,
                context,
                metadata,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // Send to your error tracking service
            // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });

            console.error('Production error tracked:', errorData);
        } catch (trackingError) {
            console.error('Failed to track error:', trackingError);
        }
    }

    // Performance tracking
    static trackPerformance(name: string, startTime: number, metadata?: Record<string, any>): void {
        const duration = performance.now() - startTime;

        if (!this.isProduction) {
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`, metadata);
            return;
        }

        // In production, send to analytics service
        try {
            const perfData = {
                name,
                duration,
                metadata,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };

            // Send to your analytics service
            // fetch('/api/performance', { method: 'POST', body: JSON.stringify(perfData) });

            console.log('Performance tracked:', perfData);
        } catch (trackingError) {
            console.error('Failed to track performance:', trackingError);
        }
    }

    // User action tracking
    static trackUserAction(action: string, metadata?: Record<string, any>): void {
        if (!this.isProduction) {
            console.log(`User action: ${action}`, metadata);
            return;
        }

        try {
            const actionData = {
                action,
                metadata,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            // Send to your analytics service
            // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(actionData) });

            console.log('User action tracked:', actionData);
        } catch (trackingError) {
            console.error('Failed to track user action:', trackingError);
        }
    }

    // Page view tracking
    static trackPageView(page: string, metadata?: Record<string, any>): void {
        if (!this.isProduction) {
            console.log(`Page view: ${page}`, metadata);
            return;
        }

        try {
            const pageData = {
                page,
                metadata,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                referrer: document.referrer,
                userAgent: navigator.userAgent
            };

            // Send to your analytics service
            // fetch('/api/pageviews', { method: 'POST', body: JSON.stringify(pageData) });

            console.log('Page view tracked:', pageData);
        } catch (trackingError) {
            console.error('Failed to track page view:', trackingError);
        }
    }

    // Feature usage tracking
    static trackFeatureUsage(feature: string, metadata?: Record<string, any>): void {
        this.trackUserAction(`feature_used_${feature}`, metadata);
    }

    // Error boundary helper
    static setupErrorBoundary(): void {
        window.addEventListener('error', (event) => {
            this.trackError(event.error, 'Global error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(
                new Error(event.reason?.message || 'Unhandled promise rejection'),
                'Unhandled promise rejection',
                { reason: event.reason }
            );
        });
    }
}

// Initialize monitoring
MonitoringUtils.setupErrorBoundary();
