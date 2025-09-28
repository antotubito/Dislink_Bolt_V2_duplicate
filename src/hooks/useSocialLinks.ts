import { useState, useCallback, useEffect } from 'react';
import { 
  validateAndFormatSocialLink, 
  updateSocialLink, 
  batchUpdateSocialLinks,
  getSocialLinkDisplayName,
  isSocialLinkValid,
  getPlatformPlaceholder,
  type SocialLinkValidation
} from '../lib/socialLinksUtils';
import { logger } from '../lib/logger';

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  username: string;
  displayName: string;
  isValid: boolean;
  error?: string;
}

export interface UseSocialLinksOptions {
  initialLinks?: Record<string, string>;
  onUpdate?: (links: Record<string, string>) => void;
  onError?: (errors: Record<string, string>) => void;
  validateOnChange?: boolean;
  debounceMs?: number;
}

export interface UseSocialLinksReturn {
  // State
  links: SocialLink[];
  errors: Record<string, string>;
  isValid: boolean;
  hasChanges: boolean;
  
  // Actions
  addLink: (platform: string, input: string) => Promise<boolean>;
  updateLink: (id: string, input: string) => Promise<boolean>;
  removeLink: (id: string) => void;
  clearErrors: () => void;
  reset: () => void;
  
  // Utilities
  validateLink: (platform: string, input: string) => SocialLinkValidation;
  getPlaceholder: (platform: string) => string;
  getDisplayName: (platform: string, url: string) => string;
  
  // Batch operations
  batchUpdate: (updates: Array<{ platform: string; input: string }>) => Promise<boolean>;
}

