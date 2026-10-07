import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminHeader } from '../admin-header/admin-header';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminHeader, AdminSidebar],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css']
})
export class AdminLayout implements OnInit {
  mounted = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.mounted = true;
    const userStr = localStorage.getItem('dcor_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
          alert('Bạn không có quyền truy cập trang quản trị!');
          this.router.navigate(['/']);
        }
      } catch (e) {
        // ignore JSON parse error
      }
    } else {
      // alert('Vui lòng đăng nhập tài khoản quản trị!');
      // this.router.navigate(['/login']);
    }
  }
}
