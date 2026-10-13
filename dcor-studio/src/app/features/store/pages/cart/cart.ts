import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../../core/services/cart.service';
import { VariantEditModalComponent } from '../../../../shared/components/variant-edit-modal/variant-edit-modal';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, VariantEditModalComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  loading = true;
  selectedItems: Set<string> = new Set();

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.loading = false;
      // Mặc định chọn tất cả
      items.forEach(item => this.selectedItems.add(item.id));
    });
    this.cartService.loadCart();
  }

  get groupedCart() {
    const groups: { productId: string; name: string; items: { item: CartItem }[] }[] = [];
    for (let i = this.cartItems.length - 1; i >= 0; i--) {
      const item = this.cartItems[i];
      let group = groups.find(g => g.productId === item.productId);
      if (!group) {
        group = { productId: item.productId, name: item.name, items: [] };
        groups.push(group);
      }
      group.items.push({ item });
    }
    return groups;
  }

  // --- Logic Selection ---
  toggleItem(itemId: string) {
    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.add(itemId);
    }
  }

  toggleGroup(group: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    group.items.forEach((gItem: any) => {
      if (isChecked) {
        this.selectedItems.add(gItem.item.id);
      } else {
        this.selectedItems.delete(gItem.item.id);
      }
    });
  }

  isGroupSelected(group: any): boolean {
    return group.items.length > 0 && group.items.every((gItem: any) => this.selectedItems.has(gItem.item.id));
  }

  get selectedCartItems() {
    return this.cartItems.filter(item => this.selectedItems.has(item.id));
  }

  // --- Tính toán dựa trên hàng đã chọn ---
  get subTotal() {
    return this.selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shippingFee() {
    return this.subTotal > 50000000 || this.subTotal === 0 ? 0 : 250000;
  }

  get totalAmount() {
    return this.subTotal + this.shippingFee;
  }

  get totalItemsCount() {
    return this.selectedCartItems.reduce((a, b) => a + b.quantity, 0);
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
    this.cartService.removeFromCart(id).subscribe(() => {
      this.selectedItems.delete(id);
    });
  }

  // --- Modal Logic ---
  isVariantModalOpen = false;
  selectedItemToEdit: CartItem | null = null;

  editVariant(item: CartItem) {
    this.selectedItemToEdit = item;
    this.isVariantModalOpen = true;
  }

  handleSaveVariant(newOptions: { legId?: string, upholsteryId?: string }) {
    if (!this.selectedItemToEdit) return;
    
    // Ở đây sẽ gọi API cập nhật biến thể của Item trong Cart
    console.log('Update Cart Item', this.selectedItemToEdit.id, 'with options:', newOptions);
    // Tạm thời gọi API load lại hoặc cập nhật local để test
    
    this.isVariantModalOpen = false;
    this.selectedItemToEdit = null;
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
