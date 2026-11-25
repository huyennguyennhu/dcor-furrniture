import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type AdminRole = 
  | 'Super Admin' 
  | 'Quản lý sản phẩm' 
  | 'Quản lý kho' 
  | 'Quản lý đơn hàng' 
  | 'Marketing' 
  | 'CSKH' 
  | 'Sales'
  | string;

export interface RoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

export interface RoleWithStaff extends RoleDefinition {
  staffCount?: number;
  assignedStaff?: { id: string; name: string; email: string; status?: string }[];
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  type: 'SHOWROOM' | 'CENTRAL_WAREHOUSE';
  address: string;
  phone: string;
  managerName: string;
  isActive: boolean;
}

export interface PermissionActions {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  [key: string]: boolean | undefined;
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
  | 'designs'
  | 'appointments'
  | 'content'
  | 'chat'
  | 'settings';

export type RolePermissions = Record<AdminModule, PermissionActions>;

export interface AdminUser {
  id: string | number;
  fullName: string;
  email: string;
  role: string;
  roles: string[]; // Hỗ trợ gán nhiều vai trò (Multi-Role)
  roleCode?: string;
  branchId: string;
  branchName: string;
  assignedBranches?: string[]; // Danh sách các Kho & Showroom được phân quyền
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';
}

export interface LoginResponse {
  token: string;
  user: AdminUser;
  message?: string;
}

export const SYSTEM_BRANCHES: Branch[] = [
  // 1. Phân hệ Toàn hệ thống
  {
    id: 'ALL',
    code: 'ALL',
    name: 'Toàn hệ thống',
    type: 'SHOWROOM',
    address: 'Toàn quốc / Trụ sở điều hành chính DCor Studio',
    phone: '1900 1234',
    managerName: 'Ban Giám Đốc DCor',
    isActive: true
  },

  // 2. Danh mục 4 Kho Hàng (Gắn với nhân viên kho / quản lý kho)
  {
    id: 'KHO_TONG_HCM',
    code: 'KHO_TONG_HCM',
    name: 'Kho Tổng (TP.HCM)',
    type: 'CENTRAL_WAREHOUSE',
    address: 'KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM',
    phone: '028 3812 9999',
    managerName: 'Trần Văn Kho',
    isActive: true
  },
  {
    id: 'KHO_HN',
    code: 'KHO_HN',
    name: 'Kho Hà Nội',
    type: 'CENTRAL_WAREHOUSE',
    address: 'Khu CN Quang Minh, Mê Linh, Hà Nội',
    phone: '024 3812 6688',
    managerName: 'Đặng Quốc Tuấn',
    isActive: true
  },
  {
    id: 'KHO_DN',
    code: 'KHO_DN',
    name: 'Kho Đà Nẵng',
    type: 'CENTRAL_WAREHOUSE',
    address: 'KCN Hòa Khánh, Q. Liên Chiểu, Đà Nẵng',
    phone: '0236 3812 778',
    managerName: 'Nguyễn Thanh Long',
    isActive: true
  },
  {
    id: 'KHO_BD',
    code: 'KHO_BD',
    name: 'Kho Bình Dương',
    type: 'CENTRAL_WAREHOUSE',
    address: 'KCN VSIP 1, TP. Thuận An, Bình Dương',
    phone: '0274 3812 334',
    managerName: 'Bùi Văn Hùng',
    isActive: true
  },

  // 3. Danh mục Showroom (Gắn với nhân viên bán hàng / showroom)
  {
    id: 'SR_Q1',
    code: 'SR_Q1',
    name: 'Showroom Quận 1',
    type: 'SHOWROOM',
    address: '120 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
    phone: '028 3822 5588',
    managerName: 'Lê Minh Trí',
    isActive: true
  },
  {
    id: 'SR_THU_DUC',
    code: 'SR_THU_DUC',
    name: 'Showroom Thủ Đức',
    type: 'SHOWROOM',
    address: '45 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    phone: '028 3722 4466',
    managerName: 'Nguyễn Thị Hồng',
    isActive: true
  },
  {
    id: 'SR_HN_CAU_GIAY',
    code: 'SR_HN_CAU_GIAY',
    name: 'Showroom Cầu Giấy HN',
    type: 'SHOWROOM',
    address: '68 Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy, Hà Nội',
    phone: '024 3833 6677',
    managerName: 'Phạm Hoàng Long',
    isActive: true
  },
  {
    id: 'SR_DN_HAI_CHAU',
    code: 'SR_DN_HAI_CHAU',
    name: 'Showroom Đà Nẵng',
    type: 'SHOWROOM',
    address: '150 Nguyễn Văn Linh, P. Vĩnh Trung, Q. Hải Châu, Đà Nẵng',
    phone: '0236 3655 889',
    managerName: 'Võ Thanh Tùng',
    isActive: true
  }
];

export const INITIAL_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Toàn quyền quản trị cao nhất hệ thống, không bị hạn chế bất kỳ phân hệ nào.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-product-mgr',
    name: 'QL Sản phẩm',
    code: 'QL_SAN_PHAM',
    description: 'Quản lý danh mục, thông tin sản phẩm, định giá, thuộc tính và hình ảnh.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-inventory-mgr',
    name: 'QL Kho',
    code: 'QL_KHO',
    description: 'Quản lý nhập - xuất hàng hóa, điều chuyển kho showroom và kiểm kê định kỳ.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-order-mgr',
    name: 'QL Đơn hàng',
    code: 'QL_DON_HANG',
    description: 'Tiếp nhận, xử lý đơn hàng, điều phối vận chuyển, đổi trả và bảo hành.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-sales',
    name: 'NV Kinh doanh',
    code: 'NV_KINH_DOANH',
    description: 'Tư vấn bán hàng, đặt lịch hẹn, hỗ trợ khách hàng và tạo đơn hàng.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-architect',
    name: 'Kiến trúc sư',
    code: 'KTS',
    description: 'Khảo sát hiện trạng phòng khách, lên bản vẽ 3D phối cảnh, tư vấn vật liệu may đo.',
    isSystem: true,
    createdAt: '2026-01-01'
  }
];

