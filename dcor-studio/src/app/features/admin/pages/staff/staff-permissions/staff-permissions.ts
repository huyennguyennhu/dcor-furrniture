import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../../../../../shared/components/icon/icon';
import { 
  AdminAuthService, 
  AdminRole, 
  AdminModule, 
  PermissionActions, 
  RolePermissions, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../../../../core/services/admin-auth.service';

interface ModuleDefinition {
  key: AdminModule;
  name: string;
  description: string;
  icon: IconName;
}

@Component({
  selector: 'app-staff-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './staff-permissions.html',
  styleUrls: ['./staff-permissions.css']
})
export class StaffPermissionsComponent implements OnInit {
  readonly rolesList: AdminRole[] = [
    'Super Admin',
    'Quản lý sản phẩm',
    'Quản lý kho',
    'Quản lý đơn hàng',
    'Marketing',
    'CSKH',
    'Sales'
  ];

  selectedRole: AdminRole = 'Super Admin';

  readonly modulesList: ModuleDefinition[] = [
    { key: 'products', name: 'Sản phẩm', description: 'Danh mục, chi tiết sản phẩm, giá bán, biến thể', icon: 'Package' },
    { key: 'orders', name: 'Đơn hàng', description: 'Quản lý đơn mua, bảo hành, yêu cầu đổi trả', icon: 'ShoppingCart' },
    { key: 'inventory', name: 'Kho hàng', description: 'Tồn kho, xuất - nhập, kiểm kê, lịch sử', icon: 'Warehouse' },
    { key: 'customers', name: 'Khách hàng', description: 'Hồ sơ người dùng, điểm thưởng, liên hệ', icon: 'UsersRound' },
    { key: 'promotions', name: 'Marketing & Khuyến mãi', description: 'Voucher, mã giảm giá, chiến dịch', icon: 'TicketPercent' },
    { key: 'settings', name: 'CSKH & Tư vấn', description: 'Lịch tư vấn, phản hồi, hội thoại chat', icon: 'MessagesSquare' },
    { key: 'staff', name: 'Nhân sự', description: 'Tài khoản nhân viên, ma trận phân quyền', icon: 'ShieldCheck' },
    { key: 'reports', name: 'Cài đặt & Báo cáo', description: 'Báo cáo doanh thu, cấu hình hệ thống', icon: 'Settings' }
  ];

  readonly actionsList: { key: keyof PermissionActions; label: string }[] = [
    { key: 'view', label: 'Xem' },
    { key: 'create', label: 'Thêm' },
    { key: 'edit', label: 'Sửa' },
    { key: 'delete', label: 'Xóa' },
    { key: 'approve', label: 'Duyệt' }
  ];

  // Lưu ma trận quyền cho tất cả các vai trò
  allRolePermissions: Record<AdminRole, RolePermissions> = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));

  // Ma trận quyền của vai trò hiện tại đang chọn
  currentMatrix: RolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS['Super Admin']));

  saveLoading = false;
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  constructor(private adminAuthService: AdminAuthService) {}

  ngOnInit(): void {
    // Tải cấu hình đã lưu từ localStorage nếu có
    const saved = localStorage.getItem('dcor_all_role_permissions');
    if (saved) {
      try {
        this.allRolePermissions = JSON.parse(saved);
      } catch (e) {
        this.allRolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      }
    }
    this.selectRole(this.selectedRole);
  }

  selectRole(role: AdminRole): void {
    this.selectedRole = role;
    if (!this.allRolePermissions[role]) {
      this.allRolePermissions[role] = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['Super Admin']));
    }
    this.currentMatrix = this.allRolePermissions[role];
  }

  isSuperAdmin(): boolean {
    return this.selectedRole === 'Super Admin';
  }

  toggleAction(moduleKey: AdminModule, action: keyof PermissionActions): void {
    if (this.isSuperAdmin()) return; // Super Admin toàn quyền, không thể bỏ tick
    this.currentMatrix[moduleKey][action] = !this.currentMatrix[moduleKey][action];

    // Nếu tắt quyền 'Xem', tự động tắt các quyền thao tác khác
    if (action === 'view' && !this.currentMatrix[moduleKey].view) {
      this.currentMatrix[moduleKey].create = false;
      this.currentMatrix[moduleKey].edit = false;
      this.currentMatrix[moduleKey].delete = false;
      this.currentMatrix[moduleKey].approve = false;
    }
    // Nếu bật quyền thao tác bất kỳ, tự động bật quyền 'Xem'
    if (action !== 'view' && this.currentMatrix[moduleKey][action]) {
      this.currentMatrix[moduleKey].view = true;
    }
  }

  toggleAllInModule(moduleKey: AdminModule, enable: boolean): void {
    if (this.isSuperAdmin()) return;
    this.actionsList.forEach(act => {
      this.currentMatrix[moduleKey][act.key] = enable;
    });
  }

  isModuleAllChecked(moduleKey: AdminModule): boolean {
    return this.actionsList.every(act => this.currentMatrix[moduleKey][act.key]);
  }

  savePermissions(): void {
    this.saveLoading = true;
    this.allRolePermissions[this.selectedRole] = this.currentMatrix;

    // Lưu toàn bộ cấu hình vào storage
    localStorage.setItem('dcor_all_role_permissions', JSON.stringify(this.allRolePermissions));

    // Cập nhật vào AdminAuthService state
    this.adminAuthService.updateRolePermissions(this.selectedRole, this.currentMatrix);

    setTimeout(() => {
      this.saveLoading = false;
      this.showToast(`Lưu phân quyền cho vai trò "${this.selectedRole}" thành công!`, 'success');
    }, 400);
  }

  resetToDefault(): void {
    this.currentMatrix = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[this.selectedRole]));
    this.allRolePermissions[this.selectedRole] = this.currentMatrix;
    this.showToast(`Đã khôi phục ma trận quyền mặc định cho "${this.selectedRole}".`, 'info');
  }

  showToast(msg: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3500);
  }
}
