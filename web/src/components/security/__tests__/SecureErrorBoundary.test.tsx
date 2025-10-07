import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecureErrorBoundary } from '../SecureErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock Sentry
vi.mock('@dislink/shared/lib/sentry', () => ({
  captureError: vi.fn(),
  captureMessage: vi.fn()
}));

describe('SecureErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <SecureErrorBoundary>
        <div>Test content</div>
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're having trouble loading this part of the application/)).toBeInTheDocument();
  });

  it('should show retry button', () => {
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Try Again (0/3)')).toBeInTheDocument();
  });

  it('should show reload button', () => {
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('should handle retry button click', async () => {
    const { rerender } = render(
      <SecureErrorBoundary resetKeys={['test']}>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    const retryButton = screen.getByText('Try Again (0/3)');
    fireEvent.click(retryButton);

    // Wait for retry to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Rerender with no error
    rerender(
      <SecureErrorBoundary resetKeys={['test']}>
        <ThrowError shouldThrow={false} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle reload button click', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(reloadSpy).toHaveBeenCalled();
    
    reloadSpy.mockRestore();
  });

  it('should show error details in development mode', () => {
    // Mock development environment
    Object.defineProperty(import.meta, 'env', {
      value: { ...import.meta.env, DEV: true },
      writable: true
    });

    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
  });

  it('should not show error details in production mode', () => {
    // Mock production environment
    Object.defineProperty(import.meta, 'env', {
      value: { ...import.meta.env, DEV: false },
      writable: true
    });

    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
  });

  it('should call onError callback when provided', () => {
    const onError = vi.fn();

    render(
      <SecureErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should use custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <SecureErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should reset when resetKeys change', () => {
    const { rerender } = render(
      <SecureErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change resetKeys
    rerender(
      <SecureErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should disable retry button after max retries', async () => {
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    // Click retry 3 times (max retries)
    for (let i = 0; i < 3; i++) {
      const retryButton = screen.getByText(`Try Again (${i}/3)`);
      fireEvent.click(retryButton);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(screen.getByText('Max Retries Reached')).toBeInTheDocument();
  });

  it('should show error ID', () => {
    render(
      <SecureErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SecureErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });
});
