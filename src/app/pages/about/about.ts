import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <h1>About</h1>
      <p>
        НЕ БОЛТАЙ is an archive of posters and artworks. This is the About page — replace this
        copy with the real project description.
      </p>
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
