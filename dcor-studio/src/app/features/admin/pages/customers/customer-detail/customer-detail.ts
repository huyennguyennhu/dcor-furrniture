import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, 
  ShoppingBag, Star, Lock, Unlock, Shield, Building2, ExternalLink, 
  Loader2, RefreshCw, CheckCircle2, Clock, AlertCircle, X, AlertTriangle 
} from 'lucide-angular';
import { CustomerService, CustomerDetail } from '../../../../../core/services/customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './customer-detail.html',
  styleUrls: ['./customer-detail.css']
})
export class CustomerDetailComponent implements OnInit {

  goToOrder(idOrNumber: string): void {
    if (!idOrNumber) return;
    this.router.navigate(['/admin/orders', idOrNumber]);
  }

  icons = {
    ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, 
    ShoppingBag, Star, Lock, Unlock, Shield, Building2, ExternalLink, 
    Loader2, RefreshCw, CheckCircle2, Clock, AlertCircle, X, AlertTriangle
  };

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private cdr = inject(ChangeDetectorRef);

  customer: CustomerDetail | null = null;
  isLoading = true;
  errorMessage = '';

  // Lock/Unlock Modal state
  showLockModal = false;
  isSubmittingLock = false;
  lockReason = '';

  // Toast notification state
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Mã khách hàng không hợp lệ.';
      this.isLoading = false;
      return;
    }
    this.loadCustomerDetail(id);
  }

  loadCustomerDetail(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.customerService.getCustomerById(id).subscribe({
      next: (data: CustomerDetail) => {
        this.isLoading = false;
        this.customer = data;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Lỗi khi tải chi tiết khách hàng:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Không tìm thấy thông tin khách hàng hoặc bạn không có quyền truy cập.';
        this.cdr.markForCheck();
      }
    });
  }

  get isCustomerLocked(): boolean {
    if (!this.customer) return false;
    return !!(this.customer.isLocked);
  }

  get displayId(): string {
    if (!this.customer) return '';
    const phone = this.customer.phone;
    if (phone && !phone.startsWith('GOOG_') && phone.length >= 4) {
      return `#KH-${phone.slice(-4)}`;
    }
    return `#KH-${this.customer.id.slice(0, 6).toUpperCase()}`;
  }

  get phoneDisplay(): string {
    if (!this.customer) return '';
    const phone = this.customer.phone;
    return phone?.startsWith('GOOG_') ? 'Đăng nhập Google' : (phone || 'Chưa cung cấp');
  }

  get totalSpentFormatted(): string {
    if (!this.customer) return '0 ₫';
    const spent = Number(this.customer.totalSpent) || 0;
    return spent.toLocaleString('vi-VN') + ' ₫';
  }

  get rewardPoints(): number {
    if (!this.customer) return 0;
    const spent = Number(this.customer.totalSpent) || 0;
    return this.customer.rewardPoints || Math.floor(spent / 100000);
  }

  get membership(): string {
    if (!this.customer) return 'Đồng';
    if (this.customer.type === 'B2B' || (this.customer.companyName && this.customer.companyName.trim() !== '')) {
      return 'B2B Partner';
    }
    const spent = Number(this.customer.totalSpent) || 0;
    if (spent >= 150000000) return 'Vàng';
    if (spent >= 40000000) return 'Bạc';
    return 'Đồng';
  }

  get membershipColor(): string {
    const m = this.membership;
    if (m === 'Vàng') return '#F59E0B';
    if (m === 'Bạc') return '#9CA3AF';
    if (m === 'Đồng') return '#D97706';
    return '#3B82F6';
  }

  get createdAtFormatted(): string {
    if (!this.customer || !this.customer.createdAt) return '—';
    return this.formatDate(this.customer.createdAt);
  }

  get lastPurchaseFormatted(): string {
    if (!this.customer || !this.customer.orders || this.customer.orders.length === 0) {
      return 'Chưa có đơn';
    }
    return this.formatDate(this.customer.orders[0].createdAt);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  openLockModal(): void {
    this.lockReason = '';
    this.showLockModal = true;
  }

  closeLockModal(): void {
    if (this.isSubmittingLock) return;
    this.showLockModal = false;
  }

  confirmLockToggle(): void {
    if (!this.customer || this.isSubmittingLock) return;
    const willLock = !this.isCustomerLocked;
    const actionName = willLock ? 'khóa' : 'mở khóa';
    this.isSubmittingLock = true;

    this.customerService.toggleLock(this.customer.id, willLock).subscribe({
      next: (res: any) => {
        this.isSubmittingLock = false;
        this.showLockModal = false;
        if (this.customer) {
          this.customer.isLocked = willLock;
        }
        this.triggerToast(
          willLock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản',
          res.message || `Đã ${actionName} tài khoản khách hàng thành công!`,
          'success'
        );
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isSubmittingLock = false;
        console.error('Lỗi khi thay đổi trạng thái:', err);
        this.triggerToast(
          'Thao tác thất bại',
          'Không thể thực hiện thay đổi trạng thái. Vui lòng kiểm tra lại kết nối!',
          'error'
        );
        this.cdr.markForCheck();
      }
    });
  }

  triggerToast(title: string, message: string, type: 'success' | 'error' = 'success'): void {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, 3500);
  }

  closeToast(): void {
    this.showToast = false;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'SHIPPED': return 'Đang vận chuyển';
      case 'PROCESSING': return 'Đang xử lý';
      case 'PENDING': return 'Chờ xác nhận';
      case 'CANCELLED': return 'Đã hủy';
      case 'RETURNED': return 'Trả hàng';
      default: return status || 'Đang xử lý';
    }
  }

  getOrderStatusStyle(status: string): Record<string, string> {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return {
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11.5px',
          fontWeight: '600',
          background: '#ECFDF5',
          color: '#059669',
          border: '1px solid #A7F3D0'
        };
      case 'CANCELLED':
        return {
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11.5px',
          fontWeight: '600',
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        };
      case 'RETURNED':
        return {
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11.5px',
          fontWeight: '600',
          background: '#FFFBEB',
          color: '#D97706',
          border: '1px solid #FDE68A'
        };
      default:
        return {
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11.5px',
          fontWeight: '600',
          background: '#EFF6FF',
          color: '#2563EB',
          border: '1px solid #BFDBFE'
        };
    }
  }
}
