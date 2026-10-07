import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variantTags?: {label: string, value: string}[];
  leg?: any;
  upholstery?: any;
}

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

  constructor(private router: Router) {}

  ngOnInit() {
    // MOCK data. In real app, load from LocalStorage or CartService/Store
    this.cartItems = [
      {
        productId: 'prod-1',
        name: 'Sofa Indivi 3 chỗ',
        image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png',
        price: 45000000,
        quantity: 1,
        variantTags: [{ label: 'Màu', value: 'Xám đậm' }]
      }
    ];
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

  updateQuantity(index: number, newQty: number) {
    if (newQty < 1) {
      this.removeFromCart(index);
    } else {
      this.cartItems[index].quantity = newQty;
    }
  }

  removeFromCart(index: number) {
    this.cartItems.splice(index, 1);
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
