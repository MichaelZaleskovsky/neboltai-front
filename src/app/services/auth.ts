import { Injectable, computed, signal } from '@angular/core';

interface User {
  name: string;
  isAdmin: boolean;
}

/**
 * Minimal mock auth. Toggleable for local testing until a real backend exists.
 */
@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.isAdmin ?? false);

  /** Mock login. In the real app this would call an auth API. */
  login(asAdmin = false): void {
    this.userSignal.set({ name: asAdmin ? 'Administrator' : 'Guest User', isAdmin: asAdmin });
  }

  logout(): void {
    this.userSignal.set(null);
  }
}
