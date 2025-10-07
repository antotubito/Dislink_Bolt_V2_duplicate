import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';
import { supabase } from '@dislink/shared/lib/supabase';

// Mock Supabase with enhanced methods
vi.mock('@dislink/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn()
    }
  },
  isConnectionHealthy: vi.fn(),
  initializeConnection: vi.fn()
}));

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
  captureError: vi.fn(),
  setUserContext: vi.fn(),
  clearUserContext: vi.fn()
}));

// Mock profile functions
vi.mock('@dislink/shared/lib/profile', () => ({
  getCurrentProfile: vi.fn()
}));

// Mock user preferences
vi.mock('@dislink/shared/lib/userPreferences', () => ({
  initUserPreferences: vi.fn()
}));

// Mock logger
vi.mock('@dislink/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

const TestComponent = () => {
  return <div>Test Component</div>;
};

describe('AuthProvider - Updated Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when initialized', async () => {
    // Mock successful session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  it('should handle profile loading with getCurrentProfile', async () => {
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

    const mockProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      onboardingComplete: true
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
    vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile);

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getCurrentProfile).toHaveBeenCalled();
    });
  });

  it('should initialize user preferences', async () => {
    const { initUserPreferences } = await import('@dislink/shared/lib/userPreferences');
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(initUserPreferences).toHaveBeenCalledWith(null);
    });
  });

  it('should handle auth state changes with profile loading', async () => {
    let authStateCallback: any;

    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    };

    const mockSession = {
      user: mockUser,
      access_token: 'test-token'
    };

    const mockProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      onboardingComplete: true
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      };
    });

    const { getCurrentProfile } = await import('@dislink/shared/lib/profile');
    vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    // Simulate auth state change
    authStateCallback('SIGNED_IN', mockSession);

    await waitFor(() => {
      expect(getCurrentProfile).toHaveBeenCalled();
    });
  });

  it('should cleanup subscription on unmount', async () => {
    const unsubscribe = vi.fn();

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe } }
    });

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('should provide correct context values', async () => {
    const TestContextComponent = () => {
      const auth = useAuth();
      
      return (
        <div>
          <div data-testid="loading">{auth.loading.toString()}</div>
          <div data-testid="connection-status">{auth.connectionStatus}</div>
          <div data-testid="is-owner">{auth.isOwner.toString()}</div>
        </div>
      );
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });

    render(
      <AuthProvider>
        <TestContextComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');
      expect(screen.getByTestId('is-owner')).toHaveTextContent('false');
    });
  });
});