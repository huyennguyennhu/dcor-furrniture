import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: any[] = [];

  ngOnInit() {
    this.wishlistItems = [
      {
        id: 'prod-2',
        name: 'Bàn ăn Osaka',
        image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/41252001_2733503_PNG-Web2072dpi.png',
        price: 25000000
      }
    ];
  }

  formatCurrency(val: number) {
    return val.toLocaleString('vi-VN') + ' ₫';
  }

  removeFromWishlist(index: number) {
    this.wishlistItems.splice(index, 1);
  }
}

