import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, HostListener, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { CartDrawerComponent } from '../../../../shared/components/cart-drawer/cart-drawer';
import { CartService } from '../../../../core/services/cart.service';
import { CustomerService, CustomerNotification } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ProductService } from '../../../../core/services/product.service';
import { environment } from '../../../../../environments/environment';
import { getParentCategory } from '../../utils/category-grouping';

import { CategoryClassificationService } from '../../../../core/services/category-classification.service';

interface StoreUser {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
}

interface StoreCategory {
  name: string;
  slug: string;
  productCount: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, FormsModule, CartDrawerComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('shopNavItem') shopNavItem!: ElementRef<HTMLElement>;

  theme = 'light';
  isLoggedIn = false;
  userMenuOpen = false;
  isMobileMenuOpen = false;
  mobileShopOpen = false;
  isMobileSearchOpen = false;
  searchQuery = '';
  isDropdownOpen = false;
  isCartDrawerOpen = false;
  isScrolled = false;
  shopMenuOpen = false;
  isShopHovered = false;
  private shopHoverTimeout: any = null;
  shopHoverDismissed = false;
  isStoreCategoriesLoading = true;
  storeCategories: StoreCategory[] = [];
  cartCount = 0;
  wishlistCount = 0;
  unreadNotificationCount = 0;
  isNotificationDropdownOpen = false;
  unreadNotificationsPreview: CustomerNotification[] = [];
  private notifCloseTimer: any = null;
  products: CatalogProduct[] = [];
  user: StoreUser | null = null;
  private lastCartToken: string | null = null;

  readonly DEFAULT_ROOMS = [
    { name: 'Phòng khách', slug: 'phong-khach', desc: 'Sofa, bàn trà, kệ tivi' },
    { name: 'Phòng ăn', slug: 'phong-an', desc: 'Bàn ăn mở rộng, ghế ăn' },
    { name: 'Phòng ngủ', slug: 'phong-ngu', desc: 'Giường đệm bọc, tap đầu giường' },
    { name: 'Phòng làm việc', slug: 'phong-lam-viec', desc: 'Bàn làm việc, ghế da' },
    { name: 'Ngoài trời & Ban công', slug: 'ngoai-troi-ban-cong', desc: 'Bàn ghế cafe ngoài trời' }
  ];

  readonly DEFAULT_MATERIALS = [
    { name: 'Da bò Aniline Ý', slug: 'da-bo-aniline-y', badge: 'Thượng hạng' },
    { name: 'Vải nỉ Copenhagen / Bouclé', slug: 'vai-ni-copenhagen', badge: 'Mềm mịn' },
    { name: 'Gỗ sồi (Oak) tự nhiên', slug: 'go-soi-tu-nhien', badge: 'Chuẩn FSC' },
    { name: 'Gỗ óc chó (Walnut)', slug: 'go-oc-cho-walnut', badge: 'Vân gỗ đậm' },
    { name: 'Gốm Ceramic chống trầy', slug: 'gom-ceramic-chong-tray', badge: 'Chịu nhiệt' }
  ];

  readonly DEFAULT_STYLES = [
    { name: 'Bắc Âu (Scandinavian)', slug: 'bac-au-scandinavian' },
    { name: 'Hiện đại (Modern Luxury)', slug: 'hien-dai-modern-luxury' },
    { name: 'Tối giản (Minimalism)', slug: 'toi-gian-minimalism' },
    { name: 'Japandi đương đại', slug: 'japandi' },
    { name: 'Wabi-Sabi mộc mạc', slug: 'wabi-sabi' },
    { name: 'Công nghiệp (Industrial)', slug: 'industrial' }
  ];

  readonly DEFAULT_COLLECTIONS = [
    { name: 'Bộ sưu tập Bergamo', slug: 'bo-suu-tap-bergamo', tag: 'Bán chạy' },
    { name: 'Bộ sưu tập Como', slug: 'bo-suu-tap-como', tag: 'Kính & Óc chó' },
    { name: 'Bộ sưu tập Lugano', slug: 'bo-suu-tap-lugano', tag: 'Phòng ngủ' },
    { name: 'Bộ sưu tập Santiago', slug: 'bo-suu-tap-santiago', tag: 'Bàn mở rộng' }
  ];

  get roomList(): any[] {
    const list = this.classificationService?.getRooms?.() || [];
    return list.length > 0 ? list : this.DEFAULT_ROOMS;
  }

  get materialList(): any[] {
    const list = this.classificationService?.getMaterials?.() || [];
    return list.length > 0 ? list : this.DEFAULT_MATERIALS;
  }

  get styleList(): any[] {
    const list = this.classificationService?.getStyles?.() || [];
    return list.length > 0 ? list : this.DEFAULT_STYLES;
  }

  get collectionList(): any[] {
    const list = this.classificationService?.getCollections?.() || [];
    return list.length > 0 ? list : this.DEFAULT_COLLECTIONS;
  }

