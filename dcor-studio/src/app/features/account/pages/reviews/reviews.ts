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
  X
} from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { ReviewService, ProductReviewItem, PendingReviewItem } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderReviewModalComponent, ReviewModalItem } from '../../../../shared/components/order-review-modal/order-review-modal';

@Component({
  selector: 'app-account-reviews',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LucideAngularModule, 
    AccountSidebarComponent, 
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
    X
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

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
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
}

