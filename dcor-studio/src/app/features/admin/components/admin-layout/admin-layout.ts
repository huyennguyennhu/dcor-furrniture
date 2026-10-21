import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminHeader } from '../admin-header/admin-header';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

const SIDEBAR_COLLAPSED_KEY = 'dcor_admin_sidebar_collapsed';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminHeader, AdminSidebar],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayout implements OnInit {
  mounted = false;
  isSidebarCollapsed = this.getInitialSidebarState();

  constructor(
    private router: Router,
    private adminAuthService: AdminAuthService
  ) {}

  private getInitialSidebarState(): boolean {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved !== null ? JSON.parse(saved) === true : false;
    } catch {
      return false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.saveSidebarState();
  }

  expandSidebar(): void {
    if (this.isSidebarCollapsed) {
      this.isSidebarCollapsed = false;
      this.saveSidebarState();
    }
  }

  private saveSidebarState(): void {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(this.isSidebarCollapsed));
    } catch (_) {}
  }

  ngOnInit(): void {
    this.mounted = true;
    if (!this.adminAuthService.isLoggedIn()) {
      this.router.navigate(['/admin-login']);
    }
  }
}
