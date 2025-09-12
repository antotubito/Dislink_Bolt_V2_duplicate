import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Check, 
  X, 
  Mail, 
  Users, 
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { validateInvitationCode } from '../../lib/qrEnhanced';
import { completeQRConnection } from '../../lib/qrConnectionHandler';
import { useAuth } from '../auth/AuthProvider';
import { logger } from '../../lib/logger';

interface CodeInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (connectionDetails: any) => void;
  onSkip?: () => void;
}

export function CodeInvitationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onSkip 
}: CodeInvitationModalProps) {
  const { user } = useAuth();
  const [invitationCode, setInvitationCode] = useState('');
  const [connectionCode, setConnectionCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'validating' | 'success'>('input');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim() || !connectionCode.trim()) {
      setError('Please enter both codes');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('validating');

    try {
      // First validate the invitation
      const invitation = await validateInvitationCode(invitationCode.trim(), connectionCode.trim());
      
      if (!invitation) {
        throw new Error('Invalid or expired invitation codes. Please check your codes and try again.');
      }

      // Store the invitation data for connection completion
      const pendingConnection = {
        type: 'email_invitation',
        invitationData: invitation,
        userEmail: user?.email || '',
        completedAt: new Date().toISOString()
      };

      localStorage.setItem('pending_qr_connection', JSON.stringify(pendingConnection));

      // Complete the QR connection
      if (user?.id) {
        await completeQRConnection(user.id);
        
        setConnectionDetails({
          connectedUser: invitation.senderUserId,
          invitationId: invitation.invitationId,
          scanData: invitation.scanData
        });
        
        setStep('success');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(pendingConnection);
        }
        
        logger.info('Code invitation successfully processed', { 
          invitationId: invitation.invitationId,
          userId: user.id 
        });
      }

    } catch (err) {
      logger.error('Error processing invitation codes:', err);
      setError(err instanceof Error ? err.message : 'Failed to process invitation codes');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    logger.info('User skipped code invitation entry');
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  const handleClose = () => {
    if (step === 'success') {
      // If successful, we consider this complete
      onClose();
    } else {
      // If not successful, ask for confirmation
      handleSkip();
    }
  };

  const resetForm = () => {
    setInvitationCode('');
    setConnectionCode('');
    setError(null);
    setStep('input');
    setConnectionDetails(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {step === 'success' ? 'Connection Complete!' : 'Code Invitation'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {step === 'success' ? 'You\'re now connected!' : 'Connect with someone who invited you'}
                  </p>
                </div>
              </div>
              
              {step !== 'validating' && (
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Description */}
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                    <Mail className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-700 leading-relaxed">
                      If someone scanned your QR code and sent you an email invitation, 
                      you'll find two codes in that email. Enter them below to automatically connect!
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invitation ID
                      </label>
                      <input
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        placeholder="e.g., inv_abc123..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connection Code
                      </label>
                      <input
                        type="text"
                        value={connectionCode}
                        onChange={(e) => setConnectionCode(e.target.value)}
                        placeholder="e.g., conn_xyz789..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="flex-1 py-3 px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        disabled={loading}
                      >
                        Skip for now
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !invitationCode.trim() || !connectionCode.trim()}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Users className="h-4 w-4" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'validating' && (
                <motion.div
                  key="validating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Validating Invitation...
                  </h4>
                  <p className="text-gray-600">
                    Processing your codes and establishing the connection
                  </p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Connection Successful! 🎉
                  </h4>
                  
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    You've been automatically connected with the person who invited you. 
                    You can find them in your contacts and start building your relationship!
                  </p>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 mb-6">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">First connection established!</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Continue to Dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
