import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { environment } from '../../../../../../environments/environment';

export interface VoucherItem {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountCap?: number;
  minOrderValue: number;
  scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName?: string;
  usageLimit: number;
  usedCount: number;
  perCustomerLimit: number;
  isStackableWithFlashSale: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng';
  revenueGenerated: number;
}

const STORAGE_KEY = 'dcor_admin_vouchers_data_v1';

const DEFAULT_VOUCHERS: VoucherItem[] = [
  {
    id: 'VOUCHER-001',
    code: 'WELCOME10',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscountCap: 1500000,
    minOrderValue: 2000000,
    scope: 'ALL',
    usageLimit: 500,
    usedCount: 384,
    perCustomerLimit: 1,
    isStackableWithFlashSale: false,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'Đang hoạt động',
    revenueGenerated: 768000000
  },
  {
    id: 'VOUCHER-002',
    code: 'DCOR_VIP2026',
    discountType: 'PERCENT',
    discountValue: 15,
    maxDiscountCap: 3000000,
    minOrderValue: 15000000,
    scope: 'ALL',
    usageLimit: 150,
    usedCount: 112,
    perCustomerLimit: 1,
    isStackableWithFlashSale: true,
    startDate: '2026-02-01',
    endDate: '2026-08-31',
    status: 'Đang hoạt động',
    revenueGenerated: 1680000000
  },
  {
    id: 'VOUCHER-003',
    code: 'SOFAGIAM500K',
    discountType: 'FIXED_AMOUNT',
    discountValue: 500000,
    minOrderValue: 8000000,
    scope: 'CATEGORY',
    categoryScopeName: 'Sofa & Ghế Phòng Khách',
    usageLimit: 200,
    usedCount: 145,
    perCustomerLimit: 1,
    isStackableWithFlashSale: true,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    status: 'Đang hoạt động',
    revenueGenerated: 435000000
  },
  {
    id: 'VOUCHER-004',
    code: 'DCORKHAITRUONG',
    discountType: 'PERCENT',
    discountValue: 20,
    maxDiscountCap: 5000000,
    minOrderValue: 20000000,
    scope: 'CATEGORY',
    categoryScopeName: 'Giường & Phòng Ngủ',
    usageLimit: 80,
    usedCount: 80,
    perCustomerLimit: 1,
    isStackableWithFlashSale: false,
    startDate: '2026-01-10',
    endDate: '2026-02-28',
    status: 'Đã kết thúc',
    revenueGenerated: 800000000
  },
  {
    id: 'VOUCHER-005',
    code: 'COMBOBANAN',
    discountType: 'FIXED_AMOUNT',
    discountValue: 1200000,
    minOrderValue: 12000000,
    scope: 'CATEGORY',
    categoryScopeName: 'Bàn Ghế Ăn & Bếp',
    usageLimit: 100,
    usedCount: 0,
    perCustomerLimit: 1,
    isStackableWithFlashSale: false,
    startDate: '2026-11-01',
    endDate: '2026-12-15',
    status: 'Sắp diễn ra',
    revenueGenerated: 0
  },
  {
    id: 'VOUCHER-006',
    code: 'FREESHIPXTRA',
    discountType: 'FIXED_AMOUNT',
    discountValue: 300000,
    minOrderValue: 5000000,
    scope: 'ALL',
    usageLimit: 300,
    usedCount: 188,
    perCustomerLimit: 2,
    isStackableWithFlashSale: true,
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    status: 'Tạm dừng',
    revenueGenerated: 282000000
  }
];

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './vouchers.html',
  styleUrls: ['./vouchers.css']
})
export class VouchersComponent implements OnInit {
  records: VoucherItem[] = [];

  // Filters
  searchTerm = '';
  selectedStatus: string = 'ALL';
  selectedDiscountType: string = 'ALL';
  selectedScope: string = 'ALL';

  // Category Scope List
  readonly CATEGORIES: string[] = [
    'Sofa & Ghế Phòng Khách',
    'Bàn Ghế Ăn & Bếp',
    'Giường & Phòng Ngủ',
    'Tủ Kệ Trang Trí',
    'Đèn & Phụ Kiện Decor',
    'Nội thất Văn phòng'
  ];

  // Modal State
  isModalOpen = false;
  isEditing = false;
  editingId: string | null = null;

