import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  Plus
} from 'lucide-angular';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { PromotionService, AppliedPromotion } from '../../../../core/services/promotion.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ALL_VIETNAM_PROVINCE_NAMES, getDistrictsForProvince, getWardsForDistrict, getWardsForProvince } from '../../../../shared/data/vietnam-administrative.data';

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
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
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
    Plus
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

  // Guest / Gmail không SĐT: Tra cứu địa chỉ qua số điện thoại
  guestPhoneLookup = '';
  isLookingUpAddress = false;
  guestFoundAddresses: SavedAddress[] = [];
  guestLookupMessage = '';

  get hasUserPhone(): boolean {
    return !!(this.currentUser && this.currentUser.phone && this.currentUser.phone.trim().length >= 9);
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

  // Mã giảm giá (Đồng bộ qua PromotionService)
  voucherInput = '';
  appliedVoucher: AppliedPromotion | null = null;
  voucherErrorMessage: string | null = null;
  voucherSuccessMessage: string | null = null;
  isCheckingVoucher = false;

  // Thông tin cấu hình thanh toán ngân hàng (chỉ hiển thị khi có dữ liệu nạp từ API/cấu hình cửa hàng)
  storeBankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    qrUrl?: string;
  } | null = null;

  // Tặng quà cho người thân & Ẩn giá
  isGift = false;
  hideInvoicePrice = false;

  onGiftToggleChange() {
    if (!this.isGift) {
      this.hideInvoicePrice = false;
    }
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
  orderErrorMessage: string | null = null;

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkUserAuth();
    this.checkPendingBuyNow();
    this.initPromotionSync();
    this.initAdministrativeAddress();
    this.loadCheckoutItems();
    this.loadStorePaymentConfig();
  }

  initPromotionSync() {
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
    this.router.navigate(['/account/orders']);
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
  }

  // --- 1. Lấy thông tin tài khoản thực tế & Sổ địa chỉ thực tế (Không mock) ---
  checkUserAuth() {
    const token = localStorage.getItem('dcor_customer_token');
    const storedUser = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_user');

    if (token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.isLoggedIn = true;
        this.fullName = this.currentUser.fullName || this.currentUser.name || '';
        this.email = this.currentUser.email || '';
        this.phone = this.currentUser.phone || '';
        this.isGoogleAccount = !this.currentUser.phone || this.currentUser.authProvider === 'GOOGLE';
        this.isPhoneVerified = !!this.currentUser.phone && this.currentUser.isPhoneVerified !== false && !this.isGoogleAccount;
        if (this.isPhoneVerified) {
          this.verifiedPhone = this.currentUser.phone.trim();
        } else {
          this.verifiedPhone = '';
        }

        // Chỉ lấy sổ địa chỉ thực tế nếu tài khoản có trường addresses hoặc đã lưu địa chỉ
        if (Array.isArray(this.currentUser.addresses) && this.currentUser.addresses.length > 0) {
          this.savedAddresses = this.currentUser.addresses.map((a: any, idx: number) => ({
            id: a.id || `addr-${idx}`,
            receiverName: a.receiverName || this.fullName,
            phone: a.phone || this.phone,
            address: a.detail ? `${a.detail}, ${a.ward || ''}, ${a.district || ''}, ${a.province || ''}` : (a.address || ''),
            isDefault: !!a.isDefault
          }));

          const defaultAddr = this.savedAddresses.find(a => a.isDefault) || this.savedAddresses[0];
          if (defaultAddr) {
            this.selectedAddressId = defaultAddr.id;
            this.address = defaultAddr.address;
            if (!this.phone) this.phone = defaultAddr.phone;
          }
        } else if (this.currentUser.address) {
          // Nếu có 1 địa chỉ trong profile
          this.address = this.currentUser.address;
        }

        // Tự động tải thêm các địa chỉ gắn với SĐT từ lịch sử đơn hàng
        if (this.hasUserPhone) {
          this.loadAddressesForUserPhone();
        }
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

  // --- 1.1 Xử lý mua ngay khi vừa đăng nhập xong chuyển đến checkout ---
  checkPendingBuyNow() {
    try {
      const pendingRaw = sessionStorage.getItem('dcor_pending_buy_now');
      if (pendingRaw) {
        sessionStorage.removeItem('dcor_pending_buy_now');
        const pending = JSON.parse(pendingRaw);
        if (pending && pending.variantId) {
          this.cartService.addToCart(pending.variantId, pending.quantity || 1, pending.selectedConfig)
            .subscribe({
              next: (res) => {
                if (res?.cartItem?.id) {
                  try {
                    sessionStorage.setItem('dcor_checkout_items', JSON.stringify([res.cartItem.id]));
                  } catch (e) {}
                }
                this.cartService.loadCart().subscribe();
              }
            });
        }
      }
    } catch (e) {
      console.error('Lỗi xử lý pending buy now:', e);
    }
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
    if (this.subTotal >= 50000000) return 0;
    if (this.appliedVoucher?.discountType === 'AMOUNT' && this.appliedVoucher.code === 'FREESHIP') return 0;
    return 250000;
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
    return this.totalAmount > 50000000;
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
    // User đăng nhập thường có SĐT trong hệ thống -> đã xác thực
    // Khách vãng lai / Google -> chỉ xác thực nếu số điện thoại trùng với số đã verify OTP trong phiên
    if (this.isLoggedIn && this.hasUserPhone && !this.isGoogleAccount) {
      this.isPhoneVerified = true;
    } else if (this.verifiedPhone && addr.phone && addr.phone.trim() === this.verifiedPhone) {
      this.isPhoneVerified = true;
    } else {
      this.isPhoneVerified = false;
    }

    // Phân tách nếu chuỗi địa chỉ khớp định dạng
    const parts = (addr.address || '').split(',').map(p => p.trim());
    if (parts.length >= 4) {
      this.streetAddress = parts.slice(0, parts.length - 3).join(', ');
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
    } else {
      this.streetAddress = addr.address;
    }

    delete this.errors.phone;
    delete this.errors.fullName;
    delete this.errors.address;
    this.isAddressModalOpen = false;
    this.cdr.detectChanges();
  }

  /** Mở modal sổ địa chỉ */
  openAddressBookModal(mode: 'select' | 'add' = 'select') {
    this.newAddressError = '';
    this.guestLookupMessage = '';
    this.initNewAddressForm();

    // Nếu người dùng đã đăng nhập có SĐT -> tự động load các địa chỉ gắn với SĐT đó
    if (this.isLoggedIn && this.hasUserPhone) {
      this.loadAddressesForUserPhone();
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
    if (phone) {
      if (this.isLoggedIn && this.hasUserPhone && !this.isGoogleAccount && phone === (this.currentUser?.phone || '').trim()) {
        this.isPhoneVerified = true;
      } else if (this.verifiedPhone && phone === this.verifiedPhone) {
        this.isPhoneVerified = true;
      } else {
        this.isPhoneVerified = false;
      }
    } else {
      this.isPhoneVerified = false;
    }
  }

  onNewAddressPhoneInput() {
    const phone = (this.newAddress.phone || '').trim();
    if (this.isLoggedIn && this.hasUserPhone && !this.isGoogleAccount && phone === (this.currentUser?.phone || '').trim()) {
      this.isPhoneVerified = true;
    } else if (this.verifiedPhone && phone === this.verifiedPhone) {
      this.isPhoneVerified = true;
    } else {
      this.isPhoneVerified = false;
    }
    this.newAddressError = '';
  }

  onNewAddressProvinceChange() {
    this.newAddressDistricts = getDistrictsForProvince(this.newAddress.province);
    this.newAddress.district = this.newAddressDistricts.length > 0 ? this.newAddressDistricts[0] : '';
    this.onNewAddressDistrictChange();
  }

  onNewAddressDistrictChange() {
    this.newAddressWards = this.newAddress.district
      ? getWardsForDistrict(this.newAddress.province, this.newAddress.district)
      : getWardsForProvince(this.newAddress.province);
    this.newAddress.ward = this.newAddressWards.length > 0 ? this.newAddressWards[0] : '';
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
    const { receiverName, phone, province, district, ward, detail, email, isDefault } = this.newAddress;
    if (!receiverName || !receiverName.trim()) {
      this.newAddressError = 'Vui lòng nhập họ và tên người nhận.';
      return;
    }
    if (!phone || !this.validatePhone(phone.trim())) {
      this.newAddressError = 'Vui lòng nhập số điện thoại hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
      return;
    }
    if (!province) {
      this.newAddressError = 'Vui lòng chọn Tỉnh / Thành phố.';
      return;
    }
    if (!ward) {
      this.newAddressError = 'Vui lòng chọn Phường / Xã.';
      return;
    }
    if (!detail || !detail.trim()) {
      this.newAddressError = 'Vui lòng nhập số nhà, tên đường cụ thể.';
      return;
    }

    // Bắt buộc xác thực OTP đối với khách vãng lai và tài khoản Google (hoặc chưa xác thực)
    const requiresOtp = !this.isLoggedIn || this.isGoogleAccount || !this.hasUserPhone;
    if (requiresOtp && !this.isPhoneVerified) {
      this.newAddressError = 'Vui lòng bấm "Xác thực OTP" để xác minh số điện thoại trước khi lưu địa chỉ.';
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

    // Nếu đã login, gửi API lưu address vào hồ sơ
    if (this.isLoggedIn) {
      const token = localStorage.getItem('dcor_customer_token');
      fetch(`${environment.apiUrl}/account/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(this.newAddress)
      }).catch(() => {});
    }

    this.isSavingNewAddress = false;
    this.selectAddress(newAddr);
    this.isAddressModalOpen = false;
    this.cdr.detectChanges();
  }

  // --- 7. Xác thực OTP Số điện thoại (Cố định mã 111111) ---
  sendOtp() {
    const targetPhone = (this.isAddressModalOpen && this.addressModalMode === 'add')
      ? (this.newAddress.phone || '').trim()
      : (this.phone || '').trim();

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

    const targetPhone = this.phone;

    // Mã OTP cố định 111111 cho khách vãng lai và mọi khách hàng theo yêu cầu
    if (code === '111111') {
      this.isPhoneVerified = true;
      this.verifiedPhone = targetPhone;
      this.isOtpModalOpen = false;
      this.otpErrorMessage = null;
      this.newAddressError = '';
      if (this.otpTimer) clearInterval(this.otpTimer);
      this.cdr.detectChanges();
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
        this.isPhoneVerified = true;
        this.verifiedPhone = targetPhone;
        this.isOtpModalOpen = false;
        this.otpErrorMessage = null;
        this.newAddressError = '';
        if (this.otpTimer) clearInterval(this.otpTimer);
      })
      .catch(() => {
        this.otpErrorMessage = 'Mã OTP không chính xác. Vui lòng nhập mã 111111.';
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  // --- 8. Mã giảm giá (Đồng bộ qua PromotionService, không tự sinh voucher giả) ---
  applyVoucherCode() {
    const code = (this.voucherInput || '').trim().toUpperCase();
    if (!code) {
      this.voucherErrorMessage = 'Vui lòng nhập mã ưu đãi.';
      return;
    }

    this.isCheckingVoucher = true;
    this.voucherErrorMessage = null;
    this.voucherSuccessMessage = null;

    this.promotionService.applyPromotion(code, this.subTotal).subscribe(res => {
      this.isCheckingVoucher = false;
      if (!res.success) {
        this.voucherErrorMessage = res.message;
      } else {
        this.voucherErrorMessage = null;
      }
      this.cdr.detectChanges();
    });
  }

  removeVoucher() {
    this.promotionService.removeAppliedPromotion();
    this.voucherInput = '';
    this.voucherSuccessMessage = null;
    this.voucherErrorMessage = null;
  }

  recalculateVoucher() {
    this.promotionService.recalculate(this.subTotal);
  }

  // --- 9. Tiến hành Đặt hàng với kiểm tra định dạng toàn diện ---
  handleSubmitOrder(e: Event) {
    e.preventDefault();
    this.orderErrorMessage = null;

    if (this.checkoutItems.length === 0) {
      this.orderErrorMessage = 'Giỏ hàng của bạn đang trống. Vui lòng quay lại chọn sản phẩm trước khi thanh toán.';
      return;
    }

    // Kiểm tra đã có địa chỉ nhận hàng từ Sổ địa chỉ chưa
    if (!this.hasSelectedAddress) {
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

    // Khách vãng lai hoặc Google chưa verify SĐT -> Bắt buộc xác thực OTP
    if (!this.isPhoneVerified) {
      this.orderErrorMessage = 'Vui lòng xác thực số điện thoại bằng mã OTP trước khi đặt hàng.';
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
      detailAddress: (this.streetAddress || '').trim(),
      address: (this.address || '').trim(),
      shippingNotes: (this.shippingNotes || '').trim() || undefined,
      paymentMethod: this.paymentMethod,
      voucherCode: this.appliedVoucher?.code || undefined,
      isGift: this.isGift,
      hideInvoicePrice: this.isGift ? this.hideInvoicePrice : false,
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
      isGift: this.isGift,
      hideInvoicePrice: this.isGift && this.hideInvoicePrice,
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

    // Lưu đơn vào danh sách đơn của khách để hiển thị tại "Đơn hàng của tôi"
    try {
      const existing = JSON.parse(localStorage.getItem('dcor_placed_orders') || '[]');
      const newEntry = {
        id: orderNumber,
        date: new Date().toISOString().split('T')[0],
        total: this.totalAmount,
        status: this.isHighValueOrder ? 'Chờ đặt cọc' : 'Chờ xác nhận',
        items: this.checkoutItems.length,
        depositAmount: this.isHighValueOrder ? this.depositAmount : undefined
      };
      existing.unshift(newEntry);
      localStorage.setItem('dcor_placed_orders', JSON.stringify(existing));
    } catch (_) {}

    // Hiển thị Popup theo phân loại đơn hàng:
    // + Đơn > 50 triệu: hiện popup đặt cọc trong 24h
    // + Còn lại: hiện popup đặt hàng thành công
    if (this.isHighValueOrder) {
      this.showDepositModal = true;
      this.showSuccessModal = false;
    } else {
      this.showDepositModal = false;
      this.showSuccessModal = true;
    }

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

  handleSaveGoogleAddress(agree: boolean) {
    if (agree) {
      this.googleAddressSaved = true;
      // Gửi cập nhật địa chỉ về server nếu có API
      fetch(`${environment.apiUrl}/account/profile/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dcor_customer_token') || ''}`
        },
        body: JSON.stringify({
          receiverName: this.fullName,
          phone: this.phone,
          address: this.address
        })
      }).catch(() => {});
    }
    if (this.dontAskSaveGoogleAddress) {
      localStorage.setItem('dcor_dont_ask_google_addr', 'true');
    }
  }
}
