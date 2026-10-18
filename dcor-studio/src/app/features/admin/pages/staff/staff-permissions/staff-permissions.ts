import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { IconComponent, IconName } from '../../../../../shared/components/icon/icon';
import { 
  AdminAuthService, 
  AdminModule, 
  PermissionActions, 
  RolePermissions, 
  RoleDefinition,
  DEFAULT_ROLE_PERMISSIONS 
} from '../../../../../core/services/admin-auth.service';
import { environment } from '../../../../../../environments/environment';

interface ModuleDefinition {
  key: AdminModule;
  name: string;
  description: string;
  icon: IconName;
}

export interface StaffPermissionItem {
  id: string;
  name: string;
  email: string;
  roles: string[];
  role: string;
  branchName: string;
  assignedBranches?: string[];
  effectivePermissions?: RolePermissions;
}

@Component({
  selector: 'app-staff-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './staff-permissions.html',
  styleUrls: ['./staff-permissions.css']
})
export class StaffPermissionsComponent implements OnInit, OnDestroy {
  // Chế độ xem: 'staff_matrix' (Phân quyền theo Nhân viên) vs 'role_templates' (Cấu hình mẫu Vai trò)
  activeViewTab: 'staff_matrix' | 'role_templates' = 'staff_matrix';

  rolesList: RoleDefinition[] = [];
  selectedRoleName: string = 'Super Admin';
  selectedRoleDef: RoleDefinition | null = null;
  private sub: Subscription = new Subscription();

  // Danh sách nhân sự
  staffMembers: StaffPermissionItem[] = [];
  selectedStaff: StaffPermissionItem | null = null;
  selectedStaffSearch: string = '';

  // Danh sách 9 Module nghiệp vụ hệ thống DCor
  readonly modulesList: ModuleDefinition[] = [
    { key: 'products', name: 'Sản phẩm', description: 'Chi tiết sản phẩm, giá bán, biến thể, hình ảnh', icon: 'Package' },
    { key: 'categories', name: 'Danh mục', description: 'Cây danh mục, nhóm sản phẩm, định vị bộ sưu tập', icon: 'Layers' },
    { key: 'orders', name: 'Đơn hàng', description: 'Tiếp nhận đơn mua, bảo hành, xử lý giao vận', icon: 'ShoppingCart' },
    { key: 'inventory', name: 'Kho & Showroom', description: 'Xuất - nhập kho, luân chuyển showroom, kiểm kê', icon: 'Warehouse' },
    { key: 'promotions', name: 'Khuyến mãi & Voucher', description: 'Mã giảm giá, chương trình ưu đãi, flashsale', icon: 'TicketPercent' },
    { key: 'customers', name: 'Khách hàng', description: 'Hồ sơ người dùng, điểm thưởng, phân hạng', icon: 'UsersRound' },
    { key: 'staff', name: 'Nhân sự', description: 'Tài khoản nhân viên, phân quyền vai trò, chi nhánh', icon: 'ShieldCheck' },
    { key: 'reports', name: 'Báo cáo', description: 'Báo cáo doanh thu, hiệu suất bán hàng, tồn kho', icon: 'ChartNoAxesCombined' },
    { key: 'settings', name: 'Cài đặt', description: 'Cấu hình chung, thông tin thương hiệu, phân hệ', icon: 'Settings' }
  ];

  readonly actionsList: { key: keyof PermissionActions; label: string }[] = [
    { key: 'view', label: 'Xem' },
    { key: 'create', label: 'Thêm' },
    { key: 'edit', label: 'Sửa' },
    { key: 'delete', label: 'Xóa' },
    { key: 'approve', label: 'Duyệt' }
  ];

  // Lưu ma trận quyền cho tất cả các vai trò
  allRolePermissions: Record<string, RolePermissions> = {};

