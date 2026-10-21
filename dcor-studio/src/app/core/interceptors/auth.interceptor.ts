import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Lấy token của Customer (nếu có)
  const customerToken = sessionStorage.getItem('dcor_customer_token') || localStorage.getItem('dcor_customer_token');
  // Lấy token của Admin từ sessionStorage (phiên làm việc) hoặc localStorage
  const adminToken = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');

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
