import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type AdminRole = 
  | 'Super Admin' 
  | 'Quản lý sản phẩm' 
  | 'Quản lý kho' 
  | 'Quản lý đơn hàng' 
  | 'Marketing' 
  | 'CSKH' 
  | 'Sales';

export interface PermissionActions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}

export type AdminModule = 
  | 'products' 
  | 'categories' 
  | 'orders' 
  | 'inventory' 
  | 'promotions' 
  | 'customers' 
  | 'staff' 
  | 'reports' 
  | 'settings';

export type RolePermissions = Record<AdminModule, PermissionActions>;

export interface AdminUser {
  id: string | number;
  fullName: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
  message?: string;
}

const DEFAULT_EMPTY_PERMISSIONS: PermissionActions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false
};

const FULL_PERMISSIONS: PermissionActions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true
};

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, RolePermissions> = {
  'Super Admin': {
    products: { ...FULL_PERMISSIONS },
    categories: { ...FULL_PERMISSIONS },
    orders: { ...FULL_PERMISSIONS },
    inventory: { ...FULL_PERMISSIONS },
    promotions: { ...FULL_PERMISSIONS },
    customers: { ...FULL_PERMISSIONS },
    staff: { ...FULL_PERMISSIONS },
    reports: { ...FULL_PERMISSIONS },
    settings: { ...FULL_PERMISSIONS }
  },
  'Quản lý sản phẩm': {
    products: { view: true, create: true, edit: true, delete: true, approve: true },
    categories: { view: true, create: true, edit: true, delete: true, approve: true },
    orders: { view: true, create: false, edit: false, delete: false, approve: false },
    inventory: { view: true, create: false, edit: true, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { ...DEFAULT_EMPTY_PERMISSIONS },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  },
  'Quản lý kho': {
    products: { view: true, create: false, edit: true, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: false, edit: false, delete: false, approve: false },
    inventory: { view: true, create: true, edit: true, delete: true, approve: true },
    promotions: { ...DEFAULT_EMPTY_PERMISSIONS },
    customers: { ...DEFAULT_EMPTY_PERMISSIONS },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  },
  'Quản lý đơn hàng': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: true, edit: true, delete: true, approve: true },
    inventory: { view: true, create: false, edit: false, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: false },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  },
  'Marketing': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: false, edit: false, delete: false, approve: false },
    inventory: { ...DEFAULT_EMPTY_PERMISSIONS },
    promotions: { view: true, create: true, edit: true, delete: true, approve: true },
    customers: { view: true, create: false, edit: false, delete: false, approve: false },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  },
  'CSKH': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: false, edit: true, delete: false, approve: false },
    inventory: { ...DEFAULT_EMPTY_PERMISSIONS },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: false },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  },
  'Sales': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: true, edit: true, delete: false, approve: false },
    inventory: { view: true, create: false, edit: false, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: false },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  }
};

