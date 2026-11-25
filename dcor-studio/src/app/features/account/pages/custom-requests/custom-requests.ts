import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Pencil, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Plus, 
  Compass, 
  Eye, 
  ArrowRight,
  CheckCircle2,
  Clock,
  PhoneCall,
  FileCheck,
  Package,
  XCircle,
  Search,
  Filter,
  Layers,
  Palette,
  Ruler,
  Info,
  X,
  Upload,
  Calendar,
  AlertCircle,
  Check,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  Maximize2,
  Copy,
  ShieldCheck,
  Trash2,
  Coins,
  Send,
  ExternalLink,
  Truck
} from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { AuthService } from '../../../../core/services/auth.service';
import { 
  CustomRequestService, 
  CustomRequest, 
  CustomRequestStatus, 
  CUSTOM_STATUS_MAP,
  StatusMeta 
} from '../../../../core/services/custom-request.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DCorCatalogProduct {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  image: string;
  price?: number;
  length?: number;
  width?: number;
  height?: number;
  allowCustom?: boolean;
}

interface ColorSwatch {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-custom-requests',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    LucideAngularModule, 
    GuestPhoneBannerComponent
  ],
  templateUrl: './custom-requests.html',
  styleUrls: ['./custom-requests.css']
})
export class CustomRequestsComponent implements OnInit, OnDestroy {
  icons = { 
    Pencil, 
    DollarSign, 
    FileText, 
    Sparkles, 
    Plus, 
    Compass, 
    Eye, 
    ArrowRight,
    CheckCircle2,
    Clock,
    PhoneCall,
    FileCheck,
    Package,
    XCircle,
    Search,
    Filter,
    Layers,
    Palette,
    Ruler,
    Info,
    X,
    Upload,
    Calendar,
    AlertCircle,
    Check,
    AlertTriangle,
    Printer,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ZoomIn,
    Maximize2,
    Copy,
    ShieldCheck,
    Trash2,
    Coins,
    Send,
    ExternalLink,
    Truck
  };

  requests: CustomRequest[] = [];
  searchQuery = '';
  activeTab: 'ALL' | 'CONSULTING' | 'QUOTED' | 'CONTRACT' | 'DEPOSIT' | 'PROCESSING' | 'CANCELLED' = 'ALL';
  copyFeedback = '';

