
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()?.role === 'Admin') {
    return true; // User is an Admin, allow access
  } else {
    // User is not an admin, redirect to the dashboard
    router.navigate(['/dashboard']);
    return false;
  }
};
