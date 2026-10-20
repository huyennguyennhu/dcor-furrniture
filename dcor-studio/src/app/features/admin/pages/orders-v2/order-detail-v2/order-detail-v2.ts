import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  LucideAngularModule, 
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Truck, Package, 
  AlertTriangle, ShieldCheck, DollarSign, CornerDownLeft, FileText, 
  Check, X, Building2, CreditCard, User, MapPin, Printer, RefreshCw,
  ExternalLink, Eye, ChevronRight, Phone, Mail, Box, ShieldAlert, Lock, Info,
  Square, CheckSquare
} from 'lucide-angular';
import { OrdersV2Service } from '../services/orders-v2.service';
import { 
  OrderV2, AdminOrderStatus, PaymentStatus, UserStatusView, 
  mapAdminStatusToUserView, ReturnQcReport 
} from '../models/order-v2.model';

export interface PaymentCheckStatus {
  canConfirm: boolean;
  holdType: 'NONE' | 'AWAITING_PAYMENT' | 'AWAITING_DEPOSIT';
  title?: string;
  message?: string;
  depositRequiredAmount?: number;
}

@Component({
  selector: 'app-order-detail-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './order-detail-v2.html',
  styleUrls: ['./order-detail-v2.css']
})
export class OrderDetailV2Component implements OnInit, OnDestroy {
  icons = {
    ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Truck, Package,
    AlertTriangle, ShieldCheck, DollarSign, CornerDownLeft, FileText,
    Check, X, Building2, CreditCard, User, MapPin, Printer, RefreshCw,
    ExternalLink, Eye, ChevronRight, Phone, Mail, Box, ShieldAlert, Lock, Info,
    Square, CheckSquare
  };

