import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  QrCode, 
  Calendar, 
  MapPin, 
  Lightbulb, 
  X, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Target,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';

interface FeatureDiscoveryProps {
  onFeatureClick?: (feature: string) => void;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: string;
  route?: string;
  completed?: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'contacts' | 'qr' | 'followups' | 'community' | 'profile';
}

export function FeatureDiscovery({ onFeatureClick }: FeatureDiscoveryProps) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Define all available features
  const allFeatures: Feature[] = [
    {
      id: 'create-first-contact',
      title: 'Create Your First Contact',
      description: 'Add someone you met recently to start building your network',
      icon: Users,
      action: 'Add Contact',
      route: '/app/contacts',
      priority: 'high',
      category: 'contacts'
    },
    {
      id: 'generate-qr-code',
      title: 'Generate Your QR Code',
      description: 'Create a shareable QR code for easy networking',
      icon: QrCode,
      action: 'Generate QR',
      priority: 'high',
      category: 'qr'
    },
    {
      id: 'schedule-followup',
      title: 'Schedule a Follow-up',
      description: 'Set reminders to stay connected with important people',
      icon: Calendar,
      action: 'Schedule',
      route: '/app/contacts',
      priority: 'medium',
      category: 'followups'
    },
    {
      id: 'add-location-context',
      title: 'Add Meeting Context',
      description: 'Remember where and when you met someone',
      icon: MapPin,
      action: 'Add Context',
      route: '/app/contacts',
      priority: 'medium',
      category: 'contacts'
    },
    {
      id: 'join-community',
      title: 'Join Daily Needs Community',
      description: 'Share what you need and help others in the community',
      icon: MessageCircle,
      action: 'Join Community',
      route: '/app',
      priority: 'low',
      category: 'community'
    },
    {
      id: 'complete-profile',
      title: 'Complete Your Profile',
      description: 'Add more details to make your profile more engaging',
      icon: Target,
      action: 'Complete Profile',
      route: '/app/profile',
      priority: 'medium',
      category: 'profile'
    }
  ];

  useEffect(() => {
    checkUserProgress();
  }, [user]);

  const checkUserProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has any contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has generated any QR codes
      const { data: qrCodes, error: qrError } = await supabase
        .from('connection_codes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has any follow-ups
      const { data: followUps, error: followUpsError } = await supabase
        .from('follow_ups')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has completed their profile
      const profileComplete = user.jobTitle && user.company && user.bio?.location;

      // Update features with completion status
      const updatedFeatures = allFeatures.map(feature => {
        let completed = false;
        
        switch (feature.id) {
          case 'create-first-contact':
            completed = !contactsError && contacts && contacts.length > 0;
            break;
          case 'generate-qr-code':
            completed = !qrError && qrCodes && qrCodes.length > 0;
            break;
          case 'schedule-followup':
            completed = !followUpsError && followUps && followUps.length > 0;
            break;
          case 'complete-profile':
            completed = profileComplete;
            break;
          default:
            completed = false;
        }

        return { ...feature, completed };
      });

      setFeatures(updatedFeatures);

      // Show discovery if user hasn't completed high-priority features
      const highPriorityIncomplete = updatedFeatures.filter(
        f => f.priority === 'high' && !f.completed
      );
      
      setShowDiscovery(highPriorityIncomplete.length > 0);

      // Load dismissed features from localStorage
      const dismissed = JSON.parse(localStorage.getItem('dismissed-features') || '[]');
      setDismissedFeatures(dismissed);

    } catch (error) {
      logger.error('Error checking user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature: Feature) => {
    onFeatureClick?.(feature.id);
    
    if (feature.route) {
      window.location.href = feature.route;
    }
  };

  const handleDismiss = (featureId: string) => {
    const newDismissed = [...dismissedFeatures, featureId];
    setDismissedFeatures(newDismissed);
    localStorage.setItem('dismissed-features', JSON.stringify(newDismissed));
    
    // Hide discovery if all high-priority features are dismissed or completed
    const highPriorityFeatures = features.filter(f => f.priority === 'high');
    const allHighPriorityHandled = highPriorityFeatures.every(f => 
      f.completed || newDismissed.includes(f.id)
    );
    
    if (allHighPriorityHandled) {
      setShowDiscovery(false);
    }
  };

  const handleDismissAll = () => {
    const highPriorityIds = features
      .filter(f => f.priority === 'high' && !f.completed)
      .map(f => f.id);
    
    const newDismissed = [...dismissedFeatures, ...highPriorityIds];
    setDismissedFeatures(newDismissed);
    localStorage.setItem('dismissed-features', JSON.stringify(newDismissed));
    setShowDiscovery(false);
  };

  if (loading || !showDiscovery) {
    return null;
  }

  const visibleFeatures = features.filter(f => 
    !f.completed && 
    !dismissedFeatures.includes(f.id) &&
    f.priority === 'high'
  );

  if (visibleFeatures.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Get Started</h3>
            </div>
            <button
              onClick={handleDismissAll}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Complete these steps to get the most out of Dislink:
          </p>

          <div className="space-y-3">
            {visibleFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleFeatureClick(feature)}
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {React.createElement(feature.icon, { className: "w-5 h-5 text-purple-600" })}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {feature.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-600 font-medium">
                    {feature.action}
                  </span>
                  <ArrowRight className="w-4 h-4 text-purple-600" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              You can dismiss these suggestions anytime
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
