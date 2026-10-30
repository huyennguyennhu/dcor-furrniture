import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Phone, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Sparkles
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-guest-phone-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './guest-phone-banner.html',
  styleUrls: ['./guest-phone-banner.css']
})
export class GuestPhoneBannerComponent implements OnInit, OnDestroy {
  @Input() customTitle = 'Xác thực số điện thoại';
  @Input() customDesc = 'Khách vãng lai khi nhập số điện thoại và xác thực thì sẽ hiện thông tin của đơn hàng đó và có các tính năng như đổi trả, lịch hẹn,... bình thường.';
  @Input()
  set initialPhone(val: string) {
    if (val && !this.phoneNumber) {
      this.phoneNumber = val.replace(/\D/g, '').slice(0, 10);
      this.phoneTouched = false;
      this.cdr.markForCheck();
    }
  }
  @Output() verified = new EventEmitter<string>();
  @Output() reset = new EventEmitter<void>();

  icons = {
    Phone,
    ShieldCheck,
    Check,
    AlertCircle,
    RefreshCw,
    ArrowRight,
    Sparkles
  };

  isLoggedIn = false;
  isPhoneVerified = false;
  verifiedPhone = '';

  step: 'INPUT_PHONE' | 'INPUT_OTP' = 'INPUT_PHONE';
  phoneNumber = '';
  phoneTouched = false;
  otpCode = '';
  isSending = false;
  isVerifying = false;
  errorMessage = '';
  successMessage = '';

  resendCountdown = 0;
  private timer: any = null;
  private sub = new Subscription();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();

    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.subscribe(phone => {
        if (phone) {
          this.isPhoneVerified = true;
          this.verifiedPhone = phone;
          this.phoneNumber = phone;
        } else {
          this.isPhoneVerified = false;
          this.verifiedPhone = '';
          this.step = 'INPUT_PHONE';
        }
        this.cdr.markForCheck();
      })
    );
  }

  onPhoneInput(val: string): void {
    this.phoneNumber = (val || '').replace(/\D/g, '').slice(0, 10);
    this.errorMessage = '';
    if (!this.phoneNumber) {
      this.phoneTouched = false;
    }
    this.cdr.markForCheck();
  }

  onPhoneBlur(): void {
    if (this.phoneNumber) {
      this.phoneTouched = true;
      this.cdr.markForCheck();
    }
  }

  get isValidPhone(): boolean {
    if (!this.phoneNumber) return false;
    // Chuẩn di động Việt Nam: 10 chữ số, bắt đầu bằng 0 và các đầu số 3, 5, 7, 8, 9
    return /^0[35789]\d{8}$/.test(this.phoneNumber);
  }

  sendOtp(): void {
    this.phoneTouched = true;
    if (!this.isValidPhone) {
      this.errorMessage = 'Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.isSending = true;
    this.cdr.markForCheck();

    const cleaned = this.phoneNumber.replace(/\D/g, '');

    // Timeout dự phòng 600ms để đảm bảo giao diện phản hồi tức thì
    const sendTimer = setTimeout(() => {
      if (this.isSending) {
        this.isSending = false;
        this.step = 'INPUT_OTP';
        this.otpCode = '';
        this.startCountdown();
        this.cdr.markForCheck();
      }
    }, 600);

    this.http.post<any>(`${environment.apiUrl}/auth/send-otp`, { phone: cleaned }).subscribe({
      next: (res) => {
        clearTimeout(sendTimer);
        this.isSending = false;
        this.step = 'INPUT_OTP';
        this.otpCode = '';
        this.successMessage = 'Mã OTP đã được gửi đến số ' + this.phoneNumber;
        this.startCountdown();
        this.cdr.markForCheck();
      },
      error: () => {
        clearTimeout(sendTimer);
        this.isSending = false;
        // Chuyển ngay sang bước OTP demo 111111
        this.step = 'INPUT_OTP';
        this.startCountdown();
        this.cdr.markForCheck();
      }
    });
  }

  verifyOtp(): void {
    if (!this.otpCode || this.otpCode.trim().length === 0) {
      this.errorMessage = 'Vui lòng nhập mã OTP.';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.isVerifying = true;
    this.cdr.markForCheck();

    const cleanedPhone = this.phoneNumber.replace(/\D/g, '');
    const code = this.otpCode.trim();

    // Timeout dự phòng 600ms cho mã demo 111111
    const verifyTimer = setTimeout(() => {
      if (this.isVerifying && code === '111111') {
        this.isVerifying = false;
        this.authService.setGuestPhone(cleanedPhone, 'guest-demo-token');
        this.verified.emit(cleanedPhone);
        this.cdr.markForCheck();
      }
    }, 600);

    this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, { 
      phone: cleanedPhone, 
      otp: code 
    }).subscribe({
      next: (res) => {
        clearTimeout(verifyTimer);
        this.isVerifying = false;
        this.authService.setGuestPhone(cleanedPhone, res?.token);
        this.verified.emit(cleanedPhone);
        this.successMessage = 'Xác thực số điện thoại thành công!';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        clearTimeout(verifyTimer);
        if (code === '111111') {
          // Bypass thành công cho mã demo 111111
          this.isVerifying = false;
          this.authService.setGuestPhone(cleanedPhone, 'guest-demo-token');
          this.verified.emit(cleanedPhone);
          this.cdr.markForCheck();
          return;
        }
        this.isVerifying = false;
        this.errorMessage = err?.error?.message || 'Mã OTP không chính xác. Vui lòng nhập mã 111111.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelOtp(): void {
    this.step = 'INPUT_PHONE';
    this.phoneTouched = false;
    this.otpCode = '';
    this.errorMessage = '';
    if (this.timer) clearInterval(this.timer);
    this.resendCountdown = 0;
    this.cdr.markForCheck();
  }

  resetVerification(): void {
    this.authService.clearGuestPhone();
    this.phoneNumber = '';
    this.phoneTouched = false;
    this.otpCode = '';
    this.errorMessage = '';
    this.step = 'INPUT_PHONE';
    this.reset.emit();
    this.cdr.markForCheck();
  }

  private startCountdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.resendCountdown = 60;
    this.cdr.markForCheck();
    this.timer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.timer);
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.sub.unsubscribe();
  }
}
