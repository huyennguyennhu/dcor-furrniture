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
  ExternalLink, Eye, ChevronRight, Phone, Mail, Box, ShieldAlert, Lock
} from 'lucide-angular';
import { OrdersV2Service } from '../services/orders-v2.service';
import { 
  OrderV2, AdminOrderStatus, PaymentStatus, UserStatusView, 
  mapAdminStatusToUserView, ReturnQcReport 
} from '../models/order-v2.model';

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
    ExternalLink, Eye, ChevronRight, Phone, Mail, Box, ShieldAlert, Lock
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
      this.checklist = { ...this.order.qcChecklist };
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

  // --- TRANSITION ACTIONS TRIGGERED BY BOTTOM ACTION CARD ---

  // 1. PENDING -> CONFIRMED
  onConfirmOrder() {
    if (!this.order) return;
    const ok = this.ordersService.confirmOrder(this.order.id, 'Admin Trần');
    if (ok) {
      this.triggerToast('Xác nhận đơn hàng thành công!', 'Đơn đã duyệt vào kho, gửi thông báo xác nhận cho khách hàng.', 'success');
    }
  }

  // Simulate customer paid deposit
  onSimulateDeposit() {
    if (!this.order) return;
    this.ordersService.mockSimulateDepositPaid(this.order.id);
    this.triggerToast('Đã ghi nhận cọc 30%!', 'Khách đã thanh toán cọc thành công qua Chuyển khoản ngân hàng. Điều kiện duyệt đơn đã được thỏa mãn!', 'success');
  }

  // 2. CONFIRMED -> PROCESSING
  onStartProcessing() {
    if (!this.order) return;
    const ok = this.ordersService.startProcessing(this.order.id, 'Thủ kho Hoàng Sơn');
    if (ok) {
      this.triggerToast('Chuyển kho chuẩn bị thành công!', 'Đã xuất phiếu nhặt hàng (Pick-list) cho nhân viên kho.', 'success');
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
    }
  }

  // 5. SHIPPED -> DELIVERED
  onMarkDelivered() {
    if (!this.order) return;
    const ok = this.ordersService.markDelivered(this.order.id, 'Tài xế DCOR Express');
    if (ok) {
      this.triggerToast('Giao hàng thành công!', 'Khách đã ký nhận. Hệ thống kích hoạt đếm ngược 72 giờ khiếu nại đổi trả.', 'success');
    }
  }

  // SHIPPED -> FAILED_DELIVERY
  onMarkDeliveryFailed() {
    if (!this.order) return;
    const reason = prompt('Nhập lý do giao không thành công:', 'Khách bận họp không nghe máy, hẹn giao lại') || 'Không liên lạc được khách';
    const ok = this.ordersService.markDeliveryFailed(this.order.id, reason, 'Tài xế DCOR Express');
    if (ok) {
      this.triggerToast('Ghi nhận giao thất bại!', `Đã lưu lý do và lên lịch hẹn hỗ trợ giao lại.`, 'info');
    }
  }

  // FAILED_DELIVERY -> SHIPPED (Re-attempt)
  onRescheduleDelivery() {
    if (!this.order) return;
    const note = prompt('Ghi chú ca giao lại:', 'Giao lại ca sáng 9h00 theo hẹn của khách') || 'Lên lịch giao lại';
    const ok = this.ordersService.rescheduleDelivery(this.order.id, note, 'Điều phối viên DCOR');
    if (ok) {
      this.triggerToast('Đã lên lịch giao lại!', 'Đơn hàng đã được đưa lại vào ca giao tiếp theo của đội vận tải.', 'success');
    }
  }

  // 6. DELIVERED -> COMPLETED
  onCompleteOrder() {
    if (!this.order) return;
    const ok = this.ordersService.completeOrder(this.order.id, 'Admin Trần');
    if (ok) {
      this.triggerToast('Đơn hàng đã Hoàn tất!', 'Khóa hồ sơ đơn hàng, kích hoạt chính sách bảo hành 2 năm và ghi nhận doanh thu.', 'success');
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
  }

  // 7. RETURN_REQUESTED -> RETURNING
  onApproveReturn() {
    if (!this.order) return;
    const ok = this.ordersService.approveReturn(this.order.id, 'Chấp thuận đổi trả và điều phối xe lấy hàng', 'CSKH DCOR');
    if (ok) {
      this.triggerToast('Chấp thuận yêu cầu đổi trả!', 'Đã hướng dẫn khách đóng gói lại và cử xe tải DCOR Express qua thu hồi sản phẩm.', 'success');
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
    }
  }

  // 9. RETURNED -> REFUNDED
  onRefundOrder() {
    if (!this.order) return;
    const txCode = 'VNPAY-REF-' + Math.floor(100000 + Math.random() * 900000);
    const ok = this.ordersService.refundOrder(this.order.id, txCode, 'Kế toán trưởng DCOR');
    if (ok) {
      this.triggerToast('Hoàn tiền thành công!', `Đã chuyển khoản hoàn tiền cho khách qua mã GD ${txCode}.`, 'success');
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
    }
  }

  // Print invoice / Packing list
  handlePrint() {
    window.print();
  }

  // View customer details (pending Customer module)
  onViewCustomerDetail() {
    this.triggerToast(
      'Module Khách hàng',
      'Đang chuẩn bị liên kết... Vui lòng đợi hoàn thành module Khách hàng!',
      'info'
    );
    alert('Vui lòng đợi hoàn thành module Khách hàng nhé!');
  }

  // --- HELPERS ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
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

  // Admin Pipeline Stepper Helpers
  getAdminStepIndex(status?: AdminOrderStatus): number {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING': return 2;
      case 'READY_TO_SHIP': return 3;
      case 'SHIPPED': return 4;
      case 'FAILED_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      case 'RETURN_REQUESTED':
      case 'RETURNING':
      case 'RETURNED': return 5;
      case 'COMPLETED': return 6;
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

  onStepClick(stepIndex: number) {
    if (!this.order) return;
    if (this.isStepDone(stepIndex)) {
      this.viewingStepIndex = stepIndex;
      const step = this.STEP_CONFIG[stepIndex];
      this.triggerToast(
        `Xem lại bước: ${step.en} (${step.vi})`,
        'Dữ liệu ở bước này đã hoàn tất và được khóa bảo vệ (Chế độ chỉ đọc).',
        'info'
      );
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
    if (current === 6) return true;   // completed
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
