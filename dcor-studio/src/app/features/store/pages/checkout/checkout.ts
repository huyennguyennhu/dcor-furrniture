import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];

  // Trạng thái Form giao hàng
  fullName = '';
  phone = '';
  email = '';
  address = '';
  notes = '';

  // Trạng thái Gift Order
  isGift = false;
  giftReceiver = '';
  giftPhone = '';
  giftAddress = '';
  giftMessage = '';
  hidePrice = false;

  // Phương thức thanh toán
  paymentMethod = 'COD';

  constructor(private router: Router) {}

  ngOnInit() {
    // MOCK data for cart
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

  get groupedCart() {
    const groups: { productId: string; name: string; items: { item: CartItem, originalIndex: number }[] }[] = [];
    for (let i = this.cartItems.length - 1; i >= 0; i--) {
      const item = this.cartItems[i];
      let group = groups.find(g => g.productId === item.productId);
      if (!group) {
        group = { productId: item.productId, name: item.name, items: [] };
        groups.push(group);
      }
      group.items.push({ item, originalIndex: i });
    }
    return groups;
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

  handleSubmit(e: Event) {
    e.preventDefault();
    const randomOrderId = 'DC-' + Math.floor(100000 + Math.random() * 900000);
    this.router.navigate(['/order-success', randomOrderId]);
  }
}

