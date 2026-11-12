import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ProductCardComponent } from '../../../../../shared/components/product-card/product-card';
import { AuthService } from '../../../../../core/services/auth.service';
import { QuickViewService } from '../../../../../core/services/quick-view.service';
import { BlogService, slugifyText } from '../services/blog.service';
import {
  BlogPostDetail,
  BlogComment,
  BlogRelatedPost,
  BlogTocItem,
  BlogHeadingBlock,
  BlogBlock,
  BlogProduct
} from '../models/blog.model';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent, ProductCardComponent],
  templateUrl: './blog-detail.html',
  styleUrls: ['./blog-detail.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly authService = inject(AuthService);
  public readonly quickViewService = inject(QuickViewService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  private sub?: Subscription;
  private scrollListener?: () => void;

  retryLoad(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadPost(slug);
    }
  }

  // Trạng thái bài viết
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly is404 = signal<boolean>(false);
  readonly suggestions = signal<BlogRelatedPost[]>([]);

  readonly post = signal<BlogPostDetail | null>(null);
  readonly toc = signal<BlogTocItem[]>([]);
  readonly activeHeadingId = signal<string>('');
  readonly isMobileTocOpen = signal<boolean>(false);

  // Like & Share
  readonly isLiked = signal<boolean>(false);
  readonly likesCount = signal<number>(0);
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error' | 'info'>('info');
  private toastTimer?: any;

  // Lightbox xem ảnh
  readonly lightboxUrl = signal<string | null>(null);
  readonly lightboxCaption = signal<string | null>(null);
  readonly lightboxZoom = signal<number>(1);

  // Bình luận
  readonly comments = signal<BlogComment[]>([]);
  readonly isLoadingComments = signal<boolean>(false);
  readonly commentContent = signal<string>('');
  readonly isSubmittingComment = signal<boolean>(false);

  // Modal xác nhận xóa bình luận
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly deletingCommentId = signal<string | null>(null);
  readonly isDeletingComment = signal<boolean>(false);

  // Computed
  readonly isAuthenticated = computed<boolean>(() => this.authService.isAuthenticated());
  readonly currentUrl = computed<string>(() => this.router.url);

  // Sản phẩm liên quan (1 hàng 4 sản phẩm & xem thêm xổ xuống giống PDP)
  readonly RELATED_ROW_SIZE = 4;
  readonly isRelatedExpanded = signal<boolean>(false);

  readonly articleProducts = computed<any[]>(() => {
    const p = this.post();
    if (!p) return [];
    let list: BlogProduct[] = [];
    if (Array.isArray(p.products) && p.products.length > 0) {
      list = p.products;
    } else {
      const prodBlocks = (p.blocks || []).filter(b => b.type === 'products') as any[];
      const ids = prodBlocks.flatMap(b => b.productIds || []);
      list = this.getProductsForBlock(ids);
    }

    return list.map(item => ({
      ...item,
      productId: item.id,
      slug: (item as any).slug || item.id,
      displayName: item.name,
      shortDescription: item.name,
      price: item.price,
      basePrice: item.price,
      images: item.image ? [item.image] : [],
      cardImages: item.image ? [item.image] : [],
      category: 'Nội thất DCor'
    }));
  });

  readonly articleProductsTitle = computed<string>(() => {
    const p = this.post();
    if (!p) return 'Sản phẩm liên quan';
    const prodBlock = (p.blocks || []).find(b => b.type === 'products') as any;
    return prodBlock?.title || 'Sản phẩm liên quan';
  });

  readonly displayedRelatedProducts = computed<any[]>(() => {
    const prods = this.articleProducts();
    if (this.isRelatedExpanded()) {
      return prods;
    }
    return prods.slice(0, this.RELATED_ROW_SIZE);
  });

  toggleRelatedExpansion(): void {
    this.isRelatedExpanded.update(v => !v);
    if (!this.isRelatedExpanded() && typeof document !== 'undefined') {
      const el = document.getElementById('pdp-related-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  onQuickViewClick(event: Event, prod: any): void {
    event.stopPropagation();
    event.preventDefault();
    const catalogProd: any = {
      id: prod.productId || prod.id,
      productId: prod.productId || prod.id,
      name: prod.displayName || prod.name,
      shortDescription: prod.shortDescription || prod.name,
      price: prod.price,
      basePrice: prod.basePrice || prod.price,
      images: prod.images || (prod.image ? [prod.image] : []),
      image: prod.image || prod.images?.[0],
      cardImages: prod.cardImages || (prod.image ? [prod.image] : [])
    };
    this.quickViewService.open(catalogProd);
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadPost(slug);
      }
    });

    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadPost(slug: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.is404.set(false);
    this.suggestions.set([]);
    this.post.set(null);
    this.toc.set([]);

    this.blogService.getPostBySlug(slug).subscribe({
      next: (data) => {
        // Gắn id cho các block heading để liên kết mục lục
        const tocItems: BlogTocItem[] = [];
        const processedBlocks: BlogBlock[] = (data.blocks || []).map((block, idx) => {
          if (block.type === 'heading' && block.text) {
            const headingId = `heading-${idx}-${slugifyText(block.text)}`;
            tocItems.push({
              id: headingId,
              text: block.text,
              level: block.level
            });
            return {
              ...block,
              id: headingId
            } as BlogHeadingBlock;
          }
          return block;
        });

        const fullPost: BlogPostDetail = {
          ...data,
          blocks: processedBlocks
        };

        this.post.set(fullPost);
        this.toc.set(tocItems);
        if (tocItems.length > 0) {
          this.activeHeadingId.set(tocItems[0].id);
        }
        this.isLiked.set(Boolean(data.viewer?.liked));
        this.likesCount.set(data.likesCount || 0);
        this.isLoading.set(false);

        // Cập nhật Document title và Meta
        this.titleService.setTitle(`${data.title} | Blog & Cảm hứng DCor`);
        const desc = data.seoDescription || data.excerpt || `${data.title} - DCor Furniture Blog`;
        this.metaService.updateTag({ name: 'description', content: desc });
        this.metaService.updateTag({ property: 'og:title', content: data.title });
        this.metaService.updateTag({ property: 'og:description', content: desc });
        if (data.coverImageUrl) {
          this.metaService.updateTag({ property: 'og:image', content: data.coverImageUrl });
        }

        // Tải danh sách bình luận
        this.loadComments(slug);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 404) {
          this.is404.set(true);
          this.suggestions.set(err.error?.suggestions || []);
          this.errorMessage.set(err.error?.message || 'Bài viết không tồn tại hoặc chưa được công khai.');
        } else {
          this.errorMessage.set(this.blogService.formatError(err, 'Không thể tải chi tiết bài viết.'));
        }
      }
    });
  }

  loadComments(slug: string): void {
    this.isLoadingComments.set(true);
    this.blogService.getComments(slug, 1, 50).subscribe({
      next: (res) => {
        this.comments.set(res.items || []);
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.isLoadingComments.set(false);
      }
    });
  }

  setupScrollSpy(): void {
    this.scrollListener = () => {
      const items = this.toc();
      if (!items.length) return;

      const scrollPos = window.scrollY + 120;
      let currentId = items[0].id;

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (scrollPos >= top - 20) {
            currentId = item.id;
          }
        }
      }

      this.activeHeadingId.set(currentId);
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  scrollToHeading(id: string): void {
    this.activeHeadingId.set(id);
    this.isMobileTocOpen.set(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleMobileToc(): void {
    this.isMobileTocOpen.update(v => !v);
  }

  toggleLike(): void {
    if (!this.isAuthenticated()) {
      const returnUrl = this.currentUrl();
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    const currentPost = this.post();
    if (!currentPost) return;

    const prevLiked = this.isLiked();
    const prevCount = this.likesCount();

    // Cập nhật tức thì (Optimistic update)
    this.isLiked.set(!prevLiked);
    this.likesCount.set(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    this.blogService.likePost(currentPost.slug).subscribe({
      next: (res) => {
        this.isLiked.set(res.liked);
        this.likesCount.set(res.likesCount);
      },
      error: (err) => {
        // Hoàn lại nếu lỗi
        this.isLiked.set(prevLiked);
        this.likesCount.set(prevCount);
        this.showToast(this.blogService.formatError(err, 'Không thể cập nhật lượt thích.'), 'error');
      }
    });
  }

  copyShareLink(): void {
    const url = window.location.href;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          this.showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
        })
        .catch(() => {
          this.fallbackCopyText(url);
        });
    } else {
      this.fallbackCopyText(url);
    }
  }

  private fallbackCopyText(text: string): void {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('Đã sao chép liên kết!', 'success');
    } catch {
      this.showToast('Không thể tự động sao chép. Vui lòng copy URL trên thanh địa chỉ.', 'info');
    }
  }

  submitComment(): void {
    if (!this.isAuthenticated()) {
      const returnUrl = this.currentUrl();
      this.router.navigate(['/login'], { queryParams: { returnUrl } });
      return;
    }

    const content = this.commentContent().trim();
    if (!content) {
      this.showToast('Vui lòng nhập nội dung bình luận.', 'error');
      return;
    }

    if (content.length > 500) {
      this.showToast('Nội dung bình luận không được vượt quá 500 ký tự.', 'error');
      return;
    }

    const currentPost = this.post();
    if (!currentPost) return;

    this.isSubmittingComment.set(true);

    this.blogService.createComment(currentPost.slug, content).subscribe({
      next: (res) => {
        this.isSubmittingComment.set(false);
        this.commentContent.set('');
        this.comments.update(list => [res.comment, ...list]);
        this.post.update(p => p ? { ...p, commentCount: (p.commentCount || 0) + 1 } : null);
        this.showToast('Bình luận của bạn đã được đăng thành công!', 'success');
      },
      error: (err) => {
        this.isSubmittingComment.set(false);
        this.showToast(this.blogService.formatError(err, 'Không thể gửi bình luận.'), 'error');
      }
    });
  }

  openDeleteCommentModal(commentId: string): void {
    this.deletingCommentId.set(commentId);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deletingCommentId.set(null);
  }

  executeDeleteComment(): void {
    const id = this.deletingCommentId();
    if (!id) return;

    this.isDeletingComment.set(true);
    this.blogService.deleteComment(id).subscribe({
      next: () => {
        this.isDeletingComment.set(false);
        this.closeDeleteModal();
        this.comments.update(list => list.filter(c => c.id !== id));
        this.post.update(p => p ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) } : null);
        this.showToast('Đã xóa bình luận thành công.', 'success');
      },
      error: (err) => {
        this.isDeletingComment.set(false);
        this.showToast(this.blogService.formatError(err, 'Không thể xóa bình luận.'), 'error');
      }
    });
  }

  openLightbox(url: string, caption?: string): void {
    this.lightboxUrl.set(url);
    this.lightboxCaption.set(caption || null);
    this.lightboxZoom.set(1);
  }

  closeLightbox(): void {
    this.lightboxUrl.set(null);
    this.lightboxCaption.set(null);
    this.lightboxZoom.set(1);
  }

  zoomIn(e?: Event): void {
    e?.stopPropagation();
    this.lightboxZoom.update(z => Math.min(2.5, +(z + 0.25).toFixed(2)));
  }

  zoomOut(e?: Event): void {
    e?.stopPropagation();
    this.lightboxZoom.update(z => Math.max(0.75, +(z - 0.25).toFixed(2)));
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  formatDateTime(dateString?: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return `${d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  }

  formatVnd(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  }

  getProductsForBlock(productIds: string[]): BlogProduct[] {
    const allProducts = this.post()?.products || [];
    if (!productIds || !productIds.length) return [];
    return allProducts.filter(p => productIds.includes(p.id));
  }
}
