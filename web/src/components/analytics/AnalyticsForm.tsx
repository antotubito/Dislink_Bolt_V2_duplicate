/**
 * Analytics Form Component
 * A form that automatically tracks form interactions and submissions
 */

import React, { useState, useCallback } from 'react';
import { useInteractionTracking } from '../../hooks/useAnalytics';

interface AnalyticsFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  formName: string;
  analyticsProperties?: Record<string, any>;
  onFormSubmit?: (formData: FormData) => void;
  onFormError?: (error: string) => void;
}

export const AnalyticsForm: React.FC<AnalyticsFormProps> = ({
  children,
  formName,
  analyticsProperties = {},
  onFormSubmit,
  onFormError,
  onSubmit,
  ...props
}) => {
  const { trackFormSubmit, trackFormError } = useInteractionTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      
      // Track form submission attempt
      trackFormSubmit(formName, {
        ...analyticsProperties,
        form_data_keys: Array.from(formData.keys()),
        timestamp: new Date().toISOString()
      });

      // Call the original onSubmit handler
      if (onSubmit) {
        await onSubmit(event);
      }

      // Call custom form submit handler
      if (onFormSubmit) {
        await onFormSubmit(formData);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Track form error
      trackFormError(formName, errorMessage, {
        ...analyticsProperties,
        error_type: 'form_submission_error'
      });

      // Call custom error handler
      if (onFormError) {
        onFormError(errorMessage);
      }

      // Set error state
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }, [formName, analyticsProperties, trackFormSubmit, trackFormError, onSubmit, onFormSubmit, onFormError]);

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
      {isSubmitting && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-800">Submitting form...</span>
          </div>
        </div>
      )}
      {errors.general && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{errors.general}</span>
          </div>
        </div>
      )}
    </form>
  );
};
