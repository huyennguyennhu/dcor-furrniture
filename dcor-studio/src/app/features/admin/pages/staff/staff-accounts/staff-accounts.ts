import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { 
  AdminAuthService, 
  RoleDefinition, 
  Branch 
} from '../../../../../core/services/admin-auth.service';
import { environment } from '../../../../../../environments/environment';

export type StaffStatusText = 'Đã kích hoạt' | 'Chờ kích hoạt' | 'Tạm khóa';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roles: string[]; // Multi-Role
  branchId: string;
  branchName: string;
  assignedBranches?: string[]; // Kho & Showroom
  avatarUrl?: string;
  lastLogin: string;
  status: StaffStatusText;
  createdAt?: string;
  inviteLink?: string;
}

const DEFAULT_SAMPLE_STAFF: StaffAccount[] = [
  {
    id: 'staff-1',
    name: 'Nguyễn Hoàng Minh',
    email: 'admin.minh@dcor.vn',
    phone: '0901 234 567',
    role: 'Super Admin',
    roles: ['Super Admin'],
    branchId: 'ALL',
    branchName: 'Toàn hệ thống',
    assignedBranches: ['ALL'],
    status: 'Đã kích hoạt',
    lastLogin: 'Vừa xong',
    createdAt: '2026-01-15'
  },
  {
    id: 'staff-2',
    name: 'Trần Văn Kho',
    email: 'kho.tran@dcor.vn',
    phone: '0902 345 678',
    role: 'Quản lý kho',
    roles: ['Quản lý kho'],
    branchId: 'KHO_TONG_HCM',
    branchName: 'Kho Tổng (TP.HCM)',
    assignedBranches: ['KHO_TONG_HCM'],
    status: 'Đã kích hoạt',
    lastLogin: '2 giờ trước',
    createdAt: '2026-02-01'
  },
  {
    id: 'staff-3',
    name: 'Lê Minh Trí',
    email: 'tri.le@dcor.vn',
    phone: '0903 456 789',
    role: 'Quản lý kho, Sales',
    roles: ['Quản lý kho', 'Sales'], // Vừa quản lý kho vừa bán hàng
    branchId: 'SR_Q1',
    branchName: 'Showroom Quận 1 & Kho Tổng',
    assignedBranches: ['KHO_TONG_HCM', 'SR_Q1'],
    status: 'Đã kích hoạt',
    lastLogin: '1 ngày trước',
    createdAt: '2026-02-10'
  },
  {
    id: 'staff-4',
    name: 'Nguyễn Thị Hồng',
    email: 'hong.nguyen@dcor.vn',
    phone: '0904 567 890',
    role: 'Sales',
    roles: ['Sales'],
    branchId: 'SR_THU_DUC',
    branchName: 'Showroom Thủ Đức',
    assignedBranches: ['SR_THU_DUC'],
    status: 'Đã kích hoạt',
    lastLogin: '4 giờ trước',
    createdAt: '2026-02-15'
  },
  {
    id: 'staff-5',
    name: 'Đặng Quốc Tuấn',
    email: 'tuan.dang@dcor.vn',
    phone: '0905 678 901',
    role: 'Quản lý kho',
    roles: ['Quản lý kho'],
    branchId: 'KHO_HN',
    branchName: 'Kho Hà Nội',
    assignedBranches: ['KHO_HN'],
    status: 'Đã kích hoạt',
    lastLogin: '3 ngày trước',
    createdAt: '2026-02-20'
  },
  {
    id: 'staff-6',
    name: 'Võ Thanh Tùng',
    email: 'tung.vo@dcor.vn',
    phone: '0906 789 012',
    role: 'Sales',
    roles: ['Sales'],
    branchId: 'SR_DN_HAI_CHAU',
    branchName: 'Showroom Đà Nẵng',
    assignedBranches: ['SR_DN_HAI_CHAU'],
    status: 'Chờ kích hoạt',
    lastLogin: 'Chưa từng',
    createdAt: '2026-03-01'
  }
];

