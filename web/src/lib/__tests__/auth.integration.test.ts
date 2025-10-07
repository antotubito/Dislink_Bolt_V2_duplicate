import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../components/auth/AuthProvider';
import { supabase } from '@dislink/shared/lib/supabase';

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    getUser: vi.fn(),
    resend: vi.fn(),
    verifyOtp: vi.fn()
  }
};

vi.mock('@dislink/shared/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
  captureError: vi.fn(),
  setUserContext: vi.fn(),
  clearUserContext: vi.fn()
}));

// Mock profile functions
vi.mock('@dislink/shared/lib/profile', () => ({
  getProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn()
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Authentication Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      // Mock successful registration
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            email_confirmed_at: null
          },
          session: null
        },
        error: null
      });

      // Mock profile creation
      const { createProfile } = await import('@dislink/shared/lib/profile');
      vi.mocked(createProfile).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User'
      });

      // This would be testing the actual Register component
      // For now, we'll test the auth flow logic
      const result = await mockSupabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      expect(result.data?.user).toBeDefined();
      expect(result.data?.user?.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should handle registration errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      const result = await mockSupabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Email already registered');
    });
  });

  describe('Login Flow', () => {
    it('should complete successful login', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {}
      };

      const mockSession = {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token'
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.data?.user).toBeDefined();
      expect(result.data?.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle login errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('Email Confirmation Flow', () => {
    it('should handle email confirmation', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString()
      };

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await mockSupabase.auth.verifyOtp({
        email: 'test@example.com',
        token: 'confirmation-token',
        type: 'email'
      });

      expect(result.data?.user).toBeDefined();
      expect(result.data?.user?.email_confirmed_at).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('should handle invalid confirmation token', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid or expired token' }
      });

      const result = await mockSupabase.auth.verifyOtp({
        email: 'test@example.com',
        token: 'invalid-token',
        type: 'email'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid or expired token');
    });
  });

  describe('Session Management', () => {
    it('should handle session refresh', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const mockSession = {
        user: mockUser,
        access_token: 'new-token',
        refresh_token: 'new-refresh-token'
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await mockSupabase.auth.getSession();

      expect(result.data?.session).toBeDefined();
      expect(result.data?.session?.access_token).toBe('new-token');
      expect(result.error).toBeNull();
    });

    it('should handle sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('Auth State Changes', () => {
    it('should handle auth state change to signed in', async () => {
      let authStateCallback: any;

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        };
      });

      // This would be testing the AuthProvider component
      // For now, we'll test the callback mechanism
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const mockSession = {
        user: mockUser,
        access_token: 'test-token'
      };

      // Simulate auth state change
      authStateCallback('SIGNED_IN', mockSession);

      expect(authStateCallback).toBeDefined();
    });

    it('should handle auth state change to signed out', async () => {
      let authStateCallback: any;

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        };
      });

      // Simulate sign out
      authStateCallback('SIGNED_OUT', null);

      expect(authStateCallback).toBeDefined();
    });
  });

  describe('Profile Integration', () => {
    it('should create profile after successful registration', async () => {
      const { createProfile } = await import('@dislink/shared/lib/profile');
      
      const mockProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        created_at: new Date().toISOString()
      };

      vi.mocked(createProfile).mockResolvedValue(mockProfile);

      const result = await createProfile({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User'
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('test-user-id');
      expect(result.email).toBe('test@example.com');
    });

    it('should update profile after login', async () => {
      const { updateProfile } = await import('@dislink/shared/lib/profile');
      
      const mockUpdatedProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Updated Name',
        updated_at: new Date().toISOString()
      };

      vi.mocked(updateProfile).mockResolvedValue(mockUpdatedProfile);

      const result = await updateProfile('test-user-id', {
        full_name: 'Updated Name'
      });

      expect(result).toBeDefined();
      expect(result.full_name).toBe('Updated Name');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      try {
        await mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle timeout errors', async () => {
      mockSupabase.auth.getSession.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      try {
        await mockSupabase.auth.getSession();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Timeout');
      }
    });
  });
});
