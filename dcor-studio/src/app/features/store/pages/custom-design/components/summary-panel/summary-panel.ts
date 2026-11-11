import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService, SummaryProductItem } from '../../services/room-planner.service';
import { CartService, CartItem } from '../../../../../../core/services/cart.service';
import { environment } from '../../../../../../../environments/environment';

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
  isAddingToCart = signal<boolean>(false);
  addedSuccess = signal<boolean>(false);

  constructor(
    public plannerService: RoomPlannerService,
    private cartService: CartService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

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

  /**
   * Thêm toàn bộ sản phẩm trong phòng vào giỏ hàng
   */
  async addAllToCart(): Promise<void> {
    const items = this.plannerService.summaryItems();
    if (items.length === 0 || this.isAddingToCart()) return;

    this.isAddingToCart.set(true);
    this.addedSuccess.set(false);

    try {
      for (const item of items) {
        let variantId = item.variantId;

        // Nếu chưa có variantId chuẩn hoặc trùng với productId, cố gắng tra cứu nhanh từ API
        if (!variantId || variantId === item.productId) {
          try {
            const res = await firstValueFrom(
              this.http.get<any>(`${environment.apiUrl}/products/${item.productId}`).pipe(timeout(3000))
            );
            if (res?.variants?.[0]?.id) {
              variantId = res.variants[0].id;
              item.variantId = variantId;
            }
          } catch {
            variantId = item.variantId || item.productId;
          }
        }

        const guestProductInfo: Partial<CartItem> = {
          productId: item.productId,
          name: item.name,
          image: item.imageUrl,
          price: item.unitPrice,
          quantity: item.count,
          availableStock: 99,
          isActive: true
        };

        try {
          await firstValueFrom(
            this.cartService.addToCart(variantId || item.productId, item.count, undefined, guestProductInfo).pipe(timeout(6000))
          );
        } catch (itemErr) {
          console.warn('Lỗi khi thêm 1 sản phẩm vào giỏ, tiếp tục sản phẩm khác:', itemErr);
        }
      }

      // Làm mới dữ liệu giỏ hàng để Header và Cart Drawer nhận được danh sách mới nhất
      try {
        await firstValueFrom(this.cartService.loadCart().pipe(timeout(4000)));
      } catch {}

      this.addedSuccess.set(true);

      // Kích hoạt mở thanh Cart Drawer để khách hàng thấy ngay sản phẩm đã vào giỏ hàng
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dcor-open-cart'));
      }

      setTimeout(() => {
        this.addedSuccess.set(false);
        this.cdr.markForCheck();
      }, 3000);
    } catch (err) {
      console.error('Lỗi khi thêm danh sách sản phẩm vào giỏ hàng:', err);
    } finally {
      this.isAddingToCart.set(false);
      this.cdr.markForCheck();
    }
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  }
}
