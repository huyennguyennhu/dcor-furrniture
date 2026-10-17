import { IconComponent, IconName } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AdminAuthService, AdminModule } from '../../../../core/services/admin-auth.service';

interface MenuItem {
  title: string;
  icon: IconName;
  href: string;
  module?: AdminModule; // Module tương ứng trong ma trận phân quyền
  subItems?: { title: string; href: string }[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.css']
})
export class AdminSidebar implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() expandSidebar = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  hoveredMenu: { href: string, top: number } | null = null;
  openMenu: string | null = null;
  activeHref = '';

  private hoverTimeout: any;
  private permSub?: Subscription;

  readonly ALL_MENU_ITEMS: MenuItem[] = [
    {
      title: 'Tổng quan',
      icon: 'House',
      href: '/admin/reports/overview'
      // Luôn cho phép hiển thị
    },
    {
      title: 'Báo cáo & Thống kê',
      icon: 'ChartNoAxesCombined',
      href: '/admin/reports/revenue',
      module: 'reports',
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
      href: '/admin/customers',
      module: 'customers'
    },
    {
      title: 'Sản phẩm',
      icon: 'Package',
      href: '/admin/products',
      module: 'products',
      subItems: [
        { title: 'Danh sách sản phẩm', href: '/admin/products' },
        { title: 'Danh mục', href: '/admin/products/categories' },
      ]
    },
    {
      title: 'Tồn kho',
      icon: 'Warehouse',
      href: '/admin/inventory',
      module: 'inventory',
      subItems: [
        { title: 'Tổng quan kho', href: '/admin/inventory' },
        { title: 'Kiểm kê', href: '/admin/inventory/audit' },
        { title: 'Lệnh xuất-nhập kho', href: '/admin/inventory/transactions' },
        { title: 'Lịch sử biến động', href: '/admin/inventory/history' },
      ]
    },
    {
      title: 'Đơn hàng',
      icon: 'ShoppingCart',
      href: '/admin/orders',
      module: 'orders',
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
      module: 'promotions',
      subItems: [
        { title: 'Mã giảm giá', href: '/admin/vouchers' },
        { title: 'Chiến dịch', href: '/admin/campaigns' },
      ]
    },
    {
      title: 'Tư vấn',
      icon: 'CalendarDays',
      href: '/admin/appointments/schedule',
      module: 'settings',
      subItems: [
        { title: 'Lịch tư vấn', href: '/admin/appointments/schedule' },
        { title: 'Yêu cầu tư vấn', href: '/admin/appointments/requests' },
      ]
    },
    {
      title: 'Blog',
      icon: 'Newspaper',
      href: '/admin/content',
      module: 'promotions'
    },
    {
      title: 'Hội thoại',
      icon: 'MessagesSquare',
      href: '/admin/chat',
      module: 'settings'
    },
    {
      title: 'Cộng đồng thiết kế',
      icon: 'Image',
      href: '/admin/designs/settings',
      module: 'settings',
      subItems: [
        { title: 'Cấu hình', href: '/admin/designs/settings' },
        { title: 'Bài viết cộng đồng', href: '/admin/designs/posts' },
      ]
    },
    {
      title: 'Nhân sự',
      icon: 'UsersRound',
      href: '/admin/staff/accounts',
      module: 'staff',
      subItems: [
        { title: 'Quản lý tài khoản', href: '/admin/staff/accounts' },
        { title: 'Ma trận phân quyền', href: '/admin/staff/permissions' },
      ]
    },
    {
      title: 'Nhật ký hoạt động',
      icon: 'ClipboardList',
      href: '/admin/activity',
      module: 'settings'
    }
  ];

  // Danh sách menu sau khi được lọc theo quyền 'view'
  visibleMenuItems: MenuItem[] = [];

  readonly SETTINGS_ITEM: MenuItem = {
    title: 'Cài đặt',
    icon: 'Settings',
    href: '/admin/settings',
    module: 'settings'
  };

  showSettings = true;

  constructor(
    private router: Router,
    private adminAuthService: AdminAuthService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.calculateActiveHref(this.router.url);
    });
  }

  ngOnInit(): void {
    // Lắng nghe sự thay đổi quyền từ AdminAuthService
    this.permSub = this.adminAuthService.permissions$.subscribe(() => {
      this.filterMenuItemsByPermission();
    });

    this.filterMenuItemsByPermission();
    this.calculateActiveHref(this.router.url);
  }

  ngOnDestroy(): void {
    this.permSub?.unsubscribe();
  }

  /**
   * Tự động ẩn các mục menu mà vai trò hiện tại không có quyền 'Xem' (view === false)
   */
  private filterMenuItemsByPermission(): void {
    const user = this.adminAuthService.currentUser;
    // Super Admin có quyền xem tất cả
    if (!user || user.role === 'Super Admin') {
      this.visibleMenuItems = [...this.ALL_MENU_ITEMS];
      this.showSettings = true;
      return;
    }

    this.visibleMenuItems = this.ALL_MENU_ITEMS.filter(item => {
      if (!item.module) return true; // Menu không yêu cầu quyền (vd: Tổng quan)
      return this.adminAuthService.hasPermission(item.module, 'view');
    });

    this.showSettings = this.adminAuthService.hasPermission('settings', 'view');
  }

  calculateActiveHref(pathname: string): void {
    let maxLen = 0;
    this.activeHref = '';
    this.openMenu = null;
    for (const item of this.visibleMenuItems) {
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

    for (const item of this.visibleMenuItems) {
      if (item.href === this.activeHref || (item.subItems && item.subItems.some(sub => sub.href === this.activeHref))) {
        this.openMenu = item.href;
        break;
      }
    }
    if (this.SETTINGS_ITEM.href === this.activeHref) {
      this.openMenu = null;
    }
  }

  isParentActive(item: MenuItem): boolean {
    if (item.href === this.activeHref) return true;
    if (item.subItems) {
      return item.subItems.some(sub => sub.href === this.activeHref);
    }
    return false;
  }

  toggleMenu(href: string): void {
    if (this.openMenu === href) {
      this.openMenu = null;
    } else {
      this.openMenu = href;
    }
  }

  selectMenu(href: string): void {
    if (this.isCollapsed) {
      this.expandSidebar.emit();
      this.openMenu = href;
    }
  }

  handleMouseEnter(event: MouseEvent, href: string): void {
    if (!this.isCollapsed) return;
    clearTimeout(this.hoverTimeout);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.hoveredMenu = {
      href,
      top: rect.top
    };
  }

  handleMouseLeave(): void {
    if (!this.isCollapsed) return;
    this.hoverTimeout = setTimeout(() => {
      this.hoveredMenu = null;
    }, 150);
  }

  handleDropdownMouseEnter(): void {
    clearTimeout(this.hoverTimeout);
  }

  handleDropdownMouseLeave(): void {
    this.hoveredMenu = null;
  }

  closeHoveredMenu(): void {
    this.hoveredMenu = null;
  }
}
