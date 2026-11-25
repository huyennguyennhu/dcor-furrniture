import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    role: 'QL Kho',
    roles: ['QL Kho'],
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
    role: 'QL Kho, NV Kinh doanh',
    roles: ['QL Kho', 'NV Kinh doanh'], // Vừa quản lý kho vừa bán hàng
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
    role: 'NV Kinh doanh',
    roles: ['NV Kinh doanh'],
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
    role: 'QL Kho',
    roles: ['QL Kho'],
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
    role: 'NV Kinh doanh',
    roles: ['NV Kinh doanh'],
    branchId: 'SR_DN_HAI_CHAU',
    branchName: 'Showroom Đà Nẵng',
    assignedBranches: ['SR_DN_HAI_CHAU'],
    status: 'Chờ kích hoạt',
    lastLogin: 'Chưa từng',
    createdAt: '2026-03-01'
  },
  {
    id: 'staff-7',
    name: 'KTS. Lê Nam',
    email: 'nam.le@dcor.vn',
    phone: '0908 111 222',
    role: 'Kiến trúc sư',
    roles: ['Kiến trúc sư'],
    branchId: 'ALL',
    branchName: 'Showroom Quận 1 & Xưởng May Đo',
    assignedBranches: ['ALL'],
    status: 'Đã kích hoạt',
    lastLogin: 'Hôm nay',
    createdAt: '2026-01-10'
  },
  {
    id: 'staff-8',
    name: 'KTS. Lê Hoàng',
    email: 'hoang.le@dcor.vn',
    phone: '0908 222 333',
    role: 'Kiến trúc sư',
    roles: ['Kiến trúc sư'],
    branchId: 'ALL',
    branchName: 'Showroom Thủ Đức & Xưởng Mộc',
    assignedBranches: ['ALL'],
    status: 'Đã kích hoạt',
    lastLogin: 'Hôm nay',
    createdAt: '2026-01-12'
  },
  {
    id: 'staff-9',
    name: 'KTS. Trần Minh',
    email: 'minh.tran@dcor.vn',
    phone: '0908 333 444',
    role: 'Kiến trúc sư',
    roles: ['Kiến trúc sư'],
    branchId: 'ALL',
    branchName: 'Showroom Hà Nội',
    assignedBranches: ['ALL'],
    status: 'Đã kích hoạt',
    lastLogin: 'Hôm qua',
    createdAt: '2026-01-15'
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
    selectedRoles: [] as string[],
    selectedBranches: [] as string[]
  };

  // =========================================================================
  // MODAL QUICK ADD ROLE: TẠO VAI TRÒ MỚI VÀ ĐỒNG BỘ TỨC THÌ LÊN SERVER IAM
  // =========================================================================
  isQuickAddRoleModalOpen = false;
  quickAddRoleSubmitting = false;
  quickRoleData = {
    name: '',
    code: '',
    description: '',
    cloneFromRoleName: 'Sales'
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
  // MODAL 3: XÁC NHẬN XÓA TÀI KHOẢN NHÂN SỰ (XÁC THỰC 2 LỚP - GÕ CHỮ "YES")
  // =========================================================================
  isDeleteModalOpen = false;
  staffToDelete: StaffAccount | null = null;
  deleteLoading = false;
  deleteStep: 1 | 2 = 1;
  deleteConfirmText = '';

  // =========================================================================
  // MODAL KHÓA / MỞ KHÓA TÀI KHOẢN (CÓ XÁC NHẬN)
  // =========================================================================
  isLockModalOpen = false;
  staffToLock: StaffAccount | null = null;
  lockLoading = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public adminAuthService: AdminAuthService
  ) { }

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

  get isSuperAdmin(): boolean {
    const user = this.adminAuthService.currentUser;
    return !!user && (user.role === 'Super Admin' || !!user.roles?.includes('Super Admin'));
  }

  get canEditStaff(): boolean {
    return this.isSuperAdmin || this.adminAuthService.hasPermission('staff', 'edit');
  }

  get canDeleteStaff(): boolean {
    return this.isSuperAdmin;
  }

  isSelf(account: StaffAccount): boolean {
    const user = this.adminAuthService.currentUser;
    if (!user) return false;
    return String(user.id) === String(account.id) || (!!user.email && !!account.email && user.email.toLowerCase() === account.email.toLowerCase());
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
            const rawRoles = (Array.isArray(item.roles) && item.roles.length > 0
              ? item.roles
              : [item.role || 'NV Kinh doanh']
            ).map((r: string) => this.adminAuthService.normalizeAdminRole(r));

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
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loadCachedOrSampleStaff();
        this.cdr.detectChanges();
      }
    });
  }

  private loadCachedOrSampleStaff(): void {
    const saved = localStorage.getItem('dcor_staff_accounts_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed.map((p: any) => {
            const rawRoles = (Array.isArray(p.roles) && p.roles.length > 0
              ? p.roles
              : [p.role || 'NV Kinh doanh']
            ).map((r: string) => this.adminAuthService.normalizeAdminRole(r));
            return {
              ...p,
              roles: rawRoles,
              role: rawRoles.join(', ')
            };
          });
          return;
        }
      } catch (e) { }
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
      selectedRoles: [],
      selectedBranches: []
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

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = status;
  }

  // --- Quick Add Role in Staff Accounts (Đồng bộ tức thì lên Ma trận phân quyền) ---
  openQuickAddRoleModal(): void {
    this.quickRoleData = {
      name: '',
      code: '',
      description: '',
      cloneFromRoleName: 'Sales'
    };
    this.isQuickAddRoleModalOpen = true;
  }

  closeQuickAddRoleModal(): void {
    this.isQuickAddRoleModalOpen = false;
    this.quickAddRoleSubmitting = false;
  }

  onQuickRoleNameChange(): void {
    if (!this.quickRoleData.code && this.quickRoleData.name) {
      this.quickRoleData.code = this.quickRoleData.name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D')
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  }

  submitQuickAddRole(): void {
    const cleanName = (this.quickRoleData.name || '').trim();
    const cleanCode = (this.quickRoleData.code || cleanName).trim().toUpperCase().replace(/\s+/g, '_');

    if (!cleanName || cleanName.length < 2) {
      this.showToast('Vui lòng nhập tên vai trò từ 2 ký tự trở lên.', 'warning');
      return;
    }
    if (!cleanCode || cleanCode.length < 2) {
      this.showToast('Vui lòng nhập mã vai trò hợp lệ.', 'warning');
      return;
    }

    this.quickAddRoleSubmitting = true;
    this.adminAuthService.createRoleOnServer({
      name: cleanName,
      code: cleanCode,
      description: this.quickRoleData.description.trim(),
      cloneFromRoleName: this.quickRoleData.cloneFromRoleName
    }).subscribe({
      next: () => {
        this.quickAddRoleSubmitting = false;
        this.closeQuickAddRoleModal();
        if (!this.staffFormData.selectedRoles.includes(cleanName)) {
          this.staffFormData.selectedRoles.push(cleanName);
        }
        this.showToast(`✓ Đã tạo vai trò "${cleanName}" và đồng bộ tức thì sang Ma trận phân quyền!`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.quickAddRoleSubmitting = false;
        const msg = err?.error?.message || err?.message || 'Không thể tạo vai trò mới.';
        this.showToast(msg, 'warning');
      }
    });
  }

  onPhoneInput(event: any): void {
    const raw = event.target.value || '';
    const clean = raw.replace(/[^0-9]/g, '').slice(0, 10);
    this.staffFormData.phone = clean;
    event.target.value = clean;
  }

  submitStaffForm(e: Event): void {
    e.preventDefault();
    const cleanName = (this.staffFormData.fullName || '').trim();
    if (!cleanName || cleanName.length < 2) {
      this.showToast('Vui lòng nhập họ và tên nhân sự hợp lệ (từ 2 ký tự trở lên).', 'warning');
      return;
    }

    const cleanEmail = (this.staffFormData.email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      this.showToast('Email công việc không đúng định dạng hợp lệ (Ví dụ: nhansu@dcor.vn).', 'warning');
      return;
    }

    const cleanPhone = (this.staffFormData.phone || '').trim().replace(/[\s.-]/g, '');
    if (cleanPhone) {
      const vnPhoneRegex = /^0[0-9]{9}$/;
      if (!vnPhoneRegex.test(cleanPhone)) {
        this.showToast('Số điện thoại phải đúng định dạng Việt Nam: bắt đầu bằng số 0 và có đúng 10 số (Ví dụ: 0901234567).', 'warning');
        return;
      }
    }

    if (this.staffFormData.selectedRoles.length === 0) {
      this.showToast('Vui lòng chọn ít nhất một vai trò.', 'warning');
      return;
    }

    if (this.staffFormData.selectedBranches.length === 0) {
      this.showToast('Vui lòng chọn ít nhất một chi nhánh/kho làm việc.', 'warning');
      return;
    }

    this.staffFormData.fullName = cleanName;
    this.staffFormData.email = cleanEmail;
    this.staffFormData.phone = cleanPhone;

    const branchNames = this.staffFormData.selectedBranches
      .map(bId => this.adminAuthService.getBranchName(bId))
      .join(', ');

    const primaryBranchId = this.staffFormData.selectedBranches[0];

    if (this.isEditing && this.editingStaffId) {
      // Bảo mật hệ thống: Super Admin CHỈ ĐƯỢC PHÉP thay đổi Vai trò và Chi nhánh công tác.
      // Tuyệt đối không can thiệp hay sửa đổi Tên tài khoản, Email hay Mật khẩu cá nhân của nhân viên!
      const target = this.records.find(r => r.id === this.editingStaffId);
      if (target) {
        target.roles = [...this.staffFormData.selectedRoles];
        target.role = target.roles.join(', ');
        target.assignedBranches = [...this.staffFormData.selectedBranches];
        target.branchId = primaryBranchId;
        target.branchName = branchNames;
        this.saveStaffToCache();

        // Gửi cập nhật phân quyền & chi nhánh lên máy chủ backend
        this.http.put<any>(`${environment.apiUrl}/admin/staff/${target.id}/role`, {
          roles: target.roles,
          assignedBranches: target.assignedBranches,
          branchId: primaryBranchId,
          branchName: branchNames
        }).subscribe({
          next: () => {
            this.cdr.detectChanges();
          },
          error: () => { }
        });

        this.showToast(`Đã cập nhật phân quyền & chi nhánh phụ trách cho "${target.name}"!`, 'success');
        this.cdr.detectChanges();
      }
      this.closeStaffFormModal();
    } else {
      // Tạo mới nhân sự qua backend API để lưu vào DB và sinh token kích hoạt bảo mật
      this.formSubmitting = true;
      this.cdr.detectChanges();
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
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
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
Hotline chi nhánh: ${branch?.phone || '1900 1234'}
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
    this.cdr.detectChanges();

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
        this.cdr.detectChanges();
        setTimeout(() => {
          this.closeEmailDispatchModal();
          this.cdr.detectChanges();
        }, 1200);
      },
      error: (err) => {
        this.emailSending = false;
        this.emailSentSuccess = false;
        console.error('Lỗi gửi email backend:', err);
        const errMsg = err.error?.message || 'Không thể kết nối đến máy chủ gửi email. Vui lòng kiểm tra lại dịch vụ SMTP.';
        this.showToast(errMsg, 'warning');
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================================
  // MODAL 3: XÓA TÀI KHOẢN NHÂN SỰ
  // =========================================================================

  // =========================================================================
  // MODAL 3: XÓA TÀI KHOẢN NHÂN SỰ (XÁC THỰC 2 LỚP VỚI TỪ KHÓA "YES")
  // =========================================================================

  openDeleteStaffModal(staff: StaffAccount): void {
    if (!this.isSuperAdmin) {
      this.showToast('Chỉ Super Admin mới có quyền xóa tài khoản nhân sự!', 'warning');
      return;
    }
    if (this.isSelf(staff)) {
      this.showToast('Bạn không thể tự xóa tài khoản của chính mình!', 'warning');
      return;
    }
    if (staff.roles?.includes('Super Admin') || staff.role === 'Super Admin' || staff.email.toLowerCase().includes('admin@dcor.vn')) {
      this.showToast('Không thể xóa tài khoản Super Admin hệ thống!', 'warning');
      return;
    }
    this.staffToDelete = staff;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  proceedToDeleteStep2(): void {
    this.deleteStep = 2;
    this.deleteConfirmText = '';
    this.cdr.detectChanges();
  }

  backToDeleteStep1(): void {
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.cdr.detectChanges();
  }

  closeDeleteStaffModal(): void {
    this.isDeleteModalOpen = false;
    this.staffToDelete = null;
    this.deleteLoading = false;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.cdr.detectChanges();
  }

  confirmDeleteStaff(): void {
    if (!this.staffToDelete || this.deleteConfirmText.trim() !== 'YES') {
      this.showToast('Vui lòng nhập chính xác chữ YES để xác nhận xóa vĩnh viễn!', 'warning');
      return;
    }
    this.deleteLoading = true;
    const target = this.staffToDelete;

    this.http.delete<any>(`${environment.apiUrl}/admin/staff/${target.id}`).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.records = this.records.filter(r => r.id !== target.id);
        this.saveStaffToCache();
        this.closeDeleteStaffModal();
        this.showToast(`Đã xóa vĩnh viễn tài khoản nhân sự "${target.name}"!`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteLoading = false;
        const msg = err.error?.message || 'Không thể xóa tài khoản nhân sự. Thao tác bị từ chối.';
        this.showToast(msg, 'warning');
        this.closeDeleteStaffModal();
        this.cdr.detectChanges();
      }
    });
  }

  // =========================================================================
  // THAO TÁC KHÓA / MỞ KHÓA TÀI KHOẢN (CÓ BẢNG XÁC NHẬN RÕ RÀNG)
  // =========================================================================
  openLockModal(account: StaffAccount): void {
    if (!this.isSuperAdmin) {
      this.showToast('Chỉ Super Admin mới có quyền khóa hoặc mở khóa tài khoản nhân sự!', 'warning');
      return;
    }
    if (this.isSelf(account)) {
      this.showToast('Bạn không thể tự khóa hoặc mở khóa tài khoản của chính mình!', 'warning');
      return;
    }
    if (account.roles?.includes('Super Admin') || account.role === 'Super Admin' || account.email.toLowerCase().includes('admin@dcor.vn')) {
      this.showToast('Không thể khóa tài khoản Super Admin hệ thống!', 'warning');
      return;
    }
    this.staffToLock = account;
    this.isLockModalOpen = true;
    this.cdr.detectChanges();
  }

  closeLockModal(): void {
    this.isLockModalOpen = false;
    this.staffToLock = null;
    this.lockLoading = false;
    this.cdr.detectChanges();
  }

  confirmToggleLock(): void {
    if (!this.staffToLock) return;
    this.lockLoading = true;
    const account = this.staffToLock;
    const targetStatus = account.status === 'Tạm khóa' ? 'ACTIVE' : 'INACTIVE';

    this.http.put<any>(`${environment.apiUrl}/admin/staff/${account.id}/status`, { status: targetStatus }).subscribe({
      next: () => {
        this.lockLoading = false;
        account.status = targetStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Tạm khóa';
        this.showToast(targetStatus === 'ACTIVE' ? `Đã mở khóa tài khoản cho ${account.name} thành công!` : `Đã tạm khóa tài khoản của ${account.name}!`, targetStatus === 'ACTIVE' ? 'success' : 'warning');
        this.saveStaffToCache();
        this.closeLockModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.lockLoading = false;
        const msg = err.error?.message || 'Không thể cập nhật trạng thái tài khoản. Thao tác bị từ chối.';
        this.showToast(msg, 'warning');
        this.closeLockModal();
        this.cdr.detectChanges();
      }
    });
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
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
        this.cdr.detectChanges();
      }
    }, 4000);
  }
}
