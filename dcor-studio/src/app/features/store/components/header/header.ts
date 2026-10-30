import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, HostListener, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
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
import { environment } from '../../../../../environments/environment';
import { getParentCategory } from '../../utils/category-grouping';

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

  constructor(
    private router: Router, 
    private cartService: CartService,
    private customerService: CustomerService,
    private authService: AuthService,
    private wishlistService: WishlistService
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
    this.isScrolled = window.scrollY > 10;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.shopMenuOpen && !this.shopNavItem.nativeElement.contains(event.target as Node)) {
      this.shopMenuOpen = false;
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
      const [prodRes, catRes] = await Promise.all([
        fetch(`${environment.apiUrl}/products`),
        fetch(`${environment.apiUrl}/categories`).catch(() => null)
      ]);

      if (prodRes && prodRes.ok) {
        const data = await prodRes.json();
        const products = Array.isArray(data) ? data : (data.data || data.products || []);
        this.products = products.map((product: any): CatalogProduct => ({
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

      if (catRes && catRes.ok) {
        const categories = await catRes.json();
        // Lấy danh mục gốc từ database (parentId === null)
        const rootCats = categories.filter((c: any) => !c.parentId);
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
    this.shopMenuOpen = false;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  toggleShopMenu(): void {
    this.shopMenuOpen = !this.shopMenuOpen;
  }

  onShopLinkClick(): void {
    this.shopMenuOpen = false;
    this.shopHoverDismissed = true;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  onShopNavMouseLeave(): void {
    this.shopHoverDismissed = false;
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
