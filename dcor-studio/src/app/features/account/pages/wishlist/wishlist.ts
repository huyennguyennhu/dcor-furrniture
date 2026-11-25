import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Heart, Sparkles, ShoppingBag } from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ProductService } from '../../../../core/services/product.service';
import { Subscription, skip } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, AccountSidebarComponent, ProductCardComponent],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  readonly icons = { Heart, Sparkles, ShoppingBag };

  wishlistProducts: any[] = [];
  isLoading = true;
  private sub = new Subscription();

  constructor(
    private wishlistService: WishlistService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWishlistProducts();

    // Tự động đồng bộ thời gian thực khi danh sách yêu thích thay đổi
    this.sub.add(
      this.wishlistService.wishlist$.pipe(skip(1)).subscribe(() => {
        this.loadWishlistProducts();
      })
    );
  }

  async loadWishlistProducts(): Promise<void> {
    const rawList = this.wishlistService.currentWishlist || [];
    if (rawList.length === 0) {
      this.wishlistProducts = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      // 1. Lấy toàn bộ sản phẩm thực tế từ ProductService để card có đầy đủ thông tin chuẩn 100%
      const allProducts = await this.productService.getProducts();
      const productMap = new Map<string, any>();
      for (const p of allProducts) {
        if (p.id) productMap.set(p.id, p);
        if (p.slug) productMap.set(p.slug, p);
      }

      this.wishlistProducts = rawList.map(item => {
        const id = this.wishlistService.getId(item);
        const catalogProd = productMap.get(id);
        if (catalogProd) {
          return catalogProd;
        }
        // Nếu không tìm thấy trong catalog (ví dụ data cũ hoặc mock): fallback dùng chính object đã lưu
        if (typeof item === 'object') {
          return {
            ...item,
            id: id,
            productId: id,
            name: item.name || item.title || ('Sản phẩm #' + id.slice(0, 8)),
            price: item.price || item.basePrice || 0,
            cardImages: item.cardImages || item.images || (item.image ? [item.image] : [])
          };
        }
        return null;
      }).filter(Boolean);
    } catch (err) {
      // Fallback nếu không có kết nối mạng: dùng các object đã lưu trong localStorage
      this.wishlistProducts = rawList.map(item => {
        if (typeof item === 'object') {
          const id = this.wishlistService.getId(item);
          return {
            ...item,
            id,
            productId: id,
            name: item.name || item.title || ('Sản phẩm #' + id.slice(0, 8)),
            price: item.price || 0,
            cardImages: item.cardImages || item.images || (item.image ? [item.image] : [])
          };
        }
        return null;
      }).filter(Boolean);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  trackByProductId(index: number, item: any): string {
    return item?.id || item?.productId || index.toString();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