@Component({
  selector: 'app-staff-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './staff-accounts.html',
  styleUrls: ['./staff-accounts.css']
})
export class StaffAccountsComponent implements OnInit, OnDestroy {
  searchTerm = '';
  selectedRoleFilter: string = 'ALL';
  selectedBranchFilter: string = 'ALL';
  selectedStatusFilter: string = 'ALL';
  isLoading = false;

  private sub = new Subscription();
  rolesList: RoleDefinition[] = [];
  branchesList: Branch[] = [];

  records: StaffAccount[] = [];

  // =========================================================================
  // MODAL 1: + THÊM / CẬP NHẬT NHÂN SỰ (KHÔNG TẠO MẬT KHẨU, MULTI-ROLE)
  // =========================================================================
  isStaffFormModalOpen = false;
  isEditing = false;
  editingStaffId: string | null = null;
  formSubmitting = false;

  staffFormData = {
    fullName: '',
    email: '',
    phone: '',
    selectedRoles: ['Sales'] as string[],
    selectedBranches: ['SR_Q1'] as string[]
  };

  // =========================================================================
  // MODAL 2: CẤU HÌNH & SOẠN EMAIL BÀN GIAO TÀI KHOẢN (REAL GMAIL SMTP)
  // =========================================================================
  isEmailDispatchModalOpen = false;
  emailModalTab: 'preview' | 'compose' = 'preview';
  emailSending = false;
  emailSentSuccess = false;

  dispatchStaff: StaffAccount | null = null;
  dispatchBranch: Branch | null = null;
  dispatchInviteUrl: string = '';

  emailConfig = {
    recipientName: '',
    recipientEmail: '',
    recipientRoles: [] as string[],
    recipientBranch: '',
    subject: '',
    adminNote: 'Chào mừng bạn gia nhập đội ngũ DCor Studio! Vui lòng truy cập liên kết bảo mật bên dưới để hoàn tất kích hoạt tài khoản và tự tạo mật khẩu cá nhân của riêng bạn. Chúc bạn có một hành trình công tác tuyệt vời cùng thương hiệu!'
  };

  // =========================================================================
  // MODAL 3: XÁC NHẬN XÓA TÀI KHOẢN NHÂN SỰ
  // =========================================================================
  isDeleteModalOpen = false;
  staffToDelete: StaffAccount | null = null;
  deleteLoading = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  constructor(
    private http: HttpClient,
    public adminAuthService: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.adminAuthService.rolesList$.subscribe(roles => {
        this.rolesList = roles;
      })
    );

    this.branchesList = this.adminAuthService.branches;
    this.loadStaff();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get warehouses(): Branch[] {
    return this.branchesList.filter(b => b.type === 'CENTRAL_WAREHOUSE');
  }

  get showrooms(): Branch[] {
    return this.branchesList.filter(b => b.type === 'SHOWROOM');
  }

