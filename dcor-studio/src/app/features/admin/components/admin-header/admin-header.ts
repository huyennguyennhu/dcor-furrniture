import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {}

  handleLogout(): void {
    this.isAccountMenuOpen = false;
    localStorage.removeItem('dcor_user');
    this.router.navigate(['/login']);
  }
}
