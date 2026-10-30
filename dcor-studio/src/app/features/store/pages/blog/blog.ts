import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
// Trigger Angular dev server re-bundle
import { IconComponent } from '../../../../shared/components/icon/icon';
import { 
  BlogService, 
  BlogArticle, 
  BlogCategory, 
  MarketingBanner, 
  SimpleProduct 
} from '../../../../core/services/blog.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css']
})
export class BlogComponent implements OnInit, OnDestroy {
  private subs = new Subscription();

  allArticles: BlogArticle[] = [];
  categories: BlogCategory[] = [];
  sidebarBanners: MarketingBanner[] = [];
  availableProducts: SimpleProduct[] = [];

  selectedCategory = 'ALL';
  searchQuery = '';
  activeArticle: BlogArticle | null = null;

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to articles
    this.subs.add(
      this.blogService.articles$.subscribe(items => {
        // Only show PUBLISHED articles on storefront
        this.allArticles = items.filter(a => a.status === 'PUBLISHED');
        
        // Check if there is an active slug in query params
        const slug = this.route.snapshot.queryParamMap.get('slug');
        if (slug) {
          const match = this.allArticles.find(a => a.slug === slug);
          if (match) this.activeArticle = match;
        }
      })
    );

    // 2. Subscribe to categories
    this.subs.add(
      this.blogService.categories$.subscribe(items => {
        this.categories = items.filter(c => c.status === 'ACTIVE');
      })
    );

    // 3. Subscribe to banners
    this.subs.add(
      this.blogService.banners$.subscribe(items => {
        this.sidebarBanners = items.filter(b => b.status === 'ACTIVE' && b.position === 'BLOG_SIDEBAR');
      })
    );

    // 4. Subscribe to available products reactively
    this.subs.add(
      this.blogService.products$.subscribe(prods => {
        if (prods && prods.length > 0) {
          this.availableProducts = prods;
        }
      })
    );

    // 5. Initial fetch of products
    this.availableProducts = this.blogService.getProducts();

    // 6. Watch query params changes
    this.subs.add(
      this.route.queryParams.subscribe(params => {
        if (params['slug']) {
          const match = this.allArticles.find(a => a.slug === params['slug']);
          if (match) {
            this.activeArticle = match;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          this.activeArticle = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get displayedArticles(): BlogArticle[] {
    let result = [...this.allArticles];

    if (this.selectedCategory !== 'ALL') {
      result = result.filter(a => a.categoryId === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }

  selectArticle(art: BlogArticle): void {
    this.activeArticle = art;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList(): void {
    this.activeArticle = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  filterByCategory(catId: string): void {
    this.selectedCategory = catId;
    this.activeArticle = null;
  }

  getRelatedProducts(ids?: string[]): SimpleProduct[] {
    const list = this.availableProducts && this.availableProducts.length > 0
      ? this.availableProducts
      : this.blogService.getProducts();

    if (!ids || ids.length === 0) {
      return list.slice(0, 3);
    }

    const matched = ids
      .map(id => list.find(p => p.id === id))
      .filter((p): p is SimpleProduct => !!p);

    if (matched.length > 0) {
      return matched;
    }

    // Fallback if legacy IDs don't match
    return list.slice(0, 3);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }
}
