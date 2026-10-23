import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService, SummaryProductItem } from '../../services/room-planner.service';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="6" fill="%23f3f4f6"/><path d="M25 50 L38 35 L48 44 L60 30 L68 50 Z" fill="%23cbd5e1"/><circle cx="34" cy="28" r="5" fill="%23cbd5e1"/></svg>';

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './summary-panel.html',
  styleUrls: ['./summary-panel.css']
})
export class SummaryPanelComponent {
  constructor(public plannerService: RoomPlannerService) {}

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price || 0) + ' ₫';
  }

  // Chọn sản phẩm trên canvas khi bấm vào danh sách tóm tắt
  selectItem(item: SummaryProductItem): void {
    if (item.objectIds.length > 0) {
      this.plannerService.selectObject(item.objectIds[0]);
    }
  }

  isItemSelected(item: SummaryProductItem): boolean {
    const selId = this.plannerService.selectedObjectId();
    return !!selId && item.objectIds.includes(selId);
  }

  removeProduct(e: Event, item: SummaryProductItem): void {
    e.stopPropagation();
    this.plannerService.deleteByProductId(item.productId);
  }

  handleClearAll(): void {
    if (this.plannerService.totalItemsCount() === 0) return;
    this.plannerService.clearAll();
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  }
}
