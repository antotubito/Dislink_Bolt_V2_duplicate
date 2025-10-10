/**
 * QR Flow Unit Tests
 * Tests for QR code generation, validation, and public profile display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConnectionCode, generateUserQRCode } from '@dislink/shared/lib/qrConnectionEnhanced';

// Mock Supabase client
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

// Mock the supabase module
vi.mock('@dislink/shared/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_SITE_URL: 'https://dislinkboltv2duplicate.netlify.app',
  VITE_APP_URL: 'https://dislinkboltv2duplicate.netlify.app'
}));

describe('QR Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateConnectionCode', () => {
    it('should return profile data for valid connection code', async () => {
      const mockProfileData = {
        user_id: 'user-123',
        profile_id: 'profile-123',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        profile_image: 'https://example.com/avatar.jpg',
        bio: { text: 'Hello world' },
        interests: ['coding', 'music'],
        social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
        public_profile: { enabled: true, allowedFields: { bio: true } },
        code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockProfileData],
        error: null
      });

      const result = await validateConnectionCode('valid-code-123');

      expect(result).toEqual({
        userId: 'user-123',
        name: 'John Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        profileImage: 'https://example.com/avatar.jpg',
        bio: { text: 'Hello world' },
        interests: ['coding', 'music'],
        socialLinks: { linkedin: 'https://linkedin.com/in/johndoe' },
        publicProfile: { enabled: true, allowedFields: { bio: true } },
        connectionCode: 'valid-code-123',
        publicProfileUrl: 'https://dislinkboltv2duplicate.netlify.app/profile/valid-code-123'
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_connection_code_with_profile', {
        connection_code: 'valid-code-123'
      });
    });

    it('should return null for invalid connection code', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await validateConnectionCode('invalid-code');

      expect(result).toBeNull();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_connection_code_with_profile', {
        connection_code: 'invalid-code'
      });
    });

    it('should return null for expired connection code', async () => {
      const mockExpiredData = {
        user_id: 'user-123',
        profile_id: 'profile-123',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        profile_image: null,
        bio: null,
        interests: [],
        social_links: {},
        public_profile: { enabled: true },
        code_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expired
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockExpiredData],
        error: null
      });

      const result = await validateConnectionCode('expired-code');

      expect(result).toBeNull();
    });

    it('should return null for database error', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await validateConnectionCode('error-code');

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const result = await validateConnectionCode('network-error-code');

      expect(result).toBeNull();
    });
  });

  describe('generateUserQRCode', () => {
    it('should generate QR code for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      const mockProfile = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        profile_image: 'https://example.com/avatar.jpg',
        bio: { text: 'Hello world' },
        interests: ['coding', 'music'],
        social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
        public_profile: { enabled: true }
      };

      const mockConnectionCode = {
        id: 'code-123',
        code: 'generated-code-123',
        user_id: 'user-123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Mock auth.getUser
      mockSupabase.auth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      };

      // Mock profile query
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null
      });

      // Mock connection code upsert
      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: mockConnectionCode,
        error: null
      });

      const result = await generateUserQRCode();

      expect(result).toEqual({
        userId: 'user-123',
        name: 'John Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        profileImage: 'https://example.com/avatar.jpg',
        bio: { text: 'Hello world' },
        interests: ['coding', 'music'],
        socialLinks: { linkedin: 'https://linkedin.com/in/johndoe' },
        publicProfile: { enabled: true },
        connectionCode: 'generated-code-123',
        publicProfileUrl: 'https://dislinkboltv2duplicate.netlify.app/profile/generated-code-123'
      });
    });

    it('should throw error for unauthenticated user', async () => {
      mockSupabase.auth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' }
        })
      };

      await expect(generateUserQRCode()).rejects.toThrow('User must be authenticated to generate QR code');
    });

    it('should handle profile not found error', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      mockSupabase.auth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      });

      await expect(generateUserQRCode()).rejects.toThrow();
    });
  });

  describe('URL Construction', () => {
    it('should use VITE_SITE_URL when available', async () => {
      const mockProfileData = {
        user_id: 'user-123',
        profile_id: 'profile-123',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        profile_image: null,
        bio: null,
        interests: [],
        social_links: {},
        public_profile: { enabled: true },
        code_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      mockSupabase.rpc.mockResolvedValue({
        data: [mockProfileData],
        error: null
      });

      const result = await validateConnectionCode('test-code');

      expect(result?.publicProfileUrl).toBe('https://dislinkboltv2duplicate.netlify.app/profile/test-code');
    });
  });
});
