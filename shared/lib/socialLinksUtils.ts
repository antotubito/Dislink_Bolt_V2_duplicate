import { logger } from './logger';

// Platform-specific URL patterns that accept both usernames and full URLs
const PLATFORM_PATTERNS = {
  linkedin: {
    username: /^[\w-]+$/,
    url: /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/
  },
  github: {
    username: /^[\w-]+$/,
    url: /^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/
  },
  twitter: {
    username: /^@?[\w]{1,15}$/,
    url: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]{1,15}\/?$/,
    fullUrl: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]{1,15}\/?$/
  },
  instagram: {
    username: /^@?[\w.]+$/,
    url: /^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/
  },
  facebook: {
    username: /^[\w.]+$/,
    url: /^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/
  },
  youtube: {
    username: /^@?[\w-]+$/,
    url: /^https:\/\/(www\.)?youtube\.com\/(@[\w-]+|channel\/[\w-]+|c\/[\w-]+)\/?$/,
    fullUrl: /^https:\/\/(www\.)?youtube\.com\/(@[\w-]+|channel\/[\w-]+|c\/[\w-]+)\/?$/
  },
  tiktok: {
    username: /^@?[\w.]+$/,
    url: /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/?$/
  },
  snapchat: {
    username: /^@?[\w.]+$/,
    url: /^@?[\w.]+$/,
    fullUrl: /^@?[\w.]+$/
  },
  whatsapp: {
    username: /^\+?[\d\s-()]+$/,
    url: /^https:\/\/wa\.me\/\+?[\d]+$/,
    fullUrl: /^https:\/\/wa\.me\/\+?[\d]+$/
  },
  telegram: {
    username: /^@?[\w]+$/,
    url: /^https:\/\/t\.me\/[\w]+$/,
    fullUrl: /^https:\/\/t\.me\/[\w]+$/
  },
  discord: {
    username: /^[\w]+#[\d]{4}$/,
    url: /^[\w]+#[\d]{4}$/,
    fullUrl: /^[\w]+#[\d]{4}$/
  },
  medium: {
    username: /^@?[\w-]+$/,
    url: /^https:\/\/(www\.)?medium\.com\/@[\w-]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?medium\.com\/@[\w-]+\/?$/
  },
  substack: {
    username: /^[\w-]+$/,
    url: /^https:\/\/(www\.)?[\w-]+\.substack\.com\/?$/,
    fullUrl: /^https:\/\/(www\.)?[\w-]+\.substack\.com\/?$/
  },
  twitch: {
    username: /^[\w]+$/,
    url: /^https:\/\/(www\.)?twitch\.tv\/[\w]+\/?$/,
    fullUrl: /^https:\/\/(www\.)?twitch\.tv\/[\w]+\/?$/
  },
  portfolio: {
    username: /^.+$/,
    url: /^https?:\/\/.+/,
    fullUrl: /^https?:\/\/.+/
  },
  website: {
    username: /^.+$/,
    url: /^https?:\/\/.+/,
    fullUrl: /^https?:\/\/.+/
  }
};

// URL formatters to convert username to full URL
const URL_FORMATTERS = {
  linkedin: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?linkedin\.com\/in\//, '');
    return `https://linkedin.com/in/${username}`;
  },
  github: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?github\.com\//, '');
    return `https://github.com/${username}`;
  },
  twitter: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?(twitter\.com|x\.com)\//, '');
    return `https://twitter.com/${username}`;
  },
  instagram: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?instagram\.com\//, '');
    return `https://instagram.com/${username}`;
  },
  facebook: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?facebook\.com\//, '');
    return `https://facebook.com/${username}`;
  },
  youtube: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?youtube\.com\//, '');
    return `https://youtube.com/@${username}`;
  },
  tiktok: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?tiktok\.com\/@/, '');
    return `https://tiktok.com/@${username}`;
  },
  snapchat: (input: string): string => {
    const username = input.replace(/^@/, '');
    return `@${username}`;
  },
  whatsapp: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const phone = input.replace(/[^\d]/g, '');
    return `https://wa.me/${phone}`;
  },
  telegram: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/t\.me\//, '');
    return `https://t.me/${username}`;
  },
  discord: (input: string): string => {
    return input; // Discord usernames are already in the correct format
  },
  medium: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?medium\.com\/@/, '');
    return `https://medium.com/@${username}`;
  },
  substack: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^https:\/\/(www\.)?/, '').replace(/\.substack\.com.*$/, '');
    return `https://${username}.substack.com`;
  },
  twitch: (input: string): string => {
    if (input.startsWith('https://')) return input;
    const username = input.replace(/^@/, '').replace(/^https:\/\/(www\.)?twitch\.tv\//, '');
    return `https://twitch.tv/${username}`;
  },
  portfolio: (input: string): string => {
    if (input.startsWith('http')) return input;
    return `https://${input}`;
  },
  website: (input: string): string => {
    if (input.startsWith('http')) return input;
    return `https://${input}`;
  }
};

