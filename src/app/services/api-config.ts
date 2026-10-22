import { InjectionToken } from '@angular/core';

/**
 * Base URL for the backend API.
 *
 * In development this is '' so requests hit relative paths like `/api/...`,
 * which the dev proxy forwards to the backend (no CORS). In production it is
 * the backend computer's LAN address, e.g. 'http://192.168.8.104:8080'.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
