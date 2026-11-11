import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  CalendarDays, 
  Home, 
  Clock, 
  MapPin, 
  X, 
  AlertTriangle, 
  AlertCircle,
  UserRound, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  ArrowRight, 
  Info,
  Layers,
  CreditCard
} from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, CustomerAppointment } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

export interface ShiftInfo {
  name: string;
  period: string;
  slots: string[];
}

@Component({
  selector: 'app-account-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AccountSidebarComponent, GuestPhoneBannerComponent],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css']
})
export class AccountAppointmentsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    CheckCircle2,
    Sparkles,
    Eye,
    CalendarDays,
    Home,
    Clock,
    MapPin,
    X,
    AlertTriangle,
    AlertCircle,
    UserRound,
    Phone,
    Mail,
    Copy,
    Check,
    RotateCcw,
    ExternalLink,
    ShieldCheck,
    Building2,
    Calendar,
    ArrowRight,
    Info,
    Layers,
    CreditCard
  };

  appointments: CustomerAppointment[] = [];
  filteredAppointments: CustomerAppointment[] = [];
  isLoading = false;
  activeFilter = 'ALL';
  errorMessage = '';
  successMessage = '';

  tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'CONFIRMED', label: 'Lịch hẹn sắp tới' },
    { key: 'CANCELLED', label: 'Đã hủy' }
  ];

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  // Ca làm việc và Khung giờ tư vấn theo cấu hình
  shifts: ShiftInfo[] = [
    {
      name: 'Ca Sáng',
      period: '08:30 - 12:00',
      slots: ['09:00 - 10:30', '10:30 - 12:00']
    },
    {
      name: 'Ca Chiều',
      period: '13:30 - 18:00',
      slots: ['14:00 - 15:30', '16:00 - 17:30']
    },
    {
      name: 'Ca Tối',
      period: '18:30 - 21:00',
      slots: ['19:00 - 20:30']
    }
  ];

  masterTimeSlots = [
    '09:00 - 10:30',
    '10:30 - 12:00',
    '14:00 - 15:30',
    '16:00 - 17:30',
    '19:00 - 20:30'
  ];

  lockedDates: string[] = ['2026-11-20', '2026-12-25', '2027-01-01', '2027-02-10', '2027-02-11', '2027-02-12'];

  spaceTypes = [
    'Phòng khách',
    'Phòng ngủ Master',
    'Bếp & Phòng ăn',
    'Căn hộ chung cư trọn gói',
    'Biệt thự / Nhà phố cao cấp',
    'Văn phòng / Khác'
  ];

  budgetRanges = [
    'Dưới 50 triệu',
    '50 - 100 triệu',
    '100 - 250 triệu',
    '250 - 500 triệu',
    'Trên 500 triệu',
    'Linh hoạt theo thiết kế'
  ];

  // Booking Form State
  isBookingModalOpen = false;
  isSubmitting = false;
  isLoadingSlots = false;
  availableTimeSlots: string[] = [];
  bookedSlots: string[] = [];
  customerHasAppointmentOnDate = false;
  existingAppointmentOnDate: CustomerAppointment | null = null;
  isDateLockedSelected = false;

  bookingForm = {
    customerName: '',
    phone: '',
    email: '',
    appointmentType: 'SHOWROOM' as 'SHOWROOM' | 'ONLINE_3D',
    showroomAddress: 'Tại Showroom DCor',
    date: '',
    timeSlot: '09:00 - 10:30',
    spaceType: 'Phòng khách',
    budget: '100 - 250 triệu',
    notes: ''
  };

  fieldErrors: { [key: string]: string } = {};

  // Success Screen State
  isSuccessScreenOpen = false;
  createdAppointment: CustomerAppointment | null = null;
  copiedCode = false;

  // Reschedule Modal State (Đổi giờ hẹn trước khi admin duyệt)
  isRescheduleModalOpen = false;
  reschedulingAppointment: CustomerAppointment | null = null;
  rescheduleDate = '';
  rescheduleTimeSlot = '';
  rescheduleNotes = '';
  rescheduleBookedSlots: string[] = [];
  rescheduleAvailableSlots: string[] = [];
  isRescheduling = false;
  rescheduleError = '';
  rescheduleDateConflict = '';
  existingRescheduleAppointmentOnDate: CustomerAppointment | null = null;

  // Cancel Confirmation Modal (Hủy hẹn trước khi admin duyệt)
  isCancelModalOpen = false;
  cancellingAppointment: CustomerAppointment | null = null;
  cancelReason = 'Thay đổi kế hoạch cá nhân';
  isCancelling = false;
  cancelError = '';

  minDate = '';
  maxDate = '';

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isSlotPast(slot: string, dateStr?: string): boolean {
    const targetDate = dateStr || this.bookingForm.date;
    if (!targetDate) return false;

    const todayStr = this.getLocalDateString(new Date());
    if (targetDate < todayStr) return true;
    if (targetDate > todayStr) return false;

    // targetDate === todayStr: So sánh với giờ phút thực tế hiện tại
    const [startPart] = slot.split(' - ');
    if (!startPart) return false;
    const [h, m] = startPart.split(':').map(Number);
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    return h < currentH || (h === currentH && m <= currentM);
  }

  areAllSlotsPastForDate(dateStr: string): boolean {
    return this.masterTimeSlots.every(slot => this.isSlotPast(slot, dateStr));
  }

  initBookingDates(): void {
    const today = new Date();
    const todayStr = this.getLocalDateString(today);

    // Nếu hôm nay tất cả khung giờ đều đã trôi qua so với giờ thực tế (ví dụ đêm muộn sau 19h)
    if (this.areAllSlotsPastForDate(todayStr)) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = this.getLocalDateString(tomorrow);
      this.minDate = tomorrowStr;
      this.bookingForm.date = tomorrowStr;
    } else {
      this.minDate = todayStr;
      this.bookingForm.date = todayStr;
    }

    const max = new Date();
    max.setDate(today.getDate() + 30);
    this.maxDate = this.getLocalDateString(max);
  }

  ngOnInit(): void {
    try {
      localStorage.removeItem('dcor_cache_appointments');
    } catch (_) {}

    this.initBookingDates();

    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.checkAndLoad();
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.subscribe(phone => {
        this.isPhoneVerified = !!phone;
        this.checkAndLoad();
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          const tab = params['tab'].toUpperCase();
          if (['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'UPCOMING'].includes(tab)) {
            this.activeFilter = tab === 'UPCOMING' ? 'CONFIRMED' : tab;
            this.applyFilter();
            this.cdr.markForCheck();
          }
        }
        if (params['action'] === 'book' || params['open'] === 'book') {
          this.openBookingModal();
        }
      })
    );

    this.checkAndLoad();
  }

  isDateLocked(dateStr: string): boolean {
    return this.lockedDates.includes(dateStr);
  }

  private checkAndLoad(): void {
    this.prefillUserInfo();
    if (this.canViewContent) {
      this.loadAppointments();
    } else {
      this.appointments = [];
      this.filteredAppointments = [];
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  prefillUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.bookingForm.customerName = user.fullName || '';
      this.bookingForm.email = user.email || '';
      this.bookingForm.phone = user.phone || '';
    } else {
      const guestPhone = this.authService.getGuestPhone();
      if (guestPhone) {
        this.bookingForm.phone = guestPhone;
      }
    }
    this.cdr.markForCheck();
  }

  onGuestPhoneVerified(phone: string): void {
    this.isPhoneVerified = true;
    this.appointments = [];
    this.filteredAppointments = [];
    this.bookingForm.phone = phone;
    this.errorMessage = '';
    this.loadAppointments();
    this.cdr.markForCheck();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.appointments = [];
    this.filteredAppointments = [];
    this.bookingForm.phone = '';
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  loadAppointments(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();
    this.sub.add(
      this.customerService.getAppointments().subscribe({
        next: (data) => {
          this.appointments = data || [];
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Không thể tải lịch hẹn.';
          this.appointments = [];
          this.filteredAppointments = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'PENDING') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'PENDING');
    } else if (this.activeFilter === 'CONFIRMED' || this.activeFilter === 'UPCOMING') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'CONFIRMED');
    } else if (this.activeFilter === 'CANCELLED') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'CANCELLED');
    } else {
      this.filteredAppointments = [...this.appointments];
    }
  }

  getCountByStatus(key: string): number {
    if (key === 'ALL') return this.appointments.length;
    if (key === 'CONFIRMED' || key === 'UPCOMING') {
      return this.appointments.filter(a => a.status === 'CONFIRMED').length;
    }
    return this.appointments.filter(a => a.status === key).length;
  }

  
  getAppointmentDay(dateStr: string | Date | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : String(d.getDate()).padStart(2, '0');
  }

  getAppointmentMonth(dateStr: string | Date | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : `THÁNG ${d.getMonth() + 1}`;
  }

  getAppointmentWeekday(dateStr: string | Date | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[d.getDay()] || '';
  }

  triggerDatePicker(dateInput?: HTMLInputElement): void {
    if (dateInput && typeof (dateInput as any).showPicker === 'function') {
      try {
        (dateInput as any).showPicker();
      } catch (_) {
        dateInput.focus();
      }
    }
  }

  openBookingModal(): void {
    this.prefillUserInfo();
    this.initBookingDates();
    this.bookingForm.appointmentType = 'SHOWROOM';
    this.bookingForm.showroomAddress = 'Tại Showroom DCor';
    this.bookingForm.timeSlot = '';
    this.bookingForm.spaceType = 'Phòng khách';
    this.bookingForm.budget = '100 - 250 triệu';
    this.bookingForm.notes = '';
    this.errorMessage = '';
    this.fieldErrors = {};
    this.isBookingModalOpen = true;
    this.checkAvailability();
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isBookingModalOpen = false;
    this.errorMessage = '';
    this.fieldErrors = {};
  }

  onTypeChange(type: 'SHOWROOM' | 'ONLINE_3D'): void {
    this.bookingForm.appointmentType = type;
    this.bookingForm.showroomAddress = type === 'SHOWROOM' ? 'Tại Showroom DCor' : 'Tư vấn trực tuyến qua Google Meet HD (KTS 1:1)';
    this.checkAvailability();
  }

  onDateChange(): void {
    this.checkAvailability();
  }

  selectTimeSlot(slot: string): void {
    if (this.isSlotDisabled(slot)) return;
    this.bookingForm.timeSlot = slot;
    delete this.fieldErrors['timeSlot'];
  }

  isSlotBooked(slot: string): boolean {
    if (this.bookedSlots && this.bookedSlots.includes(slot)) return true;
    if (this.existingAppointmentOnDate && this.existingAppointmentOnDate.timeSlot === slot) return true;
    if (this.appointments && this.appointments.some(a => a.status !== 'CANCELLED' && a.date === this.bookingForm.date && a.timeSlot === slot)) return true;
    return false;
  }

  isSlotDisabled(slot: string): boolean {
    return this.isSlotBooked(slot) || this.isSlotPast(slot) || this.customerHasAppointmentOnDate;
  }

  checkAvailability(): void {
    if (!this.bookingForm.date) return;

    this.isDateLockedSelected = this.isDateLocked(this.bookingForm.date);
    if (this.isDateLockedSelected) {
      this.availableTimeSlots = [];
      this.bookingForm.timeSlot = '';
      this.cdr.markForCheck();
      return;
    }

    // 1. Ràng buộc: Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày
    this.existingAppointmentOnDate = this.appointments.find(a => 
      a.status !== 'CANCELLED' && a.date === this.bookingForm.date
    ) || null;
    this.customerHasAppointmentOnDate = !!this.existingAppointmentOnDate;

    // 2. Lấy danh sách khung giờ đã có người đặt
    this.isLoadingSlots = true;
    this.customerService.getBookedSlots({
      date: this.bookingForm.date,
      appointmentType: this.bookingForm.appointmentType
    }).subscribe({
      next: (res) => {
        this.bookedSlots = res.bookedSlots || [];
        // Nếu khách này đã có lịch hẹn ngày này, đảm bảo khung giờ đó nằm trong bookedSlots để khóa lại
        if (this.existingAppointmentOnDate && !this.bookedSlots.includes(this.existingAppointmentOnDate.timeSlot)) {
          this.bookedSlots.push(this.existingAppointmentOnDate.timeSlot);
        }

        this.availableTimeSlots = this.masterTimeSlots.filter(slot => !this.isSlotBooked(slot) && !this.isSlotPast(slot));

        if (this.customerHasAppointmentOnDate) {
          this.bookingForm.timeSlot = '';
        } else if (this.availableTimeSlots.length > 0 && (!this.bookingForm.timeSlot || this.isSlotDisabled(this.bookingForm.timeSlot))) {
          this.bookingForm.timeSlot = this.availableTimeSlots[0];
        } else if (this.availableTimeSlots.length === 0) {
          this.bookingForm.timeSlot = '';
        }
        this.isLoadingSlots = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.bookedSlots = [];
        if (this.existingAppointmentOnDate) {
          this.bookedSlots.push(this.existingAppointmentOnDate.timeSlot);
        }
        this.availableTimeSlots = this.masterTimeSlots.filter(slot => !this.isSlotBooked(slot) && !this.isSlotPast(slot));
        if (this.customerHasAppointmentOnDate) {
          this.bookingForm.timeSlot = '';
        }
        this.isLoadingSlots = false;
        this.cdr.markForCheck();
      }
    });
  }

  validateForm(): boolean {
    this.fieldErrors = {};
    let isValid = true;

    if (!this.bookingForm.customerName.trim()) {
      this.fieldErrors['customerName'] = 'Vui lòng nhập họ và tên của bạn.';
      isValid = false;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!this.bookingForm.phone.trim()) {
      this.fieldErrors['phone'] = 'Vui lòng cung cấp số điện thoại liên hệ.';
      isValid = false;
    } else if (!phoneRegex.test(this.bookingForm.phone.trim().replace(/\s+/g, ''))) {
      this.fieldErrors['phone'] = 'Số điện thoại không hợp lệ (cần đủ 10 chữ số).';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.bookingForm.email.trim() && !emailRegex.test(this.bookingForm.email.trim())) {
      this.fieldErrors['email'] = 'Địa chỉ email không đúng định dạng.';
      isValid = false;
    }

    if (!this.bookingForm.date) {
      this.fieldErrors['date'] = 'Vui lòng chọn ngày hẹn.';
      isValid = false;
    } else if (this.bookingForm.date < this.getLocalDateString()) {
      this.fieldErrors['date'] = 'Không thể chọn ngày trong quá khứ.';
      isValid = false;
    } else if (this.isDateLockedSelected) {
      this.fieldErrors['date'] = 'Ngày này đang tạm nghỉ. Vui lòng chọn ngày khác.';
      isValid = false;
    }

    if (!this.bookingForm.timeSlot) {
      this.fieldErrors['timeSlot'] = 'Vui lòng chọn một khung giờ còn trống.';
      isValid = false;
    } else if (this.isSlotPast(this.bookingForm.timeSlot)) {
      this.fieldErrors['timeSlot'] = 'Khung giờ này đã trôi qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác.';
      isValid = false;
    }

    return isValid;
  }

  submitBooking(): void {
    if (!this.validateForm()) {
      this.errorMessage = 'Vui lòng kiểm tra lại các trường thông tin bên dưới.';
      return;
    }

    if (this.customerHasAppointmentOnDate) {
      this.errorMessage = `Bạn đã có lịch hẹn vào ngày ${this.bookingForm.date}. Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày.`;
      return;
    }

    if (this.isSlotBooked(this.bookingForm.timeSlot)) {
      this.errorMessage = `Khung giờ ${this.bookingForm.timeSlot} đã có khách hàng đặt trước. Vui lòng chọn khung giờ khác.`;
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      customerName: this.bookingForm.customerName.trim(),
      phone: this.bookingForm.phone.trim(),
      email: this.bookingForm.email.trim(),
      appointmentType: this.bookingForm.appointmentType,
      showroomAddress: this.bookingForm.showroomAddress,
      date: this.bookingForm.date,
      timeSlot: this.bookingForm.timeSlot,
      spaceType: this.bookingForm.spaceType,
      budget: this.bookingForm.budget,
      notes: this.bookingForm.notes.trim()
    };

    this.sub.add(
      this.customerService.createAppointment(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.createdAppointment = res.appointment;
          this.isBookingModalOpen = false;
          this.isSuccessScreenOpen = true;
          this.copiedCode = false;

          // Nếu khách vãng lai vừa đặt, tự động cập nhật số điện thoại
          if (!this.isLoggedIn && payload.phone) {
            this.authService.setGuestPhone(payload.phone);
            this.isPhoneVerified = true;
          }

          this.loadAppointments();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi tạo lịch hẹn.';
          this.cdr.markForCheck();
        }
      })
    );
  }

  closeSuccessScreen(): void {
    this.isSuccessScreenOpen = false;
    this.createdAppointment = null;
    this.activeFilter = 'PENDING';
    this.applyFilter();
  }

  copyAppointmentCode(code: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copiedCode = true;
        setTimeout(() => this.copiedCode = false, 2500);
      });
    } else {
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.copiedCode = true;
      setTimeout(() => this.copiedCode = false, 2500);
    }
  }

  // ==========================================
  // ĐỔI GIỜ HẸN (Chỉ trước khi admin duyệt)
  // ==========================================
  openRescheduleModal(apt: CustomerAppointment): void {
    if (apt.status !== 'PENDING') {
      alert('Chỉ có thể đổi giờ hẹn khi lịch hẹn đang ở trạng thái Chờ xác nhận.');
      return;
    }
    this.reschedulingAppointment = apt;
    this.rescheduleDate = apt.date;
    this.rescheduleTimeSlot = apt.timeSlot;
    this.rescheduleNotes = apt.notes || '';
    this.rescheduleError = '';
    this.rescheduleDateConflict = '';
    this.existingRescheduleAppointmentOnDate = null;
    this.isRescheduleModalOpen = true;
    this.checkRescheduleAvailability();
    this.cdr.markForCheck();
  }

  closeRescheduleModal(): void {
    this.isRescheduleModalOpen = false;
    this.reschedulingAppointment = null;
    this.rescheduleError = '';
    this.rescheduleDateConflict = '';
    this.existingRescheduleAppointmentOnDate = null;
  }

  onRescheduleDateChange(): void {
    this.rescheduleDateConflict = '';
    this.existingRescheduleAppointmentOnDate = null;
    if (!this.rescheduleDate || !this.reschedulingAppointment) return;

    // Kiểm tra khách đã có lịch hẹn KHÁC vào ngày mới chưa
    const otherAppt = this.appointments.find(a => 
      a.id !== this.reschedulingAppointment?.id &&
      a.status !== 'CANCELLED' &&
      a.date === this.rescheduleDate
    );
    if (otherAppt) {
      this.existingRescheduleAppointmentOnDate = otherAppt;
      this.rescheduleDateConflict = `Bạn đã có lịch hẹn vào ngày ${this.rescheduleDate} (${otherAppt.timeSlot}). Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày.`;
    }

    this.checkRescheduleAvailability();
  }

  selectRescheduleSlot(slot: string): void {
    if (this.isRescheduleSlotDisabled(slot)) return;
    this.rescheduleTimeSlot = slot;
  }

  isRescheduleSlotBooked(slot: string): boolean {
    if (this.rescheduleDate === this.reschedulingAppointment?.date && slot === this.reschedulingAppointment?.timeSlot) {
      return false;
    }
    if (this.rescheduleBookedSlots && this.rescheduleBookedSlots.includes(slot)) {
      return true;
    }
    if (this.existingRescheduleAppointmentOnDate && this.existingRescheduleAppointmentOnDate.timeSlot === slot) {
      return true;
    }
    return false;
  }

  isRescheduleSlotDisabled(slot: string): boolean {
    return this.isRescheduleSlotBooked(slot) || this.isSlotPast(slot, this.rescheduleDate) || !!this.rescheduleDateConflict;
  }

  checkRescheduleAvailability(): void {
    if (!this.rescheduleDate || !this.reschedulingAppointment) return;

    this.customerService.getBookedSlots({
      date: this.rescheduleDate,
      appointmentType: this.reschedulingAppointment.appointmentType
    }).subscribe({
      next: (res) => {
        const booked = res.bookedSlots || [];
        this.rescheduleBookedSlots = booked.filter(s => {
          if (this.rescheduleDate === this.reschedulingAppointment?.date && s === this.reschedulingAppointment?.timeSlot) {
            return false;
          }
          return true;
        });

        this.rescheduleAvailableSlots = this.masterTimeSlots.filter(s => !this.rescheduleBookedSlots.includes(s) && !this.isSlotPast(s, this.rescheduleDate));
        this.cdr.markForCheck();
      },
      error: () => {
        this.rescheduleAvailableSlots = [...this.masterTimeSlots];
        this.cdr.markForCheck();
      }
    });
  }

  confirmReschedule(): void {
    if (!this.reschedulingAppointment || !this.rescheduleDate || !this.rescheduleTimeSlot) {
      this.rescheduleError = 'Vui lòng chọn ngày và khung giờ mới.';
      return;
    }

    if (this.rescheduleBookedSlots.includes(this.rescheduleTimeSlot)) {
      this.rescheduleError = `Khung giờ ${this.rescheduleTimeSlot} đã có khách hàng đặt. Vui lòng chọn khung giờ khác.`;
      return;
    }

    this.isRescheduling = true;
    this.rescheduleError = '';

    this.sub.add(
      this.customerService.rescheduleAppointment(this.reschedulingAppointment.id, {
        date: this.rescheduleDate,
        timeSlot: this.rescheduleTimeSlot,
        notes: this.rescheduleNotes
      }).subscribe({
        next: (res) => {
          this.isRescheduling = false;
          this.closeRescheduleModal();
          this.successMessage = res.message || 'Đổi giờ hẹn thành công!';
          this.loadAppointments();
          setTimeout(() => this.successMessage = '', 4500);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isRescheduling = false;
          this.rescheduleError = err.error?.message || 'Có lỗi xảy ra khi đổi giờ hẹn.';
          this.cdr.markForCheck();
        }
      })
    );
  }

  // ==========================================
  // HỦY LỊCH HẸN (Chỉ trước khi admin duyệt)
  // ==========================================
  openCancelModal(apt: CustomerAppointment): void {
    if (apt.status !== 'PENDING') {
      alert('Lịch hẹn đã được duyệt hoặc hoàn tất. Quý khách vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ hủy.');
      return;
    }
    this.cancellingAppointment = apt;
    this.cancelReason = 'Thay đổi kế hoạch cá nhân';
    this.cancelError = '';
    this.isCancelModalOpen = true;
    this.cdr.markForCheck();
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.cancellingAppointment = null;
    this.cancelError = '';
  }

  confirmCancel(): void {
    if (!this.cancellingAppointment) return;

    this.isCancelling = true;
    this.cancelError = '';

    this.sub.add(
      this.customerService.cancelAppointment(this.cancellingAppointment.id).subscribe({
        next: () => {
          this.isCancelling = false;
          this.closeCancelModal();
          this.successMessage = 'Đã hủy lịch hẹn thành công.';
          this.loadAppointments();
          setTimeout(() => this.successMessage = '', 4500);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isCancelling = false;
          this.cancelError = err.error?.message || 'Không thể hủy lịch hẹn.';
          this.cdr.markForCheck();
        }
      })
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'COMPLETED': return 'Hoàn tất';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
