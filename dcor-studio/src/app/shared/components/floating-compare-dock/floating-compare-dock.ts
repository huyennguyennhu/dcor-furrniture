import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CompareService } from '../../../core/services/compare.service';
import { IconComponent } from '../icon/icon';
import { ProductCompareModalComponent } from '../product-compare-modal/product-compare-modal';

@Component({
  selector: 'app-floating-compare-dock',
  standalone: true,
  imports: [CommonModule, IconComponent, ProductCompareModalComponent],
  templateUrl: './floating-compare-dock.html',
  styleUrls: ['./floating-compare-dock.css']
})
export class FloatingCompareDockComponent implements OnInit, OnDestroy {
  compareList: any[] = [];
  isCompareModalOpen = false;
  showClearCompareConfirmModal = false;

  get remainingPlaceholderSlots(): number[] {
    const count = Math.max(0, 5 - (this.compareList?.length || 0));
    return Array(count).fill(0);
  }

  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'info';
  private toastTimer: any = null;

  private subs: Subscription[] = [];

  constructor(
    public compareService: CompareService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subs.push(
      this.compareService.compareList$.subscribe(list => {
        this.compareList = list || [];
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.compareService.isCompareModalOpen$.subscribe(open => {
        this.isCompareModalOpen = open;
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.compareService.isConfirmClearOpen$.subscribe(open => {
        this.showClearCompareConfirmModal = open;
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.compareService.toast$.subscribe(t => {
        this.showToast(t.message, t.type);
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  getItemImage(item: any): string {
    if (!item) return '';
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (typeof item.images === 'string') return item.images;
    if (item.image) return item.image;
    if (Array.isArray(item.cardImages) && item.cardImages.length > 0) return item.cardImages[0];
    if (Array.isArray(item.galleryImages) && item.galleryImages.length > 0) return item.galleryImages[0];
    return '';
  }

  getRootCategoryName(item: any): string {
    return this.compareService.getRootCategoryName(item);
  }

  removeCompare(productId: string) {
    this.compareService.remove(productId);
  }

  confirmClearAllCompare() {
    this.compareService.openConfirmClear();
  }

  cancelClearAllCompare() {
    this.compareService.closeConfirmClear();
  }

  executeClearAllCompare() {
    this.compareService.clear();
  }

  copyCompareShareLink() {
    this.compareService.copyShareLink();
  }

  openCompareModal() {
    this.compareService.openModal();
  }

  closeCompareModal() {
    this.compareService.closeModal();
  }

  private showToast(message: string, type: 'success' | 'warning' | 'info') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3200);
  }
}
