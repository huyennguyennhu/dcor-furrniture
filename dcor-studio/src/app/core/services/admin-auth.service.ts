import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
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
    phone: '1900 8888',
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
    name: 'Quản lý sản phẩm',
    code: 'PRODUCT_MGR',
    description: 'Quản lý danh mục, thông tin sản phẩm, định giá, thuộc tính và hình ảnh.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-inventory-mgr',
    name: 'Quản lý kho',
    code: 'INVENTORY_MGR',
    description: 'Quản lý nhập - xuất hàng hóa, điều chuyển kho showroom và kiểm kê định kỳ tại 4 kho.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-order-mgr',
    name: 'Quản lý đơn hàng',
    code: 'ORDER_MGR',
    description: 'Tiếp nhận, xử lý đơn hàng, điều phối vận chuyển và xử lý hoàn trả.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-marketing',
    name: 'Marketing',
    code: 'MARKETING',
    description: 'Quản trị các chiến dịch quảng bá, voucher khuyến mãi và nội dung thương hiệu.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-cskh',
    name: 'CSKH',
    code: 'CSKH',
    description: 'Chăm sóc và giải quyết thắc mắc khách hàng, hỗ trợ sau bán và tư vấn chat.',
    isSystem: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'role-sales',
    name: 'Sales',
    code: 'SALES',
    description: 'Tư vấn bán hàng trực tiếp tại showroom, lập báo giá và chốt đơn đặt hàng theo showroom.',
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

export function normalizeAdminRole(role: string): string {
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
  private readonly SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 tiếng tối đa cho mỗi phiên

  // State Management
  readonly currentUser$ = new BehaviorSubject<AdminUser | null>(null);
  readonly permissions$ = new BehaviorSubject<RolePermissions | null>(null);
  readonly rolesList$ = new BehaviorSubject<RoleDefinition[]>([]);
  readonly branchesList$ = new BehaviorSubject<Branch[]>(SYSTEM_BRANCHES);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initRolesList();
    this.loadStateFromStorage();
  }

  get currentUser(): AdminUser | null {
    return this.currentUser$.value;
  }

  get permissions(): RolePermissions | null {
    return this.permissions$.value;
  }

  get token(): string | null {
    const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY));
    if (expiresAt && Date.now() > expiresAt) {
      this.logout();
      return null;
    }
    return sessionStorage.getItem(this.TOKEN_KEY);
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
    const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY));
    if (expiresAt && Date.now() > expiresAt) {
      this.logout();
      return false;
    }
    return !!sessionStorage.getItem(this.TOKEN_KEY) && !!this.currentUser$.value;
  }

  // =========================================================================
  // PHÂN QUYỀN CHỨC NĂNG & CHI NHÁNH (2 CHIỀU + MULTI-ROLE)
  // =========================================================================

  /**
   * Tính toán quyền tổng hợp (UNION) từ một hoặc nhiều vai trò được gán cho nhân sự
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
      'products', 'categories', 'orders', 'inventory', 'promotions', 'customers', 'staff', 'reports', 'settings'
    ];
    const actions: (keyof PermissionActions)[] = ['view', 'create', 'edit', 'delete', 'approve'];

    const result: any = {};
    modules.forEach(m => {
      result[m] = { view: false, create: false, edit: false, delete: false, approve: false };
      actions.forEach(act => {
        // Hợp quyền: Có quyền nếu BẤT KỲ vai trò nào được gán có quyền đó
        result[m][act] = roles.some(roleName => {
          const roleMatrix = allPerms[roleName] || DEFAULT_ROLE_PERMISSIONS[roleName];
          return roleMatrix && roleMatrix[m] && roleMatrix[m][act];
        });
      });
    });

    return result as RolePermissions;
  }

  /**
   * Kiểm tra quyền chức năng theo module và hành động
   */
  hasPermission(module: string, action: keyof PermissionActions = 'view'): boolean {
    const user = this.currentUser$.value;
    if (!user) return false;
    
    // Super Admin toàn quyền
    if (user.role === 'Super Admin' || (user.roles && user.roles.includes('Super Admin'))) {
      return true;
    }

    const currentPerms = this.permissions$.value;
    if (!currentPerms) return false;

    const modKey = module as AdminModule;
    return !!currentPerms[modKey]?.[action];
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

        return this.handleAuthSuccess(res.token, user);
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
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.SESSION_EXPIRY_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
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

  private handleAuthSuccess(token: string, user: AdminUser): LoginResponse {
    const rolePermissions = this.calculateEffectivePermissions(user.roles || [user.role]);
    const expiresAt = Date.now() + this.SESSION_DURATION_MS;

    // Lưu vào sessionStorage (phiên làm việc sẽ tự hủy khi đóng trình duyệt/tab)
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt.toString());

    // Xóa triệt để các token cũ trong localStorage để tránh phiên vô hạn
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(rolePermissions));
    localStorage.setItem('dcor_user', JSON.stringify({ ...user, role: 'ADMIN' }));

    this.currentUser$.next(user);
    this.permissions$.next(rolePermissions);

    return { token, user };
  }

  private loadStateFromStorage(): void {
    try {
      // Dọn dẹp token vĩnh cửu cũ nếu có
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);

      const expiresAt = Number(sessionStorage.getItem(this.SESSION_EXPIRY_KEY));
      const token = sessionStorage.getItem(this.TOKEN_KEY);
      const userStr = sessionStorage.getItem(this.USER_KEY);

      // Nếu đã quá hạn phiên làm việc (hoặc không có hạn phiên hợp lệ)
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

        this.currentUser$.next(user);
        this.permissions$.next(perms);
      }
    } catch (e) {
      console.warn('Lỗi khi đọc thông tin admin auth từ storage:', e);
      this.logout();
    }
  }

  getAllRolePermissionsFromStorage(): Record<string, RolePermissions> {
    try {
      const saved = localStorage.getItem('dcor_all_role_permissions') || localStorage.getItem(this.PERMISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_ROLE_PERMISSIONS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc all permissions:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  }

  private saveAllRolePermissionsToStorage(allPerms: Record<string, RolePermissions>): void {
    localStorage.setItem('dcor_all_role_permissions', JSON.stringify(allPerms));
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(allPerms));
  }
}
