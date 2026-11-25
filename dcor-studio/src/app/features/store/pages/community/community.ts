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
import { MyDesignApiService, UserDesignApi, LikedPostApi } from '../custom-design/services/my-design-api.service';
import { environment } from '../../../../../environments/environment';
import { DesignPost, PostComment, TaggedProduct, CommentThread } from './models/community.model';

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
  private myDesignApi = inject(MyDesignApiService);
  private destroyRef = inject(DestroyRef);

  // Tab chính: 'feed' (Khám phá cộng đồng) | 'my-hub' (Thiết kế của tôi)
  mainTab = signal<'feed' | 'my-hub'>('feed');

  // Bộ lọc trong Khám phá cộng đồng: mặc định là 'newest' (bài mới nhất)
  feedFilter = signal<'all' | 'trending' | 'newest' | 'tagged'>('newest');

  // Sub-tab trong 'Thiết kế của tôi': 'saved' | 'posts' | 'liked' | 'drafts'
  myHubSubTab = signal<'saved' | 'posts' | 'liked' | 'drafts'>('saved');

  // State danh sách bài viết Feed
  posts = signal<DesignPost[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  searchQuery = signal<string>('');

  // Lượt thích (thả tim) của người dùng hiện tại
  likedPostIds = signal<Set<string>>(new Set<string>());
  isTogglingLike = signal<Set<string>>(new Set<string>());

  // State dữ liệu mục "Thiết kế của tôi"
  isLoadingMyHub = signal<boolean>(false);
  myHubError = signal<string | null>(null);
  mySavedDesigns = signal<UserDesignApi[]>([]);
  myPublishedPosts = signal<DesignPost[]>([]);
  myLikedPosts = signal<LikedPostApi[]>([]);
  myDraftDesigns = signal<UserDesignApi[]>([]);

  // Detail Modal / Drawer state
  activePost = signal<DesignPost | null>(null);
  isDetailOpen = signal<boolean>(false);
  activePinIndex = signal<number | null>(null);

  // Comment state
  newCommentContent = signal<string>('');
  isSubmittingComment = signal<boolean>(false);
  commentError = signal<string | null>(null);
  replyingToComment = signal<PostComment | null>(null);

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

  // Danh sách bài viết Feed sau khi lọc và sắp xếp (Mặc định bài mới nhất lên đầu)
  filteredPosts = computed<DesignPost[]>(() => {
    let list = [...this.posts()];
    const filter = this.feedFilter();

    if (filter === 'tagged') {
      list = list.filter(p => p.taggedProducts && p.taggedProducts.length > 0);
    } else if (filter === 'trending') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      // Mặc định luôn ưu tiên bài mới nhất
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  });

  // Bình luận hiển thị được trong bài đang mở
  activeComments = computed<PostComment[]>(() => {
    const post = this.activePost();
    if (!post || !Array.isArray(post.comments)) return [];
    return post.comments.filter(c => c.status !== 'HIDDEN');
  });

  // Cấu trúc cây thảo luận: Gom các câu trả lời trực tiếp dưới bình luận gốc
  commentThreads = computed<CommentThread[]>(() => {
    const all = this.activeComments();
    if (!all || all.length === 0) return [];

    const commentMap = new Map<string, PostComment>();
    for (const c of all) {
      commentMap.set(c.id, c);
    }

    const parentRepliesMap = new Map<string, PostComment[]>();
    const replyIds = new Set<string>();

    for (const c of all) {
      const explicitParentId = this.getReplyParentId(c.content);
      const targetAuthor = this.getReplyTarget(c.content);

      let resolvedParentId: string | null = null;

      if (explicitParentId && commentMap.has(explicitParentId)) {
        resolvedParentId = explicitParentId;
      } else if (targetAuthor) {
        // Fallback: tìm theo tên tác giả được trả lời
        const targetLower = targetAuthor.toLowerCase().trim();
        const candidate = all.find(
          other => other.id !== c.id &&
          other.authorName.trim().toLowerCase() === targetLower
        );
        if (candidate) {
          resolvedParentId = candidate.id;
        }
      }

      if (resolvedParentId && resolvedParentId !== c.id) {
        // Nếu resolvedParent lại là một reply thì truy ngược về root comment của cuộc hội thoại
        let rootId = resolvedParentId;
        const visited = new Set<string>([c.id, rootId]);
        while (true) {
          const parentCmt = commentMap.get(rootId);
          if (!parentCmt) break;
          const grandParentId = this.getReplyParentId(parentCmt.content);
          if (grandParentId && commentMap.has(grandParentId) && !visited.has(grandParentId)) {
            visited.add(grandParentId);
            rootId = grandParentId;
          } else {
            break;
          }
        }

        if (!parentRepliesMap.has(rootId)) {
          parentRepliesMap.set(rootId, []);
        }
        parentRepliesMap.get(rootId)!.push(c);
        replyIds.add(c.id);
      }
    }

    const threads: CommentThread[] = [];
    for (const c of all) {
      if (!replyIds.has(c.id)) {
        const replies = parentRepliesMap.get(c.id) || [];
        // Sắp xếp các câu trả lời theo thứ tự thời gian tăng dần (câu trả lời trước ở trên)
        replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        threads.push({
          comment: c,
          replies
        });
      }
    }

    // Bình luận gốc sắp xếp theo mới nhất lên trước
    threads.sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());

    return threads;
  });

  ngOnInit(): void {
    // Xử lý tìm kiếm debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(query => {
        this.fetchPosts(query);
      });

    // Tải danh sách bài viết cộng đồng
    this.fetchPosts('');

    // Tải danh sách các bài viết user đã thích để tô màu tim
    if (this.isLoggedIn()) {
      this.loadMyLikes();
      this.preloadAllMyHubCounts();
    }

    // Đọc query param ?tab= & ?post=
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const tab = params['tab'];
        if (tab === 'my-hub') {
          this.mainTab.set('my-hub');
          const sub = params['sub'];
          if (sub && ['saved', 'posts', 'liked', 'drafts'].includes(sub)) {
            this.myHubSubTab.set(sub as any);
          }
          if (this.isLoggedIn()) {
            this.loadMyHubTab(this.myHubSubTab());
          }
        }

        const postId = params['post'];
        if (postId) {
          this.handleOpenPostFromQuery(postId);
        } else if (this.isDetailOpen()) {
          this.closeDetail(false);
        }
      });
  }

  // =========================================================================
  // BẢNG TIN KHÁM PHÁ CỘNG ĐỒNG
  // =========================================================================

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
        const validPosts = (Array.isArray(data) ? data : [])
          .filter(p => p.status === 'PUBLISHED')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.posts.set(validPosts);

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

  setFeedFilter(filter: 'all' | 'trending' | 'newest' | 'tagged'): void {
    this.feedFilter.set(filter);
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

  // =========================================================================
  // TƯƠNG TÁC THẢ TIM (LIKE / UNLIKE)
  // =========================================================================

  loadMyLikes(): void {
    if (!this.isLoggedIn()) {
      this.likedPostIds.set(new Set<string>());
      return;
    }
    this.myDesignApi.getMyLikes().subscribe({
      next: (ids) => {
        this.likedPostIds.set(new Set<string>(ids || []));
      },
      error: () => {}
    });
  }

  isLiked(postId: string): boolean {
    return this.likedPostIds().has(postId);
  }

  toggleLike(post: DesignPost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.isLoggedIn()) {
      this.showToast('Vui lòng đăng nhập để thả tim bài viết.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/community?post=${post.id}` } });
      return;
    }

    const postId = post.id;
    if (this.isTogglingLike().has(postId)) {
      return;
    }

    const currentLikes = this.likedPostIds();
    const willLike = !currentLikes.has(postId);

    // Cập nhật giao diện tức thì (Optimistic UI)
    const updatedSet = new Set(currentLikes);
    if (willLike) {
      updatedSet.add(postId);
    } else {
      updatedSet.delete(postId);
    }
    this.likedPostIds.set(updatedSet);

    const diff = willLike ? 1 : -1;
    const newCount = Math.max(0, (post.likesCount || 0) + diff);

    this.posts.update(list =>
      list.map(p => (p.id === postId ? { ...p, likesCount: newCount } : p))
    );

    if (this.activePost() && this.activePost()!.id === postId) {
      this.activePost.update(p => (p ? { ...p, likesCount: newCount } : null));
    }

    // Đánh dấu đang gửi request
    this.isTogglingLike.update(s => new Set(s).add(postId));

    this.myDesignApi.toggleLikePost(postId).subscribe({
      next: (res) => {
        this.isTogglingLike.update(s => {
          const next = new Set(s);
          next.delete(postId);
          return next;
        });

        // Đồng bộ chính xác số like từ server
        this.posts.update(list =>
          list.map(p => (p.id === postId ? { ...p, likesCount: res.likesCount } : p))
        );
        if (this.activePost() && this.activePost()!.id === postId) {
          this.activePost.update(p => (p ? { ...p, likesCount: res.likesCount } : null));
        }

        // Cập nhật lại tab LIKED nếu đang ở tab này
        if (this.mainTab() === 'my-hub' && this.myHubSubTab() === 'liked') {
          this.loadMyHubTab('liked');
        }

        if (willLike) {
          this.showToast('Đã thả tim bài viết!');
        }
      },
      error: () => {
        // Rollback lại nếu lỗi
        this.isTogglingLike.update(s => {
          const next = new Set(s);
          next.delete(postId);
          return next;
        });
        this.likedPostIds.set(currentLikes);
        this.posts.update(list =>
          list.map(p => (p.id === postId ? { ...p, likesCount: post.likesCount } : p))
        );
        if (this.activePost() && this.activePost()!.id === postId) {
          this.activePost.update(p => (p ? { ...p, likesCount: post.likesCount } : null));
        }
        this.showToast('Không thể cập nhật lượt thích. Vui lòng thử lại sau.');
      }
    });
  }

  // =========================================================================
  // MỤC "THIẾT KẾ CỦA TÔI" TRONG CỘNG ĐỒNG
  // =========================================================================

  switchMainTab(tab: 'feed' | 'my-hub'): void {
    this.mainTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'my-hub' ? 'my-hub' : null, sub: tab === 'my-hub' ? this.myHubSubTab() : null },
      queryParamsHandling: 'merge'
    });

    if (tab === 'my-hub' && this.isLoggedIn()) {
      this.loadMyHubTab(this.myHubSubTab());
    }
  }

  switchMyHubSubTab(subTab: 'saved' | 'posts' | 'liked' | 'drafts'): void {
    this.myHubSubTab.set(subTab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sub: subTab },
      queryParamsHandling: 'merge'
    });
    this.loadMyHubTab(subTab);
  }

  loadMyHubTab(subTab: 'saved' | 'posts' | 'liked' | 'drafts'): void {
    if (!this.isLoggedIn()) return;

    this.isLoadingMyHub.set(true);
    this.myHubError.set(null);

    if (subTab === 'saved') {
      this.myDesignApi.listDesigns('SAVED').subscribe({
        next: (data) => {
          this.mySavedDesigns.set(data || []);
          this.isLoadingMyHub.set(false);
        },
        error: (err) => {
          this.isLoadingMyHub.set(false);
          this.myHubError.set(this.myDesignApi.formatError(err, 'Không thể tải danh sách thiết kế đã lưu.'));
        }
      });
    } else if (subTab === 'posts') {
      this.myDesignApi.listMyPosts().subscribe({
        next: (data) => {
          this.myPublishedPosts.set(data || []);
          this.isLoadingMyHub.set(false);
        },
        error: (err) => {
          this.isLoadingMyHub.set(false);
          this.myHubError.set(this.myDesignApi.formatError(err, 'Không thể tải danh sách bài viết đã đăng.'));
        }
      });
    } else if (subTab === 'liked') {
      this.myDesignApi.listLikedPosts().subscribe({
        next: (data) => {
          this.myLikedPosts.set(data || []);
          this.isLoadingMyHub.set(false);
        },
        error: (err) => {
          this.isLoadingMyHub.set(false);
          this.myHubError.set(this.myDesignApi.formatError(err, 'Không thể tải danh sách bài viết đã yêu thích.'));
        }
      });
    } else if (subTab === 'drafts') {
      this.myDesignApi.listDesigns('DRAFT').subscribe({
        next: (data) => {
          this.myDraftDesigns.set(data || []);
          this.isLoadingMyHub.set(false);
        },
        error: (err) => {
          this.isLoadingMyHub.set(false);
          this.myHubError.set(this.myDesignApi.formatError(err, 'Không thể tải danh sách thiết kế nháp.'));
        }
      });
    }
  }

  preloadAllMyHubCounts(): void {
    if (!this.isLoggedIn()) return;
    this.myDesignApi.listDesigns('SAVED').subscribe({ next: d => this.mySavedDesigns.set(d || []) });
    this.myDesignApi.listMyPosts().subscribe({ next: d => this.myPublishedPosts.set(d || []) });
    this.myDesignApi.listLikedPosts().subscribe({ next: d => this.myLikedPosts.set(d || []) });
    this.myDesignApi.listDesigns('DRAFT').subscribe({ next: d => this.myDraftDesigns.set(d || []) });
  }

  openDesignInPlanner(designId: string): void {
    this.router.navigate(['/custom-design'], { queryParams: { designId } });
  }

  openLikedPostDetail(likedItem: LikedPostApi): void {
    const found = this.posts().find(p => p.id === likedItem.id);
    if (found) {
      this.openDetail(found);
    } else {
      // Tìm từ API
      this.http.get<DesignPost[]>(`${environment.apiUrl}/designs/posts?status=PUBLISHED`).subscribe({
        next: (posts) => {
          const item = (posts || []).find(p => p.id === likedItem.id);
          if (item) {
            this.openDetail(item);
          } else {
            this.showToast('Không tìm thấy bài viết này.');
          }
        },
        error: () => {
          this.showToast('Không thể mở chi tiết bài viết.');
        }
      });
    }
  }

  deleteDraft(id: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!confirm('Bạn có chắc chắn muốn xóa bản nháp thiết kế này?')) {
      return;
    }

    this.myDesignApi.deleteDesign(id).subscribe({
      next: () => {
        this.myDraftDesigns.update(list => list.filter(d => d.id !== id));
        this.showToast('Đã xóa bản nháp thiết kế.');
      },
      error: () => {
        this.showToast('Không thể xóa bản nháp. Vui lòng thử lại.');
      }
    });
  }

  // =========================================================================
  // CHI TIẾT BÀI VIẾT (DETAIL DRAWER / MODAL) & BÌNH LUẬN
  // =========================================================================

  openDetail(post: DesignPost): void {
    this.activePost.set(post);
    this.isDetailOpen.set(true);
    this.activePinIndex.set(null);
    this.newCommentContent.set('');
    this.commentError.set(null);
    this.replyingToComment.set(null);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: post.id },
      queryParamsHandling: 'merge'
    });
  }

  openCommentThread(post: DesignPost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.openDetail(post);
    // Tự động cuộn đến phần bình luận sau khi mở
    setTimeout(() => {
      const el = document.getElementById('community-comment-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = el.querySelector('textarea');
        if (textarea) textarea.focus();
      }
    }, 200);
  }

  closeDetail(updateUrl: boolean = true): void {
    this.isDetailOpen.set(false);
    this.activePost.set(null);
    this.activePinIndex.set(null);
    this.newCommentContent.set('');
    this.commentError.set(null);
    this.replyingToComment.set(null);

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
      this.http.get<DesignPost[]>(`${environment.apiUrl}/designs/posts?status=PUBLISHED`).subscribe({
        next: (data) => {
          const item = (data || []).find(p => p.id === postId && p.status === 'PUBLISHED');
          if (item) {
            this.activePost.set(item);
            this.isDetailOpen.set(true);
          }
        },
        error: () => {}
      });
    }
  }

  togglePin(index: number, event: Event): void {
    event.stopPropagation();
    if (this.activePinIndex() === index) {
      this.activePinIndex.set(null);
    } else {
      this.activePinIndex.set(index);
    }
  }

  clearActivePin(): void {
    this.activePinIndex.set(null);
  }

  sharePost(post: DesignPost | LikedPostApi, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/community?post=${post.id}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
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

  addToCart(product: TaggedProduct, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!product.productId) {
      this.showToast('Sản phẩm chưa có mã trên hệ thống để đặt hàng trực tuyến.');
      return;
    }

    this.addingToCartProductId.set(product.productId);

    this.http.get<any>(`${environment.apiUrl}/products/${product.productId}`)
      .pipe(catchError(() => of(null)))
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

  replyToComment(cmt: PostComment, rootParent?: PostComment): void {
    if (!this.isLoggedIn()) {
      const post = this.activePost();
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/community?post=${post?.id}` } });
      return;
    }
    const targetParentId = rootParent?.id || cmt.id;
    this.replyingToComment.set({
      ...cmt,
      postId: targetParentId
    });
    this.commentError.set(null);
    setTimeout(() => {
      const textarea = document.getElementById('communityCommentTextarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  cancelReply(): void {
    this.replyingToComment.set(null);
  }

  getReplyParentId(content: string): string | null {
    const match = (content || '').match(/^\[reply:([^\]]+)\]/);
    return match ? match[1].trim() : null;
  }

  isReplyComment(content: string): boolean {
    return /^\[reply:[^\]]+\]/.test(content || '') || /^@([^:]+):\s*/.test(content || '');
  }

  getReplyTarget(content: string): string | null {
    const clean = (content || '').replace(/^\[reply:[^\]]+\]\s*/, '');
    const match = clean.match(/^@([^:]+):\s*/);
    return match ? match[1].trim() : null;
  }

  getCleanCommentContent(content: string): string {
    return (content || '')
      .replace(/^\[reply:[^\]]+\]\s*/, '')
      .replace(/^@([^:]+):\s*/, '')
      .trim();
  }

  truncateText(text: string, maxLen: number = 40): string {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen).trim() + '...' : text;
  }

  submitComment(): void {
    const post = this.activePost();
    if (!post) return;

    if (!this.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/community?post=${post.id}` } });
      return;
    }

    const rawContent = this.newCommentContent().trim();
    if (!rawContent) {
      this.commentError.set('Vui lòng nhập nội dung bình luận.');
      return;
    }

    if (rawContent.length > 500) {
      this.commentError.set('Nội dung bình luận không được vượt quá 500 ký tự.');
      return;
    }

    const replyingTarget = this.replyingToComment();
    let finalContent = rawContent;
    if (replyingTarget) {
      const parentId = replyingTarget.postId || replyingTarget.id;
      finalContent = `[reply:${parentId}] @${replyingTarget.authorName}: ${rawContent}`;
    }

    const user = this.currentUser();
    const authorName = user?.fullName || 'Khách hàng DCor';

    this.isSubmittingComment.set(true);
    this.commentError.set(null);

    const payload = {
      authorName,
      content: finalContent
    };

    this.http.post<PostComment>(`${environment.apiUrl}/designs/posts/${post.id}/comments`, payload).subscribe({
      next: (createdComment) => {
        this.isSubmittingComment.set(false);
        this.newCommentContent.set('');
        this.replyingToComment.set(null);

        const updatedComments = [createdComment, ...(post.comments || [])];
        const updatedPost: DesignPost = {
          ...post,
          comments: updatedComments
        };

        this.activePost.set(updatedPost);

        this.posts.update(list =>
          list.map(p => (p.id === post.id ? updatedPost : p))
        );

        setTimeout(() => {
          const newEl = document.getElementById('comment-' + createdComment.id);
          if (newEl) {
            newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            newEl.classList.add('just-added-highlight');
            setTimeout(() => newEl.classList.remove('just-added-highlight'), 1800);
          }
        }, 120);

        const successMsg = replyingTarget
          ? `Đã gửi câu trả lời cho @${replyingTarget.authorName} thành công!`
          : 'Bình luận của bạn đã được đăng thành công!';
        this.showToast(successMsg);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmittingComment.set(false);
        this.commentError.set(this.formatErrorMessage(err));
      }
    });
  }

  showToast(message: string): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 3200);
  }

  formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;
      if (diffDay < 30) {
        const weeks = Math.floor(diffDay / 7);
        return `${weeks} tuần trước`;
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  formatPrice(price: number): string {
    if (price === undefined || price === null || isNaN(price)) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  }

  getProductThumbnail(prod: TaggedProduct): string {
    if (prod.imageUrl) return prod.imageUrl;
    return '/assets/img/furniture-placeholder.svg';
  }

  getAuthorAvatar(post?: DesignPost | null): string | null {
    if (!post) return null;

    // 1. Nếu bài viết có avatar được trả về từ API
    if (post.authorAvatar) {
      return post.authorAvatar;
    }

    // 2. Nếu là bài viết của tài khoản đang đăng nhập
    const user = this.currentUser();
    if (user) {
      const userAvatar = user.avatarUrl || user.avatar;
      if (userAvatar) {
        const isEmailMatch =
          post.authorEmail &&
          user.email &&
          post.authorEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
        const isNameMatch =
          post.authorName &&
          user.fullName &&
          post.authorName.toLowerCase().trim() === user.fullName.toLowerCase().trim();

        if (isEmailMatch || isNameMatch) {
          return userAvatar;
        }
      }
    }

    return null;
  }

  getCommentAuthorAvatar(cmt: PostComment): string | null {
    if (!cmt) return null;
    if (cmt.authorAvatar) return cmt.authorAvatar;

    const user = this.currentUser();
    if (user) {
      const userAvatar = user.avatarUrl || user.avatar;
      if (userAvatar && cmt.authorName && user.fullName) {
        if (cmt.authorName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) {
          return userAvatar;
        }
      }
    }

    return null;
  }

  getAuthorInitial(name?: string): string {
    if (!name) return 'D';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words[words.length - 1].charAt(0).toUpperCase();
  }

  getAvatarGradient(name?: string): string {
    const gradients = [
      'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
      'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
      'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
      'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      'linear-gradient(135deg, #334155 0%, #64748b 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = (hash << 5) - hash + (name || '').charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  }

  private formatErrorMessage(err: HttpErrorResponse): string {
    if (!err) return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    if (err.status === 0) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    if (err.status >= 500) return 'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau ít phút.';
    if (err.error?.message && typeof err.error.message === 'string') return err.error.message;
    return 'Không thể thực hiện yêu cầu. Vui lòng thử lại.';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isDetailOpen()) {
      this.closeDetail();
    }
  }
}