  // Form Data
  formData: {
    code: string;
    discountType: 'PERCENT' | 'FIXED_AMOUNT';
    discountValue: number;
    maxDiscountCap: number | null;
    minOrderValue: number;
    scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
    categoryScopeName: string;
    usageLimit: number;
    perCustomerLimit: number;
    isStackableWithFlashSale: boolean;
    startDate: string;
    endDate: string;
    status: 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng';
  } = this.getEmptyForm();

  // Delete Confirmation Modal
  voucherToDelete: VoucherItem | null = null;

  // Toast alert
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadFromStorage();
    this.loadFromApi();
  }

  loadFromApi(): void {
    fetch(`${environment.apiUrl}/vouchers`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const nowStr = new Date().toISOString().split('T')[0];
          this.records = data.map(v => {
            const start = v.startDate ? String(v.startDate).split('T')[0] : '2026-01-01';
            const end = v.endDate ? String(v.endDate).split('T')[0] : '2026-12-31';
            let status: 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng' = 'Đang hoạt động';
            if (!v.isActive) {
              status = 'Tạm dừng';
            } else if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) {
              status = 'Đã kết thúc';
            } else if (end < nowStr) {
              status = 'Đã kết thúc';
            } else if (start > nowStr) {
              status = 'Sắp diễn ra';
            }

            return {
              id: v.id,
              code: v.code,
              discountType: v.discountType,
              discountValue: v.discountValue,
              maxDiscountCap: v.maxDiscountCap,
              minOrderValue: v.minOrderValue || 0,
              scope: 'ALL',
              categoryScopeName: undefined,
              usageLimit: v.usageLimit || 100,
              usedCount: v.usedCount || 0,
              perCustomerLimit: v.perCustomerLimit || 1,
              isStackableWithFlashSale: !!v.isStackableWithFlashSale,
              startDate: start,
              endDate: end,
              status,
              revenueGenerated: (v.usedCount || 0) * (v.minOrderValue || 2000000)
            };
          });
          this.saveToStorage();
        }
      })
      .catch(err => {
        console.warn('API /vouchers offline, using cached records:', err);
      });
  }

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      } else {
        this.records = [...DEFAULT_VOUCHERS];
        this.saveToStorage();
      }
    } catch {
      this.records = [...DEFAULT_VOUCHERS];
    }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  getEmptyForm() {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      code: '',
      discountType: 'PERCENT' as 'PERCENT' | 'FIXED_AMOUNT',
      discountValue: 10,
      maxDiscountCap: 1000000,
      minOrderValue: 2000000,
      scope: 'ALL' as 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS',
      categoryScopeName: 'Sofa & Ghế Phòng Khách',
      usageLimit: 100,
      perCustomerLimit: 1,
      isStackableWithFlashSale: false,
      startDate: today,
      endDate: nextMonth,
      status: 'Đang hoạt động' as 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng'
    };
  }

  // Filtered Records
  get filteredRecords(): VoucherItem[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(item => {
      // Search
      const matchSearch =
        !term ||
        item.code.toLocaleLowerCase().includes(term) ||
        (item.categoryScopeName && item.categoryScopeName.toLocaleLowerCase().includes(term)) ||
        item.status.toLocaleLowerCase().includes(term);

      // Status
      const matchStatus = this.selectedStatus === 'ALL' || item.status === this.selectedStatus;

      // Discount Type
      const matchType = this.selectedDiscountType === 'ALL' || item.discountType === this.selectedDiscountType;

      // Scope
      const matchScope = this.selectedScope === 'ALL' || item.scope === this.selectedScope;

      return matchSearch && matchStatus && matchType && matchScope;
    });
  }

  // Statistics
  get totalCount(): number {
    return this.records.length;
  }

  get activeCount(): number {
    return this.records.filter(r => r.status === 'Đang hoạt động').length;
  }

  get monthlyUsageCount(): number {
    return this.records.reduce((sum, r) => sum + (r.usedCount || 0), 0);
  }

  get totalRevenueGenerated(): number {
    return this.records.reduce((sum, r) => sum + (r.revenueGenerated || 0), 0);
  }

  // Actions
  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.formData.code = this.generateRandomCode();
    this.isModalOpen = true;
  }

  openEditModal(item: VoucherItem): void {
    this.isEditing = true;
    this.editingId = item.id;
    this.formData = {
      code: item.code,
      discountType: item.discountType,
      discountValue: item.discountValue,
      maxDiscountCap: item.maxDiscountCap !== undefined ? item.maxDiscountCap : null,
      minOrderValue: item.minOrderValue,
      scope: item.scope,
      categoryScopeName: item.categoryScopeName || 'Sofa & Ghế Phòng Khách',
      usageLimit: item.usageLimit,
      perCustomerLimit: item.perCustomerLimit || 1,
      isStackableWithFlashSale: item.isStackableWithFlashSale,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.formData.code = input.value.toUpperCase().replace(/\s+/g, '');
    }
  }

  generateRandomCode(): string {
    const prefixes = ['DCOR', 'VIP', 'SALE', 'HOME', 'DEAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
  }

  applyRandomCode(): void {
    this.formData.code = this.generateRandomCode();
  }

  saveVoucher(): void {
    const code = this.formData.code.trim().toUpperCase();
    if (!code) {
      this.showToast('Vui lòng nhập mã voucher!', 'warning');
      return;
    }

    if (this.formData.discountValue <= 0) {
      this.showToast('Mức giảm giá phải lớn hơn 0!', 'warning');
      return;
    }

    if (this.formData.discountType === 'PERCENT' && this.formData.discountValue > 100) {
      this.showToast('Mức giảm phần trăm không được vượt quá 100%!', 'warning');
      return;
    }

    if (this.formData.usageLimit <= 0) {
      this.showToast('Tổng lượt sử dụng phải lớn hơn 0!', 'warning');
      return;
    }

    if (!this.formData.startDate || !this.formData.endDate) {
      this.showToast('Vui lòng chọn thời hạn áp dụng!', 'warning');
      return;
    }

    if (new Date(this.formData.startDate) > new Date(this.formData.endDate)) {
      this.showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'warning');
      return;
    }

    // Auto determine status based on dates if active
    let calculatedStatus = this.formData.status;
    const nowStr = new Date().toISOString().split('T')[0];
    if (calculatedStatus !== 'Tạm dừng') {
      if (this.formData.startDate > nowStr) {
        calculatedStatus = 'Sắp diễn ra';
      } else if (this.formData.endDate < nowStr) {
        calculatedStatus = 'Đã kết thúc';
      } else {
        calculatedStatus = 'Đang hoạt động';
      }
    }

    const apiPayload = {
      code,
      discountType: this.formData.discountType,
      discountValue: Number(this.formData.discountValue),
      maxDiscountCap: this.formData.discountType === 'PERCENT' && this.formData.maxDiscountCap ? Number(this.formData.maxDiscountCap) : null,
      minOrderValue: Number(this.formData.minOrderValue) || 0,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      usageLimit: Number(this.formData.usageLimit),
      perCustomerLimit: Number(this.formData.perCustomerLimit) || 1,
      isStackableWithFlashSale: this.formData.isStackableWithFlashSale,
      isActive: calculatedStatus === 'Đang hoạt động'
    };

    if (this.isEditing && this.editingId) {
      const idx = this.records.findIndex(r => r.id === this.editingId);
      if (idx !== -1) {
        const existing = this.records[idx];
        this.records[idx] = {
          ...existing,
          code,
          discountType: this.formData.discountType,
          discountValue: Number(this.formData.discountValue),
          maxDiscountCap: this.formData.discountType === 'PERCENT' && this.formData.maxDiscountCap ? Number(this.formData.maxDiscountCap) : undefined,
          minOrderValue: Number(this.formData.minOrderValue) || 0,
          scope: this.formData.scope,
          categoryScopeName: this.formData.scope === 'CATEGORY' ? this.formData.categoryScopeName : undefined,
          usageLimit: Number(this.formData.usageLimit),
          perCustomerLimit: Number(this.formData.perCustomerLimit) || 1,
          isStackableWithFlashSale: this.formData.isStackableWithFlashSale,
          startDate: this.formData.startDate,
          endDate: this.formData.endDate,
          status: calculatedStatus
        };
        this.saveToStorage();

        // Gửi API cập nhật vào CSDL PostgreSQL thật
        fetch(`${environment.apiUrl}/vouchers/${this.editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload)
        })
          .then(res => res.json())
          .then(() => {
            this.loadFromApi();
            this.showToast(`Đã cập nhật mã ${code} vào PostgreSQL thành công!`, 'success');
          })
          .catch(() => {
            this.showToast(`Đã cập nhật mã ${code} thành công!`, 'success');
          });
      }
    } else {
      // Check duplicate code
      if (this.records.some(r => r.code.toUpperCase() === code)) {
        this.showToast(`Mã voucher "${code}" đã tồn tại trên hệ thống!`, 'warning');
        return;
      }

      const tempId = `VOUCHER-${Date.now().toString().slice(-4)}`;
      const newVoucher: VoucherItem = {
        id: tempId,
        code,
        discountType: this.formData.discountType,
        discountValue: Number(this.formData.discountValue),
        maxDiscountCap: this.formData.discountType === 'PERCENT' && this.formData.maxDiscountCap ? Number(this.formData.maxDiscountCap) : undefined,
        minOrderValue: Number(this.formData.minOrderValue) || 0,
        scope: this.formData.scope,
        categoryScopeName: this.formData.scope === 'CATEGORY' ? this.formData.categoryScopeName : undefined,
        usageLimit: Number(this.formData.usageLimit),
        usedCount: 0,
        perCustomerLimit: Number(this.formData.perCustomerLimit) || 1,
        isStackableWithFlashSale: this.formData.isStackableWithFlashSale,
        startDate: this.formData.startDate,
        endDate: this.formData.endDate,
        status: calculatedStatus,
        revenueGenerated: 0
      };

      this.records.unshift(newVoucher);
      this.saveToStorage();

      // Gửi API tạo mới vào CSDL PostgreSQL thật
      fetch(`${environment.apiUrl}/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      })
        .then(res => res.json())
        .then(created => {
          if (created && created.id) {
            newVoucher.id = created.id;
            this.saveToStorage();
          }
          this.loadFromApi();
          this.showToast(`Đã lưu voucher ${code} vào cơ sở dữ liệu thật!`, 'success');
        })
        .catch(() => {
          this.showToast(`Đã tạo mới mã voucher ${code}!`, 'success');
        });
    }

    this.closeModal();
  }

  toggleStatus(item: VoucherItem): void {
    let nextActive = true;
    if (item.status === 'Đang hoạt động') {
      item.status = 'Tạm dừng';
      nextActive = false;
      this.showToast(`Đã tạm dừng mã ${item.code}`, 'warning');
    } else if (item.status === 'Tạm dừng') {
      const nowStr = new Date().toISOString().split('T')[0];
      if (item.endDate < nowStr) {
        this.showToast(`Mã ${item.code} đã quá hạn, vui lòng chỉnh sửa hạn áp dụng trước!`, 'warning');
        return;
      }
      item.status = 'Đang hoạt động';
      nextActive = true;
      this.showToast(`Đã kích hoạt lại mã ${item.code}`, 'success');
    } else if (item.status === 'Sắp diễn ra') {
      item.status = 'Đang hoạt động';
      nextActive = true;
      this.showToast(`Đã kích hoạt sớm mã ${item.code}`, 'success');
    } else {
      this.showToast(`Voucher đã kết thúc hoặc hết lượt, vui lòng chỉnh sửa thời hạn/lượt dùng!`, 'info');
      return;
    }
    this.saveToStorage();

    // Đồng bộ trạng thái vào DB
    fetch(`${environment.apiUrl}/vouchers/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextActive })
    }).catch(err => console.warn('Lỗi đồng bộ trạng thái voucher:', err));
  }

  promptDelete(item: VoucherItem): void {
    this.voucherToDelete = item;
  }

  cancelDelete(): void {
    this.voucherToDelete = null;
  }

  confirmDelete(): void {
    if (!this.voucherToDelete) return;
    const code = this.voucherToDelete.code;
    const delId = this.voucherToDelete.id;
    this.records = this.records.filter(r => r.id !== delId);
    this.saveToStorage();
    this.voucherToDelete = null;
    this.showToast(`Đã xóa voucher ${code} khỏi hệ thống`, 'success');

    // Đồng bộ xóa trong DB PostgreSQL
    fetch(`${environment.apiUrl}/vouchers/${delId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Lỗi xóa voucher trên server:', err));
  }

  copyCode(code: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        this.showToast(`Đã sao chép mã ${code} vào clipboard!`, 'info');
      }).catch(() => {
        this.fallbackCopy(code);
      });
    } else {
      this.fallbackCopy(code);
    }
  }

  private fallbackCopy(text: string): void {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.showToast(`Đã sao chép mã ${text}!`, 'info');
  }

  showToast(msg: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  closeToast(): void {
    this.toastMessage = null;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  getUsagePercent(used: number, limit: number): number {
    if (!limit || limit <= 0) return 0;
    const pct = Math.round((used / limit) * 100);
    return Math.min(100, Math.max(0, pct));
  }
}
