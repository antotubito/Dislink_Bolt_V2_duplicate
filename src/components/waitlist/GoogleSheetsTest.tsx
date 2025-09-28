import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, CheckCircle, XCircle, Loader } from 'lucide-react';
import { googleSheetsService } from '../../lib/googleSheetsService';

interface GoogleSheetsTestProps {
    onClose: () => void;
}

export function GoogleSheetsTest({ onClose }: GoogleSheetsTestProps) {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState('');

    const testConnection = async () => {
        setTesting(true);
        setResult(null);
        setMessage('');

        try {
            const success = await googleSheetsService.testConnection();

            if (success) {
                setResult('success');
                setMessage('Google Sheets integration is working correctly!');
            } else {
                setResult('error');
                setMessage('Google Sheets integration failed. Check your configuration.');
            }
        } catch (error) {
            setResult('error');
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setTesting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <TestTube className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Google Sheets Test</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        This will test your Google Sheets integration by sending a test email entry.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={testConnection}
                            disabled={testing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {testing ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <TestTube className="h-4 w-4" />
                                    Test Connection
                                </>
                            )}
                        </button>

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg flex items-center gap-2 ${result === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                            >
                                {result === 'success' ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <span className="text-sm">{message}</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
