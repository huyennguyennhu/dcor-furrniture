import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { AdminRole } from '../../../../../core/services/admin-auth.service';
import { environment } from '../../../../../../environments/environment';

export type StaffStatusText = 'Đã kích hoạt' | 'Chờ kích hoạt' | 'Tạm khóa';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  avatarUrl?: string;
  lastLogin: string;
  status: StaffStatusText;
  createdAt?: string;
  inviteLink?: string;
}

@Component({
  selector: 'app-staff-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './staff-accounts.html',
  styleUrls: ['./staff-accounts.css']
})
export class StaffAccountsComponent implements OnInit {
  searchTerm = '';
  selectedRoleFilter: string = 'ALL';
  selectedStatusFilter: string = 'ALL';
  isLoading = false;

  // Modal Mời nhân sự mới
  isInviteModalOpen = false;
  inviteLoading = false;
  inviteSuccessMessage = '';
  generatedTestLink = '';

  newStaff: {
    fullName: string;
    email: string;
    phone: string;
    role: AdminRole;
  } = {
    fullName: '',
    email: '',
    phone: '',
    role: 'Sales'
  };

  // Modal Sửa vai trò
  isEditRoleModalOpen = false;
  selectedStaffForEdit: StaffAccount | null = null;
  editedRole: AdminRole = 'Super Admin';

  // Thông báo toast
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' = 'success';

  readonly rolesList: AdminRole[] = [
    'Super Admin',
    'Quản lý sản phẩm',
    'Quản lý kho',
    'Quản lý đơn hàng',
    'Marketing',
    'CSKH',
    'Sales'
  ];

  records: StaffAccount[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.http.get<StaffAccount[]>(`${environment.apiUrl}/admin/staff`).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.records = data;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi tải danh sách nhân sự từ server:', err);
        // Fallback đọc cache nếu có
        const saved = localStorage.getItem('dcor_staff_accounts_list');
        if (saved) {
          try {
            this.records = JSON.parse(saved);
          } catch (e) {}
        }
      }
    });
  }

  get activeCount(): number {
    return this.records.filter(r => r.status === 'Đã kích hoạt').length;
  }

  get pendingCount(): number {
    return this.records.filter(r => r.status === 'Chờ kích hoạt').length;
  }

  get lockedCount(): number {
    return this.records.filter(r => r.status === 'Tạm khóa').length;
  }

  get filteredRecords(): StaffAccount[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => {
      const matchSearch = !term || 
        record.name.toLocaleLowerCase().includes(term) ||
        record.email.toLocaleLowerCase().includes(term) ||
        record.phone.includes(term) ||
        record.role.toLocaleLowerCase().includes(term);

      const matchRole = this.selectedRoleFilter === 'ALL' || record.role === this.selectedRoleFilter;
      const matchStatus = this.selectedStatusFilter === 'ALL' || record.status === this.selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }

  // --- Modal Thêm / Mời nhân sự ---
  openInviteModal(): void {
    this.isInviteModalOpen = true;
    this.inviteSuccessMessage = '';
    this.generatedTestLink = '';
    this.newStaff = {
      fullName: '',
      email: '',
      phone: '',
      role: 'Sales'
    };
  }

  closeInviteModal(): void {
    this.isInviteModalOpen = false;
    this.inviteLoading = false;
    this.inviteSuccessMessage = '';
    this.generatedTestLink = '';
  }

  handleSendInvite(e: Event): void {
    e.preventDefault();
    if (!this.newStaff.fullName || !this.newStaff.email) return;

    this.inviteLoading = true;

    this.http.post<any>(`${environment.apiUrl}/admin/staff/invite`, this.newStaff).subscribe({
      next: (res) => {
        this.inviteLoading = false;
        this.generatedTestLink = res.inviteLink || '';

        if (res.staff) {
          this.records.unshift(res.staff);
        } else {
          this.loadStaff();
        }

        this.inviteSuccessMessage = res.message || `Đã gửi thư mời tham gia thành công tới ${this.newStaff.email}!`;
        this.showToast(this.inviteSuccessMessage, 'success');
      },
      error: (err) => {
        this.inviteLoading = false;
        const msg = err.error?.message || 'Có lỗi xảy ra khi tạo lời mời nhân sự.';
        this.showToast(msg, 'warning');
      }
    });
  }

  copyLink(link: string): void {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.showToast('Đã sao chép liên kết kích hoạt vào bộ nhớ tạm!', 'info');
    });
  }

  // --- Thao tác trên từng dòng ---
  openEditRoleModal(account: StaffAccount): void {
    this.selectedStaffForEdit = account;
    this.editedRole = account.role;
    this.isEditRoleModalOpen = true;
  }

  closeEditRoleModal(): void {
    this.isEditRoleModalOpen = false;
    this.selectedStaffForEdit = null;
  }

  saveEditedRole(): void {
    if (!this.selectedStaffForEdit) return;

    const targetStaff = this.selectedStaffForEdit;
    const newRole = this.editedRole;

    this.http.put<any>(`${environment.apiUrl}/admin/staff/${targetStaff.id}/role`, { role: newRole }).subscribe({
      next: (res) => {
        targetStaff.role = res.role || newRole;
        this.showToast(`Đã cập nhật vai trò của ${targetStaff.name} thành "${targetStaff.role}"`, 'success');
        this.closeEditRoleModal();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Lỗi cập nhật vai trò', 'warning');
      }
    });
  }

  toggleLockStatus(account: StaffAccount): void {
    const nextStatus = account.status === 'Tạm khóa' ? 'ACTIVE' : 'INACTIVE';

    this.http.put<any>(`${environment.apiUrl}/admin/staff/${account.id}/status`, { status: nextStatus }).subscribe({
      next: (res) => {
        account.status = res.status;
        const actionText = account.status === 'Đã kích hoạt' ? 'mở khóa' : 'tạm khóa';
        this.showToast(`Đã ${actionText} tài khoản của ${account.name}`, account.status === 'Đã kích hoạt' ? 'success' : 'warning');
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Lỗi thay đổi trạng thái', 'warning');
      }
    });
  }

  resendInvite(account: StaffAccount): void {
    this.http.post<any>(`${environment.apiUrl}/admin/staff/${account.id}/resend-invite`, {}).subscribe({
      next: (res) => {
        account.inviteLink = res.inviteLink;
        this.showToast(res.message || `Đã gửi lại thư mời tới ${account.email}!`, 'success');
        if (res.inviteLink) {
          this.copyLink(res.inviteLink);
        }
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Lỗi gửi lại thư mời', 'warning');
      }
    });
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

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
