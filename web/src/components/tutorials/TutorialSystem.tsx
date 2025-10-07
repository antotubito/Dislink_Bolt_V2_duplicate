import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Lightbulb,
  Users,
  QrCode,
  Calendar,
  MapPin,
  MessageCircle
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action?: string;
  completed?: boolean;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  steps: TutorialStep[];
  category: 'contacts' | 'qr' | 'followups' | 'community' | 'profile';
  estimatedTime: string;
}

interface TutorialSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialTutorial?: string;
}

export function TutorialSystem({ isOpen, onClose, initialTutorial }: TutorialSystemProps) {
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const tutorials: Tutorial[] = [
    {
      id: 'create-first-contact',
      title: 'Creating Your First Contact',
      description: 'Learn how to add and manage your network connections',
      icon: Users,
      category: 'contacts',
      estimatedTime: '3 minutes',
      steps: [
        {
          id: 'step-1',
          title: 'Navigate to Contacts',
          description: 'Click on the "Contacts" tab in the main navigation to access your contact list.',
          icon: Users,
          action: 'Go to Contacts'
        },
        {
          id: 'step-2',
          title: 'Add New Contact',
          description: 'Click the "Add Contact" button to start adding someone new to your network.',
          icon: Users,
          action: 'Add Contact'
        },
        {
          id: 'step-3',
          title: 'Fill Contact Details',
          description: 'Enter their name, email, job title, and company. Add a note about how you met.',
          icon: Users,
          action: 'Save Contact'
        },
        {
          id: 'step-4',
          title: 'Add Meeting Context',
          description: 'Include where and when you met them to remember the connection better.',
          icon: MapPin,
          action: 'Add Context'
        }
      ]
    },
    {
      id: 'generate-qr-code',
      title: 'Generating Your QR Code',
      description: 'Create a shareable QR code for easy networking',
      icon: QrCode,
      category: 'qr',
      estimatedTime: '2 minutes',
      steps: [
        {
          id: 'step-1',
          title: 'Access QR Generator',
          description: 'Click the QR code icon in the top navigation or use the quick action button.',
          icon: QrCode,
          action: 'Generate QR'
        },
        {
          id: 'step-2',
          title: 'Share Your Code',
          description: 'Show your QR code to others or share the link. Each code can only be used once for security.',
          icon: QrCode,
          action: 'Share QR'
        },
        {
          id: 'step-3',
          title: 'Track Scans',
          description: 'Monitor who scans your QR code and when. You\'ll receive connection requests from scanners.',
          icon: QrCode,
          action: 'View Scans'
        }
      ]
    },
    {
      id: 'schedule-followup',
      title: 'Scheduling Follow-ups',
      description: 'Set reminders to stay connected with important people',
      icon: Calendar,
      category: 'followups',
      estimatedTime: '4 minutes',
      steps: [
        {
          id: 'step-1',
          title: 'Select a Contact',
          description: 'Go to your contacts and click on someone you want to follow up with.',
          icon: Users,
          action: 'Select Contact'
        },
        {
          id: 'step-2',
          title: 'Create Follow-up',
          description: 'Click "Add Follow-up" and set a date and reminder message.',
          icon: Calendar,
          action: 'Create Follow-up'
        },
        {
          id: 'step-3',
          title: 'Set Reminder',
          description: 'Choose when you want to be reminded - a few days before or on the day.',
          icon: Calendar,
          action: 'Set Reminder'
        },
        {
          id: 'step-4',
          title: 'Track Progress',
          description: 'View all your upcoming follow-ups in the dashboard and mark them as completed.',
          icon: CheckCircle,
          action: 'Track Progress'
        }
      ]
    },
    {
      id: 'join-community',
      title: 'Joining the Community',
      description: 'Share what you need and help others in the community',
      icon: MessageCircle,
      category: 'community',
      estimatedTime: '3 minutes',
      steps: [
        {
          id: 'step-1',
          title: 'Access Daily Needs',
          description: 'Scroll down on the home page to find the "Daily Needs" section.',
          icon: MessageCircle,
          action: 'Find Section'
        },
        {
          id: 'step-2',
          title: 'Create a Need',
          description: 'Click "Share What You Need" to post a request for help or resources.',
          icon: MessageCircle,
          action: 'Create Need'
        },
        {
          id: 'step-3',
          title: 'Help Others',
          description: 'Browse other people\'s needs and offer help when you can.',
          icon: MessageCircle,
          action: 'Help Others'
        },
        {
          id: 'step-4',
          title: 'Build Connections',
          description: 'Connect with people who help you or whom you help to build lasting relationships.',
          icon: Users,
          action: 'Connect'
        }
      ]
    }
  ];

  useEffect(() => {
    if (isOpen && initialTutorial) {
      const tutorial = tutorials.find(t => t.id === initialTutorial);
      if (tutorial) {
        setCurrentTutorial(tutorial);
        setCurrentStep(0);
      }
    }
  }, [isOpen, initialTutorial]);

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setCurrentStep(0);
  };

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNext = () => {
    if (currentTutorial && currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentTutorial(null);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {!currentTutorial ? (
            // Tutorial Selection
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Feature Tutorials</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Choose a tutorial to learn how to use Dislink's key features:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutorials.map((tutorial) => (
                  <motion.div
                    key={tutorial.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleTutorialSelect(tutorial)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {React.createElement(tutorial.icon, { className: "w-5 h-5 text-purple-600" })}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {tutorial.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {tutorial.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {tutorial.estimatedTime}
                          </span>
                          <ArrowRight className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // Tutorial Steps
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <currentTutorial.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentTutorial.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Step {currentStep + 1} of {currentTutorial.steps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                  {currentTutorial.steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded-full ${
                        index <= currentStep
                          ? 'bg-purple-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {React.createElement(currentTutorial.steps[currentStep].icon, { className: "w-8 h-8 text-purple-600" })}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {currentTutorial.steps[currentStep].title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {currentTutorial.steps[currentStep].description}
                  </p>
                  {currentTutorial.steps[currentStep].action && (
                    <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">
                        {currentTutorial.steps[currentStep].action}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentStep === currentTutorial.steps.length - 1 ? (
                  <button
                    onClick={handleClose}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Tutorial</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Default export for better compatibility
export default TutorialSystem;
