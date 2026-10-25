import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CatalogItem } from '../../models/catalog-item';

/**
 * A single catalog result: thumbnail + metadata list.
 *
 * Presentational and standalone — it takes one CatalogItem and renders it,
 * holding no data-fetching or routing logic of its own beyond the detail link.
 */
@Component({
  selector: 'app-catalog-item-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './catalog-item-card.html',
  styleUrl: './catalog-item-card.scss',
})
export class CatalogItemCard {
  /** The artwork to display. */
  readonly item = input.required<CatalogItem>();
}
