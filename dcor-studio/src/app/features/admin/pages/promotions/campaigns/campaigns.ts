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

  closeAllDropdowns() {
    this.isStatusDropdownOpen = false;
    this.isChannelDropdownOpen = false;
    this.isModalChannelDropdownOpen = false;
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

  // Category Picker State (Danh mục chính & Danh mục con)
  isCategoryModalOpen = false;
  categoryModalSearch = '';
  selectedCategoryNames: Set<string> = new Set();
  expandedMainCatIds: Set<string> = new Set();
  categoriesHierarchyList: { 
    id: string; 
    name: string; 
    count: number; 
    children: { id: string; name: string; count: number }[] 
  }[] = [];

  // Product Picker Modal State (Chuẩn Shopee / Shopify)
  isProductModalOpen = false;
  productModalSearch = '';
  productModalCategoryFilter = 'ALL';
  selectedProductKeys: Set<string> = new Set(); // key: "name::variant"
  allAvailableProducts: { id: string; name: string; variant: string; price: number; categoryName: string; image?: string }[] = [];

  get filteredModalProducts() {
    const term = this.productModalSearch.trim().toLowerCase();
    const cat = this.productModalCategoryFilter;

    return this.allAvailableProducts.filter(p => {
      const matchCat = cat === 'ALL' || p.categoryName === cat;
      const matchTerm = !term || p.name.toLowerCase().includes(term) || p.variant.toLowerCase().includes(term) || p.categoryName.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }

  get filteredModalCategories() {
    const term = this.categoryModalSearch.trim().toLowerCase();
    if (!term) return this.categoriesHierarchyList;
    return this.categoriesHierarchyList
      .map(parent => {
        const parentMatch = parent.name.toLowerCase().includes(term);
        const matchedChildren = parent.children.filter(ch => ch.name.toLowerCase().includes(term));
        if (parentMatch) {
          return parent;
        }
        if (matchedChildren.length > 0) {
          return {
            ...parent,
            children: matchedChildren
          };
        }
        return null;
      })
      .filter((p): p is { id: string; name: string; count: number; children: { id: string; name: string; count: number }[] } => p !== null);
  }

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
    this.initCategoriesTree();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  loadCampaigns(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.loadFromStorage();
      this.evaluateAutomaticStatuses();
      this.isLoading = false;
    }, 250);
  }

  initCategoriesTree(): void {
    let savedCats: any[] = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('dcor_admin_categories');
        if (raw) savedCats = JSON.parse(raw);
      } catch {}
    }
    const defaultCats = [
      { id: 'cat-sofa', name: 'Sofa & Ghế bành', type: 'main', parentId: null },
      { id: 'cat-sofa-l', name: 'Sofa Góc Chữ L Modula', type: 'main', parentId: 'cat-sofa' },
      { id: 'cat-armchair', name: 'Ghế Bành Thư Giãn (Armchair)', type: 'main', parentId: 'cat-sofa' },
      { id: 'cat-table', name: 'Bàn trà & Bàn góc', type: 'main', parentId: null },
      { id: 'cat-coffee-table', name: 'Bàn Trà Mặt Đá Ceramic', type: 'main', parentId: 'cat-table' },
      { id: 'cat-side-table', name: 'Bàn Góc & Bàn Tab', type: 'main', parentId: 'cat-table' },
      { id: 'cat-dining', name: 'Bàn ăn & Ghế ăn', type: 'main', parentId: null },
      { id: 'cat-dining-set', name: 'Bộ Bàn Ăn 6-8 Ghế', type: 'main', parentId: 'cat-dining' },
      { id: 'cat-dining-chair', name: 'Ghế Ăn Độc Lập', type: 'main', parentId: 'cat-dining' },
      { id: 'cat-bed', name: 'Phòng ngủ & Giường', type: 'main', parentId: null },
      { id: 'cat-king-bed', name: 'Giường Bọc Nệm King/Queen', type: 'main', parentId: 'cat-bed' },
      { id: 'cat-nightstand', name: 'Tap Đầu Giường', type: 'main', parentId: 'cat-bed' },
      { id: 'cat-storage', name: 'Kệ & Tủ lưu trữ', type: 'main', parentId: null },
      { id: 'cat-decor', name: 'Phụ kiện & Thảm trang trí', type: 'main', parentId: null }
    ];

    const all = [...defaultCats, ...savedCats.filter(s => !defaultCats.some(m => m.id === s.id))];
    const roots = all.filter(c => !c.parentId && c.type === 'main');
    this.categoriesHierarchyList = roots.map(r => {
      const children = all.filter(c => c.parentId === r.id).map(ch => ({
        id: ch.id,
        name: ch.name,
        count: this.getProductsCountForCategory(ch.name)
      }));
      return {
        id: r.id,
        name: r.name,
        count: this.getProductsCountForCategory(r.name),
        children
      };
    });
  }

  getProductsCountForCategory(catName: string): number {
    const term = catName.toLowerCase();
    return this.allAvailableProducts.filter(p =>
      p.categoryName.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term)
    ).length;
  }

  loadCatalogFromDatabase(): void {
    // Populate allAvailableProducts from static catalog first
    const prods: { id: string; name: string; variant: string; price: number; categoryName: string }[] = [];
    this.categoriesCatalog.forEach(cat => {
      cat.products.forEach(p => {
        prods.push({
          id: `p-${prods.length + 1}`,
          name: p.name,
          variant: p.variant,
          price: p.price,
          categoryName: cat.category
        });
      });
    });
    this.allAvailableProducts = prods;

    fetch(`${environment.apiUrl}/products`)
      .then(res => res.ok ? res.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const catMap = new Map<string, { name: string; variant: string; price: number }[]>();
          const fetchedProds: { id: string; name: string; variant: string; price: number; categoryName: string }[] = [];

          data.forEach(p => {
            const catName = p.category?.name || 'Khác';
            if (!catMap.has(catName)) {
              catMap.set(catName, []);
            }
            if (Array.isArray(p.variants) && p.variants.length > 0) {
              p.variants.forEach((v: any) => {
                const item = {
                  name: p.name,
                  variant: v.name || 'Tiêu chuẩn',
                  price: Number(v.price) || Number(p.basePrice) || 0
                };
                catMap.get(catName)!.push(item);
                fetchedProds.push({
                  id: String(p.id),
                  name: p.name,
                  variant: item.variant,
                  price: item.price,
                  categoryName: catName
                });
              });
            } else {
              const item = {
                name: p.name,
                variant: 'Tiêu chuẩn',
                price: Number(p.basePrice) || 0
              };
              catMap.get(catName)!.push(item);
              fetchedProds.push({
                id: String(p.id),
                name: p.name,
                variant: item.variant,
                price: item.price,
                categoryName: catName
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
          if (fetchedProds.length > 0) {
            this.allAvailableProducts = fetchedProds;
          }
          this.initCategoriesTree();
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
        // Tự động nâng cấp nếu phát hiện dữ liệu mock cũ (P-SOFA-01 hoặc DCor Nordic hoặc 2026-10-31)
        if (raw.includes('P-SOFA-01') || raw.includes('DCor Nordic') || raw.includes('2026-10-31')) {
          this.records = [...DEFAULT_CAMPAIGNS];
          this.saveToStorage();
        } else {
          this.records = JSON.parse(raw);
          const today = new Date().toISOString().split('T')[0];
          let hadMigration = false;
          this.records.forEach(c => {
            if (c.id && c.id.startsWith('CAMP-00') && c.endDateTime < today) {
              c.endDateTime = '2026-12-31';
              c.status = 'Ongoing';
              hadMigration = true;
            }
          });
          if (hadMigration) {
            this.saveToStorage();
          }
        }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dcor_campaigns_updated', { detail: this.records }));
      }
      // Đồng bộ ngầm với backend API
      if (typeof fetch !== 'undefined') {
        for (const camp of this.records) {
          fetch(`${environment.apiUrl}/admin/promotions/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(camp)
          }).catch(() => {});
        }
      }
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
    this.isCategoryModalOpen = false;
    this.isProductModalOpen = false;
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
    this.isCategoryModalOpen = false;
    this.isProductModalOpen = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
    this.isCategoryModalOpen = false;
    this.isProductModalOpen = false;
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

  // Modal Chọn Sản phẩm kiểu Shopee / Shopify
  openProductPickerModal(): void {
    this.productModalSearch = '';
    this.productModalCategoryFilter = 'ALL';
    this.selectedProductKeys.clear();
    // Pre-check các sản phẩm đã có trong bảng
    this.formData.items.forEach(it => {
      this.selectedProductKeys.add(`${it.productName}::${it.variantName || ''}`);
    });
    this.isProductModalOpen = true;
  }

  closeProductPickerModal(): void {
    this.isProductModalOpen = false;
  }

  toggleSelectProductKey(key: string): void {
    if (this.selectedProductKeys.has(key)) {
      this.selectedProductKeys.delete(key);
    } else {
      this.selectedProductKeys.add(key);
    }
  }

  isProductKeySelected(key: string): boolean {
    return this.selectedProductKeys.has(key);
  }

  toggleSelectAllVisibleProducts(): void {
    const visible = this.filteredModalProducts;
    const allSelected = visible.every(p => this.selectedProductKeys.has(`${p.name}::${p.variant}`));
    if (allSelected) {
      visible.forEach(p => this.selectedProductKeys.delete(`${p.name}::${p.variant}`));
    } else {
      visible.forEach(p => this.selectedProductKeys.add(`${p.name}::${p.variant}`));
    }
  }

  isAllVisibleProductsSelected(): boolean {
    const visible = this.filteredModalProducts;
    if (visible.length === 0) return false;
    return visible.every(p => this.selectedProductKeys.has(`${p.name}::${p.variant}`));
  }

  confirmProductPickerSelection(): void {
    const selectedProds = this.allAvailableProducts.filter(p => this.selectedProductKeys.has(`${p.name}::${p.variant}`));
    
    // Thêm các sản phẩm đã chọn vào bảng mà chưa tồn tại
    selectedProds.forEach(p => {
      if (!this.formData.items.some(it => it.productName === p.name && it.variantName === p.variant)) {
        const { sale, pct } = this.calculateDiscountedPrice(p.price);
        this.formData.items.push({
          productId: p.id || `P-${Date.now().toString().slice(-4)}`,
          productName: p.name,
          variantName: p.variant,
          originalPrice: p.price,
          salePrice: sale,
          discountPercent: pct
        });
      }
    });

    // Xóa các sản phẩm đã bị uncheck
    this.formData.items = this.formData.items.filter(it => this.selectedProductKeys.has(`${it.productName}::${it.variantName || ''}`));

    this.isProductModalOpen = false;
    this.showToast(`Đã lưu danh sách ${this.formData.items.length} sản phẩm áp dụng!`, 'success');
  }

  // Modal Chọn Danh mục chính & con kiểu Shopee / Shopify
  openCategoryPickerModal(): void {
    this.categoryModalSearch = '';
    this.selectedCategoryNames.clear();
    // Mở rộng tất cả danh mục cha mặc định để dễ nhìn
    this.expandedMainCatIds = new Set(this.categoriesHierarchyList.map(c => c.id));
    this.isCategoryModalOpen = true;
  }

  closeCategoryPickerModal(): void {
    this.isCategoryModalOpen = false;
  }

  toggleExpandParentCategory(catId: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.expandedMainCatIds.has(catId)) {
      this.expandedMainCatIds.delete(catId);
    } else {
      this.expandedMainCatIds.add(catId);
    }
  }

  isParentCategoryExpanded(catId: string): boolean {
    return this.expandedMainCatIds.has(catId);
  }

  toggleSelectCategory(catName: string): void {
    if (this.selectedCategoryNames.has(catName)) {
      this.selectedCategoryNames.delete(catName);
    } else {
      this.selectedCategoryNames.add(catName);
    }
  }

  isCategorySelected(catName: string): boolean {
    return this.selectedCategoryNames.has(catName);
  }

  toggleSelectParentAndChildren(parent: { id: string; name: string; count: number; children: { id: string; name: string; count: number }[] }): void {
    const isSelected = this.isCategorySelected(parent.name);
    if (isSelected) {
      this.selectedCategoryNames.delete(parent.name);
      parent.children.forEach(ch => this.selectedCategoryNames.delete(ch.name));
    } else {
      this.selectedCategoryNames.add(parent.name);
      parent.children.forEach(ch => this.selectedCategoryNames.add(ch.name));
    }
  }

  isParentChecked(parent: { id: string; name: string; count: number; children: { id: string; name: string; count: number }[] }): boolean {
    return this.selectedCategoryNames.has(parent.name);
  }

  confirmCategoryPickerSelection(): void {
    let addedCount = 0;
    this.selectedCategoryNames.forEach(catName => {
      const term = catName.toLowerCase();
      const matched = this.allAvailableProducts.filter(p =>
        p.categoryName.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
      );
      matched.forEach(p => {
        if (!this.formData.items.some(it => it.productName === p.name && it.variantName === p.variant)) {
          const { sale, pct } = this.calculateDiscountedPrice(p.price);
          this.formData.items.push({
            productId: p.id || `P-${Date.now().toString().slice(-4)}`,
            productName: p.name,
            variantName: p.variant,
            originalPrice: p.price,
            salePrice: sale,
            discountPercent: pct
          });
          addedCount++;
        }
      });
    });

    this.isCategoryModalOpen = false;
    if (addedCount > 0) {
      this.showToast(`Đã nạp thêm ${addedCount} sản phẩm từ các danh mục đã chọn!`, 'success');
    } else {
      this.showToast('Tất cả sản phẩm từ các danh mục này đã có trong danh sách!', 'info');
    }
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

  // 1. Thêm 1 sản phẩm cụ thể từ danh sách chọn / tìm kiếm
  selectProductToAdd(p: { id: string; name: string; variant: string; price: number; categoryName: string }): void {
    if (this.formData.items.some(it => it.productName === p.name && it.variantName === p.variant)) {
      this.showToast(`Sản phẩm "${p.name}" (${p.variant}) đã có trong danh sách!`, 'info');
      return;
    }

    const { sale, pct } = this.calculateDiscountedPrice(p.price);
    this.formData.items.push({
      productId: p.id || `P-${Date.now().toString().slice(-4)}`,
      productName: p.name,
      variantName: p.variant,
      originalPrice: p.price,
      salePrice: sale,
      discountPercent: pct
    });

    this.isProductModalOpen = false;
    this.showToast(`Đã thêm "${p.name}" vào chương trình giảm giá!`, 'success');
  }

  // 2. Thêm nhanh danh sách sản phẩm theo danh mục (cha hoặc con)
  addProductsByCategory(categoryName: string): void {
    const term = categoryName.toLowerCase();
    const matchedProducts = this.allAvailableProducts.filter(p =>
      p.categoryName.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term)
    );

    let addedCount = 0;
    matchedProducts.forEach(p => {
      if (this.formData.items.some(it => it.productName === p.name && it.variantName === p.variant)) return;

      const { sale, pct } = this.calculateDiscountedPrice(p.price);
      this.formData.items.push({
        productId: p.id || `P-${Date.now().toString().slice(-4)}`,
        productName: p.name,
        variantName: p.variant,
        originalPrice: p.price,
        salePrice: sale,
        discountPercent: pct
      });
      addedCount++;
    });

    this.isCategoryModalOpen = false;
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
    const deletedId = this.campaignToDelete.id;
    this.records = this.records.filter(c => c.id !== this.campaignToDelete?.id);
    this.saveToStorage();
    if (typeof fetch !== 'undefined') {
      fetch(`${environment.apiUrl}/admin/promotions/campaigns/${deletedId}`, { method: 'DELETE' }).catch(() => {});
    }
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
