import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthProvider';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => ({ data: null, error: null }))
                }))
            }))
        }))
    },
    isConnectionHealthy: vi.fn(() => Promise.resolve(true))
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
    }
}));

// Mock userPreferences
vi.mock('../../lib/userPreferences', () => ({
    initUserPreferences: vi.fn(() => Promise.resolve())
}));

// Test component that uses the auth context
function TestComponent() {
    const { user, loading, error, connectionStatus } = useAuth();

    return (
        <div>
            <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
            <div data-testid="user">{user ? user.email : 'No User'}</div>
            <div data-testid="error">{error || 'No Error'}</div>
            <div data-testid="connection">{connectionStatus}</div>
        </div>
    );
}

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
        });
    });

    it('renders without crashing', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('provides auth context to children', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
        expect(screen.getByTestId('user')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('connection')).toBeInTheDocument();
    });

    it('throws error when useAuth is used outside AuthProvider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleSpy.mockRestore();
    });

    it('initializes with correct default values', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            </BrowserRouter>
        );

        expect(screen.getByTestId('user')).toHaveTextContent('No User');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
        expect(screen.getByTestId('connection')).toHaveTextContent('connecting');
    });
});
