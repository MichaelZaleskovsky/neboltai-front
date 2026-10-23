import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ArtworksApi } from '../../services/artworks-api';

@Component({
  selector: 'app-admin-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage {
  private readonly api = inject(ArtworksApi);

  /** Real artworks from the backend, listed for reference. */
  protected readonly artworksResource = rxResource({
    params: () => ({ page: 0, size: 100 }),
    stream: ({ params }) => this.api.search(params),
    defaultValue: { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 },
  });
}
