import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './account-page.html',
  styles: `
    :host { display: block; max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }
    .account-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    h1 { margin: 0; }
    .admin-panel {
      display: inline-block;
      padding: 0.6rem 1rem;
      border-radius: 4px;
      background: #444;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      white-space: nowrap;
    }
    .admin-panel:hover { background: #333; }
    form { max-width: 760px; }
    fieldset { margin: 0 0 1.5rem; padding: 1.25rem; border: 1px solid #ddd; border-radius: 6px; }
    legend { padding: 0 0.5rem; font-weight: 600; }
    .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    label { display: flex; flex-direction: column; gap: 0.4rem; }
    input, textarea { box-sizing: border-box; width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #aaa; border-radius: 4px; font: inherit; background: #fff; color: #333; }
    input:focus-visible, textarea:focus-visible { outline: 2px solid #a87563; outline-offset: 2px; }
    textarea { resize: vertical; }
    .full-width { grid-column: 1 / -1; }
    @media (max-width: 560px) {
      .fields { grid-template-columns: 1fr; }
      .account-header { align-items: flex-start; }
      h1 { font-size: 1.5rem; }
    }
  `,
})
export class AccountPage {}
