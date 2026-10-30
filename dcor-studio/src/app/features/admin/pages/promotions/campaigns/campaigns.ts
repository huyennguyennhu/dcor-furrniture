import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { IconComponent } from '../../../../../shared/components/icon/icon';

export interface CampaignProductItem {
  productId: string;
  productName: string;
  variantName?: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
}

export type CampaignStatus = 'Ongoing' | 'Upcoming' | 'Ended' | 'Paused' | 'Active' | 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc' | 'Đang hoạt động' | 'Tạm dừng';

export interface CampaignItem {
  id: string;
  name: string;               // Tên ngắn gọn chính, ví dụ: "Đại tiệc Mùa Hè"
  description?: string;        // Mô tả chi tiết phụ, ví dụ: "Giảm giá 30% Sofa & Bàn trà"
  channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
  showroomTargets: string[];   // Đa chọn nhiều showroom
  discountType: 'PERCENT' | 'FIXED'; // Giảm % hoặc giảm thẳng số tiền
  discountValue: number;
  startDateTime: string;       // YYYY-MM-DD
  endDateTime: string;         // YYYY-MM-DD
  status: CampaignStatus;
  productsCount: number;
  totalRevenue: number;
  items: CampaignProductItem[];
}

const STORAGE_KEY = 'dcor_admin_campaigns_data_v3';

export const SHOWROOMS_LIST = [
  'Showroom Q1 TP.HCM (Hai Bà Trưng)',
  'Showroom Cầu Giấy HN (Trần Thái Tông)',
  'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
];

