import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../../services/auth';
import { I18n, Lang } from '../../i18n/i18n';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(Auth);
  private readonly i18n = inject(I18n);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly user = this.auth.user;

  protected readonly lang = this.i18n.lang;
  protected readonly languages = this.i18n.languages;
  protected readonly languageNames = this.i18n.languageNames;

  protected setLang(value: string): void {
    this.i18n.setLang(value as Lang);
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
