import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Globe, ArrowLeft, Sparkles, Users, Link, CheckCircle,
    AlertCircle, ExternalLink, Loader2, Search, Copy, X, ChevronDown, ChevronUp,
    Link2, User, Building2, Video, Heart, Calendar, MessageCircle, Music, Gamepad2
} from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

interface SocialLinksStepProps {
    socialLinks: Record<string, string>;
    onUpdate: (links: Record<string, string>) => void;
    onNext: () => void;
    onBack: () => void;
}

interface SocialPlatform {
    id: string;
    name: string;
    logo: string;
    placeholder: string;
    pattern: RegExp;
    example: string;
    category: string;
    verificationMethod?: 'url' | 'username' | 'api';
    baseUrl?: string;
}

interface Category {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    iconColor: string;
}

const CATEGORIES: Category[] = [
    {
        id: 'professional',
        title: 'Professional',
        icon: Building2,
        color: 'from-blue-50 to-white border-blue-100',
        iconColor: 'text-blue-600'
    },
    {
        id: 'social',
        title: 'Social Media',
        icon: Users,
        color: 'from-pink-50 to-white border-pink-100',
        iconColor: 'text-pink-600'
    },
    {
        id: 'content',
        title: 'Content',
        icon: Video,
        color: 'from-purple-50 to-white border-purple-100',
        iconColor: 'text-purple-600'
    },
    {
        id: 'messaging',
        title: 'Messaging',
        icon: MessageCircle,
        color: 'from-green-50 to-white border-green-100',
        iconColor: 'text-green-600'
    },
    {
        id: 'support',
        title: 'Support',
        icon: Heart,
        color: 'from-rose-50 to-white border-rose-100',
        iconColor: 'text-rose-600'
    },
    {
        id: 'scheduling',
        title: 'Scheduling',
        icon: Calendar,
        color: 'from-amber-50 to-white border-amber-100',
        iconColor: 'text-amber-600'
    },
    {
        id: 'music',
        title: 'Music',
        icon: Music,
        color: 'from-indigo-50 to-white border-indigo-100',
        iconColor: 'text-indigo-600'
    },
    {
        id: 'gaming',
        title: 'Gaming',
        icon: Gamepad2,
        color: 'from-violet-50 to-white border-violet-100',
        iconColor: 'text-violet-600'
    }
];