export const DEFAULT_EMPTY_PERMISSIONS: PermissionActions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false
};

export function createEmptyRolePermissions(): RolePermissions {
  return {
    products: { ...DEFAULT_EMPTY_PERMISSIONS },
    categories: { ...DEFAULT_EMPTY_PERMISSIONS },
    orders: { ...DEFAULT_EMPTY_PERMISSIONS },
    inventory: { ...DEFAULT_EMPTY_PERMISSIONS },
    promotions: { ...DEFAULT_EMPTY_PERMISSIONS },
    customers: { ...DEFAULT_EMPTY_PERMISSIONS },
    staff: { ...DEFAULT_EMPTY_PERMISSIONS },
    reports: { ...DEFAULT_EMPTY_PERMISSIONS },
    designs: { ...DEFAULT_EMPTY_PERMISSIONS },
    appointments: { ...DEFAULT_EMPTY_PERMISSIONS },
    content: { ...DEFAULT_EMPTY_PERMISSIONS },
    chat: { ...DEFAULT_EMPTY_PERMISSIONS },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  };
}

export const FULL_PERMISSIONS: PermissionActions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  'Super Admin': {
    products: { ...FULL_PERMISSIONS },
    categories: { ...FULL_PERMISSIONS },
    orders: { ...FULL_PERMISSIONS },
    inventory: { ...FULL_PERMISSIONS },
    promotions: { ...FULL_PERMISSIONS },
    customers: { ...FULL_PERMISSIONS },
    staff: { ...FULL_PERMISSIONS },
    reports: { ...FULL_PERMISSIONS },
    designs: { ...FULL_PERMISSIONS },
    appointments: { ...FULL_PERMISSIONS },
    content: { ...FULL_PERMISSIONS },
    chat: { ...FULL_PERMISSIONS },
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
    designs: { view: true, create: true, edit: true, delete: false, approve: true },
    appointments: { ...DEFAULT_EMPTY_PERMISSIONS },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    chat: { ...DEFAULT_EMPTY_PERMISSIONS },
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
    designs: { ...DEFAULT_EMPTY_PERMISSIONS },
    appointments: { ...DEFAULT_EMPTY_PERMISSIONS },
    content: { ...DEFAULT_EMPTY_PERMISSIONS },
    chat: { ...DEFAULT_EMPTY_PERMISSIONS },
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
    designs: { view: true, create: false, edit: false, delete: false, approve: false },
    appointments: { view: true, create: false, edit: false, delete: false, approve: false },
    content: { ...DEFAULT_EMPTY_PERMISSIONS },
    chat: { view: true, create: false, edit: true, delete: false, approve: false },
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
    designs: { view: true, create: true, edit: true, delete: true, approve: true },
    appointments: { view: true, create: false, edit: false, delete: false, approve: false },
    content: { view: true, create: true, edit: true, delete: true, approve: true },
    chat: { view: true, create: false, edit: true, delete: false, approve: false },
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
    designs: { view: true, create: false, edit: false, delete: false, approve: false },
    appointments: { view: true, create: true, edit: true, delete: false, approve: true },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    chat: { view: true, create: true, edit: true, delete: false, approve: true },
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
    designs: { view: true, create: false, edit: false, delete: false, approve: false },
    appointments: { view: true, create: true, edit: true, delete: false, approve: false },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    chat: { view: true, create: true, edit: true, delete: false, approve: false },
    settings: { ...DEFAULT_EMPTY_PERMISSIONS }
  }
};

// Aliases for abbreviated roles
DEFAULT_ROLE_PERMISSIONS['QL Sản phẩm'] = DEFAULT_ROLE_PERMISSIONS['Quản lý sản phẩm'];
DEFAULT_ROLE_PERMISSIONS['QL Kho'] = DEFAULT_ROLE_PERMISSIONS['Quản lý kho'];
DEFAULT_ROLE_PERMISSIONS['QL Đơn hàng'] = DEFAULT_ROLE_PERMISSIONS['Quản lý đơn hàng'];
DEFAULT_ROLE_PERMISSIONS['NV Kinh doanh'] = DEFAULT_ROLE_PERMISSIONS['Sales'];

