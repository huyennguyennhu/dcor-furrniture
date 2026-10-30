import fs from 'fs';
import path from 'path';

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

export interface PermissionActions {
  view: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  [key: string]: boolean | undefined;
}

export type RolePermissions = Record<AdminModule, PermissionActions>;

export interface RoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

export const ALL_ADMIN_MODULES: AdminModule[] = [
  'reports',
  'customers',
  'products',
  'categories',
  'inventory',
  'orders',
  'promotions',
  'designs',
  'appointments',
  'content',
  'chat',
  'staff',
  'settings'
];

export const EMPTY_PERMISSIONS: PermissionActions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false
};

export const FULL_PERMISSIONS: PermissionActions = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true
};

export function createEmptyModulePermissions(): RolePermissions {
  const result: any = {};
  ALL_ADMIN_MODULES.forEach(m => {
    result[m] = { ...EMPTY_PERMISSIONS };
  });
  return result as RolePermissions;
}

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
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
  }
];

export const DEFAULT_ROLE_PERMISSIONS_MATRIX: Record<string, RolePermissions> = {
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
    customers: { ...EMPTY_PERMISSIONS },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    designs: { view: true, create: true, edit: true, delete: false, approve: true },
    appointments: { ...EMPTY_PERMISSIONS },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    chat: { ...EMPTY_PERMISSIONS },
    settings: { ...EMPTY_PERMISSIONS }
  },
  'Quản lý kho': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: false, edit: true, delete: false, approve: false },
    inventory: { view: true, create: true, edit: true, delete: true, approve: true },
    promotions: { ...EMPTY_PERMISSIONS },
    customers: { ...EMPTY_PERMISSIONS },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    designs: { ...EMPTY_PERMISSIONS },
    appointments: { ...EMPTY_PERMISSIONS },
    content: { ...EMPTY_PERMISSIONS },
    chat: { ...EMPTY_PERMISSIONS },
    settings: { ...EMPTY_PERMISSIONS }
  },
  'Quản lý đơn hàng': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: true, edit: true, delete: true, approve: true },
    inventory: { view: true, create: false, edit: false, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: false },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    designs: { ...EMPTY_PERMISSIONS },
    appointments: { view: true, create: false, edit: false, delete: false, approve: false },
    content: { ...EMPTY_PERMISSIONS },
    chat: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...EMPTY_PERMISSIONS }
  },
  'Marketing': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { ...EMPTY_PERMISSIONS },
    inventory: { ...EMPTY_PERMISSIONS },
    promotions: { view: true, create: true, edit: true, delete: true, approve: true },
    customers: { view: true, create: false, edit: false, delete: false, approve: false },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { view: true, create: false, edit: false, delete: false, approve: false },
    designs: { view: true, create: true, edit: true, delete: false, approve: false },
    appointments: { ...EMPTY_PERMISSIONS },
    content: { view: true, create: true, edit: true, delete: true, approve: true },
    chat: { ...EMPTY_PERMISSIONS },
    settings: { ...EMPTY_PERMISSIONS }
  },
  'CSKH': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: false, edit: true, delete: false, approve: false },
    inventory: { view: true, create: false, edit: false, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: true },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { ...EMPTY_PERMISSIONS },
    designs: { ...EMPTY_PERMISSIONS },
    appointments: { view: true, create: true, edit: true, delete: false, approve: true },
    content: { view: true, create: false, edit: false, delete: false, approve: false },
    chat: { view: true, create: true, edit: true, delete: false, approve: true },
    settings: { ...EMPTY_PERMISSIONS }
  },
  'Sales': {
    products: { view: true, create: false, edit: false, delete: false, approve: false },
    categories: { view: true, create: false, edit: false, delete: false, approve: false },
    orders: { view: true, create: true, edit: true, delete: false, approve: false },
    inventory: { view: true, create: false, edit: false, delete: false, approve: false },
    promotions: { view: true, create: false, edit: false, delete: false, approve: false },
    customers: { view: true, create: true, edit: true, delete: false, approve: false },
    staff: { ...EMPTY_PERMISSIONS },
    reports: { ...EMPTY_PERMISSIONS },
    designs: { view: true, create: false, edit: false, delete: false, approve: false },
    appointments: { view: true, create: true, edit: true, delete: false, approve: false },
    content: { ...EMPTY_PERMISSIONS },
    chat: { view: true, create: false, edit: false, delete: false, approve: false },
    settings: { ...EMPTY_PERMISSIONS }
  }
};

