import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MenuItem {
  title: string;
  icon: string | SafeHtml;
  href: string;
  subItems?: { title: string; href: string; }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.css']
})
export class AdminSidebar implements OnInit {
  isCollapsed = false;
  hoveredMenu: { href: string, top: number } | null = null;
  openMenu: string | null = null;
  activeHref = '';

  private hoverTimeout: any;

  MENU_ITEMS: MenuItem[] = [
    {
      title: 'Báo cáo & Thống kê',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      href: '/admin/reports',
      subItems: [
        { title: 'Tổng quan', href: '/admin/reports/overview' },
        { title: 'Báo cáo doanh thu', href: '/admin/reports/revenue' },
        { title: 'Báo cáo đơn hàng', href: '/admin/reports/orders' },
        { title: 'Báo cáo sản phẩm', href: '/admin/reports/products' },
        { title: 'Báo cáo khách hàng', href: '/admin/reports/customers' },
      ]
    },
    {
      title: 'Quản lý khách hàng',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      href: '/admin/customers'
    },
    {
      title: 'Quản lý sản phẩm',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
      href: '/admin/products',
      subItems: [
        { title: 'Danh sách sản phẩm', href: '/admin/products' },
        { title: 'Danh mục', href: '/admin/products/categories' },
      ]
    },
    {
      title: 'Quản lý tồn kho',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="4" rx="2"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>',
      href: '/admin/inventory',
      subItems: [
        { title: 'Tồn kho', href: '/admin/inventory' },
        { title: 'Kiểm kê kho', href: '/admin/inventory/audit' },
        { title: 'Lệnh xuất - nhập kho', href: '/admin/inventory/orders' },
        { title: 'Lịch sử biến động', href: '/admin/inventory/history' },
      ]
    },
    {
      title: 'Quản lý đơn hàng',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
      href: '/admin/orders',
      subItems: [
        { title: 'Danh sách đơn hàng', href: '/admin/orders' },
        { title: 'Yêu cầu đổi trả', href: '/admin/orders/returns' },
        { title: 'Bảo hành', href: '/admin/orders/warranty' },
      ]
    },
    {
      title: 'Quản lý khuyến mãi',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>',
      href: '/admin/promotions',
      subItems: [
        { title: 'Mã giảm giá', href: '/admin/promotions/vouchers' },
        { title: 'Chiến dịch', href: '/admin/promotions/campaigns' },
      ]
    },
    {
      title: 'Lịch tư vấn',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>',
      href: '/admin/appointments'
    },
    {
      title: 'Quản lý nội dung',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>',
      href: '/admin/content'
    },
    {
      title: 'Hội thoại Chatbox',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      href: '/admin/chat'
    },
    {
      title: 'Quản lý thiết kế',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
      href: '/admin/designs'
    },
    {
      title: 'Cài đặt hệ thống',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
      href: '/admin/settings',
      subItems: [
        { title: 'Thông tin chung', href: '/admin/settings/general' },
        { title: 'Vận chuyển & Thanh toán', href: '/admin/settings/logistics' },
        { title: 'Tài khoản & Phân quyền', href: '/admin/settings/users' },
      ]
    }
  ];

  constructor(private router: Router, private sanitizer: DomSanitizer) {
    // Sanitize all icons
    this.MENU_ITEMS = this.MENU_ITEMS.map(item => ({
      ...item,
      icon: typeof item.icon === 'string' ? this.sanitizer.bypassSecurityTrustHtml(item.icon) : item.icon
    }));

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.calculateActiveHref(this.router.url);
    });
  }

  ngOnInit() {
    this.calculateActiveHref(this.router.url);
  }

  calculateActiveHref(pathname: string) {
    let maxLen = 0;
    for (const item of this.MENU_ITEMS) {
      if (item.href === pathname || pathname.startsWith(item.href + '/')) {
        if (item.href.length > maxLen) { this.activeHref = item.href; maxLen = item.href.length; }
      }
      if (item.subItems) {
        for (const sub of item.subItems) {
          if (sub.href === pathname || pathname.startsWith(sub.href + '/')) {
            if (sub.href.length > maxLen) { this.activeHref = sub.href; maxLen = sub.href.length; }
          }
        }
      }
    }

    for (const item of this.MENU_ITEMS) {
      if (item.href === this.activeHref || (item.subItems && item.subItems.some(sub => sub.href === this.activeHref))) {
        this.openMenu = item.href;
        break;
      }
    }
  }

  toggleMenu(href: string) {
    if (this.isCollapsed) this.isCollapsed = false;
    this.openMenu = this.openMenu === href ? null : href;
  }

  isParentActive(item: MenuItem): boolean {
    return item.href === this.activeHref || !!(item.subItems && item.subItems.some(sub => sub.href === this.activeHref));
  }

  handleMouseEnter(event: MouseEvent, href: string) {
    if (!this.isCollapsed) return;
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoveredMenu = { href, top: rect.top };
  }

  handleMouseLeave() {
    if (!this.isCollapsed) return;
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
      this.hoveredMenu = null;
    }, 300);
  }

  handleDropdownMouseEnter() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
  }

  handleDropdownMouseLeave() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.hoverTimeout = setTimeout(() => {
      this.hoveredMenu = null;
    }, 300);
  }
  
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.hoveredMenu = null;
  }
}
