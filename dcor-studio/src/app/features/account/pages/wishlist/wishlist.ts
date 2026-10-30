import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Check, Heart, ShoppingCart } from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { WishlistService, WishlistItem } from '../../../../core/services/wishlist.service';
import { CartService } from '../../../../core/services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, AccountSidebarComponent],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  readonly icons = { Check, Heart, ShoppingCart };

  wishlistItems: WishlistItem[] = [];
  toastMessage = '';
  private sub = new Subscription();

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.wishlistService.wishlist$.subscribe(items => {
        this.wishlistItems = items;
      })
    );
  }

  formatCurrency(val: number): string {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  removeFromWishlist(item: WishlistItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.wishlistService.removeFromWishlist(item.productId);
    this.showToast(`Đã bỏ "${item.name}" khỏi danh sách yêu thích.`);
  }

  addToCart(item: WishlistItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.cartService.addToCart(
      item.variantId || 'default',
      1,
      null,
      {
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image
      }
    ).subscribe({
      next: () => {
        this.showToast(`Đã thêm "${item.name}" vào giỏ hàng!`);
      },
      error: () => {
        this.showToast(`Không thể thêm vào giỏ hàng. Vui lòng thử lại.`);
      }
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
