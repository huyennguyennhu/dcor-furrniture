import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  rememberMe = true;
  showPassword = false;
  loading = false;
  error = '';

  // Form Quên mật khẩu
  isForgotPassword = false;
  forgotEmail = '';
  forgotLoading = false;
  resetSuccess = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private adminAuthService: AdminAuthService
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.error = params['error'] === 'account_locked'
          ? 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt.'
          : params['error'];
      }
      if (params['forbidden']) {
        this.error = `Bạn không có quyền truy cập vào chức năng ${params['forbidden']}.`;
      }
    });
  }

  ngOnInit(): void {
    this.checkIfAlreadyLoggedIn();

    // Lắng nghe sự kiện pageshow để xử lý khi trình duyệt phục hồi trang từ Back-Forward Cache (bfcache)
    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', this.handlePageShow);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pageshow', this.handlePageShow);
    }
  }

  private handlePageShow = (event: PageTransitionEvent): void => {
    // Kích hoạt lại kiểm tra khi người dùng bấm Back/Forward phục hồi từ bộ nhớ cache trình duyệt
    this.checkIfAlreadyLoggedIn();
  };

  private checkIfAlreadyLoggedIn(): void {
    const hasToken = !!localStorage.getItem('dcor_admin_token');
    const hasUser = !!this.adminAuthService.currentUser$.value || !!localStorage.getItem('dcor_admin_user');
    if (hasToken && hasUser) {
      this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true });
    }
  }

  handleLogin(e: Event): void {
    e.preventDefault();
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    this.adminAuthService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
        this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      },
      error: (err: any) => {
        this.loading = false;
        // Thông báo lỗi bảo mật chung chung theo Style Guide
        if (err?.message?.includes('khóa') || err?.message?.includes('kích hoạt')) {
          this.error = err.message;
        } else {
          this.error = 'Email hoặc mật khẩu không chính xác.';
        }
      }
    });
  }

  toggleForgotPassword(show: boolean): void {
    this.isForgotPassword = show;
    this.error = '';
    this.resetSuccess = '';
    if (show && this.email) {
      this.forgotEmail = this.email;
    }
  }

  handleForgotPassword(e: Event): void {
    e.preventDefault();
    if (!this.forgotEmail) return;

    this.forgotLoading = true;
    this.error = '';
    this.resetSuccess = '';

    this.adminAuthService.forgotPassword(this.forgotEmail).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.resetSuccess = res?.message || `Đã gửi hướng dẫn khôi phục mật khẩu tới ${this.forgotEmail}. Vui lòng kiểm tra hộp thư!`;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.error = err.message || 'Không thể gửi yêu cầu khôi phục mật khẩu.';
      }
    });
  }
}
