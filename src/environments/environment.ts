/**
 * Development environment.
 *
 * `apiBaseUrl` is empty so requests go to relative paths like `/api/...`.
 * During `ng serve` those are forwarded to the backend by the dev proxy
 * (see proxy.conf.json), which avoids CORS entirely.
 */
export const environment = {
  production: false,
  apiBaseUrl: '',
  /**
   * MOCK FALLBACK (temporary, 500 workaround).
   *
   * When true, ArtworksApi serves dummy data instead of calling the backend,
   * and also recovers to dummy data if a live call errors. Enabled in dev
   * because the backend /api endpoints currently return 500.
   *
   * Set to false (and eventually delete the mock code) once the backend is
   * reliable. See src/app/services/artworks-api.ts and mock-data.ts.
   */
  useMock: true,
};
