import { Component, OnInit, OnDestroy } from '@angular/core';
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
  AlertTriangle
} from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
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
    AccountSidebarComponent, 
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
    AlertTriangle
  };

  requests: CustomRequest[] = [];
  searchQuery = '';
  activeTab: 'ALL' | 'CONSULTING' | 'QUOTED' | 'PROCESSING' | 'CANCELLED' = 'ALL';
  copyFeedback = '';

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
      id: 'prod-master-bed',
      sku: 'DCOR-BED-01',
      name: 'Giường Ngủ Master Bọc Da Nappa Đầu Giường',
      categoryName: 'Giường Ngủ',
      image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=600&q=80',
      price: 36000000,
      length: 215,
      width: 190,
      height: 115
    },
    {
      id: 'prod-dining-walnut',
      sku: 'DCOR-DIN-01',
      name: 'Bàn Ăn 8 Ghế Gỗ Óc Chó Tự Nhiên Bắc Mỹ',
      categoryName: 'Bàn Ăn Custom',
      image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
      price: 48000000,
      length: 220,
      width: 100,
      height: 76
    },
    {
      id: 'prod-tv-cabinet',
      sku: 'DCOR-CAB-01',
      name: 'Kệ Tivi Treo Tường Bo Cong Gỗ Sồi Sơn Bệt',
      categoryName: 'Tủ Kệ Custom',
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
      price: 16500000,
      length: 240,
      width: 40,
      height: 45
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
    private authService: AuthService
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
          this.dcorProducts = raw.map((p: any) => ({
            id: String(p.id || p._id || p.sku),
            sku: p.sku || ('DCOR-' + String(p.id || '').slice(-4).toUpperCase()),
            name: p.name || 'Sản phẩm DCor',
            categoryName: p.category?.name || p.categoryName || 'Nội thất DCor',
            image: (Array.isArray(p.images) && p.images[0]) || p.imageUrl || p.thumbnail || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
            price: Number(p.basePrice || (p.variants && p.variants[0]?.price) || 0),
            length: Number(p.length || p.dimensions?.length || 240),
            width: Number(p.width || p.dimensions?.width || 90),
            height: Number(p.height || p.dimensions?.height || 85)
          }));
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải sản phẩm từ API, sử dụng danh mục mẫu DCor:', err);
    } finally {
      if (this.dcorProducts.length === 0) {
        this.dcorProducts = [...this.fallbackProducts];
      }
      this.isLoadingProducts = false;
      if (!this.selectedProduct && this.dcorProducts.length > 0) {
        this.selectProduct(this.dcorProducts[0]);
      }
    }
  }

  get filteredDCorProducts(): DCorCatalogProduct[] {
    if (!this.productSearchQuery.trim()) {
      return this.dcorProducts;
    }
    const q = this.productSearchQuery.toLowerCase().trim();
    return this.dcorProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  }

  selectProduct(prod: DCorCatalogProduct): void {
    this.selectedProduct = prod;
    this.formLength = prod.length || 240;
    this.formWidth = prod.width || 90;
    this.formHeight = prod.height || 85;
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

  
  switchTab(tab: 'ALL' | 'CONSULTING' | 'QUOTED' | 'PROCESSING' | 'CANCELLED'): void {
    this.activeTab = tab;
  }

  getTabCount(tab: string): number {
    if (tab === 'ALL') return this.requests.length;
    if (tab === 'CONSULTING') {
      return this.requests.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'CONSULTING').length;
    }
    if (tab === 'QUOTED') {
      return this.requests.filter(r => 
        r.status === 'QUOTED' || 
        r.status === 'AWAITING_CONTRACT' || 
        r.status === 'CONTRACT_SIGNED' || 
        r.status === 'AWAITING_PAYMENT'
      ).length;
    }
    if (tab === 'PROCESSING') {
      return this.requests.filter(r => r.status === 'PROCESSING').length;
    }
    if (tab === 'CANCELLED') {
      return this.requests.filter(r => r.status === 'CANCELLED').length;
    }
    return 0;
  }

  // --- DANH SÁCH YÊU CẦU MAY ĐO (Không lọc theo tab, chỉ tìm kiếm theo từ khóa) ---
  get filteredRequests(): CustomRequest[] {
    let result = [...this.requests];

    if (this.activeTab === 'CONSULTING') {
      result = result.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'CONSULTING');
    } else if (this.activeTab === 'QUOTED') {
      result = result.filter(r => 
        r.status === 'QUOTED' || 
        r.status === 'AWAITING_CONTRACT' || 
        r.status === 'CONTRACT_SIGNED' || 
        r.status === 'AWAITING_PAYMENT'
      );
    } else if (this.activeTab === 'PROCESSING') {
      result = result.filter(r => r.status === 'PROCESSING');
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
        return 'confirmed';
      case 'AWAITING_PAYMENT':
        return 'waiting-payment';
      case 'PROCESSING':
        return 'processing';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
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

  // --- MODAL TẠO YÊU CẦU ---
  openCreateModal(): void {
    this.formSubmittedSuccess = false;
    this.isCreateModalOpen = true;
    if (this.currentUser) {
      this.formCustomerName = this.currentUser.fullName || '';
      this.formCustomerPhone = this.currentUser.phone || '';
      this.formCustomerEmail = this.currentUser.email || '';
    } else if (this.authService.getGuestPhone()) {
      this.formCustomerPhone = this.authService.getGuestPhone() || '';
    }
    if (!this.selectedProduct && this.dcorProducts.length > 0) {
      this.selectProduct(this.dcorProducts[0]);
    }
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  selectColor(swatch: ColorSwatch): void {
    this.formSelectedColorName = swatch.name;
    this.formSelectedColorHex = swatch.hex;
  }

  submitCustomRequest(): void {
    if (!this.formCustomerName.trim() || !this.formCustomerPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại liên hệ để KTS DCor hỗ trợ tư vấn.');
      return;
    }

    let prodName = '';
    let prodSku = '';
    let prodImage = '';
    let category = 'Sofa May Đo';

    if (this.formProductType === 'template') {
      const prod = this.selectedProduct || this.dcorProducts[0];
      prodName = prod?.name || 'Mẫu thiết kế DCor';
      prodSku = prod?.sku || '';
      prodImage = prod?.image || '';
      category = prod?.categoryName || 'Sofa May Đo';
    } else {
      prodName = this.formCustomProductName.trim() || 'Nội thất thiết kế riêng theo yêu cầu';
      prodImage = this.formReferenceImageUrl.trim() || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80';
      category = 'Thiết Kế Độc Bản';
    }

    this.customRequestService.createRequest({
      customerName: this.formCustomerName.trim(),
      customerPhone: this.formCustomerPhone.trim(),
      customerEmail: this.formCustomerEmail.trim(),
      customerAddress: this.formCustomerAddress.trim(),
      customerId: this.currentUser?.id,
      productName: prodName,
      productSku: prodSku,
      productImage: prodImage,
      categoryName: category,
      length: this.formLength,
      width: this.formWidth,
      height: this.formHeight,
      colorName: this.formSelectedColorName,
      colorHex: this.formSelectedColorHex,
      material: this.formMaterial,
      legMaterial: this.formLegMaterial,
      notes: this.formNotes.trim(),
      referenceImages: this.formReferenceImageUrl ? [this.formReferenceImageUrl] : []
    });

    this.formSubmittedSuccess = true;
    setTimeout(() => {
      this.closeCreateModal();
    }, 1800);
  }

  // --- XEM CHI TIẾT YÊU CẦU ---
  openDetailModal(req: CustomRequest): void {
    this.selectedRequest = req;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedRequest = null;
  }

  openPaymentModal(req: CustomRequest): void {
    this.selectedRequest = req;
    this.isPaymentModalOpen = true;
  }

  closePaymentModal(): void {
    this.isPaymentModalOpen = false;
  }

  confirmCustomerPayment(): void {
    if (!this.selectedRequest) return;
    this.customRequestService.confirmPaymentAndStartProduction(
      this.selectedRequest.id,
      this.selectedRequest.customerName + ' (Khách hàng thanh toán qua cổng)'
    );
    this.closePaymentModal();
    alert('Thanh toán đặt cọc thành công! Đơn hàng đã được chuyển sang xưởng sản xuất.');
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
}
