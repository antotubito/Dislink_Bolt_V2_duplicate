import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, X, Clock, AlertTriangle } from 'lucide-react';

interface AccessGuardProps {
    children: React.ReactNode;
}

// Access control configuration
const ACCESS_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

// Valid access codes (in production, these should be hashed or stored securely)
const VALID_ACCESS_CODES = ['ITHINKWEMET2025', 'dislink2024', 'earlyaccess'];

export function AccessGuard({ children }: AccessGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

    // Check access verification with expiration
    const checkAccessVerification = () => {
        const accessVerified = sessionStorage.getItem('accessVerified');
        const authAccessVerified = sessionStorage.getItem('authAccessVerified');
        const accessTimestamp = sessionStorage.getItem('accessTimestamp');
        const emailConfirmed = sessionStorage.getItem('emailConfirmed');
        const emailConfirmedTimestamp = sessionStorage.getItem('emailConfirmedTimestamp');
        
        // Check if user just confirmed their email (within last 10 minutes)
        if (emailConfirmed === 'true' && emailConfirmedTimestamp) {
            const timestamp = parseInt(emailConfirmedTimestamp);
            const now = Date.now();
            const EMAIL_CONFIRMATION_GRACE_PERIOD = 10 * 60 * 1000; // 10 minutes
            if (now - timestamp < EMAIL_CONFIRMATION_GRACE_PERIOD) {
                return true; // Grant access for recently confirmed users
            } else {
                // Clear expired email confirmation
                sessionStorage.removeItem('emailConfirmed');
                sessionStorage.removeItem('emailConfirmedTimestamp');
            }
        }
        
        if (accessVerified === 'true' || authAccessVerified === 'true') {
            // Check if access has expired
            if (accessTimestamp) {
                const timestamp = parseInt(accessTimestamp);
                const now = Date.now();
                if (now - timestamp < ACCESS_EXPIRY_TIME) {
                    return true; // Access is still valid
                } else {
                    // Access has expired, clear it
                    sessionStorage.removeItem('accessVerified');
                    sessionStorage.removeItem('authAccessVerified');
                    sessionStorage.removeItem('accessTimestamp');
                }
            }
        }
        return false;
    };

    // Check rate limiting
    const checkRateLimit = () => {
        const attemptsData = sessionStorage.getItem('accessAttempts');
        const lockoutData = sessionStorage.getItem('accessLockout');
        
        if (lockoutData) {
            const lockoutTime = parseInt(lockoutData);
            const now = Date.now();
            if (now - lockoutTime < LOCKOUT_TIME) {
                setIsLockedOut(true);
                setLockoutTimeLeft(Math.ceil((LOCKOUT_TIME - (now - lockoutTime)) / 1000));
                return false;
            } else {
                // Lockout has expired, clear it
                sessionStorage.removeItem('accessLockout');
                sessionStorage.removeItem('accessAttempts');
            }
        }
        
        if (attemptsData) {
            const attempts = JSON.parse(attemptsData);
            const now = Date.now();
            // Filter attempts within the window
            const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < ATTEMPT_WINDOW);
            
            if (recentAttempts.length >= MAX_ATTEMPTS) {
                // Too many attempts, lock out
                sessionStorage.setItem('accessLockout', now.toString());
                setIsLockedOut(true);
                setLockoutTimeLeft(Math.ceil(LOCKOUT_TIME / 1000));
                return false;
            }
            
            setAttempts(recentAttempts.length);
        }
        
        return true;
    };

    useEffect(() => {
        // Check if user has valid early access verification
        if (checkAccessVerification()) {
            setIsChecking(false);
        } else {
            // Check rate limiting
            if (checkRateLimit()) {
                setIsChecking(false);
                setShowPasswordModal(true);
            } else {
                setIsChecking(false);
                setShowPasswordModal(true);
            }
        }
    }, []);

    // Update lockout timer
    useEffect(() => {
        if (isLockedOut && lockoutTimeLeft > 0) {
            const timer = setTimeout(() => {
                setLockoutTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsLockedOut(false);
                        sessionStorage.removeItem('accessLockout');
                        sessionStorage.removeItem('accessAttempts');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLockedOut, lockoutTimeLeft]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isLockedOut) {
            setPasswordError(`Too many attempts. Please wait ${lockoutTimeLeft} seconds before trying again.`);
            return;
        }

        // Record attempt
        const attemptsData = sessionStorage.getItem('accessAttempts');
        const attempts = attemptsData ? JSON.parse(attemptsData) : [];
        attempts.push(Date.now());
        sessionStorage.setItem('accessAttempts', JSON.stringify(attempts));

        // Validate access password
        if (VALID_ACCESS_CODES.includes(password)) {
            // Store access verification with timestamp
            const now = Date.now();
            sessionStorage.setItem('accessVerified', 'true');
            sessionStorage.setItem('authAccessVerified', 'true');
            sessionStorage.setItem('accessTimestamp', now.toString());
            
            // Clear attempts on successful login
            sessionStorage.removeItem('accessAttempts');
            
            setShowPasswordModal(false);
            setPasswordError('');
            setAttempts(0);
        } else {
            const newAttempts = attempts.length;
            setAttempts(newAttempts);
            
            if (newAttempts >= MAX_ATTEMPTS) {
                // Lock out user
                sessionStorage.setItem('accessLockout', Date.now().toString());
                setIsLockedOut(true);
                setLockoutTimeLeft(Math.ceil(LOCKOUT_TIME / 1000));
                setPasswordError(`Too many attempts. Please wait ${Math.ceil(LOCKOUT_TIME / 1000)} seconds before trying again.`);
            } else {
                setPasswordError(`Invalid access code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
            }
        }
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    const handleJoinWaitlist = () => {
        navigate('/');
        // Scroll to waitlist section after navigation
        setTimeout(() => {
            const waitlistSection = document.querySelector('[data-waitlist-section]');
            if (waitlistSection) {
                waitlistSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
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
                        className="card-captamundi-strong w-full max-w-md relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleBackToHome}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

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
                                    disabled={isLockedOut}
                                />
                                {passwordError && (
                                    <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200">
                                        <div className="flex items-center">
                                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                                            <p className="font-caption text-red-700">
                                                {passwordError}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {attempts > 0 && !isLockedOut && (
                                    <div className="mt-2 p-2 rounded-md bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                                            <p className="font-caption text-yellow-700">
                                                {attempts} of {MAX_ATTEMPTS} attempts used
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {isLockedOut && (
                                    <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200">
                                        <div className="flex items-center">
                                            <Lock className="w-4 h-4 text-red-500 mr-2" />
                                            <p className="font-caption text-red-700">
                                                Account locked for {lockoutTimeLeft} seconds
                                            </p>
                                        </div>
                                    </div>
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
                                    disabled={isLockedOut}
                                >
                                    {isLockedOut ? (
                                        <>
                                            <Clock className="w-4 h-4 mr-2" />
                                            Locked ({lockoutTimeLeft}s)
                                        </>
                                    ) : (
                                        'Continue'
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="font-caption text-gray-500 text-center">
                                Don't have an access code?{' '}
                                <button
                                    onClick={handleJoinWaitlist}
                                    className="text-captamundi-primary hover:text-captamundi-primary-dark transition-colors underline"
                                >
                                    Join the waitlist for early access!
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
