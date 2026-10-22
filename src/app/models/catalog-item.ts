/** Raw artwork object as returned by GET /api/artworks/search. */
export interface ArtworkDto {
  id: number;
  imageId: string;
  imageName: string;
  fileName: string;
  width: number;
  height: number;
  year: number | null;
  description: string | null;
  authorId: number | null;
  authorName: string | null;
  mediaId: number | null;
  mediaName: string | null;
  mediaTypeId: number | null;
  mediaType: string | null;
  /** Absolute preview URL from the backend; host is ignored on the client. */
  previewUrl: string | null;
}

/** Paged response envelope from the search endpoint. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Normalized artwork used throughout the UI. */
export interface CatalogItem {
  id: number;
  imageId: string;
  name: string;
  author: string;
  authorId: number | null;
  media: string;
  mediaType: string;
  size: string;
  year: string;
  description: string;
  width: number;
  height: number;
  /** URL of the full preview image, resolved against our API base. */
  previewUrl: string;
  /**
   * Optional explicit OpenSeadragon tile source. When set, the viewer uses it
   * directly (e.g. a DZI URL for a true tiled pyramid) instead of building a
   * simple-image source from `previewUrl`. Used for the built-in demo items.
   */
  tileSourceOverride?: unknown;
}

/** An author entry from GET /api/authors. */
export interface Author {
  id: number;
  author: string;
}

/** A media type entry from GET /api/mediatypes. */
export interface MediaType {
  id: number;
  type: string;
}

/** Filters accepted by the artworks search endpoint. */
export interface ArtworkSearchParams {
  authorId?: number;
  mediaType?: string;
  mediaName?: string;
  yearFrom?: number;
  yearTo?: number;
  page?: number;
  size?: number;
}
