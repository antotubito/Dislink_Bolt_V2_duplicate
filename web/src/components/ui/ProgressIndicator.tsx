import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: number;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  showDescriptions = false,
  className = ''
}: ProgressIndicatorProps) {
  const getStepIcon = (step: ProgressStep, index: number) => {
    const isCurrent = currentStep === index;
    const isCompleted = step.status === 'completed';
    const isError = step.status === 'error';
    const isPending = step.status === 'pending';

    if (isError) {
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
          <span className="text-red-600 text-sm font-bold">!</span>
        </div>
      );
    }

    if (isCompleted) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-8 h-8 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      );
    }

    if (isCurrent) {
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-8 h-8 rounded-full bg-blue-500 border-2 border-blue-500 flex items-center justify-center"
        >
          <span className="text-white text-sm font-bold">{index + 1}</span>
        </motion.div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
        <span className="text-gray-500 text-sm font-bold">{index + 1}</span>
      </div>
    );
  };

  const getStepClasses = (step: ProgressStep, index: number) => {
    const baseClasses = 'flex items-center';
    const isCurrent = currentStep === index;
    const isCompleted = step.status === 'completed';
    const isError = step.status === 'error';

    if (isError) {
      return `${baseClasses} text-red-600`;
    }
    if (isCompleted) {
      return `${baseClasses} text-green-600`;
    }
    if (isCurrent) {
      return `${baseClasses} text-blue-600`;
    }
    return `${baseClasses} text-gray-500`;
  };

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getStepIcon(step, index)}
            </div>
            <div className="flex-1 min-w-0">
              <div className={getStepClasses(step, index)}>
                <h3 className="text-sm font-medium">{step.title}</h3>
              </div>
              {showDescriptions && step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="flex items-center">
              {getStepIcon(step, index)}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: step.status === 'completed' ? '100%' : '0%' 
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <div className={getStepClasses(step, index)}>
                <h3 className="text-xs font-medium">{step.title}</h3>
              </div>
              {showDescriptions && step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Specialized progress components for common flows
export function RegistrationProgress({ currentStep }: { currentStep: number }) {
  const steps: ProgressStep[] = [
    {
      id: 'form',
      title: 'Fill Form',
      description: 'Enter your details',
      status: currentStep >= 0 ? 'completed' : 'pending'
    },
    {
      id: 'verification',
      title: 'Email Verification',
      description: 'Check your email',
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'current' : 'pending'
    },
    {
      id: 'profile',
      title: 'Create Profile',
      description: 'Set up your account',
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 'onboarding',
      title: 'Onboarding',
      description: 'Complete setup',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    }
  ];

  return (
    <ProgressIndicator
      steps={steps}
      currentStep={currentStep}
      showDescriptions={true}
      className="mb-8"
    />
  );
}

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const steps: ProgressStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started',
      status: currentStep >= 0 ? 'completed' : 'pending'
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Complete your profile',
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'current' : 'pending'
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set your preferences',
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'current' : 'pending'
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'Finish setup',
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'current' : 'pending'
    }
  ];

  return (
    <ProgressIndicator
      steps={steps}
      currentStep={currentStep}
      showDescriptions={true}
      className="mb-6"
    />
  );
}

export function LoadingProgress({ 
  message, 
  progress 
}: { 
  message: string; 
  progress?: number 
}) {
  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        {progress !== undefined && (
          <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
