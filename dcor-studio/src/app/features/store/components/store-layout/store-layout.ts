import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ChatWidgetComponent } from '../chat-widget/chat-widget';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer, IconComponent, ChatWidgetComponent],
  templateUrl: './store-layout.html',
  styleUrls: ['./store-layout.css']
})
export class StoreLayout implements OnInit, OnDestroy {
  isHomePage = false;
  showScrollTop = false;
  isDockActive = false;

  private routerSub: Subscription;
  private compareEventListener?: () => void;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isHomePage = this.router.url === '/' || this.router.url === '';

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isHomePage = event.url === '/' || event.url === '' || event.urlAfterRedirects === '/';

      // Tự động cuộn lên đầu trang cho tất cả các trang ở store khi di chuyển
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  ngOnInit() {
    this.checkDockState();
    if (typeof window !== 'undefined') {
      this.compareEventListener = () => {
        this.checkDockState();
        this.cdr.detectChanges();
      };
      window.addEventListener('dcor_compare_updated', this.compareEventListener);
      window.addEventListener('storage', this.compareEventListener);
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    if (typeof window !== 'undefined' && this.compareEventListener) {
      window.removeEventListener('dcor_compare_updated', this.compareEventListener);
      window.removeEventListener('storage', this.compareEventListener);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (typeof window !== 'undefined') {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      this.showScrollTop = scrollY > 360;
      this.cdr.detectChanges();
    }
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  private checkDockState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      const list = stored ? JSON.parse(stored) : [];
      this.isDockActive = list.length > 0;
    } catch {
      this.isDockActive = false;
    }
  }
}
