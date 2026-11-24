import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Lấy token của Customer (nếu có)
  const customerToken = sessionStorage.getItem('dcor_customer_token') || localStorage.getItem('dcor_customer_token');
  // Lấy token của Admin từ sessionStorage (phiên làm việc) hoặc localStorage
  const adminToken = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');

  // Phân luồng Token tùy theo prefix của API để tránh gửi lộn Token
  const isAdminApi =
    req.url.includes('/api/admin') ||
    req.url.includes('/api/auth/admin') ||
    req.url.includes('/api/consultations/admin');

  let token = null;
  if (isAdminApi) {
    token = adminToken;
  } else if (
    req.url.includes('/api/store') ||
    req.url.includes('/api/cart') ||
    req.url.includes('/api/auth/customer') ||
    req.url.includes('/api/customer') ||
    req.url.includes('/api/account')
  ) {
    token = customerToken;
  } else {
    // Nếu request không rõ rệt, dùng token hiện có ưu tiên customer
    token = customerToken || adminToken;
  }

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Khi tài khoản bị khóa hoặc xóa trong DB, thu hồi phiên ngay lập tức
      const isAccountRevoked = 
        error.error?.code === 'ACCOUNT_LOCKED' || 
        error.error?.code === 'ACCOUNT_DELETED' || 
        error.error?.active === false ||
        (typeof error.error?.message === 'string' && (error.error.message.includes('tạm khóa') || error.error.message.includes('đã bị xóa')));

      if (
        (error.status === 401 || (error.status === 403 && isAccountRevoked)) &&
        isAdminApi
      ) {
        if (!req.url.includes('/api/auth/admin/login')) {
          const errMsg = error.error?.message || 'Tài khoản của bạn đã bị tạm khóa hoặc phiên làm việc đã hết hạn.';
          sessionStorage.removeItem('dcor_admin_token');
          sessionStorage.removeItem('dcor_admin_user');
          sessionStorage.removeItem('dcor_admin_session_expires_at');
          localStorage.removeItem('dcor_admin_token');
          localStorage.removeItem('dcor_admin_user');
          localStorage.removeItem('dcor_role_permissions');

          router.navigate(['/admin-login'], {
            queryParams: { error: errMsg }
          });
        }
      } else if (error.status === 403 && isAccountRevoked && !isAdminApi) {
        // Thu hồi phiên khách hàng nếu tài khoản bị Admin khóa hoặc xóa
        sessionStorage.removeItem('dcor_customer_token');
        sessionStorage.removeItem('dcor_customer_user');
        localStorage.removeItem('dcor_customer_token');
        localStorage.removeItem('dcor_customer_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dcor_customer_revoked', {
            detail: { message: error.error?.message || 'Tài khoản của bạn đã bị khóa.' }
          }));
        }
      }
      return throwError(() => error);
    })
  );
};
