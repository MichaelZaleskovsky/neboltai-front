import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { ArtworksApi } from '../../services/artworks-api';
import { CatalogStore } from '../../store/catalog-store';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly api = inject(ArtworksApi);

  /** Catalog search state (filters, paging, results) via NgRx SignalStore. */
  protected readonly store = inject(CatalogStore);

  protected readonly filters = new FormGroup({
    authorId: new FormControl<number | null>(this.store.authorId()),
    mediaType: new FormControl(this.store.mediaType(), { nonNullable: true }),
    mediaName: new FormControl(this.store.mediaName(), { nonNullable: true }),
    yearFrom: new FormControl<number | null>(this.store.yearFrom()),
    yearTo: new FormControl<number | null>(this.store.yearTo()),
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.store.totalElements() / this.store.pageSize())),
  );

  protected readonly pageNumbers = computed(() => {
    const last = this.pageCount();
    const current = this.store.page() + 1;
    const pages: (number | '…')[] = [];
    const candidates = last <= 7
      ? Array.from({ length: last }, (_, index) => index + 1)
      : [...new Set([1, current - 1, current, current + 1, last])]
          .filter((page) => page >= 1 && page <= last)
          .sort((a, b) => a - b);
    let previous = 0;

    for (const page of candidates) {
      if (page - previous === 2) pages.push(previous + 1);
      else if (page - previous > 2) pages.push('…');
      pages.push(page);
      previous = page;
    }
    return pages;
  });

  /** Author dropdown options (reference data, fetched directly). */
  protected readonly authorsResource = rxResource({
    stream: () => this.api.authors(),
    defaultValue: [],
  });

  /** Media type dropdown options (reference data, fetched directly). */
  protected readonly mediaTypesResource = rxResource({
    stream: () => this.api.mediaTypes(),
    defaultValue: [],
  });

  protected applyFilters(): void {
    const filters = this.filters.getRawValue();
    if (this.filters.valid &&
        [filters.yearFrom, filters.yearTo].every((year) => year === null || Number.isInteger(year))) {
      this.store.applyFilters(filters);
    }
  }

  protected clearFilters(): void {
    this.filters.reset({ authorId: null, mediaType: '', mediaName: '', yearFrom: null, yearTo: null });
  }

  protected goToPage(page: number): void {
    if (Number.isInteger(page) && page >= 1 && page <= this.pageCount() &&
        page !== this.store.page() + 1) {
      this.store.setPage(page - 1, this.store.pageSize());
    }
  }

  protected onPageSizeChange(value: string): void {
    const size = Number(value);
    if ([3, 5, 10].includes(size) && size !== this.store.pageSize()) {
      this.store.setPage(0, size);
    }
  }
}