// Username extractors to get clean usernames from URLs
const USERNAME_EXTRACTORS = {
  linkedin: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
  },
  github: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '');
  },
  twitter: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?(twitter\.com|x\.com)\//, '').replace(/\/$/, '');
  },
  instagram: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
  },
  facebook: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '');
  },
  youtube: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?youtube\.com\/(@|channel\/|c\/)/, '').replace(/\/$/, '');
  },
  tiktok: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?tiktok\.com\/@/, '').replace(/\/$/, '');
  },
  snapchat: (url: string): string => {
    return url.replace(/^@/, '');
  },
  whatsapp: (url: string): string => {
    return url.replace(/^https:\/\/wa\.me\//, '');
  },
  telegram: (url: string): string => {
    return url.replace(/^https:\/\/t\.me\//, '');
  },
  discord: (url: string): string => {
    return url; // Discord usernames are already in the correct format
  },
  medium: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?medium\.com\/@/, '').replace(/\/$/, '');
  },
  substack: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?/, '').replace(/\.substack\.com.*$/, '');
  },
  twitch: (url: string): string => {
    return url.replace(/^https:\/\/(www\.)?twitch\.tv\//, '').replace(/\/$/, '');
  },
  portfolio: (url: string): string => {
    return url.replace(/^https?:\/\//, '');
  },
  website: (url: string): string => {
    return url.replace(/^https?:\/\//, '');
  }
};

export interface SocialLinkValidation {
  isValid: boolean;
  message?: string;
  formattedUrl?: string;
  username?: string;
}

export interface SocialLinkUpdate {
  platform: string;
  url: string;
  username: string;
}

/**
 * Validates and formats social media input (username or URL)
 * @param platform - The social media platform
 * @param input - The user input (username or URL)
 * @returns Validation result with formatted URL and username
 */
export function validateAndFormatSocialLink(
  platform: string,
  input: string
): SocialLinkValidation {
  if (!input || !input.trim()) {
    return { isValid: true, formattedUrl: '', username: '' };
  }

  const trimmedInput = input.trim();
  const platformPatterns = PLATFORM_PATTERNS[platform as keyof typeof PLATFORM_PATTERNS];
  const formatter = URL_FORMATTERS[platform as keyof typeof URL_FORMATTERS];
  const extractor = USERNAME_EXTRACTORS[platform as keyof typeof USERNAME_EXTRACTORS];

  if (!platformPatterns || !formatter || !extractor) {
    logger.warn(`Unknown platform: ${platform}`);
    return {
      isValid: false,
      message: `Unsupported platform: ${platform}`
    };
  }

  // Check if input is a valid username or URL
  const isUsername = platformPatterns.username.test(trimmedInput);
  const isUrl = platformPatterns.url.test(trimmedInput);

  if (!isUsername && !isUrl) {
    return {
      isValid: false,
      message: `Invalid format for ${platform}. Please enter a valid username or URL.`
    };
  }

  try {
    // Format the input to a proper URL
    const formattedUrl = formatter(trimmedInput);
    const username = extractor(formattedUrl);

    return {
      isValid: true,
      formattedUrl,
      username
    };
  } catch (error) {
    logger.error(`Error formatting ${platform} link:`, error);
    return {
      isValid: false,
      message: `Error processing ${platform} link. Please try again.`
    };
  }
}

/**
 * Updates social links in formData with proper validation and formatting
 * @param currentLinks - Current social links object
 * @param platform - The platform to update
 * @param input - The user input (username or URL)
 * @returns Updated social links object
 */
export function updateSocialLink(
  currentLinks: Record<string, string>,
  platform: string,
  input: string
): Record<string, string> {
  const validation = validateAndFormatSocialLink(platform, input);
  
  if (!validation.isValid) {
    logger.warn(`Invalid social link for ${platform}:`, validation.message);
    throw new Error(validation.message || `Invalid format for ${platform}`);
  }

  const updatedLinks = { ...currentLinks };
  
  if (validation.formattedUrl) {
    updatedLinks[platform] = validation.formattedUrl;
  } else {
    // Remove the platform if no valid URL
    delete updatedLinks[platform];
  }

  return updatedLinks;
}

/**
 * Batch update multiple social links with validation
 * @param currentLinks - Current social links object
 * @param updates - Array of platform and input pairs
 * @returns Updated social links object and any validation errors
 */
export function batchUpdateSocialLinks(
  currentLinks: Record<string, string>,
  updates: Array<{ platform: string; input: string }>
): {
  updatedLinks: Record<string, string>;
  errors: Record<string, string>;
  success: boolean;
} {
  const updatedLinks = { ...currentLinks };
  const errors: Record<string, string> = {};
  let hasErrors = false;

  for (const update of updates) {
    try {
      const validation = validateAndFormatSocialLink(update.platform, update.input);
      
      if (!validation.isValid) {
        errors[update.platform] = validation.message || `Invalid format for ${update.platform}`;
        hasErrors = true;
        continue;
      }

      if (validation.formattedUrl) {
        updatedLinks[update.platform] = validation.formattedUrl;
      } else {
        delete updatedLinks[update.platform];
      }
    } catch (error) {
      errors[update.platform] = error instanceof Error ? error.message : `Error processing ${update.platform}`;
      hasErrors = true;
    }
  }

  return {
    updatedLinks,
    errors,
    success: !hasErrors
  };
}

/**
 * Get a user-friendly display name for a social link
 * @param platform - The platform
 * @param url - The full URL
 * @returns Display name (username or formatted name)
 */
export function getSocialLinkDisplayName(platform: string, url: string): string {
  const extractor = USERNAME_EXTRACTORS[platform as keyof typeof USERNAME_EXTRACTORS];
  if (!extractor) return url;

  try {
    const username = extractor(url);
    return username || url;
  } catch (error) {
    logger.error(`Error extracting username for ${platform}:`, error);
    return url;
  }
}

/**
 * Check if a social link is valid without throwing errors
 * @param platform - The platform
 * @param input - The user input
 * @returns True if valid, false otherwise
 */
export function isSocialLinkValid(platform: string, input: string): boolean {
  const validation = validateAndFormatSocialLink(platform, input);
  return validation.isValid;
}

/**
 * Get all supported platforms
 * @returns Array of supported platform names
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORM_PATTERNS);
}

/**
 * Get platform-specific placeholder text
 * @param platform - The platform
 * @returns Placeholder text for the input field
 */
export function getPlatformPlaceholder(platform: string): string {
  const placeholders: Record<string, string> = {
    linkedin: 'Enter username (e.g., antoniotubito) or full URL',
    github: 'Enter username (e.g., antoniotubito) or full URL',
    twitter: 'Enter username (e.g., @antoniotubito) or full URL',
    instagram: 'Enter username (e.g., @antoniotubito) or full URL',
    facebook: 'Enter username (e.g., antoniotubito) or full URL',
    youtube: 'Enter username (e.g., @antoniotubito) or full URL',
    tiktok: 'Enter username (e.g., @antoniotubito) or full URL',
    snapchat: 'Enter username (e.g., @antoniotubito)',
    whatsapp: 'Enter phone number (e.g., +1234567890)',
    telegram: 'Enter username (e.g., @antoniotubito) or full URL',
    discord: 'Enter username (e.g., username#1234)',
    medium: 'Enter username (e.g., @antoniotubito) or full URL',
    substack: 'Enter username (e.g., antoniotubito) or full URL',
    twitch: 'Enter username (e.g., antoniotubito) or full URL',
    portfolio: 'Enter website URL (e.g., antoniotubito.com)',
    website: 'Enter website URL (e.g., antoniotubito.com)'
  };

  return placeholders[platform] || 'Enter username or full URL';
}
