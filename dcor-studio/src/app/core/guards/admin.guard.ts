import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminAuthService, PermissionActions } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);

  // 1. Kiểm tra trạng thái đăng nhập
  const currentUser = authService.currentUser$.value;
  const token = authService.token;

  if (!currentUser || !token) {
    // Chưa đăng nhập: chuyển hướng về /admin-login kèm returnUrl
    return router.createUrlTree(['/admin-login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // 2. Kiểm tra trạng thái tài khoản
  if (currentUser.status && currentUser.status !== 'ACTIVE') {
    authService.logout();
    return router.createUrlTree(['/admin-login'], {
      queryParams: { error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' }
    });
  }

  // Luôn xác thực ngầm với database để thu hồi ngay nếu bị khóa từ tab khác/admin khác
  authService.verifySession().subscribe();

  // 3. Kiểm tra quyền truy cập route theo Module và Action
  const requiredModule = (route.data?.['module'] as string) || extractModuleFromPath(state.url);
  const requiredAction = (route.data?.['action'] as keyof PermissionActions) || 'view';

  if (requiredModule && requiredModule !== 'dashboard') {
    const hasPermission = authService.hasPermission(requiredModule, requiredAction);
    if (!hasPermission) {
      // Người dùng không có quyền truy cập module này: quay về dashboard
      return router.createUrlTree(['/admin/dashboard'], {
        queryParams: { forbidden: requiredModule }
      });
    }
  }

  return true;
};

/**
 * Tự động trích xuất module từ đường dẫn URL nếu route không khai báo route.data['module']
 */
function extractModuleFromPath(url: string): string | null {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const parts = cleanUrl.split('/').filter(Boolean);
  
  // parts ví dụ: ['admin', 'products', 'new']
  if (parts.length >= 2 && parts[0] === 'admin') {
    const section = parts[1];
    if (section === 'products' && parts[2] === 'categories') {
      return 'categories';
    }
    const mapping: Record<string, string> = {
      'dashboard': 'dashboard',
      'products': 'products',
      'categories': 'categories',
      'orders': 'orders',
      'inventory': 'inventory',
      'promotions': 'promotions',
      'vouchers': 'promotions',
      'campaigns': 'promotions',
      'customers': 'customers',
      'staff': 'staff',
      'reports': 'reports',
      'designs': 'designs',
      'appointments': 'appointments',
      'content': 'content',
      'chat': 'chat',
      'settings': 'settings',
      'audit-log': 'settings'
    };
    return mapping[section] || null;
  }
  return null;
}
