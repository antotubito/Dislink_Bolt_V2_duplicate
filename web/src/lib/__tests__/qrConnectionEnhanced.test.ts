import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConnectionCode, generateUserQRCode } from '@dislink/shared/lib/qrConnectionEnhanced';
import { mockSupabase } from '../../test/mocks/supabase';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SITE_URL: 'https://test.example.com',
    VITE_APP_URL: 'https://test.example.com',
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

// Mock logger
vi.mock('@dislink/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
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

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
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
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            profiles: {
              id: 'test-user-id',
              user_id: 'test-user-id',
              first_name: 'John',
              last_name: 'Doe',
              job_title: 'Software Engineer',
              company: 'Test Company',
              profile_image: 'https://example.com/avatar.jpg',
              bio: { text: 'Test bio' },
              interests: ['Technology', 'Programming'],
              social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
              public_profile: { enabled: true }
            }
          },
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

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

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: 'test-user-id',
            first_name: 'John',
            last_name: 'Doe',
            expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            profiles: {
              id: 'test-user-id',
              user_id: 'test-user-id',
              first_name: 'John',
              last_name: 'Doe',
              public_profile: { enabled: true }
            }
          },
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await validateConnectionCode('expired-code-123');

      expect(result).toBeNull();
    });

    it('should return not_public error for profile with public_profile disabled', async () => {
      // Mock profile with public_profile disabled
      const mockPrivateProfile = {
        user_id: 'test-user-id',
        first_name: 'John',
        last_name: 'Doe',
        public_profile: { enabled: false }
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            user_id: 'test-user-id',
            first_name: 'John',
            last_name: 'Doe',
            public_profile: { enabled: false },
            profiles: {
              id: 'test-user-id',
              user_id: 'test-user-id',
              first_name: 'John',
              last_name: 'Doe',
              public_profile: { enabled: false }
            }
          },
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await validateConnectionCode('private-code-123');

      expect(result).toBeNull();
    });

    it('should return null for invalid connection code', async () => {
      // Mock no results for invalid code
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' }
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await validateConnectionCode('invalid-code-123');

      expect(result).toBeNull();
    });

    it('should return null for database error', async () => {
      // Mock database error
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await validateConnectionCode('error-code-123');

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error'))
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await validateConnectionCode('network-error-code');

      expect(result).toBeNull();
    });
  });

  describe('generateUserQRCode', () => {
    it('should generate QR code for authenticated user', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
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

      // Create separate mock queries for different tables
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      };

      const mockUpsertQuery = {
        select: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { code: 'generated-code-123' },
          error: null
        })
      };

      // Mock the rpc call for tracking
      mockSupabase.rpc.mockResolvedValue({
        data: 'scan-id-123',
        error: null
      });

      // Setup the from mock to return different queries based on table
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return mockProfileQuery;
        } else if (table === 'connection_codes') {
          return mockUpsertQuery;
        }
        return mockSupabase.from();
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
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      await expect(generateUserQRCode()).rejects.toThrow('User must be authenticated to generate QR code');
    });

    it('should throw error when profile not found', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      // Mock profile not found
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      };

      mockSupabase.from.mockReturnValue(mockProfileQuery);

      await expect(generateUserQRCode()).rejects.toThrow('Profile not found');
    });
  });
});