import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Mail, Users, AlertCircle, Loader2 } from 'lucide-react';
import { addToWaitlist, getWorldwideConnections } from '../../lib/waitlist';

interface WaitlistFormProps {
  onSuccess?: () => void;
}

// Get user's location for analytics
async function getUserLocation(): Promise<{ latitude: number; longitude: number; name?: string } | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location'
        });
      },
      () => {
        resolve(undefined);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}

// Extract UTM parameters from URL
function getUTMParameters(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined
  };
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [connections, setConnections] = useState(12847); // Start with a base number
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  // Load dynamic connections count
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const count = await getWorldwideConnections();
        setConnections(count);
      } catch (error) {
        console.error('Failed to load connections count:', error);
        // Keep the default value if loading fails
      }
    };

    loadConnections();
    
    // Update connections count every 30 seconds
    const interval = setInterval(loadConnections, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate growing connections in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setConnections(prev => {
        // Small random increment to show growth
        const increment = Math.floor(Math.random() * 3) + 1;
        return prev + increment;
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAlreadySubscribed(false);

    try {
      // Get user location for analytics
      const location = await getUserLocation();
      
      // Get UTM parameters
      const utmParams = getUTMParameters();

      // Track the email submission with enhanced data
      console.log('Waitlist submission:', { 
        email, 
        timestamp: new Date().toISOString(),
        source: 'waitlist-form',
        location,
        ...utmParams
      });

      // Use the new Supabase-based waitlist service
      const result = await addToWaitlist({
        email,
        source: 'waitlist-form',
        location,
        ...utmParams
      });

      if (result.success) {
        setSuccess(true);
        setEmail('');
        setAlreadySubscribed(result.alreadySubscribed || false);
        onSuccess?.();
        
        // Track successful submission
        console.log('Waitlist submission successful:', { 
          email, 
          timestamp: new Date().toISOString(),
          alreadySubscribed: result.alreadySubscribed
        });
      } else {
        setError(result.message);
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      setError("Failed to join waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formattedConnections = connections.toLocaleString();

  // Animation variants
  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      variants={formVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {alreadySubscribed ? "You're already in!" : "Welcome aboard!"}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {alreadySubscribed 
                  ? "You're already on our waitlist. We'll notify you when Dislink is ready!"
                  : "Check your email for confirmation. We'll notify you when Dislink is ready for early access."
                }
              </p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  🎉 You're part of a growing community of <span className="font-bold text-indigo-600">{formattedConnections}</span> professionals!
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Connection Counter */}
            <div className="text-center mb-6">
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 inline-block">
                <div className="flex items-center justify-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="text-gray-700 font-medium">
                    <motion.span
                      key={formattedConnections}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl font-bold text-indigo-600"
                    >
                      {formattedConnections}
                    </motion.span>
                    <span className="text-sm ml-1">worldwide connections</span>
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center space-x-2 text-red-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Joining waitlist...</span>
                    </div>
                  ) : (
                    'Join the Waitlist'
                  )}
                </motion.button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  We'll never spam you. Unsubscribe at any time.
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}