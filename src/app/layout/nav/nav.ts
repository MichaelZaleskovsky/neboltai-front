import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

interface NavLink {
  labelKey: string;
  path: string;
}

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  protected readonly links: readonly NavLink[] = [
    { labelKey: 'NAV.CATALOG', path: '/catalog' },
    { labelKey: 'NAV.AUTHORS', path: '/authors' },
    { labelKey: 'NAV.EXHIBITIONS', path: '/exhibitions' },
    { labelKey: 'NAV.PUBLICATIONS', path: '/publications' },
    { labelKey: 'NAV.ABOUT', path: '/about' },
    { labelKey: 'NAV.CONTACTS', path: '/contacts' },
  ];
}
