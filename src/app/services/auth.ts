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

  /**
   * Mock login. In the real app this would call an auth API and verify the
   * password. For now any non-empty credentials succeed; `asAdmin` grants the
   * admin role, and `name` (when given) is used as the display name.
   */
  login(asAdmin = false, name?: string): void {
    const displayName = name?.trim() || (asAdmin ? 'Administrator' : 'Guest User');
    this.userSignal.set({ name: displayName, isAdmin: asAdmin });
  }

  logout(): void {
    this.userSignal.set(null);
  }
}
