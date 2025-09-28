import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Globe, ArrowLeft, Sparkles, Users, Link, CheckCircle,
  AlertCircle, ExternalLink, Loader2, Search, Copy, X, ChevronDown, ChevronUp
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
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  // Professional & Business
  {
    id: 'linkedin',
    name: 'LinkedIn',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
    placeholder: 'https://linkedin.com/in/yourname',
    pattern: /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
    example: 'https://linkedin.com/in/johndoe',
    category: 'Professional & Business',
    verificationMethod: 'url'
  },
  {
    id: 'github',
    name: 'GitHub',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg',
    placeholder: 'https://github.com/username',
    pattern: /^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
    example: 'https://github.com/johndoe',
    category: 'Professional & Business',
    verificationMethod: 'url'
  },
  {
    id: 'behance',
    name: 'Behance',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/behance.svg',
    placeholder: 'https://behance.net/username',
    pattern: /^https:\/\/(www\.)?behance\.net\/[\w-]+\/?$/,
    example: 'https://behance.net/johndoe',
    category: 'Professional & Business',
    verificationMethod: 'url'
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dribbble.svg',
    placeholder: 'https://dribbble.com/username',
    pattern: /^https:\/\/(www\.)?dribbble\.com\/[\w-]+\/?$/,
    example: 'https://dribbble.com/johndoe',
    category: 'Professional & Business',
    verificationMethod: 'url'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJIMjBWMjJIMTBWMloiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTQgNkgxNFYyNkg0VjZaIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCA2VjEwIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMCAxNFYxOCIgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K',
    placeholder: 'https://yourportfolio.com',
    pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
    example: 'https://johndoe.com',
    category: 'Professional & Business',
    verificationMethod: 'url'
  },

  // Social Media - Major Platforms
  {
    id: 'facebook',
    name: 'Facebook',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
    placeholder: 'https://facebook.com/username',
    pattern: /^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/,
    example: 'https://facebook.com/johndoe',
    category: 'Social Media',
    verificationMethod: 'url'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
    placeholder: '@username or https://instagram.com/username',
    pattern: /^@[\w.]+$|^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/,
    example: '@johndoe',
    category: 'Social Media',
    verificationMethod: 'username'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg',
    placeholder: '@username or https://x.com/username',
    pattern: /^@[\w]{1,15}$|^https:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]{1,15}\/?$/,
    example: '@johndoe',
    category: 'Social Media',
    verificationMethod: 'username'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
    placeholder: '@username or https://tiktok.com/@username',
    pattern: /^@[\w.]+$|^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/,
    example: '@johndoe',
    category: 'Social Media',
    verificationMethod: 'username'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg',
    placeholder: '@username',
    pattern: /^@[\w.]+$/,
    example: '@johndoe',
    category: 'Social Media',
    verificationMethod: 'username'
  },

  // Video Platforms
  {
    id: 'youtube',
    name: 'YouTube',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
    placeholder: 'https://youtube.com/@username',
    pattern: /^https:\/\/(www\.)?youtube\.com\/(@[\w-]+|channel\/[\w-]+|c\/[\w-]+)\/?$/,
    example: 'https://youtube.com/@johndoe',
    category: 'Video Platforms',
    verificationMethod: 'url'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg',
    placeholder: 'https://twitch.tv/username',
    pattern: /^https:\/\/(www\.)?twitch\.tv\/[\w-]+\/?$/,
    example: 'https://twitch.tv/johndoe',
    category: 'Video Platforms',
    verificationMethod: 'url'
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/vimeo.svg',
    placeholder: 'https://vimeo.com/username',
    pattern: /^https:\/\/(www\.)?vimeo\.com\/[\w-]+\/?$/,
    example: 'https://vimeo.com/johndoe',
    category: 'Video Platforms',
    verificationMethod: 'url'
  },

  // Creative & Visual
  {
    id: 'pinterest',
    name: 'Pinterest',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg',
    placeholder: 'https://pinterest.com/username',
    pattern: /^https:\/\/(www\.)?pinterest\.com\/[\w-]+\/?$/,
    example: 'https://pinterest.com/johndoe',
    category: 'Creative & Visual',
    verificationMethod: 'url'
  },
  {
    id: 'flickr',
    name: 'Flickr',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/flickr.svg',
    placeholder: 'https://flickr.com/photos/username',
    pattern: /^https:\/\/(www\.)?flickr\.com\/photos\/[\w-]+\/?$/,
    example: 'https://flickr.com/photos/johndoe',
    category: 'Creative & Visual',
    verificationMethod: 'url'
  },
  {
    id: 'deviantart',
    name: 'DeviantArt',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/deviantart.svg',
    placeholder: 'https://deviantart.com/username',
    pattern: /^https:\/\/(www\.)?deviantart\.com\/[\w-]+\/?$/,
    example: 'https://deviantart.com/johndoe',
    category: 'Creative & Visual',
    verificationMethod: 'url'
  },

  // Content & Blogging
  {
    id: 'medium',
    name: 'Medium',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/medium.svg',
    placeholder: 'https://medium.com/@username',
    pattern: /^https:\/\/(www\.)?medium\.com\/@[\w-]+\/?$/,
    example: 'https://medium.com/@johndoe',
    category: 'Content & Blogging',
    verificationMethod: 'url'
  },
  {
    id: 'tumblr',
    name: 'Tumblr',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tumblr.svg',
    placeholder: 'https://username.tumblr.com',
    pattern: /^https:\/\/(www\.)?[\w-]+\.tumblr\.com\/?$/,
    example: 'https://johndoe.tumblr.com',
    category: 'Content & Blogging',
    verificationMethod: 'url'
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/wordpress.svg',
    placeholder: 'https://username.wordpress.com',
    pattern: /^https:\/\/(www\.)?[\w-]+\.wordpress\.com\/?$/,
    example: 'https://johndoe.wordpress.com',
    category: 'Content & Blogging',
    verificationMethod: 'url'
  },
  {
    id: 'blogger',
    name: 'Blogger',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/blogger.svg',
    placeholder: 'https://username.blogspot.com',
    pattern: /^https:\/\/(www\.)?[\w-]+\.blogspot\.com\/?$/,
    example: 'https://johndoe.blogspot.com',
    category: 'Content & Blogging',
    verificationMethod: 'url'
  },

  // Community & Forums
  {
    id: 'reddit',
    name: 'Reddit',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/reddit.svg',
    placeholder: 'https://reddit.com/u/username',
    pattern: /^https:\/\/(www\.)?reddit\.com\/u\/[\w-]+\/?$/,
    example: 'https://reddit.com/u/johndoe',
    category: 'Community & Forums',
    verificationMethod: 'url'
  },
  {
    id: 'quora',
    name: 'Quora',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/quora.svg',
    placeholder: 'https://quora.com/profile/username',
    pattern: /^https:\/\/(www\.)?quora\.com\/profile\/[\w-]+\/?$/,
    example: 'https://quora.com/profile/johndoe',
    category: 'Community & Forums',
    verificationMethod: 'url'
  },
  {
    id: 'discord',
    name: 'Discord',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
    placeholder: 'username#1234',
    pattern: /^[\w-]+#\d{4}$/,
    example: 'johndoe#1234',
    category: 'Community & Forums',
    verificationMethod: 'username'
  },

  // Messaging & Communication
  {
    id: 'telegram',
    name: 'Telegram',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg',
    placeholder: '@username',
    pattern: /^@[\w_]+$/,
    example: '@johndoe',
    category: 'Messaging & Communication',
    verificationMethod: 'username'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
    placeholder: '+1234567890',
    pattern: /^\+[\d\s-()]+$/,
    example: '+1234567890',
    category: 'Messaging & Communication',
    verificationMethod: 'username'
  },
  {
    id: 'signal',
    name: 'Signal',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/signal.svg',
    placeholder: '+1234567890',
    pattern: /^\+[\d\s-()]+$/,
    example: '+1234567890',
    category: 'Messaging & Communication',
    verificationMethod: 'username'
  },

  // Music & Audio
  {
    id: 'spotify',
    name: 'Spotify',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg',
    placeholder: 'https://open.spotify.com/user/username',
    pattern: /^https:\/\/(www\.)?open\.spotify\.com\/user\/[\w-]+\/?$/,
    example: 'https://open.spotify.com/user/johndoe',
    category: 'Music & Audio',
    verificationMethod: 'url'
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/soundcloud.svg',
    placeholder: 'https://soundcloud.com/username',
    pattern: /^https:\/\/(www\.)?soundcloud\.com\/[\w-]+\/?$/,
    example: 'https://soundcloud.com/johndoe',
    category: 'Music & Audio',
    verificationMethod: 'url'
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/bandcamp.svg',
    placeholder: 'https://username.bandcamp.com',
    pattern: /^https:\/\/(www\.)?[\w-]+\.bandcamp\.com\/?$/,
    example: 'https://johndoe.bandcamp.com',
    category: 'Music & Audio',
    verificationMethod: 'url'
  },

  // Gaming
  {
    id: 'steam',
    name: 'Steam',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/steam.svg',
    placeholder: 'https://steamcommunity.com/id/username',
    pattern: /^https:\/\/(www\.)?steamcommunity\.com\/id\/[\w-]+\/?$/,
    example: 'https://steamcommunity.com/id/johndoe',
    category: 'Gaming',
    verificationMethod: 'url'
  },
  {
    id: 'xbox',
    name: 'Xbox',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/xbox.svg',
    placeholder: 'Gamertag',
    pattern: /^[\w\s-]{1,15}$/,
    example: 'JohnDoe123',
    category: 'Gaming',
    verificationMethod: 'username'
  },
  {
    id: 'playstation',
    name: 'PlayStation',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/playstation.svg',
    placeholder: 'PSN ID',
    pattern: /^[\w-]{3,16}$/,
    example: 'JohnDoe123',
    category: 'Gaming',
    verificationMethod: 'username'
  },

  // Professional Networks
  {
    id: 'angellist',
    name: 'AngelList',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/angellist.svg',
    placeholder: 'https://angel.co/username',
    pattern: /^https:\/\/(www\.)?angel\.co\/[\w-]+\/?$/,
    example: 'https://angel.co/johndoe',
    category: 'Professional Networks',
    verificationMethod: 'url'
  },
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/crunchbase.svg',
    placeholder: 'https://crunchbase.com/person/username',
    pattern: /^https:\/\/(www\.)?crunchbase\.com\/person\/[\w-]+\/?$/,
    example: 'https://crunchbase.com/person/johndoe',
    category: 'Professional Networks',
    verificationMethod: 'url'
  },

  // E-commerce & Business
  {
    id: 'etsy',
    name: 'Etsy',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/etsy.svg',
    placeholder: 'https://etsy.com/shop/username',
    pattern: /^https:\/\/(www\.)?etsy\.com\/shop\/[\w-]+\/?$/,
    example: 'https://etsy.com/shop/johndoe',
    category: 'E-commerce & Business',
    verificationMethod: 'url'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/shopify.svg',
    placeholder: 'https://username.myshopify.com',
    pattern: /^https:\/\/(www\.)?[\w-]+\.myshopify\.com\/?$/,
    example: 'https://johndoe.myshopify.com',
    category: 'E-commerce & Business',
    verificationMethod: 'url'
  },

  // Education & Learning
  {
    id: 'coursera',
    name: 'Coursera',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/coursera.svg',
    placeholder: 'https://coursera.org/user/username',
    pattern: /^https:\/\/(www\.)?coursera\.org\/user\/[\w-]+\/?$/,
    example: 'https://coursera.org/user/johndoe',
    category: 'Education & Learning',
    verificationMethod: 'url'
  },
  {
    id: 'udemy',
    name: 'Udemy',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/udemy.svg',
    placeholder: 'https://udemy.com/user/username',
    pattern: /^https:\/\/(www\.)?udemy\.com\/user\/[\w-]+\/?$/,
    example: 'https://udemy.com/user/johndoe',
    category: 'Education & Learning',
    verificationMethod: 'url'
  },

  // Fitness & Health
  {
    id: 'strava',
    name: 'Strava',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/strava.svg',
    placeholder: 'https://strava.com/athletes/username',
    pattern: /^https:\/\/(www\.)?strava\.com\/athletes\/[\w-]+\/?$/,
    example: 'https://strava.com/athletes/johndoe',
    category: 'Fitness & Health',
    verificationMethod: 'url'
  },
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/myfitnesspal.svg',
    placeholder: 'Username',
    pattern: /^[\w-]{3,20}$/,
    example: 'johndoe',
    category: 'Fitness & Health',
    verificationMethod: 'username'
  },

  // Travel & Lifestyle
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/airbnb.svg',
    placeholder: 'https://airbnb.com/users/show/username',
    pattern: /^https:\/\/(www\.)?airbnb\.com\/users\/show\/[\w-]+\/?$/,
    example: 'https://airbnb.com/users/show/johndoe',
    category: 'Travel & Lifestyle',
    verificationMethod: 'url'
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tripadvisor.svg',
    placeholder: 'https://tripadvisor.com/members/username',
    pattern: /^https:\/\/(www\.)?tripadvisor\.com\/members\/[\w-]+\/?$/,
    example: 'https://tripadvisor.com/members/johndoe',
    category: 'Travel & Lifestyle',
    verificationMethod: 'url'
  },

  // Personal Website
  {
    id: 'website',
    name: 'Personal Website',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/internetarchive.svg',
    placeholder: 'https://yourwebsite.com',
    pattern: /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/,
    example: 'https://johndoe.com',
    category: 'Personal Website',
    verificationMethod: 'url'
  }
];

