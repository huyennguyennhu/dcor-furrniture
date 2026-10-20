import { IconComponent } from '../../../../shared/components/icon/icon';
import { OtpModalComponent } from '../../../../shared/components/otp-modal/otp-modal';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { Subscription, finalize } from 'rxjs';
import { AuthService, formatAuthError } from '../../../../core/services/auth.service';

export type AuthViewMode = 'LOGIN' | 'FORGOT_PHONE' | 'FORGOT_RESET';

export interface PasswordStrength {
  score: number;
  label: string;
  percent: number;
  barClass: string;
  textClass: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IconComponent,
    OtpModalComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    GoogleSigninButtonModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  viewMode: AuthViewMode = 'LOGIN';

  // --- LOGIN STATE ---
  phone = '';
  password = '';
  remember = true;
  showPassword = false;
  loading = false;
  error = '';
  successMessage = '';
  phoneTouched = false;
  passwordTouched = false;
  private autofillTimeout: any = null;

  // Khóa tài khoản do nhập sai 5 lần (423)
  isLocked = false;
  remainingLockSeconds = 0;
  private lockTimer: any = null;

  // --- FORGOT PASSWORD STATE ---
  forgotPhone = '';
  forgotLoading = false;
  forgotError = '';

  // OTP Modal (Dùng chung cho Quên mật khẩu)
  isForgotOtpOpen = false;
  forgotOtpLoading = false;
  forgotOtpErrorMessage = '';
  forgotOtpCountdown = 90;
  forgotOtpResendCountdown = 60;
  forgotDevOtpHint = '';

  // Đặt lại mật khẩu mới
  resetToken = '';
  newPassword = '';
  confirmNewPassword = '';
  showNewPassword = false;
  showConfirmNewPassword = false;
  resetLoading = false;
  resetError = '';

