import '@testing-library/jest-dom';

// Stub global fetch so apiRequest() works in tests without a real server
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Default implementation: return empty array with 200
beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => {
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  localStorage.clear();
  sessionStorage.clear();
});

// Keep supabase mock for any remaining direct supabase usage in non-api components/pages
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  isSupabaseConfigured: true,
}));
