import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Globe, ArrowLeft, Sparkles, Users, Link, CheckCircle,
    AlertCircle, ExternalLink, Loader2, Search, Copy, X
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
    icon: string;
    placeholder: string;
    pattern: RegExp;
    example: string;
    apiEndpoint?: string;
    verificationMethod?: 'url' | 'username' | 'api';
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
    // Professional & Business
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        placeholder: 'https://linkedin.com/in/yourname',
        pattern: /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
        example: 'https://linkedin.com/in/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'github',
        name: 'GitHub',
        icon: '🐙',
        placeholder: 'https://github.com/username',
        pattern: /^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
        example: 'https://github.com/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'behance',
        name: 'Behance',
        icon: '🎨',
        placeholder: 'https://behance.net/username',
        pattern: /^https:\/\/(www\.)?behance\.net\/[\w-]+\/?$/,
        example: 'https://behance.net/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'dribbble',
        name: 'Dribbble',
        icon: '🏀',
        placeholder: 'https://dribbble.com/username',
        pattern: /^https:\/\/(www\.)?dribbble\.com\/[\w-]+\/?$/,
        example: 'https://dribbble.com/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'portfolio',
        name: 'Portfolio',
        icon: '💼',
        placeholder: 'https://yourportfolio.com',
        pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
        example: 'https://johndoe.com',
        verificationMethod: 'url'
    },

    // Social Media - Major Platforms
    {
        id: 'facebook',
        name: 'Facebook',
        icon: '👥',
        placeholder: 'https://facebook.com/username',
        pattern: /^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/,
        example: 'https://facebook.com/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        placeholder: '@username or https://instagram.com/username',
        pattern: /^@[\w.]+$|^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/,
        example: '@johndoe',
        verificationMethod: 'username'
    },
    {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: '🐦',
        placeholder: '@username or https://x.com/username',
        pattern: /^@[\w]{1,15}$|^https:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]{1,15}\/?$/,
        example: '@johndoe',
        verificationMethod: 'username'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: '🎵',
        placeholder: '@username or https://tiktok.com/@username',
        pattern: /^@[\w.]+$|^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/,
        example: '@johndoe',
        verificationMethod: 'username'
    },
    {
        id: 'snapchat',
        name: 'Snapchat',
        icon: '👻',
        placeholder: '@username',
        pattern: /^@[\w.]+$/,
        example: '@johndoe',
        verificationMethod: 'username'
    },

    // Video Platforms
    {
        id: 'youtube',
        name: 'YouTube',
        icon: '📺',
        placeholder: 'https://youtube.com/@username',
        pattern: /^https:\/\/(www\.)?youtube\.com\/(@[\w-]+|channel\/[\w-]+|c\/[\w-]+)\/?$/,
        example: 'https://youtube.com/@johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'twitch',
        name: 'Twitch',
        icon: '🎮',
        placeholder: 'https://twitch.tv/username',
        pattern: /^https:\/\/(www\.)?twitch\.tv\/[\w-]+\/?$/,
        example: 'https://twitch.tv/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'vimeo',
        name: 'Vimeo',
        icon: '🎬',
        placeholder: 'https://vimeo.com/username',
        pattern: /^https:\/\/(www\.)?vimeo\.com\/[\w-]+\/?$/,
        example: 'https://vimeo.com/johndoe',
        verificationMethod: 'url'
    },

    // Creative & Visual
    {
        id: 'pinterest',
        name: 'Pinterest',
        icon: '📌',
        placeholder: 'https://pinterest.com/username',
        pattern: /^https:\/\/(www\.)?pinterest\.com\/[\w-]+\/?$/,
        example: 'https://pinterest.com/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'flickr',
        name: 'Flickr',
        icon: '📷',
        placeholder: 'https://flickr.com/photos/username',
        pattern: /^https:\/\/(www\.)?flickr\.com\/photos\/[\w-]+\/?$/,
        example: 'https://flickr.com/photos/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'deviantart',
        name: 'DeviantArt',
        icon: '🎭',
        placeholder: 'https://deviantart.com/username',
        pattern: /^https:\/\/(www\.)?deviantart\.com\/[\w-]+\/?$/,
        example: 'https://deviantart.com/johndoe',
        verificationMethod: 'url'
    },

    // Content & Blogging
    {
        id: 'medium',
        name: 'Medium',
        icon: '📝',
        placeholder: 'https://medium.com/@username',
        pattern: /^https:\/\/(www\.)?medium\.com\/@[\w-]+\/?$/,
        example: 'https://medium.com/@johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'tumblr',
        name: 'Tumblr',
        icon: '📱',
        placeholder: 'https://username.tumblr.com',
        pattern: /^https:\/\/(www\.)?[\w-]+\.tumblr\.com\/?$/,
        example: 'https://johndoe.tumblr.com',
        verificationMethod: 'url'
    },
    {
        id: 'wordpress',
        name: 'WordPress',
        icon: '📝',
        placeholder: 'https://username.wordpress.com',
        pattern: /^https:\/\/(www\.)?[\w-]+\.wordpress\.com\/?$/,
        example: 'https://johndoe.wordpress.com',
        verificationMethod: 'url'
    },
    {
        id: 'blogger',
        name: 'Blogger',
        icon: '📖',
        placeholder: 'https://username.blogspot.com',
        pattern: /^https:\/\/(www\.)?[\w-]+\.blogspot\.com\/?$/,
        example: 'https://johndoe.blogspot.com',
        verificationMethod: 'url'
    },

    // Community & Forums
    {
        id: 'reddit',
        name: 'Reddit',
        icon: '🤖',
        placeholder: 'https://reddit.com/u/username',
        pattern: /^https:\/\/(www\.)?reddit\.com\/u\/[\w-]+\/?$/,
        example: 'https://reddit.com/u/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'quora',
        name: 'Quora',
        icon: '❓',
        placeholder: 'https://quora.com/profile/username',
        pattern: /^https:\/\/(www\.)?quora\.com\/profile\/[\w-]+\/?$/,
        example: 'https://quora.com/profile/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'discord',
        name: 'Discord',
        icon: '💬',
        placeholder: 'username#1234',
        pattern: /^[\w-]+#\d{4}$/,
        example: 'johndoe#1234',
        verificationMethod: 'username'
    },

    // Messaging & Communication
    {
        id: 'telegram',
        name: 'Telegram',
        icon: '✈️',
        placeholder: '@username',
        pattern: /^@[\w_]+$/,
        example: '@johndoe',
        verificationMethod: 'username'
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        placeholder: '+1234567890',
        pattern: /^\+[\d\s-()]+$/,
        example: '+1234567890',
        verificationMethod: 'username'
    },
    {
        id: 'signal',
        name: 'Signal',
        icon: '🔒',
        placeholder: '+1234567890',
        pattern: /^\+[\d\s-()]+$/,
        example: '+1234567890',
        verificationMethod: 'username'
    },

    // Music & Audio
    {
        id: 'spotify',
        name: 'Spotify',
        icon: '🎵',
        placeholder: 'https://open.spotify.com/user/username',
        pattern: /^https:\/\/(www\.)?open\.spotify\.com\/user\/[\w-]+\/?$/,
        example: 'https://open.spotify.com/user/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'soundcloud',
        name: 'SoundCloud',
        icon: '🎧',
        placeholder: 'https://soundcloud.com/username',
        pattern: /^https:\/\/(www\.)?soundcloud\.com\/[\w-]+\/?$/,
        example: 'https://soundcloud.com/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'bandcamp',
        name: 'Bandcamp',
        icon: '🎸',
        placeholder: 'https://username.bandcamp.com',
        pattern: /^https:\/\/(www\.)?[\w-]+\.bandcamp\.com\/?$/,
        example: 'https://johndoe.bandcamp.com',
        verificationMethod: 'url'
    },

    // Gaming
    {
        id: 'steam',
        name: 'Steam',
        icon: '🎮',
        placeholder: 'https://steamcommunity.com/id/username',
        pattern: /^https:\/\/(www\.)?steamcommunity\.com\/id\/[\w-]+\/?$/,
        example: 'https://steamcommunity.com/id/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'xbox',
        name: 'Xbox',
        icon: '🎯',
        placeholder: 'Gamertag',
        pattern: /^[\w\s-]{1,15}$/,
        example: 'JohnDoe123',
        verificationMethod: 'username'
    },
    {
        id: 'playstation',
        name: 'PlayStation',
        icon: '🎮',
        placeholder: 'PSN ID',
        pattern: /^[\w-]{3,16}$/,
        example: 'JohnDoe123',
        verificationMethod: 'username'
    },

    // Professional Networks
    {
        id: 'angellist',
        name: 'AngelList',
        icon: '👼',
        placeholder: 'https://angel.co/username',
        pattern: /^https:\/\/(www\.)?angel\.co\/[\w-]+\/?$/,
        example: 'https://angel.co/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'crunchbase',
        name: 'Crunchbase',
        icon: '📊',
        placeholder: 'https://crunchbase.com/person/username',
        pattern: /^https:\/\/(www\.)?crunchbase\.com\/person\/[\w-]+\/?$/,
        example: 'https://crunchbase.com/person/johndoe',
        verificationMethod: 'url'
    },

    // E-commerce & Business
    {
        id: 'etsy',
        name: 'Etsy',
        icon: '🛍️',
        placeholder: 'https://etsy.com/shop/username',
        pattern: /^https:\/\/(www\.)?etsy\.com\/shop\/[\w-]+\/?$/,
        example: 'https://etsy.com/shop/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'shopify',
        name: 'Shopify',
        icon: '🛒',
        placeholder: 'https://username.myshopify.com',
        pattern: /^https:\/\/(www\.)?[\w-]+\.myshopify\.com\/?$/,
        example: 'https://johndoe.myshopify.com',
        verificationMethod: 'url'
    },

    // Education & Learning
    {
        id: 'coursera',
        name: 'Coursera',
        icon: '🎓',
        placeholder: 'https://coursera.org/user/username',
        pattern: /^https:\/\/(www\.)?coursera\.org\/user\/[\w-]+\/?$/,
        example: 'https://coursera.org/user/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'udemy',
        name: 'Udemy',
        icon: '📚',
        placeholder: 'https://udemy.com/user/username',
        pattern: /^https:\/\/(www\.)?udemy\.com\/user\/[\w-]+\/?$/,
        example: 'https://udemy.com/user/johndoe',
        verificationMethod: 'url'
    },

    // Fitness & Health
    {
        id: 'strava',
        name: 'Strava',
        icon: '🏃',
        placeholder: 'https://strava.com/athletes/username',
        pattern: /^https:\/\/(www\.)?strava\.com\/athletes\/[\w-]+\/?$/,
        example: 'https://strava.com/athletes/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'myfitnesspal',
        name: 'MyFitnessPal',
        icon: '💪',
        placeholder: 'Username',
        pattern: /^[\w-]{3,20}$/,
        example: 'johndoe',
        verificationMethod: 'username'
    },

    // Travel & Lifestyle
    {
        id: 'airbnb',
        name: 'Airbnb',
        icon: '🏠',
        placeholder: 'https://airbnb.com/users/show/username',
        pattern: /^https:\/\/(www\.)?airbnb\.com\/users\/show\/[\w-]+\/?$/,
        example: 'https://airbnb.com/users/show/johndoe',
        verificationMethod: 'url'
    },
    {
        id: 'tripadvisor',
        name: 'TripAdvisor',
        icon: '✈️',
        placeholder: 'https://tripadvisor.com/members/username',
        pattern: /^https:\/\/(www\.)?tripadvisor\.com\/members\/[\w-]+\/?$/,
        example: 'https://tripadvisor.com/members/johndoe',
        verificationMethod: 'url'
    },

    // Personal Website
    {
        id: 'website',
        name: 'Personal Website',
        icon: '🌐',
        placeholder: 'https://yourwebsite.com',
        pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
        example: 'https://johndoe.com',
        verificationMethod: 'url'
    }
];

