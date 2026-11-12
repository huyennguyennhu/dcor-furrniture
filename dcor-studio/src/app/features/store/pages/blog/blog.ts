import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  HostListener,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { BlogService } from './services/blog.service';
import { BlogPostSummary, BlogCategory } from './models/blog.model';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, IconComponent],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly elementRef = inject(ElementRef);

  // Dữ liệu danh sách
  readonly posts = signal<BlogPostSummary[]>([]);
  readonly total = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Trạng thái tải & lỗi
  readonly isLoading = signal<boolean>(true);
  readonly isLoadingMore = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Bộ lọc
  readonly categories = signal<BlogCategory[]>([]);
  readonly selectedCategorySlug = signal<string>('');
  readonly selectedTag = signal<string>('');
  readonly searchQuery = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);

  // Debounce tìm kiếm 300ms
  private readonly searchSubject = new Subject<string>();
  private subRoute?: Subscription;
  private subSearch?: Subscription;

  // Computed state
  readonly featuredPost = computed<BlogPostSummary | null>(() => {
    const list = this.posts();
    return list.length > 0 ? list[0] : null;
  });

  readonly gridPosts = computed<BlogPostSummary[]>(() => {
    const list = this.posts();
    return list.length > 1 ? list.slice(1) : [];
  });

  readonly hasMore = computed<boolean>(() => {
    return this.posts().length < this.total();
  });

  readonly selectedCategoryName = computed<string>(() => {
    const slug = this.selectedCategorySlug();
    if (!slug) return 'Tất cả danh mục';
    const found = this.categories().find(c => c.slug === slug);
    return found ? found.name : 'Tất cả danh mục';
  });

  readonly totalPostsCount = computed<number>(() => {
    return this.categories().reduce((sum, c) => sum + (c.postCount || 0), 0);
  });

  ngOnInit(): void {
    this.titleService.setTitle('Blog và Cảm hứng | DCor Furniture');
    this.metaService.updateTag({
      name: 'description',
      content: 'Khám phá xu hướng nội thất mới nhất, bí quyết sắp đặt không gian sống thanh lịch và cảm hứng decor từ các chuyên gia DCor.'
    });

    // 1. Tải danh sách danh mục
    this.loadCategories();

    // 2. Thiết lập debounce cho ô tìm kiếm (300ms)
    this.subSearch = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.updateQueryParams({ q: term.trim() || null });
      });

    // 3. Đồng bộ bộ lọc từ URL
    this.subRoute = this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q') || '';
      const category = params.get('category') || '';
      const tag = params.get('tag') || '';

      this.searchQuery.set(q);
      this.selectedCategorySlug.set(category);
      this.selectedTag.set(tag);
      this.currentPage.set(1);

      this.fetchPosts(true);
    });
  }

  ngOnDestroy(): void {
    this.subRoute?.unsubscribe();
    this.subSearch?.unsubscribe();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  loadCategories(): void {
    this.blogService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats || []);
      },
      error: () => {
        // Fallback im lặng nếu danh mục chưa tải xong
      }
    });
  }

  fetchPosts(reset = false): void {
    if (reset) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    } else {
      this.isLoadingMore.set(true);
    }

    const pageToLoad = reset ? 1 : this.currentPage();

    this.blogService.getPosts({
      q: this.searchQuery(),
      category: this.selectedCategorySlug(),
      tag: this.selectedTag(),
      page: pageToLoad,
      pageSize: this.pageSize
    }).subscribe({
      next: (res) => {
        if (reset) {
          this.posts.set(res.items || []);
          this.isLoading.set(false);
        } else {
          this.posts.update((existing) => [...existing, ...(res.items || [])]);
          this.isLoadingMore.set(false);
        }
        this.total.set(res.total || 0);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
        this.errorMessage.set(this.blogService.formatError(err, 'Không thể tải danh sách bài viết.'));
      }
    });
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasMore()) return;
    this.currentPage.update((p) => p + 1);
    this.fetchPosts(false);
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }

  selectCategory(slug: string): void {
    this.isDropdownOpen.set(false);
    this.updateQueryParams({ category: slug || null });
  }

  selectTag(tag: string): void {
    this.updateQueryParams({ tag: tag || null });
  }

  clearTag(): void {
    this.updateQueryParams({ tag: null });
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedCategorySlug.set('');
    this.selectedTag.set('');
    this.updateQueryParams({ q: null, category: null, tag: null });
  }

  private updateQueryParams(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
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

  formatBlogDate(dateString?: string | null): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const day = d.getDate();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day} Th${month} ${year}`;
    } catch {
      return '';
    }
  }

  getAuthorAvatar(authorName?: string): string {
    if (!authorName) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
    const hash = authorName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const avatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    ];
    return avatars[hash % avatars.length];
  }

  onAvatarError(event: Event, authorName?: string): void {
    const target = event.target as HTMLElement;
    if (target && target.parentElement) {
      target.style.display = 'none';
      const initialSpan = target.parentElement.querySelector('.avatar-initial') as HTMLElement;
      if (initialSpan) initialSpan.style.display = 'flex';
    }
  }
}
