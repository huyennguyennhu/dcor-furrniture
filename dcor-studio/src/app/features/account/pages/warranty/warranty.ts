import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { 
  LucideAngularModule, 
  CheckCircle2, 
  ShieldCheck, 
  Shield, 
  Package, 
  AlertCircle, 
  Wrench, 
  Phone, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Check, 
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, WarrantyItem } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AccountSidebarComponent, GuestPhoneBannerComponent],
  templateUrl: './warranty.html',
  styleUrls: ['./warranty.css']
})
export class AccountWarrantyComponent implements OnInit, OnDestroy {
  readonly icons = {
    CheckCircle2,
    Search,
    ShieldCheck,
    Shield,
    Package,
    AlertCircle,
    Wrench,
    Phone,
    X,
    Calendar,
    Clock,
    MapPin,
    FileText,
    Check,
    ChevronRight,
    Sparkles
  };

  warranties: WarrantyItem[] = [];
  filteredWarranties: WarrantyItem[] = [];
  isLoading = false;
  activeFilter: 'ACTIVE' | 'EXPIRED' | 'ALL' = 'ACTIVE';
  searchQuery = '';
  errorMessage = '';
  successMessage = '';

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  get activeCount(): number {
    return this.warranties.filter(w => !w.isExpired).length;
  }

  get expiredCount(): number {
    return this.warranties.filter(w => w.isExpired).length;
  }

  // Modal Chi tiết bảo hành
  isDetailModalOpen = false;
  selectedWarrantyDetail: WarrantyItem | null = null;

  // Modal Gửi yêu cầu bảo hành
  isClaimModalOpen = false;
  isSubmitting = false;
  selectedItem: WarrantyItem | null = null;

  claimForm = {
    claimType: 'HOME',
    issueDescription: '',
    evidenceImageUrl: ''
  };

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    try {
      localStorage.removeItem('dcor_cache_warranties');
    } catch (_) {}

    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

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

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'expired') {
          this.activeFilter = 'EXPIRED';
        } else if (params['tab'] === 'all') {
          this.activeFilter = 'ALL';
        } else {
          this.activeFilter = 'ACTIVE';
        }

        const targetOrder = params['orderNumber'];
        if (targetOrder && this.warranties.length > 0) {
          const match = this.warranties.find(w => w.orderNumber === targetOrder);
          if (match) {
            this.openDetailModal(match);
          }
        }
        this.applyFilter();
        this.cdr.markForCheck();
      })
    );

    this.checkAndLoad();
  }

  private checkAndLoad(): void {
    if (this.canViewContent) {
      this.loadWarranties();
    } else {
      this.warranties = [];
      this.filteredWarranties = [];
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadWarranties(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();
    this.sub.add(
      this.customerService.getWarranties().subscribe({
        next: (data) => {
          this.warranties = data || [];
          this.applyFilter();
          this.isLoading = false;

          // Kiểm tra mở tự động nếu có query params
          const targetOrder = this.route.snapshot.queryParams['orderNumber'];
          if (targetOrder && this.warranties.length > 0) {
            const match = this.warranties.find(w => w.orderNumber === targetOrder);
            if (match) {
              this.openDetailModal(match);
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Không thể tải thông tin bảo hành.';
          this.warranties = [];
          this.filteredWarranties = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  onGuestPhoneVerified(phone: string): void {
    this.isPhoneVerified = true;
    this.warranties = [];
    this.filteredWarranties = [];
    this.errorMessage = '';
    this.loadWarranties();
    this.cdr.markForCheck();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.warranties = [];
    this.filteredWarranties = [];
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  setFilter(filter: 'ACTIVE' | 'EXPIRED' | 'ALL'): void {
    this.activeFilter = filter;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  applyFilter(): void {
    let list = this.warranties;

    // Lọc theo trạng thái thời hạn
    if (this.activeFilter === 'ACTIVE') {
      list = list.filter(w => !w.isExpired);
    } else if (this.activeFilter === 'EXPIRED') {
      list = list.filter(w => w.isExpired);
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(w => 
        (w.productName && w.productName.toLowerCase().includes(q)) ||
        (w.orderNumber && w.orderNumber.toLowerCase().includes(q)) ||
        (w.warrantyCode && w.warrantyCode.toLowerCase().includes(q)) ||
        (w.sku && w.sku.toLowerCase().includes(q))
      );
    }

    this.filteredWarranties = list;
  }

  onSearchChange(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  // --- MODAL CHI TIẾT BẢO HÀNH ---
  openDetailModal(item: WarrantyItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedWarrantyDetail = item;
    this.isDetailModalOpen = true;
    this.cdr.markForCheck();
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedWarrantyDetail = null;
    this.cdr.markForCheck();
  }

  openClaimFromDetail(): void {
    const item = this.selectedWarrantyDetail;
    this.closeDetailModal();
    if (item) {
      this.openClaimModal(item);
    }
  }

  // --- MODAL GỬI YÊU CẦU BẢO HÀNH ---
  openClaimModal(item: WarrantyItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedItem = item;
    this.claimForm = {
      claimType: 'HOME',
      issueDescription: '',
      evidenceImageUrl: ''
    };
    this.isClaimModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isClaimModalOpen = false;
    this.selectedItem = null;
    this.cdr.markForCheck();
  }

  submitClaim(): void {
    if (!this.selectedItem) return;
    if (!this.claimForm.issueDescription.trim()) {
      alert('Vui lòng mô tả chi tiết sự cố sản phẩm gặp phải.');
      return;
    }

    this.isSubmitting = true;
    const payload = {
      orderNumber: this.selectedItem.orderNumber,
      productName: this.selectedItem.productName,
      claimType: this.claimForm.claimType === 'HOME' ? 'Bảo hành tại nhà' : 'Mang đến Showroom',
      issueDescription: this.claimForm.issueDescription.trim(),
      evidenceImages: this.claimForm.evidenceImageUrl ? [this.claimForm.evidenceImageUrl.trim()] : []
    };

    this.sub.add(
      this.customerService.createWarrantyClaim(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeModal();
          this.successMessage = res.message || 'Tạo yêu cầu bảo hành thành công!';
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 5000);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(err.error?.message || 'Có lỗi xảy ra khi tạo yêu cầu bảo hành.');
          this.cdr.markForCheck();
        }
      })
    );
  }

  formatCurrency(val?: number): string {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
