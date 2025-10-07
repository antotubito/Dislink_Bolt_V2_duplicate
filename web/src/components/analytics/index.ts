/**
 * Analytics Components Index
 * Centralized exports for all analytics-related components and hooks
 */

// Components
export { AnalyticsProvider } from './AnalyticsProvider';
export { AnalyticsDashboard } from './AnalyticsDashboard';
export { AnalyticsButton } from './AnalyticsButton';
export { AnalyticsForm } from './AnalyticsForm';
export { AnalyticsLink } from './AnalyticsLink';

// Hooks
export {
  usePageTracking,
  useInteractionTracking,
  useBusinessTracking,
  useFunnelTracking,
  usePerformanceTracking,
  useExperimentTracking,
  useEngagementTracking,
  useAnalytics
} from '../../hooks/useAnalytics';

// Context
export { useAnalyticsContext } from './AnalyticsProvider';
