import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  LucideAngularModule, 
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Truck, Package, 
  AlertTriangle, ShieldCheck, DollarSign, CornerDownLeft, FileText, 
  Check, X, Building2, CreditCard, User, MapPin, Printer, RefreshCw,
  ExternalLink, Eye, ChevronRight, ChevronDown, Phone, Mail, Box, ShieldAlert, Lock, Info,
  Square, CheckSquare, Navigation, Copy, Calendar, Zap
} from 'lucide-angular';
import { OrdersService } from '../services/orders.service';
import { OrdersReturnsMockService } from '../orders-returns/services/orders-returns-mock.service';
import { 
  Order, OrderV2, AdminOrderStatus, PaymentStatus, UserStatusView, 
  mapAdminStatusToUserView, ReturnQcReport 
} from '../models/order.model';

export interface PaymentCheckStatus {
  canConfirm: boolean;
  holdType: 'NONE' | 'AWAITING_PAYMENT' | 'AWAITING_DEPOSIT';
  title?: string;
  message?: string;
  depositRequiredAmount?: number;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './order-detail.html',
  styleUrls: ['./order-detail.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private returnsService = inject(OrdersReturnsMockService);
  icons = {
    ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Truck, Package,
    AlertTriangle, ShieldCheck, DollarSign, CornerDownLeft, FileText,
    Check, X, Building2, CreditCard, User, MapPin, Printer, RefreshCw,
    ExternalLink, Eye, ChevronRight, ChevronDown, Phone, Mail, Box, ShieldAlert, Lock, Info,
    Square, CheckSquare, Navigation, Copy, Calendar, Zap
  };

  // Hình ảnh sản phẩm mặc định sang trọng khi gặp lỗi mạng/ảnh không tồn tại
  readonly defaultItemImage = '/assets/img/furniture-placeholder.svg';

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.defaultItemImage) {
      target.src = this.defaultItemImage;
    }
  }

  // Live GPS Map Tracking States
  isGpsRefreshing = false;
  lastGpsUpdate = '16:48:20 (Hôm nay)';
  copiedTracking = false;

  refreshGpsLocation(): void {
    if (this.isGpsRefreshing) return;
    this.isGpsRefreshing = true;
    setTimeout(() => {
      this.isGpsRefreshing = false;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      this.lastGpsUpdate = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} (Hôm nay)`;
    }, 700);
  }

  openGoogleMapsRoute(): void {
    if (!this.order?.address) return;
    const dest = encodeURIComponent(this.order.address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  }

  copyTrackingInfo(): void {
    const text = `Đơn: ${this.order?.orderNumber} | Vận đơn: ${this.order?.delivery.trackingCode} | Tài xế: ${this.order?.delivery.driverName} (${this.order?.delivery.driverPhone}) | Vị trí: Đ. Nguyễn Hữu Thọ, Q7`;
    navigator.clipboard.writeText(text).then(() => {
      this.copiedTracking = true;
      setTimeout(() => { this.copiedTracking = false; }, 2000);
    });
  }

  // Lấy danh sách lịch sử theo dõi vận chuyển thực tế từ lúc xuất kho trở đi
  get shippingOnlyHistory(): any[] {
    if (!this.order?.delivery?.trackingHistory) return [];
    const preShipKeywords = ['đặt hàng', 'chuyển khoản', 'đóng gói', 'thanh toán', 'xác nhận đơn', 'tạo đơn', 'duyệt đơn'];
    return this.order.delivery.trackingHistory.filter(step => {
      const s = (step.status || '').toLowerCase();
      return !preShipKeywords.some(kw => s.includes(kw));
    });
  }

  // Lấy thời gian xuất kho thực tế của đơn hàng
  getShippedTime(): string {
    if (!this.order) return 'Đã xuất kho';
    const shipStep = this.order.delivery?.trackingHistory?.find(s => 
      s.status.toLowerCase().includes('xuất kho')
    );
    if (shipStep?.time) return shipStep.time;
    const shipLog = this.order.auditLogs?.find(l => 
      l.action.toLowerCase().includes('xuất kho')
    );
    if (shipLog?.timestamp) return shipLog.timestamp;
    return '14:00';
  }

  // Lấy thời gian giao hàng thực tế của đơn hàng
  getDeliveredTime(): string {
    if (!this.order) return 'Đã giao hàng';
    if (this.order.deliveredAt) return this.order.deliveredAt;
    const deliveredStep = this.order.delivery?.trackingHistory?.find(s => 
      s.status.toLowerCase().includes('giao hàng') || s.status.toLowerCase().includes('đã giao') || s.status.toLowerCase().includes('bàn giao')
    );
    if (deliveredStep?.time) return deliveredStep.time;
    return 'Vừa giao thành công';
  }

  orderId = '';
  order?: OrderV2;
  allOrders: OrderV2[] = [];
  private routeSub?: Subscription;
  private ordersSub?: Subscription;

  get isCustomOrder(): boolean {
    return !!(this.order?.isCustomDesign || this.order?.orderNumber?.includes('CUST') || (this.order as any)?.isCustom);
  }

  // 7-step pipeline configuration
  readonly STEP_CONFIG = [
    { key: 'PENDING' as AdminOrderStatus, en: 'Pending', vi: 'Chờ xác nhận', desc: 'Đơn mới tạo, kiểm tra thanh toán cọc và thông tin khách hàng.' },
    { key: 'CONFIRMED' as AdminOrderStatus, en: 'Confirmed', vi: 'Đã xác nhận', desc: 'Đã xác nhận đơn hàng, duyệt lệnh xuống kho.' },
    { key: 'PROCESSING' as AdminOrderStatus, en: 'Processing', vi: 'Đang chuẩn bị', desc: 'Thủ kho nhặt hàng và tiến hành kiểm định QC đóng gói.' },
    { key: 'READY_TO_SHIP' as AdminOrderStatus, en: 'Ready to Ship', vi: 'Sẵn sàng xuất', desc: 'Kiện hàng đã dán tem, chờ đơn vị vận chuyển quét mã lấy hàng.' },
    { key: 'SHIPPED' as AdminOrderStatus, en: 'Shipped', vi: 'Đang vận chuyển', desc: 'Hàng đã rời kho và đang trên đường giao tới khách hàng.' },
    { key: 'DELIVERED' as AdminOrderStatus, en: 'Delivered', vi: 'Đã giao hàng', desc: 'Khách hàng đã ký nhận, hệ thống kích hoạt đếm ngược 72 giờ đổi trả.' },
    { key: 'COMPLETED' as AdminOrderStatus, en: 'Completed', vi: 'Hoàn tất đơn', desc: 'Đơn hàng kết thúc chu trình thành công và khóa sổ doanh thu.' }
  ];

  // Selected historical step index to inspect (null = viewing active/live step)
  viewingStepIndex: number | null = null;

  // QC Checklist local edit state
  checklist = {
    surfaceChecked: false,
    structureChecked: false,
    cushionLeatherChecked: false,
    protectiveWrapDone: false
  };

  // Cancel Order Modal
  showCancelModal = false;
  cancelReason = '';
  customCancelReason = '';
  showCancelDropdown = false;
  isCancelling = false;

  readonly cancelOptions = [
    { value: 'Khách đổi ý không tiếp tục đặt hàng', label: 'Khách đổi ý không tiếp tục đặt hàng' },
    { value: 'Không liên lạc được với khách để xác nhận', label: 'Không liên lạc được với khách để xác nhận' },
    { value: 'Kho hết sản phẩm và không kịp sản xuất bổ sung', label: 'Kho hết sản phẩm và không kịp sản xuất bổ sung' },
    { value: 'Khách không đồng ý đặt cọc 30%', label: 'Khách không đồng ý đặt cọc 30%' },
    { value: 'Khác', label: 'Lý do khác...' }
  ];

  showRejectReturnModal = false;
  rejectReason = 'Sản phẩm không có lỗi từ nhà sản xuất hoặc đã quá thời hạn 72h hỗ trợ';

  showDeliveryFailedModal = false;
  deliveryFailedReason = '';
  customDeliveryFailedNote = '';
  showDeliveryFailedDropdown = false;

  readonly deliveryFailedOptions = [
    { value: 'Không liên lạc được với khách hàng', label: 'Không liên lạc được với khách hàng (Gọi không nghe máy / Thuê bao)' },
    { value: 'Khách bận, hẹn giao lại vào thời gian khác', label: 'Khách bận, hẹn giao lại vào thời gian khác' },
    { value: 'Sai địa chỉ nhận hàng / Không tìm thấy địa chỉ', label: 'Sai địa chỉ nhận hàng / Không tìm thấy địa chỉ' },
    { value: 'Khách từ chối nhận hàng do đổi ý', label: 'Khách từ chối nhận hàng do đổi ý' },
    { value: 'Khách không đồng ý thanh toán phần tiền còn lại', label: 'Khách không đồng ý thanh toán phần tiền còn lại' },
    { value: 'Khác', label: 'Lý do khác...' }
  ];

  showRescheduleModal = false;
  rescheduleDate = '';
  rescheduleTime = '09:00';
  minRescheduleDate = '';
  customRescheduleNote = '';

  showUserViewModal = false;
  selectedProofImage: string | null = null;

  openProofLightbox(url: string): void {
    this.selectedProofImage = url;
  }

  closeProofLightbox(): void {
    this.selectedProofImage = null;
  }

  // Trạng thái đang xử lý hành động (chống spam click / double-submit)
  isSubmitting = false;

  // New tracking code input for READY_TO_SHIP
  newTrackingCode = '';

  // Toast
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  // 72h Return Window Countdown State
  deliveredCountdown = {
    hours: 72,
    minutes: 0,
    seconds: 0,
    percentElapsed: 0,
    isExpired: false
  };
  private countdownTimer: any = null;

  padZero(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id') || '';
      this.loadOrder();
    });

    this.ordersSub = this.ordersService.orders$.subscribe(orders => {
      this.allOrders = orders;
      this.loadOrder();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  private loadOrder() {
    if (!this.orderId) return;
    this.order = this.ordersService.getOrderById(this.orderId);
    if (this.order) {
      this.checklist = {
        surfaceChecked: !!this.order.qcChecklist?.surfaceChecked,
        structureChecked: !!this.order.qcChecklist?.structureChecked,
        cushionLeatherChecked: !!this.order.qcChecklist?.cushionLeatherChecked,
        protectiveWrapDone: !!this.order.qcChecklist?.protectiveWrapDone
      };
      this.newTrackingCode = this.order.delivery.trackingCode || 'DCOR-SHIP-88992';
      this.viewingStepIndex = null;
      this.initDeliveredCountdown();
    }
  }

  private parseCustomDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    if (parts.length >= 2) {
      let datePart = parts[0];
      let timePart = parts[1];
      if (parts[0].includes(':') && parts[1].includes('/')) {
        timePart = parts[0];
        datePart = parts[1];
      }
      const dateParts = datePart.split('/').map(Number);
      const timeParts = timePart.split(':').map(Number);
      if (dateParts.length === 3) {
        const [d, m, y] = dateParts;
        const h = timeParts[0] || 0;
        const min = timeParts[1] || 0;
        const s = timeParts[2] || 0;
        return new Date(y, m - 1, d, h, min, s);
      }
    }
    const isoDate = new Date(dateStr);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  }

  private initDeliveredCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    if (!this.order || this.order.status !== 'DELIVERED') {
      return;
    }

    this.updateDeliveredCountdown();
    this.countdownTimer = setInterval(() => {
      this.updateDeliveredCountdown();
    }, 1000);
  }

  private updateDeliveredCountdown() {
    if (!this.order || this.order.status !== 'DELIVERED') {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      return;
    }

    const deliveredDate = this.parseCustomDate(this.order.deliveredAt) || this.parseCustomDate(this.order.createdAt) || new Date();
    const totalDurationMs = 72 * 60 * 60 * 1000; // 72 giờ
    const expireTimeMs = deliveredDate.getTime() + totalDurationMs;
    const nowMs = Date.now();
    const remainingMs = expireTimeMs - nowMs;

    if (remainingMs <= 0) {
      this.deliveredCountdown = {
        hours: 0,
        minutes: 0,
        seconds: 0,
        percentElapsed: 100,
        isExpired: true
      };
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      // THỰC SỰ CHUYỂN TRẠNG THÁI SANG COMPLETED VÀ LƯU VÀO DB / SERVICE
      const orderId = this.order.id;
      this.ordersService.completeOrder(orderId, 'Hệ thống tự động (Hết 72h Đổi/Trả)');
      this.triggerToast(
        'Đơn hàng đã tự động hoàn tất!',
        'Đã hết thời hạn 72h hỗ trợ đổi trả. Hệ thống đã tự động chốt Hoàn tất đơn hàng và kích hoạt bảo hành điện tử.',
        'success'
      );
      return;
    }

    const totalSec = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const elapsedMs = totalDurationMs - remainingMs;
    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

    this.deliveredCountdown = {
      hours,
      minutes,
      seconds,
      percentElapsed: percent,
      isExpired: false
    };
  }

  // Thử nghiệm đếm ngược: Đặt thời gian giao hàng sao cho còn đúng `seconds` giây
  simulateExpiringCountdown(seconds: number = 10): void {
    if (!this.order || this.order.status !== 'DELIVERED') return;
    this.ordersService.simulateCountdownEnding(this.order.id, seconds);
    this.updateDeliveredCountdown();
  }

  switchOrder(newId: string) {
    this.router.navigate(['/admin/orders', newId]);
  }

  goBack() {
    this.router.navigate(['/admin/orders']);
  }

  // --- PENDING PAYMENT & DEPOSIT VERIFICATION (3 SCENARIOS) ---
  get paymentCheck(): PaymentCheckStatus {
    if (!this.order || this.order.status !== 'PENDING') {
      return { canConfirm: true, holdType: 'NONE' };
    }

    // Trường hợp 3: Đơn Giá trị lớn (≥ 50 triệu) hoặc Hàng thiết kế riêng (Custom)
    const isHighOrCustom = this.order.isHighValue || this.order.isCustomDesign || (this.order.totalAmount >= 50000000) || !!this.order.isDepositRequired;
    const minDeposit = this.order.depositRequired || Math.round(this.order.totalAmount * 0.3);

    if (isHighOrCustom) {
      const isDepositSatisfied = (this.order.depositPaid || 0) >= minDeposit || this.order.paymentStatus === 'PAID';
      if (!isDepositSatisfied) {
        return {
          canConfirm: false,
          holdType: 'AWAITING_DEPOSIT',
          title: `Đơn hàng chờ đặt cọc tối thiểu 30% (${this.formatVND(minDeposit)})`,
          message: '',
          depositRequiredAmount: minDeposit
        };
      }
    }

    // Trường hợp 2: Đơn Chuyển khoản / VNPAY (Thanh toán trực tuyến)
    if (this.order.paymentMethod !== 'COD' && this.order.paymentStatus === 'UNPAID') {
      return {
        canConfirm: false,
        holdType: 'AWAITING_PAYMENT',
        title: 'Đơn hàng chưa thanh toán trực tuyến (Chuyển khoản / VNPAY)',
        message: ''
      };
    }

    // Trường hợp 1: Đơn COD thông thường (< 50 triệu) hoặc đã đủ điều kiện
    return {
      canConfirm: true,
      holdType: 'NONE'
    };
  }

  // Nhãn tiền hiển thị: "Thực tế đã cọc:" nếu là đơn cọc, "Thực tế đã thanh toán:" nếu thanh toán đủ hoặc đơn thanh toán online
  get actualPaidOrDepositLabel(): string {
    if (!this.order) return 'Thực tế đã thanh toán:';
    if (this.order.paymentStatus === 'PAID') {
      return 'Thực tế đã thanh toán:';
    }
    const isDeposit = this.order.isDepositRequired || (this.order.depositRequired && this.order.depositRequired > 0) || this.order.paymentStatus === 'PARTIAL';
    if (isDeposit) {
      return 'Thực tế đã cọc:';
    }
    return 'Thực tế đã thanh toán:';
  }

  // Số tiền thực tế khách đã cọc hoặc đã thanh toán
  get actualPaidOrDepositAmount(): number {
    if (!this.order) return 0;
    if (this.order.paymentStatus === 'PAID') {
      return this.order.depositPaid || this.order.totalAmount;
    }
    return this.order.depositPaid || 0;
  }

  // Trạng thái đạt điều kiện tiền cọc hoặc tiền thanh toán
  get isPaidOrDepositSatisfied(): boolean {
    if (!this.order) return false;
    if (this.order.paymentStatus === 'PAID') return true;
    if (this.order.depositRequired && this.order.depositRequired > 0) {
      return (this.order.depositPaid || 0) >= this.order.depositRequired;
    }
    return false;
  }

  // Helper chống spam click / double-submit
  private withSubmittingLock(actionFn: () => void, lockDuration = 600): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    try {
      actionFn();
    } finally {
      setTimeout(() => {
        this.isSubmitting = false;
      }, lockDuration);
    }
  }

  // Admin/Kế toán ghi nhận thanh toán trực tuyến hoặc cọc thủ công
  onConfirmManualPayment(type: 'FULL' | 'DEPOSIT') {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.confirmManualPayment(this.order!.id, type, 'Kế toán DCOR');
      if (ok) {
        if (type === 'FULL') {
          this.triggerToast(
            'Đã ghi nhận thanh toán trực tuyến!', 
            `Kế toán đối soát thành công thanh toán qua ${this.getPaymentMethodLabel(this.order!.paymentMethod)}. Nút [Xác nhận đơn hàng] đã được kích hoạt.`, 
            'success'
          );
        } else {
          const deposit = this.order!.depositRequired || Math.round(this.order!.totalAmount * 0.3);
          this.triggerToast(
            'Đã ghi nhận tiền cọc 30%!', 
            `Kế toán đã ghi nhận cọc ${this.formatVND(deposit)} thành công. Nút [Xác nhận đơn hàng] đã được kích hoạt để duyệt vào kho.`, 
            'success'
          );
        }
      }
    });
  }

  // Cuộn mượt mà lên đầu trang khi chuyển bước
  scrollToTop(): void {
    const doScroll = () => {
      try {
        const mainEl = document.querySelector('.admin-layout-main');
        if (mainEl) {
          mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_) {}
    };

    doScroll();
    setTimeout(doScroll, 80);
  }

  // --- TRANSITION ACTIONS TRIGGERED BY BOTTOM ACTION CARD ---

  // 1. PENDING -> CONFIRMED
  onConfirmOrder() {
    if (!this.order || this.isSubmitting) return;
    if (!this.paymentCheck.canConfirm) {
      const reason = this.paymentCheck.depositRequiredAmount 
        ? `Đơn hàng cần thu cọc tối thiểu ${this.formatVND(this.paymentCheck.depositRequiredAmount)} trước khi duyệt.`
        : 'Đơn hàng thanh toán trực tuyến cần xác nhận đã nhận tiền trước khi duyệt.';
      this.triggerToast('Chưa đủ điều kiện duyệt đơn!', reason, 'error');
      return;
    }
    this.withSubmittingLock(() => {
      const ok = this.ordersService.confirmOrder(this.order!.id, 'Admin Trần');
      if (ok) {
        this.checklist = {
          surfaceChecked: false,
          structureChecked: false,
          cushionLeatherChecked: false,
          protectiveWrapDone: false
        };
        this.triggerToast('Xác nhận đơn hàng thành công!', 'Đơn hàng đã được duyệt và chuyển vào kho để in Pick-list & kiểm tra QC.', 'success');
        this.scrollToTop();
      }
    });
  }

  // 2. CONFIRMED -> PROCESSING
  onStartProcessing() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.startProcessing(this.order!.id, 'Thủ kho Hoàng Sơn');
      if (ok) {
        this.checklist = {
          surfaceChecked: false,
          structureChecked: false,
          cushionLeatherChecked: false,
          protectiveWrapDone: false
        };
        this.triggerToast('Chuyển kho chuẩn bị thành công!', 'Đã in phiếu soạn hàng cho nhân viên kho.', 'success');
        this.scrollToTop();
      }
    });
  }

  // 3. PROCESSING -> READY_TO_SHIP
  onFinishPackaging() {
    if (!this.order || this.isSubmitting) return;
    if (!this.isQcAllChecked) {
      this.triggerToast('Chưa đạt tiêu chuẩn QC!', 'Vui lòng kiểm tra và tích chọn đủ 4 tiêu chuẩn kiểm định chất lượng trước khi hoàn tất đóng gói.', 'error');
      return;
    }
    this.withSubmittingLock(() => {
      // Update checklist in order
      this.ordersService.updateQcChecklist(this.order!.id, this.checklist);
      const ok = this.ordersService.finishPackaging(this.order!.id, this.checklist, 'Thủ kho Hoàng Sơn');
      if (ok) {
        this.triggerToast('Hoàn tất đóng gói!', 'Đã kiểm định QC 4 bước, dán nhãn niêm phong và sẵn sàng bàn giao cho đơn vị vận chuyển.', 'success');
        this.scrollToTop();
      }
    });
  }

  // 4. READY_TO_SHIP -> SHIPPED
  onDispatchOrder() {
    if (!this.order || this.isSubmitting) return;
    if (!this.isQcAllChecked) {
      this.triggerToast('Chưa đủ điều kiện xuất kho!', 'Biên bản kiểm tra chất lượng (QC) chưa hoàn tất đủ 4 mục.', 'error');
      return;
    }
    this.withSubmittingLock(() => {
      const tracking = this.newTrackingCode.trim() || 'DCOR-EXP-' + Math.floor(100000 + Math.random() * 900000);
      const ok = this.ordersService.dispatchOrder(this.order!.id, {
        provider: this.order!.delivery.provider,
        trackingCode: tracking
      }, 'Bộ phận Điều phối Kho');
      if (ok) {
        this.triggerToast('Xuất kho thành công!', `Đã bàn giao hàng cho đơn vị vận chuyển với mã vận đơn ${tracking}.`, 'success');
        this.scrollToTop();
      }
    });
  }

  // Tự động sinh mã vận đơn ngẫu nhiên mới
  generateNewTrackingCode(): void {
    this.newTrackingCode = 'DCOR-EXP-' + Math.floor(100000 + Math.random() * 900000);
  }

  // 5. SHIPPED -> DELIVERED
  onMarkDelivered() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.markDelivered(this.order!.id, 'Tài xế DCOR Express');
      if (ok) {
        this.triggerToast('Giao hàng thành công!', 'Khách đã ký nhận. Hệ thống kích hoạt đếm ngược 72 giờ khiếu nại đổi trả.', 'success');
        this.scrollToTop();
      }
    });
  }

  // SHIPPED -> FAILED_DELIVERY (Mở Popup Modal ghi nhận lý do)
  openDeliveryFailedModal(): void {
    this.deliveryFailedReason = '';
    this.customDeliveryFailedNote = '';
    this.showDeliveryFailedDropdown = false;
    this.showDeliveryFailedModal = true;
  }

  closeDeliveryFailedModal(): void {
    this.showDeliveryFailedModal = false;
    this.showDeliveryFailedDropdown = false;
  }

  get selectedDeliveryFailedLabel(): string {
    if (!this.deliveryFailedReason) return 'Chọn lý do';
    const opt = this.deliveryFailedOptions.find(o => o.value === this.deliveryFailedReason);
    return opt ? opt.label : this.deliveryFailedReason;
  }

  toggleDeliveryFailedDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showDeliveryFailedDropdown = !this.showDeliveryFailedDropdown;
  }

  selectDeliveryFailedReason(val: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.deliveryFailedReason = val;
    this.showDeliveryFailedDropdown = false;
  }

  // Điều kiện để kích hoạt nút Xác nhận giao thất bại
  get canConfirmDeliveryFailed(): boolean {
    if (!this.deliveryFailedReason) return false;
    if (this.deliveryFailedReason === 'Khác') {
      return !!this.customDeliveryFailedNote && this.customDeliveryFailedNote.trim().length > 0;
    }
    return true;
  }

  confirmDeliveryFailed(): void {
    if (!this.order || this.isSubmitting) return;
    if (!this.canConfirmDeliveryFailed) {
      if (!this.deliveryFailedReason) {
        this.triggerToast('Chưa chọn lý do!', 'Vui lòng chọn lý do giao thất bại trước khi xác nhận.', 'error');
      } else if (this.deliveryFailedReason === 'Khác') {
        this.triggerToast('Thiếu thông tin!', 'Vui lòng nhập nội dung chi tiết khi chọn Lý do khác.', 'error');
      }
      return;
    }
    this.withSubmittingLock(() => {
      const finalReason = this.deliveryFailedReason === 'Khác'
        ? this.customDeliveryFailedNote.trim()
        : (this.customDeliveryFailedNote.trim() ? `${this.deliveryFailedReason} - ${this.customDeliveryFailedNote.trim()}` : this.deliveryFailedReason);

      const ok = this.ordersService.markDeliveryFailed(this.order!.id, finalReason, 'Tài xế DCOR Express');
      this.showDeliveryFailedModal = false;
      if (ok) {
        this.triggerToast('Ghi nhận giao thất bại!', `Đã lưu lý do và chuyển trạng thái để hỗ trợ hủy hoàn kho hoặc hẹn giao lại.`, 'info');
        this.scrollToTop();
      }
    });
  }

  // FAILED_DELIVERY -> SHIPPED (Mở Popup Lên lịch giao lại)
  openRescheduleModal(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.minRescheduleDate = formatYMD(today);
    this.rescheduleDate = formatYMD(tomorrow);
    this.rescheduleTime = '09:00';
    this.customRescheduleNote = '';
    this.showRescheduleModal = true;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
  }

  confirmRescheduleDelivery(): void {
    if (!this.order || this.isSubmitting) return;
    if (!this.rescheduleDate) {
      this.triggerToast('Thiếu thông tin!', 'Vui lòng chọn ngày giao lại.', 'error');
      return;
    }

    this.withSubmittingLock(() => {
      const [y, m, d] = this.rescheduleDate.split('-');
      const formattedDate = `${d}/${m}/${y}`;
      const timeStr = this.rescheduleTime ? `lúc ${this.rescheduleTime}` : '';
      const dateTimePlan = `Giao lại ngày ${formattedDate} ${timeStr}`.trim();

      const finalPlan = this.customRescheduleNote.trim()
        ? `${dateTimePlan} (${this.customRescheduleNote.trim()})`
        : dateTimePlan;

      const ok = this.ordersService.rescheduleDelivery(this.order!.id, finalPlan, 'Điều phối viên DCOR');
      this.showRescheduleModal = false;
      if (ok) {
        this.triggerToast('Đã lên lịch giao lại!', `Đơn hàng đã được đưa lại vào lộ trình giao vận: ${finalPlan}.`, 'success');
        this.scrollToTop();
      }
    });
  }

  // 6. DELIVERED -> COMPLETED
  onCompleteOrder() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.completeOrder(this.order!.id, 'Admin Trần');
      if (ok) {
        this.triggerToast('Đơn hàng đã Hoàn tất!', 'Khóa hồ sơ đơn hàng, kích hoạt chính sách bảo hành 2 năm và ghi nhận doanh thu.', 'success');
        this.scrollToTop();
      }
    });
  }

  // Giả lập khách hàng gửi yêu cầu Đổi hàng trong thời hạn 72h
  onSimulateCustomerExchange() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      this.ordersService.requestReturn(this.order!.id, {
        reason: 'Khách hàng yêu cầu đổi sang mẫu mã / kích thước khác trong thời hạn 72h',
        proofImages: ['/assets/img/furniture-placeholder.svg'],
        customerNote: 'Khách hàng có nguyện vọng đổi sang mẫu sofa / màu sắc phù hợp hơn với không gian phòng khách.',
        type: 'EXCHANGE'
      });
      this.triggerToast('Ghi nhận Yêu cầu đổi hàng!', 'Đơn hàng đã chuyển sang trạng thái Return (Yêu cầu đổi hàng).', 'info');
      this.scrollToTop();
    });
  }

  // Giả lập khách hàng gửi yêu cầu Trả hàng & Hoàn tiền trong thời hạn 72h
  onSimulateCustomerReturn() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      this.ordersService.requestReturn(this.order!.id, {
        reason: 'Khách hàng yêu cầu trả hàng và hoàn tiền trong thời hạn 72h',
        proofImages: ['/assets/img/furniture-placeholder.svg'],
        customerNote: 'Tài xế đã tiếp nhận lại sản phẩm và đưa về kho để hoàn tiền vào tài khoản.',
        type: 'REFUND'
      });
      this.triggerToast('Ghi nhận Yêu cầu Trả hàng!', 'Đơn hàng đã chuyển sang trạng thái Return (Yêu cầu Trả hàng).', 'info');
      this.scrollToTop();
    });
  }

  // 7. RETURN_REQUESTED -> RETURNING
  onApproveReturn() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.approveReturn(this.order!.id, 'Chấp thuận đổi trả và điều phối xe lấy hàng', 'CSKH DCOR');
      if (ok) {
        this.triggerToast('Chấp thuận yêu cầu đổi trả!', 'Đã hướng dẫn khách đóng gói lại và cử xe tải DCOR Express qua thu hồi sản phẩm.', 'success');
        this.scrollToTop();
      }
    });
  }

  // RETURN_REQUESTED -> REJECT
  openRejectReturnModal() {
    this.showRejectReturnModal = true;
  }

  confirmRejectReturn() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const ok = this.ordersService.rejectReturn(this.order!.id, this.rejectReason, 'CSKH DCOR');
      this.showRejectReturnModal = false;
      if (ok) {
        this.triggerToast('Đã từ chối yêu cầu đổi trả!', 'Đã gửi email giải thích lý do cho khách hàng và hoàn tất đơn hàng.', 'info');
        this.scrollToTop();
      }
    });
  }

  // 8. RETURNING -> RETURNED (Receive & QC in Warehouse)
  onReceiveReturnQC() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const qcReport: ReturnQcReport = {
        inspector: 'Kỹ thuật viên Trịnh Văn Bách (Kho Bình Dương)',
        condition: 'Nguyên vẹn 98%, đủ tem mác phụ kiện',
        defectAssessment: 'Xước dăm chân gỗ 2cm, khung sườn và đệm mút đạt chuẩn xuất xưởng',
        refundPercent: 100,
        restockOption: 'RESTOCK_SALE'
      };
      const ok = this.ordersService.receiveReturnQC(this.order!.id, qcReport, 'Thủ kho Hoàng Sơn');
      if (ok) {
        this.triggerToast('Tiếp nhận & QC hàng hoàn tất!', 'Đã chuyển lệnh hoàn tiền 100% sang phòng Kế toán.', 'success');
        this.scrollToTop();
      }
    });
  }

  // 9. RETURNED -> REFUNDED
  onRefundOrder() {
    if (!this.order || this.isSubmitting) return;
    this.withSubmittingLock(() => {
      const txCode = 'VNPAY-REF-' + Math.floor(100000 + Math.random() * 900000);
      const ok = this.ordersService.refundOrder(this.order!.id, txCode, 'Kế toán trưởng DCOR');
      if (ok) {
        this.triggerToast('Hoàn tiền thành công!', `Đã chuyển khoản hoàn tiền cho khách qua mã GD ${txCode}.`, 'success');
        this.scrollToTop();
      }
    });
  }

  // Cancel Order Modal
  openCancelModal(): void {
    this.isCancelling = false;
    this.cancelReason = '';
    this.customCancelReason = '';
    this.showCancelDropdown = false;
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    if (this.isCancelling) return;
    this.showCancelModal = false;
    this.showCancelDropdown = false;
  }

  get selectedCancelReasonLabel(): string {
    if (!this.cancelReason) return 'Chọn lý do hủy';
    const opt = this.cancelOptions.find(o => o.value === this.cancelReason);
    return opt ? opt.label : this.cancelReason;
  }

  toggleCancelDropdown(event?: Event): void {
    if (this.isCancelling) return;
    if (event) {
      event.stopPropagation();
    }
    this.showCancelDropdown = !this.showCancelDropdown;
  }

  selectCancelReason(val: string, event?: Event): void {
    if (this.isCancelling) return;
    if (event) {
      event.stopPropagation();
    }
    this.cancelReason = val;
    this.showCancelDropdown = false;
  }

  get canConfirmCancel(): boolean {
    const hasReason = !!this.cancelReason && this.cancelReason.trim().length > 0;
    const hasDetailNote = !!this.customCancelReason && this.customCancelReason.trim().length > 0;
    return hasReason && hasDetailNote;
  }

  confirmCancelOrder(): void {
    if (!this.order || this.isCancelling || this.isSubmitting) return;
    if (!this.canConfirmCancel) {
      if (!this.cancelReason) {
        this.triggerToast('Chưa chọn lý do!', 'Vui lòng chọn lý do hủy đơn trước khi xác nhận.', 'error');
      } else if (!this.customCancelReason || !this.customCancelReason.trim()) {
        this.triggerToast('Thiếu thông tin!', 'Vui lòng nhập nội dung chi tiết lý do hủy đơn.', 'error');
      }
      return;
    }

    // Khóa ngay lập tức nút hủy và chặn click tiếp theo
    this.isCancelling = true;
    this.isSubmitting = true;

    setTimeout(() => {
      const reason = this.cancelReason === 'Khác'
        ? this.customCancelReason.trim()
        : `${this.cancelReason} - ${this.customCancelReason.trim()}`;

      const ok = this.ordersService.cancelOrder(this.order!.id, reason, 'Admin Trần');
      this.showCancelModal = false;
      this.showCancelDropdown = false;
      this.isCancelling = false;
      this.isSubmitting = false;

      if (ok) {
        this.triggerToast('Đã hủy đơn hàng!', `Lý do hủy: ${reason}.`, 'info');
        this.scrollToTop();
      }
    }, 450);
  }

  // Print invoice / Packing list
  handlePrint() {
    window.print();
  }

  // View customer details (navigate to Customers module)
  onViewCustomerDetail() {
    if (this.order?.customerId) {
      this.router.navigate(['/admin/customers', this.order.customerId]);
    } else {
      this.router.navigate(['/admin/customers'], {
        queryParams: { q: this.order?.phone || this.order?.customerName }
      });
    }
  }

  // --- HELPERS ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  getPaymentMethodLabel(method?: string): string {
    switch (method) {
      case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
      case 'COD': return 'Thanh toán khi nhận hàng (COD)';
      case 'VNPAY': return 'Cổng thanh toán VNPAY';
      case 'CREDIT_CARD': return 'Thẻ tín dụng / Ghi nợ';
      case 'INSTALLMENT': return 'Trả góp 0%';
      default: return method || '---';
    }
  }

  getPaymentStatusLabel(status?: string, order?: OrderV2): string {
    switch (status) {
      case 'UNPAID': return 'Chưa thanh toán';
      case 'PARTIAL': {
        let percent = 30;
        if (order && order.depositPaid && order.totalAmount) {
          percent = Math.round((order.depositPaid / order.totalAmount) * 100);
        }
        return `Đã đặt cọc (${percent}%)`;
      }
      case 'PAID': return 'Đã thanh toán đủ';
      case 'REFUND_PENDING': return 'Chờ hoàn tiền';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status || '---';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '---';
    // Support DD/MM/YYYY HH:mm or HH:mm DD/MM/YYYY or DD/MM/YYYY
    const matchDmy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    const matchTimeFirst = dateStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    let d: Date;
    if (matchDmy) {
      const day = parseInt(matchDmy[1], 10);
      const month = parseInt(matchDmy[2], 10) - 1;
      const year = parseInt(matchDmy[3], 10);
      const hour = matchDmy[4] ? parseInt(matchDmy[4], 10) : 0;
      const min = matchDmy[5] ? parseInt(matchDmy[5], 10) : 0;
      const sec = matchDmy[6] ? parseInt(matchDmy[6], 10) : 0;
      d = new Date(year, month, day, hour, min, sec);
    } else if (matchTimeFirst) {
      const hour = parseInt(matchTimeFirst[1], 10);
      const min = parseInt(matchTimeFirst[2], 10);
      const sec = matchTimeFirst[3] ? parseInt(matchTimeFirst[3], 10) : 0;
      const day = parseInt(matchTimeFirst[4], 10);
      const month = parseInt(matchTimeFirst[5], 10) - 1;
      const year = parseInt(matchTimeFirst[6], 10);
      d = new Date(year, month, day, hour, min, sec);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit' 
    });
  }

  formatAuditTime(dateStr?: string): string {
    if (!dateStr) return '---';
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    let d: Date;
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const min = match[5] ? parseInt(match[5], 10) : 0;
      const sec = match[6] ? parseInt(match[6], 10) : 0;
      d = new Date(year, month, day, hour, min, sec);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  get isReturnFlow(): boolean {
    if (!this.order) return false;
    return ['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(this.order.status);
  }

  get hasReturnClaim(): boolean {
    if (!this.order) return false;
    if (this.isReturnFlow || this.order.returnInfo) return true;
    const cleanNum = (this.order.orderNumber || '').replace(/#/g, '').trim();
    const cleanId = (this.order.id || '').trim();
    return this.returnsService.getAll().some((r: any) => 
      (r.id && r.id.toLowerCase() === cleanNum.toLowerCase()) ||
      (r.orderNumber && (r.orderNumber.toLowerCase() === this.order!.orderNumber.toLowerCase() || r.orderNumber.toLowerCase() === cleanNum.toLowerCase() || r.orderNumber.replace(/#/g, '').toLowerCase() === cleanNum.toLowerCase())) ||
      (r.orderId && r.orderId.toLowerCase() === cleanId.toLowerCase())
    );
  }

  // Admin Pipeline Stepper Helpers (Chuẩn hóa 6 bước: Gộp Pending & Confirmed thành bước 1: Xác nhận đơn)
  getAdminStepIndex(status?: AdminOrderStatus): number {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED':
      case 'PROCESSING': return 1;
      case 'READY_TO_SHIP': return 2;
      case 'SHIPPED':
      case 'FAILED_DELIVERY': return 3;
      case 'DELIVERED': return 4;
      case 'RETURN_REQUESTED':
      case 'RETURNING':
      case 'RETURNED':
      case 'COMPLETED': return 5;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  }

  get currentStepIndex(): number {
    return this.getAdminStepIndex(this.order?.status);
  }

  get activeViewingStep(): number {
    return this.viewingStepIndex !== null ? this.viewingStepIndex : this.currentStepIndex;
  }

  get isHistoricalView(): boolean {
    return this.viewingStepIndex !== null && this.viewingStepIndex !== this.currentStepIndex;
  }

  get isDataLocked(): boolean {
    if (this.isHistoricalView) return true;
    if (this.order?.status === 'COMPLETED' || this.order?.status === 'CANCELLED') return true;
    return false;
  }

  get isDeliveredOrCompleted(): boolean {
    if (!this.order) return false;
    if (['DELIVERED', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(this.order.status)) return true;
    return this.activeViewingStep >= 4;
  }

  // Khóa checkbox QC sau khi đã nhấn xác nhận Xuất kho ở bước Sẵn sàng xuất (từ SHIPPED trở đi) hoặc đơn hoàn tất/hủy
  get isQcLocked(): boolean {
    if (!this.order) return true;
    if (this.isHistoricalView) return true;

    const postReadyStatuses: AdminOrderStatus[] = [
      'SHIPPED', 
      'FAILED_DELIVERY', 
      'DELIVERED', 
      'COMPLETED', 
      'RETURN_REQUESTED', 
      'RETURNING', 
      'RETURNED', 
      'CANCELLED'
    ];

    if (postReadyStatuses.includes(this.order.status)) {
      return true;
    }

    if (this.activeViewingStep > 2) {
      return true;
    }

    return false;
  }

  // Trạng thái đạt đủ 4 tiêu chuẩn kiểm tra chất lượng (QC Checklist)
  get isQcAllChecked(): boolean {
    if (!this.checklist) return false;
    return !!(
      this.checklist.surfaceChecked &&
      this.checklist.structureChecked &&
      this.checklist.cushionLeatherChecked &&
      this.checklist.protectiveWrapDone
    );
  }

  // Tự động lưu trạng thái checklist QC khi người dùng check/uncheck
  onQcChange(): void {
    if (this.isQcLocked) return;
    if (this.order) {
      this.ordersService.updateQcChecklist(this.order.id, this.checklist);
    }
  }

  onStepClick(stepIndex: number) {
    if (!this.order) return;
    if (this.isStepDone(stepIndex)) {
      this.viewingStepIndex = stepIndex;
    } else if (this.isStepActive(stepIndex)) {
      this.viewingStepIndex = null;
    }
  }

  returnToCurrentStep() {
    this.viewingStepIndex = null;
  }

  isStepViewing(stepIndex: number): boolean {
    if (this.viewingStepIndex === null) {
      return this.isStepActive(stepIndex);
    }
    return this.viewingStepIndex === stepIndex;
  }

  getStepTooltip(stepIndex: number): string {
    if (this.isStepDone(stepIndex)) {
      if (stepIndex === 5 && this.isReturnFlow) {
        return `Đã hoàn tất tiếp nhận hàng đổi trả về kho (Đã khóa)`;
      }
      return `Bước đã hoàn thành: Nhấn để xem lại dữ liệu (Đã khóa)`;
    }
    if (this.isStepActive(stepIndex)) {
      if (stepIndex === 5 && this.isReturnFlow) {
        return `Đang xử lý quy trình Đổi / Trả hàng (Hiện tại)`;
      }
      return `Bước đang xử lý (Hiện tại)`;
    }
    return `Bước chưa diễn ra trong tiến trình`;
  }

  isStepActive(stepIndex: number): boolean {
    if (!this.order) return false;
    if (this.order.status === 'COMPLETED' || this.order.status === 'RETURNED') {
      return false;
    }
    return this.getAdminStepIndex(this.order.status) === stepIndex;
  }

  isStepDone(stepIndex: number): boolean {
    if (!this.order) return false;
    const current = this.getAdminStepIndex(this.order.status);
    if (current === -1) return false; // cancelled
    if (this.order.status === 'COMPLETED' || this.order.status === 'RETURNED') {
      return true;
    }
    return current > stepIndex;
  }

  isLineDone(fromStepIndex: number): boolean {
    if (!this.order) return false;
    const current = this.getAdminStepIndex(this.order.status);
    if (current === -1) return false;
    return current > fromStepIndex;
  }

  get vatRate(): number {
    return this.order?.vatRate ?? 8;
  }

  get vatAmount(): number {
    if (!this.order) return 0;
    return Math.round((this.order.subTotal - this.order.discountAmount) * (this.vatRate / 100));
  }

  get userView(): UserStatusView {
    if (!this.order) return mapAdminStatusToUserView('PENDING');
    return mapAdminStatusToUserView(this.order.status);
  }

  goToReturnDetail(): void {
    if (!this.order) return;

    let retId = this.order.returnInfo?.returnRequestId;

    if (!retId) {
      const cleanNum = (this.order.orderNumber || '').replace(/#/g, '').trim();
      const cleanId = (this.order.id || '').trim();

      const found = this.returnsService.getAll().find((r: any) => 
        (r.id && r.id.toLowerCase() === cleanNum.toLowerCase()) ||
        (r.orderNumber && (r.orderNumber.toLowerCase() === this.order!.orderNumber.toLowerCase() || r.orderNumber.toLowerCase() === cleanNum.toLowerCase() || r.orderNumber.replace(/#/g, '').toLowerCase() === cleanNum.toLowerCase())) ||
        (r.orderId && r.orderId.toLowerCase() === cleanId.toLowerCase())
      );

      if (found) {
        retId = found.id;
      } else {
        const newRet = this.returnsService.syncFromOrder(this.order, {
          reason: this.order.returnInfo?.reason || 'Yêu cầu đổi/trả sản phẩm',
          customerNote: this.order.returnInfo?.customerNote,
          type: (this.order.returnInfo?.type as any) || 'REFUND',
          proofImages: this.order.returnInfo?.proofImages
        });
        retId = newRet?.id;
      }
    }

    if (retId) {
      if (this.order.returnInfo) {
        this.order.returnInfo.returnRequestId = retId;
      }
      this.router.navigate(['/admin/orders/returns', retId]);
    } else {
      this.router.navigate(['/admin/orders/returns', this.order.orderNumber || this.order.id]);
    }
  }

  triggerToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 3500) {
    this.pauseToastTimer();
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.closeToast();
      });
    }, durationMs);
  }

  pauseToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  resumeToastTimer(): void {
    if (!this.showToast) return;
    this.pauseToastTimer();
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.closeToast();
      });
    }, 2000);
  }

  closeToast() {
    this.pauseToastTimer();
    this.showToast = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}

export { OrderDetailComponent as OrderDetailV2Component };
