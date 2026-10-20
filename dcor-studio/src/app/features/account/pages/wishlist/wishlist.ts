import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistItems: any[] = [];
  isLoading = false;
  private wishlistSub?: Subscription;

  constructor(
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.wishlistSub = this.wishlistService.wishlist$.subscribe(ids => {
      this.loadWishlistProducts(ids);
    });
  }

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
  }

  async loadWishlistProducts(ids: string[]) {
    if (!ids || ids.length === 0) {
      this.wishlistItems = [];
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products`);
      if (res.ok) {
        const data = await res.json();
        const allProds = Array.isArray(data) ? data : (data.data || []);
        this.wishlistItems = allProds
          .filter((p: any) => ids.includes(p.id) || ids.includes(p.productId))
          .map((p: any) => ({
            id: p.id || p.productId,
            name: p.name || 'Sản phẩm DCor',
            image: Array.isArray(p.images) && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
            price: p.basePrice || 0
          }));
      }
    } catch (err) {
      console.error('Lỗi tải sản phẩm yêu thích:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  formatCurrency(val: number) {
    return val.toLocaleString('vi-VN') + ' ₫';
  }

  removeFromWishlist(index: number) {
    const item = this.wishlistItems[index];
    if (item) {
      this.wishlistService.remove(item.id);
    }
  }
}

