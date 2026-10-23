import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IconComponent } from '../../../../shared/components/icon/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { environment } from '../../../../../environments/environment';
import { DesignPost, PostComment, TaggedProduct } from './models/community.model';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent],
  templateUrl: './community.html',
  styleUrls: ['./community.css']
})
export class CommunityComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

  // State signals
  posts = signal<DesignPost[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  searchQuery = signal<string>('');
  
  // Detail Modal / Drawer state
  activePost = signal<DesignPost | null>(null);
  isDetailOpen = signal<boolean>(false);
  activePinIndex = signal<number | null>(null);

  // Comment state
  newCommentContent = signal<string>('');
  isSubmittingComment = signal<boolean>(false);
  commentError = signal<string | null>(null);

  // Toast notifications
  toastMessage = signal<string | null>(null);
  private toastTimer: any = null;

  // Cart action state
  addingToCartProductId = signal<string | null>(null);

  // Search debounce subject
  private searchSubject = new Subject<string>();

  // Computed properties
  currentUser = computed(() => this.authService.getCurrentUser());
  isLoggedIn = computed(() => this.authService.isAuthenticated());

  // Visible comments in active post
  activeComments = computed<PostComment[]>(() => {
    const post = this.activePost();
    if (!post || !Array.isArray(post.comments)) return [];
    return post.comments.filter(c => c.status !== 'HIDDEN');
  });

  ngOnInit(): void {
    // Set up search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(query => {
        this.fetchPosts(query);
      });

    // Initial fetch
    this.fetchPosts('');

    // Listen to query param ?post=<id> for deep linking / sharing
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const postId = params['post'];
        if (postId) {
          this.handleOpenPostFromQuery(postId);
        } else if (this.isDetailOpen()) {
          this.closeDetail(false);
        }
      });
  }

  // Fetch published posts
  fetchPosts(search: string = ''): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    let url = `${environment.apiUrl}/designs/posts?status=PUBLISHED`;
    const trimmed = search.trim();
    if (trimmed) {
      url += `&search=${encodeURIComponent(trimmed)}`;
    }

    this.http.get<DesignPost[]>(url).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        // Client-side guarantee: filter only PUBLISHED posts and sort newest first
        const validPosts = (Array.isArray(data) ? data : [])
          .filter(p => p.status === 'PUBLISHED')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        this.posts.set(validPosts);

        // Check if query param ?post= is pending to open
        const queryPostId = this.route.snapshot.queryParams['post'];
        if (queryPostId && !this.activePost()) {
          this.handleOpenPostFromQuery(queryPostId);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.formatErrorMessage(err));
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  retry(): void {
    this.fetchPosts(this.searchQuery());
  }

  // Open detail modal / drawer and sync URL
  openDetail(post: DesignPost): void {
    this.activePost.set(post);
    this.isDetailOpen.set(true);
    this.activePinIndex.set(null);
    this.newCommentContent.set('');
    this.commentError.set(null);

    // Sync query param ?post=<id>
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: post.id },
      queryParamsHandling: 'merge'
    });
  }

  closeDetail(updateUrl: boolean = true): void {
    this.isDetailOpen.set(false);
    this.activePost.set(null);
    this.activePinIndex.set(null);
    this.newCommentContent.set('');
    this.commentError.set(null);

    if (updateUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { post: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  private handleOpenPostFromQuery(postId: string): void {
    const found = this.posts().find(p => p.id === postId);
    if (found) {
      this.activePost.set(found);
      this.isDetailOpen.set(true);
      this.activePinIndex.set(null);
    } else if (!this.isLoading()) {
      // If not yet in list (e.g. direct link or searched subset), load single post or refetch
      this.http.get<DesignPost[]>(`${environment.apiUrl}/designs/posts?status=PUBLISHED`).subscribe({
        next: (data) => {
          const item = data.find(p => p.id === postId && p.status === 'PUBLISHED');
          if (item) {
            this.activePost.set(item);
            this.isDetailOpen.set(true);
          }
        },
        error: () => {}
      });
    }
  }

  // Toggle active tagged product pin (for touch/click)
  togglePin(index: number, event: Event): void {
    event.stopPropagation();
    if (this.activePinIndex() === index) {
      this.activePinIndex.set(null);
    } else {
      this.activePinIndex.set(index);
    }
  }

  // Close pin tooltip when clicking outside on image
  clearActivePin(): void {
    this.activePinIndex.set(null);
  }

  // Share post URL to clipboard
  sharePost(post: DesignPost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/community?post=${post.id}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
      }).catch(() => {
        this.fallbackCopyText(shareUrl);
      });
    } else {
      this.fallbackCopyText(shareUrl);
    }
  }

  private fallbackCopyText(text: string): void {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
    } catch {
      this.showToast('Không thể tự động sao chép. Vui lòng sao chép liên kết trên thanh địa chỉ.');
    }
  }

  // Add tagged product to cart if product id and variant can be retrieved
  addToCart(product: TaggedProduct, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!product.productId) {
      this.showToast('Sản phẩm chưa có mã trên hệ thống để đặt hàng online.');
      return;
    }

    this.addingToCartProductId.set(product.productId);

    // Fetch product detail to get primary variant
    this.http.get<any>(`${environment.apiUrl}/products/${product.productId}`)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe({
        next: (prodDetail) => {
          if (!prodDetail) {
            this.addingToCartProductId.set(null);
            this.showToast('Không tìm thấy thông tin sản phẩm.');
            return;
          }

          const variants = Array.isArray(prodDetail.variants) ? prodDetail.variants : [];
          const primaryVariant = variants[0];

          if (!primaryVariant || !primaryVariant.id) {
            this.addingToCartProductId.set(null);
            // Navigate to product page so customer can choose
            this.router.navigate(['/products', product.productId]);
            return;
          }

          const selectedConfig = {
            variantName: primaryVariant.name || 'Tiêu chuẩn',
            sku: primaryVariant.sku || prodDetail.slug
          };

          const guestProductInfo = {
            productId: prodDetail.id,
            name: prodDetail.name || product.name,
            variantName: primaryVariant.name,
            image: (prodDetail.images && prodDetail.images[0]) || '',
            price: primaryVariant.price || product.price || prodDetail.basePrice || 0,
            availableStock: primaryVariant.stock
          };

          this.cartService.addToCart(primaryVariant.id, 1, selectedConfig, guestProductInfo).subscribe({
            next: () => {
              this.addingToCartProductId.set(null);
              this.showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
            },
            error: () => {
              this.addingToCartProductId.set(null);
              this.showToast('Chưa thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
            }
          });
        },
        error: () => {
          this.addingToCartProductId.set(null);
          this.showToast('Lỗi khi kiểm tra thông tin sản phẩm.');
        }
      });
  }

  // Submit comment
  submitComment(): void {
    const post = this.activePost();
    if (!post) return;

    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/community?post=${post.id}` } });
      return;
    }

    const content = this.newCommentContent().trim();
    if (!content) {
      this.commentError.set('Vui lòng nhập nội dung bình luận.');
      return;
    }

    if (content.length > 500) {
      this.commentError.set('Nội dung bình luận không được vượt quá 500 ký tự.');
      return;
    }

    const user = this.currentUser();
    const authorName = user?.fullName || 'Khách hàng DCor';

    this.isSubmittingComment.set(true);
    this.commentError.set(null);

    const payload = {
      authorName,
      content
    };

    this.http.post<PostComment>(`${environment.apiUrl}/designs/posts/${post.id}/comments`, payload).subscribe({
      next: (createdComment) => {
        this.isSubmittingComment.set(false);
        this.newCommentContent.set('');

        // Update local post comment list
        const updatedComments = [createdComment, ...(post.comments || [])];
        const updatedPost: DesignPost = {
          ...post,
          comments: updatedComments
        };

        this.activePost.set(updatedPost);

        // Also update post in the main list
        this.posts.update(list =>
          list.map(p => (p.id === post.id ? updatedPost : p))
        );

        this.showToast('Bình luận của bạn đã được đăng thành công!');
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmittingComment.set(false);
        this.commentError.set(this.formatErrorMessage(err));
      }
    });
  }

  // Toast feedback helper
  showToast(message: string): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 3000);
  }

  // Format relative time in Vietnamese
  formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) {
        return 'Vừa xong';
      }
      if (diffMin < 60) {
        return `${diffMin} phút trước`;
      }
      if (diffHour < 24) {
        return `${diffHour} giờ trước`;
      }
      if (diffDay < 7) {
        return `${diffDay} ngày trước`;
      }
      if (diffDay < 30) {
        const weeks = Math.floor(diffDay / 7);
        return `${weeks} tuần trước`;
      }

      // Format dd/MM/yyyy
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  // Format currency VND
  formatPrice(price: number): string {
    if (price === undefined || price === null || isNaN(price)) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  }

  // Generate author initial
  getAuthorInitial(name: string): string {
    if (!name) return 'D';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[words.length - 1].charAt(0)).toUpperCase();
  }

  // Deterministic avatar gradient color based on author name
  getAvatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #b45309 0%, #d97706 100%)', // Warm Amber
      'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', // Forest Green
      'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', // Deep Teal
      'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)', // Royal Indigo
      'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)', // Terracotta
      'linear-gradient(135deg, #334155 0%, #64748b 100%)'  // Slate Modern
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  }

  // Error message formatter
  private formatErrorMessage(err: HttpErrorResponse): string {
    if (!err) {
      return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }
    if (err.status === 0) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
    }
    if (err.status >= 500) {
      return 'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau ít phút.';
    }
    if (err.error?.message && typeof err.error.message === 'string') {
      return err.error.message;
    }
    return 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
  }

  // ESC key listener to close detail modal
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isDetailOpen()) {
      this.closeDetail();
    }
  }
}
