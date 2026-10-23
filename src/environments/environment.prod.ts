/**
 * Production environment.
 *
 * Set `apiBaseUrl` to the backend computer's LAN address, e.g.
 * 'http://192.168.1.42:8080'. The backend must send CORS headers that allow
 * the frontend's origin, or be served behind the same origin as the frontend.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://192.168.1.42:8080',
  /**
   * MOCK FALLBACK (temporary, 500 workaround) — OFF in production.
   * Production must always use the real backend; the catchError recovery in
   * ArtworksApi still applies, but dummy data is never served proactively.
   */
  useMock: false,
};
