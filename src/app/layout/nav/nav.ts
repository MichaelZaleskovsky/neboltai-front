import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  protected readonly links: readonly NavLink[] = [
    { label: 'Catalog', path: '/catalog' },
    { label: 'Authors', path: '/authors' },
    { label: 'Exhibitions', path: '/exhibitions' },
    { label: 'Publications', path: '/publications' },
    { label: 'About', path: '/about' },
    { label: 'Contacts', path: '/contacts' },
  ];
}
