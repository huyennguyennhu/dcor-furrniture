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
  Copy
} from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, CustomerReturnRequest } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

export interface ReturnTimelineStep {
  key: string;
  title: string;
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
    Copy
  };

  returnsList: CustomerReturnRequest[] = [];
  filteredReturns: CustomerReturnRequest[] = [];
  isLoading = false;
  activeTab = 'ALL';
  errorMessage = '';
  successMessage = '';

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

  // Thanh Test kiểm thử nhanh đổi trả
  selectedTestReturnId = '';
  isUpdatingStatus = false;

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
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
          if (this.returnsList.length > 0 && !this.selectedTestReturnId) {
            this.selectedTestReturnId = this.returnsList[0].id;
          }
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
  // THANH TEST: CHUYỂN TRẠNG THÁI ĐỔI TRẢ
  // ==========================================
  testChangeStatus(newStatus: string): void {
    if (!this.selectedTestReturnId) {
      alert('Vui lòng chọn yêu cầu đổi trả cần thử nghiệm.');
      return;
    }

    this.isUpdatingStatus = true;
    this.errorMessage = '';
    this.customerService.updateReturnStatus(this.selectedTestReturnId, newStatus, 'Chuyển trạng thái thử nghiệm luồng đổi trả')
      .subscribe({
        next: (res) => {
          this.isUpdatingStatus = false;
          this.successMessage = res.message || `Đã chuyển trạng thái sang "${this.getStatusText(newStatus)}".`;
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 4000);

          // Cập nhật lại danh sách tại chỗ
          const target = this.returnsList.find(r => r.id === this.selectedTestReturnId);
          if (target) {
            target.status = newStatus as any;
            target.statusLabel = this.getStatusText(newStatus);
          }

          // Cập nhật cả selectedReturn nếu đang mở drawer
          if (this.selectedReturn && this.selectedReturn.id === this.selectedTestReturnId) {
            this.selectedReturn.status = newStatus as any;
            this.selectedReturn.statusLabel = this.getStatusText(newStatus);
          }

          // Nếu đang ở tab trạng thái cụ thể, tự chuyển sang tab vừa đổi để xem ngay
          if (this.activeTab !== 'ALL') {
            this.activeTab = newStatus;
          }
          this.applyFilter();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isUpdatingStatus = false;
          console.error('Lỗi khi cập nhật trạng thái đổi trả:', err);
          this.errorMessage = err.error?.message || 'Không thể cập nhật trạng thái đổi trả. Vui lòng thử lại.';
          setTimeout(() => {
            this.errorMessage = '';
            this.cdr.markForCheck();
          }, 5000);
          this.cdr.markForCheck();
        }
      });
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

  ngOnDestroy(): void {
    try {
      document.body.style.overflow = '';
    } catch (_) {}
    this.sub.unsubscribe();
  }
}
