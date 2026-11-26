import { IconComponent, IconName } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, Output, HostListener, ElementRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';
import { AdminConsultationService, ConsultationItem } from '../../../../core/services/admin-consultation.service';
import { ChatUnreadService } from '../../pages/chat/services/chat-unread.service';
import { OrdersService } from '../../pages/orders/services/orders.service';
import { OrderV2 } from '../../pages/orders/models/order.model';
import { CustomRequestService, CustomRequest } from '../../../../core/services/custom-request.service';
import { OrdersReturnsMockService, ReturnRequest } from '../../pages/orders/orders-returns/services/orders-returns-mock.service';

export type AdminNotifTab = 'UNSEEN' | 'SEEN';
export type AdminNotifParentModule = 'ALL' | 'Đơn hàng' | 'Tư vấn' | 'Hội thoại';
export type AdminNotifSourceKey = 'order' | 'custom' | 'return' | 'consult' | 'chat';

export interface AdminNotificationItem {
  id: string;
  parentModule: 'Đơn hàng' | 'Tư vấn' | 'Hội thoại';
  sourcePage: string;
  sourceKey: AdminNotifSourceKey;
  icon: IconName;
  title: string;
  desc: string;
  createdAt: string;
  timestamp: number;
  route: string[];
  isSeen: boolean;
}

