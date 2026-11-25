import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  Plus,
  Check,
  CheckCircle2,
  Sparkles,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  AlertCircle,
  UserRound,
  RotateCcw,
  ShieldCheck,
  Info,
  Package
} from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import {
  ShowroomConsultationModalComponent,
  SlotItem,
  DayOption
} from '../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';
import { CustomerService, CustomerAppointment } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, skip } from 'rxjs';

@Component({
  selector: 'app-account-appointments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    AccountSidebarComponent,
    GuestPhoneBannerComponent,
    ShowroomConsultationModalComponent
  ],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css']
})
export class AccountAppointmentsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Plus,
    Check,
    CheckCircle2,
    Sparkles,
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    X,
    AlertTriangle,
    AlertCircle,
    UserRound,
    RotateCcw,
    ShieldCheck,
    Info,
    Package
  };

  appointments: CustomerAppointment[] = [];
  filteredAppointments: CustomerAppointment[] = [];
  isLoading = false;
  activeFilter = 'ALL';
  errorMessage = '';
  successMessage = '';

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  // Modal đặt lịch tư vấn dùng chung toàn hệ thống (<app-showroom-consultation-modal>)
  isBookingModalOpen = false;

  // Reschedule Modal State (Đổi giờ hẹn trước khi admin duyệt - PENDING)
  isRescheduleModalOpen = false;
  reschedulingAppointment: CustomerAppointment | null = null;
  rescheduleDayOptions: DayOption[] = [];
  @ViewChild('rescheduleDateStripRef', { static: false }) rescheduleDateStripRef?: ElementRef<HTMLDivElement>;
  isAtRescheduleDateStart = true;
  isAtRescheduleDateEnd = false;
  rescheduleDate = '';
  rescheduleTimeSlot = '';
  rescheduleNotes = '';
  rescheduleSlots = signal<SlotItem[]>([]);
  isLoadingRescheduleSlots = signal<boolean>(false);
  isRescheduleClosedDay = signal<boolean>(false);
  rescheduleClosureReason = signal<string>('');
  isRescheduling = false;
  rescheduleError = '';

  readonly availableRescheduleSlots = computed(() =>
    this.rescheduleSlots().filter(s => this.isRescheduleSlotSelectable(s))
  );

  // Cancel Confirmation Modal (Hủy hẹn trước khi admin duyệt - PENDING)
  isCancelModalOpen = false;
  cancellingAppointment: CustomerAppointment | null = null;
  cancelReason = 'Thay đổi kế hoạch cá nhân';
  isCancelling = false;
  cancelError = '';

  minDate = '';
  maxDate = '';

  private sub = new Subscription();
  private appointmentsReqSub?: Subscription;
  private rescheduleSlotsSub?: Subscription;
  private isDestroyed = false;
  private isViewReady = false;
  private appointmentsUpdatedListener?: () => void;

  private triggerRender(): void {
    if (!this.isDestroyed) {
      this.cdr.markForCheck();
      if (this.isViewReady) {
        try {
          this.cdr.detectChanges();
        } catch (_) {}
      }
    }
  }

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  initDateBounds(): void {
    const today = new Date();
    this.minDate = this.getLocalDateString(today);
    const max = new Date();
    max.setDate(today.getDate() + 30);
    this.maxDate = this.getLocalDateString(max);
  }

  ngOnInit(): void {
    try {
      localStorage.removeItem('dcor_cache_appointments');
    } catch (_) {}

    this.initDateBounds();

    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

    this.sub.add(
      this.authService.user$.pipe(skip(1)).subscribe(user => {
        this.isLoggedIn = !!user;
        this.checkAndLoad();
        this.triggerRender();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.pipe(skip(1)).subscribe(phone => {
        this.isPhoneVerified = !!phone;
        this.checkAndLoad();
        this.triggerRender();
      })
    );

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          const tab = params['tab'].toUpperCase();
          if (['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'UPCOMING'].includes(tab)) {
            this.activeFilter = tab === 'UPCOMING' ? 'CONFIRMED' : tab;
            this.applyFilter();
            this.triggerRender();
          }
        }
        if (params['action'] === 'book' || params['open'] === 'book') {
          this.openBookingModal();
        }
      })
    );

    if (typeof window !== 'undefined') {
      this.appointmentsUpdatedListener = () => {
        if (this.canViewContent) {
          this.loadAppointments();
        }
      };
      window.addEventListener('dcor_appointments_updated', this.appointmentsUpdatedListener);
    }

    this.checkAndLoad();
    this.isViewReady = true;
  }

  private checkAndLoad(): void {
    if (this.canViewContent) {
      this.loadAppointments();
    } else {
      this.appointmentsReqSub?.unsubscribe();
      this.appointments = [];
      this.filteredAppointments = [];
      this.isLoading = false;
      this.triggerRender();
    }
  }

  onGuestPhoneVerified(_phone: string): void {
    this.isPhoneVerified = true;
    this.appointments = [];
    this.filteredAppointments = [];
    this.errorMessage = '';
    this.loadAppointments();
    this.triggerRender();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.appointmentsReqSub?.unsubscribe();
    this.appointments = [];
    this.filteredAppointments = [];
    this.isLoading = false;
    this.triggerRender();
  }

  loadAppointments(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.triggerRender();
      return;
    }
    this.appointmentsReqSub?.unsubscribe();
    this.isLoading = true;
    this.triggerRender();
    this.appointmentsReqSub = this.customerService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.applyFilter();
        this.isLoading = false;
        this.triggerRender();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Không thể tải lịch hẹn.';
        this.appointments = [];
        this.filteredAppointments = [];
        this.isLoading = false;
        this.triggerRender();
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'PENDING') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'PENDING');
    } else if (this.activeFilter === 'CONFIRMED' || this.activeFilter === 'UPCOMING') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');
    } else if (this.activeFilter === 'COMPLETED') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'COMPLETED');
    } else if (this.activeFilter === 'CANCELLED') {
      this.filteredAppointments = this.appointments.filter(a => a.status === 'CANCELLED' || a.status === 'REJECTED');
    } else {
      this.filteredAppointments = [...this.appointments];
    }
  }

  getCountByStatus(key: string): number {
    if (key === 'ALL') return this.appointments.length;
    if (key === 'CONFIRMED' || key === 'UPCOMING') {
      return this.appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length;
    }
    if (key === 'CANCELLED') {
      return this.appointments.filter(a => a.status === 'CANCELLED' || a.status === 'REJECTED').length;
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

  // ==========================================
  // ĐẶT LỊCH MỚI (Dùng chung <app-showroom-consultation-modal>)
  // ==========================================
  openBookingModal(): void {
    this.isBookingModalOpen = true;
    this.triggerRender();
  }

  closeBookingModal(): void {
    this.isBookingModalOpen = false;
    this.triggerRender();
  }

  onConsultationBooked(created: any): void {
    const bookedPhone = created?.customerPhone || created?.phone;
    if (!this.isLoggedIn && bookedPhone) {
      this.authService.setGuestPhone(String(bookedPhone).trim());
      this.isPhoneVerified = true;
    }
    this.activeFilter = 'ALL';
    this.successMessage = `Đã gửi yêu cầu tư vấn #${created?.appointmentCode || ''} thành công!`;
    this.loadAppointments();
    setTimeout(() => {
      this.successMessage = '';
      this.triggerRender();
    }, 5000);
    this.triggerRender();
  }

  // ==========================================
  // ĐỔI GIỜ HẸN (Chỉ trước khi admin duyệt - PENDING)
  // ==========================================
  private initRescheduleDayOptions(targetDate?: string): void {
    const days: DayOption[] = [];
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let totalDays = 16;
    if (targetDate) {
      const target = new Date(`${targetDate}T00:00:00`);
      if (!isNaN(target.getTime())) {
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= totalDays && diffDays <= 30) {
          totalDays = diffDays + 1;
        }
      }
    }

    for (let i = 0; i < totalDays; i++) {
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

    this.rescheduleDayOptions = days;
  }

  scrollRescheduleDateStrip(direction: 'prev' | 'next'): void {
    const el = this.rescheduleDateStripRef?.nativeElement;
    if (!el) return;
    const scrollAmount = el.clientWidth;
    el.scrollBy({
      left: direction === 'prev' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateRescheduleDateScrollStatus(), 350);
  }

  onRescheduleDateStripScroll(): void {
    this.updateRescheduleDateScrollStatus();
  }

  private updateRescheduleDateScrollStatus(): void {
    const el = this.rescheduleDateStripRef?.nativeElement;
    if (!el) return;
    this.isAtRescheduleDateStart = el.scrollLeft <= 8;
    this.isAtRescheduleDateEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    this.triggerRender();
  }

  selectRescheduleDate(dateStr: string): void {
    if (this.rescheduleDate === dateStr) return;
    this.rescheduleDate = dateStr;
    this.rescheduleError = '';
    this.rescheduleTimeSlot = '';
    this.checkRescheduleAvailability();
  }

  openRescheduleModal(apt: CustomerAppointment): void {
    if (apt.status !== 'PENDING') {
      alert('Chỉ có thể đổi giờ hẹn khi lịch hẹn đang ở trạng thái Chờ xác nhận.');
      return;
    }
    this.reschedulingAppointment = apt;
    this.rescheduleDate = apt.date >= this.minDate ? apt.date : this.minDate;
    this.initRescheduleDayOptions(this.rescheduleDate);
    this.rescheduleTimeSlot = apt.timeSlot;
    this.rescheduleNotes = apt.notes || '';
    this.rescheduleError = '';
    this.rescheduleSlots.set([]);
    this.isRescheduleClosedDay.set(false);
    this.rescheduleClosureReason.set('');
    this.isAtRescheduleDateStart = true;
    this.isAtRescheduleDateEnd = false;
    this.isRescheduleModalOpen = true;
    this.checkRescheduleAvailability();
    this.triggerRender();

    setTimeout(() => {
      const strip = this.rescheduleDateStripRef?.nativeElement;
      if (strip) {
        const activeBtn = strip.querySelector('.date-pill-btn.active') as HTMLElement | null;
        if (activeBtn) {
          activeBtn.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
        } else {
          strip.scrollLeft = 0;
        }
        this.updateRescheduleDateScrollStatus();
      }
    }, 80);
  }

  closeRescheduleModal(): void {
    this.rescheduleSlotsSub?.unsubscribe();
    this.isRescheduleModalOpen = false;
    this.reschedulingAppointment = null;
    this.rescheduleError = '';
    this.rescheduleSlots.set([]);
    this.isLoadingRescheduleSlots.set(false);
    this.isRescheduleClosedDay.set(false);
    this.rescheduleClosureReason.set('');
  }

  onRescheduleDateChange(): void {
    this.rescheduleError = '';
    this.rescheduleTimeSlot = '';
    this.checkRescheduleAvailability();
  }

  isRescheduleSlotSelectable(slot: SlotItem): boolean {
    if (slot.isPastSlot) return false;
    if (slot.isAvailable) return true;
    // Cho phép giữ lại đúng khung giờ hiện tại của chính lịch hẹn này
    return (
      this.rescheduleDate === this.reschedulingAppointment?.date &&
      slot.time === this.reschedulingAppointment?.timeSlot
    );
  }

  selectRescheduleSlot(slot: SlotItem): void {
    if (!this.isRescheduleSlotSelectable(slot)) return;
    this.rescheduleTimeSlot = slot.time;
    this.rescheduleError = '';
    this.triggerRender();
  }

  checkRescheduleAvailability(): void {
    if (!this.rescheduleDate || !this.reschedulingAppointment) return;

    this.rescheduleSlotsSub?.unsubscribe();
    this.isLoadingRescheduleSlots.set(true);
    this.isRescheduleClosedDay.set(false);
    this.rescheduleClosureReason.set('');
    this.triggerRender();

    this.rescheduleSlotsSub = this.customerService.getBookedSlots({
      date: this.rescheduleDate,
      showroomId: this.reschedulingAppointment.showroomId
    }).subscribe({
      next: (res) => {
        const isClosed = !!res.isClosed;
        const slots = Array.isArray(res.slots) ? res.slots : [];
        this.isRescheduleClosedDay.set(isClosed);
        this.rescheduleClosureReason.set(res.closureReason || '');
        this.rescheduleSlots.set(slots);

        if (isClosed) {
          this.rescheduleTimeSlot = '';
        } else if (
          this.rescheduleTimeSlot &&
          !slots.some(s => s.time === this.rescheduleTimeSlot && this.isRescheduleSlotSelectable(s))
        ) {
          this.rescheduleTimeSlot = '';
        }

        this.isLoadingRescheduleSlots.set(false);
        this.triggerRender();
      },
      error: () => {
        this.rescheduleSlots.set([]);
        this.isLoadingRescheduleSlots.set(false);
        this.rescheduleError = 'Không thể tải danh sách khung giờ trống của Showroom.';
        this.triggerRender();
      }
    });
  }

  confirmReschedule(): void {
    if (!this.reschedulingAppointment || !this.rescheduleDate || !this.rescheduleTimeSlot) {
      this.rescheduleError = 'Vui lòng chọn ngày và khung giờ mới.';
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
          setTimeout(() => {
            this.successMessage = '';
            this.triggerRender();
          }, 4500);
          this.triggerRender();
        },
        error: (err) => {
          this.isRescheduling = false;
          this.rescheduleError = err.error?.message || 'Có lỗi xảy ra khi đổi giờ hẹn.';
          this.triggerRender();
        }
      })
    );
  }

  // ==========================================
  // HỦY LỊCH HẸN (Chỉ trước khi admin duyệt - PENDING)
  // ==========================================
  openCancelModal(apt: CustomerAppointment): void {
    if (apt.status !== 'PENDING') {
      alert('Lịch hẹn đã được duyệt hoặc hoàn tất. Quý khách vui lòng liên hệ Hotline 1900 1234 để được hỗ trợ hủy.');
      return;
    }
    this.cancellingAppointment = apt;
    this.cancelReason = 'Thay đổi kế hoạch cá nhân';
    this.cancelError = '';
    this.isCancelModalOpen = true;
    this.triggerRender();
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
      this.customerService.cancelAppointment(this.cancellingAppointment.id, this.cancelReason).subscribe({
        next: () => {
          this.isCancelling = false;
          this.closeCancelModal();
          this.successMessage = 'Đã hủy lịch hẹn thành công.';
          this.loadAppointments();
          setTimeout(() => {
            this.successMessage = '';
            this.triggerRender();
          }, 4500);
          this.triggerRender();
        },
        error: (err) => {
          this.isCancelling = false;
          this.cancelError = err.error?.message || 'Không thể hủy lịch hẹn.';
          this.triggerRender();
        }
      })
    );
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      case 'REJECTED': return 'status-cancelled';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'IN_PROGRESS': return 'Đang tư vấn';
      case 'COMPLETED': return 'Hoàn tất';
      case 'REJECTED': return 'Đã từ chối';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.appointmentsReqSub?.unsubscribe();
    this.rescheduleSlotsSub?.unsubscribe();
    this.sub.unsubscribe();
    if (typeof window !== 'undefined' && this.appointmentsUpdatedListener) {
      window.removeEventListener('dcor_appointments_updated', this.appointmentsUpdatedListener);
    }
  }
}