export function normalizeAdminRole(role: string): string {
  if (!role) return 'NV Kinh doanh';
  const trimmed = role.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'super admin' || lower === 'admin' || lower === 'administrator' || lower === 'quản trị viên') {
    return 'Super Admin';
  }
  if (lower.includes('sản phẩm')) return 'QL Sản phẩm';
  if (lower.includes('kho')) return 'QL Kho';
  if (lower.includes('đơn hàng')) return 'QL Đơn hàng';
  if (lower.includes('kinh doanh') || lower.includes('sales') || lower.includes('bán hàng') || lower.includes('cskh') || lower.includes('marketing')) {
    return 'NV Kinh doanh';
  }
  return trimmed;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly TOKEN_KEY = 'dcor_admin_token';
  private readonly USER_KEY = 'dcor_admin_user';
  private readonly PERMISSIONS_KEY = 'dcor_role_permissions';
  private readonly ROLES_LIST_KEY = 'dcor_admin_roles_list';
  private readonly SESSION_EXPIRY_KEY = 'dcor_admin_session_expires_at';
  // Cấu hình thời gian thu hồi phiên: Admin duy trì 30 ngày (như Facebook), nhân viên khác 8 tiếng
  private readonly ADMIN_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày
  private readonly STAFF_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 tiếng

  // State Management
  readonly currentUser$ = new BehaviorSubject<AdminUser | null>(null);
  readonly permissions$ = new BehaviorSubject<RolePermissions | null>(null);
  readonly rolesList$ = new BehaviorSubject<RoleDefinition[]>([]);
  readonly branchesList$ = new BehaviorSubject<Branch[]>(SYSTEM_BRANCHES);

  private heartbeatTimer: any = null;

  // Cơ chế Idle Timeout: 4 tiếng nếu người dùng không thao tác chuột/phím sẽ hết hạn phiên
  private readonly IDLE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
  private lastActivityTime = Date.now();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initRolesList();
    this.loadStateFromStorage();
    this.initVisibilityListeners();
    this.initUserActivityTracker();
  }

  private initUserActivityTracker(): void {
    if (typeof window === 'undefined') return;

    // Lắng nghe các tương tác của người dùng để gia hạn thời gian hoạt động (Sliding Expiry)
    const updateActivity = () => {
      this.touchSession();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => {
      window.addEventListener(evt, updateActivity, { passive: true });
    });
  }

  /**
   * Cập nhật thời điểm thao tác gần nhất và trượt hạn phiên thêm 4 tiếng nếu đang hoạt động
   */
  public touchSession(): void {
    const now = Date.now();
    // Giảm tần suất ghi storage: chỉ cập nhật nếu đã trôi qua ít nhất 30 giây kể từ lần ghi trước
    if (now - this.lastActivityTime > 30000 && this.isLoggedIn()) {
      this.lastActivityTime = now;
      const newExpiresAt = now + this.IDLE_TIMEOUT_MS;
      sessionStorage.setItem(this.SESSION_EXPIRY_KEY, newExpiresAt.toString());
      localStorage.setItem(this.SESSION_EXPIRY_KEY, newExpiresAt.toString());
    }
  }

  private initVisibilityListeners(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isLoggedIn()) {
          this.verifySession().subscribe();
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.isLoggedIn()) {
          this.verifySession().subscribe();
        }
      });
    }
  }

  startSessionHeartbeat(): void {
    this.stopSessionHeartbeat();
    // Tự động kiểm tra định kỳ mỗi 3.5s với cơ sở dữ liệu để thu hồi phiên ngay lập tức nếu bị khóa
    // Toi uu DB Connection Pool: Kiem tra dinh ky 5 phut (thay vi polling 3.5s)
    this.heartbeatTimer = setInterval(() => {
      if (this.isLoggedIn()) {
        this.verifySession().subscribe();
      } else {
        this.stopSessionHeartbeat();
      }
    }, 5 * 60 * 1000);
  }

  stopSessionHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  get currentUser(): AdminUser | null {
    return this.currentUser$.value;
  }

  get permissions(): RolePermissions | null {
    return this.permissions$.value;
  }

  get token(): string | null {
    const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY) || localStorage.getItem(this.SESSION_EXPIRY_KEY));
    if (expiresAt && Date.now() > expiresAt) {
      this.logout();
      return null;
    }
    return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  }

  get roles(): RoleDefinition[] {
    return this.rolesList$.value;
  }

  get branches(): Branch[] {
    return this.branchesList$.value;
  }

  get warehouses(): Branch[] {
    return this.branchesList$.value.filter(b => b.type === 'CENTRAL_WAREHOUSE');
  }

  get showrooms(): Branch[] {
    return this.branchesList$.value.filter(b => b.type === 'SHOWROOM');
  }

  isLoggedIn(): boolean {
    const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY) || localStorage.getItem(this.SESSION_EXPIRY_KEY));
    if (expiresAt && Date.now() > expiresAt) {
      this.logout();
      return false;
    }
    const hasToken = !!sessionStorage.getItem(this.TOKEN_KEY) || !!localStorage.getItem(this.TOKEN_KEY);
    return hasToken && !!this.currentUser$.value;
  }

  // =========================================================================
  // PHÂN QUYỀN CHỨC NĂNG & CHI NHÁNH (2 CHIỀU + MULTI-ROLE)
  // =========================================================================

  /**
   * Tính toán quyền tổng hợp (UNION) từ một hoặc nhiều vai trò được gán cho nhân sự (Role-Based IAM)
   */
  calculateEffectivePermissions(roles: string[]): RolePermissions {
    if (!roles || roles.length === 0) {
      return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS['Sales'] || DEFAULT_EMPTY_PERMISSIONS));
    }

    if (roles.includes('Super Admin')) {
      return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS['Super Admin']));
    }

    const allPerms = this.getAllRolePermissionsFromStorage();
    const modules: AdminModule[] = [
      'reports', 'customers', 'products', 'categories', 'inventory', 'orders',
      'promotions', 'designs', 'appointments', 'content', 'chat', 'staff', 'settings'
    ];
    const actions: (keyof PermissionActions)[] = ['view', 'create', 'edit', 'delete', 'approve'];

    const result: any = {};
    modules.forEach(m => {
      result[m] = { view: false, create: false, edit: false, delete: false, approve: false };

      // Hợp nhất toàn bộ action keys từ tất cả các vai trò của nhân sự
      roles.forEach(rawRoleName => {
        const roleName = normalizeAdminRole(rawRoleName);
        const roleMatrix = allPerms[roleName] || allPerms[rawRoleName] || DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS[rawRoleName];
        if (roleMatrix && roleMatrix[m]) {
          Object.keys(roleMatrix[m]).forEach(actKey => {
            if ((roleMatrix[m] as any)[actKey]) {
              result[m][actKey] = true;
            }
          });
        }
      });
    });

    // BẢO VỆ CHỐNG TREO WEB: Nếu user không còn quyền trên bất kỳ phân hệ nào (do role đã bị xóa trước đó)
    // Tự động gán quyền cơ bản của NV Kinh doanh để tài khoản luôn có quyền hợp lệ, ngăn chặn vòng lặp chuyển hướng vô tận
    const hasAnyGranted = modules.some(m => Object.values(result[m]).some(Boolean));
    if (!hasAnyGranted) {
      const fallbackMatrix = allPerms['NV Kinh doanh'] || DEFAULT_ROLE_PERMISSIONS['NV Kinh doanh'];
      if (fallbackMatrix) {
        modules.forEach(m => {
          if (fallbackMatrix[m]) {
            Object.keys(fallbackMatrix[m]).forEach(actKey => {
              if ((fallbackMatrix[m] as any)[actKey]) {
                result[m][actKey] = true;
              }
            });
          }
        });
      }
    }

    return result as RolePermissions;
  }

  /**
   * Tìm đường dẫn trang đầu tiên mà tài khoản có quyền truy cập (mặc định luôn là Dashboard Tổng quan)
   */
  getFirstAccessibleRoute(): string {
    return '/admin/dashboard';
  }

  /**
   * Kiểm tra xem một phân hệ có thuộc phạm vi của các vai trò được gán không
   */
  isModuleInRoleScope(moduleKey: AdminModule, roles: string[]): boolean {
    if (!roles || roles.length === 0) return false;
    if (roles.includes('Super Admin')) return true;

    const allPerms = this.getAllRolePermissionsFromStorage();
    return roles.some(roleName => {
      const roleMatrix = allPerms[roleName] || DEFAULT_ROLE_PERMISSIONS[roleName];
      return roleMatrix && roleMatrix[moduleKey] && (
        roleMatrix[moduleKey].view || 
        roleMatrix[moduleKey].create || 
        roleMatrix[moduleKey].edit || 
        roleMatrix[moduleKey].delete || 
        roleMatrix[moduleKey].approve
      );
    });
  }

  /**
   * Kiểm tra quyền chức năng theo module và hành động
   */
  hasPermission(module: string, action: string = 'view'): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    
    // 1. Chỉ duy nhất Super Admin mới có toàn quyền
    const isSuper = (r: string) => {
      const lower = (r || '').trim().toLowerCase();
      return lower === 'super admin' || lower === 'super_admin';
    };

    if (isSuper(user.role) || (Array.isArray(user.roles) && user.roles.some(isSuper))) {
      return true;
    }

    const currentPerms = this.permissions$.value;
    if (!currentPerms) return false;

    // Phân hệ "categories" liên kết mật thiết với quyền "Danh mục" (products.categories)
    if (module === 'categories') {
      const hasCategoriesAccess = !!(currentPerms['products'] as any)?.['categories'] || !!(currentPerms['categories'] as any)?.['view'];
      if (!hasCategoriesAccess) return false;
      if (action === 'create') {
        const hasEdit = !!(currentPerms['products'] as any)?.['edit'] || !!(currentPerms['categories'] as any)?.['edit'];
        const hasCreate = !!(currentPerms['products'] as any)?.['create'] || !!(currentPerms['categories'] as any)?.['create'];
        return hasEdit && hasCreate;
      }
      if (action === 'edit') return !!(currentPerms['products'] as any)?.['edit'] || !!(currentPerms['categories'] as any)?.['edit'];
      if (action === 'delete') return !!(currentPerms['products'] as any)?.['delete'] || !!(currentPerms['categories'] as any)?.['delete'];
      return true;
    }

    const modKey = module as AdminModule;
    return !!(currentPerms[modKey] as any)?.[action];
  }

  /**
   * Chuẩn hóa tên vai trò quản trị về 5 vai trò hệ thống viết tắt
   */
  normalizeAdminRole(role: string): string {
    return normalizeAdminRole(role);
  }

  /**
   * Kiểm tra phạm vi dữ liệu chi nhánh (Branch Scoping)
   * Trả về true nếu:
   * - user có branchId === 'ALL' hoặc user.roles chứa 'Super Admin'
   * - Hoặc targetBranchId nằm trong danh sách assignedBranches (bao gồm cả Kho và Showroom)
   * - Hoặc user.branchId === targetBranchId
   */
  isBranchAllowed(targetBranchId?: string): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    if (!targetBranchId || targetBranchId === 'ALL') return true;

    if (user.role === 'Super Admin' || (user.roles && user.roles.includes('Super Admin'))) return true;
    if (user.branchId === 'ALL') return true;
    if (user.branchId === targetBranchId) return true;

    if (user.assignedBranches && user.assignedBranches.includes(targetBranchId)) {
      return true;
    }

    return false;
  }

  getBranchById(id: string): Branch | undefined {
    return this.branchesList$.value.find(b => b.id === id);
  }

  getBranchName(id: string): string {
    const b = this.getBranchById(id);
    return b ? b.name : (id === 'ALL' ? 'Toàn hệ thống' : id);
  }

  // =========================================================================
  // QUẢN LÝ VAI TRÒ ĐỘNG (DYNAMIC ROLES)
  // =========================================================================

  private initRolesList(): void {
    try {
      const savedRoles = localStorage.getItem(this.ROLES_LIST_KEY);
      if (savedRoles) {
        const parsed: RoleDefinition[] = JSON.parse(savedRoles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.rolesList$.next(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc roles list từ storage:', e);
    }
    this.rolesList$.next(INITIAL_SYSTEM_ROLES);
    this.saveRolesToStorage(INITIAL_SYSTEM_ROLES);
  }

  private saveRolesToStorage(roles: RoleDefinition[]): void {
    localStorage.setItem(this.ROLES_LIST_KEY, JSON.stringify(roles));
    this.rolesList$.next([...roles]);
  }

  addRole(
    roleData: { name: string; code: string; description: string },
    cloneFromRoleId?: string
  ): RoleDefinition {
    const currentRoles = this.rolesList$.value;
    const cleanName = roleData.name.trim();
    const cleanCode = roleData.code.trim().toUpperCase().replace(/\s+/g, '_');

    const existing = currentRoles.find(
      r => r.name.toLowerCase() === cleanName.toLowerCase() || r.code === cleanCode
    );
    if (existing) {
      throw new Error(`Vai trò "${cleanName}" hoặc mã "${cleanCode}" đã tồn tại!`);
    }

    const newRole: RoleDefinition = {
      id: 'role-' + Date.now(),
      name: cleanName,
      code: cleanCode,
      description: roleData.description.trim(),
      isSystem: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const allPerms = this.getAllRolePermissionsFromStorage();
    let sourcePerms: RolePermissions;
    if (!cloneFromRoleId || cloneFromRoleId === 'NONE' || cloneFromRoleId === 'none') {
      sourcePerms = createEmptyRolePermissions();
    } else {
      const sourceRole = currentRoles.find(r => r.id === cloneFromRoleId || r.name === cloneFromRoleId);
      if (sourceRole && allPerms[sourceRole.name]) {
        sourcePerms = JSON.parse(JSON.stringify(allPerms[sourceRole.name]));
      } else if (sourceRole && DEFAULT_ROLE_PERMISSIONS[sourceRole.name]) {
        sourcePerms = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[sourceRole.name]));
      } else {
        sourcePerms = createEmptyRolePermissions();
      }
    }

    allPerms[newRole.name] = JSON.parse(JSON.stringify(sourcePerms));
    this.saveAllRolePermissionsToStorage(allPerms);

    const updatedRoles = [...currentRoles, newRole];
    this.saveRolesToStorage(updatedRoles);

    // Đồng bộ tức thì lên Server IAM
    this.createRoleOnServer({
      name: newRole.name,
      code: newRole.code,
      description: newRole.description,
      cloneFromRoleName: cloneFromRoleId
    }).subscribe({
      next: () => {},
      error: () => {}
    });

    return newRole;
  }

  updateRole(id: string, updated: { name?: string; description?: string }): void {
    const currentRoles = this.rolesList$.value;
    const index = currentRoles.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy vai trò cần cập nhật.');
    }

    const target = currentRoles[index];
    const oldName = target.name;
    const newName = updated.name ? updated.name.trim() : target.name;

    if (target.code === 'SUPER_ADMIN' && newName !== 'Super Admin') {
      throw new Error('Không thể thay đổi tên vai trò Super Admin!');
    }

    const updatedRole: RoleDefinition = {
      ...target,
      name: newName,
      description: updated.description !== undefined ? updated.description.trim() : target.description
    };

    if (oldName !== newName) {
      const allPerms = this.getAllRolePermissionsFromStorage();
      if (allPerms[oldName]) {
        allPerms[newName] = allPerms[oldName];
        delete allPerms[oldName];
        this.saveAllRolePermissionsToStorage(allPerms);
      }
    }

    const newRoles = [...currentRoles];
    newRoles[index] = updatedRole;
    this.saveRolesToStorage(newRoles);
  }

  deleteRole(id: string): { success: boolean; message: string } {
    const currentRoles = this.rolesList$.value;
    const target = currentRoles.find(r => r.id === id);
    if (!target) {
      return { success: false, message: 'Vai trò không tồn tại.' };
    }

    if (target.isSystem || target.code === 'SUPER_ADMIN' || target.name === 'Super Admin') {
      return {
        success: false,
        message: 'Không thể xóa vai trò hệ thống hoặc Super Admin!'
      };
    }

    try {
      const savedStaff = localStorage.getItem('dcor_staff_accounts_list');
      if (savedStaff) {
        const staffList: Array<{ role?: string; roles?: string[]; name: string }> = JSON.parse(savedStaff);
        const inUseCount = staffList.filter(s => 
          (s.roles && s.roles.includes(target.name)) || s.role === target.name
        ).length;
        if (inUseCount > 0) {
          return {
            success: false,
            message: `Không thể xóa vai trò "${target.name}" vì đang có ${inUseCount} nhân sự đảm nhiệm!`
          };
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra nhân sự sử dụng vai trò:', e);
    }

    const newRoles = currentRoles.filter(r => r.id !== id);
    this.saveRolesToStorage(newRoles);

    const allPerms = this.getAllRolePermissionsFromStorage();
    if (allPerms[target.name]) {
      delete allPerms[target.name];
      this.saveAllRolePermissionsToStorage(allPerms);
    }

    return {
      success: true,
      message: `Đã xóa vai trò "${target.name}" thành công!`
    };
  }

  // =========================================================================
  // XÁC THỰC & ĐĂNG NHẬP
  // =========================================================================

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/login`, { email, password }).pipe(
      map(res => {
        const rawUser = res.user || {};
        if (rawUser.status && rawUser.status !== 'ACTIVE') {
          throw new Error('Tài khoản đã bị tạm khóa hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
        }

        const branchId = rawUser.branchId || 'ALL';
        const branchName = this.getBranchName(branchId);
        const roles = Array.isArray(rawUser.roles) && rawUser.roles.length > 0 
          ? rawUser.roles 
          : [normalizeAdminRole(rawUser.role || 'Super Admin')];

        const user: AdminUser = {
          id: rawUser.id || 'admin-' + Date.now(),
          fullName: rawUser.fullName || rawUser.name || email.split('@')[0],
          email: rawUser.email || email,
          role: roles[0],
          roles,
          roleCode: rawUser.roleCode || 'SUPER_ADMIN',
          branchId,
          branchName,
          assignedBranches: rawUser.assignedBranches || [branchId],
          avatar: rawUser.avatar || '',
          status: rawUser.status || 'ACTIVE'
        };

        return this.handleAuthSuccess(res.token, user, res.permissions);
      }),
      catchError(err => {
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

  logout(): void {
    this.stopSessionHeartbeat();
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.SESSION_EXPIRY_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);
    localStorage.removeItem('dcor_user');

    this.currentUser$.next(null);
    this.permissions$.next(null);

    window.history.replaceState(null, '', '/admin-login');
    this.router.navigate(['/admin-login'], { replaceUrl: true });
  }

  activateAccount(token: string, password: string, fullName?: string, email?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/admin/invite-accept`, {
      token,
      email: email || token,
      password,
      fullName
    }).pipe(
      map(res => {
        if (res.token && res.user) {
          const roles = Array.isArray(res.user.roles) && res.user.roles.length > 0
            ? res.user.roles
            : [res.user.role || 'Sales'];
          const primaryRole = res.user.role || roles[0];
          const branchId = res.user.branchId || 'ALL';
          const branchName = res.user.branchName || this.getBranchName(branchId);

          this.handleAuthSuccess(res.token, {
            id: res.user.id,
            fullName: res.user.fullName,
            email: res.user.email,
            role: primaryRole,
            roles: roles,
            branchId: branchId,
            branchName: branchName,
            assignedBranches: res.user.assignedBranches || [branchId],
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

  updateRolePermissions(role: string, permissions: RolePermissions): void {
    const allPerms = this.getAllRolePermissionsFromStorage();
    allPerms[role] = permissions;
    this.saveAllRolePermissionsToStorage(allPerms);

    if (this.currentUser$.value?.roles?.includes(role) || this.currentUser$.value?.role === role) {
      const effective = this.calculateEffectivePermissions(this.currentUser$.value.roles || [role]);
      this.permissions$.next(effective);
    }
  }

  private handleAuthSuccess(token: string, user: AdminUser, serverPermissions?: RolePermissions): LoginResponse {
    const rolePermissions = serverPermissions || this.calculateEffectivePermissions(user.roles || [user.role]);
    const isAdmin = user.role === 'Super Admin' || (user.roles && user.roles.includes('Super Admin'));
    const duration = this.IDLE_TIMEOUT_MS; // 4 tiếng không thao tác mới thu hồi phiên
    const expiresAt = Date.now() + duration;

    // Lưu vào sessionStorage
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt.toString());

    // Lưu lâu dài vào localStorage để khi tắt tab mở lại vẫn giữ phiên như Facebook
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt.toString());
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(rolePermissions));
    localStorage.setItem('dcor_user', JSON.stringify({ ...user, role: 'ADMIN' }));

    this.currentUser$.next(user);
    this.permissions$.next(rolePermissions);
    this.startSessionHeartbeat();

    return { token, user };
  }

  private loadStateFromStorage(): void {
    try {
      const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY) || localStorage.getItem(this.SESSION_EXPIRY_KEY));
      const token = sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
      const userStr = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);

      // Nếu đã quá hạn phiên làm việc
      if (expiresAt && Date.now() > expiresAt) {
        this.logout();
        return;
      }

      if (token && userStr) {
        const user: AdminUser = JSON.parse(userStr);
        user.role = normalizeAdminRole(user.role);
        if (!user.roles || !Array.isArray(user.roles)) {
          user.roles = [user.role];
        }
        if (!user.branchId) user.branchId = 'ALL';
        if (!user.branchName) user.branchName = this.getBranchName(user.branchId);
        if (!user.assignedBranches) user.assignedBranches = [user.branchId];

        const perms = this.calculateEffectivePermissions(user.roles);

        // Đồng bộ sessionStorage nếu đang mở từ tab mới
        sessionStorage.setItem(this.TOKEN_KEY, token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        if (expiresAt) sessionStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt.toString());

        this.currentUser$.next(user);
        this.permissions$.next(perms);

        // KHI F5 & ĐĂNG NHẬP: Bắt đầu heartbeat kiểm tra định kỳ và kiểm tra ngay tức thì
        this.startSessionHeartbeat();
        this.verifySession().subscribe();
      }
    } catch (e) {
      console.warn('Lỗi khi đọc thông tin admin auth từ storage:', e);
      this.logout();
    }
  }

  /**
   * Xác thực thực tế trạng thái tài khoản với Backend PostgreSQL
   * Nếu tài khoản đã bị khóa trong DB, lập tức thu hồi phiên làm việc và điều hướng về login
   */
  verifySession(): Observable<boolean> {
    const token = sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return of(false);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any>(`${environment.apiUrl}/auth/admin/verify-session`, { headers }).pipe(
      map(res => {
        if (!res || !res.active) {
          console.warn('[AUTH] Phiên làm việc đã bị thu hồi hoặc tài khoản bị khóa.');
          this.handleAccountLocked('Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ Super Admin.');
          return false;
        }
        if (res.token) {
          sessionStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.TOKEN_KEY, res.token);
        }
        if (res.permissions) {
          this.permissions$.next(res.permissions);
          localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(res.permissions));
        }
        this.touchSession();
        return true;
      }),
      catchError(err => {
        if (err.status === 403 || err.status === 401) {
          const errMsg = err.error?.message || 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.';
          console.warn('[AUTH] Phiên đăng nhập không hợp lệ hoặc đã bị khóa:', errMsg);
          this.handleAccountLocked(errMsg);
          return of(false);
        }
        return of(true);
      })
    );
  }

  handleAccountLocked(message: string): void {
    this.logout();
    this.router.navigate(['/admin-login'], {
      queryParams: { error: message || 'Tài khoản của bạn đã bị tạm khóa.' }
    });
  }

  getAllRolePermissionsFromStorage(): Record<string, RolePermissions> {
    try {
      const saved = localStorage.getItem('dcor_all_role_permissions') || localStorage.getItem(this.PERMISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const merged: Record<string, RolePermissions> = {};
          const allRoleNames = Array.from(new Set([...Object.keys(DEFAULT_ROLE_PERMISSIONS), ...Object.keys(parsed)]));
          allRoleNames.forEach(roleName => {
            const base = DEFAULT_ROLE_PERMISSIONS[roleName] || createEmptyRolePermissions();
            const stored = parsed[roleName] || {};
            merged[roleName] = { ...createEmptyRolePermissions(), ...base, ...stored };
          });
          return merged;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc all permissions:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  }

  saveAllRolePermissionsToStorage(allPerms: Record<string, RolePermissions>): void {
    localStorage.setItem('dcor_all_role_permissions', JSON.stringify(allPerms));
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(allPerms));
  }

  // =========================================================================
  // IAM SERVER INTEGRATION (Đồng bộ trực tiếp với Server)
  // =========================================================================

  private getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
  }

  getRolesWithStaff(): Observable<RoleWithStaff[]> {
    return this.http.get<any>(`${environment.apiUrl}/admin/staff/roles`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        if (res.roles && Array.isArray(res.roles)) {
          this.rolesList$.next(res.roles);
          this.saveRolesToStorage(res.roles);
          return res.roles as RoleWithStaff[];
        }
        return [];
      }),
      catchError(err => {
        console.warn('[IAM] Lỗi tải vai trò từ server:', err);
        return of(this.rolesList$.value as RoleWithStaff[]);
      })
    );
  }

  fetchPermissionsMatrix(): Observable<{ roles: RoleDefinition[]; matrix: Record<string, RolePermissions> }> {
    return this.http.get<any>(`${environment.apiUrl}/admin/staff/permissions/matrix`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        if (res.roles && Array.isArray(res.roles)) {
          this.rolesList$.next(res.roles);
          this.saveRolesToStorage(res.roles);
        }
        if (res.matrix) {
          this.saveAllRolePermissionsToStorage(res.matrix);
        }
        return {
          roles: res.roles || this.rolesList$.value,
          matrix: res.matrix || this.getAllRolePermissionsFromStorage()
        };
      }),
      catchError(err => {
        console.warn('[IAM] Lỗi tải ma trận từ server, dùng cache nội bộ:', err);
        return of({
          roles: this.rolesList$.value,
          matrix: this.getAllRolePermissionsFromStorage()
        });
      })
    );
  }

  saveRolePermissionsMatrix(matrix: Record<string, RolePermissions>): Observable<any> {
    this.saveAllRolePermissionsToStorage(matrix);
    return this.http.put<any>(`${environment.apiUrl}/admin/staff/permissions/matrix`, { matrix }, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        if (res.matrix) {
          this.saveAllRolePermissionsToStorage(res.matrix);
        }
        if (this.currentUser) {
          const updatedPerms = this.calculateEffectivePermissions(this.currentUser.roles || [this.currentUser.role]);
          this.permissions$.next(updatedPerms);
        }
        return res;
      })
    );
  }

  createRoleOnServer(roleData: { name: string; code: string; description: string; cloneFromRoleName?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/admin/staff/roles`, roleData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        if (res.role) {
          const current = this.rolesList$.value;
          const updated = [...current, res.role];
          this.saveRolesToStorage(updated);
        }
        if (res.matrix) {
          this.saveAllRolePermissionsToStorage(res.matrix);
        }
        return res;
      })
    );
  }

  updateRoleOnServer(id: string, updated: { name?: string; description?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/admin/staff/roles/${id}`, updated, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        if (res.role) {
          const current = this.rolesList$.value.map(r => r.id === id ? res.role : r);
          this.saveRolesToStorage(current);
        }
        if (res.matrix) {
          this.saveAllRolePermissionsToStorage(res.matrix);
        }
        return res;
      })
    );
  }

  deleteRoleOnServer(id: string, reassignToRoleName: string = 'NV Kinh doanh'): Observable<any> {
    const target = this.rolesList$.value.find(r => r.id === id);
    const targetName = target?.name;

    return this.http.delete<any>(`${environment.apiUrl}/admin/staff/roles/${id}`, {
      headers: this.getAuthHeaders(),
      body: { reassignToRoleName }
    }).pipe(
      map(res => {
        if (res.roles) {
          this.saveRolesToStorage(res.roles);
        } else {
          const current = this.rolesList$.value.filter(r => r.id !== id);
          this.saveRolesToStorage(current);
        }
        if (res.matrix) {
          this.saveAllRolePermissionsToStorage(res.matrix);
        }

        // XỬ LÝ AN TOÀN TRÁNH LỖI TREO WEB:
        // Cập nhật lại các nhân sự bị xóa vai trò trong cache client
        if (targetName) {
          try {
            const raw = localStorage.getItem('dcor_staff_accounts_list');
            if (raw) {
              const staffList = JSON.parse(raw);
              if (Array.isArray(staffList)) {
                staffList.forEach((s: any) => {
                  if (Array.isArray(s.roles) && s.roles.includes(targetName)) {
                    s.roles = s.roles.filter((r: string) => r !== targetName);
                    if (s.roles.length === 0) {
                      s.roles = [reassignToRoleName];
                    }
                    s.role = s.roles.join(', ');
                  } else if (s.role === targetName) {
                    s.role = reassignToRoleName;
                    s.roles = [reassignToRoleName];
                  }
                });
                localStorage.setItem('dcor_staff_accounts_list', JSON.stringify(staffList));
              }
            }
          } catch (e) {
            console.warn('Lỗi đồng bộ cache nhân sự sau khi xóa role:', e);
          }

          // Cập nhật người dùng hiện tại nếu bị ảnh hưởng
          if (this.currentUser) {
            let uRoles = this.currentUser.roles || [this.currentUser.role];
            if (uRoles.includes(targetName)) {
              uRoles = uRoles.filter(r => r !== targetName);
              if (uRoles.length === 0) {
                uRoles = [reassignToRoleName];
              }
              const updatedUser = {
                ...this.currentUser,
                role: uRoles[0],
                roles: uRoles
              };
              this.currentUser$.next(updatedUser);
              sessionStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
              localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
              this.permissions$.next(this.calculateEffectivePermissions(uRoles));
            }
          }
        }

        return res;
      })
    );
  }
}
