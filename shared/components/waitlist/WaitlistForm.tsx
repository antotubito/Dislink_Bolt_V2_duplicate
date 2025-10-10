import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Loader, AlertCircle, Users, CheckCircle, TestTube } from 'lucide-react';
import { googleSheetsService } from '../../lib/googleSheetsService';
import { GoogleSheetsTest } from './GoogleSheetsTest';


interface WaitlistFormProps {
  onSuccess?: () => void;
}

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Retry pending emails on component mount
  React.useEffect(() => {
    const retryPendingEmails = async () => {
      try {
        const pendingEmails = JSON.parse(localStorage.getItem('pendingWaitlistEmails') || '[]');
        if (pendingEmails.length > 0) {
          console.log('🔄 Retrying pending waitlist emails:', pendingEmails.length);
          
          const { googleSheetsService } = await import('../../lib/googleSheetsService');
          const successfulRetries = [];
          
          for (const pendingEmail of pendingEmails) {
            try {
              const success = await googleSheetsService.submitEmail(pendingEmail.email, pendingEmail.source);
              if (success) {
                successfulRetries.push(pendingEmail);
                console.log('✅ Retry successful for:', pendingEmail.email.substring(0, 3) + '***');
              }
            } catch (retryError) {
              console.warn('⚠️ Retry failed for:', pendingEmail.email.substring(0, 3) + '***', retryError);
            }
          }
          
          // Remove successfully retried emails
          if (successfulRetries.length > 0) {
            const remainingEmails = pendingEmails.filter(email => 
              !successfulRetries.some(successful => successful.email === email.email)
            );
            localStorage.setItem('pendingWaitlistEmails', JSON.stringify(remainingEmails));
            console.log('✅ Retried', successfulRetries.length, 'emails successfully');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error retrying pending emails:', error);
      }
    };

    retryPendingEmails();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      // Track the email submission with source
      console.log('🔍 WAITLIST: Starting submission:', {
        email: email.substring(0, 3) + '***',
        timestamp: new Date().toISOString(),
        source: 'waitlist-form',
        webhookUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ? 'configured' : 'not configured'
      });

      // Submit to Google Sheets using the new service
      const success = await googleSheetsService.submitEmail(email, 'waitlist-form');

      console.log('🔍 WAITLIST: Submission result:', {
        success,
        email: email.substring(0, 3) + '***'
      });

      if (success) {
        setSuccess(true);
        setEmail('');
        onSuccess?.();

        // Track successful submission
        console.log('✅ WAITLIST: Submission successful:', {
          email: email.substring(0, 3) + '***',
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ WAITLIST: Submission failed - Google Sheets service returned false');
        
        // Store email locally as fallback
        try {
          const pendingEmails = JSON.parse(localStorage.getItem('pendingWaitlistEmails') || '[]');
          pendingEmails.push({
            email: email,
            timestamp: new Date().toISOString(),
            source: 'waitlist-form-fallback'
          });
          localStorage.setItem('pendingWaitlistEmails', JSON.stringify(pendingEmails));
          console.log('📧 Email stored locally as fallback');
        } catch (storageError) {
          console.warn('⚠️ Could not store email locally:', storageError);
        }
        
        setError("Unable to join waitlist at this time. Your email has been saved locally and will be processed when the service is available. Please try again in a few moments.");
      }

    } catch (err) {
      console.error('❌ WAITLIST: Submission error:', err);
      setError("Failed to join waitlist. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };


  // Animation variants
  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="w-full space-y-6">
      {/* Simple messaging */}
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-600 text-sm font-medium shadow-sm">
          <Users className="w-4 h-4 mr-2 text-indigo-500" />
          Join thousands of early adopters
        </div>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white p-8 rounded-xl shadow-lg border border-green-100"
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Early Access!</h3>
              <p className="text-gray-600 mb-6">
                You're now on our exclusive early access list. We'll notify you as soon as Dislink is ready for you.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmation email sent
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="relative"
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white shadow-sm"
                  aria-label="Email address for early access signup"
                  aria-describedby="waitlist-error"
                  aria-invalid={error ? "true" : "false"}
                  required
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || !email.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-captamundi-primary py-4 rounded-xl font-medium text-lg"
                aria-label={loading ? "Submitting email for early access" : "Get early access"}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5 text-white mr-2" />
                    Joining...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Get Early Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 flex items-center text-sm text-red-600 bg-red-50 p-2 rounded-lg"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </motion.div>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {/* Test Button (only show in development) */}
      {import.meta.env.DEV && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <TestTube className="h-3 w-3" />
            Test Google Sheets
          </button>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <GoogleSheetsTest onClose={() => setShowTestModal(false)} />
      )}

    </div>
  );
}
