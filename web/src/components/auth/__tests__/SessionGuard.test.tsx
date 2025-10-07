import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionGuard } from '../SessionGuard';
import { useAuth } from '../AuthProvider';

// Mock the AuthProvider
vi.mock('../AuthProvider', () => ({
  useAuth: vi.fn()
}));

// Mock logger
vi.mock('@dislink/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  );
};

describe('SessionGuard - Updated Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children immediately for public paths', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children immediately for waitlist path', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/waitlist'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children immediately for login path', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/app/login'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children immediately for confirmed path', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/confirmed'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should show loading for protected paths when AuthProvider is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/app/profile'
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children for protected paths when AuthProvider is not loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      session: { access_token: 'test-token' },
      loading: false,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: true,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/app/profile'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle nested public paths correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/share/abc123'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle nested protected paths correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/app/contacts/123'
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle demo path as public', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/demo'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle verify path as public', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/verify'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle confirm path as public', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      isOwner: false,
      isTestingChannel: false,
      error: null,
      refreshUser: vi.fn(),
      reconnectSupabase: vi.fn(),
      connectionStatus: 'connected' as const,
      invalidateProfileCache: vi.fn()
    });

    renderWithRouter(
      <SessionGuard>
        <TestComponent />
      </SessionGuard>,
      '/confirm'
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