  private authSubscription!: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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
              this.navigateAfterLogin();
            },
            error: (err) => {
              this.error = formatAuthError(err, 'Đã có lỗi kết nối máy chủ khi đăng nhập Google.');
              this.cdr.markForCheck();
              this.socialAuthService.signOut().catch(() => {});
            }
          });
      }
    });

    this.autofillTimeout = setTimeout(() => {
      this.syncAutofillValues();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.autofillTimeout) {
      clearTimeout(this.autofillTimeout);
      this.autofillTimeout = null;
    }
    this.clearLockTimer();
  }

  // --- HELPERS & VALIDATION ---

  get isPhoneValid(): boolean {
    return /^0[35789]\d{8}$/.test(this.phone);
  }

  get shouldShowPhoneError(): boolean {
    return (this.phoneTouched || this.phone.length > 0) && !this.isPhoneValid;
  }

  get shouldShowPasswordEmptyError(): boolean {
    return this.passwordTouched && !this.password;
  }

  get shouldShowPasswordLengthError(): boolean {
    return !!this.password && this.password.length < 6;
  }

  get isLoginFormValid(): boolean {
    return this.isPhoneValid && this.password.length >= 6;
  }

  get isForgotPhoneValid(): boolean {
    return /^0[35789]\d{8}$/.test(this.forgotPhone);
  }

  get isNewPasswordFormatValid(): boolean {
    return (
      this.newPassword.length >= 8 &&
      /[A-Za-z]/.test(this.newPassword) &&
      /\d/.test(this.newPassword)
    );
  }

  get isConfirmNewPasswordValid(): boolean {
    return (
      this.confirmNewPassword.length > 0 &&
      this.confirmNewPassword === this.newPassword
    );
  }

  get isResetFormValid(): boolean {
    return this.isNewPasswordFormatValid && this.isConfirmNewPasswordValid;
  }

  get newPasswordStrength(): PasswordStrength {
    if (!this.newPassword) {
      return { score: 0, label: '', percent: 0, barClass: '', textClass: '' };
    }

    const hasLetter = /[a-zA-Z]/.test(this.newPassword);
    const hasNumber = /\d/.test(this.newPassword);
    const hasUpper = /[A-Z]/.test(this.newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(this.newPassword);

    if (this.newPassword.length < 8 || !hasLetter || !hasNumber) {
      return {
        score: 1,
        label: 'Yếu (Cần ít nhất 8 ký tự, gồm chữ và số)',
        percent: 33,
        barClass: 'bg-red-500',
        textClass: 'text-red-500'
      };
    }

    if (this.newPassword.length >= 10 && hasUpper && (hasSpecial || this.newPassword.length >= 12)) {
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

  get formattedLockTime(): string {
    const mins = Math.floor(this.remainingLockSeconds / 60);
    const secs = this.remainingLockSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onPhoneChange(val: string): void {
    this.phone = (val || '').slice(0, 10);
    if (this.phone.length > 0) {
      this.phoneTouched = true;
    }
    if (this.error && !this.isLocked) this.error = '';
    this.cdr.markForCheck();
  }

  onPhoneInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.onPhoneChange(target.value);
    }
  }

  onPhoneBlur(): void {
    this.phoneTouched = true;
    this.cdr.markForCheck();
  }

  clearPhone(): void {
    this.phone = '';
    this.phoneTouched = true;
    if (this.error && !this.isLocked) this.error = '';
    this.cdr.markForCheck();
  }

  onPasswordChange(val: string): void {
    this.password = val || '';
    if (this.password.length > 0) {
      this.passwordTouched = true;
    }
    this.error = '';
    this.cdr.markForCheck();
  }

  onPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.onPasswordChange(target.value);
    }
  }

  onPasswordBlur(): void {
    this.passwordTouched = true;
    this.cdr.markForCheck();
  }

  clearPassword(): void {
    this.password = '';
    this.passwordTouched = true;
    this.error = '';
    this.cdr.markForCheck();
  }

  private syncAutofillValues(): void {
    const phoneEl = document.getElementById('login-phone') as HTMLInputElement;
    const passEl = document.getElementById('login-password') as HTMLInputElement;
    let changed = false;

    if (phoneEl && phoneEl.value && phoneEl.value !== this.phone) {
      this.phone = phoneEl.value.slice(0, 10);
      this.phoneTouched = true;
      changed = true;
    }
    if (passEl && passEl.value && passEl.value !== this.password) {
      this.password = passEl.value;
      this.passwordTouched = true;
      changed = true;
    }
    if (changed) {
      this.cdr.markForCheck();
    }
  }

  onForgotPhoneChange(val: string): void {
    this.forgotPhone = (val || '').replace(/\D/g, '').slice(0, 10);
    this.forgotError = '';
    this.cdr.markForCheck();
  }

  // --- NAVIGATION & VIEW MODES ---

  switchToLogin(): void {
    this.viewMode = 'LOGIN';
    this.forgotError = '';
    this.resetError = '';
    this.isForgotOtpOpen = false;
    this.forgotDevOtpHint = '';
    this.phoneTouched = false;
    this.passwordTouched = false;
    this.cdr.markForCheck();
  }

  switchToForgot(): void {
    this.viewMode = 'FORGOT_PHONE';
    this.forgotPhone = this.phone || '';
    this.forgotError = '';
    this.error = '';
    this.successMessage = '';
    this.phoneTouched = false;
    this.passwordTouched = false;
    this.cdr.markForCheck();
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(
      returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/'
    );
  }

  // --- LOGIN FLOW ---

  handleLogin(e: Event): void {
    e.preventDefault();
    this.phoneTouched = true;
    this.passwordTouched = true;
    if (this.isLocked || this.loading || !this.isLoginFormValid) {
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.authService
      .login({
        phone: this.phone,
        password: this.password,
        remember: this.remember
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.clearLockTimer();
          this.authService.saveSession(res.token, res.user);
          this.cdr.markForCheck();
          this.navigateAfterLogin();
        },
        error: (err) => {
          // Xử lý tài khoản bị khóa tạm thời 423
          if (err.status === 423) {
            const secs = err.error?.remainingSeconds || 900;
            this.startLockCountdown(secs);
            return;
          }

          // Lỗi sai thông tin hiển thị chung chung không lộ thông tin tài khoản
          if (err.status === 401 || err.status === 400) {
            this.error = 'Số điện thoại hoặc mật khẩu không chính xác.';
            this.cdr.markForCheck();
            return;
          }

          this.error = formatAuthError(err, 'Đã có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
          this.cdr.markForCheck();
        }
      });
  }

  private startLockCountdown(seconds: number): void {
    this.isLocked = true;
    this.remainingLockSeconds = seconds;
    this.error = `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần liên tiếp.`;
    this.cdr.markForCheck();

    this.clearLockTimer();
    this.lockTimer = setInterval(() => {
      if (this.remainingLockSeconds > 0) {
        this.remainingLockSeconds--;
      } else {
        this.isLocked = false;
        this.clearLockTimer();
        this.error = 'Thời gian khóa đã hết. Bạn có thể thử đăng nhập lại.';
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  private clearLockTimer(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = null;
    }
  }

  // --- FORGOT PASSWORD STEP 1: GỬI SĐT ---

  handleForgotSendOtp(e: Event): void {
    e.preventDefault();
    if (!this.isForgotPhoneValid || this.forgotLoading) return;

    this.forgotLoading = true;
    this.forgotError = '';
    this.cdr.markForCheck();

    this.authService
      .sendOtp(this.forgotPhone, 'RESET_PASSWORD')
      .pipe(
        finalize(() => {
          this.forgotLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.forgotOtpCountdown = res.expiresIn || 90;
          this.forgotOtpResendCountdown = res.resendAfter || 60;
          this.forgotDevOtpHint = res.devOtp || '';
          this.forgotOtpErrorMessage = '';
          this.isForgotOtpOpen = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.forgotError = formatAuthError(err, 'Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.');
          this.cdr.markForCheck();
        }
      });
  }

  // --- FORGOT PASSWORD STEP 2: XÁC THỰC OTP ---

  handleForgotOtpVerify(otp: string): void {
    this.forgotOtpLoading = true;
    this.forgotOtpErrorMessage = '';
    this.cdr.markForCheck();

    this.authService
      .verifyForgotOtp({
        phone: this.forgotPhone,
        otp: otp.trim()
      })
      .pipe(
        finalize(() => {
          this.forgotOtpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.isForgotOtpOpen = false;
          this.forgotDevOtpHint = '';
          this.resetToken = res.resetToken;
          this.viewMode = 'FORGOT_RESET'; // Chuyển sang bước 3: Đặt mật khẩu mới
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.forgotOtpErrorMessage = formatAuthError(err, 'Mã OTP không chính xác hoặc đã hết hạn.');
          this.cdr.markForCheck();
        }
      });
  }

  handleForgotOtpResend(): void {
    this.forgotOtpLoading = true;
    this.forgotOtpErrorMessage = '';
    this.forgotDevOtpHint = '';
    this.cdr.markForCheck();

    this.authService
      .sendOtp(this.forgotPhone, 'RESET_PASSWORD')
      .pipe(
        finalize(() => {
          this.forgotOtpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.forgotOtpCountdown = res.expiresIn || 90;
          this.forgotOtpResendCountdown = res.resendAfter || 60;
          this.forgotDevOtpHint = res.devOtp || '';
          this.forgotOtpErrorMessage = '';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.forgotOtpErrorMessage = formatAuthError(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
          this.cdr.markForCheck();
        }
      });
  }

  handleForgotOtpClose(): void {
    this.isForgotOtpOpen = false;
    this.forgotOtpErrorMessage = '';
    this.forgotDevOtpHint = '';
    this.cdr.markForCheck();
  }

  // --- FORGOT PASSWORD STEP 3: ĐẶT MẬT KHẨU MỚI ---

  handleResetPassword(e: Event): void {
    e.preventDefault();
    if (!this.isResetFormValid || this.resetLoading) return;

    this.resetLoading = true;
    this.resetError = '';
    this.cdr.markForCheck();

    this.authService
      .resetPassword({
        resetToken: this.resetToken,
        newPassword: this.newPassword
      })
      .pipe(
        finalize(() => {
          this.resetLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.successMessage = 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.';
          this.phone = this.forgotPhone;
          this.password = '';
          this.switchToLogin();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.resetError = formatAuthError(
            err,
            'Mã xác nhận đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thao tác lại từ đầu.'
          );
          this.cdr.markForCheck();
        }
      });
  }
}
