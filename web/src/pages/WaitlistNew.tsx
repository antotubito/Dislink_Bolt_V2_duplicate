/**
 * WaitlistNew.tsx - VIBRANT MODERN LANDING PAGE
 * 
 * A playful, colorful, and dynamic landing page designed for young professionals
 * Style: Duolingo's friendliness + LinkedIn's professionalism
 * Colors: Neon gradients (pink, purple, aqua, lime)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Mail, QrCode, Users, Sparkles, Zap,
    Heart, Star, MessageCircle, MapPin, Smartphone,
    CheckCircle, Play, Globe, Lock, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '../components/Footer';
import { LazyWaitlistForm, LazyLoadingFallback } from '../components/lazy';
import { Suspense } from 'react';
import { Logo } from '../components/Logo';

export function WaitlistNew() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);
    const [showWaitlist, setShowWaitlist] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleJoinWaitlist = () => {
        setShowWaitlist(true);
        // Scroll to waitlist section
        setTimeout(() => {
            const waitlistSection = document.getElementById('waitlist-section');
            if (waitlistSection) {
                waitlistSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const features = [
        {
            icon: QrCode,
            title: "Instant QR Connections",
            description: "Scan, connect, remember - all in one tap",
            color: "from-purple-500 to-indigo-600"
        },
        {
            icon: Users,
            title: "Smart Contact Management",
            description: "Never lose a connection again",
            color: "from-aqua-500 to-blue-600"
        },
        {
            icon: MessageCircle,
            title: "Follow-up Reminders",
            description: "Stay connected with automated follow-ups",
            color: "from-lime-500 to-green-600"
        },
        {
            icon: MapPin,
            title: "Location-Based Networking",
            description: "Find connections wherever you go",
            color: "from-purple-500 to-pink-600"
        }
    ];

    const testimonials = [
        {
            name: "Sarah Chen",
            role: "Product Manager",
            company: "TechCorp",
            text: "Dislink transformed how I network at events. I've made 3x more meaningful connections!",
            avatar: "👩‍💼"
        },
        {
            name: "Marcus Johnson",
            role: "Startup Founder",
            company: "InnovateLab",
            text: "The QR code feature is genius. No more fumbling with business cards!",
            avatar: "👨‍💻"
        },
        {
            name: "Elena Rodriguez",
            role: "Marketing Director",
            company: "Creative Agency",
            text: "Finally, a networking app that actually helps you stay connected long-term.",
            avatar: "👩‍🎨"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Floating Geometric Shapes */}
                <motion.div
                    className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full opacity-20"
                    animate={{
                        y: [0, -20, 0],
                        x: [0, 10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-aqua-500 to-blue-600 rounded-lg opacity-20"
                    animate={{
                        y: [0, 15, 0],
                        x: [0, -10, 0],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-lime-500 to-green-600 rounded-full opacity-20"
                    animate={{
                        y: [0, -25, 0],
                        x: [0, 15, 0],
                        scale: [1, 0.8, 1]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-20 right-10 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg opacity-20"
                    animate={{
                        y: [0, 20, 0],
                        x: [0, -15, 0],
                        rotate: [0, -180, -360]
                    }}
                    transition={{
                        duration: 7,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                {/* Navigation */}
                <nav className="flex justify-between items-center p-6 lg:px-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Logo
                            size="lg"
                            linkTo="/"
                            textClassName="text-2xl font-bold"
                            iconClassName="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex items-center space-x-4"
                    >
                        <button
                            onClick={() => navigate('/app/login')}
                            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/app/register')}
                            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                        >
                            Get Started
                        </button>
                    </motion.div>
                </nav>

                {/* Hero Section */}
                <div className="px-6 lg:px-12 pt-12 pb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Left Column - Text Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600/20 border border-purple-500/30 rounded-full text-gray-600 text-sm font-medium"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        The Future of Networking is Here
                                    </motion.div>

                                    <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                                        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                            Connect
                                        </span>
                                        <br />
                                        <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                            Instantly
                                        </span>
                                    </h1>

                                    <p className="text-xl text-high-contrast leading-relaxed max-w-lg">
                                        The human connection companion for people who value
                                        <span className="text-purple-600 font-semibold"> authentic relationships</span>
                                        and want to remember the stories behind every meaningful interaction.
                                    </p>
                                </div>

                                {/* CTA Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <button
                                        onClick={() => navigate('/app/register')}
                                        className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                                        aria-label="Start networking for free - Create your account"
                                    >
                                        Start Networking Free
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                    </button>

                                    <button
                                        className="px-8 py-4 border-2 border-white/20 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                                        aria-label="Watch demo video to see how Dislink works"
                                    >
                                        <Play className="w-5 h-5 mr-2" aria-hidden="true" />
                                        Watch Demo
                                    </button>
                                </motion.div>

                                {/* Social Proof */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    className="flex items-center space-x-6 pt-4"
                                >
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 border-2 border-slate-900 flex items-center justify-center text-white text-sm font-semibold"
                                            >
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-medium-contrast">
                                        <div className="flex items-center space-x-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-sm text-medium-contrast">Loved by 10,000+ individuals and professionals</p>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Right Column - Hero Illustration */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="relative"
                            >
                                {/* Main Illustration Container */}
                                <div className="relative w-full h-96 lg:h-[500px]">
                                    {/* Background Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600/20 rounded-3xl blur-3xl" />

                                    {/* Main Illustration */}
                                    <div className="relative w-full h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                                        {/* Floating Connection Elements */}
                                        <motion.div
                                            className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center"
                                            animate={{
                                                y: [0, -10, 0],
                                                rotate: [0, 5, 0]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <QrCode className="w-8 h-8 text-white" />
                                        </motion.div>

                                        <motion.div
                                            className="absolute top-16 right-12 w-12 h-12 bg-gradient-to-r from-aqua-500 to-blue-600 rounded-full flex items-center justify-center"
                                            animate={{
                                                y: [0, 15, 0],
                                                x: [0, -5, 0]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Users className="w-6 h-6 text-white" />
                                        </motion.div>

                                        <motion.div
                                            className="absolute bottom-20 left-12 w-14 h-14 bg-gradient-to-r from-lime-500 to-green-600 rounded-xl flex items-center justify-center"
                                            animate={{
                                                y: [0, -8, 0],
                                                rotate: [0, -10, 0]
                                            }}
                                            transition={{
                                                duration: 5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <MessageCircle className="w-7 h-7 text-white" />
                                        </motion.div>

                                        <motion.div
                                            className="absolute bottom-8 right-8 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center"
                                            animate={{
                                                y: [0, 12, 0],
                                                x: [0, 8, 0]
                                            }}
                                            transition={{
                                                duration: 6,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Heart className="w-5 h-5 text-white" />
                                        </motion.div>

                                        {/* Central Connection Hub */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                            <motion.div
                                                className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    rotate: [0, 360]
                                                }}
                                                transition={{
                                                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                                                }}
                                            >
                                                <Sparkles className="w-12 h-12 text-white" />
                                            </motion.div>
                                        </div>

                                        {/* Connection Lines */}
                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                                            <motion.path
                                                d="M80 80 Q200 200 320 120"
                                                stroke="url(#gradient1)"
                                                strokeWidth="2"
                                                fill="none"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 2, delay: 1 }}
                                            />
                                            <motion.path
                                                d="M100 300 Q200 200 300 280"
                                                stroke="url(#gradient2)"
                                                strokeWidth="2"
                                                fill="none"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 2, delay: 1.5 }}
                                            />
                                            <defs>
                                                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#ec4899" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#10b981" />
                                                    <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="px-6 lg:px-12 py-20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Why Choose
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                    Dislink?
                                </span>
                            </h2>
                            <p className="text-xl text-high-contrast max-w-2xl mx-auto">
                                Built for the next generation of professionals who value authentic connections
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
                                    className="group relative"
                                >
                                    <div className="relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                                        <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            <feature.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                        <p className="text-medium-contrast">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Our Story Section */}
                <div className="px-6 lg:px-12 py-20">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Our Story
                                </span>
                            </h2>
                            <p className="text-xl text-high-contrast max-w-3xl mx-auto">
                                Born from a simple observation about meaningful connections in our digital world
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="glass-card p-8 lg:p-12"
                        >
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-lg text-high-contrast leading-relaxed">
                                            Dislink was born from a simple observation: in our increasingly connected world,
                                            meaningful relationships often get lost in the digital noise. We saw individuals
                                            and professionals struggling to maintain the connections they made at conferences,
                                            meetups, social events, and through mutual friends.
                                        </p>

                                        <p className="text-lg text-high-contrast leading-relaxed">
                                            We believed there had to be a better way to nurture these relationships. That's why
                                            we created Dislink - not just as another networking app, but as a platform that
                                            understands the human side of connections for everyone.
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-4 pt-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">☕</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-medium-contrast">Our journey began in a small coffee shop in Lisbon</p>
                                            <p className="text-high-contrast font-medium">Where napkins became blueprints</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-lg text-high-contrast leading-relaxed">
                                            Dislink isn't about collecting contacts; it's about enriching relationships. It's
                                            about remembering that person you met at a conference who shared your passion for
                                            sustainable technology, or that fellow expat you connected with at a local meetup.
                                        </p>

                                        <p className="text-lg text-high-contrast leading-relaxed">
                                            Our vision is to transform how people think about relationship building - from a transactional
                                            activity to a meaningful practice that enriches both personal and professional lives.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">1000+</div>
                                            <div className="text-sm text-medium-contrast">Connections Made</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">50+</div>
                                            <div className="text-sm text-medium-contrast">Countries</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="px-6 lg:px-12 py-20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Loved by
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-aqua-500 to-blue-600 bg-clip-text text-transparent">
                                    Individuals & Professionals
                                </span>
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="relative p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10"
                                >
                                    <div className="text-4xl mb-4">{testimonial.avatar}</div>
                                    <p className="text-high-contrast mb-6 italic">"{testimonial.text}"</p>
                                    <div>
                                        <div className="font-semibold text-white">{testimonial.name}</div>
                                        <div className="text-sm text-medium-contrast">{testimonial.role} at {testimonial.company}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="px-6 lg:px-12 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative p-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10"
                        >
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                    Ready to Transform
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Your Networking?
                                </span>
                            </h2>
                            <p className="text-xl text-high-contrast mb-8 max-w-2xl mx-auto">
                                Join thousands of individuals and professionals who are already making meaningful connections with Dislink.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/app/register')}
                                    className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center"
                                >
                                    Start Your Journey
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>

                                <button
                                    onClick={handleJoinWaitlist}
                                    className="px-8 py-4 border-2 border-white/20 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                                >
                                    <Mail className="w-5 h-5 mr-2" />
                                    Join Waitlist
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Waitlist Section */}
                <div id="waitlist-section" className="px-6 lg:px-12 py-20">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Be the First to
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
                                    Experience Dislink
                                </span>
                            </h2>
                            <p className="text-xl text-high-contrast max-w-2xl mx-auto">
                                Join our exclusive waitlist and get early access to the future of meaningful networking.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="relative p-8 glass-card">
                                {/* Background glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600/10 rounded-3xl blur-xl" />

                                <div className="relative z-10">
                                    <Suspense fallback={<LazyLoadingFallback />}>
                                        <LazyWaitlistForm
                                            onSuccess={() => {
                                                // Optional: Show success message or redirect
                                                console.log('Waitlist signup successful!');
                                            }}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </motion.div>

                        {/* Additional benefits */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="mt-12 grid md:grid-cols-3 gap-8"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Early Access</h3>
                                <p className="text-high-contrast text-sm">Get exclusive early access before public launch</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-aqua-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Exclusive Community</h3>
                                <p className="text-high-contrast text-sm">Join a community of forward-thinking individuals and professionals</p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-lime-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Special Perks</h3>
                                <p className="text-high-contrast text-sm">Enjoy special features and premium benefits</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <Footer />

                {/* Floating Waitlist Button */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: showWaitlist ? 0 : 1, y: showWaitlist ? 100 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <button
                        onClick={handleJoinWaitlist}
                        className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-semibold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center space-x-2 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                        aria-label="Join the waitlist to get early access to Dislink"
                    >
                        <Mail className="w-5 h-5" aria-hidden="true" />
                        <span>Join Waitlist</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