export function useSocialLinks(options: UseSocialLinksOptions = {}): UseSocialLinksReturn {
  const {
    initialLinks = {},
    onUpdate,
    onError,
    validateOnChange = true,
    debounceMs = 300
  } = options;

  const [links, setLinks] = useState<SocialLink[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Convert initial links to internal format
  useEffect(() => {
    const convertedLinks: SocialLink[] = Object.entries(initialLinks).map(([platform, url]) => ({
      id: `${platform}-${Date.now()}`,
      platform,
      url,
      username: getSocialLinkDisplayName(platform, url),
      displayName: getSocialLinkDisplayName(platform, url),
      isValid: isSocialLinkValid(platform, url)
    }));
    
    setLinks(convertedLinks);
    setHasChanges(false);
  }, [initialLinks]);

  // Debounced update to parent
  const debouncedUpdate = useCallback((updatedLinks: SocialLink[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const linksObject: Record<string, string> = {};
      updatedLinks.forEach(link => {
        if (link.isValid && link.url.trim()) {
          linksObject[link.platform] = link.url;
        }
      });

      if (onUpdate) {
        onUpdate(linksObject);
      }
      setHasChanges(false);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, debounceMs, onUpdate]);

  // Validate a single link
  const validateLink = useCallback((platform: string, input: string): SocialLinkValidation => {
    return validateAndFormatSocialLink(platform, input);
  }, []);

  // Get placeholder text for a platform
  const getPlaceholder = useCallback((platform: string): string => {
    return getPlatformPlaceholder(platform);
  }, []);

  // Get display name for a link
  const getDisplayName = useCallback((platform: string, url: string): string => {
    return getSocialLinkDisplayName(platform, url);
  }, []);

  // Add a new social link
  const addLink = useCallback(async (platform: string, input: string): Promise<boolean> => {
    try {
      const validation = validateAndFormatSocialLink(platform, input);
      
      if (!validation.isValid) {
        const newErrors = { [platform]: validation.message || `Invalid format for ${platform}` };
        setErrors(prev => ({ ...prev, ...newErrors }));
        if (onError) onError(newErrors);
        return false;
      }

      // Check if platform already exists
      const existingIndex = links.findIndex(link => link.platform === platform);
      
      if (existingIndex >= 0) {
        // Update existing link
        const updatedLinks = [...links];
        updatedLinks[existingIndex] = {
          ...updatedLinks[existingIndex],
          url: validation.formattedUrl || '',
          username: validation.username || '',
          displayName: validation.username || '',
          isValid: true,
          error: undefined
        };
        
        setLinks(updatedLinks);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[platform];
          return newErrors;
        });
        setHasChanges(true);
        debouncedUpdate(updatedLinks);
        return true;
      } else {
        // Add new link
        const newLink: SocialLink = {
          id: `${platform}-${Date.now()}`,
          platform,
          url: validation.formattedUrl || '',
          username: validation.username || '',
          displayName: validation.username || '',
          isValid: true
        };

        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[platform];
          return newErrors;
        });
        setHasChanges(true);
        debouncedUpdate(updatedLinks);
        return true;
      }
    } catch (error) {
      logger.error(`Error adding social link for ${platform}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Error adding ${platform} link`;
      const newErrors = { [platform]: errorMessage };
      setErrors(prev => ({ ...prev, ...newErrors }));
      if (onError) onError(newErrors);
      return false;
    }
  }, [links, onError, debouncedUpdate]);

  // Update an existing social link
  const updateLink = useCallback(async (id: string, input: string): Promise<boolean> => {
    try {
      const linkIndex = links.findIndex(link => link.id === id);
      if (linkIndex === -1) {
        logger.warn(`Link with id ${id} not found`);
        return false;
      }

      const link = links[linkIndex];
      const validation = validateAndFormatSocialLink(link.platform, input);
      
      if (!validation.isValid) {
        const updatedLinks = [...links];
        updatedLinks[linkIndex] = {
          ...updatedLinks[linkIndex],
          isValid: false,
          error: validation.message || `Invalid format for ${link.platform}`
        };
        
        setLinks(updatedLinks);
        setErrors(prev => ({ ...prev, [id]: validation.message || `Invalid format for ${link.platform}` }));
        if (onError) onError({ [id]: validation.message || `Invalid format for ${link.platform}` });
        return false;
      }

      const updatedLinks = [...links];
      updatedLinks[linkIndex] = {
        ...updatedLinks[linkIndex],
        url: validation.formattedUrl || '',
        username: validation.username || '',
        displayName: validation.username || '',
        isValid: true,
        error: undefined
      };

      setLinks(updatedLinks);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
      setHasChanges(true);
      debouncedUpdate(updatedLinks);
      return true;
    } catch (error) {
      logger.error(`Error updating social link ${id}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Error updating link`;
      const newErrors = { [id]: errorMessage };
      setErrors(prev => ({ ...prev, ...newErrors }));
      if (onError) onError(newErrors);
      return false;
    }
  }, [links, onError, debouncedUpdate]);

  // Remove a social link
  const removeLink = useCallback((id: string) => {
    const updatedLinks = links.filter(link => link.id !== id);
    setLinks(updatedLinks);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
    setHasChanges(true);
    debouncedUpdate(updatedLinks);
  }, [links, debouncedUpdate]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    const convertedLinks: SocialLink[] = Object.entries(initialLinks).map(([platform, url]) => ({
      id: `${platform}-${Date.now()}`,
      platform,
      url,
      username: getSocialLinkDisplayName(platform, url),
      displayName: getSocialLinkDisplayName(platform, url),
      isValid: isSocialLinkValid(platform, url)
    }));
    
    setLinks(convertedLinks);
    setErrors({});
    setHasChanges(false);
  }, [initialLinks]);

  // Batch update multiple links
  const batchUpdate = useCallback(async (updates: Array<{ platform: string; input: string }>): Promise<boolean> => {
    try {
      const currentLinksObject: Record<string, string> = {};
      links.forEach(link => {
        if (link.isValid && link.url.trim()) {
          currentLinksObject[link.platform] = link.url;
        }
      });

      const result = batchUpdateSocialLinks(currentLinksObject, updates);
      
      if (!result.success) {
        setErrors(result.errors);
        if (onError) onError(result.errors);
        return false;
      }

      // Convert updated links back to internal format
      const updatedLinks: SocialLink[] = Object.entries(result.updatedLinks).map(([platform, url]) => ({
        id: `${platform}-${Date.now()}`,
        platform,
        url,
        username: getSocialLinkDisplayName(platform, url),
        displayName: getSocialLinkDisplayName(platform, url),
        isValid: true
      }));

      setLinks(updatedLinks);
      setErrors({});
      setHasChanges(true);
      debouncedUpdate(updatedLinks);
      return true;
    } catch (error) {
      logger.error('Error in batch update:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error updating links';
      const newErrors = { batch: errorMessage };
      setErrors(newErrors);
      if (onError) onError(newErrors);
      return false;
    }
  }, [links, onError, debouncedUpdate]);

  // Calculate overall validity
  const isValid = links.length > 0 && links.every(link => link.isValid) && Object.keys(errors).length === 0;

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    // State
    links,
    errors,
    isValid,
    hasChanges,
    
    // Actions
    addLink,
    updateLink,
    removeLink,
    clearErrors,
    reset,
    
    // Utilities
    validateLink,
    getPlaceholder,
    getDisplayName,
    
    // Batch operations
    batchUpdate
  };
}
