import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';

interface AccessGuardProps {
    children: React.ReactNode;
}

export function AccessGuard({ children }: AccessGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        // Check if user has early access verification
        const accessVerified = sessionStorage.getItem('accessVerified');
        const authAccessVerified = sessionStorage.getItem('authAccessVerified');

        if (accessVerified === 'true' || authAccessVerified === 'true') {
            // User has access, allow them to proceed
            setIsChecking(false);
        } else {
            // User doesn't have access, show password modal
            setIsChecking(false);
            setShowPasswordModal(true);
        }
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate access password
        if (password === 'ITHINKWEMET2025' || password === 'dislink2024' || password === 'earlyaccess') {
            // Store access verification for both general access and auth pages
            sessionStorage.setItem('accessVerified', 'true');
            sessionStorage.setItem('authAccessVerified', 'true');
            setShowPasswordModal(false);
            setPasswordError('');
        } else {
            setPasswordError('Invalid access code. Please try again.');
        }
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    // Show loading state while checking
    if (isChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-captamundi-primary"></div>
            </div>
        );
    }

    // Show password modal if access not verified
    if (showPasswordModal) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
                {/* Floating Background Elements */}
                <div className="floating-bg">
                    <div className="floating-blob floating-blob-1"></div>
                    <div className="floating-blob floating-blob-2"></div>
                    <div className="floating-blob floating-blob-3"></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="card-captamundi-strong w-full max-w-md"
                    >
                        <div className="text-center mb-6">
                            <Lock className="w-16 h-16 text-captamundi-primary mx-auto mb-4" />
                            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                                Early Access Required
                            </h1>
                            <p className="font-body text-gray-600">
                                This page requires early access verification. Please enter your access code to continue.
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter access code"
                                    className="input-captamundi"
                                    required
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className="font-caption text-red-500 mt-2">
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBackToHome}
                                    className="btn-captamundi-secondary flex-1 flex items-center justify-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Home
                                </button>
                                <button
                                    type="submit"
                                    className="btn-captamundi-primary flex-1"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="font-caption text-gray-500 text-center">
                                Don't have an access code?{' '}
                                <button
                                    onClick={handleBackToHome}
                                    className="text-captamundi-primary hover:text-captamundi-primary-dark transition-colors"
                                >
                                    Visit our homepage
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // User has access, render the protected content
    return <>{children}</>;
}
