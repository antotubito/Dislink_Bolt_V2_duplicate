// src/__mocks__/supabase.ts
import { vi } from 'vitest'

export const supabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id', email: 'test@example.com' } },
            error: null
        }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
        })),
        getSession: vi.fn(),
    },
    from: vi.fn(() => {
        const mockQuery = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }

        // Override mockReturnThis to actually return the mockQuery object
        const chainableMethods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit']
        chainableMethods.forEach(method => {
            const originalMock = mockQuery[method as keyof typeof mockQuery] as any
            originalMock.mockReturnThis = () => mockQuery
            originalMock.mockReturnValue = (value: any) => {
                if (value === mockQuery) {
                    return originalMock
                }
                return originalMock
            }
        })

        return mockQuery
    }),
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn(),
            download: vi.fn(),
            remove: vi.fn(),
            getPublicUrl: vi.fn(),
        })),
    },
}

export const getSafeSession = vi.fn()
export const waitForSupabaseReady = vi.fn()
export const isSupabaseSessionReady = vi.fn(() => true)
export const handleSupabaseError = vi.fn((error) => error.message)
