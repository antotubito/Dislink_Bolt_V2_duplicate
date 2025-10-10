import { vi } from 'vitest';

// Create a comprehensive Supabase mock with proper chaining
export const createMockSupabaseClient = () => {
  const createMockQuery = () => {
    const mockQuery = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      neq: vi.fn(),
      gt: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      lte: vi.fn(),
      like: vi.fn(),
      ilike: vi.fn(),
      is: vi.fn(),
      in: vi.fn(),
      contains: vi.fn(),
      containedBy: vi.fn(),
      rangeGt: vi.fn(),
      rangeGte: vi.fn(),
      rangeLt: vi.fn(),
      rangeLte: vi.fn(),
      rangeAdjacent: vi.fn(),
      overlaps: vi.fn(),
      textSearch: vi.fn(),
      match: vi.fn(),
      not: vi.fn(),
      or: vi.fn(),
      filter: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      range: vi.fn(),
      abortSignal: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      csv: vi.fn(),
      geojson: vi.fn(),
      explain: vi.fn(),
      rollback: vi.fn(),
      returns: vi.fn(),
      then: vi.fn(),
      catch: vi.fn(),
      finally: vi.fn()
    };

    // Chain all methods to return the same object
    Object.keys(mockQuery).forEach(key => {
      if (typeof mockQuery[key as keyof typeof mockQuery] === 'function') {
        (mockQuery[key as keyof typeof mockQuery] as any).mockReturnValue(mockQuery);
      }
    });

    return mockQuery;
  };

  return {
    from: vi.fn(() => createMockQuery()),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      refreshSession: vi.fn()
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
        move: vi.fn(),
        copy: vi.fn(),
        update: vi.fn()
      }))
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        send: vi.fn(),
        track: vi.fn(),
        untrack: vi.fn()
      })),
      removeChannel: vi.fn(),
      removeAllChannels: vi.fn(),
      getChannels: vi.fn()
    }
  };
};

export const mockSupabase = createMockSupabaseClient();
