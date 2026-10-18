import { IconComponent } from '../../../../shared/components/icon/icon';
import { OtpModalComponent } from '../../../../shared/components/otp-modal/otp-modal';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { Subscription, finalize } from 'rxjs';
import { AuthService, formatAuthError } from '../../../../core/services/auth.service';

export interface PasswordStrength {
  score: number; // 0, 1, 2, 3
  label: string; // '', 'Yếu', 'Trung bình', 'Mạnh'
  percent: number; // 0, 33, 66, 100
  barClass: string;
  textClass: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    IconComponent,
    OtpModalComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    GoogleSigninButtonModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  fullName = '';
  phone = '';
  password = '';
  confirmPassword = '';
  agreeTerms = false;

  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  error = '';
  success = '';

  // OTP Modal State
  isOtpModalOpen = false;
  otpLoading = false;
  otpErrorMessage = '';
  otpCountdown = 90;
  otpResendCountdown = 60;
  devOtpHint = '';

  private authSubscription!: Subscription;
  private redirectTimeout: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Luồng đăng nhập Google hiện có
    this.authSubscription = this.socialAuthService.authState.subscribe((user) => {
      if (user && user.email) {
        this.loading = true;
        this.error = '';
        this.cdr.markForCheck();

        const payload = {
          email: user.email,
          fullName: user.name || 'Khách hàng Google',
          avatarUrl: user.photoUrl
        };

        this.authService
          .googleLogin(payload)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.cdr.markForCheck();
            })
          )
          .subscribe({
            next: (res) => {
              this.authService.saveSession(res.token, res.user);
              this.cdr.markForCheck();
              this.router.navigate(['/']);
            },
            error: (err) => {
              this.error = formatAuthError(err, 'Đã có lỗi kết nối máy chủ khi đăng nhập Google.');
              this.cdr.markForCheck();
              this.socialAuthService.signOut().catch(() => {});
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
      this.redirectTimeout = null;
    }
  }

  // --- VALIDATION & STRENGTH HELPERS ---

  onPhoneChange(val: string): void {
    this.phone = val.replace(/\D/g, '').slice(0, 10);
    this.error = '';
    this.cdr.markForCheck();
  }

  get isPhoneValid(): boolean {
    return /^0[35789]\d{8}$/.test(this.phone);
  }

  get isPasswordFormatValid(): boolean {
    // Tối thiểu 8 ký tự, bao gồm cả chữ cái và số
    return this.password.length >= 8 && /[A-Za-z]/.test(this.password) && /\d/.test(this.password);
  }

  get isConfirmPasswordValid(): boolean {
    return this.confirmPassword.length > 0 && this.confirmPassword === this.password;
  }

  get passwordStrength(): PasswordStrength {
    if (!this.password) {
      return { score: 0, label: '', percent: 0, barClass: '', textClass: '' };
    }

    const hasLetter = /[a-zA-Z]/.test(this.password);
    const hasNumber = /\d/.test(this.password);
    const hasUpper = /[A-Z]/.test(this.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.password);
    const isLongEnough = this.password.length >= 8;

    if (!isLongEnough || !hasLetter || !hasNumber) {
      return {
        score: 1,
        label: 'Yếu (Cần tối thiểu 8 ký tự, cả chữ và số)',
        percent: 33,
        barClass: 'bg-red-500',
        textClass: 'text-red-500'
      };
    }

    // Đã đạt chuẩn tối thiểu (score >= 2)
    if (this.password.length >= 10 && hasUpper && (hasSpecial || this.password.length >= 12)) {
      return {
        score: 3,
        label: 'Mạnh',
        percent: 100,
        barClass: 'bg-emerald-600',
        textClass: 'text-emerald-600'
      };
    }

    return {
      score: 2,
      label: 'Trung bình',
      percent: 66,
      barClass: 'bg-amber-500',
      textClass: 'text-amber-500'
    };
  }

  get isFormValid(): boolean {
    return (
      this.fullName.trim().length >= 2 &&
      this.isPhoneValid &&
      this.isPasswordFormatValid &&
      this.isConfirmPasswordValid &&
      this.agreeTerms
    );
  }

  // --- ACTIONS ---

  handleRegister(e: Event): void {
    e.preventDefault();
    this.error = '';
    this.success = '';

    if (!this.fullName.trim()) {
      this.error = 'Vui lòng nhập họ và tên.';
      return;
    }

    if (!this.isPhoneValid) {
      this.error = 'Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số (đầu 03, 05, 07, 08, 09).';
      return;
    }

    if (!this.isPasswordFormatValid) {
      this.error = 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và số.';
      return;
    }

    if (!this.isConfirmPasswordValid) {
      this.error = 'Mật khẩu nhập lại không trùng khớp.';
      return;
    }

    if (!this.agreeTerms) {
      this.error = 'Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.';
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    // Bước 1: Gửi yêu cầu OTP đăng ký
    this.authService
      .sendOtp(this.phone, 'REGISTER')
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.otpCountdown = res.expiresIn || 90;
          this.otpResendCountdown = res.resendAfter || 60;
          this.devOtpHint = res.devOtp || '';
          this.otpErrorMessage = '';
          this.isOtpModalOpen = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (err.status === 400 && err.error?.message?.includes('đã được đăng ký')) {
            this.error = 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng số khác.';
          } else {
            this.error = formatAuthError(err, 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.');
          }
          this.cdr.markForCheck();
        }
      });
  }

  handleOtpVerify(otp: string): void {
    this.otpLoading = true;
    this.otpErrorMessage = '';
    this.cdr.markForCheck();

    const payload = {
      fullName: this.fullName.trim(),
      phone: this.phone,
      password: this.password,
      otp: otp.trim()
    };

    this.authService
      .register(payload)
      .pipe(
        finalize(() => {
          this.otpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.isOtpModalOpen = false;
          this.authService.saveSession(res.token, res.user);
          this.success = 'Đăng ký thành công! Đang chuyển hướng về trang chủ...';
          this.cdr.markForCheck();
          if (this.redirectTimeout) clearTimeout(this.redirectTimeout);
          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/']);
          }, 1200);
        },
        error: (err) => {
          this.otpErrorMessage = formatAuthError(err, 'Mã OTP không chính xác hoặc đã hết hạn.');
          this.cdr.markForCheck();
        }
      });
  }

  handleOtpResend(): void {
    this.otpLoading = true;
    this.otpErrorMessage = '';
    this.cdr.markForCheck();

    this.authService
      .sendOtp(this.phone, 'REGISTER')
      .pipe(
        finalize(() => {
          this.otpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.otpCountdown = res.expiresIn || 90;
          this.otpResendCountdown = res.resendAfter || 60;
          this.devOtpHint = res.devOtp || '';
          this.otpErrorMessage = '';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.otpErrorMessage = formatAuthError(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
          this.cdr.markForCheck();
        }
      });
  }

  handleOtpClose(): void {
    this.isOtpModalOpen = false;
    this.otpErrorMessage = '';
    this.cdr.markForCheck();
  }
}
