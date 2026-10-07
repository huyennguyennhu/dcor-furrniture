import { Component, HostListener, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { CartDrawerComponent } from '../../../../shared/components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CartDrawerComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  theme = 'light';
  isLoggedIn = false;
  userMenuOpen = false;
  searchQuery = '';
  scrolled = false;
  isDropdownOpen = false;
  isCartDrawerOpen = false;
  
  cartCount = 0;
  products: CatalogProduct[] = [];
  user: any = null;

  isHomePage = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.url === '/' || event.url === '';
      this.searchQuery = '';
      this.isDropdownOpen = false;
    });
  }

  ngOnInit() {
    this.isHomePage = this.router.url === '/' || this.router.url === '';
    
    // Check auth
    const userStr = localStorage.getItem('dcor_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
        this.isLoggedIn = true;
      } catch (e) {}
    }

    // Init theme
    const savedTheme = localStorage.getItem('dcor_theme');
    if (savedTheme) {
      this.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', this.theme);
    }

    this.checkScroll();

    // Mock products or fetch
    // In real app, fetch from a service
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkScroll();
  }

  checkScroll() {
    this.scrolled = window.scrollY > 60;
  }

  get isDocked(): boolean {
    return !this.isHomePage || this.scrolled;
  }

  get searchResults(): CatalogProduct[] {
    if (!this.searchQuery.trim()) return [];
    const query = this.searchQuery.toLowerCase();
    return this.products.filter(p => {
      return (p.shortDescription || '').toLowerCase().includes(query) || 
             (p.shortDescription_vi || '').toLowerCase().includes(query) ||
             (p.category || '').toLowerCase().includes(query);
    });
  }

  handleSearch(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.handleSearchSubmit();
    }
  }

  handleSearchSubmit() {
    if (this.searchQuery.trim() && this.searchResults.length > 0) {
      this.isDropdownOpen = false;
      this.router.navigate(['/kham-pha'], { queryParams: { q: this.searchQuery.trim() } });
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
    localStorage.removeItem('dcor_user');
    this.isLoggedIn = false;
    this.user = null;
    this.userMenuOpen = false;
    this.router.navigate(['/']);
  }

  openLoginModal() {
    this.router.navigate(['/login']);
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
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
}
