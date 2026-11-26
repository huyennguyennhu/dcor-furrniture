import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Check, 
  CheckCircle2, 
  Copy, 
  AlertCircle, 
  AlertTriangle,
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Receipt, 
  Sparkles, 
  X, 
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Gift,
  FileText,
  Tag,
  Building2,
  Smartphone,
  Wallet,
  QrCode,
  ShoppingBag,
  Trash2,
  MapPin,
  Search,
  Plus,
  Clock
} from 'lucide-angular';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { PromotionService, Promotion, AppliedPromotion } from '../../../../core/services/promotion.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { applyImageErrorFallback } from '../../../../shared/utils/image-fallback.util';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ALL_VIETNAM_PROVINCE_NAMES, getDistrictsForProvince, getWardsForDistrict, getWardsForProvince } from '../../../../shared/data/vietnam-administrative.data';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown';

interface SavedAddress {
  id: string;
  receiverName: string;
  phone: string;
  email?: string;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  detail?: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, CustomDropdownComponent],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  // Lucide Icons (Nguồn chuẩn https://lucide.dev/icons/)
  icons = {
    Check,
    CheckCircle2,
    Copy,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    CreditCard,
    Truck,
    Receipt,
    Sparkles,
    X,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Gift,
    FileText,
    Tag,
    Building2,
    Smartphone,
    Wallet,
    QrCode,
    ShoppingBag,
    Trash2,
    MapPin,
    Search,
    Plus,
    Clock
  };

  // Trạng thái màn hình: 'checkout' hoặc 'success'
  currentStep: 'checkout' | 'success' = 'checkout';

  // Danh sách sản phẩm thanh toán thực tế (lấy từ giỏ hàng hoặc session, không mock dữ liệu)
  checkoutItems: CartItem[] = [];
  isLoadingCart = true;

  // Người dùng & Xác thực
  isLoggedIn = false;
  isGoogleAccount = false;
  currentUser: any = null;

  // Form Thông tin người nhận
  fullName = '';
  phone = '';
  email = '';
  address = '';
  shippingNotes = '';

  // Phân chia đơn vị hành chính Việt Nam (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã)
  provinces: string[] = ALL_VIETNAM_PROVINCE_NAMES;
  districts: string[] = [];
  wards: string[] = [];
  selectedProvince = 'Thành phố Hồ Chí Minh';
  selectedDistrict = '';
  selectedWard = '';
  streetAddress = '';

  // Lỗi định dạng từng trường (Validation errors)
  errors: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    companyName?: string;
    taxCode?: string;
    invoiceEmail?: string;
    companyAddress?: string;
  } = {};

  // Sổ địa chỉ thực tế (chỉ hiển thị khi có dữ liệu từ tài khoản, không tự sinh)
  savedAddresses: SavedAddress[] = [];
  selectedAddressId: string | null = null;
  isAddressModalOpen = false;
  // Chế độ modal: 'select' = chọn địa chỉ có sẵn, 'add' = thêm mới
  addressModalMode: 'select' | 'add' = 'select';

  // Form thêm địa chỉ mới
  newAddress = {
    receiverName: '',
    phone: '',
    email: '',
    province: 'Thành phố Hồ Chí Minh',
    district: '',
    ward: '',
    detail: '',
    isDefault: false
  };
  newAddressDistricts: string[] = [];
  newAddressWards: string[] = [];
  isSavingNewAddress = false;
  newAddressError = '';
  newAddressErrors: {
    receiverName?: string;
    phone?: string;
    email?: string;
    province?: string;
    district?: string;
    ward?: string;
    detail?: string;
    otp?: string;
  } = {};
  addressSelectionError = '';

  // Guest / Gmail không SĐT: Tra cứu địa chỉ qua số điện thoại
  guestPhoneLookup = '';
  isLookingUpAddress = false;
  guestFoundAddresses: SavedAddress[] = [];
  guestLookupMessage = '';

  get hasUserPhone(): boolean {
    return !!(this.currentUser && this.currentUser.phone && !this.currentUser.phone.startsWith('GOOG_') && this.currentUser.phone.trim().length >= 9);
  }

  get hasSelectedAddress(): boolean {
    return !!(this.fullName && this.fullName.trim() && this.phone && this.phone.trim() && this.address && this.address.trim());
  }

  // OTP Xác thực số điện thoại
  isPhoneVerified = false;
  verifiedPhone = '';
  isOtpModalOpen = false;
  otpCode = '';
  otpCountdown = 0;
  private otpTimer: any = null;
  otpErrorMessage: string | null = null;
  isSendingOtp = false;

  // Danh sách các số điện thoại đã từng xác thực OTP của tài khoản
  verifiedPhonesList: string[] = [];
  // Popup hỏi lưu số điện thoại vào hồ sơ cá nhân
  showSavePhonePromptModal = false;
  phoneToSaveToProfile = '';
  isSavingPhoneToProfile = false;
  savePhoneError = '';
  pendingActionAfterPhonePrompt: 'SUBMIT_ORDER' | 'SAVE_ADDRESS' | null = null;

  // Mã giảm giá (Đồng bộ qua PromotionService)
  systemPromotions: Promotion[] = [];
  voucherInput = '';
  customVoucherInput = '';
  appliedVoucher: AppliedPromotion | null = null;
  appliedFreeshipVoucher: AppliedPromotion | null = null;
  voucherErrorMessage: string | null = null;
  voucherSuccessMessage: string | null = null;
  isCheckingVoucher = false;
  isVoucherModalOpen = false;
  showAllProductVouchers = false;
  manuallyRemovedProduct = false;
  manuallyRemovedFreeship = false;

  get appliedProductVoucher(): AppliedPromotion | null {
    return this.appliedVoucher;
  }

  get hasAnyAppliedVoucher(): boolean {
    return !!this.appliedVoucher || !!this.appliedFreeshipVoucher;
  }

  // Thông tin cấu hình thanh toán ngân hàng (chỉ hiển thị khi có dữ liệu nạp từ API/cấu hình cửa hàng)
  storeBankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrUrl?: string;
  } | null = null;

  // Tùy chọn hiển thị giá tiền trên kiện hàng / hóa đơn giao hàng (mặc định Bật)
  showPriceOnInvoice = true;
  isGift = false;
  hideInvoicePrice = false;

  onPriceVisibilityToggle() {
    this.hideInvoicePrice = !this.showPriceOnInvoice;
  }

  // Quản lý sao chép clipboard trong popup thanh toán
  copiedFields: { [key: string]: boolean } = {};

  copyToClipboard(text: string, label: string): void {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.copiedFields[label] = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.copiedFields[label] = false;
          this.cdr.detectChanges();
        }, 2000);
      }).catch(() => {
        this.fallbackCopyText(text, label);
      });
    } else {
      this.fallbackCopyText(text, label);
    }
  }

  private fallbackCopyText(text: string, label: string): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copiedFields[label] = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copiedFields[label] = false;
        this.cdr.detectChanges();
      }, 2000);
    } catch (_) {}
  }

  // Phương thức thanh toán: Chỉ gồm 2 phương thức: Chuyển khoản hoặc Thanh toán khi nhận hàng
  paymentMethod: 'COD' | 'BANK_TRANSFER' = 'BANK_TRANSFER';

  // Điều khiển Popup Đặt hàng
  showDepositModal = false;
  showSuccessModal = false;

  // Xuất hóa đơn VAT điện tử
  isInvoiceRequired = false;
  companyName = '';
  taxCode = '';
  companyAddress = '';
  invoiceEmail = '';

  // Đặt hàng & Chống bấm đúp
  isSubmittingOrder = false;
  private _orderErrorMessage: string | null = null;
  private orderErrorTimer: ReturnType<typeof setTimeout> | null = null;

  get orderErrorMessage(): string | null {
    return this._orderErrorMessage;
  }

  set orderErrorMessage(val: string | null) {
    this._orderErrorMessage = val;
    if (this.orderErrorTimer) {
      clearTimeout(this.orderErrorTimer);
      this.orderErrorTimer = null;
    }
    if (val) {
      this.orderErrorTimer = setTimeout(() => {
        this._orderErrorMessage = null;
        this.orderErrorTimer = null;
        this.cdr.detectChanges();
      }, 4000);
    }
  }

  // Dữ liệu Đơn hàng sau khi đặt thành công
  createdOrder: {
    orderNumber: string;
    createdAt: Date;
    receiverName: string;
    phone: string;
    address: string;
    email?: string;
    paymentMethod: string;
    totalAmount: number;
    depositAmount?: number;
    remainingAmount?: number;
    deliveryEstimate: string;
    isGift?: boolean;
    hideInvoicePrice?: boolean;
    items: CartItem[];
  } | null = null;

  // Khách vãng lai đăng ký nhanh
  registerPassword = '';
  isRegisteringGuest = false;
  guestRegisterSuccess = false;

  // Khách Google lưu địa chỉ vào hồ sơ
  dontAskSaveGoogleAddress = false;
  googleAddressSaved = false;

  private sub: Subscription = new Subscription();

  constructor(
    private router: Router,
    private cartService: CartService,
    private promotionService: PromotionService,
    private customerService: CustomerService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkUserAuth();
    this.initPromotionSync();
    this.initAdministrativeAddress();
    this.loadCheckoutItems();
    this.loadStorePaymentConfig();
  }

  initPromotionSync() {
    this.sub.add(
      this.promotionService.promotions$.subscribe(promos => {
        this.systemPromotions = promos || [];
        this.cdr.detectChanges();
      })
    );
    this.sub.add(
      this.promotionService.loadPromotions().subscribe(() => {
        if (this.subTotal > 0) {
          this.recalculateVoucher();
        }
        this.cdr.detectChanges();
      })
    );
    this.sub.add(
      this.promotionService.appliedPromotion$.subscribe(promo => {
        this.appliedVoucher = promo;
        if (promo) {
          this.voucherInput = promo.code;
          this.voucherSuccessMessage = `Áp dụng mã ưu đãi: "${promo.code}" (-${this.formatCurrency(promo.calculatedDiscount)})`;
        } else {
          this.voucherSuccessMessage = null;
        }
        this.cdr.detectChanges();
      })
    );
    this.sub.add(
      this.promotionService.appliedFreeship$.subscribe(freeship => {
        this.appliedFreeshipVoucher = freeship;
        this.cdr.detectChanges();
      })
    );
  }

  selectPaymentMethod(method: 'COD' | 'BANK_TRANSFER') {
    if (this.isHighValueOrder && method === 'COD') {
      return; // Chỉ khóa COD với đơn > 50tr
    }
    this.paymentMethod = method;
    this.orderErrorMessage = null;
  }

  // Xử lý Popup Đặt cọc
  completeDeposit() {
    this.showDepositModal = false;
    this.showSuccessModal = true;
    this.cdr.detectChanges();
  }

  closeDepositModal() {
    this.showDepositModal = false;
    this.showSuccessModal = true;
    this.cdr.detectChanges();
  }

  // Xử lý Popup Đặt hàng thành công
  viewMyOrders() {
    this.showSuccessModal = false;
    const orderPhone = (this.createdOrder?.phone || this.phone || '').trim();
    const orderNumber = this.createdOrder?.orderNumber;
    const queryParams: any = {};
    if (orderNumber) {
      queryParams.orderNumber = orderNumber;
    }
    if (orderPhone) {
      this.authService.setGuestPhone(orderPhone, 'guest-order-token');
      if (!this.isLoggedIn) {
        queryParams.phone = orderPhone;
      }
    }
    this.router.navigate(['/account/orders'], { queryParams });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.currentStep = 'success';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
    }
    if (this.orderErrorTimer) {
      clearTimeout(this.orderErrorTimer);
      this.orderErrorTimer = null;
    }
  }

  // --- 1. Lấy thông tin tài khoản thực tế & Sổ địa chỉ thực tế (Đồng bộ với Hồ sơ cá nhân) ---
  checkUserAuth() {
    const token = localStorage.getItem('dcor_customer_token');
    const storedUser = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_user');

    if (token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.isLoggedIn = true;
        this.fullName = this.currentUser.fullName || this.currentUser.name || '';
        this.email = this.currentUser.email || '';
        const rawPhone = this.currentUser.phone || '';
        this.phone = rawPhone.startsWith('GOOG_') ? '' : rawPhone;
        this.isGoogleAccount = !rawPhone || rawPhone.startsWith('GOOG_') || this.currentUser.authProvider === 'GOOGLE';

        // 1. Tải tức thì từ cache dcor_saved_addresses để không bị giật lag
        try {
          const cached = localStorage.getItem('dcor_saved_addresses');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.applyAddresses(parsed);
            }
          }
        } catch (e) {}

        // Tải danh sách các số điện thoại đã từng xác thực của tài khoản
        this.loadVerifiedPhones();

        // Kiểm tra xem số điện thoại hiện tại có cần xác thực OTP không
        this.isPhoneVerified = !this.isPhoneOtpRequired(this.phone);
        this.verifiedPhone = this.isPhoneVerified && this.phone ? this.phone.trim() : '';

        // 2. Đồng bộ danh sách địa chỉ mới nhất từ CustomerService
        this.syncCustomerAddresses();
      } catch (e) {
        console.error('Lỗi đọc dữ liệu người dùng:', e);
      }
    } else {
      this.isLoggedIn = false;
      this.isPhoneVerified = false;
      this.verifiedPhone = '';
      this.savedAddresses = [];
    }
  }

  /** Đồng bộ sổ địa chỉ trực tiếp từ API backend của tài khoản */
  syncCustomerAddresses() {
    if (!this.isLoggedIn) return;
    this.sub.add(
      this.customerService.getAddresses().subscribe({
        next: (data) => {
          if (Array.isArray(data)) {
            try {
              localStorage.setItem('dcor_saved_addresses', JSON.stringify(data));
            } catch (e) {}
            this.applyAddresses(data);
          }
        },
        error: () => {}
      })
    );
  }

  /** Áp dụng danh sách địa chỉ và tự động chọn địa chỉ mặc định theo quy tắc */
  applyAddresses(data: any[]) {
    this.savedAddresses = data.map((a: any, idx: number) => ({
      id: a.id || `addr-${idx}`,
      receiverName: a.receiverName || this.fullName,
      phone: a.phone && !a.phone.startsWith('GOOG_') ? a.phone : this.phone,
      email: a.email || this.email,
      address: [a.detail, a.ward, a.district, a.province].filter(Boolean).join(', ') || a.address || '',
      province: a.province,
      district: a.district || '',
      ward: a.ward || '',
      detail: a.detail,
      isDefault: !!a.isDefault
    }));

    // Quy tắc: Nếu có địa chỉ mặc định thì chọn địa chỉ đó, nếu không thì địa chỉ đầu tiên được xem là mặc định
    if (this.savedAddresses.length > 0) {
      const defaultAddr = this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0];
      if (defaultAddr && (!this.selectedAddressId || !this.address)) {
        this.selectAddress(defaultAddr);
      }
    }
    this.loadVerifiedPhones();
    this.cdr.detectChanges();
  }

  /** Tải danh sách số điện thoại đã từng xác thực OTP của tài khoản */
  loadVerifiedPhones() {
    if (!this.isLoggedIn || !this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email || 'user';
    try {
      const stored = localStorage.getItem(`dcor_verified_phones_${userId}`);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const addressPhones = (this.savedAddresses || [])
        .map(a => (a.phone || '').trim())
        .filter(Boolean);
      this.verifiedPhonesList = Array.from(new Set([...parsed, ...addressPhones]));
    } catch (e) {
      this.verifiedPhonesList = [];
    }
  }

  /** Thêm số điện thoại vào danh sách đã xác thực của tài khoản */
  addVerifiedPhone(phone: string) {
    if (!phone) return;
    const clean = phone.trim();
    if (!this.verifiedPhonesList.includes(clean)) {
      this.verifiedPhonesList.push(clean);
    }
    if (this.isLoggedIn && this.currentUser) {
      const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email || 'user';
      try {
        localStorage.setItem(`dcor_verified_phones_${userId}`, JSON.stringify(this.verifiedPhonesList));
      } catch (e) {}
    }
  }

  /**
   * RÀNG BUỘC THEO QUY ĐỊNH HỆ THỐNG:
   * 1. Khách hàng đã có số điện thoại trong hồ sơ cá nhân -> KHÔNG CẦN xác thực OTP
   * 2. Khách hàng đăng nhập email/Google: nếu SĐT đã từng xác thực OTP (trong verifiedPhonesList) -> KHÔNG CẦN xác thực
   * 3. Khách vãng lai hoặc số mới chưa từng xác thực -> BẮT BUỘC xác thực OTP
   */
  isPhoneOtpRequired(phoneStr?: string): boolean {
    const phone = (phoneStr || '').trim();
    if (!phone) return true;

    // 1. Khách hàng đã có số điện thoại trong hồ sơ cá nhân
    if (this.isLoggedIn && this.hasUserPhone) {
      return false;
    }

    // 2. Khách hàng đăng nhập email/Google nhưng SĐT này đã từng xác thực OTP hoặc có trong sổ địa chỉ
    if (this.isLoggedIn && this.verifiedPhonesList.includes(phone)) {
      return false;
    }

    // 3. Số điện thoại vừa xác thực thành công trong phiên làm việc hiện tại
    if (this.verifiedPhone && this.verifiedPhone === phone) {
      return false;
    }

    // Khách vãng lai hoặc số mới chưa xác thực -> Bắt buộc xác thực OTP
    return true;
  }

  // --- 2. Tải cấu hình thanh toán cửa hàng từ Backend (nếu có dữ liệu) ---
  loadStorePaymentConfig() {
    // Gọi API lấy cấu hình ngân hàng thật của cửa hàng nếu backend có endpoint
    fetch(`${environment.apiUrl}/store/payment-config`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.bankName && data.accountNumber) {
          this.storeBankInfo = data;
          this.cdr.detectChanges();
        }
      })
      .catch(() => {
        // Nếu cửa hàng chưa cấu hình, để null chứ không tự bịa thông tin
        this.storeBankInfo = null;
      });
  }

  // --- 3. Tải danh sách sản phẩm từ giỏ hàng thực tế (Không mock sản phẩm) ---
  loadCheckoutItems() {
    this.sub.add(
      this.cartService.cart$.subscribe(items => {
        let selectedIds: string[] = [];
        try {
          const sessionVal = sessionStorage.getItem('dcor_checkout_items');
          if (sessionVal) {
            selectedIds = JSON.parse(sessionVal);
          }
        } catch (e) {
          console.error('Lỗi đọc session checkout items:', e);
        }

        // Lọc sản phẩm hợp lệ:
        // - isActive undefined (guest cart): vẫn cho qua
        // - isActive = true: cho qua
        // - availableStock undefined: cho qua (guest cart không có thông tin tồn kho chi tiết)
        const validItems = items.filter(
          item => item.isActive !== false && (item.availableStock === undefined || item.availableStock > 0)
        );

        if (selectedIds.length > 0) {
          const selectedSet = new Set(selectedIds);
          this.checkoutItems = validItems.filter(item => selectedSet.has(item.id));
        } else {
          this.checkoutItems = validItems;
        }

        this.isLoadingCart = false;
        this.recalculateVoucher();
        this.cdr.detectChanges();
      })
    );
  }

  // --- 4. Luồng kiểm tra đúng định dạng (Validation regex/format) ---
  validatePhone(phoneStr: string): boolean {
    if (!phoneStr) return false;
    // Định dạng số điện thoại Việt Nam: bắt đầu bằng 03, 05, 07, 08, 09 kèm 8 chữ số tiếp theo (Tổng 10 số)
    const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return phoneRegex.test(phoneStr.trim());
  }

  validateEmail(emailStr: string): boolean {
    if (!emailStr) return true; // Email có thể là tùy chọn ở người nhận, nhưng nếu đã nhập thì phải đúng định dạng
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr.trim());
  }

  onPhoneBlur() {
    if (!this.phone.trim()) {
      this.errors.phone = 'Vui lòng nhập số điện thoại người nhận.';
    } else if (!this.validatePhone(this.phone)) {
      this.errors.phone = 'Số điện thoại không đúng định dạng (VD: 0912345678, gồm 10 chữ số).';
    } else {
      delete this.errors.phone;
    }
  }

  onEmailBlur() {
    if (this.email.trim() && !this.validateEmail(this.email)) {
      this.errors.email = 'Địa chỉ email không đúng định dạng (VD: ten@example.com).';
    } else {
      delete this.errors.email;
    }
  }

  onInvoiceEmailBlur() {
    if (this.isInvoiceRequired) {
      if (!this.invoiceEmail.trim()) {
        this.errors.invoiceEmail = 'Vui lòng nhập email nhận hóa đơn.';
      } else if (!this.validateEmail(this.invoiceEmail)) {
        this.errors.invoiceEmail = 'Email nhận hóa đơn không đúng định dạng.';
      } else {
        delete this.errors.invoiceEmail;
      }
    }
  }

  onFullNameBlur() {
    if (!this.fullName.trim()) {
      this.errors.fullName = 'Vui lòng nhập họ và tên người nhận.';
    } else {
      delete this.errors.fullName;
    }
  }

  // --- Khởi tạo và xử lý đơn vị hành chính Việt Nam (theo hành chính mới) ---
  initAdministrativeAddress() {
    this.districts = getDistrictsForProvince(this.selectedProvince);
    this.wards = getWardsForProvince(this.selectedProvince);
    if (this.districts.length > 0) {
      this.selectedDistrict = this.districts[0];
      this.wards = getWardsForDistrict(this.selectedProvince, this.selectedDistrict);
    }
    if (this.wards.length > 0) {
      this.selectedWard = this.wards[0];
    }
    this.updateFullAddress();
  }

  onProvinceChange() {
    this.districts = getDistrictsForProvince(this.selectedProvince);
    this.selectedDistrict = this.districts.length > 0 ? this.districts[0] : '';
    this.wards = this.selectedDistrict 
      ? getWardsForDistrict(this.selectedProvince, this.selectedDistrict) 
      : getWardsForProvince(this.selectedProvince);
    this.selectedWard = this.wards.length > 0 ? this.wards[0] : '';
    this.updateFullAddress();
  }

  onDistrictChange() {
    this.wards = getWardsForDistrict(this.selectedProvince, this.selectedDistrict);
    this.selectedWard = this.wards.length > 0 ? this.wards[0] : '';
    this.updateFullAddress();
  }

  onWardChange() {
    this.updateFullAddress();
  }

  onStreetAddressChange() {
    this.updateFullAddress();
  }

  updateFullAddress() {
    const parts = [
      this.streetAddress ? this.streetAddress.trim() : '',
      this.selectedWard,
      this.selectedDistrict,
      this.selectedProvince
    ].filter(Boolean);
    this.address = parts.join(', ');
    if (this.streetAddress.trim() && this.selectedProvince && this.selectedWard && (!this.districts.length || this.selectedDistrict)) {
      delete this.errors.address;
    }
  }

  onAddressBlur() {
    if (!this.selectedProvince) {
      this.errors.address = 'Vui lòng chọn Tỉnh / Thành phố.';
    } else if (this.districts.length > 0 && !this.selectedDistrict) {
      this.errors.address = 'Vui lòng chọn Quận / Huyện / Thị xã.';
    } else if (!this.selectedWard) {
      this.errors.address = 'Vui lòng chọn Phường / Xã.';
    } else if (!this.streetAddress.trim()) {
      this.errors.address = 'Vui lòng nhập số nhà, tên đường cụ thể.';
    } else {
      delete this.errors.address;
    }
  }

  // --- 5. Tính toán Chi phí đơn hàng ---
  get subTotal(): number {
    return this.checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get shippingFee(): number {
    if (this.subTotal === 0) return 0;
    if (this.appliedVoucher?.discountType === 'AMOUNT' && this.appliedVoucher.code === 'FREESHIP') return 0;

    let enableFreeShipping = true;
    let minFreeShipAmount = 50000000;
    let baseShippingFee = 250000;

    try {
      const raw = localStorage.getItem('dcor_orders_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.shipping) {
          enableFreeShipping = parsed.shipping.enableFreeShipping !== false;
          minFreeShipAmount = parsed.shipping.freeShippingMinAmount ?? 50000000;
          baseShippingFee = parsed.shipping.baseShippingFee ?? 250000;
        }
      }
    } catch (e) {}

    if (enableFreeShipping && this.subTotal >= minFreeShipAmount) {
      return 0;
    }

    if (this.appliedFreeshipVoucher) {
      return Math.max(0, baseShippingFee - (this.appliedFreeshipVoucher.calculatedDiscount || baseShippingFee));
    }
    return baseShippingFee;
  }

  get discountAmount(): number {
    return this.appliedVoucher ? this.appliedVoucher.calculatedDiscount : 0;
  }

  get totalAmount(): number {
    return Math.max(0, this.subTotal + this.shippingFee - this.discountAmount);
  }

  get totalItemsCount(): number {
    return this.checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isHighValueOrder(): boolean {
    let threshold = 50000000;
    try {
      const raw = localStorage.getItem('dcor_orders_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.workflow?.highValueThreshold) {
          threshold = parsed.workflow.highValueThreshold;
        }
      }
    } catch (e) {}
    return this.totalAmount > threshold;
  }

  get depositAmount(): number {
    return Math.round(this.totalAmount * 0.3);
  }

  get remainingAmount(): number {
    return this.totalAmount - this.depositAmount;
  }

  formatCurrency(val: number): string {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  // --- 6. Sổ địa chỉ (Address modal & management) ---
  selectAddress(addr: SavedAddress) {
    this.selectedAddressId = addr.id;
    this.fullName = addr.receiverName;
    this.phone = addr.phone;
    this.address = addr.address;
    if (addr.email) {
      this.email = addr.email;
    }

    // Trạng thái xác thực SĐT:
    // Kiểm tra theo quy tắc: nếu đã có trong hồ sơ hoặc đã từng xác thực OTP -> miễn OTP
    this.isPhoneVerified = !this.isPhoneOtpRequired(this.phone);
    if (this.isPhoneVerified) {
      this.verifiedPhone = this.phone ? this.phone.trim() : '';
    }

    // Phân tách nếu chuỗi địa chỉ khớp định dạng
    if (addr.province) this.selectedProvince = addr.province;
    if (addr.district) this.selectedDistrict = addr.district;
    if (addr.ward) this.selectedWard = addr.ward;
    if (addr.detail) this.streetAddress = addr.detail;

    const parts = (addr.address || '').split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 4) {
      this.streetAddress = addr.detail || parts.slice(0, parts.length - 3).join(', ');
      const wardPart = parts[parts.length - 3];
      const distPart = parts[parts.length - 2];
      const provPart = parts[parts.length - 1];

      const foundProv = this.provinces.find(p => p.includes(provPart) || provPart.includes(p));
      if (foundProv) {
        this.selectedProvince = foundProv;
        this.districts = getDistrictsForProvince(this.selectedProvince);
        const foundDist = this.districts.find(d => d.includes(distPart) || distPart.includes(d));
        if (foundDist) {
          this.selectedDistrict = foundDist;
          this.wards = getWardsForDistrict(this.selectedProvince, this.selectedDistrict);
          const foundWard = this.wards.find(w => w.includes(wardPart) || wardPart.includes(w));
          if (foundWard) this.selectedWard = foundWard;
        }
      }
    } else if (parts.length === 3) {
      this.streetAddress = addr.detail || parts[0];
      const wardPart = parts[1];
      const provPart = parts[2];
      const foundProv = this.provinces.find(p => p.includes(provPart) || provPart.includes(p));
      if (foundProv) {
        this.selectedProvince = foundProv;
        this.districts = getDistrictsForProvince(this.selectedProvince);
        this.wards = getWardsForDistrict(this.selectedProvince, this.selectedDistrict || '');
        const foundWard = this.wards.find(w => w.includes(wardPart) || wardPart.includes(w));
        if (foundWard) this.selectedWard = foundWard;
      }
    } else {
      this.streetAddress = addr.detail || (parts.length > 0 ? parts[0] : addr.address);
    }

    // Làm sạch this.address để không bị lặp từ
    const rawTokens = (addr.address || '').split(',').map(p => p.trim()).filter(Boolean);
    const seen = new Set<string>();
    const cleanTokens: string[] = [];
    for (const t of rawTokens) {
      if (!seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        cleanTokens.push(t);
      }
    }
    this.address = cleanTokens.join(', ');

    delete this.errors.phone;
    delete this.errors.fullName;
    delete this.errors.address;
    this.addressSelectionError = '';
    this.isAddressModalOpen = false;
    this.cdr.detectChanges();
  }

  /** Mở modal sổ địa chỉ */
  openAddressBookModal(mode: 'select' | 'add' = 'select') {
    this.newAddressError = '';
    this.guestLookupMessage = '';
    this.initNewAddressForm();

    // Nếu người dùng đã đăng nhập -> luôn đồng bộ danh sách địa chỉ thật từ tài khoản
    if (this.isLoggedIn) {
      this.syncCustomerAddresses();
      this.addressModalMode = this.savedAddresses.length > 0 ? mode : 'add';
    } else {
      // Khách vãng lai hoặc Google chưa có SĐT
      this.addressModalMode = mode;
      // Nếu có sẵn số điện thoại trên form thì điền vào ô tìm kiếm
      if (this.phone) {
        this.guestPhoneLookup = this.phone;
      }
    }

    this.isAddressModalOpen = true;
    this.cdr.detectChanges();
  }

  /** Khởi tạo form thêm địa chỉ mới */
  initNewAddressForm() {
    if (!this.newAddress.province) {
      this.newAddress.province = this.selectedProvince || 'Thành phố Hồ Chí Minh';
    }
    this.newAddressDistricts = getDistrictsForProvince(this.newAddress.province);
    if (!this.newAddress.district && this.newAddressDistricts.length > 0) {
      this.newAddress.district = this.newAddressDistricts[0];
    }
    this.newAddressWards = this.newAddress.district
      ? getWardsForDistrict(this.newAddress.province, this.newAddress.district)
      : getWardsForProvince(this.newAddress.province);
    if (!this.newAddress.ward && this.newAddressWards.length > 0) {
      this.newAddress.ward = this.newAddressWards[0];
    }
    if (!this.newAddress.receiverName && this.fullName) {
      this.newAddress.receiverName = this.fullName;
    }
    if (!this.newAddress.phone && this.phone) {
      this.newAddress.phone = this.phone;
    }
    if (!this.newAddress.email && this.email) {
      this.newAddress.email = this.email;
    }

    // Kiểm tra trạng thái verify của SĐT trong form mới
    const phone = (this.newAddress.phone || '').trim();
    this.isPhoneVerified = !this.isPhoneOtpRequired(phone);
  }

  onNewAddressReceiverNameBlur() {
    if (!this.newAddress.receiverName || !this.newAddress.receiverName.trim()) {
      this.newAddressErrors.receiverName = 'Vui lòng nhập họ và tên người nhận.';
    } else {
      delete this.newAddressErrors.receiverName;
    }
  }

  onNewAddressReceiverNameInput() {
    if (this.newAddress.receiverName && this.newAddress.receiverName.trim()) {
      delete this.newAddressErrors.receiverName;
    }
  }

  onNewAddressPhoneInput() {
    const phone = (this.newAddress.phone || '').trim();
    this.isPhoneVerified = !this.isPhoneOtpRequired(phone);
    this.newAddressError = '';
    delete this.newAddressErrors.otp;
    if (phone && !this.validatePhone(phone)) {
      this.newAddressErrors.phone = 'Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
    } else {
      delete this.newAddressErrors.phone;
    }
  }

  onNewAddressPhoneBlur() {
    const phone = (this.newAddress.phone || '').trim();
    if (!phone) {
      this.newAddressErrors.phone = 'Vui lòng nhập số điện thoại nhận hàng.';
    } else if (!this.validatePhone(phone)) {
      this.newAddressErrors.phone = 'Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
    } else {
      delete this.newAddressErrors.phone;
    }
  }

  onNewAddressEmailBlur() {
    const email = (this.newAddress.email || '').trim();
    if (email && !this.validateEmail(email)) {
      this.newAddressErrors.email = 'Email không đúng định dạng (VD: example@domain.com).';
    } else {
      delete this.newAddressErrors.email;
    }
  }

  onNewAddressDetailBlur() {
    const detail = (this.newAddress.detail || '').trim();
    if (!detail) {
      this.newAddressErrors.detail = 'Vui lòng nhập số nhà, tên đường cụ thể.';
    } else {
      delete this.newAddressErrors.detail;
    }
  }

  onNewAddressDetailInput() {
    if (this.newAddress.detail && this.newAddress.detail.trim()) {
      delete this.newAddressErrors.detail;
    }
  }

  onNewAddressProvinceChange() {
    delete this.newAddressErrors.province;
    this.newAddressDistricts = getDistrictsForProvince(this.newAddress.province);
    this.newAddress.district = this.newAddressDistricts.length > 0 ? this.newAddressDistricts[0] : '';
    this.onNewAddressDistrictChange();
  }

  onNewAddressWardChange() {
    delete this.newAddressErrors.ward;
  }

  onNewAddressDistrictChange() {
    this.newAddressWards = this.newAddress.district
      ? getWardsForDistrict(this.newAddress.province, this.newAddress.district)
      : getWardsForProvince(this.newAddress.province);
    this.newAddress.ward = this.newAddressWards.length > 0 ? this.newAddressWards[0] : '';
  }

  // --- Custom Searchable & Auto-Position Dropdowns cho Sổ địa chỉ ---
  openAddrDropdown: 'province' | 'ward' | null = null;
  addrDropdownDropUp = false;
  provinceSearchQuery = '';
  wardSearchQuery = '';
  provinceDisplayLimit = 20;
  wardDisplayLimit = 20;

  private normalizeViText(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  get filteredNewAddressProvinces(): string[] {
    const q = this.normalizeViText(this.provinceSearchQuery);
    if (!q) return this.provinces;
    return this.provinces.filter(p => this.normalizeViText(p).includes(q));
  }

  get visibleNewAddressProvinces(): string[] {
    return this.filteredNewAddressProvinces.slice(0, this.provinceDisplayLimit);
  }

  get filteredNewAddressWards(): string[] {
    const q = this.normalizeViText(this.wardSearchQuery);
    if (!q) return this.newAddressWards;
    return this.newAddressWards.filter(w => this.normalizeViText(w).includes(q));
  }

  get visibleNewAddressWards(): string[] {
    return this.filteredNewAddressWards.slice(0, this.wardDisplayLimit);
  }

  toggleAddrDropdown(type: 'province' | 'ward', event: MouseEvent, triggerEl: HTMLElement): void {
    event.stopPropagation();
    if (this.openAddrDropdown === type) {
      this.openAddrDropdown = null;
      return;
    }

    this.openAddrDropdown = type;
    if (type === 'province') {
      this.provinceSearchQuery = '';
      this.provinceDisplayLimit = 20;
    } else {
      this.wardSearchQuery = '';
      this.wardDisplayLimit = 20;
    }

    // Tự động tính không gian trên/dưới để quyết định xổ lên hay xổ xuống
    if (triggerEl && typeof window !== 'undefined') {
      const rect = triggerEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      this.addrDropdownDropUp = spaceBelow < 270 && spaceAbove > spaceBelow;
    } else {
      this.addrDropdownDropUp = false;
    }
  }

  onAddrDropdownScroll(type: 'province' | 'ward', event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      if (type === 'province' && this.provinceDisplayLimit < this.filteredNewAddressProvinces.length) {
        this.provinceDisplayLimit += 20;
      } else if (type === 'ward' && this.wardDisplayLimit < this.filteredNewAddressWards.length) {
        this.wardDisplayLimit += 20;
      }
    }
  }

  loadMoreAddrOptions(type: 'province' | 'ward', event: Event): void {
    event.stopPropagation();
    if (type === 'province') {
      this.provinceDisplayLimit += 20;
    } else {
      this.wardDisplayLimit += 20;
    }
  }

  selectNewAddressProvince(prov: string, event: Event): void {
    event.stopPropagation();
    this.newAddress.province = prov;
    this.onNewAddressProvinceChange();
    this.openAddrDropdown = null;
  }

  selectNewAddressWard(ward: string, event: Event): void {
    event.stopPropagation();
    this.newAddress.ward = ward;
    this.onNewAddressWardChange();
    this.openAddrDropdown = null;
  }

  @HostListener('document:click')
  onDocumentClickCloseDropdown(): void {
    if (this.openAddrDropdown) {
      this.openAddrDropdown = null;
    }
  }

  /** Tự động tải tất cả địa chỉ gắn với SĐT của tài khoản đã đăng nhập */
  loadAddressesForUserPhone() {
    const userPhone = this.currentUser?.phone;
    if (!userPhone) return;

    fetch(`${environment.apiUrl}/store/orders/address-lookup?phone=${encodeURIComponent(userPhone)}`)
      .then(res => res.ok ? res.json() : [])
      .then((orders: any[]) => {
        if (Array.isArray(orders) && orders.length > 0) {
          const existingKeys = new Set(this.savedAddresses.map(a => `${a.receiverName}_${a.address}`.toLowerCase()));
          orders.forEach((o: any, idx: number) => {
            const addrStr = [o.detailAddress, o.ward, o.district, o.province].filter(Boolean).join(', ');
            const key = `${o.receiverName || ''}_${addrStr}`.toLowerCase();
            if (!existingKeys.has(key) && addrStr) {
              existingKeys.add(key);
              this.savedAddresses.push({
                id: `phone-order-addr-${idx}`,
                receiverName: o.receiverName || this.fullName,
                phone: o.phone || userPhone,
                address: addrStr,
                isDefault: false
              });
            }
          });

          // Nếu chưa có địa chỉ nào được chọn trên form checkout, tự động chọn địa chỉ đầu tiên
          if (!this.address && this.savedAddresses.length > 0) {
            const def = this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0];
            this.selectAddress(def);
          }
          this.cdr.detectChanges();
        }
      })
      .catch(() => {});
  }

  /** Tra cứu địa chỉ đã đặt qua SĐT (dành cho khách vãng lai và Gmail chưa có SĐT) */
  lookupGuestAddress() {
    const phone = (this.guestPhoneLookup || '').trim();
    if (!this.validatePhone(phone)) {
      this.guestLookupMessage = 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
      return;
    }

    this.isLookingUpAddress = true;
    this.guestFoundAddresses = [];
    this.guestLookupMessage = '';

    fetch(`${environment.apiUrl}/store/orders/address-lookup?phone=${encodeURIComponent(phone)}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: any[]) => {
        if (!data || data.length === 0) {
          this.guestLookupMessage = `Chưa có đơn hàng nào được lưu với số điện thoại ${phone}. Bạn có thể bấm "+ Thêm địa chỉ mới" để điền thông tin nhận hàng.`;
          this.guestFoundAddresses = [];
        } else {
          this.guestFoundAddresses = data.map((o: any, idx: number) => ({
            id: `guest-addr-${idx}`,
            receiverName: o.receiverName || '',
            phone: o.phone || phone,
            address: [o.detailAddress, o.ward, o.district, o.province].filter(Boolean).join(', ')
          }));
          this.guestLookupMessage = '';
        }
      })
      .catch(() => {
        this.guestLookupMessage = 'Không thể tra cứu lúc này. Bạn có thể bấm "+ Thêm địa chỉ mới" để điền địa chỉ giao hàng.';
      })
      .finally(() => {
        this.isLookingUpAddress = false;
        this.cdr.detectChanges();
      });
  }

  /** Lưu và chọn địa chỉ mới */
  submitNewAddress() {
    this.newAddressErrors = {};
    const { receiverName, phone, province, district, ward, detail, email, isDefault } = this.newAddress;
    let hasErr = false;

    if (!receiverName || !receiverName.trim()) {
      this.newAddressErrors.receiverName = 'Vui lòng nhập họ và tên người nhận.';
      hasErr = true;
    }
    if (!phone || !phone.trim()) {
      this.newAddressErrors.phone = 'Vui lòng nhập số điện thoại nhận hàng.';
      hasErr = true;
    } else if (!this.validatePhone(phone.trim())) {
      this.newAddressErrors.phone = 'Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
      hasErr = true;
    }
    if (email && email.trim() && !this.validateEmail(email.trim())) {
      this.newAddressErrors.email = 'Email không đúng định dạng (VD: example@domain.com).';
      hasErr = true;
    }
    if (!province) {
      this.newAddressErrors.province = 'Vui lòng chọn Tỉnh / Thành phố.';
      hasErr = true;
    }
    if (!ward) {
      this.newAddressErrors.ward = 'Vui lòng chọn Phường / Xã.';
      hasErr = true;
    }
    if (!detail || !detail.trim()) {
      this.newAddressErrors.detail = 'Vui lòng nhập số nhà, tên đường cụ thể.';
      hasErr = true;
    }

    if (hasErr) {
      this.newAddressError = 'Vui lòng kiểm tra lại các thông tin chưa chính xác bên dưới.';
      this.cdr.detectChanges();
      return;
    }

    // Bắt buộc xác thực OTP nếu số điện thoại này chưa được xác thực
    const cleanPhone = (phone || '').trim();
    if (this.isPhoneOtpRequired(cleanPhone)) {
      this.newAddressErrors.otp = 'Vui lòng bấm "Xác thực OTP" để xác minh số điện thoại trước khi lưu địa chỉ.';
      this.newAddressError = 'Vui lòng bấm "Xác thực OTP" để xác minh số điện thoại trước khi lưu địa chỉ.';
      this.pendingActionAfterPhonePrompt = 'SAVE_ADDRESS';
      this.sendOtp();
      return;
    }

    this.isSavingNewAddress = true;
    this.newAddressError = '';

    const fullAddr = [detail.trim(), ward, district, province].filter(Boolean).join(', ');
    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      receiverName: receiverName.trim(),
      phone: phone.trim(),
      email: (email || '').trim() || this.email,
      address: fullAddr,
      province,
      district,
      ward,
      detail: detail.trim(),
      isDefault: !!isDefault
    };

    if (newAddr.isDefault) {
      this.savedAddresses.forEach(a => a.isDefault = false);
    }
    this.savedAddresses.unshift(newAddr);

    // Lưu cục bộ theo danh sách để khách tra cứu lại
    try {
      const localGuestAddrs = JSON.parse(localStorage.getItem('dcor_guest_addresses') || '[]');
      localGuestAddrs.unshift(newAddr);
      localStorage.setItem('dcor_guest_addresses', JSON.stringify(localGuestAddrs.slice(0, 10)));
    } catch (e) {}

    // Nếu đã login, gửi API lưu address vào sổ địa chỉ tài khoản
    if (this.isLoggedIn) {
      this.sub.add(
        this.customerService.createAddress({
          receiverName: receiverName.trim(),
          phone: phone.trim(),
          province: province.trim(),
          district: district ? district.trim() : null,
          ward: ward ? ward.trim() : null,
          detail: detail.trim(),
          isDefault: !!isDefault
        }).subscribe({
          next: (res: any) => {
            this.isSavingNewAddress = false;
            if (res && res.address) {
              newAddr.id = res.address.id;
            }
            this.syncCustomerAddresses();
          },
          error: (err) => {
            this.isSavingNewAddress = false;
            console.error('Lỗi khi lưu địa chỉ mới vào tài khoản:', err);
          }
        })
      );
    } else {
      this.isSavingNewAddress = false;
    }

    this.selectAddress(newAddr);
    this.isAddressModalOpen = false;
    this.cdr.detectChanges();
  }

  // --- 7. Xác thực OTP Số điện thoại (Cố định mã 111111) ---
  sendOtp() {
    const targetPhone = (this.isAddressModalOpen && this.addressModalMode === 'add')
      ? (this.newAddress.phone || '').trim()
      : (this.phone || '').trim();

    // Nếu số này không cần OTP (đã có trong hồ sơ hoặc đã xác thực), không cần gửi
    if (!this.isPhoneOtpRequired(targetPhone)) {
      this.isPhoneVerified = true;
      return;
    }

    if (!this.validatePhone(targetPhone)) {
      const msg = 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09) trước khi gửi mã OTP.';
      if (this.isAddressModalOpen && this.addressModalMode === 'add') {
        this.newAddressError = msg;
      } else {
        this.orderErrorMessage = msg;
      }
      return;
    }

    this.phone = targetPhone;
    this.newAddress.phone = targetPhone;
    this.isSendingOtp = true;
    this.otpErrorMessage = null;
    this.newAddressError = '';

    // Gửi yêu cầu OTP đến server
    fetch(`${environment.apiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: targetPhone })
    })
      .then(res => res.json())
      .catch(() => ({}))
      .finally(() => {
        this.isSendingOtp = false;
        this.isOtpModalOpen = true;
        this.otpCode = '';
        this.startOtpCountdown();
        this.cdr.detectChanges();
      });
  }

  startOtpCountdown() {
    this.otpCountdown = 60;
    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.otpTimer);
      }
    }, 1000);
  }

  verifyOtp() {
    const code = (this.otpCode || '').trim();
    if (!code || code.length < 4) {
      this.otpErrorMessage = 'Vui lòng nhập mã OTP đầy đủ.';
      return;
    }

    const targetPhone = (this.isAddressModalOpen && this.addressModalMode === 'add')
      ? (this.newAddress.phone || '').trim()
      : (this.phone || '').trim();

    const onOtpSuccess = () => {
      this.isPhoneVerified = true;
      this.verifiedPhone = targetPhone;
      this.addVerifiedPhone(targetPhone);
      this.isOtpModalOpen = false;
      this.otpErrorMessage = null;
      this.newAddressError = '';
      if (this.otpTimer) clearInterval(this.otpTimer);

      // NẾU LÀ TÀI KHOẢN ĐĂNG NHẬP BẰNG EMAIL/GOOGLE MÀ CHƯA CÓ SĐT TRONG HỒ SƠ:
      // Bật popup hỏi: "Bạn có muốn lưu số điện thoại này vào hồ sơ cá nhân để sau này đăng nhập hay không?"
      if (this.isLoggedIn && !this.hasUserPhone) {
        this.phoneToSaveToProfile = targetPhone;
        this.savePhoneError = '';
        this.showSavePhonePromptModal = true;
        this.cdr.detectChanges();
        return;
      }

      // Tiếp tục thực hiện hành động đang chờ (nếu có)
      if (this.pendingActionAfterPhonePrompt === 'SAVE_ADDRESS') {
        this.pendingActionAfterPhonePrompt = null;
        this.submitNewAddress();
      } else if (this.pendingActionAfterPhonePrompt === 'SUBMIT_ORDER') {
        this.pendingActionAfterPhonePrompt = null;
        this.handleSubmitOrder();
      }
      this.cdr.detectChanges();
    };

    // Mã OTP cố định 111111 cho khách vãng lai và mọi khách hàng theo yêu cầu
    if (code === '111111') {
      onOtpSuccess();
      return;
    }

    // Kiểm tra OTP qua backend
    fetch(`${environment.apiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: targetPhone, otp: code })
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        onOtpSuccess();
      })
      .catch(() => {
        this.otpErrorMessage = 'Mã OTP không chính xác. Vui lòng nhập mã 111111.';
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  /** Xác nhận lưu số điện thoại vào hồ sơ cá nhân */
  confirmSavePhoneToProfile() {
    if (!this.phoneToSaveToProfile) return;
    this.isSavingPhoneToProfile = true;
    this.savePhoneError = '';
    const phone = this.phoneToSaveToProfile;

    // Dùng API changePhone chuyên biệt để chỉ liên kết SĐT, tuyệt đối không ghi đè họ tên / email / avatar
    this.sub.add(
      this.customerService.changePhone({
        newPhone: phone,
        otp: '111111'
      }).subscribe({
        next: (res) => {
          const savedPhone = res?.phone || phone;
          this.isSavingPhoneToProfile = false;
          this.showSavePhonePromptModal = false;
          if (this.currentUser) {
            this.currentUser.phone = savedPhone;
            this.currentUser.isPhoneVerified = true;
          }
          this.authService.updateCurrentUser({
            phone: savedPhone,
            isPhoneVerified: true
          });
          this.addVerifiedPhone(savedPhone);
          this.isPhoneVerified = true;
          this.phone = savedPhone;

          // Tiếp tục hành động dở dang nếu có
          if (this.pendingActionAfterPhonePrompt === 'SAVE_ADDRESS') {
            this.pendingActionAfterPhonePrompt = null;
            this.submitNewAddress();
          } else if (this.pendingActionAfterPhonePrompt === 'SUBMIT_ORDER') {
            this.pendingActionAfterPhonePrompt = null;
            this.handleSubmitOrder();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSavingPhoneToProfile = false;
          this.savePhoneError = err?.error?.message || 'Không thể lưu số điện thoại vào hồ sơ. Vui lòng thử lại hoặc chọn "Để lần sau".';
          this.cdr.detectChanges();
        }
      })
    );
  }

  /** Người dùng chọn 'Để lần sau': vẫn lưu số vào danh sách số đã xác thực để lần sau không bắt OTP */
  dismissSavePhonePrompt() {
    if (this.phoneToSaveToProfile) {
      this.addVerifiedPhone(this.phoneToSaveToProfile);
    }
    this.savePhoneError = '';
    this.showSavePhonePromptModal = false;
    if (this.pendingActionAfterPhonePrompt === 'SAVE_ADDRESS') {
      this.pendingActionAfterPhonePrompt = null;
      this.submitNewAddress();
    } else if (this.pendingActionAfterPhonePrompt === 'SUBMIT_ORDER') {
      this.pendingActionAfterPhonePrompt = null;
      this.handleSubmitOrder();
    }
    this.cdr.detectChanges();
  }

  // --- 8. Mã giảm giá (Đồng bộ qua PromotionService, không tự sinh voucher giả) ---
  get productPromotions(): Promotion[] {
    return this.systemPromotions.filter(p => !p.isFreeShip && !p.code.startsWith('FREESHIP'));
  }

  get displayedProductPromotions(): Promotion[] {
    return this.showAllProductVouchers ? this.productPromotions : this.productPromotions.slice(0, 3);
  }

  get hasMoreProductPromotions(): boolean {
    return this.productPromotions.length > 3;
  }

  get freeshipPromotions(): Promotion[] {
    return this.systemPromotions.filter(p => !!p.isFreeShip || p.code.startsWith('FREESHIP'));
  }

  get eligibleProductPromotionsCount(): number {
    return this.productPromotions.filter(p => this.isVoucherEligible(p)).length;
  }

  get eligibleFreeshipPromotionsCount(): number {
    return this.freeshipPromotions.filter(p => this.isVoucherEligible(p)).length;
  }

  get totalEligibleVouchersCount(): number {
    return this.eligibleProductPromotionsCount + this.eligibleFreeshipPromotionsCount;
  }

  openVoucherModal() {
    this.isVoucherModalOpen = true;
    this.voucherErrorMessage = null;
    this.showAllProductVouchers = false;
    this.promotionService.loadPromotions().subscribe();
  }

  closeVoucherModal() {
    this.isVoucherModalOpen = false;
  }

  toggleShowAllProductVouchers() {
    this.showAllProductVouchers = !this.showAllProductVouchers;
  }

  isVoucherEligible(v: Promotion): boolean {
    if (v.isActive === false) return false;
    if (v.minOrderValue && this.subTotal < v.minOrderValue) return false;
    if (v.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(v.productIds) && v.productIds.length > 0) {
      const idSet = new Set(v.productIds.map(x => String(x).trim()));
      const hasMatch = this.checkoutItems.some(it => idSet.has(String(it.productId || it.id || '').trim()));
      if (!hasMatch) return false;
    }
    return true;
  }

  amountNeededForVoucher(v: Promotion): number {
    const min = v.minOrderValue || 0;
    return Math.max(0, min - this.subTotal);
  }

  formatShortDiscount(val: number): string {
    if (!val || val <= 0) return '0₫';
    if (val >= 1000000) {
      const m = val / 1000000;
      return m % 1 === 0 ? `${m}tr` : `${m.toFixed(1)}tr`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(0)}k`;
    }
    return `${val}₫`;
  }

  applyCustomVoucher() {
    const code = (this.customVoucherInput || '').trim().toUpperCase();
    if (!code) {
      this.voucherErrorMessage = 'Vui lòng nhập mã ưu đãi.';
      return;
    }

    this.isCheckingVoucher = true;
    this.voucherErrorMessage = null;
    this.manuallyRemovedProduct = false;
    this.manuallyRemovedFreeship = false;

    this.promotionService.applyPromotion(code, this.subTotal, this.checkoutItems).subscribe(res => {
      this.isCheckingVoucher = false;
      if (!res.success) {
        this.voucherErrorMessage = res.message;
      } else {
        this.voucherErrorMessage = null;
        this.customVoucherInput = '';
      }
      this.cdr.detectChanges();
    });
  }

  applyVoucherDirectly(v: Promotion) {
    if (!this.isVoucherEligible(v)) {
      if (v.scope === 'SPECIFIC_PRODUCTS' && v.productIds?.length) {
        this.voucherErrorMessage = `Mã "${v.code}" chỉ áp dụng cho các sản phẩm chọn lọc, chưa có trong đơn hàng hiện tại.`;
      } else {
        this.voucherErrorMessage = `Đơn hàng cần tối thiểu ${this.formatCurrency(v.minOrderValue || 0)} để áp dụng mã "${v.code}".`;
      }
      return;
    }
    this.voucherErrorMessage = null;
    const isFreeship = !!v.isFreeShip || v.code.startsWith('FREESHIP');
    if (isFreeship) {
      this.manuallyRemovedFreeship = false;
    } else {
      this.manuallyRemovedProduct = false;
    }
    this.promotionService.applyPromotion(v.code, this.subTotal, this.checkoutItems).subscribe(res => {
      if (!res.success) {
        this.voucherErrorMessage = res.message;
      } else {
        this.voucherErrorMessage = null;
      }
      this.cdr.detectChanges();
    });
  }

  applyVoucherCode() {
    this.customVoucherInput = this.voucherInput;
    this.applyCustomVoucher();
  }

  removeProductVoucher() {
    this.manuallyRemovedProduct = true;
    this.promotionService.removeAppliedPromotion();
    this.voucherInput = '';
    this.voucherSuccessMessage = null;
    this.voucherErrorMessage = null;
    this.cdr.detectChanges();
  }

  removeFreeshipVoucher() {
    this.manuallyRemovedFreeship = true;
    this.promotionService.removeAppliedFreeship();
    this.voucherErrorMessage = null;
    this.cdr.detectChanges();
  }

  removeVoucher() {
    this.removeProductVoucher();
  }

  recalculateVoucher() {
    this.promotionService.recalculate(this.subTotal);
    if (this.subTotal > 0) {
      this.promotionService.autoApplyBestPromotions(
        this.subTotal,
        false,
        this.manuallyRemovedProduct,
        this.manuallyRemovedFreeship,
        this.checkoutItems
      );
    }
  }

  // --- 9. Tiến hành Đặt hàng với kiểm tra định dạng toàn diện ---
  handleSubmitOrder(e?: Event) {
    if (e) {
      e.preventDefault();
    }
    this.orderErrorMessage = null;
    this.addressSelectionError = '';

    if (this.checkoutItems.length === 0) {
      this.orderErrorMessage = 'Giỏ hàng của bạn đang trống. Vui lòng quay lại chọn sản phẩm trước khi thanh toán.';
      return;
    }

    // Tự động áp dụng mã tốt nhất nếu có khi đặt hàng
    if (this.subTotal > 0) {
      this.promotionService.autoApplyBestPromotions(
        this.subTotal,
        false,
        this.manuallyRemovedProduct,
        this.manuallyRemovedFreeship,
        this.checkoutItems
      );
    }

    // Kiểm tra đã có địa chỉ nhận hàng từ Sổ địa chỉ chưa
    if (!this.hasSelectedAddress) {
      this.addressSelectionError = '⚠ Vui lòng chọn hoặc điền thông tin địa chỉ nhận hàng trước khi thanh toán.';
      this.orderErrorMessage = 'Vui lòng mở Sổ địa chỉ để chọn hoặc nhập thông tin nhận hàng trước khi thanh toán.';
      this.openAddressBookModal('select');
      return;
    }

    // Trigger validation các trường
    this.onFullNameBlur();
    this.onPhoneBlur();
    this.onEmailBlur();
    this.onAddressBlur();
    if (this.isInvoiceRequired) {
      this.onInvoiceEmailBlur();
      if (!this.companyName.trim()) this.errors.companyName = 'Vui lòng nhập tên công ty.';
      if (!this.taxCode.trim()) this.errors.taxCode = 'Vui lòng nhập mã số thuế.';
      if (!this.companyAddress.trim()) this.errors.companyAddress = 'Vui lòng nhập địa chỉ công ty.';
    }

    // Kiểm tra xem có lỗi format nào không
    const errorKeys = Object.keys(this.errors) as (keyof typeof this.errors)[];
    if (errorKeys.length > 0) {
      this.orderErrorMessage = this.errors[errorKeys[0]] || 'Vui lòng kiểm tra và sửa các thông tin chưa đúng định dạng.';
      return;
    }

    // Bắt buộc xác thực OTP nếu số điện thoại này chưa được xác minh
    if (this.isPhoneOtpRequired(this.phone)) {
      this.orderErrorMessage = 'Vui lòng xác thực số điện thoại bằng mã OTP trước khi đặt hàng.';
      this.pendingActionAfterPhonePrompt = 'SUBMIT_ORDER';
      this.sendOtp();
      return;
    }

    // Đơn > 50 triệu không cho phép COD
    if (this.isHighValueOrder && this.paymentMethod === 'COD') {
      this.orderErrorMessage = 'Đơn hàng trên 50 triệu không hỗ trợ hình thức COD. Vui lòng chọn Chuyển khoản ngân hàng.';
      this.paymentMethod = 'BANK_TRANSFER';
      return;
    }

    // Bắt đầu xử lý đơn (Chống bấm đúp)
    this.isSubmittingOrder = true;

    // Gửi payload tạo đơn đến Server
    const orderPayload = {
      receiverName: (this.fullName || '').trim(),
      phone: (this.phone || '').trim(),
      email: (this.email || '').trim() || undefined,
      province: this.selectedProvince,
      district: this.selectedDistrict,
      ward: this.selectedWard,
      detailAddress: (() => {
        let s = (this.streetAddress || '').trim();
        if (this.selectedProvince && s.toLowerCase().includes(this.selectedProvince.toLowerCase())) {
          s = s.split(',')[0].trim();
        }
        return s;
      })(),
      address: (this.address || '').trim(),
      shippingNotes: (this.shippingNotes || '').trim() || undefined,
      paymentMethod: this.paymentMethod,
      voucherCode: this.appliedVoucher?.code || undefined,
      freeshipVoucherCode: this.appliedFreeshipVoucher?.code || undefined,
      isGift: false,
      hideInvoicePrice: !this.showPriceOnInvoice,
      items: this.checkoutItems.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price
      })),
      invoice: this.isInvoiceRequired ? {
        companyName: (this.companyName || '').trim(),
        taxCode: (this.taxCode || '').trim(),
        companyAddress: (this.companyAddress || '').trim(),
        invoiceEmail: (this.invoiceEmail || '').trim()
      } : undefined
    };

    // Phân biệt lỗi server thật vs lỗi mạng để quyết định có fallback hay không
    let serverRejected = false;
    let serverErrorMessage = '';

    fetch(`${environment.apiUrl}/store/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dcor_customer_token') || ''}`
      },
      body: JSON.stringify(orderPayload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            serverRejected = true;
            serverErrorMessage = errData.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
            throw new Error(serverErrorMessage);
          });
        }
        return res.json();
      })
      .then(orderData => {
        this.finishOrderCreation(orderData.orderNumber || `DC-${Math.floor(100000 + Math.random() * 900000)}`);
      })
      .catch((err) => {
        if (serverRejected) {
          // Lỗi có chủ đích từ server (rate limit 429, validation 400, etc.)
          // => KHÔNG tạo fallback, chỉ hiển thị thông báo lỗi
          this.orderErrorMessage = serverErrorMessage || err?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.';
        } else {
          // Lỗi mạng / backend chưa mount endpoint => fallback tạo mã đơn local
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          this.finishOrderCreation(`DC-${randomNum}`);
        }
      })
      .finally(() => {
        this.isSubmittingOrder = false;
        this.cdr.detectChanges();
      });
  }

  private finishOrderCreation(orderNumber: string) {
    this.createdOrder = {
      orderNumber,
      createdAt: new Date(),
      receiverName: this.fullName,
      phone: this.phone,
      email: this.email,
      address: this.address,
      paymentMethod: this.paymentMethod,
      totalAmount: this.totalAmount,
      depositAmount: this.isHighValueOrder ? this.depositAmount : undefined,
      remainingAmount: this.isHighValueOrder ? this.remainingAmount : undefined,
      deliveryEstimate: '3 - 5 ngày làm việc',
      isGift: false,
      hideInvoicePrice: !this.showPriceOnInvoice,
      items: [...this.checkoutItems]
    };

    // Xóa các sản phẩm đã mua khỏi giỏ hàng
    const boughtIds = this.checkoutItems.map(i => i.id);
    this.cartService.removeMultiple(boughtIds).subscribe({
      next: () => {},
      error: () => {}
    });
    sessionStorage.removeItem('dcor_checkout_items');
    this.promotionService.removeAppliedPromotion();
    this.promotionService.removeAppliedFreeship();
    this.promotionService.loadPromotions().subscribe();

    // Lưu đơn vào danh sách đơn của khách để hiển thị tại "Đơn hàng của tôi"
    try {
      const existing = JSON.parse(localStorage.getItem('dcor_placed_orders') || '[]');
      const firstItem = (this.checkoutItems && this.checkoutItems.length > 0 ? this.checkoutItems[0] : null) as any;
      const isBankTransfer = this.paymentMethod === 'BANK_TRANSFER';
      const newEntry = {
        id: orderNumber,
        phone: this.phone ? this.phone.trim() : '',
        date: new Date().toISOString().split('T')[0],
        total: this.totalAmount || 0,
        status: this.isHighValueOrder ? 'Chờ đặt cọc' : (isBankTransfer ? 'Chờ thanh toán' : 'Chờ xác nhận'),
        statusKey: this.isHighValueOrder ? 'PENDING_PAYMENT' : (isBankTransfer ? 'PENDING_PAYMENT' : 'PENDING'),
        paymentMethod: this.paymentMethod,
        paymentStatus: 'UNPAID',
        items: this.checkoutItems.length || 1,
        depositAmount: this.isHighValueOrder ? this.depositAmount : undefined,
        firstProductName: firstItem?.name || firstItem?.productName || `Đơn hàng DCor #${orderNumber}`,
        imageUrl: firstItem?.image || firstItem?.imageUrl || 'assets/img/furniture-placeholder.svg'
      };
      existing.unshift(newEntry);
      localStorage.setItem('dcor_placed_orders', JSON.stringify(existing));
    } catch (_) {}

    // Lưu số điện thoại khách vãng lai để tự động tải đơn hàng
    if (!this.isLoggedIn && this.phone) {
      this.authService.setGuestPhone(this.phone.trim(), 'guest-order-token');
    }

    // Luôn luôn hiển thị popup Bạn đã đặt hàng thành công
    // Nếu là đơn cần chuyển khoản hoặc đặt cọc (> 50 triệu), popup tích hợp luôn khối thanh toán & mã QR
    this.showSuccessModal = true;
    this.showDepositModal = false;

    // Chuyển sang màn hình Đặt hàng thành công làm nền
    this.currentStep = 'success';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- 10. Hành động ở Trang Đặt hàng thành công ---
  copyOrderNumber() {
    if (this.createdOrder?.orderNumber) {
      navigator.clipboard.writeText(this.createdOrder.orderNumber);
    }
  }

  handleRegisterGuest() {
    if (!this.registerPassword || this.registerPassword.length < 6) {
      alert('Vui lòng nhập mật khẩu tối thiểu 6 ký tự.');
      return;
    }

    this.isRegisteringGuest = true;
    fetch(`${environment.apiUrl}/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: this.fullName,
        phone: this.phone,
        email: this.email || undefined,
        password: this.registerPassword
      })
    })
      .finally(() => {
        this.isRegisteringGuest = false;
        this.guestRegisterSuccess = true;
        this.cdr.detectChanges();
      });
  }

  onOrderItemImageError(event: Event) {
    applyImageErrorFallback(event);
  }

  handleSaveGoogleAddress(agree: boolean) {
    if (agree) {
      this.googleAddressSaved = true;
      const customerToken =
        sessionStorage.getItem('dcor_customer_token') ||
        localStorage.getItem('dcor_customer_token') ||
        '';
      fetch(`${environment.apiUrl}/customer/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {})
        },
        body: JSON.stringify({
          receiverName: this.fullName?.trim() || this.currentUser?.fullName || 'Khách hàng',
          phone: this.phone?.trim() || '',
          province: this.selectedProvince || 'Thành phố Hồ Chí Minh',
          district: this.selectedDistrict || '',
          ward: this.selectedWard || '',
          detail: (this.streetAddress || this.address || '').trim(),
          isDefault: true
        })
      }).catch(() => {});
    }
    if (this.dontAskSaveGoogleAddress) {
      localStorage.setItem('dcor_dont_ask_google_addr', 'true');
    }
  }
}
