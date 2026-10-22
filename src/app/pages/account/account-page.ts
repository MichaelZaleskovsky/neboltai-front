import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `<a class="load-image" routerLink="/account/load-image">Load new image</a>`,
  styles: `
    :host { display: block; padding: 2rem 1.5rem; }
    .load-image {
      display: inline-block;
      padding: 0.6rem 1rem;
      border-radius: 4px;
      background: #444;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
    }
    .load-image:hover { background: #333; }
  `,
})
export class AccountPage {}
