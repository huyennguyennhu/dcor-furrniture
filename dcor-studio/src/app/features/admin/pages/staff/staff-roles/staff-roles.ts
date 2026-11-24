import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent, IconName } from '../../../../../shared/components/icon/icon';
import { AdminAuthService, RoleWithStaff } from '../../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-staff-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './staff-roles.html',
  styleUrls: ['./staff-roles.css']
})
export class StaffRolesComponent implements OnInit {
  roles: RoleWithStaff[] = [];
  isLoading = false;

  // Filter & Search
  searchTerm = '';
  typeFilter: 'ALL' | 'SYSTEM' | 'CUSTOM' = 'ALL';

  // Toast
  toastMessage = '';
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimeout: any;

  // Modal 1: Thêm vai trò mới
  isAddModalOpen = false;
  isAddSubmitting = false;
  addFormData = {
    name: '',
    code: '',
    description: '',
    cloneFromRoleName: 'NV Kinh doanh'
  };

  // Modal 2: Chỉnh sửa vai trò
  isEditModalOpen = false;
  isEditSubmitting = false;
  editingRole: RoleWithStaff | null = null;
  editFormData = {
    name: '',
    description: ''
  };

  // Modal 3: Xóa vai trò an toàn & Chuyển giao nhân sự
  isDeleteModalOpen = false;
  isDeleteSubmitting = false;
  deletingRole: RoleWithStaff | null = null;
  reassignToRoleName = 'NV Kinh doanh';

  // Modal 4: Xem danh sách nhân sự thuộc vai trò
  isStaffModalOpen = false;
  selectedRoleForStaff: RoleWithStaff | null = null;

