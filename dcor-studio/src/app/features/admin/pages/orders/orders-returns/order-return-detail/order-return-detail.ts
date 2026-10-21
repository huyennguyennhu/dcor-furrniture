import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule,
  ArrowLeft, CheckCircle2, XCircle, Clock, X, Package, RefreshCw, 
  CornerDownLeft, Eye, Printer, Phone, MapPin, Truck, DollarSign, 
  ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle, 
  ChevronRight, ExternalLink, MessageSquare, Send, Check, UserCheck, ChevronDown, UserPlus,
  Navigation, Compass, Sparkles, Layers, ShieldAlert
} from 'lucide-angular';
import { 
  OrdersReturnsMockService, 
  ReturnRequest, 
  ReturnStatus, 
  ReturnType,
  ReturnQcChecklist,
  ReturnPickupDispatch,
  ReturnReplacementOrder
} from '../services/orders-returns-mock.service';

@Component({
  selector: 'app-order-return-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './order-return-detail.html',
  styleUrls: ['./order-return-detail.css']
})
export class OrderReturnDetailComponent implements OnInit {
  icons = {
    ArrowLeft, CheckCircle2, XCircle, Clock, X, Package, RefreshCw,
    CornerDownLeft, Eye, Printer, Phone, MapPin, Truck, DollarSign,
    ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle,
    ChevronRight, ExternalLink, MessageSquare, Send, Check, UserCheck, ChevronDown, UserPlus,
    Navigation, Compass, Sparkles, Layers, ShieldAlert
  };

  returnReq: ReturnRequest | null = null;
  requestId: string = '';

  // Modals
  showRejectModal: boolean = false;
  rejectReason: string = '';
  rejectNote: string = '';

  // Lightbox Proof Image
  showLightbox: boolean = false;
  activeLightboxImg: string = '';

  // Internal Note
  newInternalNote: string = '';

  // Assignee Management
  showAssigneeDropdown: boolean = false;
  readonly staffList = [
    { name: 'CSKH Kim Ngân', role: 'Chuyên viên CSKH', avatar: 'KN', dept: 'Bộ phận CSKH' },
    { name: 'CSKH Minh Phúc', role: 'Chuyên viên CSKH', avatar: 'MP', dept: 'Bộ phận CSKH' },
    { name: 'Kỹ thuật viên Trịnh Văn Bách', role: 'Thẩm định viên QC', avatar: 'VB', dept: 'Kỹ thuật & Thẩm định' },
    { name: 'Thủ kho Hoàng Sơn', role: 'Thủ kho & Điều phối', avatar: 'HS', dept: 'Kho vận DCOR' },
    { name: 'Kế toán Bích Ngọc', role: 'Kế toán thanh toán', avatar: 'BN', dept: 'Tài chính - Kế toán' },
    { name: 'Chưa phân công', role: 'Chờ chỉ định', avatar: '?', dept: 'Hệ thống' }
  ];

  // Options for Dispatching (Khối Chuẩn bị Thu hồi)
  readonly driverOptions = [
    { name: 'Nguyễn Văn Cường', phone: '0909 333 444', defaultPlate: '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)' },
    { name: 'Đỗ Văn Thành', phone: '0918 222 333', defaultPlate: '51C-645.18 (Xe tải 2.5 tấn thùng kín)' },
    { name: 'Lê Văn Hiền', phone: '0908 555 777', defaultPlate: '51D-901.22 (Xe tải 1.5 tấn tiêu chuẩn)' },
    { name: 'Trần Đình Trọng', phone: '0933 666 888', defaultPlate: '51D-456.78 (Xe tải 2.0 tấn mui bạt)' }
  ];

  readonly teamOptions = [
    'Đội bốc xếp 1 (2 thợ khiêng lầu / thang máy)',
    'Đội bốc xếp 2 (2 thợ tháo dỡ nội thất gỗ cồng kềnh)',
    'Đội phản ứng nhanh DCOR Express (Tài xế + 1 Phụ xe)',
    'Đội bốc xếp kho trung tâm (Hỗ trợ xe nâng hàng)'
  ];

