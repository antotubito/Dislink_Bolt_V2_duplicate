import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PublicProfileUnified } from './PublicProfileUnified';
import { validateConnectionCode } from '@dislink/shared/lib/qrConnectionEnhanced';

// Mock the QR connection functions
vi.mock('@dislink/shared/lib/qrConnectionEnhanced', () => ({
  validateConnectionCode: vi.fn(),
  markQRCodeAsUsed: vi.fn(),
  submitInvitationRequest: vi.fn()
}));

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
  captureError: vi.fn()
}));

// Mock logger
vi.mock('@dislink/shared/lib/logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

// Mock useParams to simulate different connection codes
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => vi.fn()
  };
});

// Helper function to render component with router
const renderWithRouter = (connectionCode: string) => {
  mockUseParams.mockReturnValue({ connectionCode });
  
  return render(
    <BrowserRouter>
      <PublicProfileUnified />
    </BrowserRouter>
  );
};

describe('PublicProfileUnified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (validateConnectionCode as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter('test-code-123');
      
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Success Case', () => {
    it('should render profile data for valid connection code', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        jobTitle: 'Software Engineer',
        company: 'Test Company',
        profileImage: 'https://example.com/avatar.jpg',
        bio: { text: 'Test bio content' },
        interests: ['Technology', 'Programming'],
        socialLinks: { linkedin: 'https://linkedin.com/in/johndoe' },
        publicProfile: { enabled: true },
        connectionCode: 'test-code-123',
        publicProfileUrl: 'https://test.example.com/profile/test-code-123'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('test-code-123');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Test bio content')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Programming')).toBeInTheDocument();
    });

    it('should show social links when available', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        socialLinks: { 
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe'
        },
        publicProfile: { 
          enabled: true,
          defaultSharedLinks: {
            linkedin: true,
            twitter: true
          }
        },
        connectionCode: 'test-code-123',
        publicProfileUrl: 'https://test.example.com/profile/test-code-123'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('test-code-123');

      await waitFor(() => {
        expect(screen.getByText('Connect')).toBeInTheDocument();
      });

      expect(screen.getByText('linkedin')).toBeInTheDocument();
      expect(screen.getByText('twitter')).toBeInTheDocument();
    });

    it('should show invitation form for connection request', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        publicProfile: { enabled: true },
        connectionCode: 'test-code-123',
        publicProfileUrl: 'https://test.example.com/profile/test-code-123'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('test-code-123');

      await waitFor(() => {
        expect(screen.getByText('Connect with John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Request Connection')).toBeInTheDocument();
    });
  });

  describe('Not Public Profile Case', () => {
    it('should show not public message when profile is private', async () => {
      (validateConnectionCode as any).mockResolvedValue(null);

      renderWithRouter('private-code-123');

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText(/Profile not found or not publicly available/)).toBeInTheDocument();
    });

    it('should show specific message for disabled public profile', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        publicProfile: { enabled: false },
        connectionCode: 'private-code-123'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('private-code-123');

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Expired Code Case', () => {
    it('should show expired message for expired connection code', async () => {
      // Mock expired code response
      (validateConnectionCode as any).mockResolvedValue({
        error: 'expired'
      });

      renderWithRouter('expired-code-123');

      await waitFor(() => {
        expect(screen.getByText('QR Code Expired')).toBeInTheDocument();
      });

      expect(screen.getByText(/This QR code has expired/)).toBeInTheDocument();
      expect(screen.getByText(/Ask the profile owner to generate a new QR code/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error message for invalid connection code', async () => {
      (validateConnectionCode as any).mockResolvedValue(null);

      renderWithRouter('invalid-code-123');

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText(/Profile not found or not publicly available/)).toBeInTheDocument();
    });

    it('should show try again button on error', async () => {
      (validateConnectionCode as any).mockResolvedValue(null);

      renderWithRouter('error-code-123');

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      expect(screen.getByText('Go to Dislink')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      (validateConnectionCode as any).mockRejectedValue(new Error('Network error'));

      renderWithRouter('network-error-code');

      await waitFor(() => {
        expect(screen.getByText('Profile Not Found')).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to load profile/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow retry on error', async () => {
      (validateConnectionCode as any)
        .mockResolvedValueOnce(null) // First call fails
        .mockResolvedValueOnce({ // Second call succeeds
          userId: 'test-user-id',
          name: 'John Doe',
          publicProfile: { enabled: true },
          connectionCode: 'retry-code-123'
        });

      renderWithRouter('retry-code-123');

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click try again
      fireEvent.click(screen.getByText('Try Again'));

      // Should show loading again
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle copy link functionality', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        publicProfile: { enabled: true },
        connectionCode: 'copy-test-code'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      renderWithRouter('copy-test-code');

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Copy Link'));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Data Sanitization', () => {
    it('should safely render profile data with null/undefined values', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        jobTitle: null,
        company: undefined,
        bio: null,
        interests: null,
        socialLinks: {},
        publicProfile: { 
          enabled: true,
          allowedFields: {
            bio: true,
            interests: true
          }
        },
        connectionCode: 'sanitize-test-code'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('sanitize-test-code');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should not crash with null/undefined values
      expect(screen.queryByText('About')).not.toBeInTheDocument();
      expect(screen.queryByText('Interests')).not.toBeInTheDocument();
    });

    it('should filter social links based on public profile settings', async () => {
      const mockProfileData = {
        userId: 'test-user-id',
        name: 'John Doe',
        socialLinks: { 
          linkedin: 'https://linkedin.com/in/johndoe',
          twitter: 'https://twitter.com/johndoe',
          private: 'https://private.com/johndoe'
        },
        publicProfile: { 
          enabled: true,
          defaultSharedLinks: {
            linkedin: true,
            twitter: false, // Not shared
            private: false  // Not shared
          }
        },
        connectionCode: 'filter-test-code'
      };

      (validateConnectionCode as any).mockResolvedValue(mockProfileData);

      renderWithRouter('filter-test-code');

      await waitFor(() => {
        expect(screen.getByText('Connect')).toBeInTheDocument();
      });

      // Only linkedin should be visible
      expect(screen.getByText('linkedin')).toBeInTheDocument();
      expect(screen.queryByText('twitter')).not.toBeInTheDocument();
      expect(screen.queryByText('private')).not.toBeInTheDocument();
    });
  });
});