export const CATEGORIES_CATALOG: { category: string; products: { name: string; variant: string; price: number }[] }[] = [
  {
    category: 'Sofa & Ghế Phòng Khách',
    products: [
      { name: 'Sofa Góc Chữ L DCor Nordic', variant: 'Vải Nỉ Be Xám Cao Cấp', price: 18500000 },
      { name: 'Bàn Trà Mặt Đá Ceramic DCor Elegance', variant: 'Mặt Đá Trắng Vân Mây Khung Vàng', price: 6200000 },
      { name: 'Ghế Thư Giãn DCor Lounge Leather', variant: 'Da Bò Ý Nhập Khẩu Màu Nâu Cigar', price: 9800000 }
    ]
  },
  {
    category: 'Bàn Ghế Ăn & Bếp',
    products: [
      { name: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', variant: 'Gỗ Óc Chó Tự Nhiên Bắc Mỹ', price: 28000000 },
      { name: 'Cụm Đèn Thả Bàn Ăn DCor Glow Brass', variant: 'Kim Loại Mạ Đồng Xước', price: 3800000 }
    ]
  },
  {
    category: 'Giường & Phòng Ngủ',
    products: [
      { name: 'Giường Ngủ Bọc Nệm DCor King Bed', variant: 'Vải Nhung Xám Khói 1m8 x 2m', price: 21000000 },
      { name: 'Tủ Kệ Tivi Treo Tường DCor Minimalist', variant: 'Gỗ Sồi Tự Nhiên Màu Hạt Dẻ', price: 7500000 }
    ]
  },
  {
    category: 'Đèn & Thảm Decor',
    products: [
      { name: 'Thảm Trải Sàn Lông Tuyết DCor Living', variant: 'Họa Tiết Bắc Âu 2m x 2.8m', price: 4500000 }
    ]
  }
];

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'CAMP-001',
    name: 'Đại Tiệc Mùa Hè',
    description: 'Giảm 30% toàn bộ bộ sưu tập Sofa & Bàn trà',
    channel: 'TOÀN HỆ THỐNG',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 30,
    startDateTime: '2026-10-20',
    endDateTime: '2026-10-31',
    status: 'Ongoing',
    productsCount: 3,
    totalRevenue: 345000000,
    items: [
      {
        productId: 'P-SOFA-01',
        productName: 'Sofa Góc Chữ L DCor Nordic',
        variantName: 'Vải Nỉ Be Xám Cao Cấp',
        originalPrice: 18500000,
        salePrice: 12950000,
        discountPercent: 30
      },
      {
        productId: 'P-TABLE-02',
        productName: 'Bàn Trà Mặt Đá Ceramic DCor Elegance',
        variantName: 'Mặt Đá Trắng Vân Mây Khung Vàng',
        originalPrice: 6200000,
        salePrice: 4340000,
        discountPercent: 30
      },
      {
        productId: 'P-CHAIR-03',
        productName: 'Ghế Thư Giãn DCor Lounge Leather',
        variantName: 'Da Bò Ý Nhập Khẩu Màu Nâu Cigar',
        originalPrice: 9800000,
        salePrice: 6860000,
        discountPercent: 30
      }
    ]
  },
  {
    id: 'CAMP-002',
    name: 'Khai Trương Showroom',
    description: 'Ưu đãi 20% bàn ghế ăn & phòng bếp',
    channel: 'TẠI SHOWROOM',
    showroomTargets: [
      'Showroom Q1 TP.HCM (Hai Bà Trưng)',
      'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
    ],
    discountType: 'PERCENT',
    discountValue: 20,
    startDateTime: '2026-10-18',
    endDateTime: '2026-10-28',
    status: 'Ongoing',
    productsCount: 2,
    totalRevenue: 512000000,
    items: [
      {
        productId: 'P-DINING-01',
        productName: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế',
        variantName: 'Gỗ Óc Chó Tự Nhiên Bắc Mỹ',
        originalPrice: 28000000,
        salePrice: 22400000,
        discountPercent: 20
      },
      {
        productId: 'P-LAMP-02',
        productName: 'Cụm Đèn Thả Bàn Ăn DCor Glow Brass',
        variantName: 'Kim Loại Mạ Đồng Xước',
        originalPrice: 3800000,
        salePrice: 3040000,
        discountPercent: 20
      }
    ]
  },
  {
    id: 'CAMP-003',
    name: 'Tri Ân Khách Hàng Online',
    description: 'Giảm thẳng 3.000.000₫ giường & tủ kệ',
    channel: 'ONLINE',
    showroomTargets: [],
    discountType: 'FIXED',
    discountValue: 3000000,
    startDateTime: '2026-11-01',
    endDateTime: '2026-11-15',
    status: 'Upcoming',
    productsCount: 2,
    totalRevenue: 0,
    items: [
      {
        productId: 'P-BED-02',
        productName: 'Giường Ngủ Bọc Nệm DCor King Bed',
        variantName: 'Vải Nhung Xám Khói 1m8 x 2m',
        originalPrice: 21000000,
        salePrice: 18000000,
        discountPercent: 14
      },
      {
        productId: 'P-TV-01',
        productName: 'Tủ Kệ Tivi Treo Tường DCor Minimalist',
        variantName: 'Gỗ Sồi Tự Nhiên Màu Hạt Dẻ',
        originalPrice: 7500000,
        salePrice: 4500000,
        discountPercent: 40
      }
    ]
  }
];

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './campaigns.html',
  styleUrls: ['./campaigns.css']
})
export class CampaignsComponent implements OnInit {
  records: CampaignItem[] = [];
  todayStr: string = new Date().toISOString().split('T')[0];
  isLoading = false;

  // Filters
  searchTerm = '';
  selectedStatus: string = 'ALL';
  selectedChannel: string = 'ALL';

  // Constants
  readonly SHOWROOMS_LIST = SHOWROOMS_LIST;
  categoriesCatalog: { category: string; products: { name: string; variant: string; price: number }[] }[] = [...CATEGORIES_CATALOG];

  // Modal State: Create / Edit
  isModalOpen = false;
  isEditing = false;
  editingId: string | null = null;

  // View Details Modal State
  selectedCampaignDetail: CampaignItem | null = null;

  // Delete / End Early Confirm State
  campaignToEarlyEnd: CampaignItem | null = null;
  campaignToDelete: CampaignItem | null = null;

  // Category Picker State
  isCategoryPickerOpen = false;

  // Form Data (mặc định để trống)
  formData: {
    name: string;
    description: string;
    channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
    showroomTargets: string[];
    startDateTime: string;
    endDateTime: string;
    bulkDiscountType: 'PERCENT' | 'FIXED';
    bulkDiscountValue: number | null;
    status: CampaignStatus;
    items: CampaignProductItem[];
  } = this.getEmptyForm();

