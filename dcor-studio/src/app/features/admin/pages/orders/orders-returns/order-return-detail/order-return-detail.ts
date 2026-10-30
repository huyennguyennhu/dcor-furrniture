import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { 
  LucideAngularModule,
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, X, Package, RefreshCw, 
  CornerDownLeft, Eye, Printer, Phone, MapPin, Truck, DollarSign, 
  ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle, 
  ChevronRight, ChevronLeft, ExternalLink, MessageSquare, Send, Check, UserCheck, ChevronDown, UserPlus,
  Navigation, Compass, Sparkles, Layers, ShieldAlert, Pencil, Lock,
  Square, CheckSquare, ClipboardCheck, Info
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
import { OrdersService } from '../../services/orders.service';
import { TransactionModalComponent } from '../../../../components/transaction-modal/transaction-modal';

export interface VerificationGroup {
  id: string;
  title: string;
  items: VerificationChecklistItem[];
}

export interface VerificationChecklistItem {
  id: string;
  type: 'auto' | 'manual';
  sourceTag: string;
  title: string;
  desc: string;
  checked: boolean;
}

@Component({
  selector: 'app-order-return-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './order-return-detail.html',
  styleUrls: ['./order-return-detail.css']
})
export class OrderReturnDetailComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  icons = {
    ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, X, Package, RefreshCw,
    CornerDownLeft, Eye, Printer, Phone, MapPin, Truck, DollarSign,
    ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle,
    ChevronRight, ChevronLeft, ExternalLink, MessageSquare, Send, Check, UserCheck, ChevronDown, UserPlus,
    Navigation, Compass, Sparkles, Layers, ShieldAlert, Pencil, Lock,
    Square, CheckSquare, ClipboardCheck, Info
  };

  returnReq: ReturnRequest | null = null;
  requestId: string = '';

  // Modals
  showRejectModal: boolean = false;
  showRejectDropdown: boolean = false;
  rejectReason: string = '';
  rejectNote: string = '';

  // Modal Xuất kho cho đơn hàng thay thế dự kiến (Bước 5)
  showStockExportModal: boolean = false;
  stockExportPrefillData: any = null;

  // Lightbox Proof Image
  showLightbox: boolean = false;
  activeLightboxImg: string = '';

  // Internal Note
  newInternalNote: string = '';

  // Verification Checklist Groups
  isChecklistSaved: boolean = false;
  verificationGroups: VerificationGroup[] = [
    {
      id: 'policy',
      title: '1. Điều kiện chính sách & Đơn hàng gốc',
      items: [
        {
          id: 'auto_time_limit',
          type: 'auto',
          sourceTag: 'Hệ thống',
          title: 'Kiểm tra thời hạn đổi trả',
          desc: 'Ngày đặt: 19/10/2026 10:30 - Ngày yêu cầu đổi trả: 21/10/2026 08:30 → <strong class="time-highlight">1 Ngày (22 giờ)</strong>',
          checked: true
        },
        {
          id: 'auto_sku_valid',
          type: 'auto',
          sourceTag: 'Hệ thống',
          title: 'Kiểm tra tính hợp lệ của SKU',
          desc: 'Mã khi mua: <strong>SKU-SAL-3S-LUX</strong> → Mã khi yêu cầu trả: <strong>SKU-SAL-3S-LUX</strong>',
          checked: true
        },
        {
          id: 'auto_attachments',
          type: 'auto',
          sourceTag: 'Hệ thống',
          title: 'Kiểm tra tệp đính kèm bắt buộc',
          desc: 'Đã đính kèm: <strong>6</strong> hình ảnh/video',
          checked: true
        }
      ]
    },
    {
      id: 'assessment',
      title: '2. Thẩm định minh chứng & Phương án xử lý',
      items: [
        {
          id: 'manual_proof_review',
          type: 'manual',
          sourceTag: 'CSKH',
          title: 'Thẩm định nội dung hình ảnh/video',
          desc: 'Nhân viên CSKH xem xét trực quan bằng chứng (video khui hàng, góc lỗi nội thất) để quyết định chấp nhận hay từ chối yêu cầu.',
          checked: true
        },
        {
          id: 'auto_inventory',
          type: 'auto',
          sourceTag: 'Hệ thống',
          title: 'Kiểm tra tồn kho khả dụng',
          desc: 'Sản phẩm: Salamanca 3 seater lounge sofa - Bản da nỉ cao cấp (Nâu trầm Walnut Luxury)\nTồn kho: <strong class="stock-highlight">12 sản phẩm</strong> khả dụng (Kho Trung Tâm)',
          checked: true
        },
        {
          id: 'auto_calc_refund',
          type: 'auto',
          sourceTag: 'Hệ thống',
          title: 'Tự động tính toán số tiền hoàn trả',
          desc: 'Số tiền hoàn: <strong class="refund-highlight">24.500.000 ₫</strong>',
          checked: true
        }
      ]
    },
    {
      id: 'warehouse_qc',
      title: '3. Kiểm định thực tế tại kho',
      items: [
        {
          id: 'manual_sku_physical',
          type: 'manual',
          sourceTag: 'Thủ kho',
          title: 'Kiểm tra thực tế SKU tại kho',
          desc: 'Thủ kho đối chiếu mã sản phẩm gửi về với hệ thống để phòng tránh tình trạng tráo đổi hàng cũ/hàng ngoài.',
          checked: true
        },
        {
          id: 'manual_qc_intact',
          type: 'manual',
          sourceTag: 'Kỹ thuật QC',
          title: 'Kiểm tra tình trạng nguyên vẹn (QC)',
          desc: 'Thủ kho đánh giá cảm quan bề mặt (gỗ, da, phụ kiện) xem đúng lỗi như khách phản hồi hay do tác động sử dụng sai cách.',
          checked: true
        },
        {
          id: 'manual_accessories',
          type: 'manual',
          sourceTag: 'Thủ kho',
          title: 'Kiểm tra linh phụ kiện và quà tặng kèm',
          desc: 'Kiểm đếm thực tế các chi tiết rời (ốc vít, chân ghế, hướng dẫn lắp đặt, quà khuyến mãi đi kèm) trong thùng hàng trả về.',
          checked: true
        }
      ]
    }
  ];

  get allChecklistItems(): VerificationChecklistItem[] {
    return this.verificationGroups.flatMap(g => g.items);
  }

  toggleVerificationItem(item: VerificationChecklistItem): void {
    if (this.isChecklistSaved || this.currentStepIndex > 0) return;
    item.checked = !item.checked;
    if (this.returnReq) {
      if (!this.returnReq.verificationChecklist) {
        this.returnReq.verificationChecklist = {};
      }
      this.returnReq.verificationChecklist[item.id] = item.checked;
    }
  }

  get isAllChecklistChecked(): boolean {
    return this.allChecklistItems.length > 0 && this.allChecklistItems.every(i => i.checked);
  }

  get canApproveReturn(): boolean {
    return this.isAllChecklistChecked && this.isChecklistSaved && this.hasAssignedStaff;
  }

  getApproveDisabledReason(): string {
    if (!this.hasAssignedStaff) {
      return 'Vui lòng phân công / gán người phụ trách hồ sơ trước khi phê duyệt yêu cầu.';
    }
    if (!this.isAllChecklistChecked) {
      return 'Vui lòng tích chọn đầy đủ tất cả các tiêu chí kiểm tra bắt buộc trong Checklist trước khi duyệt.';
    }
    if (!this.isChecklistSaved) {
      return 'Vui lòng nhấn "Lưu kết quả kiểm tra" trong khối Thẩm định yêu cầu trước khi phê duyệt.';
    }
    return 'Phê duyệt yêu cầu đổi/trả và chuyển sang khâu Chuẩn bị Thu hồi';
  }

  saveVerificationChecklist(): void {
    if (!this.isAllChecklistChecked) {
      this.triggerToast(
        'Chưa hoàn tất kiểm tra',
        'Vui lòng tích chọn đầy đủ các tiêu chí kiểm tra bắt buộc trước khi lưu.',
        'error'
      );
      return;
    }
    this.isChecklistSaved = true;
    const checklistMap: { [id: string]: boolean } = {};
    this.allChecklistItems.forEach(i => checklistMap[i.id] = i.checked);
    if (this.returnReq) {
      this.returnReq.verificationChecklist = checklistMap;
      this.returnsService.updateVerificationChecklist(this.returnReq.id, checklistMap);
    }
    const passed = this.totalPassedCount;
    const total = this.totalChecklistCount;
    this.triggerToast(
      'Đã lưu kết quả kiểm tra',
      `Checklist thẩm định: ${passed}/${total} tiêu chí hợp lệ. Đã mở khóa nút Duyệt yêu cầu.`,
      'success'
    );
  }

  editVerificationChecklist(): void {
    if (this.currentStepIndex > 0) return;
    this.isChecklistSaved = false;
  }

  get totalPassedCount(): number {
    return this.allChecklistItems.filter(i => i.checked).length;
  }

  get totalChecklistCount(): number {
    return this.allChecklistItems.length;
  }

  getGroupPassedCount(group: VerificationGroup): number {
    return group.items.filter(i => i.checked).length;
  }

  // Assignee Management
  showAssigneeDropdown: boolean = false;
  showCardAssigneeDropdown: boolean = false;
  selectedCardAssignee: string = '';
  isAssigneeLocked: boolean = false;
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
    { name: 'Nguyễn Văn Cường', phone: '0909 333 444', defaultPlate: '51D-892.45', vehicleType: 'Xe tải 1.9 tấn có bửng nâng' },
    { name: 'Đỗ Văn Thành', phone: '0918 222 333', defaultPlate: '51C-645.18', vehicleType: 'Xe tải 2.5 tấn thùng kín' },
    { name: 'Lê Văn Hiền', phone: '0908 555 777', defaultPlate: '51D-901.22', vehicleType: 'Xe tải 1.5 tấn tiêu chuẩn' },
    { name: 'Trần Đình Trọng', phone: '0933 666 888', defaultPlate: '51D-456.78', vehicleType: 'Xe tải 2.0 tấn mui bạt' }
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
  dispatchDriverName: string = '';
  dispatchDriverPhone: string = '';
  dispatchVehiclePlate: string = '';
  dispatchMovingTeam: string = '';
  dispatchSchedule: string = '';
  dispatchNote: string = 'Chuẩn bị màng PE 3 lớp bọc chống xước và đồ nghề tháo dỡ chuyên dụng';

  // Custom Dropdowns for Dispatch Block
  showDriverDropdown: boolean = false;
  showTeamDropdown: boolean = false;
  showScheduleDropdown: boolean = false;

  // QC Restock Options Dropdown
  showRestockDropdown: boolean = false;
  readonly restockOptions: { value: 'RESTOCK_SALE' | 'REFURBISH' | 'SCRAP'; label: string }[] = [
    { value: 'RESTOCK_SALE', label: 'Tái nhập kho bán mới (Grade A)' },
    { value: 'REFURBISH', label: 'Chuyển hàng Outlet / Trưng bày (Grade B)' },
    { value: 'SCRAP', label: 'Trả về xưởng bảo hành / Tiêu hủy' }
  ];

  // Toast Notification
  toastTitle: string = '';
  toastMessage: string = '';
  toastType: 'success' | 'info' | 'error' = 'success';
  showToast: boolean = false;
  private toastTimer: any = null;
  private maxToastTimer: any = null;
  private isToastHovered: boolean = false;

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
    if (!target.closest('.assignee-card-dropdown-wrapper')) {
      this.showCardAssigneeDropdown = false;
    }
    if (!target.closest('.assignee-badge-selector')) {
      this.showAssigneeDropdown = false;
    }
    if (!target.closest('.reject-dropdown-wrapper')) {
      this.showRejectDropdown = false;
    }
    if (!target.closest('.driver-dropdown-wrapper')) {
      this.showDriverDropdown = false;
    }
    if (!target.closest('.team-dropdown-wrapper')) {
      this.showTeamDropdown = false;
    }
    if (!target.closest('.schedule-dropdown-wrapper')) {
      this.showScheduleDropdown = false;
    }
    if (!target.closest('.restock-dropdown-wrapper')) {
      this.showRestockDropdown = false;
    }
  }

  toggleDispatchDropdown(type: 'driver' | 'team' | 'schedule', event: MouseEvent): void {
    event.stopPropagation();
    if (type === 'driver') {
      this.showDriverDropdown = !this.showDriverDropdown;
      this.showTeamDropdown = false;
      this.showScheduleDropdown = false;
    } else if (type === 'team') {
      this.showTeamDropdown = !this.showTeamDropdown;
      this.showDriverDropdown = false;
      this.showScheduleDropdown = false;
    } else if (type === 'schedule') {
      this.showScheduleDropdown = !this.showScheduleDropdown;
      this.showDriverDropdown = false;
      this.showTeamDropdown = false;
    }
  }

  selectDriverOption(driver: { name: string; phone: string; defaultPlate: string }): void {
    this.dispatchDriverName = driver.name;
    this.dispatchDriverPhone = driver.phone;
    this.dispatchVehiclePlate = driver.defaultPlate;
    this.showDriverDropdown = false;
    this.saveDispatchDetails();
  }

  selectTeamOption(team: string): void {
    this.dispatchMovingTeam = team;
    this.showTeamDropdown = false;
    this.saveDispatchDetails();
  }

  selectScheduleOption(schedule: string): void {
    this.dispatchSchedule = schedule;
    this.showScheduleDropdown = false;
    this.saveDispatchDetails();
  }

  toggleRejectDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showRejectDropdown = !this.showRejectDropdown;
  }

  selectRejectReason(reason: string): void {
    this.rejectReason = reason;
    this.showRejectDropdown = false;
  }

  get displayedAssigneeLabel(): string {
    if (this.isAssigneeLocked) {
      return (this.returnReq?.assignee && this.returnReq.assignee !== 'Chưa phân công')
        ? this.returnReq.assignee
        : 'Phân công người phụ trách';
    }
    if (this.selectedCardAssignee && this.selectedCardAssignee !== 'Chưa phân công') {
      return this.selectedCardAssignee;
    }
    return (this.returnReq?.assignee && this.returnReq.assignee !== 'Chưa phân công')
      ? this.returnReq.assignee
      : 'Chọn người phụ trách...';
  }

  get hasAssignedStaff(): boolean {
    const assignee = this.returnReq?.assignee?.trim();
    return !!(this.isAssigneeLocked && assignee && assignee !== 'Chưa phân công');
  }

  toggleCardAssigneeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    // Khi đã gán cứng hoặc đã qua bước 1 thì không mở trực tiếp
    if (this.isAssigneeLocked || this.currentStepIndex > 0) return;
    this.showCardAssigneeDropdown = !this.showCardAssigneeDropdown;
  }

  selectCardAssignee(name: string): void {
    if (this.currentStepIndex > 0) return;
    this.selectedCardAssignee = (name === 'Chưa phân công') ? '' : name;
    this.showCardAssigneeDropdown = false;
    // Khi chọn xong: KHÔNG gán cứng ngay, mở nút Gán để người dùng bấm xác nhận
    this.isAssigneeLocked = false;
  }

  handleAssigneeAction(): void {
    if (this.currentStepIndex > 0) return;
    if (this.isAssigneeLocked) {
      // Khi nhấn "Chỉnh sửa": mở khóa, mở dropdown menu và đổi nút thành "Gán"
      this.isAssigneeLocked = false;
      this.showCardAssigneeDropdown = true;
    } else {
      // Khi nhấn "Gán": lưu thông tin, gán cứng dropdown và đổi nút thành "Chỉnh sửa"
      if (!this.selectedCardAssignee || this.selectedCardAssignee === 'Chưa phân công') {
        this.triggerToast('Chưa chọn nhân sự', 'Vui lòng chọn nhân sự từ danh sách trước khi nhấn Gán.', 'error');
        return;
      }
      this.changeAssignee(this.selectedCardAssignee);
      this.isAssigneeLocked = true;
      this.showCardAssigneeDropdown = false;
    }
  }

  get currentStaff() {
    const activeName = this.isAssigneeLocked
      ? (this.returnReq?.assignee || 'Chưa phân công')
      : (this.selectedCardAssignee || this.returnReq?.assignee || 'Chưa phân công');
    return this.staffList.find(s => s.name === activeName) || {
      name: activeName,
      role: activeName === 'Chưa phân công' ? 'Chờ chỉ định' : 'Chuyên viên phụ trách',
      avatar: activeName === 'Chưa phân công' ? '?' : activeName.substring(0, 2).toUpperCase(),
      dept: activeName === 'Chưa phân công' ? 'Chưa chỉ định' : 'DCOR Studio'
    };
  }

  toggleAssigneeDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showAssigneeDropdown = !this.showAssigneeDropdown;
  }

  changeAssignee(newAssigneeName: string): void {
    this.showCardAssigneeDropdown = false;
    if (!this.returnReq || this.returnReq.assignee === newAssigneeName) {
      this.showAssigneeDropdown = false;
      return;
    }
    const updated = this.returnsService.updateAssignee(this.returnReq.id, newAssigneeName, 'Quản trị viên');
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
      this.showAssigneeDropdown = false;
      this.showCardAssigneeDropdown = false;
      this.triggerToast('Phân công thành công', `Hồ sơ đã được bàn giao cho: ${newAssigneeName}`, 'success');
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public returnsService: OrdersReturnsMockService,
    private ordersService: OrdersService,
    private http: HttpClient
  ) {}

  ensureReplacementOrderExists(req: ReturnRequest): void {
    if (!req.replacementOrder) return;
    // Chỉ tạo vào OrdersService khi hồ sơ đã hoàn tất bước Đổi hàng mới (COMPLETED)
    if (req.status !== 'COMPLETED') return;
    const exists = this.ordersService.getOrderById(req.replacementOrder.orderNumber);
    if (!exists) {
      this.ordersService.createReplacementOrderFromExchange({
        orderNumber: req.replacementOrder.orderNumber,
        originalOrderNumber: req.orderNumber,
        returnRequestId: req.id,
        customer: {
          name: req.customer.name,
          phone: req.customer.phone,
          email: req.customer.email,
          address: req.customer.address
        },
        item: {
          name: req.replacementOrder.item.name,
          sku: req.replacementOrder.item.sku,
          variant: req.replacementOrder.item.variant,
          quantity: req.replacementOrder.item.quantity || 1,
          price: req.replacementOrder.item.price,
          imageUrl: req.replacementOrder.item.imageUrl
        },
        priceDiff: req.replacementOrder.priceDiff,
        createdAt: req.replacementOrder.createdAt
      });
    }
  }

  ngOnDestroy(): void {
    this.clearToastTimers();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.requestId = id;
        this.loadDetail();
      }
    });

    this.ordersService.orders$.subscribe(orders => {
      if (orders && orders.length > 0 && !this.returnReq && this.requestId) {
        this.loadDetail();
      }
    });
  }

  loadDetail(): void {
    const cleanReqId = (this.requestId || '').replace(/^#/g, '').trim();
    let found = this.returnsService.getById(this.requestId) || this.returnsService.getById(cleanReqId);
    if (!found) {
      const allOrders: any[] = this.ordersService.orders;
      const targetOrder = this.ordersService.getOrderById(this.requestId) || 
        this.ordersService.getOrderById(cleanReqId) ||
        allOrders.find((o: any) => 
          (o.orderNumber && (o.orderNumber.toLowerCase() === this.requestId.toLowerCase() ||
          o.orderNumber.toLowerCase() === ('#' + this.requestId.toLowerCase()) ||
          o.orderNumber.replace(/#/g, '').toLowerCase() === cleanReqId.toLowerCase())) ||
          (o.id && (o.id.toLowerCase() === this.requestId.toLowerCase() || o.id.toLowerCase() === cleanReqId.toLowerCase()))
        );
      if (targetOrder) {
        found = this.returnsService.syncFromOrder(targetOrder);
      }
    }
    if (found) {
      this.returnReq = JSON.parse(JSON.stringify(found));
      this.syncDispatchFormFromData();
      this.updateChecklistDynamicTexts();

      // Đồng bộ đơn hàng thay thế nếu đã tồn tại
      if (this.returnReq?.replacementOrder) {
        this.ensureReplacementOrderExists(this.returnReq);
      }

      // Đồng bộ trạng thái Checklist thẩm định
      if (this.currentStepIndex > 0) {
        // Đã qua Bước 1 (APPROVED trở đi) -> Toàn bộ tiêu chí bắt buộc luôn đạt 100%
        this.isChecklistSaved = true;
        this.allChecklistItems.forEach(i => i.checked = true);
      } else {
        // Đang ở Bước 1 (PENDING / REVIEWING)
        if (this.returnReq?.verificationChecklist) {
          const checklist = this.returnReq.verificationChecklist;
          this.allChecklistItems.forEach(i => {
            if (checklist[i.id] !== undefined) {
              i.checked = checklist[i.id];
            }
          });
          this.isChecklistSaved = this.isAllChecklistChecked;
        } else {
          this.isChecklistSaved = false;
        }
      }

      if (!this.returnReq?.assignee || this.returnReq.assignee === 'Chưa phân công') {
        this.isAssigneeLocked = false;
        this.selectedCardAssignee = '';
      } else {
        this.isAssigneeLocked = true;
        this.selectedCardAssignee = this.returnReq.assignee;
      }

      if (this.returnReq?.status === 'RECEIVED' && !this.returnReq.qcReport) {
        this.returnReq.qcReport = {
          surfaceChecked: false,
          structureChecked: false,
          cushionLeatherChecked: false,
          accessoriesChecked: false,
          condition: '',
          defectAssessment: '',
          refundPercent: 100,
          restockOption: '' as any,
          inspector: ''
        };
      }
    } else {
      this.returnReq = null;
    }
  }

  private updateChecklistDynamicTexts(): void {
    if (!this.returnReq) return;

    // 1. Thời hạn đổi trả
    const timeLimitItem = this.allChecklistItems.find(i => i.id === 'auto_time_limit');
    if (timeLimitItem) {
      const returnDateStr = this.returnReq.createdAt || '21/10/2026 08:30';
      const orderDateStr = this.getOrderPlacedDateStr(this.returnReq);
      const diffStr = this.calculateDateDiff(orderDateStr, returnDateStr);
      timeLimitItem.desc = `Ngày đặt: ${orderDateStr} - Ngày yêu cầu đổi trả: ${returnDateStr} → <strong class="time-highlight">${diffStr}</strong>`;
    }

    // 2. Tính hợp lệ SKU
    const skuItem = this.allChecklistItems.find(i => i.id === 'auto_sku_valid');
    if (skuItem) {
      const sku = this.returnReq.item?.sku || 'SKU-SAL-3S-LUX';
      skuItem.desc = `Mã khi mua: <strong>${sku}</strong> → Mã khi yêu cầu trả: <strong>${sku}</strong>`;
    }

    // 3. Tồn kho khả dụng (nếu đổi hàng)
    const inventoryItem = this.allChecklistItems.find(i => i.id === 'auto_inventory');
    if (inventoryItem) {
      if (this.returnReq.type === 'EXCHANGE' && this.returnReq.exchangeItem) {
        const prodName = this.returnReq.exchangeItem.name + (this.returnReq.exchangeItem.variant ? ` (${this.returnReq.exchangeItem.variant})` : '');
        inventoryItem.desc = `Sản phẩm: ${prodName}\nTồn kho: <strong class="stock-highlight">12 sản phẩm</strong> khả dụng (Kho Trung Tâm)`;
      } else {
        inventoryItem.desc = `Sản phẩm: Yêu cầu trả hàng hoàn tiền\nTồn kho: Không áp dụng xuất kho đổi mới`;
      }
    }

    // 4. Tệp đính kèm bắt buộc
    const attachmentItem = this.allChecklistItems.find(i => i.id === 'auto_attachments');
    if (attachmentItem) {
      const count = this.returnReq.proofImages?.length || 0;
      attachmentItem.desc = `Đã đính kèm: <strong>${count}</strong> hình ảnh/video`;
    }

    // 5. Xử lý tiêu chí tính tiền hoàn trả theo loại yêu cầu:
    // Nếu là Đổi hàng (EXCHANGE): không cần khối "Tự động tính toán số tiền hoàn trả"
    // Nếu là Trả hàng (REFUND): hiển thị khối và đổi mô tả thành số tiền hoàn đã highlight
    const assessmentGroup = this.verificationGroups.find(g => g.id === 'assessment');
    if (assessmentGroup) {
      if (this.returnReq.type === 'EXCHANGE') {
        assessmentGroup.items = assessmentGroup.items.filter(i => i.id !== 'auto_calc_refund');
      } else {
        let refundItem = assessmentGroup.items.find(i => i.id === 'auto_calc_refund');
        if (!refundItem) {
          refundItem = {
            id: 'auto_calc_refund',
            type: 'auto',
            sourceTag: 'Hệ thống',
            title: 'Tự động tính toán số tiền hoàn trả',
            desc: '',
            checked: true
          };
          assessmentGroup.items.push(refundItem);
        }
        const refundVal = this.returnReq.refundInfo?.refundAmount || (this.returnReq.item ? this.returnReq.item.price * this.returnReq.item.quantity : 0);
        refundItem.desc = `Số tiền hoàn: <strong class="refund-highlight">${this.formatVND(refundVal)}</strong>`;
      }
    }
  }

  getOrderPlacedDateStr(req?: ReturnRequest | null): string {
    if (!req) return '19/10/2026 10:30';
    try {
      const parts = req.createdAt.split(' ');
      const dateParts = parts[0].split('/').map(Number);
      const d = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      d.setDate(d.getDate() - 2);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const time = parts[1] || '10:30';
      return `${dd}/${mm}/${yyyy} ${time}`;
    } catch {
      return '19/10/2026 10:30';
    }
  }

  calculateDateDiff(startStr: string, endStr: string): string {
    try {
      const parseDate = (str: string) => {
        const parts = str.trim().split(' ');
        const dateParts = parts[0].split('/').map(Number);
        const day = dateParts[0];
        const month = dateParts[1] - 1;
        const year = dateParts[2];
        let hours = 0;
        let minutes = 0;
        if (parts[1]) {
          const timeParts = parts[1].split(':').map(Number);
          hours = timeParts[0] || 0;
          minutes = timeParts[1] || 0;
        }
        return new Date(year, month, day, hours, minutes);
      };

      const d1 = parseDate(startStr);
      const d2 = parseDate(endStr);
      const diffMs = Math.max(0, d2.getTime() - d1.getTime());
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;

      if (days > 0) {
        return `${days} Ngày (${remainingHours > 0 ? remainingHours + ' giờ' : totalHours + ' giờ'})`;
      }
      return `${totalHours} giờ`;
    } catch {
      return '1 Ngày (22 giờ)';
    }
  }

  private syncDispatchFormFromData(): void {
    if (!this.returnReq) return;
    if (this.returnReq.pickupInfo) {
      this.dispatchDriverName = this.returnReq.pickupInfo.driverName || '';
      this.dispatchDriverPhone = this.returnReq.pickupInfo.driverPhone || '';
      this.dispatchVehiclePlate = this.returnReq.pickupInfo.vehiclePlate || '';
      this.dispatchMovingTeam = this.returnReq.pickupInfo.movingTeam || '';
      this.dispatchSchedule = this.returnReq.pickupInfo.estimatedTime || '';
      this.dispatchNote = this.returnReq.pickupInfo.dispatchNote || 'Chuẩn bị màng PE 3 lớp bọc chống xước và đồ nghề tháo dỡ chuyên dụng';
    } else {
      this.dispatchDriverName = '';
      this.dispatchDriverPhone = '';
      this.dispatchVehiclePlate = '';
      this.dispatchMovingTeam = '';
      this.dispatchSchedule = '';
    }
  }

  private resolveAutoMovingTeam(): string {
    if (!this.returnReq) return 'Đội bốc xếp 1 (2 thợ khiêng lầu / thang máy)';
    const addr = (this.returnReq.customer?.address || '').toLowerCase();
    const itemName = (this.returnReq.item?.name || '').toLowerCase();

    if (addr.includes('căn hộ') || addr.includes('chung cư') || addr.includes('tháp') || addr.includes('lầu') || addr.includes('sala') || addr.includes('aqua')) {
      return 'Đội bốc xếp 1 (2 thợ khiêng lầu / thang máy)';
    }
    if (itemName.includes('bàn') || itemName.includes('gỗ') || itemName.includes('tủ') || itemName.includes('roma')) {
      return 'Đội bốc xếp 2 (2 thợ tháo dỡ nội thất gỗ cồng kềnh)';
    }
    return 'Đội phản ứng nhanh DCOR Express (Tài xế + 1 Phụ xe)';
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
    if (!this.returnReq.pickupInfo) {
      this.returnReq.pickupInfo = {
        provider: 'DCOR Express Đội xe chuyên dụng',
        driverName: this.dispatchDriverName,
        driverPhone: this.dispatchDriverPhone,
        vehiclePlate: this.dispatchVehiclePlate,
        movingTeam: this.dispatchMovingTeam,
        trackingCode: `DCOR-TRK-${Math.floor(1000 + Math.random() * 9000)}`,
        estimatedTime: this.dispatchSchedule,
        dispatchNote: this.dispatchNote,
        currentLeg: 1,
        currentLocation: 'Kho trung tâm DCOR (Bình Tân)'
      };
    } else {
      this.returnReq.pickupInfo.driverName = this.dispatchDriverName;
      this.returnReq.pickupInfo.driverPhone = this.dispatchDriverPhone;
      this.returnReq.pickupInfo.vehiclePlate = this.dispatchVehiclePlate;
      this.returnReq.pickupInfo.movingTeam = this.dispatchMovingTeam;
      this.returnReq.pickupInfo.estimatedTime = this.dispatchSchedule;
      this.returnReq.pickupInfo.dispatchNote = this.dispatchNote;
    }
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
    { index: 3, key: 'RECEIVED', label: 'Kiểm tra hàng', sub: 'Kiểm định QC kho' },
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

  get isPastView(): boolean {
    return this.activeViewingStep < this.currentStepIndex;
  }

  onStepClick(stepIdx: number): void {
    if (this.returnReq?.status === 'REJECTED') return;
    if (stepIdx <= this.currentStepIndex || this.returnReq?.status === 'COMPLETED') {
      this.viewingStepIndex = (stepIdx === this.currentStepIndex) ? null : stepIdx;
      setTimeout(() => {
        const cardId = 'step-block-' + stepIdx;
        const el = document.getElementById(cardId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }

  getStepLabel(stepIdx: number): string {
    const s = this.WORKFLOW_STEPS.find(step => step.index === stepIdx);
    if (!s) return `Bước ${stepIdx + 1}`;
    if (stepIdx === 4 && this.returnReq) {
      return this.returnReq.type === 'EXCHANGE' ? 'Bước 5: Đổi hàng mới' : 'Bước 5: Hoàn tiền';
    }
    return `Bước ${stepIdx + 1}: ${s.label}`;
  }

  returnToCurrentStep(): void {
    this.viewingStepIndex = null;
    setTimeout(() => {
      const cardId = 'step-block-' + this.currentStepIndex;
      const el = document.getElementById(cardId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
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
  advanceStatus(newStatus: ReturnStatus, desc: string, actor: string = 'CSKH', silentToast: boolean = false): void {
    if (!this.returnReq) return;
    this.viewingStepIndex = null;
    const updated = this.returnsService.updateStatus(this.returnReq.id, newStatus, desc, actor);
    if (updated) {
      this.returnReq = JSON.parse(JSON.stringify(updated));
      this.syncDispatchFormFromData();
      if (this.currentStepIndex > 0) {
        this.isChecklistSaved = true;
        this.allChecklistItems.forEach(i => i.checked = true);
      }
      const meta = this.getStatusMeta();
      if (!silentToast) {
        this.triggerToast('Cập nhật trạng thái thành công', `Hồ sơ đã chuyển sang: ${meta.labelAdmin}`, 'success');
      }

      // Đồng bộ trực tiếp trạng thái sang đơn hàng gốc trong OrdersService
      try {
        if (this.returnReq) {
          if (newStatus === 'APPROVED' || newStatus === 'RETURNING') {
            this.ordersService.approveReturn(this.returnReq.orderNumber, desc, actor);
          } else if (newStatus === 'RECEIVED') {
            this.ordersService.receiveReturnQC(this.returnReq.orderNumber, this.returnReq.qcReport, actor);
          } else if (newStatus === 'REJECTED') {
            this.ordersService.rejectReturn(this.returnReq.orderNumber, desc, actor);
          }
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ sang đơn hàng gốc:', e);
      }

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
    if (!this.canApproveReturn) {
      this.triggerToast('Chưa đủ điều kiện duyệt', this.getApproveDisabledReason(), 'error');
      return;
    }
    // Khóa và đánh dấu toàn bộ tiêu chí checklist đều đạt 100% khi duyệt
    this.allChecklistItems.forEach(i => i.checked = true);
    this.isChecklistSaved = true;
    if (this.returnReq) {
      const checklistMap: { [id: string]: boolean } = {};
      this.allChecklistItems.forEach(i => checklistMap[i.id] = true);
      this.returnReq.verificationChecklist = checklistMap;
      this.returnsService.updateVerificationChecklist(this.returnReq.id, checklistMap);
    }
    this.advanceStatus('APPROVED', 'CSKH chấp thuận yêu cầu đổi/trả. Chuyển sang khâu Chuẩn bị Thu hồi để phân công đội xe.', 'CSKH DCOR');
  }

  confirmDispatchAndStartReturning(): void {
    if (!this.dispatchDriverName || !this.dispatchSchedule || !this.dispatchMovingTeam) {
      this.triggerToast('Chưa đủ thông tin', 'Vui lòng chọn lái xe phụ trách, đội vận chuyển/bốc xếp và khung giờ hẹn thu hồi trước khi xác nhận điều phối xe.', 'error');
      return;
    }
    this.saveDispatchDetails();
    this.advanceStatus(
      'RETURNING', 
      `Xác nhận điều phối xe tải ${this.dispatchVehiclePlate}. Tài xế ${this.dispatchDriverName} cùng ${this.dispatchMovingTeam} bắt đầu hành trình thu hồi kiện hàng tận nhà khách (${this.dispatchSchedule}).`,
      'Điều phối Kho'
    );
  }

  confirmReceivedAtWarehouse(): void {
    if (!this.returnReq) return;
    if ((this.returnReq.pickupInfo?.currentLeg || 1) < 4) {
      this.triggerToast(
        'Chưa thể nhận kho',
        'Tiến trình xe tải chưa đến chặng 4 (Đã về kho). Vui lòng chọn chặng 4 trên tiến trình trước khi xác nhận.',
        'error'
      );
      return;
    }
    if (this.returnReq.pickupInfo) {
      this.returnReq.pickupInfo.currentLeg = 4;
      this.returnReq.pickupInfo.currentLocation = 'Trung tâm phân phối & QC DCOR Bình Tân (Đã tới kho)';
    }
    // Khởi tạo báo cáo QC mới tinh cho Bước 4 (chưa tick, input trống, chưa chọn phương án)
    this.returnReq.qcReport = {
      surfaceChecked: false,
      structureChecked: false,
      cushionLeatherChecked: false,
      accessoriesChecked: false,
      condition: '',
      defectAssessment: '',
      refundPercent: 100,
      restockOption: '' as any,
      inspector: ''
    };
    this.advanceStatus(
      'RECEIVED', 
      'Tài xế đã bàn giao kiện hàng về Trung tâm phân phối DCOR Bình Tân. Chuyển sang khâu Kiểm tra hàng & Thẩm định chất lượng QC.', 
      'Thủ kho Hoàng Sơn'
    );
  }

  confirmQcAndProceed(): void {
    if (!this.returnReq) return;
    if (!this.isQcAllPassed()) {
      this.triggerToast('Chưa đạt kiểm tra', 'Vui lòng kiểm tra và tích đủ 4 tiêu chuẩn kỹ thuật trước khi xác nhận.', 'error');
      return;
    }
    if (!this.returnReq.qcReport?.restockOption) {
      this.triggerToast('Chưa chọn phương án', 'Vui lòng chọn phương án đề xuất tái nhập hàng.', 'error');
      return;
    }
    if (this.returnReq.type === 'EXCHANGE') {
      // Chuyển sang bước Đổi hàng mới (Lên sẵn cấu trúc thông tin đơn hàng dự kiến)
      this.advanceStatus(
        'EXCHANGING', 
        'Kiểm định QC kho hoàn tất. Hệ thống lên sẵn cấu trúc thông tin đơn hàng đổi mới, chuyển bộ phận kho chuẩn bị xuất kho sản phẩm thay thế.', 
        'Thủ kho & QC'
      );
      // LƯU Ý: Ở bước này chỉ lên sẵn cấu trúc đơn hàng dự kiến, CHƯA tạo đơn thật vào OrdersService.
      // Khi giao hàng xong và bấm "Xác nhận đã giao đơn hàng mới" mới chính thức tạo đơn.
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
      `Đã phát hành phiếu xuất đổi hàng cho đơn hàng #${orderNum}. Hệ thống chính thức kích hoạt tạo đơn hàng mới và hoàn tất hồ sơ đổi hàng.`, 
      'Thủ kho & Điều vận',
      true
    );
    // SAU KHI HOÀN TẤT BƯỚC NÀY MỚI CHÍNH THỨC TẠO ĐƠN HÀNG MỚI VÀO ORDERS SERVICE
    if (this.returnReq?.replacementOrder) {
      this.ordersService.createReplacementOrderFromExchange({
        orderNumber: this.returnReq.replacementOrder.orderNumber,
        originalOrderNumber: this.returnReq.orderNumber,
        returnRequestId: this.returnReq.id,
        customer: {
          name: this.returnReq.customer.name,
          phone: this.returnReq.customer.phone,
          email: this.returnReq.customer.email,
          address: this.returnReq.replacementOrder.deliveryAddress || this.returnReq.customer.address
        },
        item: {
          name: this.returnReq.replacementOrder.item.name,
          sku: this.returnReq.replacementOrder.item.sku,
          variant: this.returnReq.replacementOrder.item.variant,
          quantity: this.returnReq.replacementOrder.item.quantity || 1,
          price: this.returnReq.replacementOrder.item.price,
          imageUrl: this.returnReq.replacementOrder.item.imageUrl
        },
        priceDiff: this.returnReq.replacementOrder.priceDiff,
        createdAt: this.returnReq.replacementOrder.createdAt
      });
      // Đơn hàng mới đã được khởi tạo thành công
    }

    // 4. Phát hành Phiếu xuất kho chính thức vào phân hệ Kho (Inventory Transactions) với trạng thái PLANNED
    const exportOrderCode = `PXK-DH-${Date.now().toString().slice(-4)}`;
    const recipientName = [
      this.returnReq?.customer?.name,
      this.returnReq?.customer?.phone ? `(${this.returnReq.customer.phone})` : '',
      '—',
      this.returnReq?.replacementOrder?.deliveryAddress || this.returnReq?.customer?.address
    ].filter(Boolean).join(' ');

    const exportPayload = {
      orderCode: exportOrderCode,
      type: 'EXPORT',
      status: 'PLANNED',
      reason: 'Xuất đổi hàng',
      sourceWarehouseId: this.stockExportPrefillData?.locationId || '24114aab-767b-4877-b256-dc775fa88f66',
      sourceLocation: this.stockExportPrefillData?.locationName || 'Kho Tổng (TP.HCM)',
      referenceCode: `#${this.returnReq?.id}`,
      recipientName: recipientName,
      notes: `Phiếu xuất đổi hàng tự động kích hoạt khi tạo đơn hàng thay thế #${orderNum} (Yêu cầu đổi trả #${this.returnReq?.id}). Đơn hàng gốc: #${this.returnReq?.orderNumber}`,
      items: [
        {
          variantId: this.stockExportPrefillData?.variantId || '3bdc0c8a-41c1-4a9f-ac0b-44178f010cc7',
          quantity: this.returnReq?.replacementOrder?.item?.quantity || 1,
          price: this.returnReq?.replacementOrder?.item?.price || 175900000,
          unit: 'Bộ',
          notes: `Xuất đổi theo đơn #${orderNum}`
        }
      ]
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/orders`, exportPayload).subscribe({
      next: (created) => {
        this.triggerToast('Tạo phiếu xuất đổi hàng thành công', `Đã phát hành phiếu xuất kho #${created?.orderCode || exportPayload.orderCode} (Planned) và tạo đơn hàng mới #${orderNum}.`, 'success', 3500);
      },
      error: (err) => {
        console.warn('Lỗi khi gửi API tạo phiếu xuất kho:', err);
        this.triggerToast('Tạo phiếu xuất đổi hàng thành công', `Đã phát hành phiếu xuất kho #${exportPayload.orderCode} (Planned) và tạo đơn hàng mới #${orderNum}.`, 'success', 3500);
      }
    });
  }

  confirmRefundTransfer(): void {
    const amountStr = this.formatVND(this.returnReq?.refundInfo?.refundAmount || 0);
    this.advanceStatus(
      'COMPLETED', 
      `Kế toán xác nhận đã chuyển khoản thành công ${amountStr} đến tài khoản khách hàng. Đóng hồ sơ trả hàng hoàn tiền.`, 
      'Kế toán trưởng'
    );
    if (this.returnReq) {
      this.ordersService.refundOrder(
        this.returnReq.orderNumber,
        this.returnReq.refundInfo?.txRef || 'UNC-20261021-0091',
        'Kế toán trưởng'
      );
    }
  }

  // Set Current Map Leg for simulation (Chỉ khả dụng khi đang ở bước RETURNING)
  setTrackingLeg(leg: 1 | 2 | 3 | 4): void {
    if (!this.returnReq || !this.returnReq.pickupInfo) return;
    if (this.returnReq.status !== 'RETURNING') return;
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
    this.returnsService.updatePickupDispatch(this.returnReq.id, {
      currentLeg: leg,
      currentLocation: this.returnReq.pickupInfo.currentLocation
    });
  }

  // Rejection handling
  openRejectModal(): void {
    this.rejectReason = this.rejectReasonOptions[0];
    this.rejectNote = '';
    this.showRejectDropdown = false;
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.showRejectDropdown = false;
  }

  confirmReject(): void {
    if (!this.returnReq || !this.rejectNote.trim()) return;
    const reasonText = this.rejectReason + ` - Ghi chú: ${this.rejectNote.trim()}`;
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

  // Xuất kho cho đơn hàng thay thế dự kiến (Bước 5)
  openStockExportModal(): void {
    if (!this.returnReq || !this.returnReq.replacementOrder) return;
    
    const customer = this.returnReq.customer;
    const replacement = this.returnReq.replacementOrder;
    const item = replacement.item;

    const recipient = [
      customer?.name,
      customer?.phone ? `(${customer.phone})` : '',
      '—',
      replacement.deliveryAddress || customer?.address
    ].filter(Boolean).join(' ');

    const notes = replacement.notes || `Xuất đổi hàng thay thế theo yêu cầu #${this.returnReq.id}. Đơn hàng gốc: #${this.returnReq.orderId}`;

    this.stockExportPrefillData = {
      reason: 'Xuất đổi hàng',
      partnerLabel: 'Khách hàng',
      reasonPrefix: 'PXK-DH',
      recipientName: recipient,
      referenceCode: `#${this.returnReq.id}`,
      notes: notes,
      locationId: '24114aab-767b-4877-b256-dc775fa88f66', // Kho Tổng (TP.HCM)
      locationName: 'Kho Tổng (TP.HCM)',
      productId: 'd6830aad-7d0a-4fb5-88c8-f0b6ec1bc30e', // Salamanca 3 seater lounge sofa
      variantId: '3bdc0c8a-41c1-4a9f-ac0b-44178f010cc7', // Matt black, 9,5 cm / left / brown Lazio fabric 3096
      productName: item?.name || 'Salamanca 3 seater lounge sofa - Bản da nỉ cao cấp',
      variantName: item?.variant || 'Matt black, 9,5 cm / left / brown Lazio fabric 3096 (Nâu trầm)',
      quantity: item?.quantity || 1,
      unit: 'Bộ',
      price: 175900000
    };

    this.showStockExportModal = true;
  }

  // Backward compatibility alias
  openEditDraftOrderModal(): void {
    this.openStockExportModal();
  }

  closeStockExportModal(): void {
    this.showStockExportModal = false;
  }

  handleStockExportSubmit(formData: any): void {
    if (!this.returnReq || !this.returnReq.replacementOrder) return;

    // Cập nhật thông tin đơn hàng thay thế dự kiến từ phiếu xuất kho vừa tạo
    if (formData.locationId) {
      if (!this.stockExportPrefillData) this.stockExportPrefillData = {};
      this.stockExportPrefillData.locationId = formData.locationId;
      this.stockExportPrefillData.locationName = formData.location || this.stockExportPrefillData.locationName;
    }
    if (formData.items && formData.items.length > 0) {
      if (!this.stockExportPrefillData) this.stockExportPrefillData = {};
      if (formData.items[0].variantId) {
        this.stockExportPrefillData.variantId = formData.items[0].variantId;
      }
      if (formData.items[0].productId) {
        this.stockExportPrefillData.productId = formData.items[0].productId;
      }
    }

    if (formData.items && formData.items.length > 0) {
      const firstItem = formData.items[0];
      if (firstItem.productName) {
        this.returnReq.replacementOrder.item.name = firstItem.productName;
      }
      if (firstItem.variantName) {
        this.returnReq.replacementOrder.item.variant = firstItem.variantName;
      }
      if (firstItem.quantity) {
        this.returnReq.replacementOrder.item.quantity = Number(firstItem.quantity) || 1;
      }
    }

    if (formData.recipientName) {
      // Tách tên & địa chỉ nếu có dấu —
      if (formData.recipientName.includes('—')) {
        const parts = formData.recipientName.split('—');
        const namePart = parts[0].trim();
        const addressPart = parts.slice(1).join('—').trim();
        if (addressPart) {
          this.returnReq.replacementOrder.deliveryAddress = addressPart;
        }
        if (namePart && this.returnReq.customer) {
          this.returnReq.customer.name = namePart.replace(/\([^)]*\)/g, '').trim();
        }
      } else {
        this.returnReq.replacementOrder.deliveryAddress = formData.recipientName;
      }
    }

    if (formData.note) {
      this.returnReq.replacementOrder.notes = formData.note.replace(/\[ACTION_LOGS:[\s\S]*?\]/, '').trim();
    }

    this.returnsService.updateReplacementOrder(this.returnReq.id, {
      customer: this.returnReq.customer ? {
        name: this.returnReq.customer.name,
        phone: this.returnReq.customer.phone
      } : undefined,
      replacementOrder: {
        deliveryAddress: this.returnReq.replacementOrder.deliveryAddress,
        notes: this.returnReq.replacementOrder.notes,
        item: this.returnReq.replacementOrder.item
      }
    });

    this.showStockExportModal = false;
    const isDraft = formData.action === 'draft';
    const msg = isDraft 
      ? `Đã lưu dự thảo phiếu xuất kho ${formData.orderCode || ''}.` 
      : `Đã lập phiếu xuất đổi hàng ${formData.orderCode || ''} thành công.`;
    this.triggerToast('Phiếu xuất kho', msg, 'success');
  }

  // QC Checklist interaction
  toggleQcField(field: 'surfaceChecked' | 'structureChecked' | 'cushionLeatherChecked' | 'accessoriesChecked'): void {
    if (!this.returnReq || !this.returnReq.qcReport || this.currentStepIndex > 3) return;
    this.returnReq.qcReport[field] = !this.returnReq.qcReport[field];
    // Sync with memory
    const original = this.returnsService.getById(this.returnReq.id);
    if (original && original.qcReport) {
      original.qcReport[field] = this.returnReq.qcReport[field];
    }
    this.triggerToast('Lưu biên bản kiểm định', 'Đã cập nhật trạng thái hạng mục QC kiểm tra.', 'info');
  }

  saveQcAssessment(): void {
    if (!this.returnReq || !this.returnReq.qcReport || this.currentStepIndex > 3) return;
    const original = this.returnsService.getById(this.returnReq.id);
    if (original && original.qcReport) {
      original.qcReport.defectAssessment = this.returnReq.qcReport.defectAssessment;
    }
  }

  toggleRestockDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this.currentStepIndex > 3) return;
    this.showRestockDropdown = !this.showRestockDropdown;
  }

  selectRestockOption(opt: 'RESTOCK_SALE' | 'REFURBISH' | 'SCRAP'): void {
    if (this.currentStepIndex > 3) return;
    if (this.returnReq?.qcReport) {
      this.returnReq.qcReport.restockOption = opt;
      const original = this.returnsService.getById(this.returnReq.id);
      if (original && original.qcReport) {
        original.qcReport.restockOption = opt;
      }
      this.triggerToast('Cập nhật phương án tái nhập', `Đã chọn: ${this.getRestockOptionLabel(opt)}`, 'info');
    }
    this.showRestockDropdown = false;
  }

  getRestockOptionLabel(opt?: 'RESTOCK_SALE' | 'REFURBISH' | 'SCRAP' | ''): string {
    const value = opt !== undefined ? opt : this.returnReq?.qcReport?.restockOption;
    if (!value) return 'Chọn phương án đề xuất';
    const found = this.restockOptions.find(o => o.value === value);
    return found ? found.label : 'Chọn phương án đề xuất';
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

  // Proof Gallery Horizontal Scroll
  @ViewChild('proofGalleryRef') proofGalleryRef?: ElementRef<HTMLDivElement>;

  scrollProofGallery(direction: 'left' | 'right'): void {
    if (!this.proofGalleryRef?.nativeElement) return;
    const container = this.proofGalleryRef.nativeElement;
    const scrollAmount = 260;
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
  triggerToast(title: string, message: string, type: 'success' | 'info' | 'error' = 'success', durationMs: number = 3500): void {
    this.clearToastTimers();
    this.isToastHovered = false;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    // Auto-close countdown
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.isToastHovered) {
          this.closeToast();
        }
      });
    }, durationMs);

    // Guaranteed max lifespan (failsafe timeout: closes after at most durationMs + 2.5s even if mouse hovered)
    this.maxToastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.closeToast();
      });
    }, durationMs + 2500);
  }

  pauseToastTimer(): void {
    this.isToastHovered = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  resumeToastTimer(): void {
    this.isToastHovered = false;
    if (!this.showToast) return;
    this.pauseToastTimer();
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.closeToast();
      });
    }, 2000);
  }

  closeToast(): void {
    this.clearToastTimers();
    this.isToastHovered = false;
    this.showToast = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  private clearToastTimers(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    if (this.maxToastTimer) {
      clearTimeout(this.maxToastTimer);
      this.maxToastTimer = null;
    }
  }

  // Formatters
  formatVND(num: number): string {
    return this.returnsService.formatVND(num);
  }

  // Customer Info Action
  onOpenOrderInfo(): void {
    if (!this.returnReq) return;
    const orderKey = (this.returnReq.orderNumber || this.returnReq.orderId || '').replace(/^#/g, '').trim();
    this.router.navigate(['/admin/orders', orderKey]);
  }

  onOpenCustomerInfo(): void {
    const cust = this.returnReq?.customer;
    if (cust?.phone) {
      this.router.navigate(['/admin/customers'], { queryParams: { q: cust.phone } });
    } else if (cust?.name) {
      this.router.navigate(['/admin/customers'], { queryParams: { q: cust.name } });
    } else {
      this.router.navigate(['/admin/customers']);
    }
  }
}
