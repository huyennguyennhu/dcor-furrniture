import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon';

export interface CampaignProductItem {
  productId: string;
  productName: string;
  variantName: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  saleQuota: number;
  soldCount: number;
}

export interface CampaignItem {
  id: string;
  name: string;
  type: 'FLASH_SALE' | 'COMBO' | 'SHOWROOM_SPECIAL';
  channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
  showroomTarget?: string;
  timeSlot: string; // e.g. '12:00 - 14:00', '20:00 - 22:00', 'Cả ngày'
  startDateTime: string; // YYYY-MM-DD
  endDateTime: string;   // YYYY-MM-DD
  status: 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc';
  productsCount: number;
  itemsSold: number;
  totalRevenue: number;
  items: CampaignProductItem[];
}

const STORAGE_KEY = 'dcor_admin_campaigns_data_v1';

const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'CAMP-001',
    name: 'Flash Sale Khung Giờ Vàng Trưa (12h - 14h)',
    type: 'FLASH_SALE',
    channel: 'ONLINE',
    timeSlot: '12:00 - 14:00',
    startDateTime: '2026-10-21',
    endDateTime: '2026-10-25',
    status: 'Đang diễn ra',
    productsCount: 3,
    itemsSold: 51,
    totalRevenue: 414340000,
    items: [
      {
        productId: 'P-SOFA-01',
        productName: 'Sofa Góc Chữ L DCor Nordic',
        variantName: 'Vải Nỉ Be Xám Cao Cấp',
        originalPrice: 18500000,
        salePrice: 14800000,
        discountPercent: 20,
        saleQuota: 20,
        soldCount: 14
      },
      {
        productId: 'P-TABLE-02',
        productName: 'Bàn Trà Mặt Đá Ceramic DCor Elegance',
        variantName: 'Mặt Đá Trắng Vân Mây Khung Vàng',
        originalPrice: 6200000,
        salePrice: 4650000,
        discountPercent: 25,
        saleQuota: 30,
        soldCount: 26
      },
      {
        productId: 'P-CHAIR-03',
        productName: 'Ghế Thư Giãn DCor Lounge Leather',
        variantName: 'Da Bò Ý Nhập Khẩu Màu Nâu Cigar',
        originalPrice: 9800000,
        salePrice: 7840000,
        discountPercent: 20,
        saleQuota: 15,
        soldCount: 11
      }
    ]
  },
  {
    id: 'CAMP-002',
    name: 'Tuần Lễ Khai Trương Showroom Quận 1',
    type: 'SHOWROOM_SPECIAL',
    channel: 'TẠI SHOWROOM',
    showroomTarget: 'Showroom Q1 TP.HCM (Hai Bà Trưng)',
    timeSlot: 'Cả ngày',
    startDateTime: '2026-10-20',
    endDateTime: '2026-10-27',
    status: 'Đang diễn ra',
    productsCount: 2,
    itemsSold: 30,
    totalRevenue: 617400000,
    items: [
      {
        productId: 'P-DINING-01',
        productName: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế',
        variantName: 'Gỗ Óc Chó Tự Nhiên Bắc Mỹ',
        originalPrice: 28000000,
        salePrice: 22400000,
        discountPercent: 20,
        saleQuota: 25,
        soldCount: 18
      },
      {
        productId: 'P-BED-02',
        productName: 'Giường Ngủ Bọc Nệm DCor King Bed',
        variantName: 'Vải Nhung Xám Khói 1m8 x 2m',
        originalPrice: 21000000,
        salePrice: 17850000,
        discountPercent: 15,
        saleQuota: 20,
        soldCount: 12
      }
    ]
  },
  {
    id: 'CAMP-003',
    name: 'Siêu Sale Khung Giờ Đêm 20h - 22h',
    type: 'FLASH_SALE',
    channel: 'TOÀN HỆ THỐNG',
    timeSlot: '20:00 - 22:00',
    startDateTime: '2026-10-22',
    endDateTime: '2026-10-24',
    status: 'Sắp diễn ra',
    productsCount: 2,
    itemsSold: 0,
    totalRevenue: 0,
    items: [
      {
        productId: 'P-TV-01',
        productName: 'Tủ Kệ Tivi Treo Tường DCor Minimalist',
        variantName: 'Gỗ Sồi Tự Nhiên Màu Hạt Dẻ',
        originalPrice: 7500000,
        salePrice: 5250000,
        discountPercent: 30,
        saleQuota: 35,
        soldCount: 0
      },
      {
        productId: 'P-LAMP-02',
        productName: 'Cụm Đèn Thả Bàn Ăn DCor Glow Brass',
        variantName: 'Kim Loại Mạ Đồng Xước',
        originalPrice: 3800000,
        salePrice: 2660000,
        discountPercent: 30,
        saleQuota: 50,
        soldCount: 0
      }
    ]
  },
  {
    id: 'CAMP-004',
    name: 'Combo Phòng Khách Hiện Đại DCor Living',
    type: 'COMBO',
    channel: 'TOÀN HỆ THỐNG',
    timeSlot: 'Cả ngày',
    startDateTime: '2026-09-15',
    endDateTime: '2026-10-15',
    status: 'Đã kết thúc',
    productsCount: 1,
    itemsSold: 40,
    totalRevenue: 1024000000,
    items: [
      {
        productId: 'P-COMBO-01',
        productName: 'Set Sofa Băng 3 Chỗ + Bàn Trà + Thảm Lông Tuyết',
        variantName: 'Combo Tone Màu Be & Nâu Gỗ',
        originalPrice: 32000000,
        salePrice: 25600000,
        discountPercent: 20,
        saleQuota: 40,
        soldCount: 40
      }
    ]
  }
];

