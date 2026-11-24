import { Component, OnInit, HostListener } from '@angular/core';
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
  scope?: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName?: string;
  discountType: 'PERCENT' | 'FIXED'; // Giảm % hoặc giảm thẳng số tiền
  discountValue: number;
  startDateTime: string;       // YYYY-MM-DD
  endDateTime: string;         // YYYY-MM-DD
  status: CampaignStatus;
  productsCount: number;
  totalRevenue: number;
  items: CampaignProductItem[];
}

export interface CampaignProductOption {
  id: string;
  name: string;
  variant: string;
  sku: string;
  price: number;
  categoryId: string;
  categoryName: string;
  mainCategoryName: string;
  image: string;
}

export interface MainCategoryGroup {
  id: string;
  name: string;
  allCategoryIds: string[];
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
      { name: 'Modena sofa with resting unit', variant: 'Vải Nỉ Be Xám Cao Cấp', price: 42900000 },
      { name: 'Indivi sofa with chaise longue left', variant: 'Vải Nỉ Xám Chuẩn Đan Mạch', price: 38900000 },
      { name: 'Bolzano 3-seater', variant: 'Vải Nỉ Sang Trọng', price: 36000000 },
      { name: 'Carmo corner sofa', variant: 'Module Góc Chữ L Hiện Đại', price: 49000000 }
    ]
  },
  {
    category: 'Bàn Trà & Bàn Ăn',
    products: [
      { name: 'Santiago extendable dining table', variant: 'Mặt Gỗ Sồi Dark Oak Tự Nhiên', price: 32500000 },
      { name: 'Madrid coffee table', variant: 'Mặt Bàn Ceramic Cao Cấp', price: 21290000 },
      { name: 'Expose side table', variant: 'Kim Loại Matt Black Sơn Tĩnh Điện', price: 12500000 },
      { name: 'Expose coffee table', variant: 'Bàn Trà Kính & Gỗ', price: 15500000 }
    ]
  },
  {
    category: 'Ghế Ăn & Ghế Thư Giãn',
    products: [
      { name: 'Hamilton dining chair', variant: 'Chân Kim Loại Đen Mờ', price: 8500000 },
      { name: 'Princeton dining chair', variant: 'Nệm Êm Vải Cao Cấp', price: 9200000 },
      { name: 'Imola armchair with swivel function', variant: 'Chân Xoay Da Bò Ý Thượng Hạng', price: 25000000 },
      { name: 'Adelaide barstool', variant: 'Ghế Quầy Bar Bắc Âu', price: 7800000 }
    ]
  },
  {
    category: 'Giường Ngủ & Tủ Kệ',
    products: [
      { name: 'Taylor sleeper W160xL200cm', variant: 'Giường Sofa Đa Năng 1m6 x 2m', price: 31000000 },
      { name: 'Calgary storage with drawer', variant: 'Tủ Kệ Trang Trí Gỗ Tự Nhiên', price: 44990000 }
    ]
  }
];