const SOCIAL_PLATFORMS: SocialPlatform[] = [
    // Professional
    {
        id: 'linkedin',
        name: 'LinkedIn',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'professional',
        verificationMethod: 'username',
        baseUrl: 'https://linkedin.com/in/'
    },
    {
        id: 'github',
        name: 'GitHub',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'professional',
        verificationMethod: 'username',
        baseUrl: 'https://github.com/'
    },
    {
        id: 'behance',
        name: 'Behance',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/behance.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'professional',
        verificationMethod: 'username',
        baseUrl: 'https://behance.net/'
    },
    {
        id: 'dribbble',
        name: 'Dribbble',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dribbble.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'professional',
        verificationMethod: 'username',
        baseUrl: 'https://dribbble.com/'
    },
    {
        id: 'portfolio',
        name: 'Portfolio',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJIMjBWMjJIMTBWMloiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTQgNkgxNFYyNkg0VjZaIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCA2VjEwIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCAxNFYxOCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K',
        placeholder: 'https://yourwebsite.com',
        pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
        example: 'https://johndoe.com',
        category: 'professional',
        verificationMethod: 'url'
    },
    {
        id: 'website',
        name: 'Website',
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
        placeholder: 'https://yourwebsite.com',
        pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
        example: 'https://johndoe.com',
        category: 'professional',
        verificationMethod: 'url'
    },

    // Social Media
    {
        id: 'instagram',
        name: 'Instagram',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
        placeholder: 'username',
        pattern: /^[\w.]+$/,
        example: 'johndoe',
        category: 'social',
        verificationMethod: 'username',
        baseUrl: 'https://instagram.com/'
    },
    {
        id: 'twitter',
        name: 'X (Twitter)',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg',
        placeholder: 'username',
        pattern: /^[\w]{1,15}$/,
        example: 'johndoe',
        category: 'social',
        verificationMethod: 'username',
        baseUrl: 'https://x.com/'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
        placeholder: 'username',
        pattern: /^[\w.]+$/,
        example: 'johndoe',
        category: 'social',
        verificationMethod: 'username',
        baseUrl: 'https://facebook.com/'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
        placeholder: 'username',
        pattern: /^[\w.]+$/,
        example: 'johndoe',
        category: 'social',
        verificationMethod: 'username',
        baseUrl: 'https://tiktok.com/@'
    },
    {
        id: 'snapchat',
        name: 'Snapchat',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg',
        placeholder: 'username',
        pattern: /^[\w.]+$/,
        example: 'johndoe',
        category: 'social',
        verificationMethod: 'username',
        baseUrl: 'https://snapchat.com/add/'
    },

    // Content
    {
        id: 'youtube',
        name: 'YouTube',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
        placeholder: '@username or channel',
        pattern: /^@?[\w-]+$/,
        example: '@johndoe',
        category: 'content',
        verificationMethod: 'username',
        baseUrl: 'https://youtube.com/'
    },
    {
        id: 'twitch',
        name: 'Twitch',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'content',
        verificationMethod: 'username',
        baseUrl: 'https://twitch.tv/'
    },
    {
        id: 'medium',
        name: 'Medium',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/medium.svg',
        placeholder: '@username',
        pattern: /^@?[\w-]+$/,
        example: '@johndoe',
        category: 'content',
        verificationMethod: 'username',
        baseUrl: 'https://medium.com/@'
    },
    {
        id: 'substack',
        name: 'Substack',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/substack.svg',
        placeholder: 'newsletter-name',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'content',
        verificationMethod: 'username',
        baseUrl: 'https://'
    },

    // Messaging
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
        placeholder: '+1234567890',
        pattern: /^\+[\d\s-()]+$/,
        example: '+1234567890',
        category: 'messaging',
        verificationMethod: 'username'
    },
    {
        id: 'telegram',
        name: 'Telegram',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg',
        placeholder: 'username',
        pattern: /^[\w_]+$/,
        example: 'johndoe',
        category: 'messaging',
        verificationMethod: 'username',
        baseUrl: 'https://t.me/'
    },
    {
        id: 'discord',
        name: 'Discord',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
        placeholder: 'username#1234',
        pattern: /^[\w-]+#\d{4}$/,
        example: 'johndoe#1234',
        category: 'messaging',
        verificationMethod: 'username'
    },

    // Support
    {
        id: 'patreon',
        name: 'Patreon',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/patreon.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'support',
        verificationMethod: 'username',
        baseUrl: 'https://patreon.com/'
    },
    {
        id: 'buymeacoffee',
        name: 'Buy Me a Coffee',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/buymeacoffee.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'support',
        verificationMethod: 'username',
        baseUrl: 'https://buymeacoffee.com/'
    },

    // Scheduling
    {
        id: 'calendly',
        name: 'Calendly',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/calendly.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'scheduling',
        verificationMethod: 'username',
        baseUrl: 'https://calendly.com/'
    },

    // Music
    {
        id: 'spotify',
        name: 'Spotify',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'music',
        verificationMethod: 'username',
        baseUrl: 'https://open.spotify.com/user/'
    },
    {
        id: 'soundcloud',
        name: 'SoundCloud',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/soundcloud.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'music',
        verificationMethod: 'username',
        baseUrl: 'https://soundcloud.com/'
    },

    // Gaming
    {
        id: 'steam',
        name: 'Steam',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/steam.svg',
        placeholder: 'username',
        pattern: /^[\w-]+$/,
        example: 'johndoe',
        category: 'gaming',
        verificationMethod: 'username',
        baseUrl: 'https://steamcommunity.com/id/'
    },
    {
        id: 'xbox',
        name: 'Xbox',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/xbox.svg',
        placeholder: 'Gamertag',
        pattern: /^[\w\s-]{1,15}$/,
        example: 'JohnDoe123',
        category: 'gaming',
        verificationMethod: 'username'
    },
    {
        id: 'playstation',
        name: 'PlayStation',
        logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/playstation.svg',
        placeholder: 'PSN ID',
        pattern: /^[\w-]{3,16}$/,
        example: 'JohnDoe123',
        category: 'gaming',
        verificationMethod: 'username'
    }
];