const SEEN_NOTIFS_STORAGE_KEY = 'dcor_admin_seen_notifications';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeader implements OnInit, OnDestroy {
  @Input() sidebarCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<void>();
  isAccountMenuOpen = false;
  isNotifMenuOpen = false;

  activeNotifTab: AdminNotifTab = 'UNSEEN';
  selectedNotifModule: AdminNotifParentModule = 'ALL';
  readonly NOTIF_MODULES: AdminNotifParentModule[] = ['ALL', 'Đơn hàng', 'Tư vấn', 'Hội thoại'];

  private seenIds = new Set<string>();
  private ordersList: OrderV2[] = [];
  private customRequestsList: CustomRequest[] = [];
  private returnsList: ReturnRequest[] = [];
  private consultations: ConsultationItem[] = [];
  private subs = new Subscription();

  readonly currentUser$;

  constructor(
    private adminAuthService: AdminAuthService,
    private elementRef: ElementRef,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public adminConsultationService: AdminConsultationService,
    public chatUnreadService: ChatUnreadService,
    private ordersService: OrdersService,
    private customRequestService: CustomRequestService,
    private returnsService: OrdersReturnsMockService
  ) {
    this.currentUser$ = this.adminAuthService.currentUser$;
    this.loadSeenIds();
  }

  private loadSeenIds(): void {
    try {
      const raw = localStorage.getItem(SEEN_NOTIFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.seenIds = new Set(parsed.map(String));
        }
      }
    } catch (_) {}
  }

  private saveSeenIds(): void {
    try {
      const arr = Array.from(this.seenIds).slice(-300);
      localStorage.setItem(SEEN_NOTIFS_STORAGE_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  ngOnInit(): void {
    this.adminConsultationService.startBadgeSync();
    this.fetchConsultationsForNotif();
    this.ordersService.fetchOrders();
    this.returnsService.fetchFromBackend();

    this.subs.add(
      this.ordersService.orders$.subscribe(list => {
        this.ordersList = Array.isArray(list) ? list : [];
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.customRequestService.requests$.subscribe(list => {
        this.customRequestsList = Array.isArray(list) ? list : [];
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.returnsService.returns$.subscribe(list => {
        this.returnsList = Array.isArray(list) ? list : [];
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private fetchConsultationsForNotif(): void {
    this.adminConsultationService.getAdminConsultations({ tab: 'requests' }).subscribe({
      next: (res) => {
        if (Array.isArray(res?.consultations)) {
          this.consultations = res.consultations;
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  private toTimestamp(dateStr?: string): number {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  }

  get allNotifications(): AdminNotificationItem[] {
    const items: AdminNotificationItem[] = [];

    // 1. Đơn hàng (từ Danh sách đơn hàng)
    this.ordersList.slice(0, 30).forEach(o => {
      if (o.status === 'PENDING' || o.status === 'CONFIRMED') {
        const id = `order-${o.id || o.orderNumber}`;
        const created = o.createdAt || new Date().toISOString();
        items.push({
          id,
          parentModule: 'Đơn hàng',
          sourcePage: 'Danh sách đơn hàng',
          sourceKey: 'order',
          icon: 'ShoppingCart',
          title: `Đơn hàng mới #${o.orderNumber}`,
          desc: `${o.customerName || 'Khách hàng'} • ${(o.totalAmount || 0).toLocaleString('vi-VN')} ₫`,
          createdAt: created,
          timestamp: this.toTimestamp(created),
          route: ['/admin/orders', o.id || o.orderNumber],
          isSeen: this.seenIds.has(id)
        });
      }
    });

    // 2. Yêu cầu Custom (thuộc tab cha Đơn hàng)
    this.customRequestsList.slice(0, 30).forEach(r => {
      if (['PENDING_REVIEW', 'CONSULTING', 'QUOTED', 'AWAITING_CONTRACT', 'CONTRACT_SIGNED', 'AWAITING_PAYMENT'].includes(r.status)) {
        const id = `custom-${r.id}`;
        const created = r.updatedAt || r.createdAt || new Date().toISOString();
        items.push({
          id,
          parentModule: 'Đơn hàng',
          sourcePage: 'Yêu cầu Custom',
          sourceKey: 'custom',
          icon: 'Sparkles',
          title: `Yêu cầu may đo #${r.code}`,
          desc: `${r.customerName || 'Khách hàng'} • ${r.productName || 'Sản phẩm thiết kế riêng'}`,
          createdAt: created,
          timestamp: this.toTimestamp(created),
          route: ['/admin/custom-requests', r.id],
          isSeen: this.seenIds.has(id)
        });
      }
    });

    // 3. Yêu cầu đổi trả (thuộc tab cha Đơn hàng)
    this.returnsList.slice(0, 30).forEach(ret => {
      if (['PENDING', 'REVIEWING', 'APPROVED', 'RETURNING'].includes(ret.status)) {
        const id = `return-${ret.id}`;
        const created = ret.createdAt || new Date().toISOString();
        items.push({
          id,
          parentModule: 'Đơn hàng',
          sourcePage: 'Yêu cầu đổi trả',
          sourceKey: 'return',
          icon: 'RotateCcw',
          title: `Yêu cầu đổi trả #${ret.id}`,
          desc: `${ret.customer?.name || 'Khách hàng'} • Đơn #${ret.orderNumber}`,
          createdAt: created,
          timestamp: this.toTimestamp(created),
          route: ['/admin/orders/returns', ret.id],
          isSeen: this.seenIds.has(id)
        });
      }
    });

    // 4. Tư vấn (thuộc tab cha Tư vấn)
    if (this.consultations.length > 0) {
      this.consultations.slice(0, 30).forEach(c => {
        if (c.status === 'PENDING' || c.status === 'CONFIRMED') {
          const id = `consult-${c.id}`;
          const created = c.created_at || new Date().toISOString();
          items.push({
            id,
            parentModule: 'Tư vấn',
            sourcePage: 'Yêu cầu tư vấn',
            sourceKey: 'consult',
            icon: 'CalendarDays',
            title: `Lịch tư vấn ${c.appointment_code || ''}`.trim(),
            desc: `${c.customer_name || 'Khách hàng'} • ${c.showroom_name || 'Showroom'}`,
            createdAt: created,
            timestamp: this.toTimestamp(created),
            route: ['/admin/appointments/requests'],
            isSeen: this.seenIds.has(id)
          });
        }
      });
    } else if (this.adminConsultationService.pendingCount() > 0) {
      const count = this.adminConsultationService.pendingCount();
      const id = `consult-summary-${count}`;
      items.push({
        id,
        parentModule: 'Tư vấn',
        sourcePage: 'Yêu cầu tư vấn',
        sourceKey: 'consult',
        icon: 'CalendarDays',
        title: 'Yêu cầu tư vấn chờ duyệt',
        desc: `Có ${count} yêu cầu tư vấn mới từ khách hàng`,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        route: ['/admin/appointments/requests'],
        isSeen: this.seenIds.has(id)
      });
    }

    // 5. Hội thoại (thuộc tab cha Hội thoại)
    const chatUnread = this.chatUnreadService.totalUnread();
    if (chatUnread > 0) {
      const id = `chat-unread-${chatUnread}`;
      items.push({
        id,
        parentModule: 'Hội thoại',
        sourcePage: 'Hội thoại',
        sourceKey: 'chat',
        icon: 'MessagesSquare',
        title: 'Tin nhắn khách hàng mới',
        desc: `Có ${chatUnread} tin nhắn chưa đọc cần phản hồi`,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        route: ['/admin/chat'],
        isSeen: this.seenIds.has(id)
      });
    }

    // Sắp xếp từ mới nhất đến cũ nhất
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }

  get unseenCount(): number {
    return this.allNotifications.filter(n => !n.isSeen).length;
  }

  get seenCount(): number {
    return this.allNotifications.filter(n => n.isSeen).length;
  }

  get filteredNotifications(): AdminNotificationItem[] {
    return this.allNotifications.filter(n => {
      const matchTab = this.activeNotifTab === 'UNSEEN' ? !n.isSeen : n.isSeen;
      const matchModule = this.selectedNotifModule === 'ALL' || n.parentModule === this.selectedNotifModule;
      return matchTab && matchModule;
    });
  }

  toggleNotifMenu(event: Event): void {
    event.stopPropagation();
    this.isAccountMenuOpen = false;
    this.isNotifMenuOpen = !this.isNotifMenuOpen;
    if (this.isNotifMenuOpen) {
      this.adminConsultationService.refreshPendingCount();
      this.fetchConsultationsForNotif();
    }
  }

  setNotifTab(tab: AdminNotifTab, event: Event): void {
    event.stopPropagation();
    this.activeNotifTab = tab;
  }

  setNotifModule(mod: AdminNotifParentModule, event: Event): void {
    event.stopPropagation();
    this.selectedNotifModule = mod;
  }

  onNotifClick(item: AdminNotificationItem): void {
    this.seenIds.add(item.id);
    this.saveSeenIds();
    this.isNotifMenuOpen = false;
    this.router.navigate(item.route);
  }

  markAsSeen(item: AdminNotificationItem, event: Event): void {
    event.stopPropagation();
    this.seenIds.add(item.id);
    this.saveSeenIds();
  }

  markAllAsSeen(event: Event): void {
    event.stopPropagation();
    this.allNotifications.forEach(n => this.seenIds.add(n.id));
    this.saveSeenIds();
  }

  formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  openNotificationsTarget(path: string): void {
    this.isNotifMenuOpen = false;
    this.router.navigate([path]);
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.isNotifMenuOpen = false;
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isAccountMenuOpen = false;
      this.isNotifMenuOpen = false;
    }
  }

  handleLogout(): void {
    this.isAccountMenuOpen = false;
    this.isNotifMenuOpen = false;
    this.adminAuthService.logout();
  }
}