  get filteredStoreCategories(): StoreCategory[] {
    return this.storeCategories;
  }

  getCategoryDisplayName(cat: StoreCategory): string {
    return cat.name;
  }

  constructor(
    private router: Router, 
    private cartService: CartService,
    private wishlistService: WishlistService,
    private customerService: CustomerService,
    private authService: AuthService,
    private productService: ProductService,
    private classificationService: CategoryClassificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.searchQuery = '';
      this.isDropdownOpen = false;
      this.shopMenuOpen = false;
      this.closeMobileMenu();
      this.isMobileSearchOpen = false;
      this.isNotificationDropdownOpen = false;
      this.closeGuestUserMenu();
      this.syncUser();
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  toggleMobileShop(): void {
    this.mobileShopOpen = !this.mobileShopOpen;
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    if (this.isMobileSearchOpen) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.shopHoverTimeout) {
      clearTimeout(this.shopHoverTimeout);
      this.shopHoverTimeout = null;
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  ngOnInit() {
    this.syncUser();
    void this.loadSearchProducts();
    this.cartService.cart$.subscribe(items => {
      this.cartCount = items.reduce((count, item) => count + item.quantity, 0);
    });
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistCount = items.length;
    });
    this.customerService.unreadCount$.subscribe(count => {
      this.unreadNotificationCount = count;
    });
    this.customerService.notifications$.subscribe(list => {
      this.updateNotificationsPreview(list);
    });

    // Init theme
    const savedTheme = localStorage.getItem('dcor_theme');
    if (savedTheme) {
      this.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  }

  onNotificationMouseEnter(): void {
    if (this.notifCloseTimer) {
      clearTimeout(this.notifCloseTimer);
      this.notifCloseTimer = null;
    }
    this.updateNotificationsPreview(this.customerService.currentNotifications);
    this.isNotificationDropdownOpen = true;
  }

  onNotificationMouseLeave(): void {
    this.notifCloseTimer = setTimeout(() => {
      this.isNotificationDropdownOpen = false;
    }, 200);
  }

  updateNotificationsPreview(list: CustomerNotification[]): void {
    const unread = (list || []).filter(n => !n.isRead);
    this.unreadNotificationsPreview = unread.slice(0, 3);
  }

  onNotificationItemClick(notif: CustomerNotification): void {
    this.isNotificationDropdownOpen = false;
    if (!notif.isRead) {
      this.customerService.markNotificationRead(notif.id).subscribe();
    }
    let targetLink = notif.link;
    if (notif.type === 'ORDER') {
      if (!targetLink || targetLink === '/account/orders' || !targetLink.includes('orderNumber=')) {
        const match = notif.title?.match(/#([A-Za-z0-9_-]+)/) || notif.message?.match(/#([A-Za-z0-9_-]+)/);
        if (match && match[1]) {
          targetLink = `/account/orders?orderNumber=${match[1]}`;
        } else {
          targetLink = targetLink || '/account/orders';
        }
      }
    }
    if (targetLink) {
      this.router.navigateByUrl(targetLink);
    } else {
      this.router.navigateByUrl('/account/notifications');
    }
  }

  formatNotifTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return `${d.getDate()}/${d.getMonth() + 1}`;
    } catch (_) {
      return '';
    }
  }

  @HostListener('window:storage')
  onStorageChange(): void {
    this.syncUser();
  }

  @HostListener('window:dcor-user-updated')
  onUserUpdated(): void {
    this.syncUser();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const nextScrolled = window.scrollY > 20;
    if (this.isScrolled !== nextScrolled) {
      this.isScrolled = nextScrolled;
      this.cdr.markForCheck();
    }
    if (this.isShopHovered) {
      this.closeShopMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeShopMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.shopMenuOpen && !this.shopNavItem?.nativeElement?.contains(event.target as Node)) {
      this.closeShopMenu();
    }
  }

  get searchResults(): CatalogProduct[] {
    if (!this.searchQuery.trim()) return [];
    const query = this.normalizeSearchText(this.searchQuery);
    return this.products.filter(p => {
      return [
        p.shortDescription,
        p.shortDescription_vi,
        p.category
      ].some(value => this.normalizeSearchText(value || '').includes(query));
    });
  }

  private async loadSearchProducts(): Promise<void> {
    try {
      this.isStoreCategoriesLoading = true;
      const [productsData, categoriesData] = await Promise.all([
        this.productService.getProducts(),
        this.productService.getCategories().catch(() => [])
      ]);

      if (Array.isArray(productsData)) {
        this.products = productsData.map((product: any): CatalogProduct => ({
          id: product.id,
          productId: product.id || product.productId,
          shortDescription: product.name || product.shortDescription || '',
          shortDescription_vi: product.name || product.shortDescription_vi || '',
          category: product.category?.name || product.category || '',
          variantUrl: product.slug || '',
          images: Array.isArray(product.images) ? product.images : [],
          refinementColors: [],
          refinementMaterials: [],
          prices: [],
          lowestPrices: []
        }));
      }

      if (Array.isArray(categoriesData)) {
        // Lấy danh mục gốc từ database (parentId === null)
        const rootCats = categoriesData.filter((c: any) => !c.parentId);
        this.storeCategories = rootCats.map((c: any) => ({
          name: c.name,
          slug: c.slug,
          productCount: c._count?.products || 0
        }));
      }
    } catch (error) {
      console.error('Không thể tải sản phẩm hoặc danh mục:', error);
    } finally {
      this.isStoreCategoriesLoading = false;
    }
  }

