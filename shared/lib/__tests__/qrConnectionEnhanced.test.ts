import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConnectionCode, generateUserQRCode } from '../qrConnectionEnhanced';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Sentry
vi.mock('../sentry', () => ({
  captureError: vi.fn()
}));

describe('qrConnectionEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateConnectionCode', () => {
    it('should return profile data for valid connection code', async () => {
      // Mock successful database response
      const mockProfileData = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Test Company',
        profile_image: 'https://example.com/avatar.jpg',
        bio: { text: 'Test bio' },
        interests: ['Technology', 'Programming'],
        social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
        public_profile: { enabled: true },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockProfileData,
                profiles: mockProfileData
              },
              error: null
            })
          })
        })
      });

      const result = await validateConnectionCode('valid-code-123');

      expect(result).toBeDefined();
      expect(result?.userId).toBe('test-user-id');
      expect(result?.name).toBe('John Doe');
      expect(result?.jobTitle).toBe('Software Engineer');
      expect(result?.company).toBe('Test Company');
      expect(result?.publicProfile?.enabled).toBe(true);
      expect(result?.connectionCode).toBe('valid-code-123');
      expect(result?.publicProfileUrl).toContain('/profile/valid-code-123');
    });

    it('should return expired error for expired connection code', async () => {
      // Mock expired connection code response
      const mockExpiredData = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockExpiredData,
                profiles: mockExpiredData
              },
              error: null
            })
          })
        })
      });

      const result = await validateConnectionCode('expired-code-123');

      expect(result).toEqual({ error: 'expired' });
    });

    it('should return not_public error for profile with public_profile disabled', async () => {
      // Mock profile with public_profile disabled
      const mockPrivateProfile = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        public_profile: { enabled: false }
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockPrivateProfile,
                profiles: mockPrivateProfile
              },
              error: null
            })
          })
        })
      });

      const result = await validateConnectionCode('private-code-123');

      expect(result).toEqual({ error: 'not_public' });
    });

    it('should return null for invalid connection code', async () => {
      // Mock no results for invalid code
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows found' }
            })
          })
        })
      });

      const result = await validateConnectionCode('invalid-code-123');

      expect(result).toBeNull();
    });

    it('should return null for database error', async () => {
      // Mock database error
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      });

      const result = await validateConnectionCode('error-code-123');

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      const result = await validateConnectionCode('network-error-code');

      expect(result).toBeNull();
    });

    it('should construct correct public profile URL with environment variables', async () => {
      // Mock environment variables
      const originalEnv = import.meta.env;
      import.meta.env = {
        ...originalEnv,
        VITE_SITE_URL: 'https://test.example.com'
      };

      const mockProfileData = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        public_profile: { enabled: true },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockProfileData,
                profiles: mockProfileData
              },
              error: null
            })
          })
        })
      });

      const result = await validateConnectionCode('url-test-code');

      expect(result?.publicProfileUrl).toBe('https://test.example.com/profile/url-test-code');

      // Restore original environment
      import.meta.env = originalEnv;
    });

    it('should handle URL with trailing slash correctly', async () => {
      // Mock environment with trailing slash
      const originalEnv = import.meta.env;
      import.meta.env = {
        ...originalEnv,
        VITE_SITE_URL: 'https://test.example.com/'
      };

      const mockProfileData = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        public_profile: { enabled: true },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockProfileData,
                profiles: mockProfileData
              },
              error: null
            })
          })
        })
      });

      const result = await validateConnectionCode('trailing-slash-code');

      expect(result?.publicProfileUrl).toBe('https://test.example.com/profile/trailing-slash-code');

      // Restore original environment
      import.meta.env = originalEnv;
    });
  });

  describe('generateUserQRCode', () => {
    it('should generate QR code for authenticated user', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock profile data
      const mockProfile = {
        id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Test Company',
        profile_image: 'https://example.com/avatar.jpg',
        bio: { text: 'Test bio' },
        interests: ['Technology'],
        social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
        public_profile: { enabled: true }
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { code: 'generated-code-123' },
              error: null
            })
          })
        })
      });

      const result = await generateUserQRCode();

      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user-id');
      expect(result.name).toBe('John Doe');
      expect(result.connectionCode).toMatch(/^conn_\d+_[a-z0-9]+$/);
      expect(result.publicProfileUrl).toContain('/profile/');
    });

    it('should throw error for unauthenticated user', async () => {
      // Mock unauthenticated user
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      await expect(generateUserQRCode()).rejects.toThrow('User must be authenticated to generate QR code');
    });

    it('should throw error when profile not found', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock profile not found
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          })
        })
      });

      await expect(generateUserQRCode()).rejects.toThrow('Profile not found');
    });
  });
});
