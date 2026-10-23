import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/** Simple stub page used for sections not yet implemented. */
@Component({
  selector: 'app-placeholder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <section class="page">
      <h1>{{ title() }}</h1>
      <p>{{ 'PLACEHOLDER.COMING_SOON' | transloco }}</p>
    </section>
  `,
  styles: [
    `
      .page {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
      }
      h1 {
        margin-top: 0;
      }
    `,
  ],
})
export class PlaceholderPage {
  readonly title = input('Section');
}