const DATA_DIR = path.join(__dirname, '..', 'data');
const ROLES_FILE = path.join(DATA_DIR, 'roles-permissions.json');

interface RolesDataFile {
  roles: RoleDefinition[];
  matrix: Record<string, RolePermissions>;
}

let inMemoryData: RolesDataFile | null = null;

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ROLES_FILE)) {
      const initial: RolesDataFile = {
        roles: DEFAULT_SYSTEM_ROLES,
        matrix: DEFAULT_ROLE_PERMISSIONS_MATRIX
      };
      fs.writeFileSync(ROLES_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      inMemoryData = initial;
    }
  } catch (err) {
    console.warn('[IAM] Lỗi khởi tạo roles-permissions.json:', err);
  }
}

function loadData(): RolesDataFile {
  if (inMemoryData !== null) {
    return inMemoryData;
  }
  ensureDataFile();
  try {
    const raw = fs.readFileSync(ROLES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    inMemoryData = {
      roles: Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : DEFAULT_SYSTEM_ROLES,
      matrix: parsed.matrix && typeof parsed.matrix === 'object' ? parsed.matrix : DEFAULT_ROLE_PERMISSIONS_MATRIX
    };
    return inMemoryData;
  } catch (e) {
    inMemoryData = {
      roles: DEFAULT_SYSTEM_ROLES,
      matrix: DEFAULT_ROLE_PERMISSIONS_MATRIX
    };
    return inMemoryData;
  }
}

function saveData(data: RolesDataFile): void {
  try {
    ensureDataFile();
    inMemoryData = data;
    fs.writeFileSync(ROLES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[IAM] Lỗi ghi file roles-permissions.json:', err);
  }
}

export const iamService = {
  // Lấy danh sách toàn bộ các vai trò
  getAllRoles(): RoleDefinition[] {
    const data = loadData();
    return [...data.roles];
  },

  // Lấy ma trận quyền đầy đủ (trục dọc là Vai trò, trục ngang là Phân hệ)
  getRolePermissionsMatrix(): Record<string, RolePermissions> {
    const data = loadData();
    const matrix: Record<string, RolePermissions> = {};
    const roles = data.roles;

    roles.forEach(r => {
      const existing = data.matrix[r.name] || DEFAULT_ROLE_PERMISSIONS_MATRIX[r.name] || createEmptyModulePermissions();
      // Ensure all modules are defined
      const rolePerms = createEmptyModulePermissions();
      ALL_ADMIN_MODULES.forEach(m => {
        rolePerms[m] = existing[m] ? { ...existing[m] } : { ...EMPTY_PERMISSIONS };
      });
      // Super admin is always full
      if (r.name === 'Super Admin' || r.code === 'SUPER_ADMIN') {
        ALL_ADMIN_MODULES.forEach(m => {
          rolePerms[m] = { ...FULL_PERMISSIONS };
        });
      }
      matrix[r.name] = rolePerms;
    });

    return matrix;
  },

  // Cập nhật ma trận phân quyền từ phía admin
  updateRolePermissionsMatrix(newMatrix: Record<string, RolePermissions>): Record<string, RolePermissions> {
    const data = loadData();
    // Luôn giữ quyền Super Admin là full
    if (newMatrix['Super Admin']) {
      ALL_ADMIN_MODULES.forEach(m => {
        newMatrix['Super Admin'][m] = { ...FULL_PERMISSIONS };
      });
    }

    data.matrix = {
      ...data.matrix,
      ...newMatrix
    };
    saveData(data);
    return this.getRolePermissionsMatrix();
  },

  // Thêm một vai trò mới
  addRole(
    roleData: { name: string; code: string; description: string },
    cloneFromRoleName?: string
  ): RoleDefinition {
    const data = loadData();
    const cleanName = roleData.name.trim();
    const cleanCode = roleData.code.trim().toUpperCase().replace(/\s+/g, '_');

    const existing = data.roles.find(
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

    let sourcePerms: RolePermissions;
    if (cloneFromRoleName && data.matrix[cloneFromRoleName]) {
      sourcePerms = JSON.parse(JSON.stringify(data.matrix[cloneFromRoleName]));
    } else {
      sourcePerms = createEmptyModulePermissions();
    }

    data.roles.push(newRole);
    data.matrix[newRole.name] = sourcePerms;
    saveData(data);

    return newRole;
  },

  // Sửa vai trò
  updateRole(id: string, updated: { name?: string; description?: string }): RoleDefinition {
    const data = loadData();
    const index = data.roles.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy vai trò cần cập nhật.');
    }

    const target = data.roles[index];
    const oldName = target.name;
    const newName = updated.name ? updated.name.trim() : target.name;

    if (target.code === 'SUPER_ADMIN' && newName !== 'Super Admin') {
      throw new Error('Không thể đổi tên vai trò Super Admin!');
    }

    const updatedRole: RoleDefinition = {
      ...target,
      name: newName,
      description: updated.description !== undefined ? updated.description.trim() : target.description
    };

    if (oldName !== newName && data.matrix[oldName]) {
      data.matrix[newName] = data.matrix[oldName];
      delete data.matrix[oldName];
    }

    data.roles[index] = updatedRole;
    saveData(data);
    return updatedRole;
  },

  // Xóa vai trò (Chỉ bảo vệ duy nhất Super Admin không được xóa)
  deleteRole(id: string): { success: boolean; message: string; deletedRoleName?: string } {
    const data = loadData();
    const target = data.roles.find(r => r.id === id);
    if (!target) {
      return { success: false, message: 'Vai trò không tồn tại.' };
    }

    if (target.code === 'SUPER_ADMIN' || target.name === 'Super Admin') {
      return { success: false, message: 'Không thể xóa vai trò Super Admin tối cao của hệ thống!' };
    }

    const deletedRoleName = target.name;
    data.roles = data.roles.filter(r => r.id !== id);
    if (data.matrix[deletedRoleName]) {
      delete data.matrix[deletedRoleName];
    }
    saveData(data);

    return { 
      success: true, 
      message: `Đã xóa vai trò "${deletedRoleName}" thành công!`,
      deletedRoleName 
    };
  },

  // Tính toán quyền tổng hợp (UNION) theo các role của user
  getEffectivePermissions(roles: string[] | string): RolePermissions {
    const rawList = Array.isArray(roles) ? roles : [roles];
    const roleList = rawList.filter(Boolean);
    if (roleList.length === 0) {
      // Fallback an toàn tránh crash khi nhân viên tạm thời chưa có role
      return createEmptyModulePermissions();
    }

    // Super Admin có tất cả các quyền
    if (
      roleList.some(r => {
        const lower = (r || '').trim().toLowerCase();
        return lower === 'super admin' || lower === 'super_admin';
      })
    ) {
      const full = createEmptyModulePermissions();
      ALL_ADMIN_MODULES.forEach(m => {
        full[m] = { ...FULL_PERMISSIONS };
      });
      return full;
    }

    const matrix = this.getRolePermissionsMatrix();
    const result = createEmptyModulePermissions();

    roleList.forEach(rawRoleName => {
      // Tự động chuẩn hóa tên vai trò cũ nếu có
      const roleName = rawRoleName === 'Sales' ? 'NV Kinh doanh'
        : rawRoleName === 'Quản lý kho' ? 'QL Kho'
        : rawRoleName === 'Quản lý sản phẩm' ? 'QL Sản phẩm'
        : rawRoleName === 'Quản lý đơn hàng' ? 'QL Đơn hàng'
        : rawRoleName;

      const rolePerms = matrix[roleName] || matrix[rawRoleName];
      if (rolePerms) {
        ALL_ADMIN_MODULES.forEach(m => {
          if (rolePerms[m]) {
            Object.keys(rolePerms[m]).forEach(actKey => {
              if ((rolePerms[m] as any)[actKey]) {
                (result[m] as any)[actKey] = true;
              }
            });
          }
        });
      }
    });

    // BẢO VỆ CHỐNG TREO WEB: Nếu user không còn quyền trên bất kỳ phân hệ nào (do role đã bị xóa trước đó)
    // Tự động gán quyền cơ bản của NV Kinh doanh để tài khoản luôn có quyền hợp lệ, ngăn chặn vòng lặp chuyển hướng vô tận
    let hasAnyGranted = false;
    ALL_ADMIN_MODULES.forEach(m => {
      if (Object.values(result[m]).some(Boolean)) hasAnyGranted = true;
    });

    if (!hasAnyGranted) {
      const fallbackPerms = matrix['NV Kinh doanh'] || DEFAULT_ROLE_PERMISSIONS_MATRIX['NV Kinh doanh'];
      if (fallbackPerms) {
        ALL_ADMIN_MODULES.forEach(m => {
          if (fallbackPerms[m]) {
            Object.keys(fallbackPerms[m]).forEach(actKey => {
              if ((fallbackPerms[m] as any)[actKey]) {
                (result[m] as any)[actKey] = true;
              }
            });
          }
        });
      }
    }

    return result;
  },

  // CƠ CHẾ IAM CỐT LÕI TẠI SERVER:
  // Kiểm tra xem user có quyền thực hiện hành động trên phân hệ hay không
  hasPermission(
    user: any,
    module: AdminModule | string,
    action: keyof PermissionActions = 'view'
  ): boolean {
    if (!user) return false;

    // 1. Chỉ duy nhất Super Admin mới được toàn quyền hệ thống
    const isSuperAdminRole = (r: string) => {
      const lower = (r || '').trim().toLowerCase();
      return lower === 'super admin' || lower === 'super_admin';
    };

    const roles: string[] = Array.isArray(user.roles) && user.roles.length > 0 
      ? user.roles 
      : [user.role || 'NV Kinh doanh'];

    if (roles.some(isSuperAdminRole) || isSuperAdminRole(user.role)) {
      return true;
    }

    // 2. Tính toán quyền theo ma trận role trên server
    const effective = this.getEffectivePermissions(roles);
    const modKey = module as AdminModule;
    const modPerms = (effective as any)[modKey];
    if (!modPerms) return false;

    // Phân hệ "categories" (Danh mục sản phẩm)
    if (modKey === 'categories') {
      const hasCategoriesAccess = !!effective.categories?.['view'] || !!effective.products?.['categories'] || !!effective.products?.['view'];
      if (!hasCategoriesAccess) return false;

      const catPerm = effective.categories || effective.products;
      if (!catPerm) return false;
      if (action === 'create') {
        // Ràng buộc IAM: ở danh mục không có quyền sửa thì dù có tạo cũng không được thực hiện
        return !!catPerm['create'] && !!catPerm['edit'];
      }
      return !!catPerm[action];
    }

    // Phân hệ "designs" (Cộng đồng thiết kế)
    if (modKey === 'designs') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'approve') return !!modPerms['approve'];
      if (action === 'delete') return !!modPerms['delete'];
      if (action === 'config' || action === 'create' || action === 'edit') {
        return !!modPerms['config'] || !!modPerms[action];
      }
      return !!modPerms[action];
    }

    // Phân hệ "inventory" (Tồn kho & Showroom)
    if (modKey === 'inventory') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'audit') return !!modPerms['audit'];
      if (action === 'transactions' || action === 'create') return !!modPerms['transactions'] || !!modPerms['create'];
      if (action === 'approve') return !!modPerms['approve'];
      if (action === 'delete') return !!modPerms['delete'];
      if (action === 'settings') return !!modPerms['settings'];
      return !!modPerms[action];
    }

    // Phân hệ "orders" (Đơn hàng)
    if (modKey === 'orders') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'create') return !!modPerms['create'];
      if (action === 'edit' || action === 'approve') return !!modPerms['edit'] || !!modPerms['approve'];
      if (action === 'delete' || action === 'cancel') return !!modPerms['delete'] || !!modPerms['edit'];
      return !!modPerms[action];
    }

    // Phân hệ "reports" (Báo cáo & Thống kê)
    if (modKey === 'reports') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'export_file') return !!modPerms['export_file'];
      return !!modPerms[action];
    }

    // Phân hệ "customers" (Khách hàng)
    if (modKey === 'customers') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'edit') return !!modPerms['edit'];
      if (action === 'lock_account') return !!modPerms['lock_account'] || !!modPerms['edit'];
      return !!modPerms[action];
    }

    // Phân hệ "appointments" (Tư vấn Showroom)
    if (modKey === 'appointments') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'assign') return !!modPerms['assign'] || !!modPerms['edit'];
      if (action === 'update') return !!modPerms['update'] || !!modPerms['edit'];
      return !!modPerms[action];
    }

    // Phân hệ "content" (Tin tức & Blog)
    if (modKey === 'content') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'create') return !!modPerms['create'];
      if (action === 'edit') return !!modPerms['edit'];
      if (action === 'delete') return !!modPerms['delete'];
      return !!modPerms[action];
    }

    // Phân hệ "chat" (Hội thoại CSKH)
    if (modKey === 'chat') {
      if (action === 'view') return !!modPerms['view'];
      if (action === 'reply' || action === 'create') return !!modPerms['reply'] || !!modPerms['create'] || !!modPerms['edit'];
      if (action === 'close' || action === 'delete') return !!modPerms['close'] || !!modPerms['delete'] || !!modPerms['edit'];
      return !!modPerms[action];
    }

    // Mặc định từ chối (Fail-Closed) nếu quyền chưa được cấp
    return !!modPerms[action];
  }
};

