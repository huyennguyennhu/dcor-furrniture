import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CatalogProduct } from '../../../../shared/models/catalog.model';

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
  displayImages: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
      if (res.ok) {
        const data = await res.json();
        this.product = data;
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
    return this.product.category.charAt(0).toUpperCase() + this.product.category.slice(1);
  }

  getProductPriceFormatted(prod: CatalogProduct) {
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }
}

