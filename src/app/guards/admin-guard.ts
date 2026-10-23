import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

/** Allows navigation only when the current user is an administrator. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }
  // Not an admin: send to the login page, remembering where they were headed.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
