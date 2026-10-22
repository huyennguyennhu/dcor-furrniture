import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
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

  constructor(
    private adminAuthService: AdminAuthService,
    private elementRef: ElementRef
  ) {
    this.currentUser$ = this.adminAuthService.currentUser$;
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isAccountMenuOpen = false;
    }
  }

  handleLogout(): void {
    this.isAccountMenuOpen = false;
    this.adminAuthService.logout();
  }
}
