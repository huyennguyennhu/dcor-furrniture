import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, 
  Filter, 
  FileText, 
  PhoneCall, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Package, 
  Pencil, 
  Clock, 
  Ruler, 
  Layers, 
  Palette, 
  X, 
  Upload, 
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  QrCode,
  MapPin,
  Download,
  Truck,
  ClipboardCheck,
  BadgeCheck,
  Plus
} from 'lucide-angular';
import { 
  CustomRequestService, 
  CustomRequest, 
  CustomRequestStatus, 
  CUSTOM_STATUS_MAP, 
  StatusMeta 
} from '../../../../core/services/custom-request.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-custom-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './custom-requests.html',
  styleUrl: './custom-requests.css',
})
export class AdminCustomRequestsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Search,
    Filter,
    FileText,
    PhoneCall,
    Eye,
    CheckCircle2,
    XCircle,
    DollarSign,
    Package,
    Pencil,
    Clock,
    Ruler,
    Layers,
    Palette,
    X,
    Upload,
    AlertCircle,
    ChevronDown,
    ExternalLink,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Building2,
    FileSpreadsheet,
    QrCode,
    MapPin,
    Download,
    Truck,
    ClipboardCheck,
    BadgeCheck,
    Plus
  };

  requests: CustomRequest[] = [];
  selectedTab: 'ALL' | CustomRequestStatus = 'ALL';
  searchQuery: string = '';

  // Dropdown filter states
  activeDropdown: 'NONE' | 'architect' | 'category' | 'price' = 'NONE';
  selectedArchitect: string = 'ALL';
  selectedCategory: string = 'ALL';
  selectedPriceRange: string = 'ALL';

  // Checkbox selection state
  selectedRequestIds = new Set<string>();

  // Active Modals theo quy trình Flowchart
  activeModal: 'NONE' | 'SURVEY' | 'QUOTE' | 'CONTRACT' | 'VIETQR' | 'DETAIL' | 'CANCEL' | 'QC' | 'DELIVERY' | 'CREATE' = 'NONE';
  activeRequest: CustomRequest | null = null;

  // Cấu hình form tạo đơn Custom (Đồng bộ chuẩn 100% như form phía User)
  readonly popularColors = [
    { name: 'Nâu Cognac Ý', hex: '#8B4513' },
    { name: 'Nâu Espresso', hex: '#3B2819' },
    { name: 'Kem Sand Luxury', hex: '#E8DFC8' },
    { name: 'Xám Khói Modern', hex: '#71717A' },
    { name: 'Xanh Sage Tự Nhiên', hex: '#607274' },
    { name: 'Xanh Navy Thượng Lưu', hex: '#1E293B' },
    { name: 'Đen Noir Quyền Lực', hex: '#18181B' },
    { name: 'Cam Terracotta', hex: '#BC5F13' }
  ];

  readonly materialsList: string[] = [
    'Da bò Ý nguyên tấm (Full Grain)',
    'Da bò Ý cao cấp (Top Grain)',
    'Da Microfiber sinh học kháng nước',
    'Vải nỉ dệt thô sợi Bỉ chống bám bụi',
    'Vải nỉ nhung tuyết cao cấp',
    'Gỗ óc chó Bắc Mỹ nguyên khối (Walnut)',
    'Gỗ sồi trắng Nga (White Oak)',
    'Đá cẩm thạch Calacatta / Thạch anh tự nhiên'
  ];

  readonly legMaterialsList: string[] = [
    'Kim loại sơn tĩnh điện đen mờ chống xước',
    'Inox 304 mạ PVD vàng Champagne bóng gương',
    'Gỗ sồi tự nhiên tiện tròn phong cách Bắc Âu',
    'Khung chân ẩn giấu viền tạo hiệu ứng lơ lửng'
  ];

  readonly catalogProducts = [
    {
      id: 'prod-roma-italy',
      sku: 'DCOR-SOFA-01',
      name: 'Sofa Roma Da Bò Ý Nguyên Tấm Luxury',
      categoryName: 'Sofa Da Thật',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      price: 45000000,
      length: 280,
      width: 100,
      height: 85
    },
    {
      id: 'prod-milano-l',
      sku: 'DCOR-SOFA-02',
      name: 'Sofa Góc Chữ L Milano Tối Giản Hiện Đại',
      categoryName: 'Sofa May Đo',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80',
      price: 52000000,
      length: 300,
      width: 175,
      height: 82
    },
    {
      id: 'prod-nordic-fabric',
      sku: 'DCOR-SOFA-03',
      name: 'Sofa Văng 3 Chỗ Vải Nỉ Bỉ Cao Cấp Nordic',
      categoryName: 'Sofa Nỉ Bỉ',
      image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
      price: 26000000,
      length: 220,
      width: 90,
      height: 80
    },
    {
      id: 'prod-calacatta-table',
      sku: 'DCOR-TAB-01',
      name: 'Bàn Trà Mặt Đá Cẩm Thạch Calacatta Chân PVD',
      categoryName: 'Bàn Trà Custom',
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
      price: 18500000,
      length: 130,
      width: 70,
      height: 42
    },
    {
      id: 'prod-lounge-chair',
      sku: 'DCOR-ARM-01',
      name: 'Ghế Bành Thư Giãn Ergonomic Khung Kim Loại',
      categoryName: 'Ghế Thư Giãn',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
      price: 14000000,
      length: 90,
      width: 85,
      height: 98
    },
    {
      id: 'prod-dining-walnut',
      sku: 'DCOR-DIN-01',
      name: 'Bàn Ăn Gỗ Óc Chó Bắc Mỹ Tự Nhiên Nguyên Khối',
      categoryName: 'Bàn Ăn',
      image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80',
      price: 32000000,
      length: 200,
      width: 90,
      height: 75
    }
  ];

  // State các trường của form tạo đơn Custom
  formProductType: 'template' | 'custom' = 'template';
  productSearchQuery: string = '';
  selectedProduct: any = this.catalogProducts[0];
  formCustomProductName: string = '';
  formLength: number = 280;
  formWidth: number = 100;
  formHeight: number = 85;
  formSelectedColorName: string = 'Nâu Cognac Ý';
  formColorHex: string = '#8B4513';
  formMaterial: string = 'Da bò Ý nguyên tấm (Full Grain)';
  formLegMaterial: string = 'Kim loại sơn tĩnh điện đen mờ chống xước';
  formNotes: string = '';
  formReferenceImageUrl: string = '';
  formSurveyTime: string = 'Thứ 7 tuần này (09:00 - 11:30 sáng)';
  formRoomSpace: string = 'Phòng khách căn hộ chung cư Vinhomes Golden River (85m²)';
  formDeliveryDate: string = 'Trước 25/11/2026 (khoảng 20 ngày)';
  formCustomerName: string = '';
  formCustomerPhone: string = '';
  formCustomerEmail: string = '';
  formCustomerAddress: string = '';

  get filteredCatalogProducts() {
    if (!this.productSearchQuery.trim()) return this.catalogProducts;
    const q = this.productSearchQuery.toLowerCase().trim();
    return this.catalogProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }

  selectProduct(p: any): void {
    this.selectedProduct = p;
    this.formLength = p.length;
    this.formWidth = p.width;
    this.formHeight = p.height;
  }

  selectColor(c: any): void {
    this.formSelectedColorName = c.name;
    this.formColorHex = c.hex;
  }

  // Form states cho từng bước quy trình
  // Bước 1: Khảo sát đo đạc mặt bằng
  surveyForm = {
    staffName: 'KTS. Lê Nam (DCor Studio)',
    surveyDate: new Date().toISOString().slice(0, 10),
    elevatorClearance: 'Thang máy hàng 2.4m x 1.6m - Đạt tiêu chuẩn',
    measuredDimensions: '',
    notes: 'Đã gọi điện chốt lịch khảo sát đo đạc thực tế tại căn hộ khách hàng.'
  };

  // Bước 2: Báo giá & Phối cảnh 3D
  quoteForm = {
    price: 35000000,
    deposit: 10500000,
    drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    notes: 'Khung gỗ sồi tự nhiên sấy tiêu chuẩn Châu Âu. Đệm mút D40 êm ái chống xẹp lún. May chỉ kép nổi bật.',
    staffName: 'KTS. Lê Nam (DCor Studio)'
  };

  // Bước 3: Hợp đồng may đo
  contractForm = {
    contractNumber: 'HĐ-2026/DCOR-',
    scanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    staffName: 'Phòng Pháp Chế & Hợp Đồng DCor'
  };

  // Bước 4: VietQR cọc 30%
  vietQrUrl: string = '';
  vietQrAmount: number = 0;
  vietQrMessage: string = '';

  // Nhánh 2 - Chặng 1: Nghiệm thu QC May đo 4 tiêu chí khắt khe
  qcForm = {
    staffName: 'KTS. Lê Nam (Trưởng bộ phận QC)',
    dimensionAccuracy: true,
    surfaceFinish: true,
    cushionStitching: true,
    packagingProtection: true,
    notes: 'Kích thước sai số < 3mm, bề mặt da căng mịn không lỗi vết, khung chịu lực vững chắc, màng PE bọc 3 lớp.'
  };

  // Nhánh 2 - Chặng 2: Giao hàng, thu 70% còn lại & Kích hoạt Bảo hành
  deliveryForm = {
    staffName: 'Điều phối viên DCOR Studio',
    remainingAmount: 0,
    warrantyCode: 'BH-DCOR-',
    customerSignedHandover: true,
    warrantyYears: 5,
    notes: 'Đã bàn giao lắp đặt hoàn thiện tại nhà khách hàng, kiểm tra vận hành trơn tru và kích hoạt tem bảo hành điện tử chính hãng.'
  };

  // Form Hủy đơn
  cancelForm = {
    reason: 'Khách hàng thay đổi ý định / kế hoạch kinh phí',
    staffName: 'Admin'
  };

  readonly cancelPresetReasons = [
    'Khách hàng thay đổi kế hoạch kinh phí',
    'Kích thước thực tế không vừa thang máy / cửa vào',
    'Khách đổi sang mẫu nội thất sẵn có tại showroom',
    'Không liên hệ được khách hàng qua điện thoại/email',
    'Khách hủy yêu cầu theo nguyện vọng cá nhân'
  ];

  // Toast Notification System
  toast: {
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    actionLink?: string;
    actionText?: string;
  } = {
    show: false,
    title: '',
    message: '',
    type: 'info'
  };
  private toastTimer: any = null;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private sub?: Subscription;

  constructor(
    public customRequestService: CustomRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.customRequestService.requests$.subscribe(items => {
      this.requests = items;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.activeDropdown = 'NONE';
    }
  }

  toggleDropdown(name: 'architect' | 'category' | 'price', event: MouseEvent): void {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === name ? 'NONE' : name;
  }

  // Checkbox handlers
  get isAllSelected(): boolean {
    return this.filteredRequests.length > 0 && 
           this.filteredRequests.every(r => this.selectedRequestIds.has(r.id));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedRequestIds.clear();
    } else {
      this.filteredRequests.forEach(r => this.selectedRequestIds.add(r.id));
    }
  }

  toggleSelectRow(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.selectedRequestIds.has(id)) {
      this.selectedRequestIds.delete(id);
    } else {
      this.selectedRequestIds.add(id);
    }
  }

  // Filter labels
  get selectedArchitectLabel(): string {
    if (this.selectedArchitect === 'ALL') return 'Tất cả KTS phụ trách';
    return this.selectedArchitect;
  }

  get selectedCategoryLabel(): string {
    if (this.selectedCategory === 'ALL') return 'Tất cả hạng mục';
    return this.selectedCategory;
  }

  get selectedPriceLabel(): string {
    if (this.selectedPriceRange === 'ALL') return 'Tất cả ngân sách';
    if (this.selectedPriceRange === 'UNDER_20') return 'Dưới 20 triệu';
    if (this.selectedPriceRange === '20_TO_50') return 'Từ 20 - 50 triệu';
    if (this.selectedPriceRange === 'OVER_50') return 'Trên 50 triệu';
    return 'Tất cả ngân sách';
  }

  get hasActiveFilters(): boolean {
    return this.selectedArchitect !== 'ALL' || 
           this.selectedCategory !== 'ALL' || 
           this.selectedPriceRange !== 'ALL' || 
           !!this.searchQuery.trim();
  }

  resetAllFilters(): void {
    this.selectedArchitect = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedPriceRange = 'ALL';
    this.searchQuery = '';
    this.activeDropdown = 'NONE';
  }

  // Sorting
  toggleColumnSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredRequests(): CustomRequest[] {
    const list = this.requests.filter(req => {
      // Tab filter
      if (this.selectedTab !== 'ALL' && req.status !== this.selectedTab) {
        return false;
      }
      // Dropdown Architect
      if (this.selectedArchitect !== 'ALL') {
        if (!req.assignedStaff || !req.assignedStaff.includes(this.selectedArchitect)) {
          return false;
        }
      }
      // Dropdown Category
      if (this.selectedCategory !== 'ALL') {
        if (!req.categoryName || !req.categoryName.includes(this.selectedCategory)) {
          return false;
        }
      }
      // Dropdown Price Range
      if (this.selectedPriceRange !== 'ALL') {
        const p = req.quotedPrice || 0;
        if (this.selectedPriceRange === 'UNDER_20' && p >= 20000000) return false;
        if (this.selectedPriceRange === '20_TO_50' && (p < 20000000 || p > 50000000)) return false;
        if (this.selectedPriceRange === 'OVER_50' && p <= 50000000) return false;
      }
      // Search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchCode = req.code.toLowerCase().includes(query);
        const matchProduct = req.productName.toLowerCase().includes(query);
        const matchCustomer = req.customerName.toLowerCase().includes(query);
        const matchPhone = req.customerPhone.includes(query);
        const matchColor = req.colorName?.toLowerCase().includes(query) || false;
        const matchMat = req.material?.toLowerCase().includes(query) || false;
        return matchCode || matchProduct || matchCustomer || matchPhone || matchColor || matchMat;
      }
      return true;
    });

    if (!this.sortColumn) return list;
    return list.sort((a, b) => {
      let diff = 0;
      if (this.sortColumn === 'code') {
        diff = a.code.localeCompare(b.code, 'vi');
      } else if (this.sortColumn === 'date') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        diff = timeA - timeB;
      } else if (this.sortColumn === 'customer') {
        diff = a.customerName.localeCompare(b.customerName, 'vi');
      } else if (this.sortColumn === 'product') {
        diff = a.productName.localeCompare(b.productName, 'vi');
      } else if (this.sortColumn === 'material') {
        const matA = (a.material || '') + ' ' + (a.colorName || '');
        const matB = (b.material || '') + ' ' + (b.colorName || '');
        diff = matA.localeCompare(matB, 'vi');
      } else if (this.sortColumn === 'price') {
        const pA = a.quotedPrice || 0;
        const pB = b.quotedPrice || 0;
        diff = pA - pB;
      } else if (this.sortColumn === 'status') {
        diff = a.status.localeCompare(b.status, 'vi');
      }
      return this.sortDirection === 'asc' ? diff : -diff;
    });
  }

  getStatusMeta(status: CustomRequestStatus): StatusMeta {
    return CUSTOM_STATUS_MAP[status];
  }

  getTabCount(tab: 'ALL' | CustomRequestStatus): number {
    if (tab === 'ALL') return this.requests.length;
    return this.requests.filter(r => r.status === tab).length;
  }

  // KPI Calculations
  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'PENDING_REVIEW').length;
  }

  get consultingCount(): number {
    return this.requests.filter(r => r.status === 'CONSULTING').length;
  }

  get quotedCount(): number {
    return this.requests.filter(r => r.status === 'QUOTED').length;
  }

  get contractCount(): number {
    return this.requests.filter(r => r.status === 'AWAITING_CONTRACT' || r.status === 'CONTRACT_SIGNED').length;
  }

  get awaitingPaymentCount(): number {
    return this.requests.filter(r => r.status === 'AWAITING_PAYMENT').length;
  }

  get processingCount(): number {
    return this.requests.filter(r => r.status === 'PROCESSING').length;
  }

  get qcCount(): number {
    return this.requests.filter(r => r.status === 'QC_PASSED').length;
  }

  get completedCount(): number {
    return this.requests.filter(r => r.status === 'COMPLETED').length;
  }

  // --- ACTIONS THEO TỪNG BƯỚC QUY TRÌNH FLOWCHART ---

  /** Mở popup tạo mới hồ sơ đơn Custom chuẩn UI User */
  openCreateModal(): void {
    this.formProductType = 'template';
    this.productSearchQuery = '';
    this.selectedProduct = this.catalogProducts[0];
    this.formCustomProductName = '';
    this.formLength = this.catalogProducts[0].length;
    this.formWidth = this.catalogProducts[0].width;
    this.formHeight = this.catalogProducts[0].height;
    this.formSelectedColorName = 'Nâu Cognac Ý';
    this.formColorHex = '#8B4513';
    this.formMaterial = 'Da bò Ý nguyên tấm (Full Grain)';
    this.formLegMaterial = 'Kim loại sơn tĩnh điện đen mờ chống xước';
    this.formNotes = '';
    this.formReferenceImageUrl = '';
    this.formSurveyTime = 'Thứ 7 tuần này (09:00 - 11:30 sáng)';
    this.formRoomSpace = 'Phòng khách căn hộ chung cư Vinhomes Golden River (85m²)';
    this.formDeliveryDate = 'Trước 25/11/2026 (khoảng 20 ngày)';
    this.formCustomerName = '';
    this.formCustomerPhone = '';
    this.formCustomerEmail = '';
    this.formCustomerAddress = '';
    this.activeModal = 'CREATE';
  }

  submitCreate(): void {
    if (!this.formCustomerName.trim() || !this.formCustomerPhone.trim()) {
      alert('Vui lòng nhập họ tên khách hàng và số điện thoại liên hệ!');
      return;
    }

    const finalProductName = this.formProductType === 'template'
      ? (this.selectedProduct?.name || 'Sản phẩm mẫu DCor Custom')
      : (this.formCustomProductName.trim() || 'Sản phẩm thiết kế độc bản theo yêu cầu');

    const finalImage = this.formProductType === 'template' && this.selectedProduct?.image
      ? this.selectedProduct.image
      : (this.formReferenceImageUrl.trim() || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80');

    const finalSku = this.formProductType === 'template' && this.selectedProduct?.sku
      ? this.selectedProduct.sku
      : 'DCOR-CUSTOM';

    const finalCategory = this.formProductType === 'template' && this.selectedProduct?.categoryName
      ? this.selectedProduct.categoryName
      : 'Thiết Kế Độc Bản';

    const refImages = this.formReferenceImageUrl.trim() ? [this.formReferenceImageUrl.trim()] : [];

    const newReq = this.customRequestService.createRequest({
      customerName: this.formCustomerName.trim(),
      customerPhone: this.formCustomerPhone.trim(),
      customerEmail: this.formCustomerEmail.trim(),
      customerAddress: this.formCustomerAddress.trim(),
      productName: finalProductName,
      productSku: finalSku,
      productImage: finalImage,
      categoryName: finalCategory,
      length: Number(this.formLength) || 0,
      width: Number(this.formWidth) || 0,
      height: Number(this.formHeight) || 0,
      colorName: this.formSelectedColorName,
      colorHex: this.formColorHex,
      material: this.formMaterial,
      legMaterial: this.formLegMaterial,
      notes: this.formNotes.trim(),
      referenceImages: refImages,
      preferredSurveyTime: this.formSurveyTime.trim() || 'Thứ 7 tuần này (09:00 - 11:30 sáng)',
      roomSpace: this.formRoomSpace.trim() || 'Phòng khách căn hộ chung cư',
      expectedDeliveryDate: this.formDeliveryDate.trim() || 'Trước 20-30 ngày',
      isPhoneVerified: true
    });

    this.showToast(
      'Tạo đơn Custom thành công',
      `Đã khởi tạo hồ sơ Custom ${newReq.code} cho khách hàng ${newReq.customerName}.`,
      'success',
      `/admin/custom-requests/${newReq.id}`
    );
    this.closeModal();
  }

  /** Bước 1: Mở modal tiếp nhận khảo sát đo đạc */
  openSurveyModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.surveyForm.staffName = req.assignedStaff || 'KTS. Lê Nam (DCor Studio)';
    this.surveyForm.measuredDimensions = `Dài ${req.length || 0} x Rộng ${req.width || 0} x Cao ${req.height || 0} cm`;
    this.surveyForm.notes = req.notes || 'Đã liên hệ xác nhận kích thước và hẹn khảo sát thực tế tại nhà khách.';
    this.activeModal = 'SURVEY';
  }

  submitSurvey(): void {
    if (!this.activeRequest) return;
    this.customRequestService.startConsulting(
      this.activeRequest.id, 
      this.surveyForm.staffName,
      `[Khảo sát] ${this.surveyForm.notes} - Kích thước chốt: ${this.surveyForm.measuredDimensions} (${this.surveyForm.elevatorClearance})`
    );
    this.showToast(
      'Tiếp nhận khảo sát thành công', 
      `Hồ sơ ${this.activeRequest.code} đã chuyển sang chặng Đang khảo sát đo đạc.`,
      'success'
    );
    this.closeModal();
  }

  /** Bước 2: Mở modal lập dự toán báo giá & Upload 3D */
  openQuoteModal(req: CustomRequest): void {
    this.activeRequest = req;
    const baseP = req.quotedPrice || 35000000;
    this.quoteForm.price = baseP;
    this.quoteForm.deposit = req.quotedDeposit || Math.round(baseP * 0.3);
    this.quoteForm.drawing3dUrl = req.drawing3dUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80';
    this.quoteForm.notes = req.adminNotes || 'Khung sườn gỗ sồi tự nhiên sấy tiêu chuẩn Châu Âu. Đệm mút D40 êm ái chống xẹp lún. May chỉ kép nổi bật.';
    this.quoteForm.staffName = req.assignedStaff || 'KTS. Lê Nam (DCor Studio)';
    this.activeModal = 'QUOTE';
  }

  onQuotePriceChange(): void {
    this.quoteForm.deposit = Math.round((this.quoteForm.price || 0) * 0.3);
  }

  submitQuote(): void {
    if (!this.activeRequest) return;
    this.customRequestService.sendQuote(this.activeRequest.id, {
      quotedPrice: this.quoteForm.price,
      quotedDeposit: this.quoteForm.deposit,
      drawing3dUrl: this.quoteForm.drawing3dUrl,
      notes: this.quoteForm.notes,
      staffName: this.quoteForm.staffName
    });
    this.showToast(
      'Gửi báo giá & 3D thành công',
      `Đã phát hành báo giá ${new Intl.NumberFormat('vi-VN').format(this.quoteForm.price)} đ và bản vẽ 3D cho khách hàng ${this.activeRequest.customerName}.`,
      'success'
    );
    this.closeModal();
  }

  /** Bước 3: Phát hành & Ký hợp đồng may đo */
  openContractModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.contractForm.contractNumber = `HĐ-2026/DCOR-${req.code.replace('CR-', '')}`;
    this.contractForm.scanUrl = req.contractScanUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';
    this.contractForm.staffName = 'Phòng Hợp Đồng DCor';
    this.activeModal = 'CONTRACT';
  }

  submitContractStep(isSigned: boolean): void {
    if (!this.activeRequest) return;
    if (isSigned) {
      this.customRequestService.confirmContractSigned(
        this.activeRequest.id,
        this.contractForm.scanUrl,
        this.contractForm.staffName
      );
      this.showToast(
        'Xác nhận hợp đồng đã ký',
        `Hợp đồng ${this.contractForm.contractNumber} đã được ký kết và lưu bản scan vào kho lưu trữ.`,
        'success'
      );
    } else {
      this.customRequestService.prepareContract(
        this.activeRequest.id,
        this.contractForm.staffName
      );
      this.showToast(
        'Phát hành hợp đồng thành công',
        `Đã tạo bản thảo hợp đồng ${this.contractForm.contractNumber} và gửi link xem trước cho khách.`,
        'info'
      );
    }
    this.closeModal();
  }

  /** Bước 4: Mở modal sinh mã VietQR cọc 30% */
  openVietQrModal(req: CustomRequest): void {
    this.activeRequest = req;
    const dep = req.quotedDeposit || Math.round((req.quotedPrice || 35000000) * 0.3);
    this.vietQrAmount = dep;
    this.vietQrMessage = `COC ${req.code} ${req.customerPhone.slice(-4)}`;
    // VietQR URL động chuẩn ngân hàng
    this.vietQrUrl = `https://img.vietqr.io/image/970415-1133668899-compact2.png?amount=${dep}&addInfo=${encodeURIComponent(this.vietQrMessage)}&accountName=CONG%20TY%20NOI%20THAT%20DCOR%20STUDIO`;
    this.activeModal = 'VIETQR';
  }

  confirmVietQrIssued(): void {
    if (!this.activeRequest) return;
    this.customRequestService.requestPayment(this.activeRequest.id, 'Kế toán DCor');
    this.showToast(
      'Đã kích hoạt chờ cọc 30%',
      `Mã VietQR cọc ${new Intl.NumberFormat('vi-VN').format(this.vietQrAmount)} đ đã được gửi đến khách hàng ${this.activeRequest.customerName}.`,
      'info'
    );
    this.closeModal();
  }

  /** Bước 5: KẾ TOÁN XÁC NHẬN NHẬN CỌC -> TỰ ĐỘNG SINH ĐƠN HÀNG & BẮN XƯỞNG SẢN XUẤT */
  onConfirmAccountingDeposit(req: CustomRequest): void {
    const depositTxt = new Intl.NumberFormat('vi-VN').format(req.quotedDeposit || Math.round((req.quotedPrice || 35000000) * 0.3));
    const confirmMsg = `XÁC NHẬN KẾ TOÁN ĐÃ NHẬN TIỀN CỌC 30% (${depositTxt} đ) CHO ĐƠN ${req.code}?\n\n• Hệ thống sẽ tự động sinh ĐƠN HÀNG CHÍNH THỨC bên /admin/orders.\n• Tự động sinh Lệnh xuất kho vật tư bên /admin/inventory/transactions.\n• Tự động bắn Lệnh sản xuất (Work Order) xuống Xưởng mộc.`;
    
    if (confirm(confirmMsg)) {
      const res = this.customRequestService.confirmPaymentAndStartProduction(req.id, 'Kế toán Trưởng DCor');
      if (res) {
        this.showToast(
          'Đã nhận cọc 30% & Tự động sinh Đơn hàng thành công!',
          `Đã tạo đơn chính thức: ${res.generatedOrderNumber} và lệnh sản xuất xưởng ${res.workOrderCode}.`,
          'success',
          '/admin/orders',
          'Xem Đơn hàng vừa tạo'
        );
      }
    }
  }

  /** Nhánh 2: Mở modal nghiệm thu QC May đo 4 tiêu chí khắt khe */
  openQcModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.qcForm.dimensionAccuracy = true;
    this.qcForm.surfaceFinish = true;
    this.qcForm.cushionStitching = true;
    this.qcForm.packagingProtection = true;
    this.qcForm.staffName = 'KTS. Lê Nam (Trưởng bộ phận QC)';
    this.qcForm.notes = `Kích thước chuẩn bản vẽ 3D (dài ${req.length}cm, rộng ${req.width}cm, cao ${req.height}cm). Bề mặt chất liệu ${req.material} đạt điểm 10 hoàn mỹ. Đã bọc xốp góc chống sốc.`;
    this.activeModal = 'QC';
  }

  submitQcInspection(): void {
    if (!this.activeRequest) return;
    if (!this.qcForm.dimensionAccuracy || !this.qcForm.surfaceFinish || !this.qcForm.cushionStitching || !this.qcForm.packagingProtection) {
      alert('Yêu cầu sản phẩm may đo phải đạt đầy đủ 4/4 tiêu chí kỹ thuật trước khi thông qua QC.');
      return;
    }

    this.customRequestService.passQcInspection(
      this.activeRequest.id,
      {
        dimensionAccuracy: this.qcForm.dimensionAccuracy,
        surfaceFinish: this.qcForm.surfaceFinish,
        cushionStitching: this.qcForm.cushionStitching,
        packagingProtection: this.qcForm.packagingProtection
      },
      this.qcForm.staffName,
      this.qcForm.notes
    );

    this.showToast(
      'Nghiệm thu QC May đo đạt chuẩn!',
      `Hồ sơ ${this.activeRequest.code} đã đạt 4 tiêu chí khắt khe và sẵn sàng xuất xưởng bàn giao.`,
      'success'
    );
    this.closeModal();
  }

  /** Nhánh 2: Mở modal Giao hàng, thu 70% còn lại & Kích hoạt Bảo hành */
  openDeliveryModal(req: CustomRequest): void {
    this.activeRequest = req;
    const total = req.quotedPrice || 35000000;
    const deposit = req.quotedDeposit || Math.round(total * 0.3);
    this.deliveryForm.remainingAmount = total - deposit;
    this.deliveryForm.warrantyCode = `BH-DCOR-${req.code.replace('CR-', '')}`;
    this.deliveryForm.customerSignedHandover = true;
    this.deliveryForm.warrantyYears = 5;
    this.deliveryForm.notes = `Đã vận chuyển an toàn đến địa chỉ ${req.customerAddress || 'nhà khách hàng'}, lắp đặt hoàn thiện và bàn giao chứng thư bảo hành.`;
    this.activeModal = 'DELIVERY';
  }

  submitDeliveryWarranty(): void {
    if (!this.activeRequest) return;
    const res = this.customRequestService.completeDeliveryAndWarranty(
      this.activeRequest.id,
      this.deliveryForm.staffName
    );

    if (res) {
      this.showToast(
        'Hoàn tất bàn giao & Kích hoạt Bảo hành thành công!',
        `Đã thu đủ 70% (${new Intl.NumberFormat('vi-VN').format(this.deliveryForm.remainingAmount)} đ) và kích hoạt tem bảo hành ${res.warrantyCode}.`,
        'success',
        '/admin/orders',
        'Xem Đơn hàng đã hoàn tất'
      );
    }
    this.closeModal();
  }

  // Detail Modal
  openDetailModal(req: CustomRequest): void {
    this.router.navigate(['/admin/custom-requests', req.code || req.id]);
  }

  // Cancel Modal
  openCancelModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.cancelForm.reason = this.cancelPresetReasons[0];
    this.activeModal = 'CANCEL';
  }

  submitCancel(): void {
    if (!this.activeRequest) return;
    this.customRequestService.cancelRequest(
      this.activeRequest.id, 
      this.cancelForm.reason, 
      this.cancelForm.staffName
    );
    this.showToast(
      'Đã hủy hồ sơ may đo',
      `Hồ sơ ${this.activeRequest.code} đã kết thúc xử lý.`,
      'error'
    );
    this.closeModal();
  }

  closeModal(): void {
    this.activeModal = 'NONE';
    this.activeRequest = null;
  }

  getDepositAmount(req: CustomRequest | null): number {
    if (!req) return 0;
    return req.quotedDeposit || Math.round((req.quotedPrice || 35000000) * 0.3);
  }

  // Toast Helper
  showToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'info', actionLink?: string, actionText?: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = {
      show: true,
      title,
      message,
      type,
      actionLink,
      actionText
    };
    this.toastTimer = setTimeout(() => {
      this.toast.show = false;
    }, 7000);
  }

  closeToast(): void {
    this.toast.show = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // Stepper Timeline Helper (Chuẩn format trang Chi tiết đơn hàng)
  readonly STEP_FLOW: { key: string; label: string; sub: string; statuses: CustomRequestStatus[] }[] = [
    { key: 'PENDING', label: 'Tiếp nhận mới', sub: 'Chờ nhận việc', statuses: ['PENDING_REVIEW'] },
    { key: 'CONSULTING', label: 'Khảo sát đo đạc', sub: 'Đo mặt bằng', statuses: ['CONSULTING'] },
    { key: 'QUOTED', label: 'Báo giá & 3D', sub: 'Phối cảnh 3D', statuses: ['QUOTED'] },
    { key: 'CONTRACT', label: 'Hợp đồng may đo', sub: 'Ký kết & lưu scan', statuses: ['AWAITING_CONTRACT', 'CONTRACT_SIGNED'] },
    { key: 'PAYMENT', label: 'Nhận cọc 30%', sub: 'VietQR & Kế toán', statuses: ['AWAITING_PAYMENT'] },
    { key: 'PROCESSING', label: 'Sản xuất xưởng', sub: 'Lệnh xưởng', statuses: ['PROCESSING'] },
    { key: 'QC', label: 'Nghiệm thu QC', sub: 'Đạt 4 tiêu chuẩn', statuses: ['QC_PASSED'] },
    { key: 'COMPLETED', label: 'Hoàn tất & BH', sub: 'Bàn giao & BH 5 năm', statuses: ['COMPLETED'] }
  ];

  getCurrentStepIndex(status?: CustomRequestStatus): number {
    if (!status) return 0;
    if (status === 'CANCELLED') return -1;
    const idx = this.STEP_FLOW.findIndex(s => s.statuses.includes(status));
    return idx >= 0 ? idx : 0;
  }

  isDetailStepDone(stepIndex: number): boolean {
    if (!this.activeRequest) return false;
    if (this.activeRequest.status === 'CANCELLED') return false;
    if (this.activeRequest.status === 'COMPLETED') return true;
    const current = this.getCurrentStepIndex(this.activeRequest.status);
    return stepIndex < current;
  }

  isDetailStepActive(stepIndex: number): boolean {
    if (!this.activeRequest) return false;
    if (this.activeRequest.status === 'CANCELLED') return false;
    if (this.activeRequest.status === 'COMPLETED') return stepIndex === this.STEP_FLOW.length - 1;
    const current = this.getCurrentStepIndex(this.activeRequest.status);
    return stepIndex === current;
  }

  isDetailLineDone(lineIndex: number): boolean {
    if (!this.activeRequest) return false;
    if (this.activeRequest.status === 'CANCELLED') return false;
    if (this.activeRequest.status === 'COMPLETED') return true;
    const current = this.getCurrentStepIndex(this.activeRequest.status);
    return lineIndex < current;
  }

  goToOrder(orderNumber: string): void {
    this.router.navigate(['/admin/orders'], { queryParams: { q: orderNumber } });
  }

  goToInventoryTx(reqCode: string): void {
    this.router.navigate(['/admin/inventory/transactions'], { queryParams: { q: reqCode } });
  }

  getActorDisplay(item: any): string {
    if (!item) return '';
    let actor = (item.performedBy || '').trim();
    if (
      item.status === 'PENDING_REVIEW' || 
      item.title?.toLowerCase().includes('khách hàng') ||
      (this.activeRequest && actor && actor.toLowerCase() === this.activeRequest.customerName?.toLowerCase())
    ) {
      const custName = this.activeRequest?.customerName || actor;
      return `Khách hàng (${custName})`;
    }
    actor = actor.replace(/\s*\(DCor Studio\)/gi, '').trim();
    return actor || 'Ban Quản Trị DCOR';
  }
}
