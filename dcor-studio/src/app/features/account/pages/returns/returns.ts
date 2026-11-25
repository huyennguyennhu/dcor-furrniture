import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Package, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw, FileText, Eye, Image as ImageIcon, X } from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, CustomerReturnRequest } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

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
    X
  };

  returnsList: CustomerReturnRequest[] = [];
  filteredReturns: CustomerReturnRequest[] = [];
  isLoading = false;
  activeTab = 'ALL';
  errorMessage = '';
  successMessage = '';

  // Hệ thống Tabs theo đúng yêu cầu quy trình:
  // 1. Tất cả (ALL)
  // 2. Chờ duyệt (PENDING): Vừa gửi yêu cầu, chờ admin phê duyệt
  // 3. Đang xử lý (PROCESSING): Sau khi duyệt xong => user gửi hàng lỗi về cho Dcor
  // 4. Đang chuẩn bị (PREPARING): Admin xác nhận đã nhận được hàng bị lỗi & chuẩn bị hàng mới
  // 5. Đang giao hàng (SHIPPED): Đang vận chuyển sản phẩm đổi mới đến tận nhà khách
  // 6. Hoàn tất đổi trả (COMPLETED): Khách nhận hàng đổi mới hoặc hoàn tất
  // 7. Đã từ chối (REJECTED): Không chấp thuận yêu cầu đổi trả
  readonly tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'PROCESSING', label: 'Đang xử lý' },
    { key: 'PREPARING', label: 'Đang chuẩn bị' },
    { key: 'SHIPPED', label: 'Đang giao hàng' },
    { key: 'COMPLETED', label: 'Hoàn tất đổi trả' },
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
    return this.returnsList.filter(r => r.status === key).length;
  }

  applyFilter(): void {
    if (this.activeTab === 'ALL') {
      this.filteredReturns = [...this.returnsList];
    } else {
      this.filteredReturns = this.returnsList.filter(r => r.status === this.activeTab);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'PROCESSING': return 'status-processing';
      case 'PREPARING': return 'status-preparing';
      case 'SHIPPED': return 'status-shipped';
      case 'COMPLETED': return 'status-completed';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý (Gửi hàng về)';
      case 'PREPARING': return 'Đang chuẩn bị hàng mới';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'COMPLETED': return 'Hoàn tất đổi trả';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
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
