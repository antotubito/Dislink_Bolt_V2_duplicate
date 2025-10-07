import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../components/auth/AuthProvider';
import { SecureErrorBoundary } from '../../components/security/SecureErrorBoundary';
import { supabase } from '@dislink/shared/lib/supabase';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

vi.mock('@dislink/shared/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
  captureError: vi.fn(),
  captureMessage: vi.fn(),
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
      <SecureErrorBoundary>
        {children}
      </SecureErrorBoundary>
    </AuthProvider>
  </BrowserRouter>
);

// Component that throws an error
const ErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test security error');
  }
  return <div>No error</div>;
};

describe('Security Integration Tests', () => {
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

  describe('Error Boundary Security', () => {
    it('should handle errors securely without exposing sensitive information', async () => {
      const { captureError } = await import('@dislink/shared/lib/sentry');
      
      render(
        <TestWrapper>
          <ErrorComponent shouldThrow={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      // Verify that error was captured by Sentry
      expect(captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'SecureErrorBoundary',
          errorId: expect.any(String)
        })
      );
    });

    it('should sanitize error messages in production', async () => {
      // Mock production environment
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, PROD: true },
        writable: true
      });

      render(
        <TestWrapper>
          <ErrorComponent shouldThrow={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });

      // In production, error details should not be visible
      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Security', () => {
    it('should handle authentication errors securely', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(
        new Error('Authentication failed')
      );

      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // Should still render content even if auth fails
      await waitFor(() => {
        expect(screen.getByText('Test content')).toBeInTheDocument();
      });
    });

    it('should handle session timeout gracefully', async () => {
      let authStateCallback: any;

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        };
      });

      render(
        <TestWrapper>
          <div>Test content</div>
        </TestWrapper>
      );

      // Simulate session timeout
      authStateCallback('TOKEN_REFRESHED', null);

      await waitFor(() => {
        expect(screen.getByText('Test content')).toBeInTheDocument();
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent XSS attacks in user input', async () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <div>
            <input
              data-testid="test-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div data-testid="display">{value}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');
      const display = screen.getByTestId('display');

      // Try to inject malicious script
      await user.type(input, '<script>alert("xss")</script>');

      // The display should not execute the script
      expect(display.textContent).toBe('<script>alert("xss")</script>');
    });

    it('should validate email input securely', async () => {
      const TestEmailForm = () => {
        const [email, setEmail] = React.useState('');
        const [isValid, setIsValid] = React.useState(false);
        
        const validateEmail = (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          setIsValid(emailRegex.test(email));
        };
        
        return (
          <div>
            <input
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
            />
            <div data-testid="email-status">
              {isValid ? 'Valid' : 'Invalid'}
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestEmailForm />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const status = screen.getByTestId('email-status');

      // Test valid email
      await user.type(emailInput, 'test@example.com');
      expect(status.textContent).toBe('Valid');

      // Test invalid email
      await user.clear(emailInput);
      await user.type(emailInput, 'not-an-email');
      expect(status.textContent).toBe('Invalid');

      // Test malicious email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com<script>alert("xss")</script>');
      expect(status.textContent).toBe('Invalid');
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent rapid successive requests', async () => {
      const { securityRateLimiter } = await import('../../components/security/SecurityUtils');
      
      const key = 'test-rate-limit-key';
      
      // Make requests rapidly
      const results = [];
      for (let i = 0; i < 15; i++) {
        results.push(securityRateLimiter.isAllowed(key));
      }
      
      // First 10 should be allowed, rest should be blocked
      expect(results.slice(0, 10).every(result => result === true)).toBe(true);
      expect(results.slice(10).every(result => result === false)).toBe(true);
    });

    it('should reset rate limit after timeout', async () => {
      const { securityRateLimiter } = await import('../../components/security/SecurityUtils');
      
      const key = 'test-reset-key';
      
      // Exceed rate limit
      for (let i = 0; i < 10; i++) {
        securityRateLimiter.isAllowed(key);
      }
      
      expect(securityRateLimiter.isAllowed(key)).toBe(false);
      
      // Reset
      securityRateLimiter.reset(key);
      
      expect(securityRateLimiter.isAllowed(key)).toBe(true);
    });
  });

  describe('File Upload Security', () => {
    it('should validate file uploads securely', async () => {
      const { validateFileUpload } = await import('../../components/security/SecurityUtils');
      
      // Test valid file
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const validResult = validateFileUpload(validFile);
      expect(validResult.valid).toBe(true);
      
      // Test malicious file
      const maliciousFile = new File(['test'], 'test.exe', { type: 'application/octet-stream' });
      const maliciousResult = validateFileUpload(maliciousFile);
      expect(maliciousResult.valid).toBe(false);
      expect(maliciousResult.error).toBe('File type not allowed');
      
      // Test oversized file
      const oversizedFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      
      const oversizedResult = validateFileUpload(oversizedFile);
      expect(oversizedResult.valid).toBe(false);
      expect(oversizedResult.error).toBe('File size exceeds 10MB limit');
    });
  });

  describe('Environment Security', () => {
    it('should detect insecure environments', async () => {
      const { isSecureEnvironment } = await import('../../components/security/SecurityUtils');
      
      // Test HTTPS
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true
      });
      expect(isSecureEnvironment()).toBe(true);
      
      // Test localhost
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        writable: true
      });
      expect(isSecureEnvironment()).toBe(true);
      
      // Test insecure HTTP
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true
      });
      expect(isSecureEnvironment()).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize objects with sensitive data', async () => {
      const { sanitizeObject } = await import('../../components/security/SecurityUtils');
      
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        token: 'abc123',
        email: 'test@example.com',
        nested: {
          apiKey: 'secret-key',
          publicData: 'safe-data'
        }
      };
      
      const sanitized = sanitizeObject(sensitiveData);
      
      expect(sanitized).toEqual({
        username: 'testuser',
        password: '[REDACTED]',
        token: '[REDACTED]',
        email: 'test@example.com',
        nested: {
          apiKey: '[REDACTED]',
          publicData: 'safe-data'
        }
      });
    });
  });
});
