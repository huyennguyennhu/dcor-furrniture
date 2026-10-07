import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-invite-accept',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-invite-accept.html',
  styleUrls: ['./admin-invite-accept.css'],
})
export class AdminInviteAcceptComponent implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      } else {
        this.error = 'Đường dẫn không hợp lệ. Vui lòng kiểm tra lại email mời.';
      }
    });
  }

  handleSetup(e: Event) {
    e.preventDefault();
    if (!this.email || !this.password || !this.confirmPassword) return;
    
    if (this.password !== this.confirmPassword) {
      this.error = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.post<any>('https://dcor-furrniture.onrender.com/api/auth/admin/invite-accept', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin-login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Có lỗi xảy ra khi kích hoạt tài khoản.';
      }
    });
  }
}
