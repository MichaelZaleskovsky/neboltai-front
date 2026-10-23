import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslocoPipe } from '@jsverse/transloco';
import { ArtworksApi } from '../../services/artworks-api';
import { CatalogStore } from '../../store/catalog-store';

@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatPaginatorModule, TranslocoPipe],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly api = inject(ArtworksApi);

  /** Catalog search state (filters, paging, results) via NgRx SignalStore. */
  protected readonly store = inject(CatalogStore);

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

  protected onAuthorChange(value: string): void {
    this.store.setAuthor(value ? Number(value) : null);
  }

  protected onMediaTypeChange(value: string): void {
    this.store.setMediaType(value);
  }

  protected clearFilters(): void {
    this.store.clearFilters();
  }

  protected onPage(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
  }
}
