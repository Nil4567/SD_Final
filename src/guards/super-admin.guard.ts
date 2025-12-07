
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const SuperAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()?.id === 'admin-superuser') {
    return true; // User is the super admin, allow access
  } else {
    // User is not the super admin, redirect to the dashboard
    router.navigate(['/dashboard']);
    return false;
  }
};
