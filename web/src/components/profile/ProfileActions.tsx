import React, { useState } from 'react';
import { Edit2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ConnectionConfirmation } from '@dislink/shared/components/qr/ConnectionConfirmation';
import { PublicProfilePreview } from './PublicProfilePreview';
import { validateQRCode } from "@dislink/shared/lib/qrConnectionEnhanced";
import { createConnectionRequest } from '@dislink/shared/lib/contacts';
import type { User } from '@dislink/shared/types';

interface ProfileActionsProps {
  user: User;
  onEdit: () => void;
}

export function ProfileActions({ user, onEdit }: ProfileActionsProps) {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewConnectionCode, setPreviewConnectionCode] = useState<string>('');
  const [scannedUser, setScannedUser] = useState<User | null>(null);

  // Add defensive programming to handle null/undefined user
  if (!user || !user.id) {
    console.error('ProfileActions: Invalid user object provided', { user });
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Error: Invalid user data</p>
      </div>
    );
  }

  const handleScan = async (data: string) => {
    try {
      const scannedProfile = await validateQRCode(data);
      if (scannedProfile) {
        setScannedUser(scannedProfile);
        setShowConfirmation(true);
      } else {
        console.error('Invalid QR code');
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
    }
  };

  const handleConfirmConnection = async () => {
    if (!scannedUser) return;
    
    try {
      await createConnectionRequest(scannedUser);
      navigate('/app/contacts');
    } catch (error) {
      console.error('Error creating connection:', error);
    } finally {
      setShowConfirmation(false);
      setScannedUser(null);
    }
  };

  const handlePreviewPublicProfile = async () => {
    try {
      // Validate user object before proceeding
      if (!user || !user.id) {
        console.error('Cannot generate preview: Invalid user object', { user });
        return;
      }

      // For preview, we'll use a mock connection code to avoid database issues
      // This prevents 406 errors and connection code validation problems
      const mockConnectionCode = `preview_${user.id}_${Date.now()}`;
      
      // Show static preview modal (NO TRACKING)
      setPreviewConnectionCode(mockConnectionCode);
      setShowPreview(true);
      
      console.log('🔍 Preview Public Profile (Static, No Tracking, Mock Code):', mockConnectionCode);
    } catch (err) {
      console.error('Error generating preview:', err);
      // Don't crash the component, just log the error
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex flex-col space-y-3 sm:hidden">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePreviewPublicProfile}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-purple-300 rounded-xl shadow-sm text-base font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
        >
          <Eye className="h-5 w-5 mr-2" />
          👁️ Preview Public Profile
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEdit}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit2 className="h-5 w-5 mr-2" />
          Edit Profile
        </motion.button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex sm:space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePreviewPublicProfile}
          className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-lg shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100"
        >
          <Eye className="h-5 w-5 mr-2" />
          👁️ Preview Public Profile
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Edit2 className="h-5 w-5 mr-2" />
          Edit Profile
        </motion.button>
      </div>

      {/* Modals */}

      {scannedUser && (
        <ConnectionConfirmation
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setScannedUser(null);
          }}
          onConfirm={handleConfirmConnection}
          user={scannedUser}
        />
      )}

      {/* Static Preview Modal (No Tracking) */}
      {showPreview && previewConnectionCode && (
        <PublicProfilePreview
          connectionCode={previewConnectionCode}
          onClose={() => {
            setShowPreview(false);
            setPreviewConnectionCode('');
          }}
        />
      )}
    </>
  );
}