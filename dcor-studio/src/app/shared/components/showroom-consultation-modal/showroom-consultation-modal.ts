import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  Building2,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Navigation,
  Compass
} from 'lucide-angular';
import { environment } from '../../../../environments/environment';

export interface ShowroomItem {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  managerName?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  openingHours?: string;
  image?: string;
  highlight?: string;
}

export interface SlotItem {
  time: string;
  period: string;
  maxCapacity: number;
  bookedCount: number;
  remainingSlots: number;
  isAvailable: boolean;
  isPastSlot: boolean;
  statusLabel: string;
}

export interface DayOption {
  dateStr: string;
  dayName: string;
  dateDisplay: string;
  isToday: boolean;
  isTomorrow: boolean;
}

@Component({
  selector: 'app-showroom-consultation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './showroom-consultation-modal.html',
  styleUrls: ['./showroom-consultation-modal.css']
})
export class ShowroomConsultationModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() product: any = null;
  @Input() matchedVariant: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() appointmentSuccess = new EventEmitter<any>();

  icons = {
    Building2,
    MapPin,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    FileText,
    Check,
    CheckCircle2,
    AlertCircle,
    X,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Sparkles,
    Navigation,
    Compass
  };

  // User state
  isLoggedIn = false;
  isGoogleAccount = false;
  currentUser: any = null;

  // Step 1: Showroom Selection
  showrooms: ShowroomItem[] = [];
  isLoadingShowrooms = false;
  selectedShowroom: ShowroomItem | null = null;
  selectedShowroomId = '';

  // Step 2: Date & Time Slot
  dayOptions: DayOption[] = [];
  selectedDate = '';
  slots: SlotItem[] = [];
  selectedTimeSlot: SlotItem | null = null;
  selectedTime = '';
  isLoadingSlots = false;
  isClosedDay = false;
  closureReason = '';

  get availableSlots(): SlotItem[] {
    return this.slots.filter(s => s.isAvailable);
  }

  // Date strip carousel navigation (8 ngày mỗi trang)
  @ViewChild('dateStripRef', { static: false }) dateStripRef?: ElementRef<HTMLDivElement>;
  isAtDateStart = true;
  isAtDateEnd = false;

  // Step 3: Contact Info
  fullName = '';
  phone = '';
  email = '';
  notes = '';
  isPhoneVerified = false;
  verifiedPhone = '';
  formErrors: Record<string, string> = {};

  // OTP Verification
  isOtpModalOpen = false;
  otpCode = '';
  otpCountdown = 0;
  private otpTimer: any = null;
  otpErrorMessage: string | null = null;
  isSendingOtp = false;

  // Step 4: Submission & State
  isSubmitting = false;
  isSubmittedSuccess = false;
  createdAppointment: any = null;
  appointmentCode = '';
  showConfirmClose = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.isOpen) {
      this.checkUserAuth();
      this.initDayOptions();
      this.loadShowrooms();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.checkUserAuth();
      this.initDayOptions();
      if (this.showrooms.length === 0) {
        this.loadShowrooms();
      } else if (!this.selectedShowroomId && this.showrooms.length > 0) {
        this.selectShowroom(this.showrooms[0]);
      }
      this.isSubmittedSuccess = false;
      this.createdAppointment = null;
      this.appointmentCode = '';
      this.formErrors = {};
      this.isAtDateStart = true;
      this.isAtDateEnd = false;
      setTimeout(() => {
        if (this.dateStripRef?.nativeElement) {
          this.dateStripRef.nativeElement.scrollLeft = 0;
          this.updateDateScrollStatus();
        }
      }, 100);
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

        // Prefill họ tên
        if (!this.fullName) {
          this.fullName = this.currentUser.fullName || this.currentUser.name || '';
        }

        // Prefill email
        if (!this.email) {
          this.email = this.currentUser.email || '';
        }

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
          this.isPhoneVerified = false;
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

  // --- 2. LOAD SHOWROOMS & MAPS ---
  async loadShowrooms() {
    this.isLoadingShowrooms = true;
    try {
      const res = await fetch(`${environment.apiUrl}/showrooms`);
      if (res.ok) {
        this.showrooms = await res.json();
        if (this.showrooms.length > 0 && !this.selectedShowroom) {
          this.selectShowroom(this.showrooms[0]);
        }
      }
    } catch (e) {
      console.error('[ShowroomModal] Lỗi tải showrooms:', e);
    } finally {
      this.isLoadingShowrooms = false;
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch (_) {}
    }
  }

  selectShowroom(sr: ShowroomItem) {
    this.selectedShowroom = sr;
    this.selectedShowroomId = sr.id;
    delete this.formErrors['showroom'];
    // Tải lại ma trận khung giờ cho showroom mới
    if (this.selectedDate) {
      this.loadAvailability();
    }
    this.cdr.detectChanges();
  }

  get safeMiniMapUrl(): SafeResourceUrl | null {
    if (!this.selectedShowroom?.lat || !this.selectedShowroom?.lng) return null;
    const lat = this.selectedShowroom.lat;
    const lng = this.selectedShowroom.lng;
    const delta = 0.005;
    const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openGoogleMaps() {
    if (!this.selectedShowroom) return;
    const targetUrl = this.selectedShowroom.googleMapsUrl || 
      `https://maps.google.com/?q=${encodeURIComponent(this.selectedShowroom.name + ' ' + this.selectedShowroom.address)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  get todayStr(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // --- 3. DATE & TIME SLOTS ---
  initDayOptions() {
    const days: DayOption[] = [];
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();

    for (let i = 0; i < 16; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let dayName = dayNames[d.getDay()];
      if (i === 0) dayName = 'Hôm nay';
      if (i === 1) dayName = 'Ngày mai';

      days.push({
        dateStr,
        dayName,
        dateDisplay: `${dd}/${mm}`,
        isToday: i === 0,
        isTomorrow: i === 1
      });
    }

    this.dayOptions = days;
    if (!this.selectedDate && days.length > 0) {
      this.selectDate(days[0].dateStr);
    }
    setTimeout(() => this.updateDateScrollStatus(), 100);
  }

  scrollDateStrip(direction: 'prev' | 'next') {
    const el = this.dateStripRef?.nativeElement;
    if (!el) return;
    const scrollAmount = el.clientWidth;
    el.scrollBy({
      left: direction === 'prev' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateDateScrollStatus(), 350);
  }

  onDateStripScroll() {
    this.updateDateScrollStatus();
  }

  private updateDateScrollStatus() {
    const el = this.dateStripRef?.nativeElement;
    if (!el) return;
    this.isAtDateStart = el.scrollLeft <= 8;
    this.isAtDateEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    this.cdr.detectChanges();
  }

  selectDate(dStr: string) {
    this.selectedDate = dStr;
    this.selectedTimeSlot = null;
    this.selectedTime = '';
    delete this.formErrors['date'];
    delete this.formErrors['time'];
    this.loadAvailability();
  }

  async loadAvailability() {
    if (!this.selectedShowroomId || !this.selectedDate) return;
    this.isLoadingSlots = true;
    this.isClosedDay = false;
    this.closureReason = '';

    try {
      const res = await fetch(`${environment.apiUrl}/consultations/availability?showroomId=${this.selectedShowroomId}&date=${this.selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        this.isClosedDay = !!data.isClosed;
        this.closureReason = data.closureReason || '';
        this.slots = data.slots || [];
        if (this.selectedTime && !this.availableSlots.some(s => s.time === this.selectedTime)) {
          this.selectedTime = '';
          this.selectedTimeSlot = null;
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      console.error('[ShowroomModal] Lỗi tải khung giờ:', e);
      this.slots = [];
      this.selectedTime = '';
      this.selectedTimeSlot = null;
    } finally {
      this.isLoadingSlots = false;
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch (_) {}
    }
  }

  selectSlot(slot: SlotItem) {
    if (!slot.isAvailable) return;
    this.selectedTimeSlot = slot;
    this.selectedTime = slot.time;
    delete this.formErrors['time'];
    this.cdr.detectChanges();
  }

  // --- 4. CONTACT & OTP VALIDATION ---
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

  onBlurField(field: 'fullName' | 'phone' | 'email') {
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
    }
    this.cdr.detectChanges();
  }

  validatePhone(phoneStr: string): boolean {
    if (!phoneStr) return false;
    const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    return phoneRegex.test(phoneStr.trim());
  }

  sendOtp(phoneToVerify?: string) {
    const target = (phoneToVerify || this.phone || '').trim();
    if (!this.validatePhone(target)) {
      this.formErrors['phone'] = 'Vui lòng nhập số điện thoại hợp lệ trước khi gửi mã OTP.';
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
        this.otpCountdown = 60;
        this.otpCode = '';
        if (this.otpTimer) clearInterval(this.otpTimer);
        this.otpTimer = setInterval(() => {
          if (this.otpCountdown > 0) {
            this.otpCountdown--;
            this.cdr.detectChanges();
          } else {
            clearInterval(this.otpTimer);
          }
        }, 1000);
        this.cdr.detectChanges();
      });
  }

  verifyOtp() {
    const code = this.otpCode.trim();
    if (!code || code.length !== 6) {
      this.otpErrorMessage = 'Vui lòng nhập đúng mã xác thực OTP 6 chữ số.';
      return;
    }

    // Hỗ trợ mã test 111111
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
        this.otpErrorMessage = 'Mã OTP không chính xác. Quý khách vui lòng thử lại hoặc dùng mã kiểm thử: 111111';
      })
      .finally(() => {
        this.cdr.detectChanges();
      });
  }

  closeOtpModal() {
    this.isOtpModalOpen = false;
  }

  // --- 5. DIRTY CHECK & CLOSE ---
  get isFormDirty(): boolean {
    return Boolean(
      (this.fullName && this.fullName !== (this.currentUser?.fullName || '')) ||
      (this.phone && this.phone !== (this.currentUser?.phone || '')) ||
      (this.email && this.email !== (this.currentUser?.email || '')) ||
      this.notes ||
      this.selectedTime
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

  // --- 6. SUBMISSION WITH CONFLICT CHECK ---
  get isSubmitDisabled(): boolean {
    if (this.isSubmitting) return true;
    if (!this.selectedShowroomId) return true;
    if (!this.selectedDate || !this.selectedTime) return true;
    if (!this.fullName.trim() || !this.phone.trim()) return true;
    if (!this.isPhoneVerified) return true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.email.trim() && !emailRegex.test(this.email.trim())) return true;
    return false;
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.selectedShowroomId) {
      this.formErrors['showroom'] = 'Vui lòng chọn Showroom trải nghiệm.';
    }

    if (!this.selectedDate) {
      this.formErrors['date'] = 'Vui lòng chọn ngày hẹn tư vấn.';
    }

    if (!this.selectedTime) {
      this.formErrors['time'] = 'Vui lòng chọn khung giờ tư vấn còn trống.';
    }

    if (!this.fullName.trim()) {
      this.formErrors['fullName'] = 'Vui lòng nhập Họ và tên người liên hệ.';
    }

    if (!this.phone.trim()) {
      this.formErrors['phone'] = 'Vui lòng nhập Số điện thoại liên hệ.';
    } else if (!this.validatePhone(this.phone)) {
      this.formErrors['phone'] = 'Số điện thoại không đúng định dạng (10 số, VD: 0912345678).';
    } else if (!this.isPhoneVerified) {
      this.formErrors['phone'] = 'Quý khách vui lòng xác thực mã OTP số điện thoại trước khi đặt lịch.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.email.trim() && !emailRegex.test(this.email.trim())) {
      this.formErrors['email'] = 'Email không đúng định dạng (VD: hoten@gmail.com).';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  async submitAppointment() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    try {
      const payload = {
        showroomId: this.selectedShowroomId,
        preferredDate: this.selectedDate,
        preferredTime: this.selectedTime,
        fullName: this.fullName.trim(),
        phone: this.phone.trim(),
        email: this.email ? this.email.trim() : null,
        notes: this.notes ? this.notes.trim() : null,
        productId: this.product?.id || null,
        productName: this.product?.name || this.product?.shortDescription_vi || null,
        variantId: this.matchedVariant?.id || null
      };

      const customerToken =
        sessionStorage.getItem('dcor_customer_token') ||
        localStorage.getItem('dcor_customer_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }

      const res = await fetch(`${environment.apiUrl}/consultations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 409) {
        // Xung đột lịch (vừa có khách khác đặt kín slot này)
        alert(data.error || 'Khung giờ này vừa có khách hàng khác đặt kín chỗ. Quý khách vui lòng chọn khung giờ khác.');
        await this.loadAvailability();
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi đặt lịch tư vấn.');
      }

      this.createdAppointment = data.consultation || {
        ...payload,
        appointmentCode: data.appointmentCode,
        showroomName: this.selectedShowroom?.name,
        showroomAddress: this.selectedShowroom?.address
      };
      this.appointmentCode = data.appointmentCode || this.createdAppointment.appointmentCode;
      this.isSubmittedSuccess = true;
      this.appointmentSuccess.emit(this.createdAppointment);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dcor_appointments_updated', { detail: this.createdAppointment }));
      }

      // Lưu lịch sử vào LocalStorage để khách hàng tiện theo dõi
      try {
        const historyStr = localStorage.getItem('dcor_my_consultations') || '[]';
        const historyList = JSON.parse(historyStr);
        historyList.unshift(this.createdAppointment);
        localStorage.setItem('dcor_my_consultations', JSON.stringify(historyList));
      } catch {}

    } catch (err: any) {
      console.error('[ShowroomModal] Lỗi submit:', err);
      alert(err.message || 'Có lỗi xảy ra khi gửi yêu cầu. Quý khách vui lòng liên hệ hotline để được hỗ trợ tức thì.');
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  closeSuccessPopup() {
    this.isSubmittedSuccess = false;
    this.createdAppointment = null;
    this.appointmentCode = '';
    if (this.isOpen) {
      this.close.emit();
    }
    this.cdr.detectChanges();
  }

  // --- GETTERS ---
  get productName(): string {
    return this.product?.shortDescription_vi || this.product?.shortDescription || this.product?.name || '';
  }

  get productThumbnail(): string {
    const vImages = (this.matchedVariant?.optionValues as any)?.images;
    if (Array.isArray(vImages) && vImages.length > 0) return vImages[0];
    if (Array.isArray(this.product?.images) && this.product.images.length > 0) return this.product.images[0];
    return '/assets/img/furniture-placeholder.svg';
  }

  get productSku(): string {
    return this.matchedVariant?.sku || this.product?.slug || 'DCOR-SHOWROOM';
  }
}
