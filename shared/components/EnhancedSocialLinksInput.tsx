import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, ExternalLink, AlertCircle, CheckCircle,
    Globe, Link as LinkIcon, Eye, Trash2, Edit3
} from 'lucide-react';
import { SOCIAL_CATEGORIES } from '../constants/social';
import type { Location } from '../types';

// Platform icons stored locally to avoid CSP issues
const PLATFORM_ICONS = {
    linkedin: '🔗',
    github: '🐙',
    instagram: '📷',
    twitter: '🐦',
    facebook: '👥',
    youtube: '📺',
    tiktok: '🎵',
    snapchat: '👻',
    whatsapp: '💬',
    telegram: '✈️',
    discord: '🎮',
    medium: '📝',
    substack: '📰',
    twitch: '🎮',
    portfolio: '🌐',
    website: '🌐',
    custom: '🔗'
};

interface SocialLink {
    id: string;
    platform: string;
    username: string;
    url: string;
    isCustom?: boolean;
    customPlatformName?: string;
}

interface EnhancedSocialLinksInputProps {
    links: Record<string, string>; // Existing format: { platform: url }
    onChange: (links: Record<string, string>) => void;
    required?: boolean;
    minLinks?: number;
    recommendedLinks?: number;
    className?: string;
    showPreview?: boolean;
    allowCustomPlatforms?: boolean;
}

// URL patterns for validation - now accepts both usernames and URLs
const URL_PATTERNS = {
    linkedin: /^[\w-]+$|^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
    github: /^[\w-]+$|^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
    twitter: /^[\w]{1,15}$|^@[\w]{1,15}$|^https:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]{1,15}\/?$/,
    instagram: /^[\w.]+$|^@[\w.]+$|^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/,
    facebook: /^[\w.]+$|^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/,
    youtube: /^[\w-]+$|^@[\w-]+$|^https:\/\/(www\.)?youtube\.com\/(@[\w-]+|channel\/[\w-]+|c\/[\w-]+)\/?$/,
    tiktok: /^[\w.]+$|^@[\w.]+$|^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/,
    snapchat: /^[\w.]+$|^@[\w.]+$/,
    whatsapp: /^\+?[\d\s-()]+$/,
    telegram: /^[\w]+$|^@[\w]+$/,
    discord: /^[\w]+#[\d]{4}$/,
    medium: /^[\w-]+$|^@[\w-]+$|^https:\/\/(www\.)?medium\.com\/@[\w-]+\/?$/,
    substack: /^[\w-]+$|^[\w-]+\.substack\.com$|^https:\/\/(www\.)?[\w-]+\.substack\.com\/?$/,
    twitch: /^[\w]+$|^https:\/\/(www\.)?twitch\.tv\/[\w]+\/?$/,
    portfolio: /^[\w.-]+$|^https?:\/\/.+/,
    website: /^[\w.-]+$|^https?:\/\/.+/
};

// URL formatters to convert username to full URL
const URL_FORMATTERS = {
    linkedin: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?linkedin\.com\/in\//, '');
        return `https://linkedin.com/in/${username}`;
    },
    github: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?github\.com\//, '');
        return `https://github.com/${username}`;
    },
    twitter: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '');
        return `https://twitter.com/${username}`;
    },
    instagram: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '');
        return `https://instagram.com/${username}`;
    },
    facebook: (input: string) => {
        if (input.startsWith('https://')) return input;
        return `https://facebook.com/${input}`;
    },
    youtube: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '');
        return `https://youtube.com/@${username}`;
    },
    tiktok: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '');
        return `https://tiktok.com/@${username}`;
    },
    snapchat: (input: string) => {
        if (input.startsWith('@')) return input;
        return `@${input}`;
    },
    whatsapp: (input: string) => {
        if (input.startsWith('+')) return input;
        if (input.startsWith('https://')) return input;
        return `+${input.replace(/\D/g, '')}`;
    },
    telegram: (input: string) => {
        if (input.startsWith('@')) return input;
        return `@${input}`;
    },
    discord: (input: string) => {
        return input; // Discord format is specific
    },
    medium: (input: string) => {
        if (input.startsWith('https://')) return input;
        const username = input.replace(/^@/, '');
        return `https://medium.com/@${username}`;
    },
    substack: (input: string) => {
        if (input.startsWith('https://')) return input;
        if (input.includes('.substack.com')) return `https://${input}`;
        return `https://${input}.substack.com`;
    },
    twitch: (input: string) => {
        if (input.startsWith('https://')) return input;
        return `https://twitch.tv/${input}`;
    },
    portfolio: (input: string) => {
        if (input.startsWith('http')) return input;
        return `https://${input}`;
    },
    website: (input: string) => {
        if (input.startsWith('http')) return input;
        return `https://${input}`;
    }
};

