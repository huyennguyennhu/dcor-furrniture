import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { environment } from '../../../../../../environments/environment';

export type VoucherStatus = 'Active' | 'Upcoming' | 'Ended' | 'Paused' | 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng';

export interface VoucherItem {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountCap?: number;
  minOrderValue: number;
  scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName?: string;
  productIds?: string[];
  productNames?: string[];
  usageLimit: number;
  usedCount: number;
  perCustomerLimit: number;
  isStackableWithFlashSale?: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: VoucherStatus;
  revenueGenerated: number;
}

export interface VoucherProductOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  categoryName: string;
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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Active',
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
    status: 'Ended',
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
    status: 'Upcoming',
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
    status: 'Paused',
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
  todayStr: string = new Date().toISOString().split('T')[0];
  isLoading = false;

  // Filters
  searchTerm = '';
  selectedStatus: string = 'ALL';
  selectedDiscountType: string = 'ALL';
  selectedScope: string = 'ALL';

  // Custom Dropdown Open States
  isStatusDropdownOpen = false;
  isDiscountTypeDropdownOpen = false;
  isScopeDropdownOpen = false;
  isModalScopeDropdownOpen = false;
  isModalCategoryDropdownOpen = false;

  get selectedStatusLabel(): string {
    const map: Record<string, string> = {
      'ALL': 'Tất cả trạng thái',
      'Active': 'Active',
      'Upcoming': 'Upcoming',
      'Paused': 'Paused',
      'Ended': 'Ended'
    };
    return map[this.selectedStatus] || 'Tất cả trạng thái';
  }

  get selectedDiscountTypeLabel(): string {
    const map: Record<string, string> = {
      'ALL': 'Tất cả loại giảm',
      'PERCENT': 'Giảm theo % (Phần trăm)',
      'FIXED_AMOUNT': 'Giảm số tiền cố định (₫)'
    };
    return map[this.selectedDiscountType] || 'Tất cả loại giảm';
  }

  get selectedScopeLabel(): string {
    const map: Record<string, string> = {
      'ALL': 'Tất cả phạm vi',
      'CATEGORY': 'Theo danh mục',
      'SPECIFIC_PRODUCTS': 'Theo sản phẩm cụ thể'
    };
    return map[this.selectedScope] || 'Tất cả phạm vi';
  }

  get modalScopeLabel(): string {
    if (this.formData.scope === 'CATEGORY') return 'Theo danh mục sản phẩm cụ thể';
    if (this.formData.scope === 'SPECIFIC_PRODUCTS') return 'Theo sản phẩm cụ thể';
    return 'Toàn bộ sản phẩm trên hệ thống';
  }

  get modalCategoryLabel(): string {
    return this.formData.categoryScopeName || 'Chọn danh mục áp dụng';
  }

  closeAllDropdowns() {
    this.isStatusDropdownOpen = false;
    this.isDiscountTypeDropdownOpen = false;
    this.isScopeDropdownOpen = false;
    this.isModalScopeDropdownOpen = false;
    this.isModalCategoryDropdownOpen = false;
  }

  toggleStatusDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isStatusDropdownOpen;
    this.closeAllDropdowns();
    this.isStatusDropdownOpen = !curr;
  }

  selectStatusFilter(status: string) {
    this.selectedStatus = status;
    this.isStatusDropdownOpen = false;
  }

  toggleDiscountTypeDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isDiscountTypeDropdownOpen;
    this.closeAllDropdowns();
    this.isDiscountTypeDropdownOpen = !curr;
  }

  selectDiscountTypeFilter(type: string) {
    this.selectedDiscountType = type;
    this.isDiscountTypeDropdownOpen = false;
  }

  toggleScopeDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isScopeDropdownOpen;
    this.closeAllDropdowns();
    this.isScopeDropdownOpen = !curr;
  }

  selectScopeFilter(scope: string) {
    this.selectedScope = scope;
    this.isScopeDropdownOpen = false;
  }

  toggleModalScopeDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isModalScopeDropdownOpen;
    this.closeAllDropdowns();
    this.isModalScopeDropdownOpen = !curr;
  }

  selectModalScope(scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS') {
    this.formData.scope = scope;
    if (scope === 'CATEGORY' && !this.formData.categoryScopeName && this.CATEGORIES.length > 0) {
      this.formData.categoryScopeName = this.CATEGORIES[0];
    }
    if (scope === 'SPECIFIC_PRODUCTS' && this.availableProducts.length === 0) {
      this.loadProductsForPicker();
    }
    this.isModalScopeDropdownOpen = false;
  }

  toggleModalCategoryDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isModalCategoryDropdownOpen;
    this.closeAllDropdowns();
    this.isModalCategoryDropdownOpen = !curr;
  }

  selectModalCategory(cat: string) {
    this.formData.categoryScopeName = cat;
    this.isModalCategoryDropdownOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllDropdowns();
  }

  onModalCardClick(e: Event) {
    // Đóng dropdown bên trong modal nếu click vào vùng khác của modal card
    this.isModalScopeDropdownOpen = false;
    this.isModalCategoryDropdownOpen = false;
  }

  // Danh mục chính (cấp 1) tải trực tiếp từ PostgreSQL (Sofas, Chairs, Tables, Beds, ...)
  CATEGORIES: string[] = [];

  // Danh sách sản phẩm thật từ PostgreSQL cho phạm vi SPECIFIC_PRODUCTS
  availableProducts: VoucherProductOption[] = [];
  isLoadingProducts = false;
  productSearchTerm = '';

  // Modal State
  isModalOpen = false;
  isEditing = false;
  editingId: string | null = null;

  // Form Data
  formData: {
    code: string;
    discountType: 'PERCENT' | 'FIXED_AMOUNT';
    discountValue: number | null;
    maxDiscountCap: number | null;
    minOrderValue: number | null;
    scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
    categoryScopeName: string;
    productIds: string[];
    productNames: string[];
    usageLimit: number | null;
    perCustomerLimit: number | null;
    isStackableWithFlashSale?: boolean;
    startDate: string;
    endDate: string;
    status: VoucherStatus;
  } = this.getEmptyForm();

  // Delete Confirmation Modal
  voucherToDelete: VoucherItem | null = null;

  // Toast alert
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadMainCategories();
    this.loadProductsForPicker();
    this.loadFromApi();
  }

  loadProductsForPicker(): void {
    if (this.isLoadingProducts) return;
    this.isLoadingProducts = true;

    const mapProducts = (rawList: any[]): VoucherProductOption[] => {
      return (rawList || [])
        .filter((p: any) => p && p.id && p.name && p.deletedAt == null)
        .map((p: any) => {
          const firstVar = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0] : null;
          let img = '/assets/img/furniture-placeholder.svg';
          if (Array.isArray(p.images) && p.images.length > 0) {
            img = typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.url || img);
          } else if (typeof p.imageUrl === 'string' && p.imageUrl) {
            img = p.imageUrl;
          }
          return {
            id: String(p.id),
            name: String(p.name),
            sku: String(firstVar?.sku || p.sku || ''),
            price: Number(firstVar?.price ?? p.basePrice ?? p.price ?? 0),
            image: img,
            categoryName: String(p.category?.parent?.name || p.category?.name || p.categoryName || '')
          };
        });
    };

    fetch(`${environment.apiUrl}/admin/products?limit=300`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.products || data?.items || data?.data || []);
        const mapped = mapProducts(list);
        if (mapped.length > 0) {
          this.availableProducts = mapped;
          return;
        }
        return fetch(`${environment.apiUrl}/products?limit=300`)
          .then(r => (r.ok ? r.json() : []))
          .then((fallbackData: any) => {
            const fbList = Array.isArray(fallbackData) ? fallbackData : (fallbackData?.products || fallbackData?.items || []);
            this.availableProducts = mapProducts(fbList);
          });
      })
      .catch(() => {
        fetch(`${environment.apiUrl}/products?limit=300`)
          .then(r => (r.ok ? r.json() : []))
          .then((fallbackData: any) => {
            const fbList = Array.isArray(fallbackData) ? fallbackData : (fallbackData?.products || fallbackData?.items || []);
            this.availableProducts = mapProducts(fbList);
          })
          .catch(() => {});
      })
      .finally(() => {
        this.isLoadingProducts = false;
      });
  }

  get filteredPickerProducts(): VoucherProductOption[] {
    const q = (this.productSearchTerm || '').trim().toLowerCase();
    if (!q) return this.availableProducts.slice(0, 60);
    return this.availableProducts
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }

  isProductSelected(id: string): boolean {
    return this.formData.productIds.includes(id);
  }

  toggleProductSelection(p: VoucherProductOption): void {
    const idx = this.formData.productIds.indexOf(p.id);
    if (idx >= 0) {
      this.formData.productIds = this.formData.productIds.filter(id => id !== p.id);
      this.formData.productNames = this.formData.productIds.map(id => {
        const found = this.availableProducts.find(x => x.id === id);
        return found ? found.name : id;
      });
    } else {
      this.formData.productIds = [...this.formData.productIds, p.id];
      this.formData.productNames = [...this.formData.productNames, p.name];
    }
  }

  removeSelectedProduct(id: string): void {
    const idx = this.formData.productIds.indexOf(id);
    if (idx >= 0) {
      this.formData.productIds = this.formData.productIds.filter((_, i) => i !== idx);
      this.formData.productNames = this.formData.productNames.filter((_, i) => i !== idx);
    }
  }

  getSelectedProductsDisplay(): { id: string; name: string }[] {
    return this.formData.productIds.map((id, idx) => {
      const found = this.availableProducts.find(p => p.id === id);
      return { id, name: found?.name || this.formData.productNames[idx] || id };
    });
  }

  getProductScopeTooltip(record: VoucherItem): string {
    if (record.productNames && record.productNames.length > 0) {
      return record.productNames.join(', ');
    }
    return `${record.productIds?.length || 0} sản phẩm áp dụng`;
  }

  loadMainCategories(): void {
    fetch(`${environment.apiUrl}/admin/categories`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: any) => {
        const tree: any[] = Array.isArray(data?.tree)
          ? data.tree
          : Array.isArray(data)
            ? data.filter((c: any) => !c.parentId)
            : [];
        const names = tree
          .filter((c: any) => c && c.name && c.isActive !== false)
          .map((c: any) => String(c.name).trim())
          .filter(Boolean);
        if (names.length > 0) {
          this.CATEGORIES = Array.from(new Set(names));
          if (!this.formData.categoryScopeName) {
            this.formData.categoryScopeName = this.CATEGORIES[0];
          }
          return;
        }
        return this.loadMainCategoriesFallback();
      })
      .catch(() => {
        this.loadMainCategoriesFallback();
      });
  }

  private loadMainCategoriesFallback(): void {
    fetch(`${environment.apiUrl}/categories`)
      .then(res => (res.ok ? res.json() : []))
      .then((cats: any[]) => {
        if (!Array.isArray(cats)) return;
        const names = cats
          .filter((c: any) => c && !c.parentId && c.name && c.isActive !== false)
          .map((c: any) => String(c.name).trim())
          .filter(Boolean);
        if (names.length > 0) {
          this.CATEGORIES = Array.from(new Set(names));
          if (!this.formData.categoryScopeName) {
            this.formData.categoryScopeName = this.CATEGORIES[0];
          }
        }
      })
      .catch(() => {});
  }

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  loadFromApi(): void {
    this.isLoading = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch(`${environment.apiUrl}/admin/vouchers`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('API status: ' + res.status);
        return res.json();
      })
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const nowStr = new Date().toISOString().split('T')[0];
          this.records = data.map(v => {
            const start = v.startDate ? String(v.startDate).split('T')[0] : '2026-01-01';
            const end = v.endDate ? String(v.endDate).split('T')[0] : '2026-12-31';
            let status: 'Active' | 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng' = 'Active';
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
              scope: v.scope === 'SPECIFIC_PRODUCTS' ? 'SPECIFIC_PRODUCTS' : (v.scope === 'CATEGORY' ? 'CATEGORY' : 'ALL'),
              categoryScopeName: v.scope === 'CATEGORY' ? (v.categoryScopeName || undefined) : undefined,
              productIds: v.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(v.productIds) ? v.productIds : [],
              productNames: v.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(v.productNames) ? v.productNames : [],
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
        clearTimeout(timeoutId);
        console.warn('API /admin/vouchers unavailable/timeout, using cached records:', err);
        this.loadFromStorage();
      })
      .finally(() => {
        this.isLoading = false;
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
    return {
      code: '',
      discountType: 'PERCENT' as 'PERCENT' | 'FIXED_AMOUNT',
      discountValue: null as any,
      maxDiscountCap: null as number | null,
      minOrderValue: null as any,
      scope: 'ALL' as 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS',
      categoryScopeName: this.CATEGORIES?.[0] || '',
      productIds: [] as string[],
      productNames: [] as string[],
      usageLimit: null as any,
      perCustomerLimit: null as any,
      isStackableWithFlashSale: false,
      startDate: '',
      endDate: '',
      status: 'Active' as 'Active' | 'Đang hoạt động' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Tạm dừng'
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
      const normalizedStatus = this.getStatusBadgeLabel(item.status);
      const matchStatus =
        this.selectedStatus === 'ALL' ||
        normalizedStatus === this.selectedStatus ||
        item.status === this.selectedStatus;

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
    return this.records.filter(r => r.status === 'Active' || r.status === 'Đang hoạt động').length;
  }

  get monthlyUsageCount(): number {
    return this.records.reduce((sum, r) => sum + (r.usedCount || 0), 0);
  }

  get totalRevenueGenerated(): number {
    return this.records.reduce((sum, r) => sum + (r.revenueGenerated || 0), 0);
  }

  // Actions
  openCreateModal(): void {
    if (this.CATEGORIES.length === 0) {
      this.loadMainCategories();
    }
    if (this.availableProducts.length === 0) {
      this.loadProductsForPicker();
    }
    this.productSearchTerm = '';
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(item: VoucherItem): void {
    if (this.CATEGORIES.length === 0) {
      this.loadMainCategories();
    }
    if (this.availableProducts.length === 0) {
      this.loadProductsForPicker();
    }
    this.productSearchTerm = '';
    this.isEditing = true;
    this.editingId = item.id;
    this.formData = {
      code: item.code,
      discountType: item.discountType,
      discountValue: item.discountValue,
      maxDiscountCap: item.maxDiscountCap !== undefined ? item.maxDiscountCap : null,
      minOrderValue: item.minOrderValue,
      scope: item.scope,
      categoryScopeName: item.categoryScopeName || this.CATEGORIES[0] || '',
      productIds: Array.isArray(item.productIds) ? [...item.productIds] : [],
      productNames: Array.isArray(item.productNames) ? [...item.productNames] : [],
      usageLimit: item.usageLimit,
      perCustomerLimit: item.perCustomerLimit || 1,
      isStackableWithFlashSale: !!item.isStackableWithFlashSale,
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
      this.formData.code = input.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 50);
    }
  }

  onDiscountValueInput(event: Event): void {
    const val = Number(this.formData.discountValue);
    if (this.formData.discountType === 'PERCENT') {
      if (val > 100) this.formData.discountValue = 100;
      else if (val < 0) this.formData.discountValue = 0;
    } else {
      if (val > 100000000) this.formData.discountValue = 100000000;
      else if (val < 0) this.formData.discountValue = 0;
    }
  }

  onMaxDiscountCapInput(event: Event): void {
    if (this.formData.maxDiscountCap !== null && this.formData.maxDiscountCap !== undefined) {
      const val = Number(this.formData.maxDiscountCap);
      if (val > 100000000) this.formData.maxDiscountCap = 100000000;
      else if (val < 0) this.formData.maxDiscountCap = 0;
    }
  }

  onMinOrderValueInput(event: Event): void {
    const val = Number(this.formData.minOrderValue);
    if (val > 500000000) this.formData.minOrderValue = 500000000;
    else if (val < 0) this.formData.minOrderValue = 0;
  }

  onUsageLimitInput(event: Event): void {
    const val = Number(this.formData.usageLimit);
    if (val > 1000000) this.formData.usageLimit = 1000000;
    else if (val < 1) this.formData.usageLimit = 1;
  }

  onPerCustomerLimitInput(event: Event): void {
    const val = Number(this.formData.perCustomerLimit);
    if (val > 100) this.formData.perCustomerLimit = 100;
    else if (val < 1) this.formData.perCustomerLimit = 1;
  }

  onStartDateChange(): void {
    if (this.formData.startDate && this.formData.startDate < this.todayStr) {
      this.formData.startDate = this.todayStr;
      this.showToast('Không thể chọn ngày bắt đầu trong quá khứ!', 'warning');
    }
    if (this.formData.endDate && this.formData.endDate < this.formData.startDate) {
      this.formData.endDate = this.formData.startDate;
    }
  }

  onEndDateChange(): void {
    if (this.formData.endDate && this.formData.endDate < this.formData.startDate) {
      this.formData.endDate = this.formData.startDate;
      this.showToast('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!', 'warning');
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

    const discountVal = Number(this.formData.discountValue);
    if (!this.formData.discountValue || isNaN(discountVal) || discountVal <= 0) {
      this.showToast('Mức giảm giá phải lớn hơn 0!', 'warning');
      return;
    }

    if (this.formData.discountType === 'PERCENT' && discountVal > 100) {
      this.showToast('Mức giảm phần trăm không được vượt quá 100%!', 'warning');
      return;
    }

    const usageLim = Number(this.formData.usageLimit);
    if (!this.formData.usageLimit || isNaN(usageLim) || usageLim <= 0) {
      this.showToast('Tổng lượt sử dụng phải lớn hơn 0!', 'warning');
      return;
    }

    if (!this.formData.startDate || !this.formData.endDate) {
      this.showToast('Vui lòng chọn thời hạn áp dụng!', 'warning');
      return;
    }

    if (!this.isEditing && this.formData.startDate < this.todayStr) {
      this.showToast('Ngày bắt đầu không được ở trong quá khứ!', 'warning');
      return;
    }

    if (this.formData.startDate > this.formData.endDate) {
      this.showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'warning');
      return;
    }

    if (this.formData.scope === 'CATEGORY' && !this.formData.categoryScopeName) {
      this.showToast('Vui lòng chọn danh mục áp dụng!', 'warning');
      return;
    }

    if (this.formData.scope === 'SPECIFIC_PRODUCTS' && (!this.formData.productIds || this.formData.productIds.length === 0)) {
      this.showToast('Vui lòng chọn ít nhất 1 sản phẩm áp dụng!', 'warning');
      return;
    }

    // Auto determine status based on dates if active
    let calculatedStatus: VoucherStatus = this.formData.status;
    const nowStr = new Date().toISOString().split('T')[0];
    const isPaused = calculatedStatus === 'Tạm dừng' || calculatedStatus === 'Paused';
    if (!isPaused) {
      if (this.formData.startDate > nowStr) {
        calculatedStatus = 'Sắp diễn ra';
      } else if (this.formData.endDate < nowStr) {
        calculatedStatus = 'Đã kết thúc';
      } else {
        calculatedStatus = 'Active';
      }
    }

    const apiPayload = {
      code,
      discountType: this.formData.discountType,
      discountValue: discountVal,
      maxDiscountCap: this.formData.discountType === 'PERCENT' && this.formData.maxDiscountCap ? Number(this.formData.maxDiscountCap) : null,
      minOrderValue: Number(this.formData.minOrderValue) || 0,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      usageLimit: usageLim,
      perCustomerLimit: Number(this.formData.perCustomerLimit) || 1,
      isStackableWithFlashSale: !!this.formData.isStackableWithFlashSale,
      isActive: !isPaused,
      scope: this.formData.scope,
      categoryScopeName: this.formData.scope === 'CATEGORY' ? (this.formData.categoryScopeName || null) : null,
      productIds: this.formData.scope === 'SPECIFIC_PRODUCTS' ? this.formData.productIds : [],
      productNames: this.formData.scope === 'SPECIFIC_PRODUCTS'
        ? this.getSelectedProductsDisplay().map(p => p.name)
        : []
    };

    if (this.isEditing && this.editingId) {
      const targetId = this.editingId;
      fetch(`${environment.apiUrl}/admin/vouchers/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(apiPayload)
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.message || `Lỗi cập nhật voucher (HTTP ${res.status})`);
          }
          return data;
        })
        .then(() => {
          this.closeModal();
          this.loadFromApi();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dcor_vouchers_updated'));
          }
          this.showToast(`Đã cập nhật mã ${code} và đồng bộ lên cửa hàng!`, 'success');
        })
        .catch(err => {
          console.error('Lỗi cập nhật voucher:', err);
          this.showToast(err?.message || 'Không thể cập nhật voucher lên máy chủ.', 'warning');
        });
    } else {
      // Check duplicate code
      if (this.records.some(r => r.code.toUpperCase() === code)) {
        this.showToast(`Mã voucher "${code}" đã tồn tại trên hệ thống!`, 'warning');
        return;
      }

      fetch(`${environment.apiUrl}/admin/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(apiPayload)
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.message || `Lỗi tạo voucher (HTTP ${res.status})`);
          }
          return data;
        })
        .then(() => {
          this.closeModal();
          this.loadFromApi();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dcor_vouchers_updated'));
          }
          this.showToast(`Đã tạo mã voucher ${code} và đồng bộ lên cửa hàng!`, 'success');
        })
        .catch(err => {
          console.error('Lỗi tạo voucher:', err);
          this.showToast(err?.message || 'Không thể tạo voucher trên máy chủ.', 'warning');
        });
    }
  }

  getStatusBadgeLabel(status: string): string {
    switch (status) {
      case 'Ongoing':
      case 'Active':
      case 'Đang hoạt động':
      case 'Đang diễn ra':
        return 'Active';
      case 'Upcoming':
      case 'Sắp diễn ra':
        return 'Upcoming';
      case 'Ended':
      case 'Đã kết thúc':
        return 'Ended';
      case 'Paused':
      case 'Tạm dừng':
        return 'Paused';
      default:
        return status;
    }
  }

  isStatus(item: VoucherItem, target: 'Active' | 'Upcoming' | 'Ended' | 'Paused'): boolean {
    return this.getStatusBadgeLabel(item.status) === target;
  }

  toggleStatus(item: VoucherItem): void {
    const prevStatus = item.status;
    let nextActive = true;
    if (this.isStatus(item, 'Active')) {
      item.status = 'Paused';
      nextActive = false;
    } else if (this.isStatus(item, 'Paused')) {
      const nowStr = new Date().toISOString().split('T')[0];
      if (item.endDate < nowStr) {
        this.showToast(`Mã ${item.code} đã quá hạn, vui lòng chỉnh sửa hạn áp dụng trước!`, 'warning');
        return;
      }
      item.status = 'Active';
      nextActive = true;
    } else if (this.isStatus(item, 'Upcoming')) {
      item.status = 'Active';
      nextActive = true;
    } else {
      this.showToast(`Voucher đã kết thúc hoặc hết lượt, vui lòng chỉnh sửa thời hạn/lượt dùng!`, 'info');
      return;
    }

    // Đồng bộ trạng thái vào DB với đầy đủ Authorization
    fetch(`${environment.apiUrl}/admin/vouchers/${item.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ isActive: nextActive })
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Lỗi cập nhật trạng thái (HTTP ${res.status})`);
        }
        return data;
      })
      .then(() => {
        this.saveToStorage();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dcor_vouchers_updated'));
        }
        this.showToast(`Đã ${nextActive ? 'kích hoạt' : 'tạm dừng'} mã ${item.code} trên toàn hệ thống!`, 'success');
      })
      .catch(err => {
        item.status = prevStatus;
        console.error('Lỗi đồng bộ trạng thái voucher:', err);
        this.showToast(err?.message || 'Không thể cập nhật trạng thái voucher.', 'warning');
      });
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
    this.voucherToDelete = null;

    // Đồng bộ xóa trong DB PostgreSQL với đầy đủ Authorization
    fetch(`${environment.apiUrl}/admin/vouchers/${delId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders()
      }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Lỗi xóa voucher (HTTP ${res.status})`);
        }
        return data;
      })
      .then(() => {
        this.records = this.records.filter(r => r.id !== delId);
        this.saveToStorage();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dcor_vouchers_updated'));
        }
        this.showToast(`Đã xóa voucher ${code} khỏi hệ thống!`, 'success');
      })
      .catch(err => {
        console.error('Lỗi xóa voucher trên server:', err);
        this.showToast(err?.message || 'Không thể xóa voucher trên máy chủ.', 'warning');
      });
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
