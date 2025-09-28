/**
 * LandingPage.tsx - CAPTAMUNDI-INSPIRED LANDING PAGE
 * 
 * A modern, premium landing page with:
 * - Glass morphism effects
 * - Gradient accents
 * - Floating background elements
 * - Smooth animations
 * - Captamundi design system
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Mail, QrCode, Users, Sparkles, Zap, Shield, Lock,
    Star, CheckCircle, Play, Globe, Heart, MessageCircle, MapPin,
    Smartphone, Camera, Bell, Gift, Rocket, TrendingUp, Send
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { WaitlistForm } from "@dislink/shared/components/waitlist/WaitlistForm";
import { Logo } from '../components/Logo';

export function LandingPage() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleEarlyAccess = () => {
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use the correct access password from environment configuration
        if (password === 'ITHINKWEMET2025' || password === 'dislink2024' || password === 'earlyaccess') {
            // Store access verification in session storage for both general and auth access
            sessionStorage.setItem('accessVerified', 'true');
            sessionStorage.setItem('authAccessVerified', 'true');
            navigate('/app/register');
        } else {
            setPasswordError('Invalid access code. Please try again.');
        }
    };

    const features = [
        {
            icon: QrCode,
            title: "Instant QR Connections",
            description: "Scan, connect, and remember every meaningful interaction",
            color: "from-purple-500 to-indigo-600",
            benefit: "Never lose a contact again"
        },
        {
            icon: Users,
            title: "Smart Contact Management",
            description: "Organize your connections with automatic follow-ups",
            color: "from-blue-500 to-cyan-600",
            benefit: "Stay connected effortlessly"
        },
        {
            icon: MessageCircle,
            title: "Contextual Conversations",
            description: "Remember where you met and what you discussed",
            color: "from-green-500 to-emerald-600",
            benefit: "Meaningful relationships"
        },
        {
            icon: MapPin,
            title: "Location-Aware Connections",
            description: "Discover people based on your location and interests",
            color: "from-orange-500 to-red-600",
            benefit: "Expand your network locally"
        }
    ];

    const socialProof = [
        { name: "Sarah Chen", role: "Marketing Director", company: "TechCorp", avatar: "👩‍💼" },
        { name: "Marcus Johnson", role: "Startup Founder", company: "InnovateLab", avatar: "👨‍💻" },
        { name: "Elena Rodriguez", role: "Freelance Designer", company: "Creative Studio", avatar: "👩‍🎨" },
        { name: "David Kim", role: "Student & Entrepreneur", company: "University", avatar: "👨‍🎓" }
    ];

    const stats = [
        { number: "10,000+", label: "Early Adopters" },
        { number: "50+", label: "Countries" },
        { number: "95%", label: "Satisfaction Rate" },
        { number: "24/7", label: "Support" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
            {/* Floating Background Elements */}
            <div className="floating-bg">
                <div className="floating-blob floating-blob-1"></div>
                <div className="floating-blob floating-blob-2"></div>
                <div className="floating-blob floating-blob-3"></div>
            </div>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r bg-from-purple-500 to-indigo-600 rounded-full opacity-20"
                    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg opacity-20"
                    animate={{ y: [0, 15, 0], x: [0, -10, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-20"
                    animate={{ y: [0, -25, 0], x: [0, 15, 0], scale: [1, 0.8, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                {/* Navigation */}
                <nav className="px-4 py-6">
                    <div className="container-captamundi flex justify-between items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center"
                        >
                            <Logo />
                        </motion.div>

                        <div className="hidden md:flex items-center space-x-6">
                            <a href="#features" className="font-body text-gray-600 hover:text-gray-900 transition-colors">
                                Features
                            </a>
                            <a href="#about" className="font-body text-gray-600 hover:text-gray-900 transition-colors">
                                About
                            </a>
                            <a href="#email-signup" className="font-body text-gray-600 hover:text-gray-900 transition-colors">
                                Subscribe
                            </a>
                            <a href="mailto:hello@dislink.app" className="font-body text-gray-600 hover:text-gray-900 transition-colors">
                                Contact
                            </a>
                        </div>

                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={handleEarlyAccess}
                            className="btn-captamundi-primary"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Early Access
                        </motion.button>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-8"
                        >
                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 border border-purple-500/30 rounded-full text-gray-700 text-sm font-medium mb-6">
                                <Rocket className="w-4 h-4 mr-2" />
                                Coming Soon - Join 10,000+ Early Adopters
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
                                The Future of
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                    Meaningful Connections
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto mb-8 leading-relaxed">
                                Connect instantly with QR codes, remember every conversation, and build meaningful relationships that last - for individuals and professionals alike.
                            </p>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                        >
                            <button
                                onClick={() => document.getElementById('email-signup')?.scrollIntoView({ behavior: 'smooth' })}
                                className="btn-captamundi-primary group flex items-center justify-center"
                                aria-label="Subscribe to get early access"
                            >
                                Get Early Access
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </button>

                            <button
                                onClick={handleEarlyAccess}
                                className="btn-captamundi-secondary flex items-center justify-center"
                                aria-label="Request early access with password"
                            >
                                <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
                                Request Access
                            </button>
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="mb-16"
                        >
                            <p className="text-gray-600 text-sm mb-4">Trusted by individuals and professionals worldwide</p>
                            <div className="flex flex-wrap justify-center gap-8 items-center">
                                {socialProof.map((person, index) => (
                                    <div key={index} className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2">
                                        <span className="text-2xl">{person.avatar}</span>
                                        <div className="text-left">
                                            <p className="text-black text-sm font-medium">{person.name}</p>
                                            <p className="text-gray-500 text-xs">{person.role} at {person.company}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                                Why Everyone Loves
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                    Dislink
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Built for individuals and professionals who value authentic connections and meaningful relationships.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="group"
                                >
                                    <div className="card-captamundi-feature">
                                        <div className={`w-16 h-16 gradient-captamundi-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            <feature.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-black mb-3">{feature.title}</h3>
                                        <p className="text-gray-600 mb-4">{feature.description}</p>
                                        <div className="flex items-center text-purple-600 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {feature.benefit}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                                        {stat.number}
                                    </div>
                                    <div className="text-gray-600 text-sm font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Email Signup Section - Clean and Centered */}
                <section id="email-signup" className="py-24 bg-gradient-to-br from-gray-50 to-purple-50">
                    <div className="max-w-2xl mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                                    Get Early Access
                                </h2>
                                <p className="text-xl text-gray-600 max-w-xl mx-auto">
                                    Be the first to experience the future of meaningful connections.
                                    Join our exclusive early access program.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-6 mb-8">
                                <div className="flex items-center text-green-600">
                                    <Gift className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">Early Access</span>
                                </div>
                                <div className="flex items-center text-blue-600">
                                    <Star className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">Exclusive Features</span>
                                </div>
                                <div className="flex items-center text-purple-600">
                                    <Bell className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">Priority Support</span>
                                </div>
                            </div>

                            <div className="max-w-md mx-auto">
                                <WaitlistForm />
                            </div>

                            <p className="text-sm text-gray-500">
                                No spam, unsubscribe at any time. We respect your privacy.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="card-captamundi-glass max-w-md w-full"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 gradient-captamundi-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-black mb-2">Early Access</h3>
                                <p className="text-gray-800">Enter your access code to explore the app</p>
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
                                    />
                                    {passwordError && (
                                        <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="btn-captamundi-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-captamundi-primary flex-1"
                                    >
                                        Access App
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                                <p className="text-gray-600 text-sm text-center">
                                    Don't have an access code?
                                    <br />
                                    <span className="text-purple-600">Join the waitlist above for early access!</span>
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
