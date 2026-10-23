import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  template: `
    <section class="page">
      <h1>{{ 'ABOUT.TITLE' | transloco }}</h1>
      <p>{{ 'ABOUT.BODY' | transloco }}</p>
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
export class About {}
