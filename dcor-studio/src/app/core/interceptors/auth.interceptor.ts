import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Lấy token của Customer (nếu có)
  const customerToken = localStorage.getItem('dcor_customer_token');
  // Lấy token của Admin (nếu có)
  const adminToken = localStorage.getItem('dcor_admin_token');

  // Phân luồng Token tùy theo prefix của API để tránh gửi lộn Token
  let token = null;
  if (req.url.includes('/api/admin') || req.url.includes('/api/auth/admin')) {
    token = adminToken;
  } else if (req.url.includes('/api/store') || req.url.includes('/api/cart') || req.url.includes('/api/auth/customer')) {
    token = customerToken;
  } else {
    // Nếu request không rõ rệt, dùng token hiện có ưu tiên customer
    token = customerToken || adminToken;
  }

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