  closeShopMenu(): void {
    if (this.shopHoverTimeout) {
      clearTimeout(this.shopHoverTimeout);
      this.shopHoverTimeout = null;
    }
    this.isShopHovered = false;
    this.shopMenuOpen = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  toggleShopMenu(): void {
    this.shopMenuOpen = !this.shopMenuOpen;
    this.cdr.markForCheck();
  }

  onShopMouseEnter(): void {
    if (this.shopHoverTimeout) {
      clearTimeout(this.shopHoverTimeout);
      this.shopHoverTimeout = null;
    }
    this.isShopHovered = true;
    this.cdr.markForCheck();
  }

  onShopMouseLeave(): void {
    if (this.shopHoverTimeout) {
      clearTimeout(this.shopHoverTimeout);
      this.shopHoverTimeout = null;
    }
    // Khi chuột ra ngoài: đóng lại nhanh (70ms) và kích hoạt Change Detection ngay
    this.shopHoverTimeout = setTimeout(() => {
      this.isShopHovered = false;
      this.shopHoverTimeout = null;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 70);
  }

  onShopLinkClick(): void {
    this.closeShopMenu();
  }

  onShopNavMouseLeave(): void {
    this.onShopMouseLeave();
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('vi')
      .trim();
  }

  handleSearch(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.handleSearchSubmit();
    }
  }

  handleSearchSubmit() {
    const query = this.searchQuery.trim();
    if (query) {
      this.isDropdownOpen = false;
      this.router.navigate(['/explore'], { queryParams: { q: query } });
    } else {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('dcor_theme', this.theme);
    this.userMenuOpen = false;
  }

  logout() {
    localStorage.removeItem('dcor_customer_token');
    localStorage.removeItem('dcor_customer');
    localStorage.removeItem('dcor_customer_user');
    localStorage.removeItem('dcor_user');
    this.isLoggedIn = false;
    this.user = null;
    this.userMenuOpen = false;
    this.router.navigate(['/']);
  }

  openLoginModal() {
    this.router.navigate(['/login']);
  }

  get guestPhone(): string | null {
    return this.authService.getGuestPhone();
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  isGuestHovering = false;
  isGuestMenuClicked = false;
  private guestHoverTimer: any = null;

  onGuestMouseEnter(): void {
    if (this.isGuestMenuClicked) return;
    clearTimeout(this.guestHoverTimer);
    this.isGuestHovering = true;
  }

  onGuestMouseLeave(): void {
    this.guestHoverTimer = setTimeout(() => {
      this.isGuestHovering = false;
    }, 250);
  }

  toggleGuestUserMenu(): void {
    this.isGuestHovering = false;
    this.isGuestMenuClicked = !this.isGuestMenuClicked;
  }

  closeGuestUserMenu(): void {
    this.isGuestMenuClicked = false;
    this.isGuestHovering = false;
  }

  toggleCartDrawer() {
    this.isCartDrawerOpen = !this.isCartDrawerOpen;
  }

  onSearchFocus() {
    this.isDropdownOpen = true;
  }

  onSearchBlur() {
    // Delay to allow clicking on results
    setTimeout(() => {
      this.isDropdownOpen = false;
    }, 200);
  }

  private syncUser(): void {
    const token = localStorage.getItem('dcor_customer_token');
    if (token !== this.lastCartToken) {
      this.lastCartToken = token;
      if (token) {
        this.cartService.loadCart();
      } else {
        this.cartCount = 0;
      }
    }

    const storedUser =
      localStorage.getItem('dcor_customer') ??
      localStorage.getItem('dcor_customer_user') ??
      localStorage.getItem('dcor_user');

    if (!storedUser) {
      this.user = null;
      this.isLoggedIn = false;
      this.customerService.clearNotifications();
      return;
    }

    try {
      const user = JSON.parse(storedUser) as StoreUser;
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        this.user = null;
        this.isLoggedIn = false;
        this.customerService.clearNotifications();
        return;
      }
      this.user = user;
      this.isLoggedIn = true;
      this.customerService.refreshNotifications();
    } catch (error) {
      console.error('Không thể đọc thông tin tài khoản khách hàng.', error);
      this.user = null;
      this.isLoggedIn = false;
      this.customerService.clearNotifications();
    }
  }
}
