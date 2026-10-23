import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** Where to go after a successful login. Bound from the `returnUrl` query param. */
  private readonly returnUrl =
    this.router.getCurrentNavigation()?.extractedUrl.queryParams['returnUrl'] ?? '/catalog';

  protected readonly submitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    asAdmin: [false],
  });

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, asAdmin } = this.form.getRawValue();
    // Mock auth: any valid-looking credentials succeed. The email's local part
    // is used as the display name. Replace with a real auth API call later.
    void password;
    const name = email.split('@')[0];
    this.auth.login(asAdmin, name);
    void this.router.navigateByUrl(this.returnUrl);
  }
}
