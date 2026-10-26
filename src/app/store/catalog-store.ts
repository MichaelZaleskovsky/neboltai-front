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
  mediaName: string;
  yearFrom: number | null;
  yearTo: number | null;
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
  mediaName: '',
  yearFrom: null,
  yearTo: null,
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
      mediaName: store.mediaName().trim() || undefined,
      yearFrom: store.yearFrom() ?? undefined,
      yearTo: store.yearTo() ?? undefined,
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
              console.error('[CatalogStore] search failed:', err);
              patchState(store, {
                items: [],
                totalElements: 0,
                loading: false,
                // Store the i18n key — the template pipes it through transloco.
                error: 'CATALOG.LOAD_ERROR',
              });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      load,

      applyFilters(filters: Pick<CatalogState, 'authorId' | 'mediaType' | 'mediaName' | 'yearFrom' | 'yearTo'>): void {
        patchState(store, { ...filters, page: 0 });
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
