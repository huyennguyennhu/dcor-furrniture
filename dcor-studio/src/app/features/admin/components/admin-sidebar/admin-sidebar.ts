import { IconComponent, IconName } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem {
  title: string;
  icon: IconName;
  href: string;
  subItems?: { title: string; href: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.css']
})
export class AdminSidebar implements OnInit {
  @Input() isCollapsed = false;
  @Output() expandSidebar = new EventEmitter<void>();
  hoveredMenu: { href: string, top: number } | null = null;
  openMenu: string | null = null;
  activeHref = '';

  private hoverTimeout: any;

  MENU_ITEMS: MenuItem[] = [
    {
      title: 'Tổng quan',
      icon: 'House',
      href: '/admin/reports/overview'
    },
    {
      title: 'Báo cáo & Thống kê',
      icon: 'ChartNoAxesCombined',
      href: '/admin/reports/revenue',
      subItems: [
        { title: 'Báo cáo doanh thu', href: '/admin/reports/revenue' },
        { title: 'Báo cáo đơn hàng', href: '/admin/reports/orders' },
        { title: 'Báo cáo sản phẩm', href: '/admin/reports/products' },
        { title: 'Báo cáo khách hàng', href: '/admin/reports/customers' },
      ]
    },
    {
      title: 'Khách hàng',
      icon: 'UsersRound',
      href: '/admin/customers'
    },
    {
      title: 'Sản phẩm',
      icon: 'Package',
      href: '/admin/products',
      subItems: [
        { title: 'Danh sách sản phẩm', href: '/admin/products' },
        { title: 'Danh mục', href: '/admin/products/categories' },
      ]
    },
    {
      title: 'Tồn kho',
      icon: 'Warehouse',
      href: '/admin/inventory',
        { title: 'Tổng quan kho', href: '/admin/inventory' },
        { title: 'Kiểm kê', href: '/admin/inventory/audit' },
        { title: 'Lệnh xuất-nhập kho', href: '/admin/inventory/transactions' },
        { title: 'Phiếu xuất kho', href: '/admin/inventory/orders' },
        { title: 'Lịch sử biến động', href: '/admin/inventory/history' },
      ]
    },
    {
      title: 'Đơn hàng',
      icon: 'ShoppingCart',
      href: '/admin/orders',
      subItems: [
        { title: 'Danh sách đơn hàng', href: '/admin/orders' },
        { title: 'Yêu cầu đổi trả', href: '/admin/orders/returns' },
        { title: 'Bảo hành', href: '/admin/orders/warranty' },
      ]
    },
    {
      title: 'Khuyến mãi',
      icon: 'TicketPercent',
      href: '/admin/vouchers',
      subItems: [
        { title: 'Mã giảm giá', href: '/admin/vouchers' },
        { title: 'Chiến dịch', href: '/admin/campaigns' },
      ]
    },
    {
      title: 'Tư vấn',
      icon: 'CalendarDays',
      href: '/admin/appointments/schedule',
      subItems: [
        { title: 'Lịch tư vấn', href: '/admin/appointments/schedule' },
        { title: 'Yêu cầu tư vấn', href: '/admin/appointments/requests' },
      ]
    },
    {
      title: 'Blog',
      icon: 'Newspaper',
      href: '/admin/content'
    },
    {
      title: 'Hội thoại',
      icon: 'MessagesSquare',
      href: '/admin/chat'
    },
    {
      title: 'Cộng đồng thiết kế',
      icon: 'Image',
      href: '/admin/designs/settings',
      subItems: [
        { title: 'Cấu hình', href: '/admin/designs/settings' },
        { title: 'Bài viết cộng đồng', href: '/admin/designs/posts' },
      ]
    },
    {
      title: 'Nhân sự',
      icon: 'UsersRound',
      href: '/admin/staff/accounts',
      subItems: [
        { title: 'Quản lý tài khoản', href: '/admin/staff/accounts' },
        { title: 'Ma trận phân quyền', href: '/admin/staff/permissions' },
      ]
    },
    {
      title: 'Nhật ký hoạt động',
      icon: 'ClipboardList',
      href: '/admin/activity'
    }
  ];

  SETTINGS_ITEM: MenuItem = {
    title: 'Cài đặt',
    icon: 'Settings',
    href: '/admin/settings'
  };

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
    this.activeHref = '';
    this.openMenu = null;
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
    if (this.SETTINGS_ITEM.href === this.activeHref) {
      this.openMenu = null;
    }
  }

  toggleMenu(href: string) {
    if (this.isCollapsed) this.expandSidebar.emit();
    this.openMenu = this.openMenu === href ? null : href;
  }

  selectMenu(href: string) {
    if (this.isCollapsed) this.expandSidebar.emit();
    this.openMenu = href;
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
    this.hoveredMenu = null;
  }

  closeHoveredMenu() {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.hoveredMenu = null;
  }
}
