import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeader {
  @Input() sidebarCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<void>();
  isAccountMenuOpen = false;

  readonly currentUser$;

  constructor(private adminAuthService: AdminAuthService) {
    this.currentUser$ = this.adminAuthService.currentUser$;
  }

  handleLogout(): void {
    this.isAccountMenuOpen = false;
    this.adminAuthService.logout();
  }
}