  readonly scheduleOptions = [
    'Hôm nay, 14:00 - 16:00',
    'Hôm nay, 16:30 - 18:30',
    'Sáng mai, 08:30 - 11:30',
    'Chiều mai, 14:00 - 17:00'
  ];

  // Form fields for Pickup Dispatch
  dispatchDriverName: string = 'Nguyễn Văn Cường';
  dispatchDriverPhone: string = '0909 333 444';
  dispatchVehiclePlate: string = '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)';
  dispatchMovingTeam: string = 'Đội bốc xếp 1 (2 thợ khiêng lầu / thang máy)';
  dispatchSchedule: string = 'Hôm nay, 14:00 - 16:00';
  dispatchNote: string = 'Chuẩn bị màng PE 3 lớp bọc chống xước và đồ nghề tháo dỡ chuyên dụng';

  // Toast Notification
  toastTitle: string = '';
  toastMessage: string = '';
  toastType: 'success' | 'info' | 'error' = 'success';
  showToast: boolean = false;
  private toastTimer: any = null;

  readonly rejectReasonOptions = [
    'Quá thời hạn quy định 72 giờ của chính sách DCOR',
    'Sản phẩm bị lỗi hư hỏng do phía khách hàng tự ý tháo lắp/va đập',
    'Tem phụ kiện hoặc mã seri không trùng khớp với đơn hàng gốc',
    'Sản phẩm đã qua sử dụng và không giữ nguyên hiện trạng',
    'Khách hàng không cung cấp được video/hình ảnh khui kiện hàng ban đầu',
    'Lý do khác'
  ];

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.assignee-dropdown-container') && !target.closest('.assignee-badge-selector')) {
      this.showAssigneeDropdown = false;
    }
  }

  get currentStaff() {
    return this.staffList.find(s => s.name === this.returnReq?.assignee) || {
      name: this.returnReq?.assignee || 'Chưa phân công',
      role: 'Chuyên viên phụ trách',
      avatar: (this.returnReq?.assignee || '?').substring(0, 2).toUpperCase(),
      dept: 'DCOR Studio'
    };
  }

  toggleAssigneeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showAssigneeDropdown = !this.showAssigneeDropdown;
  }

  changeAssignee(newAssigneeName: string): void {
    if (!this.returnReq || this.returnReq.assignee === newAssigneeName) {
      this.showAssigneeDropdown = false;
      return;
    }
    const updated = this.returnsService.updateAssignee(this.returnReq.id, newAssigneeName, 'Quản trị viên');
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
      this.showAssigneeDropdown = false;
      this.triggerToast('Phân công thành công', `Hồ sơ đã được bàn giao cho: ${newAssigneeName}`, 'success');
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public returnsService: OrdersReturnsMockService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.requestId = id;
        this.loadDetail();
      }
    });
  }

  loadDetail(): void {
    const found = this.returnsService.getById(this.requestId);
    if (found) {
      this.returnReq = JSON.parse(JSON.stringify(found));
      this.syncDispatchFormFromData();
    } else {
      this.returnReq = null;
    }
  }

  private syncDispatchFormFromData(): void {
    if (!this.returnReq) return;
    if (this.returnReq.pickupInfo) {
      this.dispatchDriverName = this.returnReq.pickupInfo.driverName || 'Nguyễn Văn Cường';
      this.dispatchDriverPhone = this.returnReq.pickupInfo.driverPhone || '0909 333 444';
      this.dispatchVehiclePlate = this.returnReq.pickupInfo.vehiclePlate || '51D-892.45 (Xe tải 1.9 tấn có bửng nâng)';
      this.dispatchMovingTeam = this.returnReq.pickupInfo.movingTeam || 'Đội bốc xếp 1 (2 thợ khiêng lầu / thang máy)';
      this.dispatchSchedule = this.returnReq.pickupInfo.estimatedTime || 'Hôm nay, 14:00 - 16:00';
      this.dispatchNote = this.returnReq.pickupInfo.dispatchNote || 'Chuẩn bị màng PE 3 lớp bọc chống xước và đồ nghề tháo dỡ chuyên dụng';
    }
  }

  onDriverChange(driverName: string): void {
    const matched = this.driverOptions.find(d => d.name === driverName);
    if (matched) {
      this.dispatchDriverPhone = matched.phone;
      this.dispatchVehiclePlate = matched.defaultPlate;
    }
  }

  saveDispatchDetails(): void {
    if (!this.returnReq) return;
    const patch: Partial<ReturnPickupDispatch> = {
      driverName: this.dispatchDriverName,
      driverPhone: this.dispatchDriverPhone,
      vehiclePlate: this.dispatchVehiclePlate,
      movingTeam: this.dispatchMovingTeam,
      estimatedTime: this.dispatchSchedule,
      dispatchNote: this.dispatchNote
    };
    const updated = this.returnsService.updatePickupDispatch(this.returnReq.id, patch);
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/orders/returns']);
  }

  getStatusMeta() {
    if (!this.returnReq) {
      return {
        labelAdmin: 'Không xác định',
        labelUser: 'Không xác định',
        bg: '#F3F4F6',
        color: '#4B5563',
        border: '#E5E7EB',
        badgeDot: '#9CA3AF'
      };
    }
    return this.returnsService.getStatusMeta(this.returnReq.status, this.returnReq.type);
  }

  // 6-Step Pipeline Configuration theo đúng nghiệp vụ
  readonly WORKFLOW_STEPS = [
    { index: 0, key: 'PENDING', label: 'Xử lý yêu cầu', sub: 'Chờ duyệt đổi trả' },
    { index: 1, key: 'APPROVED', label: 'Chuẩn bị thu hồi', sub: 'Phân công đội xe' },
    { index: 2, key: 'RETURNING', label: 'Đang thu hồi', sub: 'Lộ trình xe (Map)' },
    { index: 3, key: 'RECEIVED', label: 'Đã nhận hàng', sub: 'Kiểm định QC kho' },
    { index: 4, key: 'SOLUTION', label: 'Đổi hàng / Hoàn tiền', sub: 'Tự tạo đơn mới / Hoàn tiền' },
    { index: 5, key: 'COMPLETED', label: 'Hoàn tất', sub: 'Đóng hồ sơ' }
  ];

  viewingStepIndex: number | null = null;

  get currentStepIndex(): number {
    if (!this.returnReq) return 0;
    switch (this.returnReq.status) {
      case 'PENDING':
      case 'REVIEWING':
        return 0;
      case 'APPROVED':
        return 1;
      case 'RETURNING':
        return 2;
      case 'RECEIVED':
        return 3;
      case 'EXCHANGING':
      case 'REFUNDING':
        return 4;
      case 'COMPLETED':
        return 5;
      case 'REJECTED':
        return -1;
      default:
        return 0;
    }
  }

  get activeViewingStep(): number {
    return this.viewingStepIndex !== null ? this.viewingStepIndex : this.currentStepIndex;
  }

  onStepClick(stepIdx: number): void {
    if (this.returnReq?.status === 'REJECTED') return;
    if (stepIdx <= this.currentStepIndex || this.returnReq?.status === 'COMPLETED') {
      this.viewingStepIndex = stepIdx;
      const cardId = 'step-block-' + stepIdx;
      const el = document.getElementById(cardId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  isStepDone(stepIdx: number): boolean {
    if (!this.returnReq || this.returnReq.status === 'REJECTED') return false;
    return this.currentStepIndex > stepIdx || this.returnReq.status === 'COMPLETED';
  }

  isStepActive(stepIdx: number): boolean {
    if (!this.returnReq || this.returnReq.status === 'REJECTED') return false;
    if (this.returnReq.status === 'COMPLETED') return stepIdx === 5;
    return this.currentStepIndex === stepIdx;
  }

  isStepViewing(stepIdx: number): boolean {
    return this.activeViewingStep === stepIdx;
  }

  isLineDone(stepIdx: number): boolean {
    if (!this.returnReq || this.returnReq.status === 'REJECTED') return false;
    return this.currentStepIndex > stepIdx;
  }

  // Workflow State Advancement
  advanceStatus(newStatus: ReturnStatus, desc: string, actor: string = 'CSKH'): void {
    if (!this.returnReq) return;
    this.viewingStepIndex = null;
    const updated = this.returnsService.updateStatus(this.returnReq.id, newStatus, desc, actor);
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
      this.syncDispatchFormFromData();
      const meta = this.getStatusMeta();
      this.triggerToast('Cập nhật trạng thái thành công', `Hồ sơ đã chuyển sang: ${meta.labelAdmin}`, 'success');

      // Cuộn mượt mà đến khối mới
      setTimeout(() => {
        const targetCard = document.getElementById('step-block-' + this.currentStepIndex);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);
    }
  }

  // Workflow Action Handlers
  confirmApproval(): void {
    this.advanceStatus('APPROVED', 'CSKH chấp thuận yêu cầu đổi/trả. Chuyển sang khâu Chuẩn bị Thu hồi để phân công đội xe.', 'CSKH DCOR');
  }

  confirmDispatchAndStartReturning(): void {
    this.saveDispatchDetails();
    this.advanceStatus(
      'RETURNING', 
      `Xác nhận điều phối xe tải ${this.dispatchVehiclePlate}. Tài xế ${this.dispatchDriverName} cùng ${this.dispatchMovingTeam} bắt đầu hành trình thu hồi kiện hàng tận nhà khách.`,
      'Điều phối Kho'
    );
  }

  confirmReceivedAtWarehouse(): void {
    this.advanceStatus(
      'RECEIVED', 
      'Tài xế đã bàn giao kiện hàng về Trung tâm phân phối DCOR Bình Tân. Bắt đầu quy trình kiểm định chất lượng QC.', 
      'Thủ kho Hoàng Sơn'
    );
  }

  confirmQcAndProceed(): void {
    if (!this.returnReq) return;
    if (this.returnReq.type === 'EXCHANGE') {
      // Tự động kích hoạt đơn hàng đổi mới
      this.advanceStatus(
        'EXCHANGING', 
        'Kiểm định QC kho hoàn tất. Hệ thống tự động kích hoạt đơn hàng mới và chuyển bộ phận kho chuẩn bị xuất kho sản phẩm thay thế.', 
        'Thủ kho & QC'
      );
    } else {
      // Chuyển sang hoàn tiền
      this.advanceStatus(
        'REFUNDING', 
        'Kiểm định QC kho hoàn tất. Lập lệnh chuyển khoản hoàn tiền cho khách hàng.', 
        'Kế toán Bích Ngọc'
      );
    }
  }

  confirmExchangeDelivery(): void {
    const orderNum = this.returnReq?.replacementOrder?.orderNumber || 'đổi mới';
    this.advanceStatus(
      'COMPLETED', 
      `Đã giao thành công sản phẩm mới theo đơn hàng #${orderNum} cho khách hàng. Đóng hồ sơ đổi hàng thành công.`, 
      'DCOR Express'
    );
  }

  confirmRefundTransfer(): void {
    const amountStr = this.formatVND(this.returnReq?.refundInfo?.refundAmount || 0);
    this.advanceStatus(
      'COMPLETED', 
      `Kế toán xác nhận đã chuyển khoản thành công ${amountStr} đến tài khoản khách hàng. Đóng hồ sơ trả hàng hoàn tiền.`, 
      'Kế toán trưởng'
    );
  }

  // Set Current Map Leg for simulation
  setTrackingLeg(leg: 1 | 2 | 3 | 4): void {
    if (!this.returnReq || !this.returnReq.pickupInfo) return;
    this.returnReq.pickupInfo.currentLeg = leg;
    if (leg === 1) {
      this.returnReq.pickupInfo.currentLocation = 'Kho trung tâm DCOR (Bình Tân) - Xuất phát';
    } else if (leg === 2) {
      this.returnReq.pickupInfo.currentLocation = 'Đường Nguyễn Hữu Thọ, P. Tân Hưng, Quận 7 (Đang đến nhà khách)';
    } else if (leg === 3) {
      this.returnReq.pickupInfo.currentLocation = 'Cầu Ánh Sao / Phú Mỹ (Đang chở kiện hàng về kho)';
    } else if (leg === 4) {
      this.returnReq.pickupInfo.currentLocation = 'Trung tâm phân phối & QC DCOR Bình Tân (Đã tới kho)';
    }
    const orig = this.returnsService.getById(this.returnReq.id);
    if (orig && orig.pickupInfo) {
      orig.pickupInfo.currentLeg = leg;
      orig.pickupInfo.currentLocation = this.returnReq.pickupInfo.currentLocation;
    }
  }

  // Rejection handling
  openRejectModal(): void {
    this.rejectReason = this.rejectReasonOptions[0];
    this.rejectNote = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
  }

  confirmReject(): void {
    if (!this.returnReq) return;
    const reasonText = this.rejectReason + (this.rejectNote ? ` - Ghi chú: ${this.rejectNote}` : '');
    const updated = this.returnsService.updateStatus(
      this.returnReq.id, 
      'REJECTED', 
      `Từ chối yêu cầu. Lý do: ${reasonText}`, 
      'CSKH DCOR'
    );
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
      this.closeRejectModal();
      this.triggerToast('Đã từ chối yêu cầu', 'Hồ sơ đã được đánh dấu REJECTED và thông báo tới khách.', 'info');
    }
  }

  // QC Checklist interaction
  toggleQcField(field: 'surfaceChecked' | 'structureChecked' | 'cushionLeatherChecked' | 'accessoriesChecked'): void {
    if (!this.returnReq || !this.returnReq.qcReport) return;
    this.returnReq.qcReport[field] = !this.returnReq.qcReport[field];
    // Sync with memory
    const original = this.returnsService.getById(this.returnReq.id);
    if (original && original.qcReport) {
      original.qcReport[field] = this.returnReq.qcReport[field];
    }
    this.triggerToast('Lưu biên bản kiểm định', 'Đã cập nhật trạng thái hạng mục QC kiểm tra.', 'info');
  }

  isQcAllPassed(): boolean {
    if (!this.returnReq?.qcReport) return false;
    const qc = this.returnReq.qcReport;
    return !!(qc.surfaceChecked && qc.structureChecked && qc.cushionLeatherChecked && qc.accessoriesChecked);
  }

  // Add Internal Note to Timeline
  submitInternalNote(): void {
    if (!this.returnReq || !this.newInternalNote.trim()) return;
    const noteText = this.newInternalNote.trim();
    const nowStr = new Date().toLocaleDateString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const newEvent = {
      time: nowStr,
      status: this.returnReq.status,
      actor: 'Quản trị viên',
      desc: `[Ghi chú nội bộ] ${noteText}`
    };

    this.returnReq.timeline.unshift(newEvent);
    const original = this.returnsService.getById(this.returnReq.id);
    if (original) {
      original.timeline.unshift(newEvent);
    }

    this.newInternalNote = '';
    this.triggerToast('Đã thêm ghi chú', 'Nội dung ghi chú đã được lưu vào nhật ký xử lý.', 'success');
  }

  // Lightbox Image
  openLightbox(url: string): void {
    this.activeLightboxImg = url;
    this.showLightbox = true;
  }

  closeLightbox(): void {
    this.showLightbox = false;
    this.activeLightboxImg = '';
  }

  // Printing
  handlePrint(): void {
    window.print();
  }

  // Toast
  triggerToast(title: string, message: string, type: 'success' | 'info' | 'error' = 'success'): void {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 3500);
  }

  closeToast(): void {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // Formatters
  formatVND(num: number): string {
    return this.returnsService.formatVND(num);
  }
}
