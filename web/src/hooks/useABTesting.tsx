/**
 * A/B Testing React Hooks
 * Easy-to-use hooks for A/B testing in React components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { abTestingFramework } from '../lib/ab-testing/ABTestingFramework';
import { useAuth } from '../components/auth/AuthProvider';

interface UseExperimentOptions {
  experimentId: string;
  fallbackVariant?: string;
  autoTrack?: boolean;
}

interface UseExperimentResult {
  variant: string | null;
  isAssigned: boolean;
  isLoading: boolean;
  error: string | null;
  trackConversion: (metricId: string, value?: number) => Promise<void>;
  getVariantConfig: () => Record<string, any>;
}

/**
 * Hook to get user's assigned variant for an experiment
 */
export const useExperiment = (options: UseExperimentOptions): UseExperimentResult => {
  const { experimentId, fallbackVariant = 'control', autoTrack = true } = options;
  const { user } = useAuth();
  
  const [variant, setVariant] = useState<string | null>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const assignUserToExperiment = async () => {
      if (!user?.id) {
        setVariant(fallbackVariant);
        setIsAssigned(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to get existing assignment first
        let assignedVariant = abTestingFramework.getUserVariant(user.id, experimentId);
        
        // If no assignment, try to assign user
        if (!assignedVariant) {
          assignedVariant = await abTestingFramework.assignUserToExperiment(user.id, experimentId);
        }

        if (assignedVariant) {
          setVariant(assignedVariant);
          setIsAssigned(true);
        } else {
          setVariant(fallbackVariant);
          setIsAssigned(false);
        }
      } catch (err) {
        console.error('Failed to assign user to experiment:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setVariant(fallbackVariant);
        setIsAssigned(false);
      } finally {
        setIsLoading(false);
      }
    };

    assignUserToExperiment();
  }, [user?.id, experimentId, fallbackVariant]);

  const trackConversion = useCallback(async (metricId: string, value: number = 1) => {
    if (!user?.id || !isAssigned) {
      return;
    }

    try {
      await abTestingFramework.trackConversion(user.id, experimentId, metricId, value);
    } catch (err) {
      console.error('Failed to track conversion:', err);
    }
  }, [user?.id, experimentId, isAssigned]);

  const getVariantConfig = useCallback(() => {
    if (!variant) {
      return {};
    }

    const experiment = abTestingFramework.getExperiment(experimentId);
    if (!experiment) {
      return {};
    }

    const variantData = experiment.variants.find(v => v.id === variant);
    return variantData?.configuration || {};
  }, [variant, experimentId]);

  return {
    variant,
    isAssigned,
    isLoading,
    error,
    trackConversion,
    getVariantConfig
  };
};

/**
 * Hook to track experiment conversions
 */
export const useExperimentTracking = () => {
  const { user } = useAuth();

  const trackConversion = useCallback(async (
    experimentId: string,
    metricId: string,
    value: number = 1
  ) => {
    if (!user?.id) {
      return;
    }

    try {
      await abTestingFramework.trackConversion(user.id, experimentId, metricId, value);
    } catch (err) {
      console.error('Failed to track conversion:', err);
    }
  }, [user?.id]);

  const trackEvent = useCallback(async (
    experimentId: string,
    eventName: string,
    properties?: Record<string, any>
  ) => {
    if (!user?.id) {
      return;
    }

    try {
      // Track as custom metric
      await abTestingFramework.trackConversion(user.id, experimentId, eventName, 1);
    } catch (err) {
      console.error('Failed to track experiment event:', err);
    }
  }, [user?.id]);

  return {
    trackConversion,
    trackEvent
  };
};

/**
 * Hook to manage experiments (admin/developer use)
 */
export const useExperimentManagement = () => {
  const [experiments, setExperiments] = useState(abTestingFramework.getExperiments());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshExperiments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Reload experiments from database
      await abTestingFramework['loadExperiments']();
      setExperiments(abTestingFramework.getExperiments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh experiments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExperiment = useCallback(async (experiment: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const id = await abTestingFramework.createExperiment(experiment);
      await refreshExperiments();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshExperiments]);

  const updateExperiment = useCallback(async (experimentId: string, updates: Partial<any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await abTestingFramework.updateExperiment(experimentId, updates);
      await refreshExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshExperiments]);

  const startExperiment = useCallback(async (experimentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await abTestingFramework.startExperiment(experimentId);
      await refreshExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start experiment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshExperiments]);

  const pauseExperiment = useCallback(async (experimentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await abTestingFramework.pauseExperiment(experimentId);
      await refreshExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause experiment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshExperiments]);

  const completeExperiment = useCallback(async (experimentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await abTestingFramework.completeExperiment(experimentId);
      await refreshExperiments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete experiment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshExperiments]);

  const getExperimentResults = useCallback(async (experimentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await abTestingFramework.getExperimentResults(experimentId);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get experiment results');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getExperimentStats = useCallback((experimentId: string) => {
    return abTestingFramework.getExperimentStats(experimentId);
  }, []);

  return {
    experiments,
    isLoading,
    error,
    refreshExperiments,
    createExperiment,
    updateExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    getExperimentResults,
    getExperimentStats
  };
};

/**
 * Hook for experiment variant rendering
 */
export const useExperimentVariant = (experimentId: string, variants: Record<string, React.ReactNode>) => {
  const { variant, isLoading, error } = useExperiment({ experimentId });

  const renderVariant = useMemo(() => {
    if (isLoading) {
      return <div>Loading experiment...</div>;
    }

    if (error) {
      console.error('Experiment error:', error);
      return variants.control || variants.default || null;
    }

    if (!variant) {
      return variants.control || variants.default || null;
    }

    return variants[variant] || variants.control || variants.default || null;
  }, [variant, isLoading, error, variants]);

  return {
    renderVariant,
    variant,
    isLoading,
    error
  };
};

/**
 * Hook for feature flags (simplified A/B testing)
 */
export const useFeatureFlag = (flagName: string, defaultValue: boolean = false) => {
  const { variant, isAssigned } = useExperiment({ 
    experimentId: `feature_flag_${flagName}`,
    fallbackVariant: defaultValue ? 'enabled' : 'disabled'
  });

  return {
    isEnabled: variant === 'enabled',
    isAssigned,
    variant
  };
};

/**
 * Hook for multi-variant testing
 */
export const useMultiVariantExperiment = (
  experimentId: string,
  variants: Record<string, { component: React.ReactNode; weight: number }>
) => {
  const { variant, isLoading, error } = useExperiment({ experimentId });

  const renderVariant = useMemo(() => {
    if (isLoading) {
      return <div>Loading experiment...</div>;
    }

    if (error) {
      console.error('Experiment error:', error);
      return variants.control?.component || null;
    }

    if (!variant) {
      return variants.control?.component || null;
    }

    const variantData = variants[variant];
    return variantData?.component || variants.control?.component || null;
  }, [variant, isLoading, error, variants]);

  return {
    renderVariant,
    variant,
    isLoading,
    error,
    allVariants: Object.keys(variants)
  };
};
