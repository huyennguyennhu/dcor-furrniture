import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-drawer.html'
})
export class CartDrawerComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  cartItems: CartItem[] = [];

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
    this.cartService.loadCart();
  }

  get subTotal() {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shippingFee() {
    return this.subTotal > 50000000 ? 0 : 250000;
  }

  get totalAmount() {
    return this.subTotal + this.shippingFee;
  }
  
  get totalItemsCount() {
    return this.cartItems.reduce((a, b) => a + b.quantity, 0);
  }

  formatCurrency(val: number) {
    return val.toLocaleString('vi-VN') + ' ₫';
  }

  updateQuantity(id: string, newQty: number) {
    if (newQty < 1) {
      this.removeFromCart(id);
    } else {
      this.cartService.updateQuantity(id, newQty).subscribe();
    }
  }

  removeFromCart(id: string) {
    this.cartService.removeFromCart(id).subscribe();
  }

  closeDrawer() {
    this.isOpen = false;
    this.close.emit();
  }

  goToCheckout() {
    this.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