export function SocialPlatformsWithLogos({
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [clickedPlatform, setClickedPlatform] = useState<string | null>(null);

  // Validate links on mount and when they change
  useEffect(() => {
    console.log('🔧 SocialPlatformsWithLogos: socialLinks updated:', socialLinks);

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
    console.log('🔧 handleLinkUpdate called:', { platform, value });

    const formattedValue = formatLink(platform, value);

    // Update the link immediately
    const updatedLinks = { ...socialLinks, [platform]: formattedValue };
    console.log('🔧 Updated links:', updatedLinks);
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

  const handlePlatformClick = (platform: SocialPlatform) => {
    console.log('🔧 Platform clicked:', platform);
    console.log('🔧 Current socialLinks:', socialLinks);

    // Show visual feedback
    setClickedPlatform(platform.id);
    setTimeout(() => setClickedPlatform(null), 1000);

    // Add the platform to social links
    const updatedLinks = { ...socialLinks, [platform.id]: '' };
    console.log('🔧 Adding platform to links:', updatedLinks);

    // Force update
    onUpdate(updatedLinks);

    // Show success message
    setError(null);

    console.log('🔧 Platform added successfully');
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
              placeholder="Paste your profile URL (e.g., https://linkedin.com/in/yourname)..."
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
              {quickAddMode ? 'Manual Add' : 'Use Profile Platform Link'}
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {Object.entries(getPlatformsByCategory()).map(([category, platforms]) => (
              <div key={category} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{category}</span>
                  {expandedCategories[category] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedCategories[category] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                        {platforms.map((platform) => (
                          <div key={platform.id} className="relative">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔧 Button clicked for platform:', platform.name);
                                handlePlatformClick(platform);
                              }}
                              className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors w-full ${clickedPlatform === platform.id
                                ? 'border-green-500 bg-green-50 scale-105'
                                : 'border-gray-200 hover:border-purple-600 hover:bg-indigo-50'
                                }`}
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

                            {/* Debug indicator */}
                            {clickedPlatform === platform.id && (
                              <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
