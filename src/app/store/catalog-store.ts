import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';
import { ArtworksApi } from '../services/artworks-api';
import { ArtworkSearchParams, CatalogItem } from '../models/catalog-item';

interface CatalogState {
  items: CatalogItem[];
  totalElements: number;
  // Filters
  authorId: number | null;
  mediaType: string;
  // Paging
  page: number;
  pageSize: number;
  // Async status
  loading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  items: [],
  totalElements: 0,
  authorId: null,
  mediaType: '',
  page: 0,
  pageSize: 3,
  loading: false,
  error: null,
};

export const CatalogStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    /** The current search parameters derived from filters + paging. */
    searchParams: computed<ArtworkSearchParams>(() => ({
      authorId: store.authorId() ?? undefined,
      mediaType: store.mediaType() || undefined,
      page: store.page(),
      size: store.pageSize(),
    })),
    hasResults: computed(() => store.totalElements() > 0),
  })),

  withMethods((store, api = inject(ArtworksApi)) => {
    /** Fetch the current page of results from the backend. */
    const load = rxMethod<ArtworkSearchParams>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((params) =>
          api.search(params).pipe(
            tap((res) =>
              patchState(store, {
                items: res.items,
                totalElements: res.totalElements,
                loading: false,
              }),
            ),
            catchError((err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Could not load artworks.';
              patchState(store, { items: [], totalElements: 0, loading: false, error: message });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      load,

      setAuthor(authorId: number | null): void {
        patchState(store, { authorId, page: 0 });
        load(store.searchParams());
      },

      setMediaType(mediaType: string): void {
        patchState(store, { mediaType, page: 0 });
        load(store.searchParams());
      },

      clearFilters(): void {
        patchState(store, { authorId: null, mediaType: '', page: 0 });
        load(store.searchParams());
      },

      setPage(page: number, pageSize: number): void {
        patchState(store, { page, pageSize });
        load(store.searchParams());
      },
    };
  }),

  withHooks({
    // Kick off the first load when the store is created.
    onInit(store) {
      store.load(store.searchParams());
    },
  }),
);
