import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { 
  LucideAngularModule, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  Eye, 
  Image as ImageIcon, 
  X,
  Truck,
  Check,
  XCircle,
  Clock,
  ArrowRightLeft,
  DollarSign,
  Copy,
  MapPin
} from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, CustomerReturnRequest } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { Subscription } from 'rxjs';

export interface ReturnTimelineStep {
  key: string;
  title: string;
  icon: any;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  time?: string | null;
}

export interface OrderTimelineStep {
  key: string;
  title: string;
  subTitle?: string;
  icon: any;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  time?: string | null;
}

@Component({
  selector: 'app-account-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, GuestPhoneBannerComponent],
  templateUrl: './returns.html',
  styleUrls: ['./returns.css']
})
export class AccountReturnsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Package,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    RefreshCw,
    FileText,
    Eye,
    Image: ImageIcon,
    X,
    Truck,
    Check,
    XCircle,
    Clock,
    ArrowRightLeft,
    DollarSign,
    Copy,
    MapPin
  };

  returnsList: CustomerReturnRequest[] = [];
  filteredReturns: CustomerReturnRequest[] = [];
  isLoading = false;
  activeTab = 'ALL';
  private _errorMessage = '';
  private _successMessage = '';
  private alertTimer: ReturnType<typeof setTimeout> | null = null;

  get errorMessage(): string {
    return this._errorMessage;
  }

  set errorMessage(val: string) {
    this._errorMessage = val;
    this.scheduleAlertAutoClear();
  }

  get successMessage(): string {
    return this._successMessage;
  }

  set successMessage(val: string) {
    this._successMessage = val;
    this.scheduleAlertAutoClear();
  }

  private scheduleAlertAutoClear(): void {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    if (this._errorMessage || this._successMessage) {
      this.alertTimer = setTimeout(() => {
        this._errorMessage = '';
        this._successMessage = '';
        this.alertTimer = null;
        this.cdr.markForCheck();
      }, 4000);
    }
  }

  // Hệ thống Tabs chuẩn hóa theo State Machine DCor
  readonly tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'RETURNING', label: 'Đang gửi hàng' },
    { key: 'RECEIVED', label: 'Đã nhận & QC' },
    { key: 'EXCHANGING', label: 'Đang đổi mới' },
    { key: 'REFUNDING', label: 'Đang hoàn tiền' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
    { key: 'REJECTED', label: 'Đã từ chối' }
  ];

  // Drawer xem chi tiết yêu cầu đổi trả
  selectedReturn: CustomerReturnRequest | null = null;
  isDetailDrawerOpen = false;
  zoomedImageUrl: string | null = null;

  // Modal Chi tiết Đơn hàng gốc (Popup tại chỗ)
  selectedOrder: OrderDetail | null = null;
  isOrderDetailOpen = false;
  isLoadingOrderDetail = false;
  orderDetailError = '';

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Xóa sạch cache đổi trả cũ nếu có
    try {
      localStorage.removeItem('dcor_cache_returns');
    } catch (_) {}

    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

    // Nhận query parameter tab nếu được chuyển từ trang Đơn hàng của tôi
    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          const tabKey = params['tab'].toUpperCase();
          if (this.tabs.some(t => t.key === tabKey)) {
            this.activeTab = tabKey;
            this.applyFilter();
            this.cdr.markForCheck();
          }
        }
      })
    );

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

    this.checkAndLoad();
  }

  private checkAndLoad(): void {
    if (this.canViewContent) {
      this.loadReturns();
    } else {
      this.returnsList = [];
      this.filteredReturns = [];
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadReturns(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();
    this.sub.add(
      this.customerService.getReturns().subscribe({
        next: (data) => {
          this.returnsList = data || [];
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.warn('Lỗi khi tải danh sách đổi trả:', err);
          this.returnsList = [];
          this.filteredReturns = [];
          if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          } else if (err.status === 0) {
            this.errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.';
          } else {
            this.errorMessage = err.error?.message || 'Không thể tải danh sách đổi trả.';
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  onGuestPhoneVerified(phone: string): void {
    this.isPhoneVerified = true;
    this.returnsList = [];
    this.filteredReturns = [];
    this.errorMessage = '';
    this.loadReturns();
    this.cdr.markForCheck();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.returnsList = [];
    this.filteredReturns = [];
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  getCount(key: string): number {
    if (!this.returnsList) return 0;
    if (key === 'ALL') return this.returnsList.length;
    return this.returnsList.filter(r => this.matchesTab(r.status, key)).length;
  }

  applyFilter(): void {
    if (this.activeTab === 'ALL') {
      this.filteredReturns = [...this.returnsList];
    } else {
      this.filteredReturns = this.returnsList.filter(r => this.matchesTab(r.status, this.activeTab));
    }
  }

  private matchesTab(status: string, tab: string): boolean {
    if (status === tab) return true;
    if (tab === 'APPROVED' && status === 'PROCESSING') return true;
    if (tab === 'EXCHANGING' && (status === 'PREPARING' || status === 'SHIPPED')) return true;
    return false;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED':
      case 'PROCESSING': return 'status-processing';
      case 'RETURNING': return 'status-returning';
      case 'RECEIVED': return 'status-received';
      case 'EXCHANGING':
      case 'PREPARING':
      case 'SHIPPED': return 'status-preparing';
      case 'REFUNDING': return 'status-refunding';
      case 'COMPLETED': return 'status-completed';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt thu hồi';
      case 'RETURNING': return 'Đang gửi hàng về DCOR';
      case 'RECEIVED': return 'DCOR đã nhận & Đang QC';
      case 'EXCHANGING': return 'Đang chuẩn bị hàng mới';
      case 'REFUNDING': return 'Đang hoàn tiền';
      case 'PROCESSING': return 'Đang xử lý (Gửi hàng về)';
      case 'PREPARING': return 'Đang chuẩn bị hàng mới';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'COMPLETED': return 'Hoàn tất đổi trả';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  }

  getReturnStatusClass(ret: CustomerReturnRequest): string {
    if (!ret) return 'pending';
    switch (ret.status) {
      case 'PENDING': return 'pending';
      case 'APPROVED':
      case 'PROCESSING': return 'processing';
      case 'RETURNING': return 'shipped';
      case 'RECEIVED': return 'confirmed';
      case 'EXCHANGING':
      case 'PREPARING': return 'processing';
      case 'SHIPPED': return 'shipped';
      case 'REFUNDING': return 'waiting-payment';
      case 'COMPLETED': return 'delivered';
      case 'REJECTED': return 'cancelled';
      default: return 'pending';
    }
  }

  isExchangeReturn(ret: CustomerReturnRequest | null): boolean {
    if (!ret) return false;
    return ret.returnType === 'EXCHANGE' || (ret.reason ? ret.reason.includes('Đổi') : false);
  }

  isRefundReturn(ret: CustomerReturnRequest | null): boolean {
    if (!ret) return false;
    return ret.returnType === 'REFUND' || (!this.isExchangeReturn(ret));
  }

  // ==========================================
  // DRAWER CHI TIẾT YÊU CẦU ĐỔI TRẢ
  // ==========================================
  openReturnDetail(ret: CustomerReturnRequest, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedReturn = ret;
    this.isDetailDrawerOpen = true;
    try {
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    this.cdr.markForCheck();
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen = false;
    this.selectedReturn = null;
    this.zoomedImageUrl = null;
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    this.cdr.markForCheck();
  }

  getReturnTimelineSteps(ret: CustomerReturnRequest | null | undefined): ReturnTimelineStep[] {
    if (!ret) return [];

    if (ret.status === 'REJECTED') {
      return [
        {
          key: 'PENDING',
          title: 'Tiếp nhận yêu cầu',
          icon: this.icons.FileText,
          status: 'completed',
          time: ret.createdAt
        },
        {
          key: 'REJECTED',
          title: 'Yêu cầu bị từ chối',
          icon: this.icons.XCircle,
          status: 'cancelled',
          time: ret.updatedAt || ret.createdAt
        }
      ];
    }

    const isEx = (ret as any).returnType === 'EXCHANGE' || ret.reason?.includes('Đổi') || (ret as any).type === 'EXCHANGE';
    const status: string = ret.status;

    const isDone = (targetList: string[]) => targetList.includes(status);

    const step1Done = isDone(['APPROVED', 'PROCESSING', 'RETURNING', 'RECEIVED', 'EXCHANGING', 'PREPARING', 'SHIPPED', 'REFUNDING', 'COMPLETED']);
    const step2Done = isDone(['RETURNING', 'RECEIVED', 'EXCHANGING', 'PREPARING', 'SHIPPED', 'REFUNDING', 'COMPLETED']);
    const step3Done = isDone(['RECEIVED', 'EXCHANGING', 'PREPARING', 'SHIPPED', 'REFUNDING', 'COMPLETED']);
    const step4Done = isDone(['EXCHANGING', 'PREPARING', 'SHIPPED', 'REFUNDING', 'COMPLETED']);
    const step5Done = isDone(['COMPLETED']);

    return [
      {
        key: 'PENDING',
        title: 'Tiếp nhận & Chờ duyệt',
        icon: this.icons.FileText,
        status: step1Done ? 'completed' : 'current',
        time: ret.createdAt
      },
      {
        key: 'APPROVED',
        title: 'Đã duyệt thu hồi',
        icon: this.icons.CheckCircle2,
        status: step2Done ? 'completed' : (status === 'APPROVED' || status === 'PROCESSING' ? 'current' : 'pending'),
        time: (step2Done || status === 'APPROVED' || status === 'PROCESSING') ? ret.updatedAt : null
      },
      {
        key: 'RETURNING',
        title: 'Đang gửi về DCOR',
        icon: this.icons.Truck,
        status: step3Done ? 'completed' : (status === 'RETURNING' ? 'current' : 'pending'),
        time: (step3Done || status === 'RETURNING') ? ret.updatedAt : null
      },
      {
        key: 'RECEIVED',
        title: 'DCOR đã nhận & QC',
        icon: this.icons.ShieldCheck,
        status: step4Done ? 'completed' : (status === 'RECEIVED' ? 'current' : 'pending'),
        time: (step4Done || status === 'RECEIVED') ? ret.updatedAt : null
      },
      {
        key: 'PROCESSING_NEXT',
        title: isEx ? 'Chuẩn bị sản phẩm đổi' : 'Đang hoàn tiền',
        icon: isEx ? this.icons.RefreshCw : this.icons.DollarSign,
        status: step5Done ? 'completed' : (['EXCHANGING', 'REFUNDING', 'PREPARING', 'SHIPPED'].includes(status) ? 'current' : 'pending'),
        time: (step5Done || ['EXCHANGING', 'REFUNDING', 'PREPARING', 'SHIPPED'].includes(status)) ? ret.updatedAt : null
      },
      {
        key: 'COMPLETED',
        title: 'Hoàn tất đổi trả',
        icon: this.icons.Check,
        status: status === 'COMPLETED' ? 'completed' : 'pending',
        time: status === 'COMPLETED' ? ret.updatedAt : null
      }
    ];
  }

  copyToClipboard(text: string, label: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Đã sao chép ${label}: ${text}`);
      }).catch(() => {});
    }
  }

  zoomImage(url: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.zoomedImageUrl = url;
    this.cdr.markForCheck();
  }

  closeZoomImage(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.zoomedImageUrl = null;
    this.cdr.markForCheck();
  }

  // ==========================================
  // CHI TIẾT ĐƠN HÀNG GỐC (POPUP TẠI CHỖ)
  // ==========================================
  openOrderDetail(orderNumber: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!orderNumber) return;
    this.isOrderDetailOpen = true;
    this.isLoadingOrderDetail = true;
    this.selectedOrder = null;
    this.orderDetailError = '';
    this.cdr.markForCheck();

    this.orderService.getOrderDetail(orderNumber).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.isLoadingOrderDetail = false;
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      },
      error: (err) => {
        this.isLoadingOrderDetail = false;
        this.orderDetailError = err?.error?.message || 'Không thể tải thông tin chi tiết đơn hàng gốc.';
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      }
    });
  }

  closeOrderDetail(): void {
    this.isOrderDetailOpen = false;
    this.selectedOrder = null;
    this.orderDetailError = '';
    this.cdr.markForCheck();
  }

  formatShippingAddress(order: any): string {
    if (!order) return '';
    const detail = (order.detailAddress || order.address || '').trim();
    const ward = (order.ward || '').trim();
    const district = (order.district || '').trim();
    const province = (order.province || '').trim();

    const rawTokens = [detail, ward, district, province]
      .filter(Boolean)
      .join(', ')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const uniqueTokens: string[] = [];
    for (const token of rawTokens) {
      const lower = token.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueTokens.push(token);
      }
    }
    return uniqueTokens.join(', ');
  }

  formatCurrency(amount?: number | null): string {
    if (amount === undefined || amount === null) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  }

  getOrderStatusClass(order?: OrderDetail | null): string {
    if (!order) return '';
    const st = (order.status || '').toLowerCase();
    if (st.includes('cancel')) return 'status-cancelled';
    if (st.includes('deliver') || st.includes('complete')) return 'status-delivered';
    if (st.includes('ship')) return 'status-shipped';
    if (st.includes('process')) return 'status-processing';
    if (st.includes('wait') || st.includes('pay')) return 'status-waiting';
    return 'status-pending';
  }

  getOrderDisplayStatus(order?: OrderDetail | null): string {
    if (!order) return '';
    if (order.displayStatus) return order.displayStatus;
    const st = order.status;
    if (st === 'DELIVERED' || st === 'COMPLETED') return 'Hoàn tất';
    if (st === 'SHIPPED') return 'Đang giao';
    if (st === 'PROCESSING') return 'Đang chuẩn bị';
    if (st === 'CANCELLED') return 'Đã hủy';
    if (st === 'WAITING_PAYMENT') return 'Chờ thanh toán';
    return 'Chờ xác nhận';
  }

  getOrderTimelineSteps(order: OrderDetail | null | undefined): OrderTimelineStep[] {
    if (!order) return [];

    const history = order.statusHistory || [];
    const getStatusTime = (targetStatuses: string[]): string | null => {
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i];
        if (targetStatuses.includes(h.status) && h.createdAt) {
          return h.createdAt;
        }
      }
      for (const h of history) {
        if (targetStatuses.includes(h.status) && h.createdAt) {
          return h.createdAt;
        }
      }
      return null;
    };

    if (order.status === 'CANCELLED') {
      const cancelTime = order.cancelledAt || getStatusTime(['CANCELLED']) || null;
      return [
        {
          key: 'ORDER_PLACED',
          title: 'Đơn hàng đã đặt',
          icon: this.icons.FileText,
          status: 'completed',
          time: order.createdAt || null
        },
        {
          key: 'ORDER_CANCELLED',
          title: 'Đã hủy đơn hàng',
          subTitle: order.cancelReason || 'Đã hủy đơn hàng',
          icon: this.icons.XCircle,
          status: 'cancelled',
          time: cancelTime
        }
      ];
    }

    const step1: OrderTimelineStep = {
      key: 'PLACED',
      title: 'Đơn hàng đã đặt',
      icon: this.icons.FileText,
      status: 'completed',
      time: order.createdAt || null
    };

    let step2Title = 'Đã xác nhận';
    const isHighValue = !!order.isHighValue;
    const isPaid = order.paymentStatus === 'PAID';
    const isPartial = order.paymentStatus === 'PARTIAL';
    const advancedStatuses = ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
    const isAdvanced = advancedStatuses.includes(order.status);

    if (isHighValue) {
      step2Title = (isPaid || isPartial || isAdvanced) ? 'Đã đặt cọc 30%' : 'Chờ đặt cọc 30%';
    }

    const isStep2Completed = isAdvanced || isPaid || isPartial || order.status === 'WAITING_DELIVERY';
    const step2Time = getStatusTime(['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED']);

    const step2: OrderTimelineStep = {
      key: 'CONFIRMED',
      title: step2Title,
      icon: this.icons.CheckCircle2,
      status: isStep2Completed ? 'completed' : (order.status === 'PENDING' || order.status === 'WAITING_PAYMENT' ? 'current' : 'pending'),
      time: step2Time
    };

    const isStep3Completed = ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status);
    const step3Time = getStatusTime(['PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED']);
    const step3: OrderTimelineStep = {
      key: 'PROCESSING',
      title: 'Đang chuẩn bị hàng',
      icon: this.icons.Package,
      status: isStep3Completed ? 'completed' : (order.status === 'PROCESSING' || order.status === 'CONFIRMED' ? 'current' : 'pending'),
      time: step3Time
    };

    const isStep4Completed = ['DELIVERED', 'COMPLETED'].includes(order.status);
    const step4Time = getStatusTime(['SHIPPED', 'DELIVERED', 'COMPLETED']);
    const step4: OrderTimelineStep = {
      key: 'SHIPPED',
      title: 'Đang giao hàng',
      icon: this.icons.Truck,
      status: isStep4Completed ? 'completed' : (order.status === 'SHIPPED' ? 'current' : 'pending'),
      time: step4Time
    };

    const isStep5Completed = order.status === 'DELIVERED' || order.status === 'COMPLETED';
    const step5Time = (order as any).deliveredAt || getStatusTime(['DELIVERED', 'COMPLETED']) || null;
    const step5: OrderTimelineStep = {
      key: 'DELIVERED',
      title: 'Hoàn tất',
      icon: this.icons.Check,
      status: isStep5Completed ? 'completed' : 'pending',
      time: step5Time
    };

    return [step1, step2, step3, step4, step5];
  }

  ngOnDestroy(): void {
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    this.sub.unsubscribe();
  }
}
