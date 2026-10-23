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
};
