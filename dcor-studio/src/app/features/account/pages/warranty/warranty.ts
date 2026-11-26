import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
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
  Phone,
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Check,
  Copy,
  Sparkles,
  Search
} from 'lucide-angular';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { CustomerService, WarrantyItem } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, skip } from 'rxjs';

@Component({
  selector: 'app-account-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, GuestPhoneBannerComponent],
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
    Phone,
    X,
    Calendar,
    Clock,
    MapPin,
    FileText,
    Check,
    Copy,
    Sparkles
  };

  warranties: WarrantyItem[] = [];
  filteredWarranties: WarrantyItem[] = [];
  isLoading = false;
  activeFilter: 'ACTIVE' | 'EXPIRED' | 'ALL' = 'ALL';
  searchQuery = '';
  private _errorMessage = '';
  private alertTimer: ReturnType<typeof setTimeout> | null = null;

  get errorMessage(): string {
    return this._errorMessage;
  }

  set errorMessage(val: string) {
    this._errorMessage = val;
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    if (this._errorMessage) {
      this.alertTimer = setTimeout(() => {
        this._errorMessage = '';
        this.alertTimer = null;
        this.triggerRender();
      }, 4000);
    }
  }
  copiedKey = signal<string>('');
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

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

  // Modal Chi tiết thẻ bảo hành (chỉ tra cứu)
  isDetailModalOpen = false;
  selectedWarrantyDetail: WarrantyItem | null = null;

  private sub = new Subscription();
  private warrantiesReqSub?: Subscription;
  private isDestroyed = false;
  private isViewReady = false;

  private triggerRender(): void {
    if (!this.isDestroyed && this.isViewReady) {
      this.cdr.detectChanges();
    }
  }

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
      this.authService.user$.pipe(skip(1)).subscribe(user => {
        this.isLoggedIn = !!user;
        this.checkAndLoad();
        this.triggerRender();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.pipe(skip(1)).subscribe(phone => {
        this.isPhoneVerified = !!phone;
        this.checkAndLoad();
        this.triggerRender();
      })
    );

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab'] === 'expired') {
          this.activeFilter = 'EXPIRED';
        } else if (params['tab'] === 'active') {
          this.activeFilter = 'ACTIVE';
        } else {
          this.activeFilter = 'ALL';
        }

        const targetOrder = params['orderNumber'];
        if (targetOrder && this.warranties.length > 0) {
          const match = this.warranties.find(w => w.orderNumber === targetOrder);
          if (match) {
            this.openDetailModal(match);
          }
        }
        this.applyFilter();
        this.triggerRender();
      })
    );

    this.checkAndLoad();
    this.isViewReady = true;
  }

  private checkAndLoad(): void {
    if (this.canViewContent) {
      this.loadWarranties();
    } else {
      this.warrantiesReqSub?.unsubscribe();
      this.warranties = [];
      this.filteredWarranties = [];
      this.isLoading = false;
      this.triggerRender();
    }
  }

  loadWarranties(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.triggerRender();
      return;
    }
    this.warrantiesReqSub?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';
    this.triggerRender();

    this.warrantiesReqSub = this.customerService.getWarranties().subscribe({
      next: (data) => {
        this.warranties = (data || []).map(w => ({
          ...w,
          imageUrl: w.imageUrl && !w.imageUrl.includes('dsasf753c') ? w.imageUrl : ''
        }));
        this.applyFilter();
        this.isLoading = false;

        const targetOrder = this.route.snapshot.queryParams['orderNumber'];
        if (targetOrder && this.warranties.length > 0) {
          const match = this.warranties.find(w => w.orderNumber === targetOrder);
          if (match) {
            this.openDetailModal(match);
          }
        }
        this.triggerRender();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Không thể tải thông tin bảo hành.';
        this.warranties = [];
        this.filteredWarranties = [];
        this.isLoading = false;
        this.triggerRender();
      }
    });
  }

  onGuestPhoneVerified(_phone: string): void {
    this.isPhoneVerified = true;
    this.warranties = [];
    this.filteredWarranties = [];
    this.errorMessage = '';
    this.loadWarranties();
    this.triggerRender();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.warrantiesReqSub?.unsubscribe();
    this.warranties = [];
    this.filteredWarranties = [];
    this.isLoading = false;
    this.triggerRender();
  }

  setFilter(filter: 'ACTIVE' | 'EXPIRED' | 'ALL'): void {
    this.activeFilter = filter;
    this.applyFilter();
    this.triggerRender();
  }

  applyFilter(): void {
    let list = this.warranties;

    if (this.activeFilter === 'ACTIVE') {
      list = list.filter(w => !w.isExpired);
    } else if (this.activeFilter === 'EXPIRED') {
      list = list.filter(w => w.isExpired);
    }

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
    this.triggerRender();
  }

  copyWarrantyCode(code: string | undefined, key: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (!code) return;
    const markCopied = () => {
      if (this.copyResetTimer) {
        clearTimeout(this.copyResetTimer);
      }
      this.copiedKey.set(key);
      this.triggerRender();
      this.copyResetTimer = setTimeout(() => {
        if (this.copiedKey() === key) {
          this.copiedKey.set('');
          this.triggerRender();
        }
        this.copyResetTimer = null;
      }, 1800);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(markCopied).catch(() => {
        this.fallbackCopyText(code);
        markCopied();
      });
    } else {
      this.fallbackCopyText(code);
      markCopied();
    }
  }

  private fallbackCopyText(text: string): void {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  openDetailModal(item: WarrantyItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedWarrantyDetail = item;
    this.isDetailModalOpen = true;
    this.triggerRender();
  }

  onImageError(item: WarrantyItem): void {
    if (item && item.imageUrl) {
      item.imageUrl = '';
      this.triggerRender();
    }
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedWarrantyDetail = null;
    this.triggerRender();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
      this.copyResetTimer = null;
    }
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    this.warrantiesReqSub?.unsubscribe();
    this.sub.unsubscribe();
  }
}
