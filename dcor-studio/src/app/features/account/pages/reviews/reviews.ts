import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Star, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  Eye, 
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  X,
  MapPin,
  Check,
  FileText,
  Truck,
  CircleX,
  Copy,
  ShieldCheck
} from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { ReviewService, ProductReviewItem, PendingReviewItem } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService, OrderDetail } from '../../../../core/services/order.service';
import { OrderReviewModalComponent, ReviewModalItem } from '../../../../shared/components/order-review-modal/order-review-modal';

export interface OrderTimelineStep {
  key: string;
  title: string;
  subTitle?: string;
  icon: any;
  status: 'completed' | 'current' | 'pending' | 'cancelled';
  time?: string | null;
}

@Component({
  selector: 'app-account-reviews',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule, 
    GuestPhoneBannerComponent,
    OrderReviewModalComponent
  ],
  templateUrl: './reviews.html',
  styleUrls: ['./reviews.css']
})
export class AccountReviewsComponent implements OnInit {
  icons = {
    Star,
    Package,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    ChevronRight,
    MessageSquare,
    Eye,
    ShoppingBag,
    Sparkles,
    RefreshCw,
    ImageIcon,
    X,
    MapPin,
    Check,
    FileText,
    Truck,
    CircleX,
    Copy,
    ShieldCheck
  };

  activeTab: 'unreviewed' | 'reviewed' = 'unreviewed';
  isLoading = true;
  isLoggedIn = false;
  guestPhone = '';
  searchQuery = '';

  reviewedList: ProductReviewItem[] = [];
  unreviewedList: PendingReviewItem[] = [];

  successMessage = '';
  errorMessage = '';

  // Modal Đánh giá
  isReviewModalOpen = false;
  reviewModalOrderNumber = '';
  reviewModalItems: ReviewModalItem[] = [];

  // Modal xem ảnh phóng to
  previewImageUrl: string | null = null;

  // Modal Chi tiết Đơn hàng (Popup tại chỗ)
  selectedOrder: OrderDetail | null = null;
  isDetailDrawerOpen = false;
  isLoadingDetail = false;
  detailError = '';

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.guestPhone = this.authService.getGuestPhone() || '';
    this.loadReviews();
  }

  get canViewContent(): boolean {
    return this.isLoggedIn || !!this.guestPhone;
  }

  loadReviews(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.reviewedList = [];
      this.unreviewedList = [];
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.reviewService.getMyReviews().subscribe({
      next: (res) => {
        this.reviewedList = (res.reviewed || []).map(r => ({
          ...r,
          productImage: r.productImage && !r.productImage.includes('dsasf753c') ? r.productImage : ''
        }));
        this.unreviewedList = (res.unreviewed || []).map(u => ({
          ...u,
          productImage: u.productImage && !u.productImage.includes('dsasf753c') ? u.productImage : ''
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi tải danh sách đánh giá:', err);
        this.errorMessage = 'Không thể tải danh sách đánh giá. Vui lòng thử lại sau.';
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      }
    });
  }

  onProductImageError(item: { productImage?: string }): void {
    if (item && item.productImage) {
      item.productImage = '';
      this.cdr.markForCheck();
      try { this.cdr.detectChanges(); } catch (_) {}
    }
  }

  switchTab(tab: 'unreviewed' | 'reviewed'): void {
    this.activeTab = tab;
    this.searchQuery = '';
  }

  onSearchChange(): void {
    this.cdr.markForCheck();
  }

  get filteredUnreviewed(): PendingReviewItem[] {
    if (!this.searchQuery.trim()) return this.unreviewedList;
    const q = this.searchQuery.toLowerCase();
    return this.unreviewedList.filter(item => 
      item.productName.toLowerCase().includes(q) ||
      item.orderNumber.toLowerCase().includes(q) ||
      (item.variantDescription && item.variantDescription.toLowerCase().includes(q))
    );
  }

  get filteredReviewed(): ProductReviewItem[] {
    if (!this.searchQuery.trim()) return this.reviewedList;
    const q = this.searchQuery.toLowerCase();
    return this.reviewedList.filter(item => 
      (item.productName && item.productName.toLowerCase().includes(q)) ||
      (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
      (item.comment && item.comment.toLowerCase().includes(q)) ||
      (item.variantDescription && item.variantDescription.toLowerCase().includes(q))
    );
  }

  openReviewForProduct(item: PendingReviewItem): void {
    this.reviewModalOrderNumber = item.orderNumber;
    this.reviewModalItems = [{
      orderItemId: item.orderItemId,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      variantDescription: item.variantDescription,
      price: item.price,
      quantity: item.quantity
    }];
    this.isReviewModalOpen = true;
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.reviewModalItems = [];
    this.reviewModalOrderNumber = '';
  }

  onReviewSubmitted(): void {
    this.successMessage = 'Đánh giá sản phẩm thành công! Cảm ơn bạn đã đóng góp ý kiến.';
    this.loadReviews();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  openImagePreview(url: string): void {
    this.previewImageUrl = url;
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
  }

  onGuestPhoneVerified(phone: string): void {
    this.guestPhone = phone;
    this.loadReviews();
  }

  onGuestPhoneReset(): void {
    this.guestPhone = '';
    this.reviewedList = [];
    this.unreviewedList = [];
    this.cdr.markForCheck();
  }

  openOrderDetail(orderNumber: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!orderNumber) return;
    this.isDetailDrawerOpen = true;
    this.isLoadingDetail = true;
    this.selectedOrder = null;
    this.detailError = '';
    this.cdr.markForCheck();

    this.orderService.getOrderDetail(orderNumber).subscribe({
      next: (order) => {
        this.selectedOrder = order;
        this.isLoadingDetail = false;
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      },
      error: (err) => {
        this.isLoadingDetail = false;
        this.detailError = err?.error?.message || 'Không thể tải thông tin chi tiết đơn hàng. Vui lòng thử lại sau.';
        this.cdr.markForCheck();
        try { this.cdr.detectChanges(); } catch (_) {}
      }
    });
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen = false;
    this.selectedOrder = null;
    this.detailError = '';
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
          icon: this.icons.CircleX,
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
      .map(t => t.trim())
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

  copyToClipboard(text: string, label?: string): void {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  }
}

