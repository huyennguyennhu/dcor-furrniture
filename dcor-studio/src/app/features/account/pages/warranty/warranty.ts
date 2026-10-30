import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, CheckCircle2, ShieldCheck, Shield, Package, AlertCircle, Wrench, Phone, X } from 'lucide-angular';
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
    ShieldCheck,
    Shield,
    Package,
    AlertCircle,
    Wrench,
    Phone,
    X
  };

  warranties: WarrantyItem[] = [];
  filteredWarranties: WarrantyItem[] = [];
  isLoading = false;
  activeFilter = 'ALL';
  errorMessage = '';
  successMessage = '';

  isLoggedIn = false;
  isPhoneVerified = false;

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  // Claim Modal
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Xóa sạch cache bảo hành cũ nếu có
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

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'ALL') {
      this.filteredWarranties = [...this.warranties];
    } else if (this.activeFilter === 'ACTIVE') {
      this.filteredWarranties = this.warranties.filter(w => !w.isExpired);
    } else if (this.activeFilter === 'EXPIRED') {
      this.filteredWarranties = this.warranties.filter(w => w.isExpired);
    }
  }

  openClaimModal(item: WarrantyItem): void {
    this.selectedItem = item;
    this.claimForm = {
      claimType: 'HOME',
      issueDescription: '',
      evidenceImageUrl: ''
    };
    this.isClaimModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.isClaimModalOpen = false;
    this.selectedItem = null;
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
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.isSubmitting = false;
          alert(err.error?.message || 'Có lỗi xảy ra khi tạo yêu cầu bảo hành.');
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
