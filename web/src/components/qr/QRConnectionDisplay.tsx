import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, 
  Download, 
  Copy, 
  RefreshCw, 
  Users, 
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { generateUserQRCode, getQRScanStats } from '@dislink/shared/lib/qrConnectionEnhanced';
import { logger } from '@dislink/shared/lib/logger';
import type { User } from '@dislink/shared/types/user';

interface QRConnectionDisplayProps {
  user: User;
  onShare?: (url: string) => void;
  onDownload?: (dataUrl: string) => void;
}

interface QRStats {
  totalScans: number;
  recentScans: any[];
  lastScanDate?: Date;
}

export function QRConnectionDisplay({ user, onShare, onDownload }: QRConnectionDisplayProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QRStats>({ totalScans: 0, recentScans: [] });
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadQRData();
  }, [user.id]);

  const loadQRData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await generateUserQRCode(user.id);
      setQrData(data);

      // Load scan statistics
      const scanStats = await getQRScanStats(user.id);
      setStats(scanStats);

      logger.info('QR data loaded successfully:', { userId: user.id });
    } catch (err) {
      logger.error('Error loading QR data:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!qrData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Connect with ${user.name} on Dislink`,
          text: `Scan this QR code to connect with ${user.name} on Dislink!`,
          url: qrData.publicProfileUrl
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(qrData.publicProfileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }

      onShare?.(qrData.publicProfileUrl);
    } catch (err) {
      logger.error('Error sharing QR code:', err);
    }
  };

  const handleDownload = () => {
    if (!qrData) return;

    try {
      // Create a canvas to generate the QR code as an image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 512;
      canvas.height = 512;

      // Create QR code data URL
      const qrCodeDataUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" fill="white"/>
          <g transform="translate(64, 64)">
            ${document.querySelector('.qr-code svg')?.innerHTML || ''}
          </g>
        </svg>
      `)}`;

      // Create download link
      const link = document.createElement('a');
      link.download = `dislink-qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = qrCodeDataUrl;
      link.click();

      onDownload?.(qrCodeDataUrl);
    } catch (err) {
      logger.error('Error downloading QR code:', err);
    }
  };

  const handleCopy = async () => {
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData.publicProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Error copying URL:', err);
    }
  };

  const handleRefresh = () => {
    loadQRData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600">Generating QR code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!qrData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-100"
        >
          <div className="qr-code mb-4">
            <QRCodeSVG
              value={qrData.publicProfileUrl}
              size={256}
              level="M"
              includeMargin={true}
              imageSettings={{
                src: user.profileImage || '',
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {user.name}
            </h3>
            {user.jobTitle && (
              <p className="text-sm text-gray-600">
                {user.jobTitle}
                {user.company && ` at ${user.company}`}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Scan to connect on Dislink
            </p>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Stats Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 mx-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showStats ? 'Hide' : 'Show'} Scan Statistics
        </button>
      </div>

      {/* Scan Statistics */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-lg p-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalScans}
                </div>
                <div className="text-sm text-gray-600">Total Scans</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.recentScans.filter(scan => {
                    const scanDate = new Date(scan.scanned_at);
                    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return scanDate > oneWeekAgo;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.lastScanDate 
                    ? new Date(stats.lastScanDate).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <div className="text-sm text-gray-600">Last Scan</div>
              </div>
            </div>

            {stats.recentScans.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Scans</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {stats.recentScans.slice(0, 5).map((scan, index) => (
                    <div key={scan.scan_id} className="flex items-center justify-between text-xs text-gray-600">
                      <span>Scan #{stats.totalScans - index}</span>
                      <span>{new Date(scan.scanned_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection URL */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Connection URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={qrData.publicProfileUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this URL or the QR code above to let others connect with you
        </p>
      </div>
    </div>
  );
}
