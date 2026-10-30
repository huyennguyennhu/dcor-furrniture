import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  LucideAngularModule,
  Sparkles,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  FileText,
  Image as ImageIcon,
  Ruler,
  Layers,
  Palette,
  Coins,
  MapPin,
  Send,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-angular';
import { environment } from '../../../../environments/environment';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  previewUrl: string;
}

export interface CustomAttributeItem {
  groupId: string;
  label: string;
  type: 'color' | 'size' | 'material' | 'general';
  originalValue: string;
  originalOptionId: string;
  options: { id: string; name: string; hexColor?: string | null; image?: string | null }[];
  selectedOptionId: string;
  selectedOptionName: string;
  customNote: string;
}

export interface BudgetRangeItem {
  label: string;
  value: string;
  hint?: string;
}

@Component({
  selector: 'app-custom-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './custom-request-modal.html',
  styleUrls: ['./custom-request-modal.css']
})
export class CustomRequestModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() product: any = null;
  @Input() matchedVariant: any = null;
  @Input() attributeGroups: any[] = [];
  @Input() selectedAttributes: Record<string, string> = {};
  @Input() dimensionsText = '';

  @Output() close = new EventEmitter<void>();
  @Output() submitSuccess = new EventEmitter<any>();

  icons = {
    Sparkles,
    X,
    Check,
    CheckCircle2,
    AlertCircle,
    Upload,
    Trash2,
    FileText,
    ImageIcon,
    Ruler,
    Layers,
    Palette,
    Coins,
    MapPin,
    Send,
    ShieldCheck,
    ExternalLink,
    ChevronRight,
    Info
  };

  // User State
  isLoggedIn = false;
  isGoogleAccount = false;
  currentUser: any = null;

  // Form Fields - Khối 1: Thông tin liên hệ
  fullName = '';
  phone = '';
  email = '';
  address = '';
  selectedAddressInfo: any = null;
  isPhoneVerified = false;

  // OTP Verification state
  isOtpModalOpen = false;
  otpCode = '';
  otpCountdown = 0;
  private otpTimer: any = null;
  otpErrorMessage: string | null = null;
  isSendingOtp = false;
  verifiedPhone = '';

  // Form Fields - Khối 2: Tùy biến dựa trên thuộc tính thật của sản phẩm
  hasDimensions = false;
  originalDimensions = '';
  requestedDimensions = '';
  customDimensionNote = '';
  dimensionSizeOptions: any[] = [];
  selectedDimensionOptionId = '';

  activeCustomAttributes: CustomAttributeItem[] = [];
  requirementDetails = '';

  // Khoảng ngân sách động theo giá sản phẩm thực tế
  dynamicBudgetRanges: BudgetRangeItem[] = [];
  selectedBudgetRange = '';
  estimatedBudget = '';

  // Form Fields - Khối 3: Tệp tư liệu
  uploadedFiles: UploadedFileItem[] = [];
  isDraggingFile = false;

  // Form control & validation
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;
  isSubmittedSuccess = false;
  createdRequestCode = '';
  createdRequestDate = '';

  // Cảnh báo thoát khi chưa lưu
  showConfirmClose = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.checkUserAuth();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.checkUserAuth();
      this.isSubmittedSuccess = false;
      this.showConfirmClose = false;
      this.initFormDefaults();
    } else if (this.isOpen && (changes['product'] || changes['matchedVariant'] || changes['attributeGroups'] || changes['selectedAttributes'])) {
      this.initFormDefaults();
    }
  }

  // --- 1. USER AUTH & PREFILL ---
  checkUserAuth() {
    if (typeof localStorage === 'undefined') return;
    const token = localStorage.getItem('dcor_customer_token');
    const storedUser = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_user');

    if (token && storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.isLoggedIn = true;
        this.isGoogleAccount = !this.currentUser.phone || this.currentUser.authProvider === 'GOOGLE';

        // Prefill tên
        this.fullName = this.currentUser.fullName || this.currentUser.name || '';
        // Prefill email
        this.email = this.currentUser.email || '';

        // Prefill SĐT
        if (this.currentUser.phone && !this.isGoogleAccount) {
          this.phone = this.currentUser.phone.trim();
          this.isPhoneVerified = true;
          this.verifiedPhone = this.phone;
        } else if (this.currentUser.phone) {
          this.phone = this.currentUser.phone.trim();
          this.isPhoneVerified = !!this.currentUser.isPhoneVerified;
          this.verifiedPhone = this.isPhoneVerified ? this.phone : '';
        } else {
          this.phone = '';
          this.isPhoneVerified = false;
          this.verifiedPhone = '';
        }

        // Prefill địa chỉ nếu có
        if (this.currentUser.address && !this.address) {
          this.address = this.currentUser.address;
        }
      } catch {
        this.isLoggedIn = false;
      }
    } else {
      this.isLoggedIn = false;
      this.isGoogleAccount = false;
      this.currentUser = null;
    }
  }

  // --- 2. KHỞI TẠO DỮ LIỆU THẬT THEO TỪNG SẢN PHẨM ---
  initFormDefaults() {
    this.formErrors = {};
    this.activeCustomAttributes = [];
    this.dimensionSizeOptions = [];
    this.selectedDimensionOptionId = '';

    // 1. Phân tích Kích thước (Dimensions) thực tế
    this.initDimensionsInfo();

    // 2. Phân tích các thuộc tính thực tế mà sản phẩm sở hữu
    this.initRealAttributes();

    // 3. Khởi tạo khoảng ngân sách linh hoạt theo giá sản phẩm thực tế
    this.initDynamicBudgetRanges();

    this.cdr.detectChanges();
  }

  private initDimensionsInfo() {
    const prod = this.product;
    const variant = this.matchedVariant;

    // Kiểm tra nhóm kích thước trong attributeGroups
    const sizeGroup = (this.attributeGroups || []).find((g: any) =>
      g.groupId === 'vaConfigurationSize' ||
      g.groupId === 'vaMattressSize' ||
      (g.label && (g.label.toLowerCase().includes('kích thước') || g.label.toLowerCase().includes('size')))
    );

    let foundDimensions = '';

    if (sizeGroup) {
      this.dimensionSizeOptions = sizeGroup.options || [];
      const selOptId = this.selectedAttributes?.[sizeGroup.groupId] || variant?.optionValues?.[sizeGroup.groupId];
      const opt = sizeGroup.options?.find((o: any) => o.id === selOptId) || sizeGroup.options?.[0];
      if (opt) {
        this.selectedDimensionOptionId = opt.id;
        foundDimensions = opt.name;
      }
    }

    if (!foundDimensions && this.dimensionsText && this.dimensionsText.trim()) {
      foundDimensions = this.dimensionsText.trim();
    }

    if (!foundDimensions && variant?.dimensions) {
      const d = variant.dimensions;
      const w = d.width || d.w;
      const dp = d.depth || d.d || d.length;
      const h = d.height || d.h;
      if (w && dp && h) foundDimensions = `${w} x ${dp} x ${h} cm`;
      else if (w && dp) foundDimensions = `${w} x ${dp} cm`;
    }

    if (!foundDimensions && variant?.attributes) {
      const a = variant.attributes;
      const parts: string[] = [];
      if (a.diameter) parts.push(`Đường kính: ${a.diameter}`);
      if (a.width) parts.push(`Rộng: ${a.width}`);
      if (a.length) parts.push(`Dài: ${a.length}`);
      if (a.depth) parts.push(`Sâu: ${a.depth}`);
      if (a.height) parts.push(`Cao: ${a.height}`);
      if (parts.length > 0) foundDimensions = parts.join(' • ');
    }

    if (!foundDimensions && prod?.dimensions) {
      const d = prod.dimensions;
      if (typeof d === 'string') foundDimensions = d;
      else if (d.width && d.depth && d.height) foundDimensions = `${d.width} x ${d.depth} x ${d.height} cm`;
    }

    if (foundDimensions) {
      this.hasDimensions = true;
      this.originalDimensions = foundDimensions;
      if (!this.requestedDimensions) {
        this.requestedDimensions = '';
      }
    } else {
      this.hasDimensions = false;
      this.originalDimensions = '';
      this.requestedDimensions = '';
    }
  }

  private initRealAttributes() {
    const prod = this.product;
    const variant = this.matchedVariant;
    const groups = this.attributeGroups || [];

    // Lọc bỏ nhóm kích thước vì đã quản lý riêng ở khối Kích thước
    const nonSizeGroups = groups.filter((g: any) =>
      g.groupId !== 'vaConfigurationSize' &&
      g.groupId !== 'vaMattressSize' &&
      !(g.label && (g.label.toLowerCase().includes('kích thước') || g.label.toLowerCase().includes('size')))
    );

    if (nonSizeGroups.length > 0) {
      for (const g of nonSizeGroups) {
        const type = this.determineAttributeType(g);
        const selId = this.selectedAttributes?.[g.groupId] || variant?.optionValues?.[g.groupId];
        const currentOpt = (g.options || []).find((o: any) => o.id === selId) || g.options?.[0];
        const originalValue = currentOpt ? currentOpt.name : (variant?.name || 'Tiêu chuẩn');
        const originalOptionId = currentOpt ? currentOpt.id : '';

        this.activeCustomAttributes.push({
          groupId: g.groupId,
          label: g.label || g.groupId,
          type,
          originalValue,
          originalOptionId,
          options: (g.options || []).map((o: any) => ({
            id: String(o.id),
            name: o.name,
            hexColor: o.hexColor || this.detectColor(o.name).hex,
            image: o.image || null
          })),
          selectedOptionId: originalOptionId,
          selectedOptionName: originalValue,
          customNote: ''
        });
      }
    } else if (prod?.configOptions?.attributes && prod.configOptions.attributes.length > 0) {
      // Fallback nếu attributeGroups chưa được truyền từ component cha
      for (const attr of prod.configOptions.attributes) {
        if (attr.groupId === 'vaConfigurationSize' || attr.groupId === 'vaMattressSize') continue;
        const opts = (attr.options || []).map((o: any) => ({
          id: String(o.id),
          name: o.name,
          hexColor: o.hexColor || this.detectColor(o.name).hex,
          image: o.image || null
        }));
        const originalValue = opts[0]?.name || 'Tiêu chuẩn';
        this.activeCustomAttributes.push({
          groupId: attr.groupId,
          label: attr.groupName || attr.groupId,
          type: this.determineAttributeType({ groupId: attr.groupId, label: attr.groupName || '' }),
          originalValue,
          originalOptionId: opts[0]?.id || '',
          options: opts,
          selectedOptionId: opts[0]?.id || '',
          selectedOptionName: originalValue,
          customNote: ''
        });
      }
    } else if (prod?.material || prod?.description) {
      // Sản phẩm đơn không có nhóm thuộc tính nhưng có mô tả chất liệu thực tế
      const mat = prod.material || prod.description;
      this.activeCustomAttributes.push({
        groupId: 'material_fixed',
        label: 'Chất liệu hoàn thiện',
        type: 'material',
        originalValue: mat,
        originalOptionId: 'fixed',
        options: [],
        selectedOptionId: 'fixed',
        selectedOptionName: mat,
        customNote: ''
      });
    }
  }

  private determineAttributeType(g: { groupId: string; label: string }): 'color' | 'size' | 'material' | 'general' {
    const gid = (g.groupId || '').toLowerCase();
    const lbl = (g.label || '').toLowerCase();
    if (gid.includes('colour') || gid.includes('color') || lbl.includes('màu')) return 'color';
    if (gid.includes('material') || gid.includes('upholstery') || gid.includes('tabletop') || gid.includes('leg') || lbl.includes('chất liệu') || lbl.includes('vải') || lbl.includes('da')) return 'material';
    if (gid.includes('size') || lbl.includes('kích thước')) return 'size';
    return 'general';
  }

  private initDynamicBudgetRanges() {
    this.dynamicBudgetRanges = [];
    const price = this.productPrice;

    if (price && price > 0) {
      const formatM = (num: number) => {
        const tr = num / 1_000_000;
        return tr >= 10 ? `${Math.round(tr)} triệu` : `${tr.toFixed(1).replace('.0', '')} triệu`;
      };

      const b1 = Math.round(price * 1.15);
      const b2 = Math.round(price * 1.35);
      const b3 = Math.round(price * 1.6);

      this.dynamicBudgetRanges = [
        {
          label: `${formatM(price)} - ${formatM(b1)}`,
          value: `${formatM(price)} - ${formatM(b1)}`,
          hint: 'Gia công theo kích thước & thông số riêng'
        },
        {
          label: `${formatM(b1)} - ${formatM(b2)}`,
          value: `${formatM(b1)} - ${formatM(b2)}`,
          hint: 'Thay đổi chất liệu tiêu chuẩn theo sở thích'
        },
        {
          label: `${formatM(b2)} - ${formatM(b3)}`,
          value: `${formatM(b2)} - ${formatM(b3)}`,
          hint: 'Nâng cấp đá tự nhiên, gỗ quý hoặc da thật'
        },
        {
          label: `Trên ${formatM(b3)}`,
          value: `> ${formatM(b3)}`,
          hint: 'Thiết kế độc bản cao cấp'
        }
      ];
    } else {
      this.dynamicBudgetRanges = [
        { label: 'Dưới 15 triệu', value: '< 15M' },
        { label: '15 - 30 triệu', value: '15M - 30M' },
        { label: '30 - 50 triệu', value: '30M - 50M' },
        { label: 'Trên 50 triệu', value: '> 50M' }
      ];
    }
  }

  detectColor(text: string): { name: string; hex: string } {
    const lower = (text || '').toLowerCase();
    if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
    if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
    if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre')) return { name: 'Vàng', hex: '#E6B800' };
    if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
    if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || lower.includes('be')) return { name: 'Be sữa', hex: '#D8C8B8' };
    if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám than', hex: '#374151' };
    if (lower.includes('light grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám') || lower.includes('ash')) return { name: 'Xám khói', hex: '#9CA3AF' };
    if (lower.includes('white') || lower.includes('trắng')) return { name: 'Trắng sứ', hex: '#F3F4F6' };
    if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen nhám', hex: '#18181B' };
    if (lower.includes('oak') || lower.includes('sồi')) return { name: 'Gỗ sồi tự nhiên', hex: '#C4A482' };
    if (lower.includes('brown') || lower.includes('walnut') || lower.includes('nâu') || lower.includes('espresso')) return { name: 'Nâu Walnut', hex: '#6B4423' };
    if (lower.includes('terracotta') || lower.includes('red') || lower.includes('đỏ') || lower.includes('rust')) return { name: 'Đỏ đất', hex: '#A84332' };
    return { name: text || 'Tiêu chuẩn', hex: '#78716c' };
  }

  // --- PRODUCT GETTERS ---
  get productName(): string {
    return this.product?.shortDescription_vi || this.product?.shortDescription || this.product?.name || 'Sản phẩm DCOR';
  }

  get productThumbnail(): string {
    const vImages = this.matchedVariant?.images || (this.matchedVariant?.optionValues as any)?.images;
    if (Array.isArray(vImages) && vImages.length > 0) return vImages[0];
    if (typeof vImages === 'string' && vImages.startsWith('http')) return vImages.split(/\s+/)[0];
    if (Array.isArray(this.product?.images) && this.product.images.length > 0) return this.product.images[0];
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop';
  }

  get productSku(): string {
    return this.matchedVariant?.sku || this.product?.slug || 'DCOR-PREMIUM';
  }

  get productPrice(): number {
    return this.matchedVariant?.price || this.product?.basePrice || this.product?.prices?.[0]?.price || 0;
  }

  // --- CHECK DIRTY FORM ---
  get isFormDirty(): boolean {
    const hasAttrChange = this.activeCustomAttributes.some(a =>
      a.selectedOptionId !== a.originalOptionId || (a.customNote && a.customNote.trim())
    );
    const hasDimChange = Boolean(
      (this.requestedDimensions && this.requestedDimensions !== this.originalDimensions) ||
      this.customDimensionNote
    );

    return Boolean(
      hasAttrChange ||
      hasDimChange ||
      (this.fullName && this.fullName !== (this.currentUser?.fullName || '')) ||
      (this.phone && this.phone !== (this.currentUser?.phone || '')) ||
      (this.email && this.email !== (this.currentUser?.email || '')) ||
      this.requirementDetails ||
      this.uploadedFiles.length > 0 ||
      this.estimatedBudget ||
      this.selectedBudgetRange
    );
  }

  handleCloseClick() {
    if (this.isSubmittedSuccess) {
      this.close.emit();
      return;
    }
    if (this.isFormDirty) {
      this.showConfirmClose = true;
    } else {
      this.close.emit();
    }
  }

  confirmDiscardAndClose() {
    this.showConfirmClose = false;
    this.close.emit();
  }

  cancelDiscard() {
    this.showConfirmClose = false;
  }

  // --- FORM INTERACTIONS ---
  selectAttributeOption(attr: CustomAttributeItem, opt: any) {
    if (attr.selectedOptionId === opt.id) {
      attr.selectedOptionId = attr.originalOptionId;
      attr.selectedOptionName = attr.originalValue;
    } else {
      attr.selectedOptionId = opt.id;
      attr.selectedOptionName = opt.name;
    }
  }

  selectDimensionChip(opt: any) {
    if (this.selectedDimensionOptionId === opt.id) {
      this.selectedDimensionOptionId = '';
      this.requestedDimensions = '';
    } else {
      this.selectedDimensionOptionId = opt.id;
      this.requestedDimensions = opt.name;
    }
  }

  selectBudgetChip(range: string) {
    if (this.selectedBudgetRange === range) {
      this.selectedBudgetRange = '';
    } else {
      this.selectedBudgetRange = range;
      delete this.formErrors['budget'];
    }
  }

  formatBudgetInput(event: any) {
    const val = event.target.value.replace(/\D/g, '');
    if (val) {
      this.estimatedBudget = new Intl.NumberFormat('vi-VN').format(Number(val));
      delete this.formErrors['budget'];
    } else {
      this.estimatedBudget = '';
    }
  }

  onFullNameInput() {
    if (this.fullName && this.fullName.trim()) {
      delete this.formErrors['fullName'];
    }
  }

  onPhoneInput() {
    const p = (this.phone || '').trim();
    if (p && this.validatePhone(p)) {
      delete this.formErrors['phone'];
    }
    if (this.isLoggedIn && !this.isGoogleAccount && p === (this.currentUser?.phone || '').trim()) {
      this.isPhoneVerified = true;
      this.verifiedPhone = p;
    } else if (this.verifiedPhone && p === this.verifiedPhone) {
      this.isPhoneVerified = true;
    } else {
      this.isPhoneVerified = false;
    }
  }

  onEmailInput() {
    const em = (this.email || '').trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!em || emailRegex.test(em)) {
      delete this.formErrors['email'];
    }
  }

  onBlurField(field: 'fullName' | 'phone' | 'email' | 'budget') {
    if (field === 'fullName') {
      if (!this.fullName || !this.fullName.trim()) {
        this.formErrors['fullName'] = 'Vui lòng nhập họ và tên người liên hệ.';
      } else {
        delete this.formErrors['fullName'];
      }
    } else if (field === 'phone') {
      const p = (this.phone || '').trim();
      if (!p) {
        this.formErrors['phone'] = 'Vui lòng nhập số điện thoại liên hệ.';
      } else if (!this.validatePhone(p)) {
        this.formErrors['phone'] = 'Số điện thoại không đúng định dạng (10 số, VD: 0912345678).';
      } else {
        delete this.formErrors['phone'];
      }
    } else if (field === 'email') {
      const em = (this.email || '').trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (em && !emailRegex.test(em)) {
        this.formErrors['email'] = 'Email không đúng định dạng (VD: hoten@gmail.com).';
      } else {
        delete this.formErrors['email'];
      }
    } else if (field === 'budget') {
      if (!this.selectedBudgetRange && !this.estimatedBudget.trim()) {
        this.formErrors['budget'] = 'Vui lòng chọn hoặc nhập khoảng ngân sách dự kiến.';
      } else {
        delete this.formErrors['budget'];
      }
    }
    this.cdr.detectChanges();
  }

  // --- OTP VERIFICATION ---
  validatePhone(phoneStr: string): boolean {
    if (!phoneStr) return false;
    const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return phoneRegex.test(phoneStr.trim());
  }

  sendOtp(phoneToVerify?: string) {
    const target = (phoneToVerify || this.phone || '').trim();
    if (!this.validatePhone(target)) {
      this.formErrors['phone'] = 'Vui lòng nhập số điện thoại hợp lệ.';
      return;
    }

    this.phone = target;
    delete this.formErrors['phone'];
    this.isSendingOtp = true;
    this.otpErrorMessage = null;

    fetch(`${environment.apiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: target })
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

    // Mã OTP test cố định 111111 hoặc xác thực server
    if (code === '111111') {
      this.isPhoneVerified = true;
      this.verifiedPhone = this.phone.trim();
      this.isOtpModalOpen = false;
      this.otpErrorMessage = null;
      if (this.otpTimer) clearInterval(this.otpTimer);
      delete this.formErrors['phone'];
      this.cdr.detectChanges();
      return;
    }

    fetch(`${environment.apiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: this.phone.trim(), otp: code })
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        this.isPhoneVerified = true;
        this.verifiedPhone = this.phone.trim();
        this.isOtpModalOpen = false;
        this.otpErrorMessage = null;
        if (this.otpTimer) clearInterval(this.otpTimer);
        delete this.formErrors['phone'];
      })
      .catch(() => {
        this.otpErrorMessage = 'Mã OTP không chính xác. Quý khách vui lòng nhập mã thử nghiệm: 111111';
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  closeOtpModal() {
    this.isOtpModalOpen = false;
  }

  // --- FILE UPLOAD (DRAG & DROP) ---
  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile = false;
  }

  onFileDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.processFiles(e.dataTransfer.files);
    }
  }

  onFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
      input.value = '';
    }
  }

  private processFiles(files: FileList) {
    const maxFiles = 8;
    const remainingSlots = maxFiles - this.uploadedFiles.length;
    if (remainingSlots <= 0) {
      alert('Quý khách có thể tải lên tối đa 8 tệp đính kèm.');
      return;
    }

    const countToTake = Math.min(files.length, remainingSlots);
    for (let i = 0; i < countToTake; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`Tệp "${file.name}" vượt quá dung lượng tối đa 15MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event: any) => {
        const item: UploadedFileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: this.formatFileSize(file.size),
          type: file.type,
          previewUrl: event.target.result
        };
        this.uploadedFiles.push(item);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(id: string, e: Event) {
    e.stopPropagation();
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // --- VALIDATION & SUBMIT ---
  validateForm(): boolean {
    this.formErrors = {};

    if (!this.fullName.trim()) {
      this.formErrors['fullName'] = 'Vui lòng nhập Họ và tên người liên hệ.';
    }

    if (!this.phone.trim()) {
      this.formErrors['phone'] = 'Vui lòng nhập Số điện thoại liên hệ.';
    } else if (!this.validatePhone(this.phone)) {
      this.formErrors['phone'] = 'Số điện thoại không đúng định dạng (10 số, VD: 0912345678).';
    } else if (!this.isPhoneVerified) {
      this.formErrors['phone'] = 'Quý khách vui lòng xác thực mã OTP số điện thoại trước khi gửi yêu cầu.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.email.trim() && !emailRegex.test(this.email.trim())) {
      this.formErrors['email'] = 'Email không đúng định dạng (VD: hoten@gmail.com).';
    }

    if (!this.selectedBudgetRange && !this.estimatedBudget.trim()) {
      this.formErrors['budget'] = 'Vui lòng chọn hoặc nhập khoảng ngân sách dự kiến.';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  get isSubmitDisabled(): boolean {
    if (this.isSubmitting) return true;
    if (!this.fullName.trim() || !this.phone.trim()) {
      return true;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.email.trim() && !emailRegex.test(this.email.trim())) {
      return true;
    }
    if (!this.selectedBudgetRange && !this.estimatedBudget.trim()) {
      return true;
    }
    if (!this.isPhoneVerified) {
      return true;
    }
    return false;
  }

  submitCustomRequest() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Tạo mã yêu cầu duy nhất
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `REQ-${dateStr}-${randCode}`;

    // Lập danh sách các thuộc tính thực tế được tùy biến
    const customizedAttributes = this.activeCustomAttributes.map(attr => ({
      groupId: attr.groupId,
      label: attr.label,
      originalValue: attr.originalValue,
      selectedOptionId: attr.selectedOptionId || attr.originalOptionId,
      selectedOptionName: attr.selectedOptionName || attr.originalValue,
      isChanged: attr.selectedOptionId !== attr.originalOptionId,
      customNote: attr.customNote.trim()
    }));

    const requestPayload = {
      requestCode,
      createdAt: now.toISOString(),
      productId: this.product?.id || this.product?.slug || '',
      productName: this.productName,
      productSku: this.productSku,
      productThumbnail: this.productThumbnail,
      basePrice: this.productPrice,
      customer: {
        fullName: this.fullName.trim(),
        phone: this.phone.trim(),
        email: this.email.trim(),
        address: this.address.trim(),
        isPhoneVerified: this.isPhoneVerified
      },
      customizations: {
        hasDimensions: this.hasDimensions,
        originalDimensions: this.originalDimensions,
        requestedDimensions: this.requestedDimensions.trim() || this.originalDimensions,
        customDimensionNote: this.customDimensionNote.trim(),
        attributes: customizedAttributes,
        requirementDetails: this.requirementDetails.trim(),
        budgetRange: this.selectedBudgetRange,
        estimatedBudget: this.estimatedBudget.trim()
      },
      // Tương thích ngược với các trường cũ
      specifications: {
        originalDimensions: this.originalDimensions,
        requestedDimensions: this.requestedDimensions.trim() || this.originalDimensions,
        selectedMaterial: this.activeCustomAttributes.find(a => a.type === 'material')?.selectedOptionName || '',
        customMaterialNote: this.activeCustomAttributes.find(a => a.type === 'material')?.customNote || '',
        selectedColor: this.activeCustomAttributes.find(a => a.type === 'color')?.selectedOptionName || '',
        customColorNote: this.activeCustomAttributes.find(a => a.type === 'color')?.customNote || '',
        requirementDetails: this.requirementDetails.trim(),
        budgetRange: this.selectedBudgetRange,
        estimatedBudget: this.estimatedBudget.trim()
      },
      attachments: this.uploadedFiles.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        previewUrl: f.previewUrl
      })),
      status: 'draft' // Chờ duyệt yêu cầu bóc tách 3D
    };

    // Lưu vào localStorage danh sách custom requests để đồng bộ với trang /account/custom-requests
    try {
      const stored = JSON.parse(localStorage.getItem('dcor_custom_requests') || '[]');
      stored.unshift(requestPayload);
      localStorage.setItem('dcor_custom_requests', JSON.stringify(stored.slice(0, 50)));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dcor_custom_requests_updated'));
      }
    } catch (e) {
      console.error('Lỗi lưu custom requests local:', e);
    }

    // Gửi lên Backend nếu có API
    fetch(`${environment.apiUrl}/store/custom-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('dcor_customer_token') || ''}`
      },
      body: JSON.stringify(requestPayload)
    })
      .then(res => res.json())
      .catch(() => ({}))
      .finally(() => {
        this.isSubmitting = false;
        this.isSubmittedSuccess = true;
        this.createdRequestCode = requestCode;
        this.createdRequestDate = now.toLocaleDateString('vi-VN');
        this.submitSuccess.emit(requestPayload);
        this.cdr.detectChanges();
      });
  }

  viewMyRequests() {
    this.close.emit();
    this.router.navigate(['/account/custom-requests']);
  }
}