// Popular platforms for quick selection
const POPULAR_PLATFORMS = [
    'linkedin', 'instagram', 'twitter', 'github', 'youtube', 'tiktok',
    'facebook', 'snapchat', 'whatsapp', 'telegram', 'discord', 'medium'
];

export function EnhancedSocialLinksInput({
    links,
    onChange,
    required = false,
    minLinks = 1,
    recommendedLinks = 3,
    className = '',
    showPreview = true,
    allowCustomPlatforms = true
}: EnhancedSocialLinksInputProps) {
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [customPlatformName, setCustomPlatformName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // Convert existing links format to internal format
    useEffect(() => {
        const convertedLinks: SocialLink[] = Object.entries(links).map(([platform, url]) => ({
            id: `${platform}-${Date.now()}`,
            platform,
            username: extractUsername(platform, url),
            url,
            isCustom: !SOCIAL_CATEGORIES.professional.links[platform] &&
                !SOCIAL_CATEGORIES.social.links[platform] &&
                !SOCIAL_CATEGORIES.messaging.links[platform] &&
                !SOCIAL_CATEGORIES.content.links[platform] &&
                !SOCIAL_CATEGORIES.support.links[platform] &&
                !SOCIAL_CATEGORIES.scheduling.links[platform] &&
                !SOCIAL_CATEGORIES.gaming.links[platform]
        }));
        setSocialLinks(convertedLinks);
    }, [links]);

    // Extract username from URL
    const extractUsername = (platform: string, url: string): string => {
        if (!url) return '';

        try {
            switch (platform) {
                case 'linkedin':
                    return url.replace(/^https:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
                case 'github':
                    return url.replace(/^https:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
                case 'twitter':
                    return url.replace(/^https:\/\/(www\.)?(twitter\.com|x\.com)\//, '').replace(/\/$/, '');
                case 'instagram':
                    return url.replace(/^https:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
                case 'facebook':
                    return url.replace(/^https:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '');
                case 'youtube':
                    return url.replace(/^https:\/\/(www\.)?youtube\.com\/(@|channel\/|c\/)/, '').replace(/\/$/, '');
                case 'tiktok':
                    return url.replace(/^https:\/\/(www\.)?tiktok\.com\/@/, '').replace(/\/$/, '');
                case 'snapchat':
                    return url.replace(/^@/, '');
                case 'whatsapp':
                    return url.replace(/^\+/, '');
                case 'telegram':
                    return url.replace(/^@/, '');
                case 'discord':
                    return url;
                case 'medium':
                    return url.replace(/^https:\/\/(www\.)?medium\.com\/@/, '').replace(/\/$/, '');
                case 'substack':
                    return url.replace(/^https:\/\/(www\.)?/, '').replace(/\.substack\.com.*$/, '');
                case 'twitch':
                    return url.replace(/^https:\/\/(www\.)?twitch\.tv\//, '').replace(/\/$/, '');
                default:
                    return url;
            }
        } catch {
            return url;
        }
    };

    // Validate input
    const validateInput = (platform: string, value: string): { isValid: boolean; message?: string } => {
        if (!value.trim()) return { isValid: true };

        const pattern = URL_PATTERNS[platform as keyof typeof URL_PATTERNS];
        if (!pattern) return { isValid: true };

        if (!pattern.test(value.trim())) {
            return {
                isValid: false,
                message: `Invalid format for ${platform}. Try entering just your username (e.g., "antoniotubito") or full URL.`
            };
        }

        return { isValid: true };
    };

    // Format URL based on platform
    const formatUrl = (platform: string, input: string): string => {
        const formatter = URL_FORMATTERS[platform as keyof typeof URL_FORMATTERS];
        if (formatter) {
            return formatter(input);
        }
        return input;
    };

    // Update parent component
    const updateParent = useCallback((newLinks: SocialLink[]) => {
        const linksObject: Record<string, string> = {};
        newLinks.forEach(link => {
            if (link.url.trim()) {
                linksObject[link.platform] = link.url;
            }
        });
        onChange(linksObject);
    }, [onChange]);

    // Add new social link
    const handleAddLink = () => {
        if (!selectedPlatform || !inputValue.trim()) return;

        const validation = validateInput(selectedPlatform, inputValue);
        if (!validation.isValid) {
            setErrors({ [selectedPlatform]: validation.message || 'Invalid format' });
            return;
        }

        // Always format the URL, even if it's just a username
        const formattedUrl = formatUrl(selectedPlatform, inputValue.trim());
        const newLink: SocialLink = {
            id: `${selectedPlatform}-${Date.now()}`,
            platform: selectedPlatform,
            username: extractUsername(selectedPlatform, formattedUrl),
            url: formattedUrl,
            isCustom: selectedPlatform === 'custom',
            customPlatformName: selectedPlatform === 'custom' ? customPlatformName : undefined
        };

        const updatedLinks = [...socialLinks, newLink];
        setSocialLinks(updatedLinks);
        updateParent(updatedLinks);

        // Reset form
        setSelectedPlatform('');
        setInputValue('');
        setCustomPlatformName('');
        setShowAddForm(false);
        setErrors({});
    };

    // Update existing link
    const handleUpdateLink = (id: string, newValue: string) => {
        const linkIndex = socialLinks.findIndex(link => link.id === id);
        if (linkIndex === -1) return;

        const link = socialLinks[linkIndex];
        const validation = validateInput(link.platform, newValue);

        if (!validation.isValid) {
            setErrors({ [id]: validation.message || 'Invalid format' });
            return;
        }

        // Always format the URL, even if it's just a username
        const formattedUrl = formatUrl(link.platform, newValue.trim());
        const updatedLinks = [...socialLinks];
        updatedLinks[linkIndex] = {
            ...link,
            username: extractUsername(link.platform, formattedUrl),
            url: formattedUrl
        };

        setSocialLinks(updatedLinks);
        updateParent(updatedLinks);
        setIsEditing(null);
        setErrors({});
    };

    // Remove social link
    const handleRemoveLink = (id: string) => {
        const updatedLinks = socialLinks.filter(link => link.id !== id);
        setSocialLinks(updatedLinks);
        updateParent(updatedLinks);
    };

    // Get platform info
    const getPlatformInfo = (platform: string) => {
        for (const category of Object.values(SOCIAL_CATEGORIES)) {
            if (category.links[platform]) {
                return category.links[platform];
            }
        }
        return {
            icon: Globe,
            color: '#6B7280',
            label: platform.charAt(0).toUpperCase() + platform.slice(1),
            placeholder: 'Enter URL or username'
        };
    };

    // Get all available platforms
    const getAllPlatforms = () => {
        const platforms: string[] = [];
        Object.values(SOCIAL_CATEGORIES).forEach(category => {
            Object.keys(category.links).forEach(platform => {
                if (!platforms.includes(platform)) {
                    platforms.push(platform);
                }
            });
        });
        return platforms;
    };

    const availablePlatforms = getAllPlatforms();
    const linkCount = socialLinks.length;
    const hasMinimumLinks = linkCount >= minLinks;
    const hasRecommendedLinks = linkCount >= recommendedLinks;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header with link count and recommendations */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">Social Links</h3>
                    {required && <span className="text-red-500">*</span>}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${hasMinimumLinks
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {linkCount}/{minLinks} minimum
                    </span>
                    {!hasRecommendedLinks && (
                        <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                            {recommendedLinks} recommended
                        </span>
                    )}
                </div>
            </div>

            {/* Recommendation message */}
            {!hasRecommendedLinks && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                >
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Add more social links</p>
                            <p>We recommend adding at least {recommendedLinks} social links to help others connect with you.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Current links */}
            <div className="space-y-2">
                <AnimatePresence>
                    {socialLinks.map((link) => {
                        const platformInfo = getPlatformInfo(link.platform);
                        const Icon = platformInfo.icon;
                        const isEditingThis = isEditing === link.id;
                        const error = errors[link.id];

                        return (
                            <motion.div
                                key={link.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                            >
                                {/* Platform icon */}
                                <div
                                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                    style={{ backgroundColor: platformInfo.color }}
                                >
                                    {PLATFORM_ICONS[link.platform as keyof typeof PLATFORM_ICONS] || '🔗'}
                                </div>

                                {/* Link info */}
                                <div className="flex-1 min-w-0">
                                    {isEditingThis ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={link.url}
                                                onChange={(e) => {
                                                    const updatedLinks = socialLinks.map(l =>
                                                        l.id === link.id ? { ...l, url: e.target.value } : l
                                                    );
                                                    setSocialLinks(updatedLinks);
                                                }}
                                                onBlur={() => handleUpdateLink(link.id, link.url)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateLink(link.id, link.url);
                                                    } else if (e.key === 'Escape') {
                                                        setIsEditing(null);
                                                        setErrors({});
                                                    }
                                                }}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder={platformInfo.placeholder}
                                                autoFocus
                                            />
                                            {error && (
                                                <p className="text-xs text-red-600">{error}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {link.isCustom ? link.customPlatformName : platformInfo.label}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{link.url}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-1">
                                    {showPreview && !isEditingThis && (
                                        <button
                                            onClick={() => window.open(link.url, '_blank')}
                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Open link"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                    )}
                                    {!isEditingThis && (
                                        <button
                                            onClick={() => setIsEditing(link.id)}
                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Edit link"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemoveLink(link.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Remove link"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Add new link form */}
            {showAddForm ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-blue-900">Add Social Link</h4>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedPlatform('');
                                setInputValue('');
                                setCustomPlatformName('');
                                setErrors({});
                            }}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Platform selection */}
                    <div>
                        <label className="block text-xs font-medium text-blue-900 mb-1">
                            Platform
                        </label>
                        <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select a platform</option>
                            {availablePlatforms.map(platform => {
                                const info = getPlatformInfo(platform);
                                return (
                                    <option key={platform} value={platform}>
                                        {info.label}
                                    </option>
                                );
                            })}
                            {allowCustomPlatforms && (
                                <option value="custom">Custom Platform</option>
                            )}
                        </select>
                    </div>

                    {/* Custom platform name */}
                    {selectedPlatform === 'custom' && (
                        <div>
                            <label className="block text-xs font-medium text-blue-900 mb-1">
                                Platform Name
                            </label>
                            <input
                                type="text"
                                value={customPlatformName}
                                onChange={(e) => setCustomPlatformName(e.target.value)}
                                placeholder="e.g., My Blog, Portfolio"
                                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* URL/Username input */}
                    {selectedPlatform && (
                        <div>
                            <label className="block text-xs font-medium text-blue-900 mb-1">
                                {selectedPlatform === 'custom' ? 'URL' : 'Username or URL'}
                            </label>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={selectedPlatform === 'custom' ? 'https://example.com' : getPlatformInfo(selectedPlatform).placeholder}
                                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddLink();
                                    }
                                }}
                            />
                            {errors[selectedPlatform] && (
                                <p className="text-xs text-red-600 mt-1">{errors[selectedPlatform]}</p>
                            )}
                        </div>
                    )}

                    {/* Add button */}
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedPlatform('');
                                setInputValue('');
                                setCustomPlatformName('');
                                setErrors({});
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddLink}
                            disabled={!selectedPlatform || !inputValue.trim()}
                            className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Add Link
                        </button>
                    </div>
                </motion.div>
            ) : (
                /* Add button */
                <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Social Link</span>
                </button>
            )}

            {/* Quick add popular platforms */}
            {!showAddForm && linkCount < recommendedLinks && (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500">Quick add popular platforms:</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR_PLATFORMS
                            .filter(platform => !socialLinks.some(link => link.platform === platform))
                            .slice(0, 6)
                            .map(platform => {
                                const info = getPlatformInfo(platform);
                                return (
                                    <button
                                        key={platform}
                                        onClick={() => {
                                            setSelectedPlatform(platform);
                                            setShowAddForm(true);
                                        }}
                                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                        <span>{PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || '🔗'}</span>
                                        <span>{info.label}</span>
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