  // Toast alert
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadCatalogFromDatabase();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  loadCampaigns(): void {
    this.isLoading = true;
    // Đồng bộ nhanh từ Storage/API
    setTimeout(() => {
      this.loadFromStorage();
      this.evaluateAutomaticStatuses();
      this.isLoading = false;
    }, 250);
  }

  loadCatalogFromDatabase(): void {
    fetch(`${environment.apiUrl}/admin/products?limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const catMap = new Map<string, { name: string; variant: string; price: number }[]>();
          data.forEach(p => {
            const catName = p.category?.name || 'Khác';
            if (!catMap.has(catName)) {
              catMap.set(catName, []);
            }
            if (Array.isArray(p.variants) && p.variants.length > 0) {
              p.variants.forEach((v: any) => {
                catMap.get(catName)!.push({
                  name: p.name,
                  variant: v.name || 'Tiêu chuẩn',
                  price: Number(v.price) || Number(p.basePrice) || 0
                });
              });
            } else {
              catMap.get(catName)!.push({
                name: p.name,
                variant: 'Tiêu chuẩn',
                price: Number(p.basePrice) || 0
              });
            }
          });
          const newCatalog: { category: string; products: { name: string; variant: string; price: number }[] }[] = [];
          catMap.forEach((prods, category) => {
            newCatalog.push({ category, products: prods });
          });
          if (newCatalog.length > 0) {
            this.categoriesCatalog = newCatalog;
          }
        }
      })
      .catch(err => {
        console.warn('Catalog load error, using default seed:', err);
      });
  }

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      } else {
        this.records = [...DEFAULT_CAMPAIGNS];
        this.saveToStorage();
      }
    } catch {
      this.records = [...DEFAULT_CAMPAIGNS];
    }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  evaluateAutomaticStatuses(): void {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    this.records.forEach(camp => {
      const norm = this.getStatusBadgeLabel(camp.status);
      if (norm === 'Ended' || norm === 'Paused') return;

      if (camp.endDateTime && camp.endDateTime < today) {
        camp.status = 'Ended';
        changed = true;
      } else if (camp.startDateTime && camp.startDateTime > today) {
        camp.status = 'Upcoming';
      } else {
        camp.status = 'Ongoing';
      }
    });

    if (changed) {
      this.saveToStorage();
    }
  }

  getEmptyForm() {
    return {
      name: '',
      description: '',
      channel: 'TOÀN HỆ THỐNG' as 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM',
      showroomTargets: [] as string[],
      startDateTime: '',
      endDateTime: '',
      bulkDiscountType: 'PERCENT' as 'PERCENT' | 'FIXED',
      bulkDiscountValue: null as number | null,
      status: 'Ongoing' as CampaignStatus,
      items: [] as CampaignProductItem[]
    };
  }

  getStatusBadgeLabel(status: string): string {
    switch (status) {
      case 'Ongoing':
      case 'Active':
      case 'Đang diễn ra':
      case 'Đang hoạt động':
        return 'Ongoing';
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

  isStatus(camp: CampaignItem | null | undefined, target: 'Ongoing' | 'Upcoming' | 'Ended' | 'Paused' | 'Active'): boolean {
    if (!camp) return false;
    const norm = this.getStatusBadgeLabel(camp.status);
    if (target === 'Ongoing' || target === 'Active') {
      return norm === 'Ongoing';
    }
    return norm === target;
  }

  // Filtered records
  get filteredRecords(): CampaignItem[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(item => {
      const matchSearch =
        !term ||
        item.name.toLocaleLowerCase().includes(term) ||
        (item.description && item.description.toLocaleLowerCase().includes(term)) ||
        (item.showroomTargets && item.showroomTargets.some(s => s.toLocaleLowerCase().includes(term)));

      const norm = this.getStatusBadgeLabel(item.status);
      const matchStatus =
        this.selectedStatus === 'ALL' ||
        norm === this.selectedStatus ||
        (this.selectedStatus === 'Ongoing' && (norm === 'Ongoing' || item.status === 'Active' || item.status === 'Đang diễn ra')) ||
        item.status === this.selectedStatus;

      const matchChannel = this.selectedChannel === 'ALL' || item.channel === this.selectedChannel;

      return matchSearch && matchStatus && matchChannel;
    });
  }

  // Statistics
  get totalCount(): number {
    return this.records.length;
  }

  get activeCount(): number {
    return this.records.filter(r => this.isStatus(r, 'Ongoing')).length;
  }

  get upcomingCount(): number {
    return this.records.filter(r => this.isStatus(r, 'Upcoming')).length;
  }

  get totalRevenueGenerated(): number {
    return this.records.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  }

  // Showroom Multi-Select Helpers
  isSelectedShowroom(sr: string): boolean {
    return this.formData.showroomTargets.includes(sr);
  }

  toggleShowroom(sr: string): void {
    const idx = this.formData.showroomTargets.indexOf(sr);
    if (idx !== -1) {
      this.formData.showroomTargets.splice(idx, 1);
    } else {
      this.formData.showroomTargets.push(sr);
    }
  }

  // Modal Handlers
  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.isCategoryPickerOpen = false;
    this.isModalOpen = true;
  }

  openEditModal(camp: CampaignItem): void {
    this.isEditing = true;
    this.editingId = camp.id;
    this.formData = {
      name: camp.name,
      description: camp.description || '',
      channel: camp.channel,
      showroomTargets: camp.showroomTargets ? [...camp.showroomTargets] : ((camp as any).showroomTarget ? [(camp as any).showroomTarget] : []),
      startDateTime: camp.startDateTime,
      endDateTime: camp.endDateTime,
      bulkDiscountType: camp.discountType || 'PERCENT',
      bulkDiscountValue: camp.discountValue || null,
      status: camp.status,
      items: camp.items.map(it => ({ ...it }))
    };
    this.isCategoryPickerOpen = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.isCategoryPickerOpen = false;
  }

  openDetailModal(camp: CampaignItem): void {
    this.selectedCampaignDetail = camp;
  }

  closeDetailModal(): void {
    this.selectedCampaignDetail = null;
  }

  // Cấu hình giảm giá hàng loạt (Hỗ trợ cả % và tiền cố định ₫)
  applyBulkDiscountToAll(): void {
    const val = Number(this.formData.bulkDiscountValue);
    if (!this.formData.bulkDiscountValue || isNaN(val) || val <= 0) {
      this.showToast('Vui lòng nhập mức giảm giá hợp lệ!', 'warning');
      return;
    }

    if (this.formData.bulkDiscountType === 'PERCENT' && val > 99) {
      this.showToast('Mức giảm theo % không được vượt quá 99%!', 'warning');
      return;
    }

    if (this.formData.items.length === 0) {
      const typeLabel = this.formData.bulkDiscountType === 'PERCENT' ? `${val}%` : this.formatCurrency(val);
      this.showToast(`Đã thiết lập mức giảm chung ${typeLabel}. Hãy thêm sản phẩm vào danh sách!`, 'info');
      return;
    }

    this.formData.items.forEach(it => {
      if (it.originalPrice && it.originalPrice > 0) {
        if (this.formData.bulkDiscountType === 'PERCENT') {
          it.discountPercent = val;
          it.salePrice = Math.round(it.originalPrice * (1 - val / 100));
        } else {
          it.salePrice = Math.max(0, it.originalPrice - val);
          it.discountPercent = Math.min(99, Math.max(1, Math.round((val / it.originalPrice) * 100)));
        }
      }
    });

    const label = this.formData.bulkDiscountType === 'PERCENT' ? `${val}%` : this.formatCurrency(val);
    this.showToast(`Đã áp dụng giảm ${label} cho toàn bộ ${this.formData.items.length} sản phẩm!`, 'success');
  }

  // 1. Thêm theo từng sản phẩm đơn lẻ
  addProductRow(): void {
    const defaultPct = this.formData.bulkDiscountType === 'PERCENT' && this.formData.bulkDiscountValue
      ? Number(this.formData.bulkDiscountValue)
      : 30;

    this.formData.items.push({
      productId: `P-${Date.now().toString().slice(-4)}`,
      productName: '',
      variantName: '',
      originalPrice: null as any,
      salePrice: null as any,
      discountPercent: defaultPct
    });
  }

  // 2. Thêm nhanh danh sách sản phẩm theo danh mục
  addProductsByCategory(categoryName: string): void {
    const cat = this.categoriesCatalog.find(c => c.category === categoryName);
    if (!cat) return;

    let addedCount = 0;
    const bulkType = this.formData.bulkDiscountType;
    const bulkVal = Number(this.formData.bulkDiscountValue);

    cat.products.forEach(p => {
      // Tránh trùng tên sản phẩm đã có
      if (this.formData.items.some(it => it.productName === p.name)) return;

      let sale = 0;
      let pct = 30;

      if (bulkVal > 0) {
        if (bulkType === 'PERCENT') {
          pct = Math.min(99, bulkVal);
          sale = Math.round(p.price * (1 - pct / 100));
        } else {
          sale = Math.max(0, p.price - bulkVal);
          pct = Math.min(99, Math.max(1, Math.round((bulkVal / p.price) * 100)));
        }
      } else {
        pct = 30;
        sale = Math.round(p.price * 0.7);
      }

      this.formData.items.push({
        productId: `P-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900)}`,
        productName: p.name,
        variantName: p.variant,
        originalPrice: p.price,
        salePrice: sale,
        discountPercent: pct
      });
      addedCount++;
    });

    this.isCategoryPickerOpen = false;
    if (addedCount > 0) {
      this.showToast(`Đã thêm ${addedCount} sản phẩm từ danh mục "${categoryName}"!`, 'success');
    } else {
      this.showToast(`Các sản phẩm thuộc danh mục "${categoryName}" đã có sẵn trong danh sách!`, 'info');
    }
  }

  removeProductRow(index: number): void {
    this.formData.items.splice(index, 1);
  }

  onOriginalOrSaleChange(item: CampaignProductItem, changedField: 'sale' | 'percent'): void {
    if (changedField === 'sale') {
      if (item.originalPrice > 0 && item.salePrice > 0) {
        const pct = Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100);
        item.discountPercent = Math.max(0, Math.min(99, pct));
      }
    } else {
      if (item.originalPrice > 0 && item.discountPercent >= 0) {
        const pct = Math.min(99, Math.max(0, Number(item.discountPercent)));
        item.discountPercent = pct;
        item.salePrice = Math.round(item.originalPrice * (1 - pct / 100));
      }
    }
  }

  onStartDateChange(): void {
    if (this.formData.startDateTime && this.formData.startDateTime < this.todayStr) {
      this.formData.startDateTime = this.todayStr;
      this.showToast('Không thể chọn ngày bắt đầu trong quá khứ!', 'warning');
    }
    if (this.formData.endDateTime && this.formData.endDateTime < this.formData.startDateTime) {
      this.formData.endDateTime = this.formData.startDateTime;
    }
  }

  onEndDateChange(): void {
    if (this.formData.endDateTime && this.formData.endDateTime < this.formData.startDateTime) {
      this.formData.endDateTime = this.formData.startDateTime;
      this.showToast('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!', 'warning');
    }
  }

  saveCampaign(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.showToast('Vui lòng nhập tên chương trình giảm giá!', 'warning');
      return;
    }

    if (!this.formData.startDateTime || !this.formData.endDateTime) {
      this.showToast('Vui lòng chọn ngày bắt đầu và kết thúc!', 'warning');
      return;
    }

    if (this.formData.startDateTime > this.formData.endDateTime) {
      this.showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'warning');
      return;
    }

    if (this.formData.channel === 'TẠI SHOWROOM' && this.formData.showroomTargets.length === 0) {
      this.showToast('Vui lòng chọn ít nhất 1 showroom áp dụng!', 'warning');
      return;
    }

    if (this.formData.items.length === 0) {
      this.showToast('Vui lòng thêm ít nhất 1 sản phẩm vào đợt giảm giá!', 'warning');
      return;
    }

    for (let i = 0; i < this.formData.items.length; i++) {
      const it = this.formData.items[i];
      if (!it.productName.trim()) {
        this.showToast(`Vui lòng nhập tên cho sản phẩm dòng thứ ${i + 1}!`, 'warning');
        return;
      }
      if (!it.originalPrice || it.originalPrice <= 0) {
        this.showToast(`Vui lòng nhập giá gốc cho "${it.productName}"!`, 'warning');
        return;
      }
      if (!it.salePrice || it.salePrice <= 0 || it.salePrice >= it.originalPrice) {
        this.showToast(`Giá giảm của "${it.productName}" phải nhỏ hơn giá gốc!`, 'warning');
        return;
      }
    }

    // Tự động tính toán trạng thái
    const nowStr = new Date().toISOString().split('T')[0];
    let calculatedStatus: CampaignStatus = 'Ongoing';
    if (this.formData.startDateTime > nowStr) {
      calculatedStatus = 'Upcoming';
    } else if (this.formData.endDateTime < nowStr) {
      calculatedStatus = 'Ended';
    }

    const discountVal = Number(this.formData.bulkDiscountValue) || 30;

    if (this.isEditing && this.editingId) {
      const idx = this.records.findIndex(c => c.id === this.editingId);
      if (idx !== -1) {
        this.records[idx] = {
          ...this.records[idx],
          name,
          description: this.formData.description.trim(),
          channel: this.formData.channel,
          showroomTargets: this.formData.channel === 'TẠI SHOWROOM' ? [...this.formData.showroomTargets] : [],
          discountType: this.formData.bulkDiscountType,
          discountValue: discountVal,
          startDateTime: this.formData.startDateTime,
          endDateTime: this.formData.endDateTime,
          status: calculatedStatus,
          productsCount: this.formData.items.length,
          items: this.formData.items.map(it => ({ ...it }))
        };
        this.saveToStorage();
        this.showToast(`Đã cập nhật chương trình "${name}"!`, 'success');
      }
    } else {
      const newCamp: CampaignItem = {
        id: `CAMP-${Date.now().toString().slice(-4)}`,
        name,
        description: this.formData.description.trim(),
        channel: this.formData.channel,
        showroomTargets: this.formData.channel === 'TẠI SHOWROOM' ? [...this.formData.showroomTargets] : [],
        discountType: this.formData.bulkDiscountType,
        discountValue: discountVal,
        startDateTime: this.formData.startDateTime,
        endDateTime: this.formData.endDateTime,
        status: calculatedStatus,
        productsCount: this.formData.items.length,
        totalRevenue: 0,
        items: this.formData.items.map(it => ({ ...it }))
      };
      this.records.unshift(newCamp);
      this.saveToStorage();
      this.showToast(`Đã tạo đợt giảm giá "${name}" thành công!`, 'success');
    }

    this.closeModal();
  }

  // Kết thúc sớm
  promptEarlyEnd(camp: CampaignItem): void {
    this.campaignToEarlyEnd = camp;
  }

  cancelEarlyEnd(): void {
    this.campaignToEarlyEnd = null;
  }

  confirmEarlyEnd(): void {
    if (!this.campaignToEarlyEnd) return;
    const camp = this.campaignToEarlyEnd;
    camp.status = 'Ended';
    if (this.selectedCampaignDetail && this.selectedCampaignDetail.id === camp.id) {
      this.selectedCampaignDetail.status = 'Ended';
    }
    this.saveToStorage();
    this.campaignToEarlyEnd = null;
    this.showToast(`Đã kết thúc sớm chương trình "${camp.name}"`, 'warning');
  }

  // Xóa
  promptDelete(camp: CampaignItem): void {
    this.campaignToDelete = camp;
  }

  cancelDelete(): void {
    this.campaignToDelete = null;
  }

  confirmDelete(): void {
    if (!this.campaignToDelete) return;
    const name = this.campaignToDelete.name;
    this.records = this.records.filter(c => c.id !== this.campaignToDelete?.id);
    this.saveToStorage();
    this.campaignToDelete = null;
    this.showToast(`Đã xóa đợt giảm giá "${name}"`, 'success');
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
    return new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}
