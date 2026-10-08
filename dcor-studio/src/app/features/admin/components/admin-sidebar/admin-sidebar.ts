import { IconComponent, IconName } from '../../../../shared/components/icon/icon';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  title: string;
  icon: IconName;
  href: string;
  subItems?: { title: string; href: string; }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
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
      icon: 'Activity',
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
      icon: 'UserRound',
      href: '/admin/customers'
    },
    {
      title: 'Quản lý sản phẩm',
      icon: 'Package',
      href: '/admin/products',
      subItems: [
        { title: 'Danh sách sản phẩm', href: '/admin/products' },
        { title: 'Danh mục', href: '/admin/products/categories' },
      ]
    },
    {
      title: 'Quản lý tồn kho',
      icon: 'Layers',
      href: '/admin/inventory',
      subItems: [
        { title: 'Tồn kho', href: '/admin/inventory' },
        { title: 'Kiểm kê', href: '/admin/inventory/audit' },
        { title: 'Lịch sử biến động', href: '/admin/inventory/history' },
      ]
    },
    {
      title: 'Quản lý đơn hàng',
      icon: 'ShoppingCart',
      href: '/admin/orders',
      subItems: [
        { title: 'Danh sách đơn hàng', href: '/admin/orders' },
        { title: 'Yêu cầu đổi trả', href: '/admin/orders/returns' },
        { title: 'Bảo hành', href: '/admin/orders/warranty' },
      ]
    },
    {
      title: 'Quản lý khuyến mãi',
      icon: 'Tag',
      href: '/admin/promotions',
      subItems: [
        { title: 'Mã giảm giá', href: '/admin/promotions/vouchers' },
        { title: 'Chiến dịch', href: '/admin/promotions/campaigns' },
      ]
    },
    {
      title: 'Lịch tư vấn',
      icon: 'Clock',
      href: '/admin/appointments'
    },
    {
      title: 'Quản lý nội dung',
      icon: 'FileText',
      href: '/admin/content'
    },
    {
      title: 'Hội thoại Chatbox',
      icon: 'MessageCircle',
      href: '/admin/chat'
    },
    {
      title: 'Quản lý thiết kế',
      icon: 'Image',
      href: '/admin/designs'
    },
    {
      title: 'Cài đặt hệ thống',
      icon: 'Settings',
      href: '/admin/settings',
      subItems: [
        { title: 'Thông tin chung', href: '/admin/settings/general' },
        { title: 'Vận chuyển & Thanh toán', href: '/admin/settings/logistics' },
        { title: 'Tài khoản & Phân quyền', href: '/admin/settings/users' },
      ]
    }
  ];

  constructor(private router: Router) {
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
