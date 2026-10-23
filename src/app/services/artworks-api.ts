import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  Author,
  ArtworkDto,
  ArtworkSearchParams,
  CatalogItem,
  PagedResult,
} from '../models/catalog-item';

@Injectable({ providedIn: 'root' })
export class ArtworksApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Search artworks with optional filters and paging. */
  search(params: ArtworkSearchParams = {}): Observable<PagedResult<CatalogItem>> {
    let httpParams = new HttpParams();
    if (params.authorId != null) httpParams = httpParams.set('authorId', params.authorId);
    if (params.mediaType) httpParams = httpParams.set('mediaType', params.mediaType);
    if (params.mediaName) httpParams = httpParams.set('mediaName', params.mediaName);
    if (params.yearFrom != null) httpParams = httpParams.set('yearFrom', params.yearFrom);
    if (params.yearTo != null) httpParams = httpParams.set('yearTo', params.yearTo);
    httpParams = httpParams.set('page', params.page ?? 0);
    httpParams = httpParams.set('size', params.size ?? 20);

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
        catchError(this.handleError('search')),
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
    return this.http
      .get<Author[]>(`${this.baseUrl}/api/authors`)
      .pipe(catchError(this.handleError('authors')));
  }

  /** List all media types, for the filter dropdown. */
  mediaTypes(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.baseUrl}/api/mediatypes`)
      .pipe(catchError(this.handleError('mediaTypes')));
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