export function normalizeAdminRole(role: string): AdminRole {
  if (!role) return 'Super Admin';
  const trimmed = role.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'super admin' || lower === 'admin' || lower === 'administrator' || lower === 'quản trị viên') {
    return 'Super Admin';
  }
  if (lower.includes('sản phẩm')) return 'Quản lý sản phẩm';
  if (lower.includes('kho')) return 'Quản lý kho';
  if (lower.includes('đơn hàng')) return 'Quản lý đơn hàng';
  if (lower.includes('marketing')) return 'Marketing';
  if (lower.includes('cskh') || lower.includes('chăm sóc')) return 'CSKH';
  if (lower.includes('sales') || lower.includes('bán hàng')) return 'Sales';
  return 'Super Admin';
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly TOKEN_KEY = 'dcor_admin_token';
  private readonly USER_KEY = 'dcor_admin_user';
  private readonly PERMISSIONS_KEY = 'dcor_role_permissions';

  // 1. Quản lý State
  readonly currentUser$ = new BehaviorSubject<AdminUser | null>(null);
  readonly permissions$ = new BehaviorSubject<RolePermissions | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStateFromStorage();
  }

  get currentUser(): AdminUser | null {
    return this.currentUser$.value;
  }

  get permissions(): RolePermissions | null {
    return this.permissions$.value;
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser$.value;
  }

  /**
   * Kiểm tra quyền của tài khoản hiện tại cho module và hành động cụ thể
   */
  hasPermission(module: string, action: keyof PermissionActions = 'view'): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (user.role === 'Super Admin') return true;

    const currentPerms = this.permissions$.value;
    if (!currentPerms) return false;

    const modKey = module as AdminModule;
    return !!currentPerms[modKey]?.[action];
  }

  /**
   * Đăng nhập tài khoản quản trị
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/login`, { email, password }).pipe(
      map(res => {
        const rawUser = res.user || {};
        if (rawUser.status && rawUser.status !== 'ACTIVE') {
          throw new Error('Tài khoản đã bị tạm khóa hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
        }

        const user: AdminUser = {
          id: rawUser.id || 'admin-' + Date.now(),
          fullName: rawUser.fullName || rawUser.name || email.split('@')[0],
          email: rawUser.email || email,
          role: normalizeAdminRole(rawUser.role || 'Super Admin'),
          avatar: rawUser.avatar || '',
          status: rawUser.status || 'ACTIVE'
        };

        return this.handleAuthSuccess(res.token, user);
      }),
      catchError(err => {
        // Trả về thông điệp lỗi rõ ràng từ Backend nếu có
        if (err?.error?.message) {
          return throwError(() => new Error(err.error.message));
        }
        if (err instanceof Error) {
          return throwError(() => err);
        }
        return throwError(() => new Error('Email hoặc mật khẩu không chính xác.'));
      })
    );
  }

  /**
   * Đăng xuất tài khoản quản trị
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    localStorage.removeItem('dcor_user');

    this.currentUser$.next(null);
    this.permissions$.next(null);

    // Xóa history state và chuyển hướng về /admin-login
    window.history.replaceState(null, '', '/admin-login');
    this.router.navigate(['/admin-login'], { replaceUrl: true });
  }

  /**
   * Kích hoạt tài khoản từ thư mời
   */
  activateAccount(token: string, password: string, fullName?: string, email?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/invite-accept`, {
      token,
      email: email || token,
      password,
      fullName
    }).pipe(
      map(res => {
        if (res.token && res.user) {
          this.handleAuthSuccess(res.token, {
            id: res.user.id,
            fullName: res.user.fullName,
            email: res.user.email,
            role: normalizeAdminRole(res.user.role),
            status: 'ACTIVE'
          });
        }
        return res;
      }),
      catchError(err => {
        if (err?.error?.message) {
          return throwError(() => new Error(err.error.message));
        }
        return throwError(() => new Error('Không thể kích hoạt tài khoản. Vui lòng kiểm tra lại liên kết.'));
      })
    );
  }

  /**
   * Quên mật khẩu tài khoản quản trị
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/forgot-password`, { email }).pipe(
      catchError(err => {
        if (err?.error?.message) {
          return throwError(() => new Error(err.error.message));
        }
        return throwError(() => new Error('Không thể gửi yêu cầu khôi phục mật khẩu.'));
      })
    );
  }

  /**
   * Cập nhật ma trận phân quyền
   */
  updateRolePermissions(role: AdminRole, permissions: RolePermissions): void {
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));
    if (this.currentUser$.value?.role === role) {
      this.permissions$.next(permissions);
    }
  }

  private handleAuthSuccess(token: string, user: AdminUser): LoginResponse {
    const rolePermissions = this.resolvePermissionsForRole(user.role);

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(rolePermissions));
    // Tương thích ngược với các component dùng dcor_user
    localStorage.setItem('dcor_user', JSON.stringify({ ...user, role: 'ADMIN' }));

    this.currentUser$.next(user);
    this.permissions$.next(rolePermissions);

    return { token, user };
  }

  private loadStateFromStorage(): void {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);

      if (token && userStr) {
        const user: AdminUser = JSON.parse(userStr);
        user.role = normalizeAdminRole(user.role);
        const perms = this.resolvePermissionsForRole(user.role);

        this.currentUser$.next(user);
        this.permissions$.next(perms);
      }
    } catch (e) {
      console.warn('Lỗi khi đọc thông tin admin auth từ storage:', e);
      this.logout();
    }
  }

  private resolvePermissionsForRole(role: AdminRole): RolePermissions {
    try {
      const savedPermsStr = localStorage.getItem(this.PERMISSIONS_KEY);
      if (savedPermsStr) {
        return JSON.parse(savedPermsStr);
      }
    } catch {
      // ignore
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['Super Admin'];
  }
}
