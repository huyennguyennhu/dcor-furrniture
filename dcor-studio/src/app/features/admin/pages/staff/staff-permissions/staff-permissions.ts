import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { IconComponent, IconName } from '../../../../../shared/components/icon/icon';
import { 
  AdminAuthService, 
  AdminModule, 
  RolePermissions, 
  RoleDefinition,
  DEFAULT_ROLE_PERMISSIONS 
} from '../../../../../core/services/admin-auth.service';
import { environment } from '../../../../../../environments/environment';

export interface PermissionActionDef {
  key: string;
  name: string; // Tên ngắn gọn: tối đa 3 chữ
}

export interface PermissionModuleGroup {
  key: AdminModule;
  name: string;
  icon: IconName;
  actions: PermissionActionDef[];
}

@Component({
  selector: 'app-staff-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './staff-permissions.html',
  styleUrls: ['./staff-permissions.css']
})
export class StaffPermissionsComponent implements OnInit, OnDestroy {
  // 12 Phân hệ nghiệp vụ hệ thống DCor với các thao tác thực tế (Tối đa 3 chữ cho mỗi thao tác)
  readonly modulesList: PermissionModuleGroup[] = [
    {
      key: 'reports',
      name: 'Báo cáo & Thống kê',
      icon: 'ChartNoAxesCombined',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'export_file', name: 'Xuất/nhập file' }
      ]
    },
    {
      key: 'customers',
      name: 'Khách hàng',
      icon: 'UsersRound',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'edit', name: 'Sửa' },
        { key: 'lock_account', name: 'Khóa tài khoản' }
      ]
    },
    {
      key: 'products',
      name: 'Sản phẩm & Danh mục',
      icon: 'Package',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'delete', name: 'Xóa' },
        { key: 'categories', name: 'Danh mục' }
      ]
    },
    {
      key: 'inventory',
      name: 'Tồn kho & Showroom',
      icon: 'Warehouse',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'audit', name: 'Kiểm kê' },
        { key: 'transactions', name: 'Lệnh xuất/nhập' },
        { key: 'approve', name: 'Duyệt lệnh' },
        { key: 'settings', name: 'Cài đặt kho' }
      ]
    },
    {
      key: 'orders',
      name: 'Đơn hàng',
      icon: 'ShoppingCart',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'returns', name: 'Đổi trả' },
        { key: 'warranty', name: 'Bảo hành' }
      ]
    },
    {
      key: 'promotions',
      name: 'Khuyến mãi & Voucher',
      icon: 'TicketPercent',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'delete', name: 'Xóa' }
      ]
    },
    {
      key: 'designs',
      name: 'Cộng đồng thiết kế',
      icon: 'Image',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'approve', name: 'Duyệt bài' },
        { key: 'config', name: 'Cấu hình' },
        { key: 'delete', name: 'Xóa' }
      ]
    },
    {
      key: 'appointments',
      name: 'Tư vấn Showroom',
      icon: 'CalendarDays',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'assign', name: 'Phân công' },
        { key: 'update', name: 'Cập nhật' }
      ]
    },
    {
      key: 'content',
      name: 'Blog tin tức',
      icon: 'Newspaper',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'delete', name: 'Xóa' }
      ]
    },
    {
      key: 'chat',
      name: 'Hội thoại CSKH',
      icon: 'MessagesSquare',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'reply', name: 'Phản hồi chat' },
        { key: 'close', name: 'Đóng hội thoại' }
      ]
    },
    {
      key: 'staff',
      name: 'Nhân sự',
      icon: 'ShieldCheck',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'delete', name: 'Xóa' },
        { key: 'permissions', name: 'Phân quyền' }
      ]
    },
    {
      key: 'settings',
      name: 'Cài đặt & Nhật ký',
      icon: 'Settings',
      actions: [
        { key: 'view', name: 'Xem' },
        { key: 'edit', name: 'Sửa' },
        { key: 'audit_log', name: 'Nhật ký' }
      ]
    }
  ];

  // Danh sách các vai trò (Trục ngang - Cột)
  rolesList: RoleDefinition[] = [];

  // Ma trận quyền: Record<RoleName, Record<ModuleKey, Record<ActionKey, boolean>>>
  allRolePermissions: Record<string, any> = {};

  // Số lượng nhân viên đang nắm giữ vai trò
  staffCounts: Record<string, number> = {};

  // Theo dõi các phân hệ đang mở rộng (Expandable tree)
  expandedModules: Set<string> = new Set<string>();

  // Ô tìm kiếm phân hệ hoặc vai trò
  searchQuery = '';

  // Trạng thái lưu & Toast
  saveLoading = false;
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  // --- Modal Thêm vai trò mới ---
  isAddRoleModalOpen = false;
  newRoleData = {
    name: '',
    code: '',
    description: '',
    cloneFromRoleName: 'NV Kinh doanh'
  };

  // --- Modal Sửa vai trò ---
  isEditRoleModalOpen = false;
  editRoleData = {
    id: '',
    name: '',
    description: ''
  };

  // --- Modal Xác nhận xóa vai trò kèm chuyển giao nhân sự an toàn ---
  isDeleteConfirmModalOpen = false;
  roleToDelete: RoleDefinition | null = null;
  reassignTargetRoleName: string = 'NV Kinh doanh';

  isLoading = false;

  private sub: Subscription = new Subscription();

  constructor(
    public adminAuthService: AdminAuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Mở rộng tất cả các phân hệ ban đầu để trực quan
    this.modulesList.forEach(m => this.expandedModules.add(m.key));

    // 1. Tự động lắng nghe danh sách vai trò từ AdminAuthService
    this.sub.add(
      this.adminAuthService.rolesList$.subscribe(roles => {
        if (roles && roles.length > 0) {
          this.rolesList = [...roles];
          this.ensureAllRolesInitialized();
          this.cdr.detectChanges();
        }
      })
    );

    // 2. Tải ma trận phân quyền từ Server IAM
    this.loadMatrixFromServer();

    // 3. Tải số lượng nhân sự đảm nhiệm từng vai trò
    this.loadStaffCounts();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadMatrixFromServer(): void {
    this.isLoading = true;
    this.sub.add(
      this.adminAuthService.fetchPermissionsMatrix().subscribe({
        next: (data) => {
          this.rolesList = data.roles || [];
          this.allRolePermissions = JSON.parse(JSON.stringify(data.matrix || {}));
          this.ensureAllRolesInitialized();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('[IAM] Lỗi tải ma trận từ server:', err);
          this.rolesList = this.adminAuthService.roles;
          this.allRolePermissions = this.adminAuthService.getAllRolePermissionsFromStorage();
          this.ensureAllRolesInitialized();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private ensureAllRolesInitialized(): void {
    this.rolesList.forEach(r => {
      if (!this.allRolePermissions[r.name]) {
        this.allRolePermissions[r.name] = JSON.parse(
          JSON.stringify(DEFAULT_ROLE_PERMISSIONS[r.name] || DEFAULT_ROLE_PERMISSIONS['NV Kinh doanh'] || {})
        );
      }
      this.modulesList.forEach(m => {
        if (!this.allRolePermissions[r.name][m.key]) {
          this.allRolePermissions[r.name][m.key] = {};
        }
        m.actions.forEach(act => {
          if (r.name === 'Super Admin' || r.code === 'SUPER_ADMIN') {
            this.allRolePermissions[r.name][m.key][act.key] = true;
          } else if (this.allRolePermissions[r.name][m.key][act.key] === undefined) {
            this.allRolePermissions[r.name][m.key][act.key] = false;
          }
        });
      });
    });
  }

  loadStaffCounts(): void {
    this.http.get<any[]>(`${environment.apiUrl}/admin/staff`).subscribe({
      next: (staffList) => {
        if (Array.isArray(staffList)) {
          const counts: Record<string, number> = {};
          staffList.forEach(s => {
            const rList = Array.isArray(s.roles) && s.roles.length > 0 ? s.roles : [s.role];
            rList.forEach((rName: string) => {
              if (rName) {
                counts[rName] = (counts[rName] || 0) + 1;
              }
            });
          });
          this.staffCounts = counts;
        }
      },
      error: () => {}
    });
  }

  getStaffCount(roleName: string): number {
    return this.staffCounts[roleName] || 0;
  }

  // =========================================================================
  // TREE-TABLE MỞ RỘNG / THU GỌN
  // =========================================================================

  isModuleExpanded(modKey: string): boolean {
    return this.expandedModules.has(modKey);
  }

  toggleModuleExpand(modKey: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.expandedModules.has(modKey)) {
      this.expandedModules.delete(modKey);
    } else {
      this.expandedModules.add(modKey);
    }
  }

  areAllModulesExpanded(): boolean {
    return this.modulesList.every(m => this.expandedModules.has(m.key));
  }

  toggleAllModules(): void {
    if (this.areAllModulesExpanded()) {
      this.expandedModules.clear();
    } else {
      this.modulesList.forEach(m => this.expandedModules.add(m.key));
    }
  }

  // Lọc phân hệ nghiệp vụ theo tìm kiếm
  get filteredModulesList(): PermissionModuleGroup[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.modulesList;
    return this.modulesList.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.actions.some(a => a.name.toLowerCase().includes(q))
    );
  }

  // Lọc vai trò theo tìm kiếm
  get filteredRolesList(): RoleDefinition[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.rolesList;
    const matches = this.rolesList.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.code.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : this.rolesList;
  }

  // =========================================================================
  // LOGIC CHECKBOX PHÂN QUYỀN TRỰC TIẾP (TREE-TABLE CHECKBOX)
  // =========================================================================

  /**
   * Trạng thái Checkbox cha (Phân hệ):
   * - 'all': Có toàn bộ quyền con (hiển thị ✓ checked)
   * - 'some': Có một phần quyền con (hiển thị − indeterminate)
   * - 'none': Không có quyền nào (hiển thị ô trống unchecked)
   */
  getParentCheckboxState(roleName: string, mod: PermissionModuleGroup): 'all' | 'some' | 'none' {
    if (roleName === 'Super Admin') return 'all';
    const rolePerms = this.allRolePermissions[roleName]?.[mod.key];
    if (!rolePerms) return 'none';

    let granted = 0;
    mod.actions.forEach(act => {
      if (rolePerms[act.key]) granted++;
    });

    if (granted === mod.actions.length) return 'all';
    if (granted > 0) return 'some';
    return 'none';
  }

  toggleParentModuleCheckbox(role: RoleDefinition, mod: PermissionModuleGroup, event: MouseEvent): void {
    event.stopPropagation();
    if (role.name === 'Super Admin' || role.code === 'SUPER_ADMIN') {
      this.showToast('Super Admin mặc định sở hữu toàn bộ các quyền và không thể sửa đổi.', 'info');
      return;
    }

    const current = this.getParentCheckboxState(role.name, mod);
    const newValue = current !== 'all';

    if (!this.allRolePermissions[role.name]) {
      this.allRolePermissions[role.name] = {};
    }
    if (!this.allRolePermissions[role.name][mod.key]) {
      this.allRolePermissions[role.name][mod.key] = {};
    }

    mod.actions.forEach(act => {
      this.allRolePermissions[role.name][mod.key][act.key] = newValue;
    });
  }

  isActionChecked(roleName: string, modKey: AdminModule, actKey: string): boolean {
    if (roleName === 'Super Admin') return true;
    return !!this.allRolePermissions[roleName]?.[modKey]?.[actKey];
  }

  toggleActionCheckbox(role: RoleDefinition, modKey: AdminModule, actKey: string, event: MouseEvent): void {
    event.stopPropagation();
    if (role.name === 'Super Admin' || role.code === 'SUPER_ADMIN') {
      this.showToast('Super Admin mặc định sở hữu toàn bộ các quyền.', 'info');
      return;
    }

    if (!this.allRolePermissions[role.name]) {
      this.allRolePermissions[role.name] = {};
    }
    if (!this.allRolePermissions[role.name][modKey]) {
      this.allRolePermissions[role.name][modKey] = {};
    }

    const current = !!this.allRolePermissions[role.name][modKey][actKey];
    this.allRolePermissions[role.name][modKey][actKey] = !current;

    // Tự động bật quyền Xem nếu bật bất kỳ thao tác nâng cao nào
    if (!current && actKey !== 'view') {
      this.allRolePermissions[role.name][modKey]['view'] = true;
    }
  }

  // =========================================================================
  // LƯU MA TRẬN PHÂN QUYỀN LÊN SERVER
  // =========================================================================

  saveMatrixToServer(): void {
    this.saveLoading = true;
    this.cdr.detectChanges();
    this.adminAuthService.saveRolePermissionsMatrix(this.allRolePermissions).subscribe({
      next: () => {
        this.saveLoading = false;
        this.showToast('✓ Đã lưu và thực thi ma trận phân quyền IAM tại Server thành công!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saveLoading = false;
        const msg = err?.error?.message || err?.message || 'Lỗi khi lưu ma trận quyền lên server.';
        this.showToast(msg, 'warning');
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================================
  // QUẢN LÝ VAI TRÒ (THÊM / SỬA / XÓA VAI TRÒ KÈM CHUYỂN GIAO AN TOÀN)
  // =========================================================================

  openAddRoleModal(): void {
    this.newRoleData = {
      name: '',
      code: '',
      description: '',
      cloneFromRoleName: 'NV Kinh doanh'
    };
    this.isAddRoleModalOpen = true;
  }

  closeAddRoleModal(): void {
    this.isAddRoleModalOpen = false;
  }

  onRoleNameChange(): void {
    if (!this.newRoleData.code && this.newRoleData.name) {
      this.newRoleData.code = this.newRoleData.name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  }

  submitAddRole(): void {
    const cleanName = (this.newRoleData.name || '').trim();
    const cleanCode = (this.newRoleData.code || '').trim().toUpperCase().replace(/\s+/g, '_');

    if (!cleanName || cleanName.length < 2) {
      this.showToast('Vui lòng nhập tên vai trò từ 2 ký tự trở lên.', 'warning');
      return;
    }
    if (!cleanCode || cleanCode.length < 2) {
      this.showToast('Vui lòng nhập mã vai trò hợp lệ.', 'warning');
      return;
    }

    this.adminAuthService.createRoleOnServer({
      name: cleanName,
      code: cleanCode,
      description: this.newRoleData.description.trim(),
      cloneFromRoleName: this.newRoleData.cloneFromRoleName
    }).subscribe({
      next: () => {
        this.closeAddRoleModal();
        this.loadMatrixFromServer();
        this.showToast(`✓ Đã tạo vai trò "${cleanName}" thành công!`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Không thể tạo vai trò mới.';
        this.showToast(msg, 'warning');
      }
    });
  }

  openEditRoleModal(role: RoleDefinition, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.editRoleData = {
      id: role.id,
      name: role.name,
      description: role.description || ''
    };
    this.isEditRoleModalOpen = true;
  }

  closeEditRoleModal(): void {
    this.isEditRoleModalOpen = false;
  }

  submitEditRole(): void {
    const cleanName = (this.editRoleData.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      this.showToast('Tên vai trò phải từ 2 ký tự trở lên.', 'warning');
      return;
    }

    this.adminAuthService.updateRoleOnServer(this.editRoleData.id, {
      name: cleanName,
      description: this.editRoleData.description.trim()
    }).subscribe({
      next: () => {
        this.closeEditRoleModal();
        this.loadMatrixFromServer();
        this.showToast(`✓ Đã cập nhật vai trò "${cleanName}" thành công!`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Không thể cập nhật vai trò.';
        this.showToast(msg, 'warning');
      }
    });
  }

  // Mở modal xóa vai trò - BỎ RÀNG BUỘC isSystem, CHO PHÉP XÓA TẤT CẢ TRỪ SUPER ADMIN
  openDeleteRoleModal(role: RoleDefinition, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (role.code === 'SUPER_ADMIN' || role.name === 'Super Admin') {
      this.showToast('Super Admin là vai trò quản trị tối cao của hệ thống, không thể xóa!', 'warning');
      return;
    }

    this.roleToDelete = role;
    // Chọn vai trò thay thế mặc định khác vai trò đang xóa
    const otherRoles = this.rolesList.filter(r => r.id !== role.id && r.name !== role.name);
    this.reassignTargetRoleName = otherRoles.length > 0 ? otherRoles[0].name : 'NV Kinh doanh';
    this.isDeleteConfirmModalOpen = true;
  }

  closeDeleteRoleModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.roleToDelete = null;
  }

  // Xóa vai trò kèm chuyển giao tài khoản nhân viên an toàn (tránh lỗi treo web)
  confirmDeleteRole(): void {
    if (!this.roleToDelete) return;
    const r = this.roleToDelete;
    const reassignTo = this.reassignTargetRoleName;

    this.adminAuthService.deleteRoleOnServer(r.id, reassignTo).subscribe({
      next: () => {
        this.closeDeleteRoleModal();
        this.loadMatrixFromServer();
        this.loadStaffCounts();
        this.showToast(`✓ Đã xóa vai trò "${r.name}". Nhân sự bị ảnh hưởng đã được chuyển sang vai trò "${reassignTo}" an toàn!`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Không thể xóa vai trò này.';
        this.showToast(msg, 'warning');
      }
    });
  }

  get otherAvailableRoles(): RoleDefinition[] {
    if (!this.roleToDelete) return this.rolesList;
    return this.rolesList.filter(r => r.id !== this.roleToDelete?.id && r.name !== this.roleToDelete?.name);
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
        this.cdr.detectChanges();
      }
    }, 4500);
  }
}
