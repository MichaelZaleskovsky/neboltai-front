import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { environment } from '../../environments/environment';
import {
  Author,
  ArtworkDto,
  ArtworkSearchParams,
  CatalogItem,
  PagedResult,
} from '../models/catalog-item';
// --- MOCK FALLBACK (temporary): dummy data used when the backend returns 500 ---
// Added so the UI keeps working while the backend /api endpoints are failing.
// Remove this import and the `environment.useMock` branches below once the
// backend is reliable. See src/app/services/mock-data.ts.
import { MOCK_AUTHORS, MOCK_MEDIA_TYPES, mockPagedItems } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ArtworksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Search artworks with optional filters and paging. */
  search(params: ArtworkSearchParams = {}): Observable<PagedResult<CatalogItem>> {
    const page = params.page ?? 0;
    const size = params.size ?? 20;

    // MOCK FALLBACK (temporary, 500 workaround):
    // When environment.useMock is true, skip the backend entirely and return
    // dummy data. This is what lets the catalog render while /api/artworks/search
    // returns 500. Toggle in src/environments/environment.ts (dev: true).
    if (environment.useMock) {
      return of(mockPagedItems(page, size));
    }

    let httpParams = new HttpParams();
    if (params.authorId != null) httpParams = httpParams.set('authorId', params.authorId);
    if (params.mediaType) httpParams = httpParams.set('mediaType', params.mediaType);
    if (params.mediaName) httpParams = httpParams.set('mediaName', params.mediaName);
    if (params.yearFrom != null) httpParams = httpParams.set('yearFrom', params.yearFrom);
    if (params.yearTo != null) httpParams = httpParams.set('yearTo', params.yearTo);
    httpParams = httpParams.set('page', page);
    httpParams = httpParams.set('size', size);

    return this.http
      .get<PagedResult<ArtworkDto>>(`${this.baseUrl}/api/artworks/search`, { params: httpParams })
      .pipe(
        map((res) => {
          const backendItems = res.items.map((dto) => this.toCatalogItem(dto));
          return {
            ...res,
            items: backendItems,
            totalElements: res.totalElements,
          };
        }),
        // MOCK FALLBACK (temporary, 500 workaround):
        // Even with useMock off, if the live backend errors (500) or is
        // unreachable, recover to dummy data instead of surfacing the error,
        // so the page still shows something. Remove to let 500s surface again.
        catchError((err) => {
          console.warn('[ArtworksApi] search failed, serving mock data:', err);
          return of(mockPagedItems(page, size));
        }),
      );
  }

  /**
   * Fetch a single artwork by numeric id.
   *
   * Tries the dedicated `/api/artworks/{id}` endpoint first; if that is not
   * available (e.g. 404), falls back to the search endpoint and picks the
   * matching item, so the product page works regardless of backend shape.
   */
  getById(id: number): Observable<CatalogItem> {
    // The backend has no GET /api/artworks/{id}, so resolve via search.
    return this.findViaSearch(id);
  }

  private findViaSearch(id: number): Observable<CatalogItem> {
    // Inherits the MOCK FALLBACK: search() returns dummy items on a 500, so the
    // product page resolves a mock artwork too — no extra handling needed here.
    return this.search({ page: 0, size: 500 }).pipe(
      map((res) => {
        const found = res.items.find((i) => Number(i.id) === Number(id));
        if (!found) {
          const ids = res.items.map((i) => i.id).join(', ');
          throw new Error(`Artwork ${id} not found. Available ids: [${ids}]`);
        }
        return found;
      }),
    );
  }

  /** List all authors, for the filter dropdown. */
  authors(): Observable<Author[]> {
    // MOCK FALLBACK (temporary, 500 workaround) — see search() above.
    if (environment.useMock) {
      return of(MOCK_AUTHORS);
    }
    return this.http.get<Author[]>(`${this.baseUrl}/api/authors`).pipe(
      // Recover to dummy authors on backend error so the dropdown isn't empty.
      catchError((err) => {
        console.warn('[ArtworksApi] authors failed, serving mock data:', err);
        return of(MOCK_AUTHORS);
      }),
    );
  }

  /** List all media types, for the filter dropdown. */
  mediaTypes(): Observable<string[]> {
    // MOCK FALLBACK (temporary, 500 workaround) — see search() above.
    if (environment.useMock) {
      return of(MOCK_MEDIA_TYPES);
    }
    return this.http.get<string[]>(`${this.baseUrl}/api/mediatypes`).pipe(
      // Recover to dummy media types on backend error.
      catchError((err) => {
        console.warn('[ArtworksApi] mediaTypes failed, serving mock data:', err);
        return of(MOCK_MEDIA_TYPES);
      }),
    );
  }

  /** The full preview image URL for an artwork, resolved against our API base. */
  previewUrl(imageId: string): string {
    return `${this.baseUrl}/api/artworks/preview/${imageId}`;
  }

  /**
   * URL for a crop of an image region, in original pixels, scaled to
   * `targetWidth`. Backs the custom deep-zoom tile source.
   */
  cropUrl(
    imageId: string,
    region: { x: number; y: number; width: number; height: number; targetWidth: number },
  ): string {
    const q = new HttpParams()
      .set('x', region.x)
      .set('y', region.y)
      .set('width', region.width)
      .set('height', region.height)
      .set('targetWidth', region.targetWidth);
    return `${this.baseUrl}/api/images/${imageId}/crop?${q.toString()}`;
  }

  /** Convert HttpErrorResponse (or unknown) into a proper Error for rxResource/UI. */
  private handleError(op: string) {
    return (err: HttpErrorResponse | unknown) => {
      if (err && typeof err === 'object' && 'status' in (err as any)) {
        const e = err as HttpErrorResponse;
        const status = `${e.status} ${e.statusText || ''}`.trim();
        const msg =
          typeof e.error === 'object' && e.error && 'message' in e.error
            ? String((e.error as any).message)
            : '';
        const detail = msg ? ` - ${msg}` : '';
        return throwError(() => new Error(`${op} failed: ${status}${detail}`));
      }
      return throwError(() => new Error(`${op} failed`));
    };
  }

  private toCatalogItem(dto: ArtworkDto): CatalogItem {
    return {
      id: dto.id,
      imageId: dto.imageId,
      name: dto.imageName,
      author: dto.authorName ?? 'Unknown',
      authorId: dto.authorId,
      media: dto.mediaName ?? '',
      mediaType: dto.mediaType ?? '',
      size: dto.width && dto.height ? `${dto.width} × ${dto.height} px` : '',
      year: dto.year != null ? String(dto.year) : '',
      description: dto.description ?? '',
      width: dto.width,
      height: dto.height,
      // Ignore the backend's own host in previewUrl; build from imageId against our base.
      previewUrl: this.previewUrl(dto.imageId),
    };
  }
}