  loadStaff(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/staff`).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (Array.isArray(data) && data.length > 0) {
          this.records = data.map((item, index) => {
            const rawRoles = Array.isArray(item.roles) && item.roles.length > 0 
              ? item.roles 
              : [item.role || 'Sales'];

            const fallbackBranch = this.branchesList[(index + 1) % this.branchesList.length];
            const branchId = item.branchId || fallbackBranch.id;

            return {
              id: item.id || 'staff-' + index,
              name: item.name || item.fullName || 'Nhân sự',
              email: item.email || '',
              phone: item.phone || '',
              role: rawRoles.join(', '),
              roles: rawRoles,
              branchId,
              branchName: item.branchName || this.adminAuthService.getBranchName(branchId),
              assignedBranches: item.assignedBranches || [branchId],
              status: (item.status === 'ACTIVE' || item.status === 'Đã kích hoạt') ? 'Đã kích hoạt' : 
                      (item.status === 'INACTIVE' || item.status === 'Tạm khóa') ? 'Tạm khóa' : 'Chờ kích hoạt',
              lastLogin: item.lastLogin || 'Chưa từng',
              createdAt: item.createdAt || new Date().toISOString().split('T')[0],
              inviteLink: item.inviteLink
            };
          });
        } else {
          this.loadCachedOrSampleStaff();
        }
        this.saveStaffToCache();
      },
      error: () => {
        this.isLoading = false;
        this.loadCachedOrSampleStaff();
      }
    });
  }

  private loadCachedOrSampleStaff(): void {
    const saved = localStorage.getItem('dcor_staff_accounts_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed;
          return;
        }
      } catch (e) {}
    }
    this.records = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_STAFF));
    this.saveStaffToCache();
  }

  private saveStaffToCache(): void {
    localStorage.setItem('dcor_staff_accounts_list', JSON.stringify(this.records));
  }

  // --- Thống kê ---
  get activeCount(): number {
    return this.records.filter(r => r.status === 'Đã kích hoạt').length;
  }

  get pendingCount(): number {
    return this.records.filter(r => r.status === 'Chờ kích hoạt').length;
  }

  get lockedCount(): number {
    return this.records.filter(r => r.status === 'Tạm khóa').length;
  }

  // --- Lọc dữ liệu ---
  get filteredRecords(): StaffAccount[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.records.filter(record => {
      const matchSearch = !term || 
        record.name.toLowerCase().includes(term) ||
        record.email.toLowerCase().includes(term) ||
        record.phone.includes(term) ||
        record.role.toLowerCase().includes(term) ||
        record.branchName.toLowerCase().includes(term);

      const matchRole = this.selectedRoleFilter === 'ALL' || 
        record.roles?.includes(this.selectedRoleFilter) || 
        record.role.includes(this.selectedRoleFilter);

      const matchBranch = this.selectedBranchFilter === 'ALL' || 
        record.branchId === this.selectedBranchFilter || 
        record.assignedBranches?.includes(this.selectedBranchFilter);

      const matchStatus = this.selectedStatusFilter === 'ALL' || record.status === this.selectedStatusFilter;

      return matchSearch && matchRole && matchBranch && matchStatus;
    });
  }

  getInitials(name: string): string {
    if (!name) return 'DC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getBranchName(id: string): string {
    return this.adminAuthService.getBranchName(id);
  }

  isWarehouse(branchId: string): boolean {
    const b = this.adminAuthService.getBranchById(branchId);
    return b?.type === 'CENTRAL_WAREHOUSE';
  }

  // =========================================================================
  // MODAL 1: THÊM / CẬP NHẬT NHÂN SỰ
  // =========================================================================

  openCreateStaffModal(): void {
    this.isEditing = false;
    this.editingStaffId = null;
    this.staffFormData = {
      fullName: '',
      email: '',
      phone: '',
      selectedRoles: ['Sales'],
      selectedBranches: ['SR_Q1']
    };
    this.isStaffFormModalOpen = true;
  }

  openEditStaffModal(staff: StaffAccount): void {
    this.isEditing = true;
    this.editingStaffId = staff.id;
    this.staffFormData = {
      fullName: staff.name,
      email: staff.email,
      phone: staff.phone,
      selectedRoles: staff.roles && staff.roles.length > 0 ? [...staff.roles] : [staff.role],
      selectedBranches: staff.assignedBranches && staff.assignedBranches.length > 0 
        ? [...staff.assignedBranches] 
        : [staff.branchId || 'SR_Q1']
    };
    this.isStaffFormModalOpen = true;
  }

  closeStaffFormModal(): void {
    this.isStaffFormModalOpen = false;
    this.isEditing = false;
    this.editingStaffId = null;
  }

  toggleRoleSelection(roleName: string): void {
    const idx = this.staffFormData.selectedRoles.indexOf(roleName);
    if (idx > -1) {
      if (this.staffFormData.selectedRoles.length > 1) {
        this.staffFormData.selectedRoles.splice(idx, 1);
      } else {
        this.showToast('Nhân sự phải có ít nhất một vai trò.', 'warning');
      }
    } else {
      this.staffFormData.selectedRoles.push(roleName);
    }
  }

  isRoleSelected(roleName: string): boolean {
    return this.staffFormData.selectedRoles.includes(roleName);
  }

  toggleBranchSelection(branchId: string): void {
    const idx = this.staffFormData.selectedBranches.indexOf(branchId);
    if (idx > -1) {
      if (this.staffFormData.selectedBranches.length > 1) {
        this.staffFormData.selectedBranches.splice(idx, 1);
      } else {
        this.showToast('Vui lòng chọn ít nhất một kho hoặc showroom làm việc.', 'warning');
      }
    } else {
      this.staffFormData.selectedBranches.push(branchId);
    }
  }

  isBranchSelected(branchId: string): boolean {
    return this.staffFormData.selectedBranches.includes(branchId);
  }

  submitStaffForm(e: Event): void {
    e.preventDefault();
    if (!this.staffFormData.fullName || !this.staffFormData.email) {
      this.showToast('Vui lòng điền họ tên và email công việc.', 'warning');
      return;
    }

    if (this.staffFormData.selectedRoles.length === 0) {
      this.showToast('Vui lòng chọn ít nhất một vai trò.', 'warning');
      return;
    }

    if (this.staffFormData.selectedBranches.length === 0) {
      this.showToast('Vui lòng chọn ít nhất một chi nhánh/kho làm việc.', 'warning');
      return;
    }

    const branchNames = this.staffFormData.selectedBranches
      .map(bId => this.adminAuthService.getBranchName(bId))
      .join(', ');

    const primaryBranchId = this.staffFormData.selectedBranches[0];

    if (this.isEditing && this.editingStaffId) {
      // Cập nhật nhân sự
      const target = this.records.find(r => r.id === this.editingStaffId);
      if (target) {
        target.name = this.staffFormData.fullName.trim();
        target.email = this.staffFormData.email.trim();
        target.phone = this.staffFormData.phone.trim();
        target.roles = [...this.staffFormData.selectedRoles];
        target.role = target.roles.join(', ');
        target.assignedBranches = [...this.staffFormData.selectedBranches];
        target.branchId = primaryBranchId;
        target.branchName = branchNames;
        this.saveStaffToCache();
        this.showToast(`Đã cập nhật thông tin nhân sự "${target.name}"!`, 'success');
      }
      this.closeStaffFormModal();
    } else {
      // Tạo mới nhân sự qua backend API để lưu vào DB và sinh token kích hoạt bảo mật
      this.formSubmitting = true;
      const payload = {
        fullName: this.staffFormData.fullName.trim(),
        email: this.staffFormData.email.trim().toLowerCase(),
        phone: this.staffFormData.phone.trim(),
        roles: this.staffFormData.selectedRoles,
        role: this.staffFormData.selectedRoles[0],
        branchName: branchNames,
        branchId: primaryBranchId
      };

      this.http.post<any>(`${environment.apiUrl}/admin/staff/invite`, payload).subscribe({
        next: (res) => {
          this.formSubmitting = false;
          const createdStaff: StaffAccount = {
            id: res.staff?.id || 'staff-' + Date.now(),
            name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            role: payload.roles.join(', '),
            roles: payload.roles,
            branchId: primaryBranchId,
            branchName: branchNames,
            assignedBranches: this.staffFormData.selectedBranches,
            status: 'Chờ kích hoạt',
            lastLogin: 'Chưa từng',
            createdAt: new Date().toISOString().split('T')[0],
            inviteLink: res.inviteLink
          };

          this.records.unshift(createdStaff);
          this.saveStaffToCache();
          this.closeStaffFormModal();

          this.showToast(`Đã tạo tài khoản cho "${createdStaff.name}". Mở hộp thư gửi thông báo!`, 'success');
          this.openEmailDispatchModal(createdStaff, res.inviteLink);
        },
        error: (err) => {
          this.formSubmitting = false;
          console.warn('Backend invite error, saving locally:', err);
          // Fallback tạo local
          const localStaff: StaffAccount = {
            id: 'staff-' + Date.now(),
            name: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            role: payload.roles.join(', '),
            roles: payload.roles,
            branchId: primaryBranchId,
            branchName: branchNames,
            assignedBranches: this.staffFormData.selectedBranches,
            status: 'Chờ kích hoạt',
            lastLogin: 'Chưa từng',
            createdAt: new Date().toISOString().split('T')[0]
          };
          this.records.unshift(localStaff);
          this.saveStaffToCache();
          this.closeStaffFormModal();
          this.openEmailDispatchModal(localStaff);
        }
      });
    }
  }

  // =========================================================================
  // MODAL 2: CẤU HÌNH & SOẠN EMAIL BÀN GIAO TÀI KHOẢN (REAL GMAIL SMTP)
  // =========================================================================

  openEmailDispatchModal(staff: StaffAccount, inviteLink?: string): void {
    this.emailSending = false;
    this.emailSentSuccess = false;
    this.dispatchStaff = staff;
    const branch = this.adminAuthService.getBranchById(staff.branchId) || this.branchesList[0];
    this.dispatchBranch = branch;

    const frontendUrl = window.location.origin || 'http://localhost:4200';
    this.dispatchInviteUrl = inviteLink || staff.inviteLink || `${frontendUrl}/admin-invite?email=${encodeURIComponent(staff.email)}&token=dc_${staff.id}_auth`;

    const rolesList = staff.roles && staff.roles.length > 0 ? staff.roles : [staff.role];

    this.emailConfig = {
      recipientName: staff.name,
      recipientEmail: staff.email,
      recipientRoles: rolesList,
      recipientBranch: staff.branchName || branch.name,
      subject: `[DCor Studio] Thư mời kích hoạt tài khoản & Bổ nhiệm công tác tại ${staff.branchName || branch.name}`,
      adminNote: `Kính gửi ${staff.name},\n\nBan Giám Đốc DCor Studio trân trọng chào đón bạn gia nhập đội ngũ với vai trò: ${rolesList.join(', ')} tại ${staff.branchName || branch.name}.\n\nVui lòng nhấn nút bên dưới để kích hoạt tài khoản và tự tạo mật khẩu cá nhân. Chúc bạn công tác hiệu quả và gặt hái nhiều thành tựu cùng thương hiệu!`
    };

    this.emailModalTab = 'preview';
    this.isEmailDispatchModalOpen = true;
  }

  closeEmailDispatchModal(): void {
    this.isEmailDispatchModalOpen = false;
    this.dispatchStaff = null;
    this.dispatchBranch = null;
    this.emailSending = false;
    this.emailSentSuccess = false;
  }

  copyInviteLink(): void {
    navigator.clipboard.writeText(this.dispatchInviteUrl).then(() => {
      this.showToast('Đã sao chép liên kết kích hoạt bảo mật vào Clipboard!', 'info');
    });
  }

  copyCredentialsText(): void {
    const branch = this.dispatchBranch;
    const text = 
`==============================================
THÔNG TIN TÀI KHOẢN QUẢN TRỊ DCOR STUDIO
==============================================
Họ và tên: ${this.emailConfig.recipientName}
Email đăng nhập: ${this.emailConfig.recipientEmail}
Vai trò bổ nhiệm: ${this.emailConfig.recipientRoles.join(', ')}
Phạm vi phụ trách: ${this.emailConfig.recipientBranch}
Địa chỉ công tác: ${branch?.address || 'Trụ sở chính DCor'}
Hotline chi nhánh: ${branch?.phone || '1900 8888'}
Người phụ trách: ${branch?.managerName || 'Ban Quản trị'}

ĐƯỜNG DẪN KÍCH HOẠT & TỰ THIẾT LẬP MẬT KHẨU:
${this.dispatchInviteUrl}

(Lưu ý: Admin không nắm giữ mật khẩu. Bạn tự khởi tạo mật khẩu cá nhân tại liên kết trên)
==============================================`;

    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Đã sao chép toàn bộ thông tin bổ nhiệm vào Clipboard!', 'info');
    });
  }

  sendDispatchEmail(): void {
    if (!this.dispatchStaff) return;
    this.emailSending = true;
    this.emailSentSuccess = false;

    const payload = {
      email: this.emailConfig.recipientEmail,
      fullName: this.emailConfig.recipientName,
      roles: this.emailConfig.recipientRoles,
      branchName: this.emailConfig.recipientBranch,
      branchAddress: this.dispatchBranch?.address,
      branchPhone: this.dispatchBranch?.phone,
      branchManager: this.dispatchBranch?.managerName,
      subject: this.emailConfig.subject,
      adminNote: this.emailConfig.adminNote
    };

    // Gọi API backend THỰC TẾ qua Nodemailer
    this.http.post<any>(`${environment.apiUrl}/admin/staff/dispatch-email`, payload).subscribe({
      next: (res) => {
        this.emailSending = false;
        this.emailSentSuccess = true;
        if (res.emailSent) {
          this.showToast(`🚀 Đã gửi email thực tế tới ${payload.email} qua Gmail SMTP thành công!`, 'success');
        } else {
          this.showToast(res.message || 'Email đã được tạo trên hệ thống.', 'info');
        }
        setTimeout(() => {
          this.closeEmailDispatchModal();
        }, 900);
      },
      error: (err) => {
        this.emailSending = false;
        this.emailSentSuccess = false;
        console.error('Lỗi gửi email backend:', err);
        const errMsg = err.error?.message || 'Không thể kết nối đến máy chủ gửi email. Vui lòng kiểm tra lại dịch vụ SMTP.';
        this.showToast(errMsg, 'warning');
      }
    });
  }

  // =========================================================================
  // MODAL 3: XÓA TÀI KHOẢN NHÂN SỰ
  // =========================================================================

  openDeleteStaffModal(staff: StaffAccount): void {
    if (staff.roles?.includes('Super Admin') || staff.role === 'Super Admin' || staff.email.toLowerCase().includes('admin@dcor.vn')) {
      this.showToast('Không thể xóa tài khoản Super Admin hệ thống!', 'warning');
      return;
    }
    this.staffToDelete = staff;
    this.isDeleteModalOpen = true;
  }

  closeDeleteStaffModal(): void {
    this.isDeleteModalOpen = false;
    this.staffToDelete = null;
    this.deleteLoading = false;
  }

  confirmDeleteStaff(): void {
    if (!this.staffToDelete) return;
    this.deleteLoading = true;
    const target = this.staffToDelete;

    this.http.delete<any>(`${environment.apiUrl}/admin/staff/${target.id}`).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.records = this.records.filter(r => r.id !== target.id);
        this.saveStaffToCache();
        this.closeDeleteStaffModal();
        this.showToast(`Đã xóa vĩnh viễn tài khoản nhân sự "${target.name}"!`, 'success');
      },
      error: () => {
        // Fallback xóa local
        this.deleteLoading = false;
        this.records = this.records.filter(r => r.id !== target.id);
        this.saveStaffToCache();
        this.closeDeleteStaffModal();
        this.showToast(`Đã xóa tài khoản nhân sự "${target.name}" khỏi danh sách!`, 'success');
      }
    });
  }

  // --- Thao tác Khóa / Mở khóa ---
  toggleLockStatus(account: StaffAccount): void {
    if (account.status === 'Tạm khóa') {
      account.status = 'Đã kích hoạt';
      this.showToast(`Đã mở khóa tài khoản cho ${account.name}`, 'success');
    } else {
      account.status = 'Tạm khóa';
      this.showToast(`Đã tạm khóa tài khoản của ${account.name}`, 'warning');
    }
    this.saveStaffToCache();
  }

  // =========================================================================
  // MODAL 4: GỬI EMAIL HÀNG LOẠT (BULK EMAIL)
  // =========================================================================
  isBulkEmailModalOpen = false;
  bulkEmailSending = false;
  bulkEmailSentCount = 0;
  bulkEmailConfig = {
    subject: '[DCor Studio] Thư mời kích hoạt tài khoản quản trị',
    adminNote: 'Kính gửi bạn,\n\nBan Giám Đốc DCor Studio trân trọng chào đón bạn gia nhập đội ngũ. Vui lòng nhấn nút bên dưới để kích hoạt tài khoản và tự tạo mật khẩu cá nhân. Chúc bạn công tác hiệu quả!',
    targetGroup: 'pending' as 'pending' | 'all' | 'locked'
  };

  get bulkTargetCount(): number {
    if (this.bulkEmailConfig.targetGroup === 'pending') {
      return this.records.filter(r => r.status === 'Chờ kích hoạt' && r.inviteLink).length;
    } else if (this.bulkEmailConfig.targetGroup === 'all') {
      return this.records.filter(r => r.inviteLink).length;
    }
    return 0;
  }

  openBulkEmailModal(): void {
    this.bulkEmailSentCount = 0;
    this.bulkEmailSending = false;
    this.isBulkEmailModalOpen = true;
  }

  closeBulkEmailModal(): void {
    this.isBulkEmailModalOpen = false;
    this.bulkEmailSending = false;
    this.bulkEmailSentCount = 0;
  }

  sendBulkEmail(): void {
    const targets = this.records.filter(r => {
      if (!r.inviteLink) return false;
      if (this.bulkEmailConfig.targetGroup === 'pending') return r.status === 'Chờ kích hoạt';
      if (this.bulkEmailConfig.targetGroup === 'all') return true;
      return false;
    });

    if (targets.length === 0) {
      this.showToast('Không có nhân sự nào phù hợp để gửi email hàng loạt.', 'warning');
      return;
    }

    this.bulkEmailSending = true;
    this.bulkEmailSentCount = 0;

    // Gửi tuần tự (sequential) để không overload SMTP
    const sendNext = (index: number) => {
      if (index >= targets.length) {
        this.bulkEmailSending = false;
        this.showToast(`✅ Đã gửi thành công ${this.bulkEmailSentCount}/${targets.length} email hàng loạt!`, 'success');
        setTimeout(() => this.closeBulkEmailModal(), 1500);
        return;
      }

      const staff = targets[index];
      const branch = this.adminAuthService.getBranchById(staff.branchId) || this.branchesList[0];

      const payload = {
        email: staff.email,
        fullName: staff.name,
        roles: staff.roles && staff.roles.length > 0 ? staff.roles : [staff.role],
        branchName: staff.branchName || branch?.name || 'DCor Studio',
        branchAddress: branch?.address,
        branchPhone: branch?.phone,
        branchManager: branch?.managerName,
        subject: this.bulkEmailConfig.subject,
        adminNote: this.bulkEmailConfig.adminNote
      };

      this.http.post<any>(`${environment.apiUrl}/admin/staff/dispatch-email`, payload).subscribe({
        next: () => {
          this.bulkEmailSentCount++;
          sendNext(index + 1);
        },
        error: () => {
          sendNext(index + 1); // Tiếp tục gửi cho người tiếp theo ngay cả khi lỗi
        }
      });
    };

    sendNext(0);
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
      }
    }, 4000);
  }
}
