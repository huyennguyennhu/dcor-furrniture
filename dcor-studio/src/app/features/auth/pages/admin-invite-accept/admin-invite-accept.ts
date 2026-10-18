import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-invite-accept',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-invite-accept.html',
  styleUrls: ['./admin-invite-accept.css'],
})
export class AdminInviteAcceptComponent implements OnInit {
  token = '';
  email = '';
  fullName = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  error = '';
  success = false;
  isTokenExpired = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private adminAuthService: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token && !this.email) {
        this.error = 'Không tìm thấy mã thư mời. Vui lòng kiểm tra lại liên kết trong email.';
        this.isTokenExpired = true;
        return;
      }

      this.validateToken();
    });
  }

  /**
   * Kiểm tra tính hợp lệ và thời hạn của token
   */
  private validateToken(): void {
    // 1. Kiểm tra tham số expired trên URL
    if (this.route.snapshot.queryParams['expired'] === 'true') {
      this.isTokenExpired = true;
      this.error = 'Lời mời đã hết hạn. Vui lòng yêu cầu Super Admin gửi lại lời mời mới.';
      return;
    }

    // 2. Nếu token có dạng JWT (3 phần phân cách bởi dấu chấm)
    if (this.token && this.token.includes('.')) {
      try {
        const payloadBase64 = this.token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));

        if (payload.exp && payload.exp * 1000 < Date.now()) {
          this.isTokenExpired = true;
          this.error = 'Liên kết kích hoạt tài khoản đã hết hạn. Vui lòng yêu cầu Super Admin gửi lại lời mời mới.';
          return;
        }

        if (payload.email) this.email = payload.email;
        if (payload.fullName) this.fullName = payload.fullName;
      } catch (e) {
        // Token chuỗi thường, tiếp tục
      }
    }

    // Tự sinh họ tên nếu chưa có
    if (!this.fullName && this.email) {
      const namePart = this.email.split('@')[0];
      this.fullName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
  }

  handleSetup(e: Event): void {
    e.preventDefault();
    if (this.isTokenExpired) return;

    if (!this.fullName.trim()) {
      this.error = 'Vui lòng xác nhận họ và tên của bạn.';
      return;
    }

    if (!this.password || !this.confirmPassword) {
      this.error = 'Vui lòng nhập và xác nhận mật khẩu mới.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.adminAuthService.activateAccount(this.token, this.password, this.fullName, this.email).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 1200);
      },
      error: (err: any) => {
        this.loading = false;
        if (err?.message?.toLowerCase().includes('hết hạn') || err?.message?.toLowerCase().includes('expired')) {
          this.isTokenExpired = true;
          this.error = 'Liên kết kích hoạt đã hết hạn. Vui lòng yêu cầu Super Admin gửi lại lời mời mới.';
        } else {
          this.error = err.message || 'Có lỗi xảy ra khi kích hoạt tài khoản. Vui lòng thử lại.';
        }
      }
    });
  }
}
