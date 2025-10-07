import React, { useEffect } from 'react';
import { logger } from '@dislink/shared/lib/logger';

/**
 * PreloadManager - Preloads critical components to improve user experience
 * This component should be rendered early in the app lifecycle
 */
export function PreloadManager() {
  useEffect(() => {
    const preloadCriticalComponents = async () => {
      try {
        logger.info('🚀 Starting critical component preloading...');

        // Preload onboarding components (only existing ones)
        const onboardingComponents = [
          () => import('../onboarding/EnhancedSocialPlatforms'),
          () => import('../onboarding/LocationStep'),
        ];

        // Preload auth components
        const authComponents = [
          () => import('../auth/AuthProvider'),
          () => import('../auth/SessionGuard'),
          () => import('../auth/ProtectedRoute'),
        ];

        // Preload QR components (if they exist)
        const qrComponents = [
          // () => import('../qr/QRConnectionDisplay'),
          // () => import('../qr/InvitationForm'),
        ];

        // Preload all components in parallel
        const allComponents = [
          ...onboardingComponents,
          ...authComponents,
          ...qrComponents,
        ];

        const preloadPromises = allComponents.map(async (componentLoader, index) => {
          try {
            await componentLoader();
            logger.info(`✅ Preloaded component ${index + 1}/${allComponents.length}`);
          } catch (error) {
            logger.warn(`⚠️ Failed to preload component ${index + 1}:`, error);
          }
        });

        await Promise.allSettled(preloadPromises);
        logger.info('🎯 Critical component preloading completed');

      } catch (error) {
        logger.error('❌ Error during component preloading:', error);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timeoutId = setTimeout(preloadCriticalComponents, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to preload specific components on demand
 */
export function useComponentPreloader() {
  const preloadComponent = React.useCallback(async (componentLoader: () => Promise<any>) => {
    try {
      await componentLoader();
      logger.info('✅ Component preloaded successfully');
    } catch (error) {
      logger.warn('⚠️ Failed to preload component:', error);
    }
  }, []);

  const preloadMultipleComponents = React.useCallback(async (componentLoaders: (() => Promise<any>)[]) => {
    const promises = componentLoaders.map(loader => preloadComponent(loader));
    await Promise.allSettled(promises);
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadMultipleComponents,
  };
}

/**
 * Higher-order component to preload components when a component mounts
 */
export function withPreloading<P extends object>(
  Component: React.ComponentType<P>,
  componentLoaders: (() => Promise<any>)[]
) {
  return function PreloadedComponent(props: P) {
    const { preloadMultipleComponents } = useComponentPreloader();

    useEffect(() => {
      preloadMultipleComponents(componentLoaders);
    }, [preloadMultipleComponents]);

    return <Component {...props} />;
  };
}