export const PRESET_TIME_SLOTS = [
  '12:00 - 14:00',
  '20:00 - 22:00',
  '09:00 - 11:00',
  '18:00 - 21:00',
  'Cả ngày'
];

export const SHOWROOMS_LIST = [
  'Showroom Q1 TP.HCM (Hai Bà Trưng)',
  'Showroom Cầu Giấy HN (Trần Thái Tông)',
  'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
];

export const SAMPLE_PRODUCTS = [
  { name: 'Sofa Góc Chữ L DCor Nordic', variant: 'Vải Nỉ Be Xám', price: 18500000 },
  { name: 'Bàn Trà Mặt Đá Ceramic DCor Elegance', variant: 'Mặt Đá Trắng Vân Mây', price: 6200000 },
  { name: 'Ghế Thư Giãn DCor Lounge Leather', variant: 'Da Bò Ý Nhập Khẩu', price: 9800000 },
  { name: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', variant: 'Gỗ Óc Chó Tự Nhiên', price: 28000000 },
  { name: 'Giường Ngủ Bọc Nệm DCor King Bed', variant: 'Vải Nhung Xám Khói', price: 21000000 },
  { name: 'Tủ Kệ Tivi Treo Tường DCor Minimalist', variant: 'Gỗ Sồi Tự Nhiên', price: 7500000 },
  { name: 'Cụm Đèn Thả Bàn Ăn DCor Glow Brass', variant: 'Mạ Đồng Xước', price: 3800000 },
  { name: 'Thảm Trải Sàn Lông Tuyết DCor Living', variant: 'Họa Tiết Bắc Âu 2m x 2.8m', price: 4500000 }
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

  // Filters
  searchTerm = '';
  selectedStatus: string = 'ALL';
  selectedChannel: string = 'ALL';
  selectedType: string = 'ALL';

  // Constants
  readonly PRESET_TIME_SLOTS = PRESET_TIME_SLOTS;
  readonly SHOWROOMS_LIST = SHOWROOMS_LIST;
  readonly SAMPLE_PRODUCTS = SAMPLE_PRODUCTS;

  // Modal State: Create / Edit
  isModalOpen = false;
  isEditing = false;
  editingId: string | null = null;

  // View Details Modal State
  selectedCampaignDetail: CampaignItem | null = null;

  // Delete / End Early Confirm State
  campaignToEarlyEnd: CampaignItem | null = null;
  campaignToDelete: CampaignItem | null = null;

  // Form Data
  formData: {
    name: string;
    type: 'FLASH_SALE' | 'COMBO' | 'SHOWROOM_SPECIAL';
    channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
    showroomTarget: string;
    timeSlot: string;
    startDateTime: string;
    endDateTime: string;
    status: 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc';
    items: CampaignProductItem[];
  } = this.getEmptyForm();

  // Toast alert
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadFromStorage();
    this.evaluateAutomaticStatuses();
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
    // Check dates and sold quotas for each campaign
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    this.records.forEach(camp => {
      if (camp.status === 'Đã kết thúc') return;

      const totalQuota = camp.items.reduce((s, it) => s + it.saleQuota, 0);
      const totalSold = camp.items.reduce((s, it) => s + it.soldCount, 0);

      // If all quota sold out
      if (totalQuota > 0 && totalSold >= totalQuota) {
        camp.status = 'Đã kết thúc';
        changed = true;
        return;
      }

      // Date check
      if (camp.endDateTime < today) {
        camp.status = 'Đã kết thúc';
        changed = true;
      } else if (camp.startDateTime > today) {
        camp.status = 'Sắp diễn ra';
      } else {
        camp.status = 'Đang diễn ra';
      }
    });

    if (changed) {
      this.saveToStorage();
    }
  }

  getEmptyForm() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return {
      name: '',
      type: 'FLASH_SALE' as 'FLASH_SALE' | 'COMBO' | 'SHOWROOM_SPECIAL',
      channel: 'TOÀN HỆ THỐNG' as 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM',
      showroomTarget: SHOWROOMS_LIST[0],
      timeSlot: '12:00 - 14:00',
      startDateTime: today,
      endDateTime: nextWeek,
      status: 'Đang diễn ra' as 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc',
      items: [
        {
          productId: `P-${Date.now().toString().slice(-4)}`,
          productName: 'Sofa Góc Chữ L DCor Nordic',
          variantName: 'Vải Nỉ Be Xám',
          originalPrice: 18500000,
          salePrice: 14800000,
          discountPercent: 20,
          saleQuota: 20,
          soldCount: 0
        }
      ]
    };
  }

  // Filtered records
  get filteredRecords(): CampaignItem[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(item => {
      const matchSearch =
        !term ||
        item.name.toLocaleLowerCase().includes(term) ||
        item.timeSlot.toLocaleLowerCase().includes(term) ||
        (item.showroomTarget && item.showroomTarget.toLocaleLowerCase().includes(term));

      const matchStatus = this.selectedStatus === 'ALL' || item.status === this.selectedStatus;
      const matchChannel = this.selectedChannel === 'ALL' || item.channel === this.selectedChannel;
      const matchType = this.selectedType === 'ALL' || item.type === this.selectedType;

      return matchSearch && matchStatus && matchChannel && matchType;
    });
  }

  // Statistics
  get totalCount(): number {
    return this.records.length;
  }

  get activeCount(): number {
    return this.records.filter(r => r.status === 'Đang diễn ra').length;
  }

  get upcomingCount(): number {
    return this.records.filter(r => r.status === 'Sắp diễn ra').length;
  }

  get totalRevenueGenerated(): number {
    return this.records.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  }

  // Modal Handlers
  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(camp: CampaignItem): void {
    this.isEditing = true;
    this.editingId = camp.id;
    this.formData = {
      name: camp.name,
      type: camp.type,
      channel: camp.channel,
      showroomTarget: camp.showroomTarget || SHOWROOMS_LIST[0],
      timeSlot: camp.timeSlot,
      startDateTime: camp.startDateTime,
      endDateTime: camp.endDateTime,
      status: camp.status,
      items: camp.items.map(it => ({ ...it }))
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
  }

  openDetailModal(camp: CampaignItem): void {
    this.selectedCampaignDetail = camp;
  }

  closeDetailModal(): void {
    this.selectedCampaignDetail = null;
  }

  // Dynamic Item List Operations
  addProductRow(): void {
    const sample = SAMPLE_PRODUCTS[this.formData.items.length % SAMPLE_PRODUCTS.length];
    const original = sample.price;
    const sale = Math.round(original * 0.8);
    this.formData.items.push({
      productId: `P-${Date.now().toString().slice(-4)}`,
      productName: sample.name,
      variantName: sample.variant,
      originalPrice: original,
      salePrice: sale,
      discountPercent: 20,
      saleQuota: 20,
      soldCount: 0
    });
  }

  removeProductRow(index: number): void {
    if (this.formData.items.length <= 1) {
      this.showToast('Chiến dịch cần ít nhất 1 sản phẩm tham gia!', 'warning');
      return;
    }
    this.formData.items.splice(index, 1);
  }

  onOriginalOrSaleChange(item: CampaignProductItem, changedField: 'sale' | 'percent'): void {
    if (changedField === 'sale') {
      if (item.originalPrice > 0 && item.salePrice > 0) {
        const pct = Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100);
        item.discountPercent = Math.max(0, Math.min(100, pct));
      }
    } else {
      if (item.originalPrice > 0 && item.discountPercent >= 0) {
        item.salePrice = Math.round(item.originalPrice * (1 - item.discountPercent / 100));
      }
    }
  }

  onSelectPresetProduct(index: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const prodName = select.value;
    const found = SAMPLE_PRODUCTS.find(p => p.name === prodName);
    if (found && this.formData.items[index]) {
      const it = this.formData.items[index];
      it.productName = found.name;
      it.variantName = found.variant;
      it.originalPrice = found.price;
      it.salePrice = Math.round(found.price * (1 - it.discountPercent / 100));
    }
  }

  saveCampaign(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.showToast('Vui lòng nhập tên chiến dịch!', 'warning');
      return;
    }

    if (!this.formData.startDateTime || !this.formData.endDateTime) {
      this.showToast('Vui lòng chọn thời gian bắt đầu và kết thúc!', 'warning');
      return;
    }

    if (new Date(this.formData.startDateTime) > new Date(this.formData.endDateTime)) {
      this.showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'warning');
      return;
    }

    if (!this.formData.items || this.formData.items.length === 0) {
      this.showToast('Vui lòng thêm ít nhất một sản phẩm tham gia!', 'warning');
      return;
    }

    for (const it of this.formData.items) {
      if (!it.productName.trim()) {
        this.showToast('Vui lòng nhập tên cho tất cả sản phẩm!', 'warning');
        return;
      }
      if (it.salePrice <= 0 || it.originalPrice <= 0) {
        this.showToast('Giá gốc và giá Flash Sale phải lớn hơn 0!', 'warning');
        return;
      }
      if (it.saleQuota <= 0) {
        this.showToast('Số lượng ưu đãi (Quota) phải lớn hơn 0!', 'warning');
        return;
      }
    }

    // Auto calculate status
    const today = new Date().toISOString().split('T')[0];
    let calculatedStatus: 'Đang diễn ra' | 'Sắp diễn ra' | 'Đã kết thúc' = 'Đang diễn ra';
    if (this.formData.startDateTime > today) {
      calculatedStatus = 'Sắp diễn ra';
    } else if (this.formData.endDateTime < today) {
      calculatedStatus = 'Đã kết thúc';
    }

    const totalSold = this.formData.items.reduce((s, it) => s + (it.soldCount || 0), 0);
    const totalRev = this.formData.items.reduce((s, it) => s + (it.soldCount || 0) * it.salePrice, 0);

    if (this.isEditing && this.editingId) {
      const idx = this.records.findIndex(r => r.id === this.editingId);
      if (idx !== -1) {
        const existing = this.records[idx];
        this.records[idx] = {
          ...existing,
          name,
          type: this.formData.type,
          channel: this.formData.channel,
          showroomTarget: this.formData.channel === 'TẠI SHOWROOM' ? this.formData.showroomTarget : undefined,
          timeSlot: this.formData.timeSlot,
          startDateTime: this.formData.startDateTime,
          endDateTime: this.formData.endDateTime,
          status: calculatedStatus,
          productsCount: this.formData.items.length,
          itemsSold: totalSold,
          totalRevenue: totalRev,
          items: [...this.formData.items]
        };
        this.saveToStorage();
        this.showToast(`Đã cập nhật chiến dịch "${name}" thành công!`, 'success');
      }
    } else {
      const newCamp: CampaignItem = {
        id: `CAMP-${Date.now().toString().slice(-4)}`,
        name,
        type: this.formData.type,
        channel: this.formData.channel,
        showroomTarget: this.formData.channel === 'TẠI SHOWROOM' ? this.formData.showroomTarget : undefined,
        timeSlot: this.formData.timeSlot,
        startDateTime: this.formData.startDateTime,
        endDateTime: this.formData.endDateTime,
        status: calculatedStatus,
        productsCount: this.formData.items.length,
        itemsSold: 0,
        totalRevenue: 0,
        items: [...this.formData.items]
      };

      this.records.unshift(newCamp);
      this.saveToStorage();
      this.showToast(`Đã tạo chiến dịch "${name}" thành công!`, 'success');
    }

    this.closeModal();
  }

  // Early End action
  promptEarlyEnd(camp: CampaignItem): void {
    this.campaignToEarlyEnd = camp;
  }

  cancelEarlyEnd(): void {
    this.campaignToEarlyEnd = null;
  }

  confirmEarlyEnd(): void {
    if (!this.campaignToEarlyEnd) return;
    const name = this.campaignToEarlyEnd.name;
    this.campaignToEarlyEnd.status = 'Đã kết thúc';
    this.saveToStorage();
    this.campaignToEarlyEnd = null;
    this.showToast(`Đã kết thúc sớm chiến dịch "${name}"!`, 'warning');
  }

  // Delete action
  promptDelete(camp: CampaignItem): void {
    this.campaignToDelete = camp;
  }

  cancelDelete(): void {
    this.campaignToDelete = null;
  }

  confirmDelete(): void {
    if (!this.campaignToDelete) return;
    const name = this.campaignToDelete.name;
    this.records = this.records.filter(c => c.id !== this.campaignToDelete!.id);
    this.saveToStorage();
    this.campaignToDelete = null;
    this.showToast(`Đã xóa chiến dịch "${name}"`, 'success');
  }

  // Helper getters
  getTotalQuota(camp: CampaignItem): number {
    return camp.items.reduce((sum, item) => sum + (item.saleQuota || 0), 0);
  }

  getSoldPercent(sold: number, quota: number): number {
    if (!quota || quota <= 0) return 0;
    const pct = Math.round((sold / quota) * 100);
    return Math.min(100, Math.max(0, pct));
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
}
