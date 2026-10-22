import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-load-image-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>This section is coming soon.</p>`,
  styles: `:host { display: block; padding: 2rem 1.5rem; }`,
})
export class LoadImagePage {}
