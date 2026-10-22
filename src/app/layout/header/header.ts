import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

type Lang = 'EN' | 'RU';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(Auth);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly user = this.auth.user;

  protected readonly lang = signal<Lang>('EN');
  protected readonly languages: readonly Lang[] = ['EN', 'RU'];

  protected setLang(value: string): void {
    this.lang.set(value as Lang);
  }

  // Mock auth actions until a real backend is wired up.
  protected login(): void {
    this.auth.login(false);
  }

  protected loginAsAdmin(): void {
    this.auth.login(true);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
