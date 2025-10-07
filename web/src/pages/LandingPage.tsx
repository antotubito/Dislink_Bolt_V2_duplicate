/**
 * LandingPage.tsx - DISLINK COSMIC LANDING PAGE
 * 
 * A fun, engaging landing page with:
 * - Cosmic theme colors (Nebula Glow)
 * - Playful and energetic copywriting
 * - Smooth Framer Motion animations
 * - Mobile-first responsive design
 * - Enhanced waitlist emphasis
 * - Preserved backend integrations
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, QrCode, Sparkles, MapPin, MessageCircle, Target, Smartphone as Phone, PartyPopper
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { WaitlistForm } from "@dislink/shared/components/waitlist/WaitlistForm";
import { Logo } from '../components/Logo';

export function LandingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        
        // Check for email confirmation parameters
        const code = searchParams.get('code');
        const type = searchParams.get('type');
        const tokenHash = searchParams.get('token_hash');
        
        if (code || tokenHash) {
            // Redirect to confirmed page with all relevant parameters
            console.log('🔍 Email confirmation parameters detected, redirecting to /confirmed');
            const params = new URLSearchParams();
            if (code) params.set('code', code);
            if (type) params.set('type', type);
            if (tokenHash) params.set('token_hash', tokenHash);
            
            // Copy any other relevant parameters
            const email = searchParams.get('email');
            if (email) params.set('email', email);
            
            // Store parameters in sessionStorage as backup
            sessionStorage.setItem('emailConfirmationParams', params.toString());
            
            navigate(`/confirmed?${params.toString()}`, { replace: true });
        }
    }, [searchParams, navigate]);

    const handleEarlyAccess = () => {
        // Redirect directly to the early access page (registration with AccessGuard)
        // The AccessGuard will handle the password verification
        navigate('/app/register');
    };

    const handleJoinWaitlist = () => {
        // Scroll to waitlist section
        setTimeout(() => {
            const waitlistSection = document.querySelector('[data-waitlist-section]');
            if (waitlistSection) {
                waitlistSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    const features = [
        {
            icon: QrCode,
            title: "✨ Magical QR Profiles",
            description: "Create stunning digital profiles that sparkle! Share them instantly with a simple scan.",
            color: "from-[#A259FF] to-[#FF6F61]",
            benefit: "Instant cosmic connections!",
            emoji: "🌟"
        },
        {
            icon: Target,
            title: "🎯 Smart Follow-ups",
            description: "Never forget a connection again! Get magical reminders and track your networking journey.",
            color: "from-[#FFD37E] to-[#FF6F61]",
            benefit: "Build lasting relationships!",
            emoji: "💫"
        },
        {
            icon: MapPin,
            title: "🗺️ Connection Galaxy",
            description: "See where and when you met people in your personal networking universe!",
            color: "from-[#A259FF] to-[#FFD37E]",
            benefit: "Remember every stellar moment!",
            emoji: "🌌"
        },
        {
            icon: MessageCircle,
            title: "💬 Daily Needs Community",
            description: "Share what you need and help others! Build a supportive community where everyone can ask for help.",
            color: "from-[#FF6F61] to-[#A259FF]",
            benefit: "Get help when you need it!",
            emoji: "🤝"
        }
    ];

    const socialProof = [
        { name: "Sarah Chen", role: "Marketing Director", company: "TechCorp", avatar: "👩‍💼", quote: "Dislink transformed my networking game!" },
        { name: "Marcus Johnson", role: "Startup Founder", company: "InnovateLab", avatar: "👨‍💻", quote: "Finally, a way to remember everyone!" },
        { name: "Elena Rodriguez", role: "Freelance Designer", company: "Creative Studio", avatar: "👩‍🎨", quote: "My connections have never been stronger!" },
        { name: "David Kim", role: "Student & Entrepreneur", company: "University", avatar: "👨‍🎓", quote: "This is the future of networking!" }
    ];

    const stats = [
        { number: "10,000+", label: "Cosmic Connectors", emoji: "🚀" },
        { number: "50+", label: "Countries", emoji: "🌍" },
        { number: "95%", label: "Satisfaction Rate", emoji: "⭐" },
        { number: "24/7", label: "Support", emoji: "💫" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B1E3D] via-[#1a2a4a] to-[#2d1b69] relative overflow-hidden">
            {/* Cosmic Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-[#A259FF] to-[#FFD37E] rounded-full opacity-20"
                    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-[#FF6F61] to-[#A259FF] rounded-lg opacity-20"
                    animate={{ y: [0, 15, 0], x: [0, -10, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-[#FFD37E] to-[#FF6F61] rounded-full opacity-20"
                    animate={{ y: [0, -25, 0], x: [0, 15, 0], scale: [1, 0.8, 1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-60 right-1/3 w-8 h-8 bg-gradient-to-r from-[#A259FF] to-[#FFD37E] rounded-full opacity-20"
                    animate={{ y: [0, 20, 0], x: [0, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Star field */}
                <div className="absolute inset-0 opacity-40">
                    <div className="w-full h-full" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23A259FF' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat'
                    }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                {/* Navigation */}
                <nav className="px-4 py-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Logo />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="flex items-center space-x-4"
                        >
                            <button
                                onClick={handleJoinWaitlist}
                                className="px-6 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF6F61] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#A259FF]/25 transition-all duration-300"
                            >
                                Join Waitlist
                            </button>
                            <button
                                onClick={handleEarlyAccess}
                                className="px-6 py-2 border border-[#FFD37E] text-[#FFD37E] font-semibold rounded-full hover:bg-[#FFD37E]/10 transition-all duration-300"
                            >
                                Early Access
                            </button>
                        </motion.div>
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
                            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#A259FF]/20 to-[#FFD37E]/20 border border-[#A259FF]/40 rounded-full text-white text-sm font-medium mb-8 backdrop-blur-sm">
                                <Sparkles className="w-5 h-5 mr-2 text-[#FFD37E]" />
                                🚀 Coming Soon - Join 10,000+ Cosmic Connectors!
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                                Connect Like
                                <br />
                                <span className="bg-gradient-to-r from-[#A259FF] via-[#FFD37E] to-[#FF6F61] bg-clip-text text-transparent">
                                    Never Before! ✨
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
                                🌟 <strong>Dislink</strong> is your cosmic networking companion! Create magical QR profiles, never forget a connection, and build relationships that sparkle across the universe. 
                                <br /><br />
                                <span className="text-[#FFD37E] font-semibold">Ready to join the constellation of amazing people?</span>
                            </p>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
                        >
                            <button
                                onClick={handleJoinWaitlist}
                                className="px-10 py-5 bg-gradient-to-r from-[#A259FF] to-[#FF6F61] text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-[#A259FF]/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#A259FF]/50 group flex items-center justify-center transform hover:scale-105"
                                aria-label="Join the cosmic waitlist"
                            >
                                🌟 Join the Cosmic Waitlist
                                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                            </button>

                            <button
                                onClick={handleEarlyAccess}
                                className="px-10 py-5 border-2 border-[#FFD37E] text-[#FFD37E] font-bold text-lg rounded-2xl hover:bg-[#FFD37E]/10 hover:border-[#FFD37E] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#FFD37E]/50 flex items-center justify-center backdrop-blur-sm"
                                aria-label="Get early access to the cosmic app"
                            >
                                <Phone className="w-6 h-6 mr-3" aria-hidden="true" />
                                🚀 Early Access
                            </button>
                        </motion.div>

                        {/* Fun stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                        >
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl mb-2">{stat.emoji}</div>
                                    <div className="text-3xl font-bold text-[#FFD37E] mb-2">{stat.number}</div>
                                    <div className="text-gray-300">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-6 py-20 bg-gradient-to-b from-transparent to-[#0B1E3D]/50">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                🌟 Why Dislink is 
                                <span className="bg-gradient-to-r from-[#A259FF] to-[#FFD37E] bg-clip-text text-transparent"> Magical</span>
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Transform your networking from ordinary to extraordinary! Here's how we make connections sparkle:
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-gradient-to-br from-[#1a2a4a]/50 to-[#2d1b69]/50 backdrop-blur-sm border border-[#A259FF]/20 rounded-2xl p-6 hover:border-[#A259FF]/40 transition-all duration-300 hover:transform hover:scale-105"
                                >
                                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-300 mb-4">{feature.description}</p>
                                    <div className="text-[#FFD37E] font-semibold text-sm">
                                        {feature.emoji} {feature.benefit}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Social Proof Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                💫 What Our 
                                <span className="bg-gradient-to-r from-[#FFD37E] to-[#FF6F61] bg-clip-text text-transparent"> Cosmic Connectors</span> Say
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Join thousands of people who've discovered the magic of meaningful connections!
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {socialProof.map((person, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-gradient-to-br from-[#1a2a4a]/50 to-[#2d1b69]/50 backdrop-blur-sm border border-[#FFD37E]/20 rounded-2xl p-6 hover:border-[#FFD37E]/40 transition-all duration-300"
                                >
                                    <div className="text-4xl mb-4">{person.avatar}</div>
                                    <blockquote className="text-gray-200 mb-4 italic">"{person.quote}"</blockquote>
                                    <div className="border-t border-[#A259FF]/20 pt-4">
                                        <div className="font-semibold text-white">{person.name}</div>
                                        <div className="text-sm text-[#FFD37E]">{person.role}</div>
                                        <div className="text-sm text-gray-400">{person.company}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Enhanced Waitlist Section */}
                <section 
                    data-waitlist-section
                    className="px-6 py-20 bg-gradient-to-br from-[#A259FF]/10 via-[#FFD37E]/10 to-[#FF6F61]/10 relative overflow-hidden"
                >
                    {/* Animated background elements */}
                    <div className="absolute inset-0">
                        <motion.div
                            className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-[#A259FF] to-[#FFD37E] rounded-full opacity-20"
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 180, 360],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute bottom-10 right-10 w-16 h-16 bg-gradient-to-r from-[#FF6F61] to-[#A259FF] rounded-full opacity-20"
                            animate={{ 
                                scale: [1.2, 1, 1.2],
                                rotate: [360, 180, 0],
                                opacity: [0.4, 0.2, 0.4]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FFD37E]/20 to-[#FF6F61]/20 border border-[#FFD37E]/40 rounded-full text-white text-sm font-medium mb-8 backdrop-blur-sm">
                                <PartyPopper className="w-5 h-5 mr-2 text-[#FFD37E]" />
                                🎉 Limited Early Access - Be Among the First!
                            </div>

                            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                                🌟 Ready to Join the 
                                <span className="bg-gradient-to-r from-[#FFD37E] via-[#A259FF] to-[#FF6F61] bg-clip-text text-transparent"> Cosmic Revolution?</span>
                            </h2>

                            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
                                🚀 <strong>Don't miss out!</strong> Join our exclusive waitlist and be the first to experience the future of networking. 
                                <br /><br />
                                <span className="text-[#FFD37E] font-semibold">Get early access, exclusive perks, and become part of our stellar community!</span>
                            </p>

                            {/* Waitlist Benefits */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                <div className="bg-gradient-to-br from-[#1a2a4a]/50 to-[#2d1b69]/50 backdrop-blur-sm border border-[#A259FF]/20 rounded-xl p-6">
                                    <div className="text-3xl mb-3">🎁</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Early Access</h3>
                                    <p className="text-gray-300 text-sm">Be among the first to try Dislink before everyone else!</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#1a2a4a]/50 to-[#2d1b69]/50 backdrop-blur-sm border border-[#FFD37E]/20 rounded-xl p-6">
                                    <div className="text-3xl mb-3">💫</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Exclusive Perks</h3>
                                    <p className="text-gray-300 text-sm">Get special features and cosmic rewards!</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#1a2a4a]/50 to-[#2d1b69]/50 backdrop-blur-sm border border-[#FF6F61]/20 rounded-xl p-6">
                                    <div className="text-3xl mb-3">🌟</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Stellar Community</h3>
                                    <p className="text-gray-300 text-sm">Connect with amazing people from day one!</p>
                                </div>
                            </div>

                            {/* Waitlist Form */}
                            <div className="max-w-md mx-auto">
                                <WaitlistForm />
                            </div>

                            <p className="text-sm text-gray-400 mt-6">
                                🔒 We respect your privacy. No spam, just cosmic updates!
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div>
        </div>
    );
}