  constructor(
    public adminAuthService: AdminAuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  get isSuperAdmin(): boolean {
    const user = this.adminAuthService.currentUser;
    return !!user && (user.role === 'Super Admin' || !!user.roles?.includes('Super Admin'));
  }

  get canCreateRole(): boolean {
    return this.isSuperAdmin || this.adminAuthService.hasPermission('staff', 'create');
  }

  get canEditRole(): boolean {
    return this.isSuperAdmin || this.adminAuthService.hasPermission('staff', 'edit');
  }

  get canDeleteRole(): boolean {
    return this.isSuperAdmin || this.adminAuthService.hasPermission('staff', 'delete');
  }

  loadRoles(): void {
    this.isLoading = true;
    this.adminAuthService.getRolesWithStaff().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.roles = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi tải danh sách vai trò:', err);
        this.showToast('Không thể tải danh sách vai trò từ máy chủ.', 'warning');
        this.cdr.detectChanges();
      }
    });
  }

  // Thống kê
  get totalRoles(): number {
    return this.roles.length;
  }

  get systemRolesCount(): number {
    return this.roles.filter(r => r.isSystem).length;
  }

  get customRolesCount(): number {
    return this.roles.filter(r => !r.isSystem).length;
  }

  get totalStaffAssigned(): number {
    return this.roles.reduce((acc, cur) => acc + (cur.staffCount || 0), 0);
  }

  // Danh sách vai trò sau khi lọc
  get filteredRoles(): RoleWithStaff[] {
    return this.roles.filter(r => {
      // Lọc loại
      if (this.typeFilter === 'SYSTEM' && !r.isSystem) return false;
      if (this.typeFilter === 'CUSTOM' && r.isSystem) return false;

      // Tìm kiếm
      if (this.searchTerm.trim()) {
        const query = this.searchTerm.trim().toLowerCase();
        const matchName = (r.name || '').toLowerCase().includes(query);
        const matchCode = (r.code || '').toLowerCase().includes(query);
        const matchDesc = (r.description || '').toLowerCase().includes(query);
        return matchName || matchCode || matchDesc;
      }

      return true;
    });
  }

  // Icon theo từng vai trò
  getRoleIcon(role: RoleWithStaff): IconName {
    const code = (role.code || '').toUpperCase();
    const name = (role.name || '').toLowerCase();

    if (code.includes('SUPER') || name.includes('super admin')) return 'ShieldCheck';
    if (code.includes('SAN_PHAM') || name.includes('sản phẩm')) return 'Package';
    if (code.includes('KHO') || name.includes('kho')) return 'Warehouse';
    if (code.includes('DON_HANG') || name.includes('đơn hàng')) return 'ShoppingCart';
    if (code.includes('KINH_DOANH') || code.includes('SALES') || name.includes('kinh doanh')) return 'UsersRound';
    if (code.includes('KIEN_TRUC_SU') || code.includes('ARCHITECT') || name.includes('kiến trúc')) return 'Ruler';
    return 'UserCheck';
  }

  // Gợi ý mã code tự động khi nhập tên
  onRoleNameInput(): void {
    if (!this.addFormData.code || this.addFormData.code === this.suggestCode(this.addFormData.name.slice(0, -1))) {
      this.addFormData.code = this.suggestCode(this.addFormData.name);
    }
  }

  private suggestCode(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  // Modal 1: Thêm vai trò
  openAddModal(): void {
    this.addFormData = {
      name: '',
      code: '',
      description: '',
      cloneFromRoleName: 'NV Kinh doanh'
    };
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  submitAddRole(): void {
    if (!this.addFormData.name.trim()) {
      this.showToast('Vui lòng nhập tên vai trò.', 'warning');
      return;
    }
    if (!this.addFormData.code.trim()) {
      this.showToast('Vui lòng nhập mã định danh vai trò (Code).', 'warning');
      return;
    }

    this.isAddSubmitting = true;
    this.adminAuthService.createRoleOnServer({
      name: this.addFormData.name.trim(),
      code: this.addFormData.code.trim().toUpperCase(),
      description: this.addFormData.description.trim(),
      cloneFromRoleName: this.addFormData.cloneFromRoleName
    }).subscribe({
      next: (res) => {
        this.isAddSubmitting = false;
        this.isAddModalOpen = false;
        this.showToast(`Đã tạo thành công vai trò "${this.addFormData.name}"!`, 'success');
        this.loadRoles();
      },
      error: (err) => {
        this.isAddSubmitting = false;
        console.error('Lỗi tạo vai trò:', err);
        const msg = err.error?.message || 'Lỗi khi tạo vai trò mới.';
        this.showToast(msg, 'warning');
      }
    });
  }

  // Modal 2: Chỉnh sửa vai trò
  openEditModal(role: RoleWithStaff): void {
    this.editingRole = role;
    this.editFormData = {
      name: role.name,
      description: role.description || ''
    };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingRole = null;
  }

  submitEditRole(): void {
    if (!this.editingRole) return;
    if (!this.editFormData.name.trim()) {
      this.showToast('Tên vai trò không được để trống.', 'warning');
      return;
    }

    this.isEditSubmitting = true;
    this.adminAuthService.updateRoleOnServer(this.editingRole.id, {
      name: this.editFormData.name.trim(),
      description: this.editFormData.description.trim()
    }).subscribe({
      next: () => {
        this.isEditSubmitting = false;
        this.isEditModalOpen = false;
        this.showToast(`Đã cập nhật vai trò "${this.editFormData.name}" thành công!`, 'success');
        this.loadRoles();
      },
      error: (err) => {
        this.isEditSubmitting = false;
        console.error('Lỗi cập nhật vai trò:', err);
        const msg = err.error?.message || 'Lỗi khi cập nhật vai trò.';
        this.showToast(msg, 'warning');
      }
    });
  }

  // Modal 3: Xóa vai trò
  openDeleteModal(role: RoleWithStaff): void {
    if (role.isSystem) {
      this.showToast('Không thể xóa vai trò mặc định của hệ thống!', 'warning');
      return;
    }
    this.deletingRole = role;
    // Mặc định chọn 1 vai trò an toàn khác
    const safeRole = this.roles.find(r => r.id !== role.id && r.isSystem);
    this.reassignToRoleName = safeRole ? safeRole.name : 'NV Kinh doanh';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deletingRole = null;
  }

  submitDeleteRole(): void {
    if (!this.deletingRole) return;

    this.isDeleteSubmitting = true;
    this.adminAuthService.deleteRoleOnServer(this.deletingRole.id, this.reassignToRoleName).subscribe({
      next: () => {
        this.isDeleteSubmitting = false;
        this.isDeleteModalOpen = false;
        this.showToast(`Đã xóa vai trò "${this.deletingRole?.name}" thành công!`, 'success');
        this.loadRoles();
      },
      error: (err) => {
        this.isDeleteSubmitting = false;
        console.error('Lỗi xóa vai trò:', err);
        const msg = err.error?.message || 'Lỗi khi xóa vai trò.';
        this.showToast(msg, 'warning');
      }
    });
  }

  // Modal 4: Xem nhân sự
  openStaffModal(role: RoleWithStaff): void {
    this.selectedRoleForStaff = role;
    this.isStaffModalOpen = true;
  }

  closeStaffModal(): void {
    this.isStaffModalOpen = false;
    this.selectedRoleForStaff = null;
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
