import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Chặn người dùng quản trị đã đăng nhập quay lại trang /admin-login hoặc /admin landing
 */
export const adminGuestGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  const hasToken = !!localStorage.getItem('dcor_admin_token');
  const hasUser = !!authService.currentUser$.value || !!localStorage.getItem('dcor_admin_user');

  if (hasToken && hasUser) {
    return router.createUrlTree(['/admin/reports/overview']);
  }
  return true;
};