  orderId = '';
  order?: OrderV2;
  allOrders: OrderV2[] = [];
  private routeSub?: Subscription;
  private ordersSub?: Subscription;

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
    surfaceChecked: true,
    structureChecked: true,
    cushionLeatherChecked: true,
    protectiveWrapDone: true
  };

  // Modals state
  showCancelModal = false;
  cancelReason = 'Khách đổi ý không tiếp tục đặt hàng';
  customCancelReason = '';

  showRejectReturnModal = false;
  rejectReason = 'Sản phẩm không có lỗi từ nhà sản xuất hoặc đã quá thời hạn 72h hỗ trợ';

  showUserViewModal = false;

  // New tracking code input for READY_TO_SHIP
  newTrackingCode = '';

  // Toast
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersV2Service
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
    }
  }

  switchOrder(newId: string) {
    this.router.navigate(['/admin/orders-v2', newId]);
  }

  goBack() {
    this.router.navigate(['/admin/orders-v2']);
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

  // Admin/Kế toán ghi nhận thanh toán trực tuyến hoặc cọc thủ công
  onConfirmManualPayment(type: 'FULL' | 'DEPOSIT') {
    if (!this.order) return;
    const ok = this.ordersService.confirmManualPayment(this.order.id, type, 'Kế toán DCOR');
    if (ok) {
      if (type === 'FULL') {
        this.triggerToast(
          'Đã ghi nhận thanh toán trực tuyến!', 
          `Kế toán đối soát thành công thanh toán qua ${this.getPaymentMethodLabel(this.order.paymentMethod)}. Nút [Xác nhận đơn hàng] đã được kích hoạt.`, 
          'success'
        );
      } else {
        const deposit = this.order.depositRequired || Math.round(this.order.totalAmount * 0.3);
        this.triggerToast(
          'Đã ghi nhận tiền cọc 30%!', 
          `Kế toán đã ghi nhận cọc ${this.formatVND(deposit)} thành công. Nút [Xác nhận đơn hàng] đã được kích hoạt để duyệt vào kho.`, 
          'success'
        );
      }
    }
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
    if (!this.order) return;
    if (!this.paymentCheck.canConfirm) {
      const reason = this.paymentCheck.depositRequiredAmount 
        ? `Đơn hàng cần thu cọc tối thiểu ${this.formatVND(this.paymentCheck.depositRequiredAmount)} trước khi duyệt.`
        : 'Đơn hàng thanh toán trực tuyến cần xác nhận đã nhận tiền trước khi duyệt.';
      this.triggerToast('Chưa đủ điều kiện duyệt đơn!', reason, 'error');
      return;
    }
    const ok = this.ordersService.confirmOrder(this.order.id, 'Admin Trần');
    if (ok) {
      this.triggerToast('Xác nhận đơn hàng thành công!', 'Đơn hàng đã được duyệt và chuyển vào kho để in Pick-list & kiểm tra QC.', 'success');
      this.scrollToTop();
    }
  }

  // 2. CONFIRMED -> PROCESSING
  onStartProcessing() {
    if (!this.order) return;
    const ok = this.ordersService.startProcessing(this.order.id, 'Thủ kho Hoàng Sơn');
    if (ok) {
      this.triggerToast('Chuyển kho chuẩn bị thành công!', 'Đã in phiếu soạn hàng cho nhân viên kho.', 'success');
      this.scrollToTop();
    }
  }

  // 3. PROCESSING -> READY_TO_SHIP
  onFinishPackaging() {
    if (!this.order) return;
    // Update checklist in order
    this.ordersService.updateQcChecklist(this.order.id, this.checklist);
    const ok = this.ordersService.finishPackaging(this.order.id, this.checklist, 'Thủ kho Hoàng Sơn');
    if (ok) {
      this.triggerToast('Hoàn tất đóng gói!', 'Đã kiểm định QC 4 bước, dán nhãn niêm phong và sẵn sàng bàn giao cho đơn vị vận chuyển.', 'success');
      this.scrollToTop();
    }
  }

  // 4. READY_TO_SHIP -> SHIPPED
  onDispatchOrder() {
    if (!this.order) return;
    const tracking = this.newTrackingCode.trim() || 'DCOR-EXP-' + Math.floor(100000 + Math.random() * 900000);
    const ok = this.ordersService.dispatchOrder(this.order.id, {
      provider: this.order.delivery.provider,
      trackingCode: tracking
    }, 'Bộ phận Điều phối Kho');
    if (ok) {
      this.triggerToast('Xuất kho thành công!', `Đã bàn giao hàng cho tài xế/ĐVC với mã vận đơn ${tracking}.`, 'success');
      this.scrollToTop();
    }
  }

  // 5. SHIPPED -> DELIVERED
  onMarkDelivered() {
    if (!this.order) return;
    const ok = this.ordersService.markDelivered(this.order.id, 'Tài xế DCOR Express');
    if (ok) {
      this.triggerToast('Giao hàng thành công!', 'Khách đã ký nhận. Hệ thống kích hoạt đếm ngược 72 giờ khiếu nại đổi trả.', 'success');
      this.scrollToTop();
    }
  }

  // SHIPPED -> FAILED_DELIVERY
  onMarkDeliveryFailed() {
    if (!this.order) return;
    const reason = prompt('Nhập lý do giao không thành công:', 'Khách bận họp không nghe máy, hẹn giao lại') || 'Không liên lạc được khách';
    const ok = this.ordersService.markDeliveryFailed(this.order.id, reason, 'Tài xế DCOR Express');
    if (ok) {
      this.triggerToast('Ghi nhận giao thất bại!', `Đã lưu lý do và lên lịch hẹn hỗ trợ giao lại.`, 'info');
      this.scrollToTop();
    }
  }

  // FAILED_DELIVERY -> SHIPPED (Re-attempt)
  onRescheduleDelivery() {
    if (!this.order) return;
    const note = prompt('Ghi chú ca giao lại:', 'Giao lại ca sáng 9h00 theo hẹn của khách') || 'Lên lịch giao lại';
    const ok = this.ordersService.rescheduleDelivery(this.order.id, note, 'Điều phối viên DCOR');
    if (ok) {
      this.triggerToast('Đã lên lịch giao lại!', 'Đơn hàng đã được đưa lại vào ca giao tiếp theo của đội vận tải.', 'success');
      this.scrollToTop();
    }
  }

  // 6. DELIVERED -> COMPLETED
  onCompleteOrder() {
    if (!this.order) return;
    const ok = this.ordersService.completeOrder(this.order.id, 'Admin Trần');
    if (ok) {
      this.triggerToast('Đơn hàng đã Hoàn tất!', 'Khóa hồ sơ đơn hàng, kích hoạt chính sách bảo hành 2 năm và ghi nhận doanh thu.', 'success');
      this.scrollToTop();
    }
  }

  // Simulate customer requesting return during 72h
  onSimulateCustomerReturn() {
    if (!this.order) return;
    this.ordersService.requestReturn(this.order.id, {
      reason: 'Sản phẩm bị xước nhẹ ở góc chân gỗ do va quẹt khi vận chuyển vào nhà',
      proofImages: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'],
      customerNote: 'Khách muốn đổi sản phẩm mới hoặc hoàn tiền nếu không có hàng thay thế.',
      type: 'REFUND'
    });
    this.triggerToast('Giả lập khiếu nại thành công!', 'Đơn hàng đã chuyển sang nhánh RETURN_REQUESTED (Yêu cầu trả hàng).', 'info');
    this.scrollToTop();
  }

  // 7. RETURN_REQUESTED -> RETURNING
  onApproveReturn() {
    if (!this.order) return;
    const ok = this.ordersService.approveReturn(this.order.id, 'Chấp thuận đổi trả và điều phối xe lấy hàng', 'CSKH DCOR');
    if (ok) {
      this.triggerToast('Chấp thuận yêu cầu đổi trả!', 'Đã hướng dẫn khách đóng gói lại và cử xe tải DCOR Express qua thu hồi sản phẩm.', 'success');
      this.scrollToTop();
    }
  }

  // RETURN_REQUESTED -> REJECT
  openRejectReturnModal() {
    this.showRejectReturnModal = true;
  }

  confirmRejectReturn() {
    if (!this.order) return;
    const ok = this.ordersService.rejectReturn(this.order.id, this.rejectReason, 'CSKH DCOR');
    this.showRejectReturnModal = false;
    if (ok) {
      this.triggerToast('Đã từ chối yêu cầu đổi trả!', 'Đã gửi email giải thích lý do cho khách hàng và hoàn tất đơn hàng.', 'info');
      this.scrollToTop();
    }
  }

  // 8. RETURNING -> RETURNED (Receive & QC in Warehouse)
  onReceiveReturnQC() {
    if (!this.order) return;
    const qcReport: ReturnQcReport = {
      inspector: 'Kỹ thuật viên Trịnh Văn Bách (Kho Bình Dương)',
      condition: 'Nguyên vẹn 98%, đủ tem mác phụ kiện',
      defectAssessment: 'Xước dăm chân gỗ 2cm, khung sườn và đệm mút đạt chuẩn xuất xưởng',
      refundPercent: 100,
      restockOption: 'RESTOCK_SALE'
    };
    const ok = this.ordersService.receiveReturnQC(this.order.id, qcReport, 'Thủ kho Hoàng Sơn');
    if (ok) {
      this.triggerToast('Tiếp nhận & QC hàng hoàn tất!', 'Đã chuyển lệnh hoàn tiền 100% sang phòng Kế toán.', 'success');
      this.scrollToTop();
    }
  }

  // 9. RETURNED -> REFUNDED
  onRefundOrder() {
    if (!this.order) return;
    const txCode = 'VNPAY-REF-' + Math.floor(100000 + Math.random() * 900000);
    const ok = this.ordersService.refundOrder(this.order.id, txCode, 'Kế toán trưởng DCOR');
    if (ok) {
      this.triggerToast('Hoàn tiền thành công!', `Đã chuyển khoản hoàn tiền cho khách qua mã GD ${txCode}.`, 'success');
      this.scrollToTop();
    }
  }

  // Cancel Order Modal
  openCancelModal() {
    this.showCancelModal = true;
  }

  confirmCancelOrder() {
    if (!this.order) return;
    const reason = this.customCancelReason.trim() || this.cancelReason;
    const ok = this.ordersService.cancelOrder(this.order.id, reason, 'Admin Trần');
    this.showCancelModal = false;
    if (ok) {
      this.triggerToast('Đã hủy đơn hàng!', `Lý do hủy: ${reason}.`, 'info');
      this.scrollToTop();
    }
  }

  // Print invoice / Packing list
  handlePrint() {
    window.print();
  }

  // View customer details (navigate to Customers module)
  onViewCustomerDetail() {
    this.router.navigate(['/admin/customers']);
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
    // Support DD/MM/YYYY HH:mm or DD/MM/YYYY
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

  // Admin Pipeline Stepper Helpers (Chuẩn hóa 6 bước: Gộp Pending & Confirmed thành bước 1: Xác nhận đơn)
  getAdminStepIndex(status?: AdminOrderStatus): number {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED':
      case 'PROCESSING': return 1;
      case 'READY_TO_SHIP': return 2;
      case 'SHIPPED':
      case 'FAILED_DELIVERY': return 3;
      case 'DELIVERED':
      case 'RETURN_REQUESTED':
      case 'RETURNING':
      case 'RETURNED': return 4;
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

  // Khóa checkbox QC chỉ khi đơn hàng đã hoàn tất hoặc bị hủy
  get isQcLocked(): boolean {
    if (!this.order) return true;
    if (this.order.status === 'COMPLETED' || this.order.status === 'CANCELLED') return true;
    return false;
  }

  // Tự động lưu trạng thái checklist QC khi người dùng check/uncheck
  onQcChange(): void {
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
      return `Bước đã hoàn thành: Nhấn để xem lại dữ liệu (Đã khóa)`;
    }
    if (this.isStepActive(stepIndex)) {
      return `Bước đang xử lý (Hiện tại)`;
    }
    return `Bước chưa diễn ra trong tiến trình`;
  }

  isStepActive(stepIndex: number): boolean {
    if (!this.order) return false;
    return this.getAdminStepIndex(this.order.status) === stepIndex;
  }

  isStepDone(stepIndex: number): boolean {
    if (!this.order) return false;
    const current = this.getAdminStepIndex(this.order.status);
    if (current === -1) return false; // cancelled
    if (current === 5) return true;   // completed
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

  triggerToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 4500);
  }

  closeToast() {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
