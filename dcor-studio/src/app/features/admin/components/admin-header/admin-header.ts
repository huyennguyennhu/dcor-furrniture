import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, Output, HostListener, ElementRef, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';
import { AdminConsultationService } from '../../../../core/services/admin-consultation.service';
import { ChatUnreadService } from '../../pages/chat/services/chat-unread.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeader implements OnInit {
  @Input() sidebarCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<void>();
  isAccountMenuOpen = false;
  isNotifMenuOpen = false;

  readonly currentUser$;
  readonly totalNotifications = computed(() =>
    this.adminConsultationService.pendingCount() + this.chatUnreadService.totalUnread()
  );

  constructor(
    private adminAuthService: AdminAuthService,
    private elementRef: ElementRef,
    private router: Router,
    public adminConsultationService: AdminConsultationService,
    public chatUnreadService: ChatUnreadService
  ) {
    this.currentUser$ = this.adminAuthService.currentUser$;
  }

  ngOnInit(): void {
    this.adminConsultationService.startBadgeSync();
  }

  toggleNotifMenu(event: Event): void {
    event.stopPropagation();
    this.isAccountMenuOpen = false;
    this.isNotifMenuOpen = !this.isNotifMenuOpen;
    if (this.isNotifMenuOpen) {
      this.adminConsultationService.refreshPendingCount();
    }
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
