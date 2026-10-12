import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { CartService } from '../../../../core/services/cart.service';
import { finalize, TimeoutError, timeout } from 'rxjs';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  product: CatalogProduct | null = null;
  isLoading = true;
  isAddingToCart = false;
  cartMessage = '';
  displayImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  async loadProduct(id: string) {
    this.isLoading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products/${id}`);
      if (!res.ok && res.status !== 404) {
        throw new Error(`Không thể tải sản phẩm (HTTP ${res.status}).`);
      }

      if (res.ok) {
        const data = await res.json();
        this.product = {
          ...data,
          category: typeof data.category === 'string'
            ? data.category
            : data.category?.name || ''
        };
        this.displayImages = data.images || [];
      } else {
        // MOCK data for demo if API fails
        this.product = {
          productId: id,
          shortDescription: 'Product Name',
          shortDescription_vi: 'Tên sản phẩm ' + id,
          category: 'Sofa',
          variantUrl: 'sofa-indivi',
          refinementColors: ['blue'],
          refinementMaterials: ['fabric'],
          images: ['https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png'],
          prices: [{ price: 45000000, formattedPrice: '45.000.000đ', currency: 'VND', isDefaultPrice: true }],
          lowestPrices: [],
          description_vi: 'Mô tả chi tiết sản phẩm.',
          variants: [{
            dimensions: { width: 200, depth: 90, height: 85, weight: 60 }
          }]
        };
        this.displayImages = this.product.images || [];
        // this.router.navigate(['/']);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      this.router.navigate(['/']);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get title() {
    if (!this.product) return '';
    return this.product.shortDescription_vi || this.product.shortDescription;
  }

  get displayCategory() {
    if (!this.product?.category) return 'Sản phẩm';
    const category = this.product.category;
    return typeof category === 'string'
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : 'Sản phẩm';
  }

  getProductPriceFormatted(prod: CatalogProduct) {
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }

  addToCart() {
    if (!this.product) return;

    if (!localStorage.getItem('dcor_customer_token')) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const variant = this.product.variants?.find(item =>
      item.isActive !== false && item.stock > item.reservedStock
    );
    if (!variant) {
      this.cartMessage = 'Sản phẩm hiện chưa có biến thể còn hàng để thêm vào giỏ.';
      return;
    }

    this.isAddingToCart = true;
    this.cartMessage = '';
    this.cartService.addToCart(variant.id, 1, variant.optionValues || {})
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.isAddingToCart = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cartMessage = 'Đã thêm sản phẩm vào giỏ hàng.';
        },
        error: (error: unknown) => {
          this.cartMessage = error instanceof TimeoutError
            ? 'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra lại kết nối rồi thử lại.'
            : error instanceof HttpErrorResponse
              ? error.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.'
              : 'Không thể thêm sản phẩm vào giỏ hàng.';
        }
      });
  }
}
