import { InjectionToken } from '@angular/core';

/**
 * Base URL for the backend API.
 *
 * In development this is '' so requests hit relative paths like `/api/...`,
 * which the dev proxy forwards to the backend (no CORS). In production it is
 * the address configured in environment.prod.ts, selected by the production build.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
