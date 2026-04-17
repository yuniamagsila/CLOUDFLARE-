/**
 * Helpers for configuring the global fetch mock in tests.
 * The global fetch is stubbed in setup.ts using vi.stubGlobal.
 */

export function mockApiOk<T>(data: T): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export function mockApiError(message: string, status = 400): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export function mockApiFail(): void {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error('Network error'),
  );
}

export function getFetchMock(): ReturnType<typeof vi.fn> {
  return global.fetch as ReturnType<typeof vi.fn>;
}
