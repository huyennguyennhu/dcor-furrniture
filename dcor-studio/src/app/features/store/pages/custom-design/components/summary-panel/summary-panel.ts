import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService, SummaryProductItem } from '../../services/room-planner.service';

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
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
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
}