export function EnhancedSocialPlatforms({
    socialLinks,
    onUpdate,
    onNext,
    onBack
}: SocialLinksStepProps) {
    const [error, setError] = useState<string | null>(null);
    const [validLinks, setValidLinks] = useState<Record<string, boolean>>({});
    const [verifyingLinks, setVerifyingLinks] = useState<Record<string, boolean>>({});
    const [hasAtLeastOneValidLink, setHasAtLeastOneValidLink] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [showUsernameModal, setShowUsernameModal] = useState(false);

    // Validate links on mount and when they change
    useEffect(() => {
        const newValidLinks: Record<string, boolean> = {};
        let hasValid = false;

        Object.entries(socialLinks).forEach(([platform, value]) => {
            const isValid = value.trim() !== '' && isValidLink(platform, value);
            newValidLinks[platform] = isValid;
            if (isValid) hasValid = true;
        });

        setValidLinks(newValidLinks);
        setHasAtLeastOneValidLink(hasValid);
    }, [socialLinks]);

    const isValidLink = (platform: string, value: string): boolean => {
        if (!value.trim()) return false;

        const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === platform);
        if (!platformConfig) return false;

        return platformConfig.pattern.test(value.trim());
    };

    const formatLink = (platform: SocialPlatform, username: string): string => {
        if (platform.verificationMethod === 'url') {
            return username;
        }

        if (platform.baseUrl) {
            return `${platform.baseUrl}${username}`;
        }

        return username;
    };

    const handleManualUrlAdd = () => {
        if (!manualUrl.trim()) return;

        // Try to detect platform from URL
        const detectedPlatform = detectPlatformFromUrl(manualUrl);
        if (detectedPlatform) {
            handleLinkUpdate(detectedPlatform, manualUrl);
            setManualUrl('');
        } else {
            // Add as website
            handleLinkUpdate('website', manualUrl);
            setManualUrl('');
        }
    };

    const detectPlatformFromUrl = (url: string): string | null => {
        const lowerUrl = url.toLowerCase();

        if (lowerUrl.includes('linkedin.com')) return 'linkedin';
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
        if (lowerUrl.includes('github.com')) return 'github';
        if (lowerUrl.includes('instagram.com')) return 'instagram';
        if (lowerUrl.includes('facebook.com')) return 'facebook';
        if (lowerUrl.includes('youtube.com')) return 'youtube';
        if (lowerUrl.includes('tiktok.com')) return 'tiktok';
        if (lowerUrl.includes('http')) return 'website';

        return null;
    };

    const handleLinkUpdate = (platform: string, value: string) => {
        const updatedLinks = { ...socialLinks, [platform]: value };
        onUpdate(updatedLinks);
        setError(null);
    };

    const handleRemoveLink = (platform: string) => {
        const updatedLinks = { ...socialLinks };
        delete updatedLinks[platform];
        onUpdate(updatedLinks);

        setValidLinks(prev => {
            const newValid = { ...prev };
            delete newValid[platform];
            return newValid;
        });
    };

    const handlePlatformClick = (platform: SocialPlatform) => {
        setSelectedPlatform(platform);
        setUsernameInput('');
        setShowUsernameModal(true);
    };

    const handleUsernameSubmit = () => {
        if (!selectedPlatform || !usernameInput.trim()) return;

        const formattedLink = formatLink(selectedPlatform, usernameInput.trim());
        handleLinkUpdate(selectedPlatform.id, formattedLink);
        setShowUsernameModal(false);
        setSelectedPlatform(null);
        setUsernameInput('');
    };

    const handleContinue = () => {
        const validLinksCount = getValidLinksCount();

        if (validLinksCount === 0) {
            setError('Please add at least one social media link to continue. This helps people connect with you!');
            return;
        }

        const filteredLinks = Object.entries(socialLinks)
            .filter(([_, value]) => value.trim() !== '')
            .reduce((acc, [key, value]) => ({
                ...acc,
                [key]: value
            }), {});

        onUpdate(filteredLinks);
        setError(null);
        onNext();
    };

    const getValidLinksCount = () => {
        return Object.values(validLinks).filter(Boolean).length;
    };

    const getAddedPlatforms = () => {
        return Object.keys(socialLinks).filter(key => socialLinks[key].trim() !== '');
    };

    const getAvailablePlatforms = () => {
        return SOCIAL_PLATFORMS.filter(platform => !socialLinks[platform.id]);
    };

    const getPlatformsByCategory = () => {
        const categories: Record<string, SocialPlatform[]> = {};

        getAvailablePlatforms().forEach(platform => {
            if (!categories[platform.category]) {
                categories[platform.category] = [];
            }
            categories[platform.category].push(platform);
        });

        return categories;
    };

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header with motivation */}
            <div className="text-center space-y-3">
                <div className="flex justify-center">
                    <div className="relative">
                        <Globe className="h-12 w-12 text-indigo-600" />
                        <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Connect Your World! 🌎
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Add your social profiles to make it easier for people to discover and connect with you
                    </p>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Platforms Added</span>
                    <span className="text-sm text-indigo-600 font-semibold">
                        {getValidLinksCount()} / 3+ recommended
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((getValidLinksCount() / 3) * 100, 100)}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                {getValidLinksCount() >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-center"
                    >
                        <span className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Great! You have enough platforms to get started
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Manual URL Input Bar - Always Visible */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-gray-500" />
                    <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="Paste any profile URL (e.g., https://linkedin.com/in/yourname)..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    <button
                        onClick={handleManualUrlAdd}
                        disabled={!manualUrl.trim()}
                        className="px-4 py-2 btn-captamundi-primary text-white rounded-lg hover:btn-captamundi-primary hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        Add URL
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    💡 Paste any social media profile URL and we'll automatically detect the platform
                </p>
            </div>

            {/* Added Links */}
            {getAddedPlatforms().length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Your Social Links</h3>
                    {getAddedPlatforms().map((platformId) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
                        if (!platform) return null;

                        const isValid = validLinks[platformId];
                        const isVerifying = verifyingLinks[platformId];

                        return (
                            <motion.div
                                key={platformId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-gray-200 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={platform.logo}
                                        alt={platform.name}
                                        className="w-8 h-8"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{platform.name}</span>
                                            {isVerifying && (
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            )}
                                            {!isVerifying && isValid && (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            )}
                                            {!isVerifying && !isValid && socialLinks[platformId] && (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 break-all">
                                            {socialLinks[platformId]}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveLink(platformId)}
                                        className="p-2 text-gray-600 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Platform Categories */}
            {getAvailablePlatforms().length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Add More Platforms</h3>
                    <p className="text-sm text-gray-600">
                        Click on a platform to add it with just your username
                    </p>

                    <div className="space-y-4">
                        {Object.entries(getPlatformsByCategory()).map(([categoryId, platforms]) => {
                            const category = CATEGORIES.find(c => c.id === categoryId);
                            if (!category) return null;

                            return (
                                <div key={categoryId} className="border border-gray-200 rounded-lg">
                                    <button
                                        onClick={() => toggleCategory(categoryId)}
                                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <category.icon className={`h-5 w-5 ${category.iconColor}`} />
                                            <span className="font-medium text-gray-900">{category.title}</span>
                                            <span className="text-sm text-gray-500">({platforms.length})</span>
                                        </div>
                                        {expandedCategories[categoryId] ? (
                                            <ChevronUp className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-500" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {expandedCategories[categoryId] && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-t border-gray-200"
                                            >
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                                                    {platforms.map((platform) => (
                                                        <motion.button
                                                            key={platform.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handlePlatformClick(platform)}
                                                            className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg transition-colors hover:border-purple-600 hover:bg-indigo-50"
                                                        >
                                                            <img
                                                                src={platform.logo}
                                                                alt={platform.name}
                                                                className="w-8 h-8"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                            <span className="text-xs font-medium text-gray-700 text-center">{platform.name}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Username Input Modal */}
            <AnimatePresence>
                {showUsernameModal && selectedPlatform && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowUsernameModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={selectedPlatform.logo}
                                    alt={selectedPlatform.name}
                                    className="w-8 h-8"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900">Add {selectedPlatform.name}</h3>
                                    <p className="text-sm text-gray-600">Enter your {selectedPlatform.name} username</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={usernameInput}
                                        onChange={(e) => setUsernameInput(e.target.value)}
                                        placeholder={selectedPlatform.placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Example: {selectedPlatform.example}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowUsernameModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUsernameSubmit}
                                        disabled={!usernameInput.trim()}
                                        className="flex-1 px-4 py-2 btn-captamundi-primary text-white rounded-lg hover:btn-captamundi-primary hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Add Platform
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Display */}
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

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <AnimatedButton
                    variant="secondary"
                    onClick={onBack}
                    icon={ArrowLeft}
                    className="flex-1"
                >
                    Back
                </AnimatedButton>
                <AnimatedButton
                    onClick={handleContinue}
                    disabled={getValidLinksCount() === 0}
                    className="flex-1"
                >
                    Continue
                </AnimatedButton>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
                <p>
                    💡 <strong>Tip:</strong> Add at least 3 social links for better networking opportunities
                </p>
                <p className="mt-1">
                    You can always add more social links later in your profile settings
                </p>
            </div>
        </div>
    );
}
