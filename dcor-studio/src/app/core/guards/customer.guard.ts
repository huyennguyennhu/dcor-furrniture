import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard bảo vệ các trang thuộc phân hệ Tài khoản cá nhân (/account/*)
 * Nếu chưa đăng nhập, chuyển hướng về trang /login kèm returnUrl
 */
export const customerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Chưa đăng nhập: điều hướng tới trang /login kèm returnUrl để sau khi login xong quay lại đúng trang
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