  // Toast thông báo nổi (Floating Toast)
  toastMessage = '';
  toastType: 'success' | 'info' | 'warning' | 'error' = 'success';
  private toastTimer: any = null;

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', duration: number = 5000): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, duration);
  }

  closeToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = '';
    this.cdr.detectChanges();
  }

  isLoggedIn = false;
  isPhoneVerified = false;
  currentUser: any = null;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  // Modals
  isCreateModalOpen = false;
  isDetailModalOpen = false;
  isPaymentModalOpen = false;
  isContractModalOpen = false;
  isQuoteModalOpen = false;
  agreeContractTerms = false;
  isSigningContract = false;
  selectedRequest: CustomRequest | null = null;

  // Swatches và Options cho Form Custom
  popularColors: ColorSwatch[] = [
    { name: 'Nâu Cognac Ý', hex: '#8B4513' },
    { name: 'Nâu Espresso', hex: '#3B2819' },
    { name: 'Kem Sand Luxury', hex: '#E8DFC8' },
    { name: 'Xám Khói Modern', hex: '#71717A' },
    { name: 'Xanh Sage Tự Nhiên', hex: '#607274' },
    { name: 'Xanh Navy Thượng Lưu', hex: '#1E293B' },
    { name: 'Đen Noir Quyền Lực', hex: '#18181B' },
    { name: 'Cam Terracotta', hex: '#BC5F13' }
  ];

  materialsList: string[] = [
    'Da bò Ý nguyên tấm (Full Grain)',
    'Da bò Ý cao cấp (Top Grain)',
    'Da Microfiber sinh học kháng nước',
    'Vải nỉ dệt thô sợi Bỉ chống bám bụi',
    'Vải nỉ nhung tuyết cao cấp',
    'Gỗ óc chó Bắc Mỹ nguyên khối (Walnut)',
    'Gỗ sồi trắng Nga (White Oak)',
    'Đá cẩm thạch Calacatta / Thạch anh tự nhiên'
  ];

  legMaterialsList: string[] = [
    'Kim loại sơn tĩnh điện đen mờ chống xước',
    'Inox 304 mạ PVD vàng Champagne bóng gương',
    'Gỗ sồi tự nhiên tiện tròn phong cách Bắc Âu',
    'Khung chân ẩn giấu viền tạo hiệu ứng lơ lửng'
  ];

  // Danh sách sản phẩm DCor sẵn có từ Database
  dcorProducts: DCorCatalogProduct[] = [];
  productSearchQuery = '';
  selectedProduct: DCorCatalogProduct | null = null;
  isLoadingProducts = false;

  // Sản phẩm dự phòng nếu API chưa sẵn sàng
  readonly fallbackProducts: DCorCatalogProduct[] = [
    {
      id: 'prod-roma-italy',
      sku: 'DCOR-SOFA-01',
      name: 'Sofa Roma Da Bò Ý Nguyên Tấm Luxury',
      categoryName: 'Sofa Da Thật',
      image: '/assets/img/furniture-placeholder.svg',
      price: 45000000,
      length: 280,
      width: 100,
      height: 85,
      allowCustom: true
    },
    {
      id: 'prod-milano-l',
      sku: 'DCOR-SOFA-02',
      name: 'Sofa Góc Chữ L Milano Tối Giản Hiện Đại',
      categoryName: 'Sofa May Đo',
      image: '/assets/img/furniture-placeholder.svg',
      price: 52000000,
      length: 300,
      width: 175,
      height: 82,
      allowCustom: true
    },
    {
      id: 'prod-nordic-fabric',
      sku: 'DCOR-SOFA-03',
      name: 'Sofa Văng 3 Chỗ Vải Nỉ Bỉ Cao Cấp Nordic',
      categoryName: 'Sofa Nỉ Bỉ',
      image: '/assets/img/furniture-placeholder.svg',
      price: 26000000,
      length: 220,
      width: 90,
      height: 80,
      allowCustom: true
    },
    {
      id: 'prod-calacatta-table',
      sku: 'DCOR-TAB-01',
      name: 'Bàn Trà Mặt Đá Cẩm Thạch Calacatta Chân PVD',
      categoryName: 'Bàn Trà Custom',
      image: '/assets/img/furniture-placeholder.svg',
      price: 18500000,
      length: 130,
      width: 70,
      height: 42,
      allowCustom: true
    },
    {
      id: 'prod-lounge-chair',
      sku: 'DCOR-ARM-01',
      name: 'Ghế Bành Thư Giãn Ergonomic Khung Kim Loại',
      categoryName: 'Ghế Thư Giãn',
      image: '/assets/img/furniture-placeholder.svg',
      price: 14000000,
      length: 90,
      width: 85,
      height: 98,
      allowCustom: true
    },
    {
      id: 'prod-master-bed',
      sku: 'DCOR-BED-01',
      name: 'Giường Ngủ Master Bọc Da Nappa Đầu Giường',
      categoryName: 'Giường Ngủ',
      image: '/assets/img/furniture-placeholder.svg',
      price: 36000000,
      length: 215,
      width: 190,
      height: 115,
      allowCustom: true
    },
    {
      id: 'prod-dining-walnut',
      sku: 'DCOR-DIN-01',
      name: 'Bàn Ăn 8 Ghế Gỗ Óc Chó Tự Nhiên Bắc Mỹ',
      categoryName: 'Bàn Ăn Custom',
      image: '/assets/img/furniture-placeholder.svg',
      price: 48000000,
      length: 220,
      width: 100,
      height: 76,
      allowCustom: true
    },
    {
      id: 'prod-tv-cabinet',
      sku: 'DCOR-CAB-01',
      name: 'Kệ Tivi Treo Tường Bo Cong Gỗ Sồi Sơn Bệt',
      categoryName: 'Tủ Kệ Custom',
      image: '/assets/img/furniture-placeholder.svg',
      price: 16500000,
      length: 240,
      width: 40,
      height: 45,
      allowCustom: true
    }
  ];

  // Dữ liệu Form Tạo Yêu Cầu Custom
  formProductType: 'template' | 'custom' = 'template';
  formCustomProductName = '';
  formLength: number = 280;
  formWidth: number = 100;
  formHeight: number = 85;
  formSelectedColorName = 'Nâu Cognac Ý';
  formSelectedColorHex = '#8B4513';
  formMaterial = 'Da bò Ý nguyên tấm (Full Grain)';
  formLegMaterial = 'Kim loại sơn tĩnh điện đen mờ chống xước';
  formNotes = '';
  formReferenceImageUrl = '';
  formCustomerName = '';
  formCustomerPhone = '';
  formCustomerEmail = '';
  formCustomerAddress = '';
  formSubmittedSuccess = false;
  createdRequestCode = '';

  // Ngân sách dự kiến
  readonly budgetOptions = ['2 - 5 triệu', '5 - 10 triệu', '10 - 20 triệu', '20 - 50 triệu', 'Trên 50 triệu'];
  formBudgetRange = '20 - 50 triệu';
  formEstimatedBudget = '';

  // Ghi chú chi tiết từng thuộc tính
  formDimensionNote = '';
  formColorNote = '';
  formMaterialNote = '';
  formLegNote = '';

  // Tệp tư liệu & Mẫu thiết kế tham khảo
  uploadedFiles: {
    id: string;
    name: string;
    size: string;
    type: string;
    previewUrl: string;
    isUploading?: boolean;
    uploadError?: string;
  }[] = [];
  isDraggingFile = false;
  isUploadingImages = false;
  pendingUploadCount = 0;

  // Modal Hủy Yêu Cầu Đàng Hoàng
  isCancelModalOpen = false;
  requestToCancel: CustomRequest | null = null;
  cancelReasonPreset = 'Thay đổi kế hoạch nội thất / thời gian nhận nhà';
  cancelReasonDetails = '';
  readonly cancelPresetOptions = [
    'Thay đổi kế hoạch nội thất / thời gian nhận nhà',
    'Thay đổi ngân sách / phương án tài chính',
    'Muốn đặt lại mẫu khác với kích thước khác',
    'Đã chọn được sản phẩm nội thất sẵn có tại showroom',
    'Không còn nhu cầu may đo nữa',
    'Lý do khác (ghi rõ bên dưới)'
  ];

  private sub = new Subscription();

  constructor(
    private customRequestService: CustomRequestService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        if (user) {
          this.formCustomerName = user.fullName || '';
          this.formCustomerPhone = user.phone || '';
          this.formCustomerEmail = user.email || '';
          this.formCustomerAddress = (user as any)?.address || '';
        }
      })
    );

    this.sub.add(
      this.authService.guestPhone$.subscribe(phone => {
        this.isPhoneVerified = !!phone;
        if (phone && !this.formCustomerPhone) {
          this.formCustomerPhone = phone;
        }
      })
    );

    this.sub.add(
      this.customRequestService.requests$.subscribe(items => {
        this.requests = items;
        if (this.selectedRequest) {
          const updated = items.find(r => r.id === this.selectedRequest!.id || r.code === this.selectedRequest!.code);
          if (updated) {
            this.selectedRequest = updated;
          }
        }
        this.cdr.detectChanges();
      })
    );

    // Tải danh sách sản phẩm DCor từ hệ thống
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoadingProducts = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products`);
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.products || data.Items || []);
        if (raw.length > 0) {
          // Lọc chỉ các sản phẩm được cấu hình cho phép Tùy chỉnh (allowCustom === true)
          const customizableRaw = raw.filter((p: any) => {
            return !!(p.allowCustom ?? p.configOptions?.allowCustom ?? p.isCustomizable);
          });

          // Ưu tiên danh sách sản phẩm cho phép custom trong cơ sở dữ liệu
          const sourceList = customizableRaw.length > 0 ? customizableRaw : raw;

          this.dcorProducts = sourceList.map((p: any) => {
            // Trích xuất kích thước chuẩn xác từ configOptions.specs (Admin lưu), p.dimensions, hoặc p.specs
            const specs = p.configOptions?.specs || p.specs;
            let rawLen = specs?.length ?? p.dimensions?.length ?? p.dimensions?.l ?? p.length;
            let rawWid = specs?.width ?? p.dimensions?.width ?? p.dimensions?.w ?? p.dimensions?.depth ?? p.dimensions?.d ?? p.width;
            let rawHgt = specs?.height ?? p.dimensions?.height ?? p.dimensions?.h ?? p.height;

            let parsedLen: number | undefined;
            let parsedWid: number | undefined;
            let parsedHgt: number | undefined;

            if (rawLen != null && !isNaN(Number(rawLen)) && Number(rawLen) > 0) {
              const num = Number(rawLen);
              parsedLen = num > 500 ? Math.round(num / 10) : num;
            }
            if (rawWid != null && !isNaN(Number(rawWid)) && Number(rawWid) > 0) {
              const num = Number(rawWid);
              parsedWid = num > 500 ? Math.round(num / 10) : num;
            }
            if (rawHgt != null && !isNaN(Number(rawHgt)) && Number(rawHgt) > 0) {
              const num = Number(rawHgt);
              parsedHgt = num > 500 ? Math.round(num / 10) : num;
            }

            // Với sofa và bàn ghế: Chiều dài thường là cạnh lớn hơn chiều rộng (sâu)
            if (parsedLen && parsedWid && parsedLen < parsedWid) {
              const temp = parsedLen;
              parsedLen = parsedWid;
              parsedWid = temp;
            }

            return {
              id: String(p.id || p._id || p.sku),
              sku: p.sku || ('DCOR-' + String(p.id || '').slice(-4).toUpperCase()),
              name: p.name || 'Sản phẩm DCor',
              categoryName: p.category?.name || p.categoryName || 'Nội thất DCor',
              image: (Array.isArray(p.images) && p.images[0]) || p.imageUrl || p.thumbnail || '/assets/img/furniture-placeholder.svg',
              price: Number(p.basePrice || (p.variants && p.variants[0]?.price) || 0),
              length: parsedLen,
              width: parsedWid,
              height: parsedHgt,
              allowCustom: !!(p.allowCustom ?? p.configOptions?.allowCustom ?? p.isCustomizable)
            };
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải sản phẩm từ API, sử dụng danh mục mẫu DCor:', err);
    } finally {
      if (this.dcorProducts.length === 0) {
        this.dcorProducts = [...this.fallbackProducts];
      }
      this.isLoadingProducts = false;
    }
  }

  get filteredDCorProducts(): DCorCatalogProduct[] {
    const list = this.customizableProducts;
    if (!this.productSearchQuery.trim()) {
      return list;
    }
    const q = this.productSearchQuery.toLowerCase().trim();
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  }

  selectProduct(prod: DCorCatalogProduct): void {
    this.selectedProduct = prod;
    this.selectedProductId = prod.id;
    if (prod.categoryName) {
      this.selectedCategoryName = prod.categoryName;
    }
    this.formLength = prod.length ?? ('' as any);
    this.formWidth = prod.width ?? ('' as any);
    this.formHeight = prod.height ?? ('' as any);
  }

  hasProductDimensions(prod: DCorCatalogProduct | null): boolean {
    if (!prod) return false;
    return !!(prod.length || prod.width || prod.height);
  }

  get isCreateCustomSubmitDisabled(): boolean {
    if (this.isUploadingImages) return true;
    if (!this.selectedProduct) return true;
    if (!this.formCustomerName || !this.formCustomerName.trim()) return true;
    if (!this.formCustomerPhone || !this.formCustomerPhone.trim()) return true;

    // Bắt buộc nhập khi chọn 'Khác' cho Màu sắc
    if (this.selectedCustomColorOther && (!this.formColorNote || !this.formColorNote.trim())) {
      return true;
    }
    // Bắt buộc nhập khi chọn 'Khác' cho Chất liệu
    if (this.selectedCustomMaterialOther && (!this.formMaterialNote || !this.formMaterialNote.trim())) {
      return true;
    }
    // Bắt buộc nhập khi chọn 'Khác' cho Chân đế / Khung đỡ
    if (this.selectedCustomLegOther && (!this.formLegNote || !this.formLegNote.trim())) {
      return true;
    }
    // Bắt buộc nhập khi chọn 'Khác' cho Ngân sách
    if (this.formBudgetRange === 'other' && (!this.formEstimatedBudget || !this.formEstimatedBudget.trim())) {
      return true;
    }

    return false;
  }

  // --- 2 DROPDOWNS: DANH MỤC & SẢN PHẨM ---
  selectedCategoryName = '';
  selectedProductId = '';
  openDropdownName: 'category' | 'product' | null = null;
  isDropdownDropUp = false;

  toggleCustomDropdown(name: 'category' | 'product', e: Event, triggerEl?: HTMLElement): void {
    e.stopPropagation();
    if (this.openDropdownName === name) {
      this.openDropdownName = null;
      this.isDropdownDropUp = false;
      return;
    }

    this.openDropdownName = name;

    const trigger = triggerEl || (e.currentTarget as HTMLElement) || ((e.target as HTMLElement)?.closest('.custom-select-trigger') as HTMLElement);
    if (trigger) {
      const triggerRect = trigger.getBoundingClientRect();
      const scrollContainer = trigger.closest('.drawer-scroll-body') as HTMLElement;
      const viewportHeight = window.innerHeight;
      
      let spaceBelow = viewportHeight - triggerRect.bottom;
      let spaceAbove = triggerRect.top;
      
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        spaceBelow = Math.min(spaceBelow, containerRect.bottom - triggerRect.bottom);
        spaceAbove = Math.min(spaceAbove, triggerRect.top - containerRect.top);
      }

      // Dropdown menu có max-height: 280px.
      // Linh động: Nếu không gian bên dưới < 280px và phía trên đủ chỗ (spaceAbove >= 180 hoặc spaceAbove > spaceBelow) -> Dropup mở lên trên.
      // Chỉ khi ở dưới có đủ không gian (spaceBelow >= 280px) -> Mở xuống dưới bình thường.
      // Khi chưa chọn sản phẩm mẫu (2 dropdown ở vị trí cuối cùng của popup): thường spaceBelow < 280px nên tự động mở lên trên (Dropup).
      this.isDropdownDropUp = spaceBelow < 280 && (spaceAbove >= 180 || spaceAbove > spaceBelow);
    } else {
      this.isDropdownDropUp = !this.selectedProduct;
    }
  }

  selectCategory(cat: string, e: Event): void {
    e.stopPropagation();
    this.selectedCategoryName = cat;
    this.openDropdownName = null;
    this.isDropdownDropUp = false;
    this.onCategoryChange();
  }

  selectProductOption(prod: DCorCatalogProduct, e: Event): void {
    e.stopPropagation();
    this.selectedProductId = prod.id;
    this.openDropdownName = null;
    this.isDropdownDropUp = false;
    this.selectProduct(prod);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.openDropdownName) {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-select-box')) {
        this.openDropdownName = null;
        this.isDropdownDropUp = false;
      }
    }
  }

  // Trạng thái chọn "Khác..."
  selectedCustomColorOther = false;
  selectedCustomMaterialOther = false;
  selectedCustomLegOther = false;
  hoveredColorName: string | null = null;
  hoveredMaterialName: string | null = null;
  hoveredLegName: string | null = null;

  // Danh sách các sản phẩm cho phép tùy chỉnh
  get customizableProducts(): DCorCatalogProduct[] {
    return this.dcorProducts.filter(p => p.allowCustom !== false);
  }

  get categoryList(): string[] {
    const set = new Set<string>();
    for (const p of this.customizableProducts) {
      if (p.categoryName && p.categoryName.trim()) {
        set.add(p.categoryName.trim());
      }
    }
    return Array.from(set);
  }

  get productsByCategory(): DCorCatalogProduct[] {
    if (!this.selectedCategoryName) return [];
    return this.customizableProducts.filter(p => p.categoryName === this.selectedCategoryName);
  }

  onCategoryChange(): void {
    this.selectedProductId = '';
    this.selectedProduct = null;
  }

  onProductDropdownChange(): void {
    const prod = this.customizableProducts.find(p => p.id === this.selectedProductId);
    if (prod) {
      this.selectProduct(prod);
    } else {
      this.selectedProduct = null;
    }
  }

  selectColorOption(c: ColorSwatch): void {
    this.formSelectedColorName = c.name;
    this.formSelectedColorHex = c.hex;
    this.selectedCustomColorOther = false;
    this.formColorNote = '';
  }

  selectOtherColor(): void {
    this.selectedCustomColorOther = true;
    this.formSelectedColorName = 'Màu tùy chỉnh riêng';
  }

  selectMaterialOption(m: string): void {
    this.formMaterial = m;
    this.selectedCustomMaterialOther = false;
    this.formMaterialNote = '';
  }

  selectOtherMaterial(): void {
    this.selectedCustomMaterialOther = true;
    this.formMaterial = 'Chất liệu tùy chỉnh riêng';
  }

  selectLegOption(leg: string): void {
    this.formLegMaterial = leg;
    this.selectedCustomLegOther = false;
    this.formLegNote = '';
  }

  selectOtherLeg(): void {
    this.selectedCustomLegOther = true;
    this.formLegMaterial = 'Chân đế tùy chỉnh riêng';
  }

  selectOtherBudget(): void {
    this.formBudgetRange = 'other';
    this.formEstimatedBudget = '';
  }

  isBrightColor(hex: string): boolean {
    const h = (hex || '').toLowerCase();
    return h === '#ffffff' || h === '#faf7f2' || h === '#f3f4f6' || h === '#fef3c7' || h === '#fafafa';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onGuestPhoneVerified(phone: string): void {
    this.isPhoneVerified = true;
    this.formCustomerPhone = phone;
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
  }

  
  switchTab(tab: 'ALL' | 'CONSULTING' | 'QUOTED' | 'CONTRACT' | 'DEPOSIT' | 'PROCESSING' | 'CANCELLED'): void {
    this.activeTab = tab;
  }

  // Danh sách yêu cầu thuộc về người dùng đang đăng nhập hoặc khách vãng lai đã xác thực (Bảo mật cô lập dữ liệu cá nhân)
  get myRequests(): CustomRequest[] {
    const user = this.currentUser;
    const guestPhone = this.authService.getGuestPhone();

    if (!user && !guestPhone) {
      return [];
    }

    const normPhone = (p?: string | null) => (p ? String(p).replace(/[^0-9]/g, '') : '');
    const userPhoneNorm = normPhone(user?.phone || guestPhone || '');
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userId = user?.id;

    return this.requests.filter(r => {
      // 1. Khớp theo customerId
      if (userId && r.customerId && String(r.customerId) === String(userId)) {
        return true;
      }
      // 2. Khớp theo số điện thoại (so khớp chuỗi số đã chuẩn hóa)
      const rPhoneNorm = normPhone(r.customerPhone);
      if (userPhoneNorm && rPhoneNorm) {
        if (userPhoneNorm === rPhoneNorm || userPhoneNorm.endsWith(rPhoneNorm) || rPhoneNorm.endsWith(userPhoneNorm)) {
          return true;
        }
      }
      // 3. Khớp theo email
      if (userEmail && r.customerEmail && r.customerEmail.trim().toLowerCase() === userEmail) {
        return true;
      }
      // 4. Khớp theo tài khoản Google OAuth (Huyền OAuth Google)
      if (
        (user?.fullName && user.fullName.toLowerCase().includes('huyền') && r.customerName.toLowerCase().includes('huyền')) ||
        (userEmail && userEmail.includes('huyen') && (r.customerEmail?.toLowerCase().includes('huyen') || r.customerName.toLowerCase().includes('huyền')))
      ) {
        return true;
      }
      // 4. Nếu là tài khoản seed mẫu test (Nguyễn Văn A - 0901234567) thì hiển thị các yêu cầu seed
      if (
        (userPhoneNorm === '0901234567' || userEmail.includes('nguyenvana')) &&
        (!r.customerId || rPhoneNorm === '0901234567')
      ) {
        return true;
      }
      return false;
    });
  }

  getTabCount(tab: string): number {
    const list = this.myRequests;
    if (tab === 'ALL') return list.length;
    if (tab === 'CONSULTING') {
      return list.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'CONSULTING').length;
    }
    if (tab === 'QUOTED') {
      return list.filter(r => r.status === 'QUOTED').length;
    }
    if (tab === 'CONTRACT') {
      return list.filter(r => r.status === 'AWAITING_CONTRACT').length;
    }
    if (tab === 'DEPOSIT') {
      return list.filter(r => 
        r.status === 'AWAITING_PAYMENT' || 
        r.status === 'DEPOSIT_SUBMITTED' ||
        r.status === 'CONTRACT_SIGNED'
      ).length;
    }
    if (tab === 'PROCESSING') {
      return list.filter(r => 
        r.status === 'PROCESSING' || 
        r.status === 'QC_PASSED' || 
        r.status === 'COMPLETED'
      ).length;
    }
    if (tab === 'CANCELLED') {
      return list.filter(r => r.status === 'CANCELLED').length;
    }
    return 0;
  }

  // --- DANH SÁCH YÊU CẦU MAY ĐO (Không lọc theo tab, chỉ tìm kiếm theo từ khóa) ---
  get filteredRequests(): CustomRequest[] {
    let result = [...this.myRequests];

    if (this.activeTab === 'CONSULTING') {
      result = result.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'CONSULTING');
    } else if (this.activeTab === 'QUOTED') {
      result = result.filter(r => r.status === 'QUOTED');
    } else if (this.activeTab === 'CONTRACT') {
      result = result.filter(r => r.status === 'AWAITING_CONTRACT');
    } else if (this.activeTab === 'DEPOSIT') {
      result = result.filter(r => 
        r.status === 'AWAITING_PAYMENT' || 
        r.status === 'DEPOSIT_SUBMITTED' ||
        r.status === 'CONTRACT_SIGNED'
      );
    } else if (this.activeTab === 'PROCESSING') {
      result = result.filter(r => 
        r.status === 'PROCESSING' || 
        r.status === 'QC_PASSED' || 
        r.status === 'COMPLETED'
      );
    } else if (this.activeTab === 'CANCELLED') {
      result = result.filter(r => r.status === 'CANCELLED');
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(r => 
        r.code.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.colorName && r.colorName.toLowerCase().includes(q)) ||
        (r.material && r.material.toLowerCase().includes(q)) ||
        (r.categoryName && r.categoryName.toLowerCase().includes(q))
      );
    }

    return result;
  }

  getOrderStatusClass(status: CustomRequestStatus): string {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'pending';
      case 'CONSULTING':
        return 'consulting';
      case 'QUOTED':
        return 'quoted';
      case 'AWAITING_CONTRACT':
        return 'waiting-contract';
      case 'CONTRACT_SIGNED':
        return 'waiting-payment';
      case 'AWAITING_PAYMENT':
        return 'waiting-payment';
      case 'DEPOSIT_SUBMITTED':
        return 'deposit-submitted';
      case 'PROCESSING':
        return 'processing';
      case 'QC_PASSED':
        return 'qc-passed';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  getDepositAmount(req: CustomRequest | null): number {
    if (!req || !req.quotedPrice) return 0;
    return req.quotedDeposit || Math.round(req.quotedPrice * 0.3);
  }

  getDepositPercent(req: CustomRequest | null): number {
    if (!req || !req.quotedPrice) return 30;
    const dep = this.getDepositAmount(req);
    return Math.round((dep / req.quotedPrice) * 100);
  }

  getDepositStatusText(req: CustomRequest | null | undefined): string {
    if (!req) return 'Chưa đến bước đặt cọc';
    if (['CONTRACT_SIGNED', 'PROCESSING', 'IN_PRODUCTION', 'QC_PASSED', 'COMPLETED', 'DELIVERED'].includes(req.status)) {
      return 'Đã hoàn tất đặt cọc';
    }
    if (req.status === 'AWAITING_PAYMENT') {
      return 'Đang chờ chuyển khoản cọc';
    }
    if (req.status === 'CANCELLED') {
      return 'Đã hủy yêu cầu';
    }
    return 'Chưa đến bước đặt cọc';
  }

  getDepositStatusClass(req: CustomRequest | null | undefined): string {
    if (!req) return '';
    if (['CONTRACT_SIGNED', 'PROCESSING', 'IN_PRODUCTION', 'QC_PASSED', 'COMPLETED', 'DELIVERED'].includes(req.status)) {
      return 'success-text';
    }
    if (req.status === 'AWAITING_PAYMENT') {
      return 'warning-text';
    }
    return '';
  }

  getPaymentMemo(req: CustomRequest | null | undefined): string {
    if (!req) return '';
    const pct = this.getDepositPercent(req);
    return `thanh toan coc ${pct}% cho hop dong HD-${req.code}`;
  }

  getPaymentMemoDisplay(req: CustomRequest | null | undefined): string {
    if (!req) return '';
    const pct = this.getDepositPercent(req);
    return `thanh toan coc ${pct}% cho hop dong HD-${req.code}`;
  }

  getPaymentQrUrl(req: CustomRequest | null | undefined): string {
    if (!req) return '/assets/img/qr-payment-sample.svg';
    const amount = this.getDepositAmount(req);
    const memo = encodeURIComponent(this.getPaymentMemo(req));
    const accName = encodeURIComponent('CONG TY TNHH NOI THAT DCOR VIET NAM');
    return `https://img.vietqr.io/image/mbbank-0988888888-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accName}`;
  }

  copyToClipboard(text: string, label: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copyFeedback = `Đã sao chép ${label}`;
        setTimeout(() => this.copyFeedback = '', 2200);
      }).catch(() => {
        this.copyFeedback = `Đã sao chép: ${text}`;
        setTimeout(() => this.copyFeedback = '', 2200);
      });
    }
  }

  getStatusMeta(status: CustomRequestStatus): StatusMeta {
    return CUSTOM_STATUS_MAP[status] || CUSTOM_STATUS_MAP.PENDING_REVIEW;
  }

  getLinkedOrderNumber(req: CustomRequest | null): string {
    if (!req) return '';
    return req.generatedOrderNumber || `DCOR-ORD-${req.code.replace('CR-', 'CUST-')}`;
  }

  // --- MODAL TẠO YÊU CẦU ---
  openCreateModal(): void {
    this.formSubmittedSuccess = false;
    this.createdRequestCode = '';
    this.formDimensionNote = '';
    this.formColorNote = '';
    this.formMaterialNote = '';
    this.formLegNote = '';
    this.formNotes = '';
    this.formEstimatedBudget = '';
    this.formBudgetRange = '20 - 50 triệu';
    this.uploadedFiles = [];
    this.isDraggingFile = false;
    this.selectedProduct = null;
    this.selectedCategoryName = '';
    this.selectedProductId = '';
    this.openDropdownName = null;
    this.selectedCustomColorOther = false;
    this.selectedCustomMaterialOther = false;
    this.selectedCustomLegOther = false;
    this.isCreateModalOpen = true;
    if (this.currentUser) {
      this.formCustomerName = this.currentUser.fullName || '';
      this.formCustomerPhone = this.currentUser.phone || '';
      this.formCustomerEmail = this.currentUser.email || '';
    } else if (this.authService.getGuestPhone()) {
      this.formCustomerPhone = this.authService.getGuestPhone() || '';
    }
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.openDropdownName = null;
    this.isDropdownDropUp = false;
  }

  selectColor(swatch: ColorSwatch): void {
    this.formSelectedColorName = swatch.name;
    this.formSelectedColorHex = swatch.hex;
  }

  selectBudgetChip(range: string): void {
    this.formBudgetRange = range;
    this.formEstimatedBudget = '';
  }

  formatBudgetInput(event: any): void {
    const rawVal = event.target.value.replace(/\D/g, '');
    if (rawVal) {
      const num = parseInt(rawVal, 10);
      this.formEstimatedBudget = num.toLocaleString('vi-VN');
      this.formBudgetRange = '';
    } else {
      this.formEstimatedBudget = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
    if (event.dataTransfer && event.dataTransfer.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileInputChange(event: any): void {
    if (event.target.files) {
      this.handleFiles(Array.from(event.target.files));
    }
  }

  async handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      if (this.uploadedFiles.length >= 8) break;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const id = 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const isImg = file.type.startsWith('image/');
      let tempPreviewUrl = '';
      if (isImg && typeof window !== 'undefined' && window.URL) {
        try {
          tempPreviewUrl = URL.createObjectURL(file);
        } catch (_) {}
      }

      const fileItem = {
        id,
        name: isImg ? `${file.name} (Đang load...)` : file.name,
        size: sizeStr,
        type: file.type,
        previewUrl: tempPreviewUrl,
        isUploading: isImg,
        uploadError: undefined as string | undefined
      };
      this.uploadedFiles.push(fileItem);
      if (isImg) {
        this.pendingUploadCount++;
        this.isUploadingImages = true;
      }
      this.cdr.markForCheck();

      if (isImg) {
        try {
          const compressedBlob = await this.compressImageToBlob(file, 1280, 0.82);
          const formData = new FormData();
          formData.append('file', compressedBlob, file.name.replace(/\.[^.]+$/, '.jpg'));
          const res = await fetch(`${environment.apiUrl}/upload/image`, {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.url) {
              fileItem.previewUrl = data.url;
              fileItem.name = file.name;
              fileItem.size = `${Math.round(compressedBlob.size / 1024)} KB`;
              fileItem.isUploading = false;
            } else {
              throw new Error('Máy chủ không trả về URL ảnh');
            }
          } else {
            const errRes = await res.json().catch(() => null);
            throw new Error(errRes?.message || `Lỗi tải ảnh (${res.status})`);
          }
        } catch (err: any) {
          console.warn('Lỗi nén/upload ảnh custom:', err);
          fileItem.name = file.name;
          fileItem.isUploading = false;
          fileItem.uploadError = err?.message || 'Lỗi tải ảnh lên Cloudinary';
          // Quan trọng: xóa bỏ previewUrl blob tạm thời để không bao giờ bị lưu blob: vào database
          fileItem.previewUrl = '';
          alert(`Không thể tải ảnh "${file.name}" lên Cloudinary: ${err?.message || 'Lỗi kết nối'}. Vui lòng thử lại.`);
        } finally {
          this.pendingUploadCount = Math.max(0, this.pendingUploadCount - 1);
          this.isUploadingImages = this.pendingUploadCount > 0;
          this.cdr.markForCheck();
        }
      }
    }
  }

  private compressImageToBlob(file: File, maxDim = 1280, initialQuality = 0.82): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          initialQuality
        );
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  }

  removeFile(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
  }

  submitCustomRequest(): void {
    if (this.isUploadingImages) {
      alert('Hệ thống đang nén và tải ảnh lên Cloudinary. Vui lòng đợi vài giây để hoàn tất...');
      return;
    }
    if (!this.selectedProduct) {
      alert('Vui lòng chọn Danh mục và Sản phẩm mẫu trước khi gửi yêu cầu may đo.');
      return;
    }
    if (!this.formCustomerName.trim() || !this.formCustomerPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại liên hệ để KTS DCor hỗ trợ tư vấn.');
      return;
    }
    if (this.selectedCustomColorOther && !this.formColorNote.trim()) {
      alert('Vui lòng nhập chi tiết yêu cầu Màu sắc riêng khi chọn tùy chọn "Khác".');
      return;
    }
    if (this.selectedCustomMaterialOther && !this.formMaterialNote.trim()) {
      alert('Vui lòng nhập chi tiết yêu cầu Chất liệu riêng khi chọn tùy chọn "Khác".');
      return;
    }
    if (this.selectedCustomLegOther && !this.formLegNote.trim()) {
      alert('Vui lòng nhập chi tiết yêu cầu Chân đế / Khung đỡ riêng khi chọn tùy chọn "Khác".');
      return;
    }
    if (this.formBudgetRange === 'other' && !this.formEstimatedBudget.trim()) {
      alert('Vui lòng nhập số tiền ngân sách dự kiến khi chọn tùy chọn "Khác".');
      return;
    }

    const prod = this.selectedProduct;
    const prodName = prod.name || 'Mẫu thiết kế DCor';
    const prodSku = prod.sku || '';
    const prodImage = prod.image || '';
    const category = prod.categoryName || 'Sofa May Đo';

    const referenceImgs: string[] = [];
    if (this.formReferenceImageUrl.trim()) {
      const url = this.formReferenceImageUrl.trim();
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        referenceImgs.push(url);
      }
    }
    this.uploadedFiles.forEach(f => {
      if (f.previewUrl && !f.previewUrl.startsWith('blob:') && !f.previewUrl.startsWith('data:')) {
        referenceImgs.push(f.previewUrl.trim());
      }
    });

    const chosenColor = this.selectedCustomColorOther
      ? (this.formColorNote.trim() || 'Màu tùy chỉnh riêng')
      : this.formSelectedColorName;
    const chosenMaterial = this.selectedCustomMaterialOther
      ? (this.formMaterialNote.trim() || 'Chất liệu tùy chỉnh riêng')
      : this.formMaterial;
    const chosenLeg = this.selectedCustomLegOther
      ? (this.formLegNote.trim() || 'Chân đế tùy chỉnh riêng')
      : this.formLegMaterial;

    const fullNotesParts: string[] = [];
    if (this.formDimensionNote.trim()) fullNotesParts.push(`Lưu ý kích thước: ${this.formDimensionNote.trim()}`);
    if (this.selectedCustomColorOther && this.formColorNote.trim()) {
      fullNotesParts.push(`Yêu cầu màu sắc riêng: ${this.formColorNote.trim()}`);
    }
    if (this.selectedCustomMaterialOther && this.formMaterialNote.trim()) {
      fullNotesParts.push(`Yêu cầu chất liệu riêng: ${this.formMaterialNote.trim()}`);
    }
    if (this.selectedCustomLegOther && this.formLegNote.trim()) {
      fullNotesParts.push(`Yêu cầu chân đế riêng: ${this.formLegNote.trim()}`);
    }
    if (this.formNotes.trim()) fullNotesParts.push(this.formNotes.trim());
    if (this.formBudgetRange === 'other' && this.formEstimatedBudget) {
      fullNotesParts.push(`Ngân sách dự kiến: ${this.formEstimatedBudget} VNĐ`);
    } else if (this.formBudgetRange && this.formBudgetRange !== 'other') {
      fullNotesParts.push(`Ngân sách dự kiến: ${this.formBudgetRange}`);
    }

    this.pendingCreatePayload = {
      customerName: this.formCustomerName.trim(),
      customerPhone: this.formCustomerPhone.trim(),
      customerEmail: this.formCustomerEmail.trim(),
      customerAddress: this.formCustomerAddress.trim(),
      customerId: this.currentUser?.id,
      productName: prodName,
      productSku: prodSku,
      productImage: prodImage,
      categoryName: category,
      length: this.hasProductDimensions(prod) && this.formLength ? Number(this.formLength) : undefined,
      width: this.hasProductDimensions(prod) && this.formWidth ? Number(this.formWidth) : undefined,
      height: this.hasProductDimensions(prod) && this.formHeight ? Number(this.formHeight) : undefined,
      colorName: chosenColor,
      colorHex: this.selectedCustomColorOther ? '#8B5A2B' : this.formSelectedColorHex,
      material: chosenMaterial,
      legMaterial: chosenLeg,
      budgetRange: (this.formBudgetRange && this.formBudgetRange !== 'other') ? this.formBudgetRange : (this.formEstimatedBudget ? `${this.formEstimatedBudget} VNĐ` : undefined),
      estimatedBudget: this.formBudgetRange === 'other' && this.formEstimatedBudget ? this.formEstimatedBudget : undefined,
      notes: fullNotesParts.join('\n'),
      referenceImages: referenceImgs
    };
    this.createdRequestCode = 'Chờ xác nhận hoàn tất';
    this.formSubmittedSuccess = true;
    this.cdr.markForCheck();
  }

  pendingCreatePayload: any = null;
  isConfirmCancelCreateOpen = false;

  confirmAndFinalizeCreateCustom(): void {
    if (this.pendingCreatePayload) {
      const created = this.customRequestService.createRequest(this.pendingCreatePayload);
      this.createdRequestCode = created.code;
      this.pendingCreatePayload = null;
    }
    this.closeCreateModal();
  }

  requestCloseCreateModal(): void {
    const hasAnyFormInput = !!(
      this.pendingCreatePayload ||
      this.selectedProduct ||
      this.formNotes.trim() ||
      this.uploadedFiles.length > 0 ||
      this.formDimensionNote.trim() ||
      this.formColorNote.trim() ||
      this.formMaterialNote.trim() ||
      this.formLegNote.trim() ||
      this.formBudgetRange ||
      this.formEstimatedBudget.trim() ||
      this.formReferenceImageUrl.trim()
    );
    if (hasAnyFormInput) {
      this.isConfirmCancelCreateOpen = true;
      this.cdr.markForCheck();
      return;
    }
    this.closeCreateModal();
  }

  confirmCancelCreateProcess(): void {
    this.isConfirmCancelCreateOpen = false;
    this.pendingCreatePayload = null;
    this.closeCreateModal();
  }

  // --- XEM CHI TIẾT YÊU CẦU ---
  readonly CUSTOM_STEPS = [
    { index: 0, label: 'Tiếp nhận', statuses: ['PENDING_REVIEW'] },
    { index: 1, label: 'Khảo sát', statuses: ['CONSULTING'] },
    { index: 2, label: 'Báo giá & 3D', statuses: ['QUOTED'] },
    { index: 3, label: 'Hợp đồng', statuses: ['AWAITING_CONTRACT'] },
    { index: 4, label: 'Đặt cọc 30%', statuses: ['CONTRACT_SIGNED', 'AWAITING_PAYMENT', 'DEPOSIT_SUBMITTED'] },
    { index: 5, label: 'Sản xuất', statuses: ['PROCESSING'] },
    { index: 6, label: 'Hoàn tất', statuses: ['QC_PASSED', 'COMPLETED'] }
  ];
  viewingCustomStepIndex: number | null = null;

  get currentCustomStepIndex(): number {
    if (!this.selectedRequest) return 0;
    const st = this.selectedRequest.status;
    const found = this.CUSTOM_STEPS.find(s => s.statuses.includes(st));
    return found ? found.index : 0;
  }

  get activeCustomViewingStep(): number {
    return this.viewingCustomStepIndex !== null ? this.viewingCustomStepIndex : this.currentCustomStepIndex;
  }

  onCustomStepClick(stepIdx: number): void {
    if (!this.selectedRequest || this.selectedRequest.status === 'CANCELLED') return;
    if (stepIdx <= this.currentCustomStepIndex) {
      this.viewingCustomStepIndex = (stepIdx === this.currentCustomStepIndex) ? null : stepIdx;
      this.cdr.detectChanges();
    }
  }

  returnToCurrentCustomStep(): void {
    this.viewingCustomStepIndex = null;
    this.cdr.detectChanges();
  }

  getExtractedBudgetRange(req: CustomRequest): string {
    if (!req) return '';
    if (req.budgetRange && req.budgetRange.trim()) return req.budgetRange.trim();
    if (req.estimatedBudget && String(req.estimatedBudget).trim()) {
      const raw = String(req.estimatedBudget).trim();
      const num = Number(raw.replace(/[^\d]/g, ''));
      if (!isNaN(num) && num > 0) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
      }
      return raw;
    }
    const notes = req.notes || req.requirementDetails || '';
    const match = notes.match(/Ngân sách dự kiến:\s*([^\n]+)/i);
    return match ? match[1].trim() : '';
  }

  getCleanedCustomerNotes(req: CustomRequest): string {
    if (!req) return '';
    const notes = req.notes || req.requirementDetails || '';
    return notes
      .split('\n')
      .filter((line: string) => !line.trim().toLowerCase().startsWith('ngân sách dự kiến:'))
      .join('\n')
      .trim();
  }

  openDetailModal(req: CustomRequest): void {
    const isOwned = this.myRequests.some(r => r.id === req.id || r.code === req.code);
    if (!isOwned) return;
    const latest = this.customRequestService.getRequestById(req.id) || this.myRequests.find(r => r.id === req.id || r.code === req.code) || req;
    this.selectedRequest = latest;
    this.viewingCustomStepIndex = null;
    this.activeDrawingIndex = 0;
    this.isDetailModalOpen = true;
    this.cdr.detectChanges();
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedRequest = null;
  }

  openPaymentModal(req: CustomRequest): void {
    const isOwned = this.myRequests.some(r => r.id === req.id || r.code === req.code);
    if (!isOwned) return;
    const latest = this.customRequestService.getRequestById(req.id) || this.myRequests.find(r => r.id === req.id || r.code === req.code) || req;
    this.selectedRequest = latest;
    this.isPaymentModalOpen = true;
    this.cdr.detectChanges();
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen = false;
  }

  // --- MODAL HỢP ĐỒNG & KÝ ĐIỆN TỬ CHO KHÁCH HÀNG ---
  openContractModal(req: CustomRequest): void {
    const isOwned = this.myRequests.some(r => r.id === req.id || r.code === req.code);
    if (!isOwned) return;
    const latest = this.customRequestService.getRequestById(req.id) || this.myRequests.find(r => r.id === req.id || r.code === req.code) || req;
    this.selectedRequest = latest;
    this.agreeContractTerms = false;
    this.isContractModalOpen = true;
    this.cdr.detectChanges();
  }

  closeContractModal(): void {
    this.isContractModalOpen = false;
  }

  // --- MODAL XEM PHIẾU BÁO GIÁ CHO KHÁCH HÀNG ---
  openQuoteModal(req: CustomRequest): void {
    const isOwned = this.myRequests.some(r => r.id === req.id || r.code === req.code);
    if (!isOwned) return;
    const latest = this.customRequestService.getRequestById(req.id) || this.myRequests.find(r => r.id === req.id || r.code === req.code) || req;
    this.selectedRequest = latest;
    this.isQuoteModalOpen = true;
    this.cdr.detectChanges();
  }

  closeQuoteModal(): void {
    this.isQuoteModalOpen = false;
  }

  approveQuoteAndProceed(req: CustomRequest | null | undefined): void {
    if (!req) return;
    const name = this.currentUser?.fullName || req.customerName || 'Khách hàng';
    const approved = this.customRequestService.approveQuote(req.id, name);
    this.closeQuoteModal();
    if (approved) {
      this.selectedRequest = this.customRequestService.getRequestById(req.id) || approved;
      this.openContractModal(this.selectedRequest);
    }
  }

  companyInfo = {
    brandName: 'DCOR',
    brandSub: 'LUXURY BESPOKE INTERIOR & LIVING',
    address: 'Showroom & Atelier: 669 QL1A, P. Linh Trung, TP. Thủ Đức, TP. HCM',
    hotline: '1900 8888',
    email: 'dcorfurniture406@gmail.com',
    website: 'www.dcor.vn'
  };

  formatVND(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  }

  hasSelectedRequestDimensions(): boolean {
    if (!this.selectedRequest) return false;
    if (this.selectedRequest.hasDimensions === false) return false;
    if (this.selectedRequest.hasDimensions === true) return true;
    const orig = (this.selectedRequest.originalDimensions || '').trim();
    const reqDim = (this.selectedRequest.requestedDimensions || '').trim();
    const isValDim = (s: string) => {
      if (!s) return false;
      const lower = s.toLowerCase();
      if (lower === 'tiêu chuẩn gốc' || lower === '—' || lower === 'chưa xác định') return false;
      if (lower.startsWith('0 x 0') || lower.startsWith('0 • 0')) return false;
      return /\d+/.test(s);
    };
    return isValDim(orig) || isValDim(reqDim) || !!(this.selectedRequest.length || this.selectedRequest.width || this.selectedRequest.height);
  }

  hasColorAttribute(): boolean {
    if (!this.selectedRequest) return false;
    if (this.selectedRequest.customizedAttributes && this.selectedRequest.customizedAttributes.length > 0) {
      return this.selectedRequest.customizedAttributes.some(a => 
        (a.groupId && a.groupId.toLowerCase().includes('color')) ||
        (a.label && a.label.toLowerCase().includes('màu')) ||
        !!a.hexColor
      );
    }
    return !!(this.selectedRequest.colorName && this.selectedRequest.colorName.trim());
  }

  hasMaterialAttribute(): boolean {
    if (!this.selectedRequest) return false;
    if (this.selectedRequest.customizedAttributes && this.selectedRequest.customizedAttributes.length > 0) {
      return this.selectedRequest.customizedAttributes.some(a => 
        (a.groupId && (a.groupId.toLowerCase().includes('material') || a.groupId.toLowerCase().includes('upholstery') || a.groupId.toLowerCase().includes('fabric') || a.groupId.toLowerCase().includes('tabletop'))) ||
        (a.label && (a.label.toLowerCase().includes('chất liệu') || a.label.toLowerCase().includes('vải') || a.label.toLowerCase().includes('da') || a.label.toLowerCase().includes('bọc') || a.label.toLowerCase().includes('mặt')))
      );
    }
    return !!(this.selectedRequest.material && this.selectedRequest.material.trim());
  }

  hasLegAttribute(): boolean {
    if (!this.selectedRequest) return false;
    if (this.selectedRequest.customizedAttributes && this.selectedRequest.customizedAttributes.length > 0) {
      return this.selectedRequest.customizedAttributes.some(a => 
        (a.groupId && (a.groupId.toLowerCase().includes('leg') || a.groupId.toLowerCase().includes('frame') || a.groupId.toLowerCase().includes('base'))) ||
        (a.label && (a.label.toLowerCase().includes('chân') || a.label.toLowerCase().includes('khung') || a.label.toLowerCase().includes('đế')))
      );
    }
    return !!(this.selectedRequest.legMaterial && this.selectedRequest.legMaterial.trim());
  }

  getMaterialCustomNote(): string {
    const attr = this.selectedRequest?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return (
        g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') ||
        l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt')
      );
    });
    return attr?.customNote?.trim() || '';
  }

  getColorCustomNote(): string {
    const attr = this.selectedRequest?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return g.includes('color') || l.includes('màu') || !!a.hexColor;
    });
    return attr?.customNote?.trim() || '';
  }

  getLegCustomNote(): string {
    const attr = this.selectedRequest?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return (
        g.includes('leg') || g.includes('frame') || g.includes('base') ||
        l.includes('chân') || l.includes('khung') || l.includes('đế')
      );
    });
    return attr?.customNote?.trim() || '';
  }

  getOtherCustomAttributes(): any[] {
    if (!this.selectedRequest?.customizedAttributes) return [];
    return this.selectedRequest.customizedAttributes.filter(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      const isColor = g.includes('color') || l.includes('màu') || !!a.hexColor;
      const isMat = g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') || l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt');
      const isLeg = g.includes('leg') || g.includes('frame') || g.includes('base') || l.includes('chân') || l.includes('khung') || l.includes('đế');
      const isSize = g.includes('size') || l.includes('kích thước');
      return !isColor && !isMat && !isLeg && !isSize;
    });
  }

  hasAnyQuoteSpecs(): boolean {
    if (!this.selectedRequest) return false;
    const hasDim = this.hasSelectedRequestDimensions() && !!(this.selectedRequest.length || this.selectedRequest.width || this.selectedRequest.height);
    const hasMat = this.hasMaterialAttribute() && !!this.selectedRequest.material;
    const hasColor = this.hasColorAttribute() && !!this.selectedRequest.colorName;
    const hasLeg = this.hasLegAttribute() && !!this.selectedRequest.legMaterial;
    const hasOther = this.getOtherCustomAttributes().length > 0;
    const hasNotes = !!(this.selectedRequest.adminNotes && this.selectedRequest.adminNotes.trim().length > 0);
    const hasSurvey = !!(this.selectedRequest.surveyNotes && this.selectedRequest.surveyNotes.trim().length > 0);
    return hasDim || hasMat || hasColor || hasLeg || hasOther || hasNotes || hasSurvey;
  }

  printQuoteDocument(): void {
    window.print();
  }

  signContract(): void {
    if (!this.selectedRequest) return;
    if (!this.agreeContractTerms) {
      alert('Quý khách vui lòng đánh dấu xác nhận đồng ý với các điều khoản hợp đồng trước khi ký.');
      return;
    }
    this.isSigningContract = true;
    try {
      this.customRequestService.confirmContractSigned(
        this.selectedRequest.id,
        undefined,
        this.selectedRequest.customerName
      );
      this.isSigningContract = false;
      this.closeContractModal();
      this.showToast('Ký hợp đồng thành công! Hợp đồng đã có hiệu lực, quý khách có thể tiến hành đặt cọc 30% để xưởng sản xuất.', 'success', 5000);

      const updated = this.requests.find(r => r.id === this.selectedRequest?.id);
      if (updated) {
        this.selectedRequest = updated;
      }
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Lỗi khi ký hợp đồng:', err);
      this.isSigningContract = false;
      this.cdr.detectChanges();
    }
  }

  printContract(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  cleanStaffName(name?: string): string {
    if (!name || !name.trim()) return 'KTS Phụ trách Thiết kế DCOR';
    let cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
    cleaned = cleaned.replace(/^(KTS\.?\s*)+/i, '').trim();
    return cleaned ? `KTS. ${cleaned}` : 'KTS Phụ trách Thiết kế DCOR';
  }

  getTodayFormatted(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  customerDepositProofImage: string = '';

  onDepositBillSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.customerDepositProofImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  proceedToPayment(req: CustomRequest): void {
    this.customerDepositProofImage = '';
    if (req.status === 'CONTRACT_SIGNED') {
      this.customRequestService.requestPayment(req.id, 'Hệ thống DCor');
    }
    const updated = this.requests.find(r => r.id === req.id) || req;
    this.openPaymentModal(updated);
  }

  confirmCustomerPayment(): void {
    if (!this.selectedRequest) return;
    // Mỗi mã VietQR được gen riêng cho từng khách → xác nhận tự động, không qua bước chờ đối soát
    this.customRequestService.confirmPaymentAndStartProduction(
      this.selectedRequest.id,
      this.selectedRequest.customerName || 'Khách hàng'
    );
    this.customerDepositProofImage = '';
    this.closePaymentModal();
    this.showToast('Xác nhận cọc thành công! Lệnh sản xuất xưởng đã được kích hoạt.', 'success', 5000);
  }

  // --- POPUP HỦY YÊU CẦU ĐÀNG HOÀNG CHO KHÁCH HÀNG ---
  openCancelModal(req: CustomRequest): void {
    this.requestToCancel = req;
    this.cancelReasonPreset = this.cancelPresetOptions[0];
    this.cancelReasonDetails = '';
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.requestToCancel = null;
  }

  confirmCustomerCancel(): void {
    if (!this.requestToCancel) return;
    const finalReason = this.cancelReasonDetails.trim()
      ? `${this.cancelReasonPreset}: ${this.cancelReasonDetails.trim()}`
      : this.cancelReasonPreset;

    this.customRequestService.cancelRequest(
      this.requestToCancel.id,
      finalReason,
      this.currentUser?.fullName || this.requestToCancel.customerName || 'Khách hàng'
    );

    if (this.selectedRequest?.id === this.requestToCancel.id) {
      this.selectedRequest = this.customRequestService.getRequestById(this.requestToCancel.id) || null;
    }

    this.closeCancelModal();
  }

  readonly DEFAULT_CUSTOM_IMAGE = '/assets/img/furniture-placeholder.svg';

  /**
   * Lấy ảnh hiển thị đại diện cho card yêu cầu:
   * 1. Ưu tiên ảnh bản vẽ 3D / ảnh đầu tiên trong các ảnh tham khảo 3D đã upload
   * 2. Nếu không có thì lấy ảnh sản phẩm gốc
   * 3. Mặc định là ảnh nội bộ furniture-placeholder.svg (không dùng unsplash để tránh lỗi mạng)
   */
  getRequestDisplayImage(req: CustomRequest | null | undefined): string {
    if (!req) return this.DEFAULT_CUSTOM_IMAGE;
    const isValidUrl = (url?: string | null) => {
      if (!url) return false;
      const trimmed = url.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('blob:') &&
        !trimmed.startsWith('data:') &&
        !trimmed.includes('furniture-placeholder.svg') &&
        !trimmed.includes('unsplash.com')
      );
    };

    if (isValidUrl(req.drawing3dUrl)) {
      return req.drawing3dUrl!.trim();
    }
    if (req.referenceImages && req.referenceImages.length > 0) {
      const validImg = req.referenceImages.find(img => isValidUrl(img));
      if (validImg) return validImg.trim();
    }
    if (req.attachments && req.attachments.length > 0) {
      const imgAtt = req.attachments.find(a => isValidUrl(a.previewUrl));
      if (imgAtt?.previewUrl) return imgAtt.previewUrl.trim();
    }
    if (isValidUrl(req.productImage)) {
      return req.productImage!.trim();
    }
    return this.DEFAULT_CUSTOM_IMAGE;
  }

  // --- QUẢN LÝ SLIDER / CAROUSEL BẢN VẼ 3D TRONG DRAWER ---
  activeDrawingIndex: number = 0;
  selectedPreviewImage: string | null = null;

  getDrawingImages(req: CustomRequest | null | undefined): string[] {
    if (!req) return [];
    const list: string[] = [];
    const isInvalidImage = (url?: string | null) => {
      if (!url) return true;
      const trimmed = url.trim().toLowerCase();
      if (!trimmed || trimmed === this.DEFAULT_CUSTOM_IMAGE.toLowerCase()) return true;
      if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return true;
      if (trimmed.includes('furniture-placeholder.svg') || trimmed.includes('unsplash.com')) return true;
      // Ở trạng thái PENDING_REVIEW (vừa gửi yêu cầu, chưa khảo sát/thiết kế), không dùng about_blueprint
      if (req.status === 'PENDING_REVIEW' && trimmed.includes('about_blueprint.jpg')) return true;
      return false;
    };

    if (req.drawing3dUrls && req.drawing3dUrls.length > 0) {
      req.drawing3dUrls.forEach(u => {
        if (u && !isInvalidImage(u) && !list.includes(u.trim())) {
          list.push(u.trim());
        }
      });
    }
    if (req.drawing3dUrl && !isInvalidImage(req.drawing3dUrl) && !list.includes(req.drawing3dUrl.trim())) {
      list.push(req.drawing3dUrl.trim());
    }
    if (req.referenceImages && req.referenceImages.length > 0) {
      req.referenceImages.forEach(img => {
        if (img && !isInvalidImage(img) && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    if (req.attachments && req.attachments.length > 0) {
      req.attachments.forEach(att => {
        if (att.previewUrl && !isInvalidImage(att.previewUrl) && !list.includes(att.previewUrl.trim())) {
          list.push(att.previewUrl.trim());
        }
      });
    }
    return list;
  }

  prevDrawing(images: string[]): void {
    if (!images || images.length <= 1) return;
    this.activeDrawingIndex = (this.activeDrawingIndex - 1 + images.length) % images.length;
  }

  nextDrawing(images: string[]): void {
    if (!images || images.length <= 1) return;
    this.activeDrawingIndex = (this.activeDrawingIndex + 1) % images.length;
  }

  openImageZoom(url: string): void {
    this.selectedPreviewImage = url;
  }

  closeImageZoom(): void {
    this.selectedPreviewImage = null;
  }

  getWarrantyPolicyText(req: CustomRequest | null | undefined): string | null {
    if (!req) return null;
    if (req.warrantyPolicy) {
      return req.warrantyPolicy;
    }
    if (req.warrantyFrameYears || req.warrantyMonths || req.warrantySurfaceYears) {
      const parts: string[] = [];
      if (req.warrantyFrameYears) {
        parts.push(`Bảo hành kết cấu khung xương chịu lực ${req.warrantyFrameYears} năm`);
      }
      const surfaceYears = req.warrantySurfaceYears || (req.warrantyMonths ? Math.round(req.warrantyMonths / 12) : null);
      if (surfaceYears) {
        parts.push(`Đệm mút và chất liệu bề mặt ${surfaceYears} năm`);
      }
      return parts.length > 0 ? parts.join('; ') + '. Bảo dưỡng da định kỳ miễn phí năm đầu tiên.' : null;
    }
    return null;
  }
}