export const DEFAULT_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'CAMP-001',
    name: 'Đại Tiệc Mùa Hè',
    description: 'Giảm 30% toàn bộ bộ sưu tập Sofa & Bàn trà cao cấp',
    channel: 'TOÀN HỆ THỐNG',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 30,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 8,
    totalRevenue: 345000000,
    items: [
      {
        productId: '0ac754a3-6ae2-4d1f-8443-f26a2abd67b6',
        productName: 'Modena sofa with resting unit',
        variantName: 'Vải Nỉ Be Xám Cao Cấp',
        originalPrice: 42900000,
        salePrice: 30030000,
        discountPercent: 30
      },
      {
        productId: 'dc89e306-17aa-4384-9482-56d299cda075',
        productName: 'Indivi sofa with chaise longue left',
        variantName: 'Vải Nỉ Xám Chuẩn Đan Mạch',
        originalPrice: 38900000,
        salePrice: 27230000,
        discountPercent: 30
      },
      {
        productId: '5925064e-e082-433c-bbc3-666330ac4e44',
        productName: 'Santiago extendable dining table',
        variantName: 'Mặt Gỗ Sồi Dark Oak Tự Nhiên',
        originalPrice: 32500000,
        salePrice: 22750000,
        discountPercent: 30
      },
      {
        productId: '9134eb25-b351-4bfe-af5f-29e103536a47',
        productName: 'Expose side table',
        variantName: 'Kim Loại Matt Black Sơn Tĩnh Điện',
        originalPrice: 12500000,
        salePrice: 8750000,
        discountPercent: 30
      },
      {
        productId: 'd1faee79-dfef-48b6-8efa-8d9d85224a16',
        productName: 'Madrid coffee table',
        variantName: 'Mặt Bàn Ceramic Cao Cấp',
        originalPrice: 21290000,
        salePrice: 14903000,
        discountPercent: 30
      },
      {
        productId: '3dd3ea15-db17-448a-8ba0-2d46cc96c6a9',
        productName: 'Bolzano 3-seater',
        variantName: 'Vải Nỉ Sang Trọng',
        originalPrice: 36000000,
        salePrice: 25200000,
        discountPercent: 30
      },
      {
        productId: 'cfcd7eef-bcf4-4265-bbcd-e3bf26ae3b4c',
        productName: 'Carmo corner sofa',
        variantName: 'Module Góc Chữ L Hiện Đại',
        originalPrice: 49000000,
        salePrice: 34300000,
        discountPercent: 30
      },
      {
        productId: 'da5d42bf-9ed4-4f7c-a6ce-095241145aae',
        productName: 'Expose coffee table',
        variantName: 'Bàn Trà Kính & Gỗ',
        originalPrice: 15500000,
        salePrice: 10850000,
        discountPercent: 30
      }
    ]
  },
  {
    id: 'CAMP-002',
    name: 'Khai Trương Showroom',
    description: 'Ưu đãi 20% bàn ghế ăn & phòng khách',
    channel: 'TẠI SHOWROOM',
    showroomTargets: [
      'Showroom Q1 TP.HCM (Hai Bà Trưng)',
      'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
    ],
    discountType: 'PERCENT',
    discountValue: 20,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 4,
    totalRevenue: 512000000,
    items: [
      {
        productId: 'a280e186-e170-4ad1-acc6-967426bb2b7e',
        productName: 'Hamilton dining chair',
        variantName: 'Chân Kim Loại Đen Mờ',
        originalPrice: 8500000,
        salePrice: 6800000,
        discountPercent: 20
      },
      {
        productId: 'e436fd65-b60b-4f7a-abdc-2dd384bec890',
        productName: 'Princeton dining chair',
        variantName: 'Nệm Êm Vải Cao Cấp',
        originalPrice: 9200000,
        salePrice: 7360000,
        discountPercent: 20
      },
      {
        productId: 'a7b41332-c263-4f0d-b708-530f75d19517',
        productName: 'Imola armchair with swivel function',
        variantName: 'Chân Xoay Da Bò Ý Thượng Hạng',
        originalPrice: 25000000,
        salePrice: 20000000,
        discountPercent: 20
      },
      {
        productId: '3b0023d3-815e-487a-b3e1-4493c78a9cd3',
        productName: 'Adelaide barstool',
        variantName: 'Ghế Quầy Bar Bắc Âu',
        originalPrice: 7800000,
        salePrice: 6240000,
        discountPercent: 20
      }
    ]
  },
  {
    id: 'CAMP-003',
    name: 'Tri Ân Khách Hàng Online',
    description: 'Giảm 15% giường ngủ & tủ kệ cao cấp',
    channel: 'ONLINE',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 15,
    startDateTime: '2026-11-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 2,
    totalRevenue: 0,
    items: [
      {
        productId: 'f2d1fc04-8036-4e62-862e-7a302109cdc7',
        productName: 'Taylor sleeper W160xL200cm',
        variantName: 'Giường Sofa Đa Năng 1m6 x 2m',
        originalPrice: 31000000,
        salePrice: 26350000,
        discountPercent: 15
      },
      {
        productId: 'a6167ea5-8422-4caa-84cc-032b6b24ac97',
        productName: 'Calgary storage with drawer',
        variantName: 'Tủ Kệ Trang Trí Gỗ Tự Nhiên',
        originalPrice: 44990000,
        salePrice: 38241500,
        discountPercent: 15
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

  // Custom Dropdown Open States
  isStatusDropdownOpen = false;
  isChannelDropdownOpen = false;
  isModalChannelDropdownOpen = false;
  isModalScopeDropdownOpen = false;
  isModalCategoryDropdownOpen = false;

  get selectedStatusLabel(): string {
    const map: Record<string, string> = {
      'ALL': 'Tất cả trạng thái',
      'Ongoing': 'Ongoing',
      'Upcoming': 'Upcoming',
      'Ended': 'Ended',
      'Paused': 'Paused'
    };
    return map[this.selectedStatus] || 'Tất cả trạng thái';
  }

  get selectedChannelLabel(): string {
    const map: Record<string, string> = {
      'ALL': 'Tất cả kênh áp dụng',
      'TOÀN HỆ THỐNG': 'Toàn hệ thống',
      'ONLINE': 'Online website',
      'TẠI SHOWROOM': 'Tại showroom'
    };
    return map[this.selectedChannel] || 'Tất cả kênh áp dụng';
  }

  get modalChannelLabel(): string {
    const map: Record<string, string> = {
      'TOÀN HỆ THỐNG': 'Toàn hệ thống',
      'ONLINE': 'Chỉ Online website',
      'TẠI SHOWROOM': 'Tại Showroom'
    };
    return map[this.formData.channel] || this.formData.channel;
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
    this.isChannelDropdownOpen = false;
    this.isModalChannelDropdownOpen = false;
    this.isModalScopeDropdownOpen = false;
    this.isModalCategoryDropdownOpen = false;
  }

  onModalCardClick() {
    this.isModalChannelDropdownOpen = false;
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

  toggleChannelDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isChannelDropdownOpen;
    this.closeAllDropdowns();
    this.isChannelDropdownOpen = !curr;
  }

  selectChannelFilter(channel: string) {
    this.selectedChannel = channel;
    this.isChannelDropdownOpen = false;
  }

  toggleModalChannelDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isModalChannelDropdownOpen;
    this.closeAllDropdowns();
    this.isModalChannelDropdownOpen = !curr;
  }

  selectModalChannel(channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM') {
    this.formData.channel = channel;
    this.isModalChannelDropdownOpen = false;
  }

  toggleModalScopeDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isModalScopeDropdownOpen;
    this.closeAllDropdowns();
    this.isModalScopeDropdownOpen = !curr;
  }

  selectModalScope(scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS') {
    const prevScope = this.formData.scope;
    this.formData.scope = scope;
    this.isModalScopeDropdownOpen = false;

    if (scope === 'ALL') {
      this.applyAllProductsScope();
    } else if (scope === 'CATEGORY') {
      if (!this.formData.categoryScopeName && this.CATEGORIES.length > 0) {
        this.formData.categoryScopeName = this.CATEGORIES[0];
      }
      if (this.formData.categoryScopeName) {
        this.applyCategoryScope(this.formData.categoryScopeName);
      }
    } else if (scope === 'SPECIFIC_PRODUCTS') {
      if (prevScope !== 'SPECIFIC_PRODUCTS') {
        this.formData.items = [];
      }
      this.productSearchTerm = '';
    }
  }

  toggleModalCategoryDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isModalCategoryDropdownOpen;
    this.closeAllDropdowns();
    this.isModalCategoryDropdownOpen = !curr;
  }

  selectModalCategory(catName: string) {
    this.formData.categoryScopeName = catName;
    this.isModalCategoryDropdownOpen = false;
    this.applyCategoryScope(catName);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllDropdowns();
  }

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

  // Danh mục chính (cấp 1) tải trực tiếp từ PostgreSQL (Sofas, Chairs, Tables, Beds, ...)
  CATEGORIES: string[] = [];
  mainCategoryGroups: MainCategoryGroup[] = [];

  // Danh sách sản phẩm thật từ PostgreSQL (đồng bộ chuẩn như modal Voucher)
  allAvailableProducts: CampaignProductOption[] = [];
  isLoadingProducts = false;
  productSearchTerm = '';

  get filteredPickerProducts(): CampaignProductOption[] {
    const q = (this.productSearchTerm || '').trim().toLowerCase();
    if (!q) return this.allAvailableProducts.slice(0, 60);
    return this.allAvailableProducts
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.mainCategoryName.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }

  isProductSelected(productId: string): boolean {
    return this.formData.items.some(it => it.productId === productId);
  }

  toggleProductSelection(p: CampaignProductOption): void {
    const existsIdx = this.formData.items.findIndex(it => it.productId === p.id);
    if (existsIdx >= 0) {
      this.formData.items.splice(existsIdx, 1);
    } else {
      const { sale, pct } = this.calculateDiscountedPrice(p.price);
      this.formData.items.push({
        productId: p.id,
        productName: p.name,
        variantName: p.variant,
        originalPrice: p.price,
        salePrice: sale,
        discountPercent: pct
      });
    }
  }

  removeSelectedProduct(productId: string): void {
    this.formData.items = this.formData.items.filter(it => it.productId !== productId);
  }

  private buildCampaignItemFromProduct(p: CampaignProductOption): CampaignProductItem {
    const { sale, pct } = this.calculateDiscountedPrice(p.price);
    return {
      productId: p.id,
      productName: p.name,
      variantName: p.variant,
      originalPrice: p.price,
      salePrice: sale,
      discountPercent: pct
    };
  }

  applyAllProductsScope(): void {
    this.formData.items = this.allAvailableProducts.map(p => this.buildCampaignItemFromProduct(p));
  }

  applyCategoryScope(catName: string): void {
    const cleanTarget = (catName || '').trim().toLowerCase();
    const group = this.mainCategoryGroups.find(g => g.name.trim().toLowerCase() === cleanTarget);
    const idSet = new Set(group?.allCategoryIds || []);

    const matched = this.allAvailableProducts.filter(p => {
      if (idSet.size > 0 && p.categoryId && idSet.has(p.categoryId)) return true;
      return (
        p.mainCategoryName.trim().toLowerCase() === cleanTarget ||
        p.categoryName.trim().toLowerCase() === cleanTarget
      );
    });

    this.formData.items = matched.map(p => this.buildCampaignItemFromProduct(p));
  }

  // Form Data (mặc định để trống)
  formData: {
    name: string;
    description: string;
    channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
    showroomTargets: string[];
    scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
    categoryScopeName: string;
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
    this.loadMainCategories();
    this.loadCatalogFromDatabase();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  loadCampaigns(): void {
    this.isLoading = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`${environment.apiUrl}/admin/promotions/campaigns`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          this.records = data;
          this.evaluateAutomaticStatuses(false);
          this.persistLocalCacheOnly();
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.warn('API /admin/promotions/campaigns unavailable, using cached records:', err);
        this.loadFromStorage();
        this.evaluateAutomaticStatuses(false);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  loadMainCategories(): void {
    const applyTree = (tree: any[]) => {
      const groups: MainCategoryGroup[] = tree
        .filter((r: any) => r && r.name && r.isActive !== false)
        .map((r: any) => {
          const childIds = Array.isArray(r.children)
            ? r.children.map((ch: any) => String(ch.id)).filter(Boolean)
            : [];
          return {
            id: String(r.id),
            name: String(r.name).trim(),
            allCategoryIds: [String(r.id), ...childIds]
          };
        });
      if (groups.length > 0) {
        this.mainCategoryGroups = groups;
        this.CATEGORIES = Array.from(new Set(groups.map(g => g.name)));
        if (!this.formData.categoryScopeName) {
          this.formData.categoryScopeName = this.CATEGORIES[0];
        }
        if (this.isModalOpen && this.formData.scope === 'CATEGORY' && this.formData.categoryScopeName) {
          this.applyCategoryScope(this.formData.categoryScopeName);
        }
      }
    };

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
        if (tree.length > 0) {
          applyTree(tree);
          return;
        }
        return fetch(`${environment.apiUrl}/categories`)
          .then(r => (r.ok ? r.json() : []))
          .then((cats: any[]) => {
            if (!Array.isArray(cats)) return;
            const roots = cats.filter(c => !c.parentId).map(r => ({
              ...r,
              children: Array.isArray(r.children) ? r.children : cats.filter(c => c.parentId === r.id)
            }));
            applyTree(roots);
          });
      })
      .catch(() => {
        fetch(`${environment.apiUrl}/categories`)
          .then(r => (r.ok ? r.json() : []))
          .then((cats: any[]) => {
            if (!Array.isArray(cats)) return;
            const roots = cats.filter(c => !c.parentId).map(r => ({
              ...r,
              children: Array.isArray(r.children) ? r.children : cats.filter(c => c.parentId === r.id)
            }));
            applyTree(roots);
          })
          .catch(() => {});
      });
  }

  loadCatalogFromDatabase(): void {
    if (this.isLoadingProducts) return;
    this.isLoadingProducts = true;

    const mapProducts = (rawList: any[]): CampaignProductOption[] => {
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
          const catName = String(p.category?.name || p.categoryName || '');
          const mainCatName = String(p.category?.parent?.name || p.category?.name || p.categoryName || '');
          return {
            id: String(p.id),
            name: String(p.name),
            variant: String(firstVar?.name || 'Tiêu chuẩn'),
            sku: String(firstVar?.sku || p.sku || ''),
            price: Number(firstVar?.price ?? p.basePrice ?? p.price ?? 0),
            categoryId: String(p.categoryId || p.category?.id || ''),
            categoryName: catName,
            mainCategoryName: mainCatName,
            image: img
          };
        });
    };

    const onLoaded = (mapped: CampaignProductOption[]) => {
      if (mapped.length > 0) {
        this.allAvailableProducts = mapped;
        if (this.isModalOpen && !this.isEditing && this.formData.items.length === 0) {
          if (this.formData.scope === 'ALL') {
            this.applyAllProductsScope();
          } else if (this.formData.scope === 'CATEGORY' && this.formData.categoryScopeName) {
            this.applyCategoryScope(this.formData.categoryScopeName);
          }
        }
      }
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
          onLoaded(mapped);
          return;
        }
        return fetch(`${environment.apiUrl}/products?limit=300`)
          .then(r => (r.ok ? r.json() : []))
          .then((fbData: any) => {
            const fbList = Array.isArray(fbData) ? fbData : (fbData?.products || fbData?.items || []);
            onLoaded(mapProducts(fbList));
          });
      })
      .catch(() => {
        fetch(`${environment.apiUrl}/products?limit=300`)
          .then(r => (r.ok ? r.json() : []))
          .then((fbData: any) => {
            const fbList = Array.isArray(fbData) ? fbData : (fbData?.products || fbData?.items || []);
            onLoaded(mapProducts(fbList));
          })
          .catch(() => {});
      })
      .finally(() => {
        this.isLoadingProducts = false;
      });
  }

  loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      } else {
        this.records = [...DEFAULT_CAMPAIGNS];
      }
    } catch {
      this.records = [...DEFAULT_CAMPAIGNS];
    }
  }

  private persistLocalCacheOnly(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dcor_campaigns_updated', { detail: this.records }));
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  private syncCampaignToBackend(camp: CampaignItem): Promise<CampaignItem> {
    return fetch(`${environment.apiUrl}/admin/promotions/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(camp)
    }).then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || `Lỗi lưu chiến dịch (HTTP ${res.status})`);
      }
      return data?.campaign || camp;
    });
  }

  evaluateAutomaticStatuses(syncChanges = false): void {
    const today = new Date().toISOString().split('T')[0];

    this.records.forEach(camp => {
      const norm = this.getStatusBadgeLabel(camp.status);
      if (norm === 'Ended' || norm === 'Paused') return;

      const prev = camp.status;
      if (camp.endDateTime && camp.endDateTime < today) {
        camp.status = 'Ended';
      } else if (camp.startDateTime && camp.startDateTime > today) {
        camp.status = 'Upcoming';
      } else {
        camp.status = 'Ongoing';
      }

      if (syncChanges && camp.status !== prev) {
        this.syncCampaignToBackend(camp).catch(() => {});
      }
    });
  }

  getEmptyForm() {
    return {
      name: '',
      description: '',
      channel: 'TOÀN HỆ THỐNG' as 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM',
      showroomTargets: [] as string[],
      scope: 'SPECIFIC_PRODUCTS' as 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS',
      categoryScopeName: this.CATEGORIES?.[0] || '',
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
    if (this.CATEGORIES.length === 0) {
      this.loadMainCategories();
    }
    if (this.allAvailableProducts.length === 0) {
      this.loadCatalogFromDatabase();
    }
    this.isEditing = false;
    this.editingId = null;
    this.productSearchTerm = '';
    this.formData = this.getEmptyForm();
    this.closeAllDropdowns();
    this.isModalOpen = true;
  }

  openEditModal(camp: CampaignItem): void {
    if (this.CATEGORIES.length === 0) {
      this.loadMainCategories();
    }
    if (this.allAvailableProducts.length === 0) {
      this.loadCatalogFromDatabase();
    }
    this.isEditing = true;
    this.editingId = camp.id;
    this.productSearchTerm = '';
    this.formData = {
      name: camp.name,
      description: camp.description || '',
      channel: camp.channel,
      showroomTargets: camp.showroomTargets ? [...camp.showroomTargets] : ((camp as any).showroomTarget ? [(camp as any).showroomTarget] : []),
      scope: camp.scope || 'SPECIFIC_PRODUCTS',
      categoryScopeName: camp.categoryScopeName || this.CATEGORIES[0] || '',
      startDateTime: camp.startDateTime,
      endDateTime: camp.endDateTime,
      bulkDiscountType: camp.discountType || 'PERCENT',
      bulkDiscountValue: camp.discountValue || null,
      status: camp.status,
      items: camp.items.map(it => ({ ...it }))
    };
    this.closeAllDropdowns();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.closeAllDropdowns();
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

  calculateDiscountedPrice(originalPrice: number): { sale: number; pct: number } {
    const bulkType = this.formData.bulkDiscountType;
    const bulkVal = Number(this.formData.bulkDiscountValue);
    let sale = originalPrice;
    let pct = 0;

    if (bulkVal > 0) {
      if (bulkType === 'PERCENT') {
        pct = Math.min(99, bulkVal);
        sale = Math.round(originalPrice * (1 - pct / 100));
      } else {
        sale = Math.max(0, originalPrice - bulkVal);
        pct = Math.min(99, Math.max(1, Math.round((bulkVal / originalPrice) * 100)));
      }
    } else {
      pct = 30;
      sale = Math.round(originalPrice * 0.7);
    }
    return { sale, pct };
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
        const updatedCamp: CampaignItem = {
          ...this.records[idx],
          name,
          description: this.formData.description.trim(),
          channel: this.formData.channel,
          showroomTargets: this.formData.channel === 'TẠI SHOWROOM' ? [...this.formData.showroomTargets] : [],
          scope: this.formData.scope,
          categoryScopeName: this.formData.scope === 'CATEGORY' ? this.formData.categoryScopeName : undefined,
          discountType: this.formData.bulkDiscountType,
          discountValue: discountVal,
          startDateTime: this.formData.startDateTime,
          endDateTime: this.formData.endDateTime,
          status: calculatedStatus,
          productsCount: this.formData.items.length,
          items: this.formData.items.map(it => ({ ...it }))
        };

        this.syncCampaignToBackend(updatedCamp)
          .then(saved => {
            this.records[idx] = saved;
            this.persistLocalCacheOnly();
            this.closeModal();
            this.showToast(`Đã cập nhật chương trình "${name}" và đồng bộ lên cửa hàng!`, 'success');
          })
          .catch(err => {
            console.error('Lỗi cập nhật chiến dịch:', err);
            this.showToast(err?.message || 'Không thể cập nhật chiến dịch lên máy chủ.', 'warning');
          });
      }
    } else {
      const newCamp: CampaignItem = {
        id: `CAMP-${Date.now().toString().slice(-6)}`,
        name,
        description: this.formData.description.trim(),
        channel: this.formData.channel,
        showroomTargets: this.formData.channel === 'TẠI SHOWROOM' ? [...this.formData.showroomTargets] : [],
        scope: this.formData.scope,
        categoryScopeName: this.formData.scope === 'CATEGORY' ? this.formData.categoryScopeName : undefined,
        discountType: this.formData.bulkDiscountType,
        discountValue: discountVal,
        startDateTime: this.formData.startDateTime,
        endDateTime: this.formData.endDateTime,
        status: calculatedStatus,
        productsCount: this.formData.items.length,
        totalRevenue: 0,
        items: this.formData.items.map(it => ({ ...it }))
      };

      this.syncCampaignToBackend(newCamp)
        .then(saved => {
          this.records.unshift(saved);
          this.persistLocalCacheOnly();
          this.closeModal();
          this.showToast(`Đã tạo đợt giảm giá "${name}" và đồng bộ lên cửa hàng!`, 'success');
        })
        .catch(err => {
          console.error('Lỗi tạo chiến dịch:', err);
          this.showToast(err?.message || 'Không thể tạo chiến dịch trên máy chủ.', 'warning');
        });
    }
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
    const prevStatus = camp.status;
    const updatedCamp: CampaignItem = { ...camp, status: 'Ended' };
    this.campaignToEarlyEnd = null;

    this.syncCampaignToBackend(updatedCamp)
      .then(() => {
        camp.status = 'Ended';
        if (this.selectedCampaignDetail && this.selectedCampaignDetail.id === camp.id) {
          this.selectedCampaignDetail.status = 'Ended';
        }
        this.persistLocalCacheOnly();
        this.showToast(`Đã kết thúc sớm chương trình "${camp.name}" và đồng bộ lên cửa hàng!`, 'warning');
      })
      .catch(err => {
        camp.status = prevStatus;
        console.error('Lỗi kết thúc sớm chiến dịch:', err);
        this.showToast(err?.message || 'Không thể kết thúc sớm chiến dịch trên máy chủ.', 'warning');
      });
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
    const deletedId = this.campaignToDelete.id;
    this.campaignToDelete = null;

    fetch(`${environment.apiUrl}/admin/promotions/campaigns/${deletedId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders()
      }
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Lỗi xóa chiến dịch (HTTP ${res.status})`);
        }
        return data;
      })
      .then(() => {
        this.records = this.records.filter(c => c.id !== deletedId);
        this.persistLocalCacheOnly();
        this.showToast(`Đã xóa đợt giảm giá "${name}" khỏi hệ thống!`, 'success');
      })
      .catch(err => {
        console.error('Lỗi xóa chiến dịch:', err);
        this.showToast(err?.message || 'Không thể xóa chiến dịch trên máy chủ.', 'warning');
      });
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