  // Ma trận quyền của vai trò hiện tại đang chọn
  currentMatrix: RolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS['Super Admin']));

  saveLoading = false;
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  // --- Modal Thêm vai trò mới ---
  isAddRoleModalOpen = false;
  newRoleData = {
    name: '',
    code: '',
    description: '',
    cloneFromRoleId: 'role-sales'
  };

  // --- Modal Sửa vai trò ---
  isEditRoleModalOpen = false;
  editRoleData = {
    id: '',
    name: '',
    description: ''
  };

  // --- Modal Xác nhận xóa vai trò ---
  isDeleteConfirmModalOpen = false;
  roleToDelete: RoleDefinition | null = null;

  constructor(
    public adminAuthService: AdminAuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Lắng nghe danh sách vai trò động từ AdminAuthService
    this.sub.add(
      this.adminAuthService.rolesList$.subscribe(roles => {
        this.rolesList = roles;
        if (!this.selectedRoleDef && roles.length > 0) {
          const current = roles.find(r => r.name === this.selectedRoleName) || roles[0];
          this.selectRole(current);
        }
      })
    );

    // 2. Tải ma trận quyền từ AdminAuthService
    this.allRolePermissions = this.adminAuthService.getAllRolePermissionsFromStorage();

    // 3. Tải danh sách nhân sự
    this.loadStaffList();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadStaffList(): void {
    this.http.get<any[]>(`${environment.apiUrl}/admin/staff`).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.processStaffData(data);
          localStorage.setItem('dcor_staff_accounts_list', JSON.stringify(data));
        } else {
          this.loadCachedStaffData();
        }
      },
      error: () => {
        this.loadCachedStaffData();
      }
    });
  }

  private loadCachedStaffData(): void {
    const saved = localStorage.getItem('dcor_staff_accounts_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.processStaffData(parsed);
          return;
        }
      } catch (e) {}
    }
  }

  private processStaffData(rawList: any[]): void {
    this.staffMembers = rawList.map(item => {
      const roles = Array.isArray(item.roles) && item.roles.length > 0 
        ? item.roles 
        : [item.role || 'Sales'];

      const effective = this.adminAuthService.calculateEffectivePermissions(roles);

      return {
        id: item.id,
        name: item.name || item.fullName || 'Nhân sự',
        email: item.email || '',
        roles,
        role: roles.join(', '),
        branchName: item.branchName || this.adminAuthService.getBranchName(item.branchId || 'ALL'),
        assignedBranches: item.assignedBranches || [item.branchId || 'ALL'],
        effectivePermissions: effective
      };
    });

    if (this.staffMembers.length > 0 && !this.selectedStaff) {
      this.selectStaff(this.staffMembers[0]);
    }
  }

  getStaffCount(roleName: string): number {
    return this.staffMembers.filter(s => s.roles && s.roles.includes(roleName)).length;
  }

  get filteredStaffMembers(): StaffPermissionItem[] {
    const term = this.selectedStaffSearch.trim().toLowerCase();
    if (!term) return this.staffMembers;
    return this.staffMembers.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.email.toLowerCase().includes(term) ||
      s.role.toLowerCase().includes(term)
    );
  }

  selectStaff(staffOrId: StaffPermissionItem | string): void {
    if (typeof staffOrId === 'string') {
      const found = this.staffMembers.find(s => s.id === staffOrId);
      if (!found) return;
      staffOrId = found;
    }
    this.selectedStaff = staffOrId;
    // Cập nhật ma trận quyền hiệu lực của nhân sự
    staffOrId.effectivePermissions = this.adminAuthService.calculateEffectivePermissions(staffOrId.roles);
    this.currentMatrix = staffOrId.effectivePermissions;
    this.cdr.markForCheck();
  }

  selectRole(role: RoleDefinition): void {
    this.selectedRoleDef = role;
    this.selectedRoleName = role.name;

    if (!this.allRolePermissions[role.name]) {
      const fallback = DEFAULT_ROLE_PERMISSIONS[role.name] || DEFAULT_ROLE_PERMISSIONS['Sales'] || DEFAULT_ROLE_PERMISSIONS['Super Admin'];
      this.allRolePermissions[role.name] = JSON.parse(JSON.stringify(fallback));
    }

    this.ensureAllModulesExist(this.allRolePermissions[role.name]);
    this.currentMatrix = this.allRolePermissions[role.name];
  }

  private ensureAllModulesExist(matrix: RolePermissions): void {
    this.modulesList.forEach(m => {
      if (!matrix[m.key]) {
        matrix[m.key] = {
          view: false,
          create: false,
          edit: false,
          delete: false,
          approve: false
        };
      }
    });
  }

  isStaffSuperAdmin(): boolean {
    return !!this.selectedStaff?.roles?.includes('Super Admin');
  }

  isSuperAdminRole(): boolean {
    return this.selectedRoleName === 'Super Admin' || this.selectedRoleDef?.code === 'SUPER_ADMIN';
  }

  toggleAction(moduleKey: AdminModule, action: keyof PermissionActions): void {
    if (this.activeViewTab === 'staff_matrix') {
      // Ở chế độ xem nhân sự, quyền được suy ra từ các vai trò được gán
      this.showToast('Để điều chỉnh quyền của nhân sự, hãy thay đổi vai trò được gán hoặc cấu hình ma trận tại tab "Cấu hình Mẫu Vai trò".', 'info');
      return;
    }

    if (this.isSuperAdminRole()) return;
    this.currentMatrix[moduleKey][action] = !this.currentMatrix[moduleKey][action];

    if (action === 'view' && !this.currentMatrix[moduleKey].view) {
      this.currentMatrix[moduleKey].create = false;
      this.currentMatrix[moduleKey].edit = false;
      this.currentMatrix[moduleKey].delete = false;
      this.currentMatrix[moduleKey].approve = false;
    }
    if (action !== 'view' && this.currentMatrix[moduleKey][action]) {
      this.currentMatrix[moduleKey].view = true;
    }
  }

  toggleAllInModule(moduleKey: AdminModule, enable: boolean): void {
    if (this.activeViewTab === 'staff_matrix') return;
    if (this.isSuperAdminRole()) return;
    this.actionsList.forEach(act => {
      this.currentMatrix[moduleKey][act.key] = enable;
    });
  }

  isModuleAllChecked(moduleKey: AdminModule): boolean {
    return this.actionsList.every(act => this.currentMatrix[moduleKey] && this.currentMatrix[moduleKey][act.key]);
  }

  savePermissions(): void {
    if (this.activeViewTab === 'staff_matrix') {
      this.showToast('Đang ở chế độ xem quyền hiệu lực nhân sự. Vui lòng chuyển sang tab "Cấu hình Mẫu Vai trò" để chỉnh sửa và lưu.', 'info');
      return;
    }

    this.saveLoading = true;
    this.cdr.detectChanges();
    this.allRolePermissions[this.selectedRoleName] = this.currentMatrix;

    this.adminAuthService.updateRolePermissions(this.selectedRoleName, this.currentMatrix);

    // Cập nhật lại quyền hiệu lực cho toàn bộ nhân sự
    this.staffMembers.forEach(s => {
      s.effectivePermissions = this.adminAuthService.calculateEffectivePermissions(s.roles);
    });

    setTimeout(() => {
      this.saveLoading = false;
      this.showToast(`Lưu phân quyền thành công cho vai trò "${this.selectedRoleName}"!`, 'success');
      this.cdr.detectChanges();
    }, 400);
  }

  resetToDefault(): void {
    if (this.activeViewTab === 'staff_matrix') return;
    const defaultPerm = DEFAULT_ROLE_PERMISSIONS[this.selectedRoleName] || DEFAULT_ROLE_PERMISSIONS['Sales'];
    this.currentMatrix = JSON.parse(JSON.stringify(defaultPerm));
    this.ensureAllModulesExist(this.currentMatrix);
    this.allRolePermissions[this.selectedRoleName] = this.currentMatrix;
    this.showToast(`Đã khôi phục ma trận quyền mặc định cho "${this.selectedRoleName}".`, 'info');
  }

  getInitials(name: string): string {
    if (!name) return 'DC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  isWarehouse(branchId: string): boolean {
    const b = this.adminAuthService.getBranchById(branchId);
    return b?.type === 'CENTRAL_WAREHOUSE';
  }

  // =========================================================================
  // MODAL: + THÊM VAI TRÒ MỚI
  // =========================================================================

  openAddRoleModal(): void {
    this.newRoleData = {
      name: '',
      code: '',
      description: '',
      cloneFromRoleId: 'NONE'
    };
    this.isAddRoleModalOpen = true;
  }

  closeAddRoleModal(): void {
    this.isAddRoleModalOpen = false;
  }

  onRoleNameChange(): void {
    if (!this.newRoleData.code || this.newRoleData.code === this.generateRoleCode(this.newRoleData.name.slice(0, -1))) {
      this.newRoleData.code = this.generateRoleCode(this.newRoleData.name);
    }
  }

  generateRoleCode(name: string): string {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_');
  }

  submitAddRole(): void {
    if (!this.newRoleData.name || !this.newRoleData.code) {
      this.showToast('Vui lòng nhập tên và mã vai trò hợp lệ.', 'warning');
      return;
    }

    try {
      const createdRole = this.adminAuthService.addRole(
        {
          name: this.newRoleData.name,
          code: this.newRoleData.code,
          description: this.newRoleData.description
        },
        this.newRoleData.cloneFromRoleId
      );

      this.closeAddRoleModal();
      this.showToast(`Đã tạo vai trò mới "${createdRole.name}" thành công!`, 'success');
      this.selectRole(createdRole);
    } catch (err: any) {
      this.showToast(err.message || 'Lỗi khi tạo vai trò mới.', 'warning');
    }
  }

  // =========================================================================
  // MODAL: SỬA VAI TRÒ
  // =========================================================================

  openEditRoleModal(): void {
    if (!this.selectedRoleDef) return;
    this.editRoleData = {
      id: this.selectedRoleDef.id,
      name: this.selectedRoleDef.name,
      description: this.selectedRoleDef.description
    };
    this.isEditRoleModalOpen = true;
  }

  closeEditRoleModal(): void {
    this.isEditRoleModalOpen = false;
  }

  submitEditRole(): void {
    if (!this.editRoleData.name) {
      this.showToast('Tên vai trò không được để trống.', 'warning');
      return;
    }

    try {
      this.adminAuthService.updateRole(this.editRoleData.id, {
        name: this.editRoleData.name,
        description: this.editRoleData.description
      });

      this.closeEditRoleModal();
      this.showToast('Cập nhật thông tin vai trò thành công!', 'success');
    } catch (err: any) {
      this.showToast(err.message || 'Lỗi khi cập nhật vai trò.', 'warning');
    }
  }

  // =========================================================================
  // XÓA VAI TRÒ
  // =========================================================================

  openDeleteRoleModal(): void {
    if (!this.selectedRoleDef) return;

    if (this.selectedRoleDef.isSystem || this.selectedRoleDef.name === 'Super Admin') {
      this.showToast('Không thể xóa vai trò hệ thống hoặc Super Admin!', 'warning');
      return;
    }

    const inUseCount = this.getStaffCount(this.selectedRoleDef.name);
    if (inUseCount > 0) {
      this.showToast(`Không thể xóa vai trò "${this.selectedRoleDef.name}" vì đang có ${inUseCount} nhân sự đảm nhiệm!`, 'warning');
      return;
    }

    this.roleToDelete = this.selectedRoleDef;
    this.isDeleteConfirmModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.roleToDelete = null;
  }

  confirmDeleteRole(): void {
    if (!this.roleToDelete) return;

    const res = this.adminAuthService.deleteRole(this.roleToDelete.id);
    this.closeDeleteModal();

    if (res.success) {
      this.showToast(res.message, 'success');
      const superAdmin = this.rolesList.find(r => r.name === 'Super Admin') || this.rolesList[0];
      if (superAdmin) this.selectRole(superAdmin);
    } else {
      this.showToast(res.message, 'warning');
    }
  }

  showToast(msg: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3800);
  }
}
