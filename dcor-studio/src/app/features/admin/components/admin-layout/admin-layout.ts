import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminHeader } from '../admin-header/admin-header';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminHeader, AdminSidebar],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayout implements OnInit {
  mounted = false;
  isSidebarCollapsed = false;

  constructor(
    private router: Router,
    private adminAuthService: AdminAuthService
  ) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  expandSidebar(): void {
    this.isSidebarCollapsed = false;
  }

  ngOnInit(): void {
    this.mounted = true;
    if (!this.adminAuthService.isLoggedIn()) {
      this.router.navigate(['/admin-login']);
    }
  }
}
