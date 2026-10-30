import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, Package, ShieldCheck, CalendarDays, RefreshCw, Tag, Bell, Check, ChevronRight } from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { CustomerService, CustomerNotification } from '../../../../core/services/customer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, AccountSidebarComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class AccountNotificationsComponent implements OnInit, OnDestroy {
  readonly icons = {
    Package,
    ShieldCheck,
    CalendarDays,
    RefreshCw,
    Tag,
    Bell,
    Check,
    ChevronRight
  };

  notifications: CustomerNotification[] = [];
  filteredNotifications: CustomerNotification[] = [];
  isLoading = true;
  activeFilter = 'ALL';
  unreadCount = 0;
  errorMessage = '';

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.customerService.notifications$.subscribe((list) => {
        if (list) {
          this.notifications = list;
          this.applyFilter();
          if (list.length > 0) {
            this.isLoading = false;
          }
        }
      })
    );

    this.sub.add(
      this.customerService.unreadCount$.subscribe((count) => {
        this.unreadCount = count;
      })
    );

    this.loadNotifications();
  }

  loadNotifications(): void {
    if (this.notifications.length === 0) {
      this.isLoading = true;
    }
    this.sub.add(
      this.customerService.getNotifications().subscribe({
        next: (data) => {
          this.notifications = data || [];
          this.applyFilter();
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Không thể tải thông báo.';
          this.isLoading = false;
        }
      })
    );
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'ALL') {
      this.filteredNotifications = [...this.notifications];
    } else if (this.activeFilter === 'UNREAD') {
      this.filteredNotifications = this.notifications.filter(n => !n.isRead);
    } else if (this.activeFilter === 'ORDER') {
      this.filteredNotifications = this.notifications.filter(n => n.type === 'ORDER');
    } else if (this.activeFilter === 'SERVICE') {
      this.filteredNotifications = this.notifications.filter(n => n.type === 'APPOINTMENT' || n.type === 'RETURN' || n.type === 'WARRANTY');
    }
  }

  onNotificationClick(notif: CustomerNotification): void {
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
    }
  }

  markAllAsRead(): void {
    const unreadIds = this.notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    this.sub.add(
      this.customerService.markAllNotificationsRead(unreadIds).subscribe()
    );
  }

  getIcon(type: string): any {
    switch (type) {
      case 'ORDER': return this.icons.Package;
      case 'WARRANTY': return this.icons.ShieldCheck;
      case 'APPOINTMENT': return this.icons.CalendarDays;
      case 'RETURN': return this.icons.RefreshCw;
      case 'PROMO': return this.icons.Tag;
      default: return this.icons.Bell;
    }
  }

  getIconBgClass(type: string): string {
    switch (type) {
      case 'ORDER': return 'icon-bg-order';
      case 'WARRANTY': return 'icon-bg-warranty';
      case 'APPOINTMENT': return 'icon-bg-appointment';
      case 'RETURN': return 'icon-bg-return';
      case 'PROMO': return 'icon-bg-promo';
      default: return 'icon-bg-default';
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
