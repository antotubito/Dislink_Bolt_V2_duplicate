import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, X, Camera, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaceVerificationProps {
  onVerified: (photoData: string) => void;
  onError: (error: string) => void;
  isVerified?: boolean;
}

export function FaceVerification({ onVerified, onError, isVerified = false }: FaceVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Face detection using MediaPipe or similar
  const detectFace = async (imageData: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Simple face detection using basic image analysis
        // In a real implementation, you would use a proper face detection API
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Basic skin tone detection (simplified face detection)
        let skinPixels = 0;
        let totalPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Basic skin tone detection
          if (r > 95 && g > 40 && b > 20 && 
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15 && r > g && r > b) {
            skinPixels++;
          }
          totalPixels++;
        }
        
        const skinRatio = skinPixels / totalPixels;
        const hasFace = skinRatio > 0.1; // At least 10% skin pixels
        
        resolve(hasFace);
      };
      img.src = imageData;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    onError('');
    setFaceDetected(false);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      // Create an image element for validation
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
          img.onload = async () => {
            try {
              setIsProcessing(true);
              
              // Detect face in the image
              const faceFound = await detectFace(reader.result);
              
              if (!faceFound) {
                throw new Error('No face detected. Please upload a clear photo with your face visible.');
              }
              
              // Set preview image
              setPreviewImage(reader.result);
              setFaceDetected(true);
              
              // Notify parent component
              onVerified(reader.result);
              setError(null);
              onError('');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process image');
              onError(err instanceof Error ? err.message : 'Failed to process image');
              setPreviewImage(null);
              setFaceDetected(false);
            } finally {
              setLoading(false);
              setIsProcessing(false);
            }
          };
          img.onerror = () => {
            setError('Failed to load image');
            onError('Failed to load image');
            setLoading(false);
            setPreviewImage(null);
            setFaceDetected(false);
          };
        }
      };
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the image');
      onError(err instanceof Error ? err.message : 'An error occurred while processing the image');
      setLoading(false);
      setPreviewImage(null);
      setFaceDetected(false);
    }
    
    // Clear input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setFaceDetected(false);
    onVerified('');
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-gray-900">Profile Photo Required</span>
        </div>
        <p className="text-sm text-gray-600">
          Please upload a clear photo of your face. This photo will be visible to your connections.
        </p>
      </div>

      <div className="relative">
        <AnimatePresence>
          {previewImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="h-48 w-48 rounded-xl object-cover mx-auto"
                />
                {faceDetected && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Face Detected</span>
                  </div>
                )}
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                  title="Remove photo"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1 h-48 w-48 mx-auto rounded-xl bg-gray-100 flex flex-col items-center justify-center hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            >
              {loading || isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                  <span className="text-sm text-gray-500">
                    {isProcessing ? 'Detecting face...' : 'Processing...'}
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm text-gray-500">Upload Photo</span>
                  <span className="text-xs text-gray-600 mt-1">Face required</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Photo Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Clear photo of your face</li>
          <li>• Good lighting</li>
          <li>• Face must be clearly visible</li>
          <li>• Can be taken with phone camera or uploaded</li>
        </ul>
      </div>
    </div>
  );
}