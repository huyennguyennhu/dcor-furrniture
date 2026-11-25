import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ChatWidgetComponent } from '../chat-widget/chat-widget';
import { FloatingCompareDockComponent } from '../../../../shared/components/floating-compare-dock/floating-compare-dock';
import { QuickViewDrawerComponent } from '../../../../shared/components/quick-view-drawer/quick-view-drawer';
import { QuickViewService } from '../../../../core/services/quick-view.service';
import { CompareService } from '../../../../core/services/compare.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer, IconComponent, FloatingCompareDockComponent, ChatWidgetComponent, QuickViewDrawerComponent],
  templateUrl: './store-layout.html',
  styleUrls: ['./store-layout.css']
})
export class StoreLayout implements OnInit, OnDestroy {
  isHomePage = false;
  isAccountPage = false;
  showScrollTop = false;
  isDockActive = false;

  private routerSub: Subscription;
  private compareSub?: Subscription;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private compareService: CompareService,
    public quickViewService: QuickViewService
  ) {
    this.isHomePage = this.router.url === '/' || this.router.url === '';
    this.isAccountPage = this.router.url.startsWith('/account');

    let previousUrl = this.router.url;

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentUrl = event.urlAfterRedirects || event.url || '';
      this.isHomePage = currentUrl === '/' || currentUrl === '' || currentUrl === '/#';

      const wasAccount = previousUrl.startsWith('/account');
      const isNowAccount = currentUrl.startsWith('/account');
      this.isAccountPage = isNowAccount;

      // Nếu đang chuyển tab bên trong phân hệ /account/* -> KHÔNG cuộn toàn trang làm nháy sidebar, chỉ cuộn riêng content-column
      if (wasAccount && isNowAccount) {
        if (typeof window !== 'undefined') {
          const contentCol = document.querySelector('.content-column');
          if (contentCol) {
            contentCol.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          }
        }
      } else {
        // Tự động cuộn lên đầu trang cho tất cả các trang khác ở store khi di chuyển
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }

      previousUrl = currentUrl;
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.compareSub = this.compareService.compareList$.subscribe(list => {
      this.isDockActive = (list && list.length > 0);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.compareSub?.unsubscribe();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (typeof window !== 'undefined') {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const shouldShow = scrollY > 360;
      if (this.showScrollTop !== shouldShow) {
        this.showScrollTop = shouldShow;
        this.cdr.markForCheck();
      }
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
}