export function ImprovedSocialLinksStep({
    socialLinks,
    onUpdate,
    onNext,
    onBack
}: SocialLinksStepProps) {
    const [showPlatformSelector, setShowPlatformSelector] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validLinks, setValidLinks] = useState<Record<string, boolean>>({});
    const [verifyingLinks, setVerifyingLinks] = useState<Record<string, boolean>>({});
    const [hasAtLeastOneValidLink, setHasAtLeastOneValidLink] = useState(false);
    const [quickAddMode, setQuickAddMode] = useState(false);
    const [quickAddUrl, setQuickAddUrl] = useState('');

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

    const formatLink = (platform: string, value: string): string => {
        const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === platform);
        if (!platformConfig) return value;

        // Auto-format common patterns
        if (platform === 'twitter' && value.startsWith('@')) {
            return `https://twitter.com/${value.substring(1)}`;
        }
        if (platform === 'instagram' && value.startsWith('@')) {
            return `https://instagram.com/${value.substring(1)}`;
        }
        if (platform === 'tiktok' && value.startsWith('@')) {
            return `https://tiktok.com/${value}`;
        }
        if (platform === 'linkedin' && !value.startsWith('http')) {
            return `https://linkedin.com/in/${value}`;
        }
        if (platform === 'github' && !value.startsWith('http')) {
            return `https://github.com/${value}`;
        }

        return value;
    };

    const verifyLink = async (platform: string, url: string): Promise<boolean> => {
        const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === platform);
        if (!platformConfig) return false;

        try {
            // Skip actual URL verification to avoid CORS and rate limiting issues
            // Just validate the format using the pattern
            const isValidFormat = platformConfig.pattern.test(url);

            if (isValidFormat) {
                console.log(`✅ ${platform} link format is valid:`, url);
                return true;
            } else {
                console.log(`❌ ${platform} link format is invalid:`, url);
                return false;
            }
        } catch (error) {
            console.log('Link verification failed:', error);
            return false;
        }
    };

    const handleLinkUpdate = async (platform: string, value: string) => {
        const formattedValue = formatLink(platform, value);

        // Update the link immediately
        const updatedLinks = { ...socialLinks, [platform]: formattedValue };
        onUpdate(updatedLinks);

        // Verify the link if it's not empty
        if (formattedValue.trim()) {
            setVerifyingLinks(prev => ({ ...prev, [platform]: true }));

            try {
                const isValid = await verifyLink(platform, formattedValue);
                setValidLinks(prev => ({ ...prev, [platform]: isValid }));
            } catch (error) {
                console.error('Verification error:', error);
                setValidLinks(prev => ({ ...prev, [platform]: false }));
            } finally {
                setVerifyingLinks(prev => ({ ...prev, [platform]: false }));
            }
        } else {
            setValidLinks(prev => ({ ...prev, [platform]: false }));
        }
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

    const handleQuickAdd = () => {
        if (!quickAddUrl.trim()) return;

        // Try to detect platform from URL
        const detectedPlatform = detectPlatformFromUrl(quickAddUrl);
        if (detectedPlatform) {
            handleLinkUpdate(detectedPlatform, quickAddUrl);
            setQuickAddUrl('');
            setQuickAddMode(false);
        } else {
            setError('Could not detect platform from URL. Please select manually.');
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

    const handleContinue = () => {
        // Check if user has at least one valid link
        const validLinksCount = getValidLinksCount();

        if (validLinksCount === 0) {
            setError('Please add at least one social media link to continue. This helps people connect with you!');
            return;
        }

        // Filter out invalid links
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

            {/* Quick Add Mode */}
            {quickAddMode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                >
                    <div className="flex items-center gap-3">
                        <Search className="h-5 w-5 text-blue-600" />
                        <input
                            type="url"
                            value={quickAddUrl}
                            onChange={(e) => setQuickAddUrl(e.target.value)}
                            placeholder="Paste any social media URL here..."
                            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleQuickAdd}
                            disabled={!quickAddUrl.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setQuickAddMode(false)}
                            className="p-2 text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}

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
                                    <div className="text-2xl">{platform.icon}</div>
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
                                        <input
                                            type="text"
                                            value={socialLinks[platformId]}
                                            onChange={(e) => handleLinkUpdate(platformId, e.target.value)}
                                            placeholder={platform.placeholder}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        />
                                        {!isValid && socialLinks[platformId] && (
                                            <p className="text-xs text-red-500 mt-1">
                                                Invalid format. Example: {platform.example}
                                            </p>
                                        )}
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

            {/* Add More Platforms */}
            {getAvailablePlatforms().length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Add More Platforms</h3>
                        <button
                            onClick={() => setQuickAddMode(!quickAddMode)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {quickAddMode ? 'Manual Add' : 'Quick Add'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                        {getAvailablePlatforms().map((platform) => (
                            <motion.button
                                key={platform.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const updatedLinks = { ...socialLinks, [platform.id]: '' };
                                    onUpdate(updatedLinks);
                                }}
                                className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-purple-600 hover:bg-indigo-50 transition-colors"
                            >
                                <span className="text-2xl">{platform.icon}</span>
                                <span className="text-xs font-medium text-gray-700 text-center">{platform.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

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
                    disabled={getValidLinksCount() === 0} // Require at least one valid link
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
