import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  LucideAngularModule,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Settings,
  RefreshCw,
  Send,
  ArrowRight,
  Eye,
  UserCheck,
  FileText,
  Sparkles,
  MessageSquare,
  Compass,
  List,
  Grid,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-angular';
import {
  AdminConsultationService,
  ConsultationItem,
  ConsultationStats,
  StaffItem,
  ShowroomItem,
  SlotConfigItem
} from '../../../../core/services/admin-consultation.service';

interface CalendarDayCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ConsultationItem[];
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  icons = {
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Building2,
    Check,
    CheckCircle2,
    AlertCircle,
    X,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Plus,
    Edit,
    Trash2,
    Settings,
    RefreshCw,
    Send,
    ArrowRight,
    Eye,
    UserCheck,
    FileText,
    Sparkles,
    MessageSquare,
    Compass,
    List,
    Grid,
    ExternalLink,
    ShieldAlert,
    Info
  };

  // Tab điều hướng: 'requests' (Tab 1: Yêu cầu tư vấn) | 'schedule' (Tab 2: Lịch tư vấn)
  activeTab: 'requests' | 'schedule' = 'requests';

  // Dữ liệu từ API Backend
  consultations: ConsultationItem[] = [];
  stats: ConsultationStats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  };
  showrooms: ShowroomItem[] = [];
  staffList: StaffItem[] = [];
  isLoading = false;

  // Bộ lọc Tab 1 (Yêu cầu tư vấn)
  reqSearchQuery = '';
  reqFilterShowroomId = 'ALL';
  reqFilterStatus = 'ALL'; // Mặc định hiển thị tất cả yêu cầu tiếp nhận
  reqStartDate = '';
  reqEndDate = '';

  // Phân trang Tab 1 (10 yêu cầu / trang)
  reqCurrentPage = 1;
  reqPageSize = 10;

  get pagedConsultations(): ConsultationItem[] {
    const start = (this.reqCurrentPage - 1) * this.reqPageSize;
    return this.consultations.slice(start, start + this.reqPageSize);
  }

  get totalReqPages(): number {
    return Math.ceil(this.consultations.length / this.reqPageSize) || 1;
  }

  get reqPageNumbers(): number[] {
    return Array.from({ length: this.totalReqPages }, (_, i) => i + 1);
  }

  get reqShowingStart(): number {
    return this.consultations.length === 0 ? 0 : (this.reqCurrentPage - 1) * this.reqPageSize + 1;
  }

  get reqShowingEnd(): number {
    return Math.min(this.reqCurrentPage * this.reqPageSize, this.consultations.length);
  }

  setReqPage(page: number): void {
    if (page >= 1 && page <= this.totalReqPages) {
      this.reqCurrentPage = page;
    }
  }

  // Bộ lọc Tab 2 (Lịch tư vấn Calendar)
  calSearchQuery = '';
  calFilterShowroomId = 'ALL';
  calFilterStaffId = 'ALL';
  calFilterStatus = 'ALL'; // CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, ALL

  // Calendar View Mode: 'month' | 'week' | 'day'
  calendarView: 'month' | 'week' | 'day' = 'month';
  currentCalendarDate: Date = new Date();

  // Modal Chi tiết cuộc hẹn / Drawer
  selectedConsultation: ConsultationItem | null = null;
  isDetailOpen = false;

  // Modal Phê duyệt cuộc hẹn (Approve)
  isApproveModalOpen = false;
  approvingConsultation: ConsultationItem | null = null;
  approveStaffId = '';
  approveStaffName = '';
  approveDate = '';
  approveTime = '';
  approveNote = '';
  isApproving = false;
  approveStaffWarning: string | null = null;

  // Modal Từ chối cuộc hẹn (Reject)
  isRejectModalOpen = false;
  rejectingConsultation: ConsultationItem | null = null;
  rejectReasonType = 'Kín lịch tư vấn trong ngày';
  rejectReasonDetail = '';
  isRejecting = false;

  // Modal Hoàn tất tư vấn (Complete)
  isCompleteModalOpen = false;
  completingConsultation: ConsultationItem | null = null;
  completeResult = '';
  isCompleting = false;

  // Modal Dời lịch hẹn (Reschedule)
  isRescheduleModalOpen = false;
  reschedulingConsultation: ConsultationItem | null = null;
  rescheduleNewDate = '';
  rescheduleNewTime = '';
  rescheduleReason = '';
  isRescheduling = false;

  // Modal Hủy lịch hẹn (Cancel)
  isCancelModalOpen = false;
  cancellingConsultation: ConsultationItem | null = null;
  cancelReason = '';
  isCancelling = false;

  // Modal Cấu hình khung giờ (Config Slots)
  isConfigModalOpen = false;
  configShowroomId = '';
  configSlots: SlotConfigItem[] = [];
  configMaintenanceDates: string[] = [];
  newHolidayDate = '';
  isSavingConfig = false;

  // Floating Toast Notification
  showToast = false;
  toastType: 'success' | 'error' | 'info' = 'success';
  toastTitle = '';
  toastMessage = '';
  private toastTimer: any = null;

  private routeSub?: Subscription;

  // Các ca tư vấn chuẩn
  readonly TIME_SLOT_OPTIONS = [
    '09:00 - 10:30',
    '10:30 - 12:00',
    '14:00 - 15:30',
    '16:00 - 17:30',
    '18:30 - 20:00'
  ];

  constructor(
    private consultationService: AdminConsultationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.syncActiveTabFromUrl();

    this.routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        const prevTab = this.activeTab;
        this.syncActiveTabFromUrl();
        if (prevTab !== this.activeTab) {
          this.loadConsultations();
        }
      });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'schedule' || params['tab'] === 'requests') {
        const prevTab = this.activeTab;
        this.activeTab = params['tab'];
        if (prevTab !== this.activeTab) {
          this.loadConsultations();
        }
      }
    });

    this.loadInitialLookups();
    this.loadConsultations();
  }

  private syncActiveTabFromUrl(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('schedule')) {
      this.activeTab = 'schedule';
    } else {
      this.activeTab = 'requests';
    }
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // --- 1. TẢI DỮ LIỆU BAN ĐẦU ---
  loadInitialLookups(): void {
    this.consultationService.getShowrooms().subscribe({
      next: (data) => {
        this.showrooms = data || [];
        if (this.showrooms.length > 0 && !this.configShowroomId) {
          this.configShowroomId = this.showrooms[0].id;
        }
      },
      error: (err) => console.error('Lỗi tải showrooms:', err)
    });

    this.consultationService.getStaffList().subscribe({
      next: (data) => {
        this.staffList = data || [];
      },
      error: (err) => console.error('Lỗi tải staff:', err)
    });
  }

  loadConsultations(): void {
    this.isLoading = true;
    const filters = this.activeTab === 'requests' 
      ? {
          tab: 'requests',
          status: this.reqFilterStatus,
          showroomId: this.reqFilterShowroomId,
          startDate: this.reqStartDate,
          endDate: this.reqEndDate,
          search: this.reqSearchQuery
        }
      : {
          tab: 'calendar',
          status: this.calFilterStatus,
          showroomId: this.calFilterShowroomId,
          staffId: this.calFilterStaffId,
          search: this.calSearchQuery
        };

    this.consultationService.getAdminConsultations(filters as any).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          this.consultations = res.consultations || [];
          this.stats = res.stats || this.stats;
          this.computeCalendarState();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi tải danh sách tư vấn:', err);
        this.triggerToast('error', 'Lỗi hệ thống', 'Không thể kết nối đến cơ sở dữ liệu để tải danh sách tư vấn.');
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'requests' | 'schedule'): void {
    this.activeTab = tab;
    const targetUrl = tab === 'requests' ? '/admin/appointments/requests' : '/admin/appointments/schedule';
    this.router.navigateByUrl(targetUrl, { replaceUrl: true });
    this.loadConsultations();
  }

  onFilterChange(): void {
    this.reqCurrentPage = 1;
    this.loadConsultations();
  }

  resetReqFilters(): void {
    this.reqCurrentPage = 1;
    this.reqSearchQuery = '';
    this.reqFilterShowroomId = 'ALL';
    this.reqFilterStatus = 'ALL';
    this.reqStartDate = '';
    this.reqEndDate = '';
    this.loadConsultations();
  }

  resetCalFilters(): void {
    this.calSearchQuery = '';
    this.calFilterShowroomId = 'ALL';
    this.calFilterStaffId = 'ALL';
    this.calFilterStatus = 'ALL';
    this.loadConsultations();
  }

  // --- 2. LOGIC CALENDAR VIEW (MONTH, WEEK, DAY) ---
  get currentMonthLabel(): string {
    const month = this.currentCalendarDate.getMonth() + 1;
    const year = this.currentCalendarDate.getFullYear();
    return `Tháng ${month}, ${year}`;
  }

  get currentWeekLabel(): string {
    const start = this.getStartOfWeek(this.currentCalendarDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const format = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `Tuần từ ${format(start)} đến ${format(end)}, ${end.getFullYear()}`;
  }

  get currentDayLabel(): string {
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const d = this.currentCalendarDate;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayNames[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
  }

  prevCalendarPeriod(): void {
    const d = new Date(this.currentCalendarDate);
    if (this.calendarView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (this.calendarView === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    this.currentCalendarDate = d;
    this.computeCalendarState();
  }

  nextCalendarPeriod(): void {
    const d = new Date(this.currentCalendarDate);
    if (this.calendarView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (this.calendarView === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    this.currentCalendarDate = d;
    this.computeCalendarState();
  }

  todayCalendar(): void {
    this.currentCalendarDate = new Date();
    this.computeCalendarState();
  }

  setCalendarView(view: 'month' | 'week' | 'day'): void {
    this.calendarView = view;
    this.computeCalendarState();
  }

  // Dữ liệu Calendar được lưu sẵn trong bộ nhớ, không tính toán lại mỗi Change Detection
  monthCalendarCells: CalendarDayCell[] = [];
  weekCalendarDays: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean; events: ConsultationItem[] }[] = [];
  availableTimeSlots: string[] = [];
  dayViewTimeSlots: { time: string; events: ConsultationItem[] }[] = [];

  computeCalendarState(): void {
    // 1. Khung giờ khả dụng
    const slotList: string[] = [];
    if (this.configSlots && this.configSlots.length > 0) {
      this.configSlots.forEach(s => {
        const t = (s.time || '').trim();
        if (t && !slotList.includes(t)) slotList.push(t);
      });
    }
    if (slotList.length === 0) {
      this.TIME_SLOT_OPTIONS.forEach(s => {
        if (!slotList.includes(s)) slotList.push(s);
      });
    }
    this.consultations.forEach(c => {
      const t = (c.preferred_time || '').trim();
      if (t && !slotList.includes(t)) slotList.push(t);
    });
    this.availableTimeSlots = slotList;

    // Index sự kiện theo ngày để tra cứu O(1) cực nhanh
    const eventsByDate = new Map<string, ConsultationItem[]>();
    for (const c of this.consultations) {
      const d = c.preferred_date;
      if (!eventsByDate.has(d)) {
        eventsByDate.set(d, []);
      }
      eventsByDate.get(d)!.push(c);
    }

    const todayStr = this.formatDateStr(new Date());

    // 2. Ma trận 42 ô cho Month View
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay();
    const shift = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - shift);

    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = this.formatDateStr(d);
      const isCurrentMonth = d.getMonth() === month;
      const isToday = dateStr === todayStr;
      const events = eventsByDate.get(dateStr) || [];

      cells.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth,
        isToday,
        events
      });
    }
    this.monthCalendarCells = cells;

    // 3. Các ngày cho Week View
    const startWeek = this.getStartOfWeek(this.currentCalendarDate);
    const weekDays = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startWeek);
      d.setDate(d.getDate() + i);
      const dateStr = this.formatDateStr(d);
      const events = eventsByDate.get(dateStr) || [];

      weekDays.push({
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
        events
      });
    }
    this.weekCalendarDays = weekDays;

    // 4. Khung giờ sự kiện cho Day View
    const curDateStr = this.formatDateStr(this.currentCalendarDate);
    const dayEvents = eventsByDate.get(curDateStr) || [];

    this.dayViewTimeSlots = this.availableTimeSlots.map(slotTime => {
      const events = dayEvents.filter(e => {
        const startTime = slotTime.split(' - ')[0];
        return e.preferred_time === slotTime || (startTime && e.preferred_time.startsWith(startTime));
      });
      return {
        time: slotTime,
        events
      };
    });
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh để Thứ 2 là ngày bắt đầu
    return new Date(d.setDate(diff));
  }

  private formatDateStr(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // --- 3. DETAIL DRAWER MODAL ---
  openDetail(c: ConsultationItem): void {
    this.selectedConsultation = c;
    this.isDetailOpen = true;
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedConsultation = null;
  }

  // --- 4. THAO TÁC PHÊ DUYỆT (APPROVE) ---
  openApproveModal(c: ConsultationItem): void {
    this.approvingConsultation = c;
    this.approveDate = c.preferred_date;
    this.approveTime = c.preferred_time;
    this.approveNote = '';
    this.approveStaffWarning = null;

    // Gán mặc định nhân viên đầu tiên nếu có
    if (this.staffList.length > 0) {
      this.approveStaffId = this.staffList[0].id;
      this.approveStaffName = this.staffList[0].name;
    } else {
      this.approveStaffId = '';
      this.approveStaffName = '';
    }

    this.isApproveModalOpen = true;
  }

  closeApproveModal(): void {
    this.isApproveModalOpen = false;
    this.approvingConsultation = null;
    this.isApproving = false;
  }

  onApproveStaffSelect(event: Event): void {
    const staffId = (event.target as HTMLSelectElement).value;
    const staff = this.staffList.find(s => s.id === staffId);
    if (staff) {
      this.approveStaffId = staff.id;
      this.approveStaffName = staff.name;
    }
  }

  confirmApprove(): void {
    if (!this.approvingConsultation || !this.approveStaffId) {
      this.triggerToast('error', 'Chưa chọn nhân sự', 'Vui lòng chọn nhân viên tư vấn phụ trách cuộc hẹn.');
      return;
    }

    this.isApproving = true;
    this.consultationService.approveConsultation({
      id: this.approvingConsultation.id,
      staffId: this.approveStaffId,
      staffName: this.approveStaffName,
      preferredDate: this.approveDate,
      preferredTime: this.approveTime,
      adminNote: this.approveNote
    }).subscribe({
      next: (res) => {
        this.isApproving = false;
        this.closeApproveModal();
        if (this.isDetailOpen) this.closeDetail();

        const noti = res.notification;
        let notiMsg = res.message;
        if (noti && noti.smsSent) {
          notiMsg += ` Đã gửi SMS Brandname và thông báo cho chuyên viên ${this.approveStaffName}.`;
        }

        this.triggerToast('success', 'Phê duyệt thành công', notiMsg);
        this.loadConsultations();
      },
      error: (err) => {
        this.isApproving = false;
        console.error('Lỗi duyệt lịch:', err);
        const errMsg = err.error?.error || 'Có lỗi xảy ra khi phê duyệt lịch tư vấn.';
        this.triggerToast('error', 'Không thể duyệt lịch', errMsg);
      }
    });
  }

  // --- 5. THAO TÁC TỪ CHỐI (REJECT) ---
  openRejectModal(c: ConsultationItem): void {
    this.rejectingConsultation = c;
    this.rejectReasonType = 'Kín lịch tư vấn trong ngày';
    this.rejectReasonDetail = '';
    this.isRejectModalOpen = true;
  }

  closeRejectModal(): void {
    this.isRejectModalOpen = false;
    this.rejectingConsultation = null;
    this.isRejecting = false;
  }

  confirmReject(): void {
    if (!this.rejectingConsultation) return;

    let fullReason = this.rejectReasonType;
    if (this.rejectReasonDetail.trim()) {
      fullReason += `: ${this.rejectReasonDetail.trim()}`;
    }

    this.isRejecting = true;
    this.consultationService.rejectConsultation({
      id: this.rejectingConsultation.id,
      rejectionReason: fullReason
    }).subscribe({
      next: (res) => {
        this.isRejecting = false;
        this.closeRejectModal();
        if (this.isDetailOpen) this.closeDetail();
        this.triggerToast('success', 'Đã từ chối yêu cầu', res.message || 'Yêu cầu tư vấn đã được từ chối và giải phóng slot.');
        this.loadConsultations();
      },
      error: (err) => {
        this.isRejecting = false;
        console.error('Lỗi từ chối lịch:', err);
        const errMsg = err.error?.error || 'Không thể từ chối yêu cầu tư vấn.';
        this.triggerToast('error', 'Lỗi thao tác', errMsg);
      }
    });
  }

  // --- 6. BẮT ĐẦU TƯ VẤN (IN_PROGRESS) ---
  startConsultation(c: ConsultationItem): void {
    this.consultationService.updateStatusConsultation({
      id: c.id,
      status: 'IN_PROGRESS',
      note: 'Khách hàng đã có mặt tại showroom, nhân viên đang tiếp đón tư vấn trực tiếp.'
    }).subscribe({
      next: (res) => {
        this.triggerToast('info', 'Bắt đầu tư vấn', `Lịch hẹn ${c.appointment_code} đã chuyển sang trạng thái Đang tư vấn.`);
        this.loadConsultations();
        if (this.selectedConsultation && this.selectedConsultation.id === c.id) {
          this.selectedConsultation.status = 'IN_PROGRESS';
        }
      },
      error: (err) => {
        console.error('Lỗi chuyển trạng thái:', err);
        this.triggerToast('error', 'Lỗi thao tác', 'Không thể cập nhật trạng thái cuộc hẹn.');
      }
    });
  }

  // --- 7. HOÀN TẤT TƯ VẤN (COMPLETE) ---
  openCompleteModal(c: ConsultationItem): void {
    this.completingConsultation = c;
    this.completeResult = '';
    this.isCompleteModalOpen = true;
  }

  closeCompleteModal(): void {
    this.isCompleteModalOpen = false;
    this.completingConsultation = null;
    this.isCompleting = false;
  }

  confirmComplete(): void {
    if (!this.completingConsultation || !this.completeResult.trim()) {
      this.triggerToast('error', 'Thiếu thông tin', 'Vui lòng nhập tóm tắt kết quả buổi tư vấn.');
      return;
    }

    this.isCompleting = true;
    this.consultationService.completeConsultation({
      id: this.completingConsultation.id,
      consultationResult: this.completeResult.trim()
    }).subscribe({
      next: (res) => {
        this.isCompleting = false;
        this.closeCompleteModal();
        if (this.isDetailOpen) this.closeDetail();
        this.triggerToast('success', 'Hoàn tất tư vấn', res.message || 'Đã ghi nhận kết quả tư vấn thành công.');
        this.loadConsultations();
      },
      error: (err) => {
        this.isCompleting = false;
        console.error('Lỗi hoàn tất tư vấn:', err);
        this.triggerToast('error', 'Lỗi thao tác', err.error?.error || 'Không thể lưu kết quả tư vấn.');
      }
    });
  }

  // --- 8. DỜI LỊCH HẸN (RESCHEDULE) ---
  openRescheduleModal(c: ConsultationItem): void {
    this.reschedulingConsultation = c;
    this.rescheduleNewDate = c.preferred_date;
    this.rescheduleNewTime = c.preferred_time;
    this.rescheduleReason = '';
    this.isRescheduleModalOpen = true;
  }

  closeRescheduleModal(): void {
    this.isRescheduleModalOpen = false;
    this.reschedulingConsultation = null;
    this.isRescheduling = false;
  }

  confirmReschedule(): void {
    if (!this.reschedulingConsultation || !this.rescheduleNewDate || !this.rescheduleNewTime) {
      this.triggerToast('error', 'Thiếu thông tin', 'Vui lòng chọn ngày hẹn mới và khung giờ mới.');
      return;
    }

    this.isRescheduling = true;
    this.consultationService.rescheduleConsultation({
      id: this.reschedulingConsultation.id,
      newDate: this.rescheduleNewDate,
      newTime: this.rescheduleNewTime,
      reason: this.rescheduleReason
    }).subscribe({
      next: (res) => {
        this.isRescheduling = false;
        this.closeRescheduleModal();
        if (this.isDetailOpen) this.closeDetail();
        this.triggerToast('success', 'Dời lịch thành công', res.message || 'Đã cập nhật ngày hẹn mới và gửi thông báo xác nhận đến khách.');
        this.loadConsultations();
      },
      error: (err) => {
        this.isRescheduling = false;
        console.error('Lỗi dời lịch:', err);
        this.triggerToast('error', 'Không thể dời lịch', err.error?.error || 'Có lỗi xảy ra khi dời lịch hẹn.');
      }
    });
  }

  // --- 9. HỦY LỊCH HẸN (CANCEL) ---
  openCancelModal(c: ConsultationItem): void {
    this.cancellingConsultation = c;
    this.cancelReason = '';
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.cancellingConsultation = null;
    this.isCancelling = false;
  }

  confirmCancel(): void {
    if (!this.cancellingConsultation || !this.cancelReason.trim()) {
      this.triggerToast('error', 'Thiếu lý do', 'Vui lòng nhập lý do hủy lịch hẹn tư vấn.');
      return;
    }

    this.isCancelling = true;
    this.consultationService.cancelConsultation({
      id: this.cancellingConsultation.id,
      cancellationReason: this.cancelReason.trim()
    }).subscribe({
      next: (res) => {
        this.isCancelling = false;
        this.closeCancelModal();
        if (this.isDetailOpen) this.closeDetail();
        this.triggerToast('success', 'Đã hủy lịch hẹn', res.message || 'Đã hủy cuộc hẹn và giải phóng slot trên lịch tư vấn.');
        this.loadConsultations();
      },
      error: (err) => {
        this.isCancelling = false;
        console.error('Lỗi hủy lịch:', err);
        this.triggerToast('error', 'Lỗi thao tác', err.error?.error || 'Không thể hủy lịch hẹn.');
      }
    });
  }

  // --- 10. MODAL CẤU HÌNH KHUNG GIỜ & NGÀY NGHỈ (CONFIG SLOTS) ---
  openConfigModal(): void {
    if (this.showrooms.length > 0 && !this.configShowroomId) {
      this.configShowroomId = this.showrooms[0].id;
    }
    this.loadShowroomSlotConfig();
    this.isConfigModalOpen = true;
  }

  closeConfigModal(): void {
    this.isConfigModalOpen = false;
  }

  loadShowroomSlotConfig(): void {
    if (!this.configShowroomId) return;
    this.consultationService.getSlotConfig(this.configShowroomId).subscribe({
      next: (res) => {
        this.configSlots = (res.slots || []).map(s => {
          const parts = (s.time || '').split('-').map(p => p.trim());
          const startTime = parts[0] || '09:00';
          const endTime = parts[1] || '10:30';
          return {
            ...s,
            startTime,
            endTime,
            time: `${startTime} - ${endTime}`
          };
        });
        this.configMaintenanceDates = res.maintenanceDates || [];
        this.computeCalendarState();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tải cấu hình slot:', err)
    });
  }

  onConfigShowroomChange(): void {
    this.loadShowroomSlotConfig();
  }

  // Chuyển chuỗi "HH:mm" thành số phút trong ngày để so sánh
  timeToMinutes(t: string): number {
    if (!t) return 0;
    const parts = t.split(':').map(Number);
    const h = isNaN(parts[0]) ? 0 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  }

  // Chuyển số phút thành chuỗi "HH:mm"
  minutesToTime(m: number): string {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  // Cập nhật khi thay đổi giờ bắt đầu hoặc kết thúc của ca
  onSlotTimeChanged(slot: SlotConfigItem, index: number): void {
    const start = (slot.startTime || '').trim();
    const end = (slot.endTime || '').trim();
    if (start && end) {
      slot.time = `${start} - ${end}`;
      // Tự động gợi ý Tên ca dựa vào thời điểm trong ngày nếu chưa đặt tên riêng
      const startMin = this.timeToMinutes(start);
      if (!slot.period || slot.period === 'Ca làm việc' || slot.period === 'Ca sáng' || slot.period === 'Ca chiều' || slot.period === 'Ca tối') {
        if (startMin < 12 * 60) {
          slot.period = 'Ca sáng';
        } else if (startMin < 18 * 60) {
          slot.period = 'Ca chiều';
        } else {
          slot.period = 'Ca tối';
        }
      }
    }
  }

  // Kiểm tra trùng lặp hoặc xung đột khung giờ cho ca tại vị trí index
  getSlotConflict(index: number): string | null {
    const slot = this.configSlots[index];
    if (!slot) return null;

    const start = (slot.startTime || '').trim();
    const end = (slot.endTime || '').trim();

    if (!start || !end) {
      return 'Vui lòng chọn đủ giờ bắt đầu và kết thúc';
    }

    const startMin = this.timeToMinutes(start);
    const endMin = this.timeToMinutes(end);

    if (startMin >= endMin) {
      return 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    }

    // Kiểm tra giao nhau với tất cả các ca khác
    for (let i = 0; i < this.configSlots.length; i++) {
      if (i === index) continue;
      const other = this.configSlots[i];
      const otherStart = (other.startTime || '').trim();
      const otherEnd = (other.endTime || '').trim();
      if (!otherStart || !otherEnd) continue;

      const otherStartMin = this.timeToMinutes(otherStart);
      const otherEndMin = this.timeToMinutes(otherEnd);

      // Hai khoảng thời gian [start, end] và [otherStart, otherEnd] giao nhau khi:
      // start < otherEnd && otherStart < end
      if (startMin < otherEndMin && otherStartMin < endMin) {
        return `Trùng khung giờ với Ca ${i + 1} (${otherStart} - ${otherEnd})`;
      }
    }

    return null;
  }

  // Thêm dòng ca mới: Tự động tính toán khung giờ kế tiếp hợp lý, tránh trùng ca cũ
  addEmptySlotRow(): void {
    let nextStartMin = 9 * 60; // 09:00 mặc định nếu chưa có ca nào
    if (this.configSlots.length > 0) {
      let maxEndMin = 0;
      for (const s of this.configSlots) {
        const eMin = this.timeToMinutes(s.endTime || '');
        if (eMin > maxEndMin) {
          maxEndMin = eMin;
        }
      }
      if (maxEndMin > 0) {
        nextStartMin = maxEndMin; // Nối tiếp ngay sau ca muộn nhất
      }
    }

    if (nextStartMin >= 22 * 60) {
      nextStartMin = 8 * 60; // Nếu quá 22:00 thì quay về sáng sớm
    }

    const nextEndMin = Math.min(23 * 60, nextStartMin + 90);
    const startTime = this.minutesToTime(nextStartMin);
    const endTime = this.minutesToTime(nextEndMin);

    let period = 'Ca sáng';
    if (nextStartMin >= 18 * 60) period = 'Ca tối';
    else if (nextStartMin >= 12 * 60) period = 'Ca chiều';

    this.configSlots.push({
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      period,
      maxCapacity: 3
    });
  }

  // Xóa ca làm việc khỏi danh sách
  removeSlot(index: number): void {
    if (index >= 0 && index < this.configSlots.length) {
      const removed = this.configSlots[index];
      this.configSlots.splice(index, 1);
      const name = removed.time || `Hàng ${index + 1}`;
      this.triggerToast('info', 'Đã xóa ca', `Đã xóa "${name}". Nhấn "Lưu cấu hình" để cập nhật.`);
    }
  }

  addHolidayDate(): void {
    if (this.newHolidayDate && !this.configMaintenanceDates.includes(this.newHolidayDate)) {
      this.configMaintenanceDates.push(this.newHolidayDate);
      this.newHolidayDate = '';
    }
  }

  removeHolidayDate(index: number): void {
    this.configMaintenanceDates.splice(index, 1);
  }

  saveConfig(): void {
    if (!this.configShowroomId) return;

    if (this.configSlots.length === 0) {
      this.triggerToast('error', 'Chưa có ca', 'Vui lòng có ít nhất 1 ca làm việc trong danh sách.');
      return;
    }

    // Kiểm tra ràng buộc không trùng lặp và thời gian hợp lệ cho từng ca
    for (let i = 0; i < this.configSlots.length; i++) {
      const conflictMsg = this.getSlotConflict(i);
      if (conflictMsg) {
        this.triggerToast('error', 'Khung giờ không hợp lệ', `Ca số ${i + 1}: ${conflictMsg}. Vui lòng chỉnh sửa trước khi lưu.`);
        return;
      }

      const s = this.configSlots[i];
      s.time = `${s.startTime} - ${s.endTime}`;
      s.period = (s.period || '').trim() || 'Ca làm việc';
      s.maxCapacity = Math.max(1, Number(s.maxCapacity) || 1);
    }

    this.isSavingConfig = true;
    this.consultationService.saveSlotConfig({
      showroomId: this.configShowroomId,
      slots: this.configSlots,
      maintenanceDates: this.configMaintenanceDates
    }).subscribe({
      next: (res) => {
        this.isSavingConfig = false;
        this.closeConfigModal();
        this.triggerToast('success', 'Lưu thành công', res.message || 'Cấu hình ca tư vấn và ngày nghỉ lễ đã được cập nhật.');
        this.loadConsultations();
      },
      error: (err) => {
        this.isSavingConfig = false;
        console.error('Lỗi lưu cấu hình:', err);
        this.triggerToast('error', 'Lỗi lưu cấu hình', err.error?.error || 'Không thể lưu cấu hình ca làm việc.');
      }
    });
  }

  // --- 11. TOAST HELPER ---
  triggerToast(type: 'success' | 'error' | 'info', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.showToast = true;

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.detectChanges();
    }, 4500);
    this.cdr.detectChanges();
  }

  closeToast(): void {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // Helper hiển thị tên showroom
  getShowroomName(id: string): string {
    const s = this.showrooms.find(x => x.id === id);
    return s ? s.name : id;
  }

  // Helper màu trạng thái
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'CONFIRMED': return 'badge-confirmed';
      case 'IN_PROGRESS': return 'badge-in-progress';
      case 'COMPLETED': return 'badge-completed';
      case 'REJECTED': return 'badge-rejected';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ phê duyệt';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'IN_PROGRESS': return 'Đang tư vấn';
      case 'COMPLETED': return 'Đã hoàn tất';
      case 'REJECTED': return 'Đã từ chối';
      case 'CANCELLED': return 'Đã hủy hẹn';
      default: return status;
    }
  }
}
