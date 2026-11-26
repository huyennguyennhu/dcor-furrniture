import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Pencil, 
  Camera, 
  Plus, 
  LockKeyhole, 
  Mail, 
  Phone, 
  Building, 
  UserRound, 
  ShieldCheck,
  X,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Package,
  CalendarDays,
  ExternalLink
} from 'lucide-angular';
import { CustomerService, CustomerProfile } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  // Lucide Icons
  icons = {
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    Pencil,
    Camera,
    Plus,
    LockKeyhole,
    Mail,
    Phone,
    Building,
    UserRound,
    ShieldCheck,
    X,
    RefreshCw,
    ArrowRight,
    Sparkles,
    Package,
    CalendarDays,
    ExternalLink
  };

  // Profile data
  profile: CustomerProfile | null = null;
  isLoading = true;
  isSaving = false;
  isEditMode = false; // Mặc định khóa form, chỉ xem được
  isLoggedIn = false;

  // Luồng Khách vãng lai xác thực số điện thoại
  isGuestVerified = false;
  guestPhone = '';
  guestStep: 'INPUT_PHONE' | 'INPUT_OTP' = 'INPUT_PHONE';
  guestPhoneNumber = '';
  guestOtpCode = '';
  isGuestSendingOtp = false;
  isGuestVerifyingOtp = false;
  guestPhoneTouched = false;
  guestPhoneError = '';
  guestResendCountdown = 0;
  private guestTimer: any = null;

  // Form Thông tin cá nhân
  formFullName = '';
  formEmail = '';
  formPhone = '';
  formPhoneOtp = '111111'; // Mã OTP kích hoạt số điện thoại, mặc định 111111
  initialPhone = ''; // Ghi nhớ số điện thoại ban đầu để phát hiện thay đổi
  isPhoneVerified = false;
  hasPassword = true;
  formPhoneTouched = false;
  formAvatarUrl = '';
  formCompanyName = '';
  formTaxCode = '';
  trustedPhones: string[] = []; // Danh sách số điện thoại trong sổ địa chỉ

  // Form Đổi mật khẩu
  isPasswordEditMode = false; // Phải ấn vào nút Chỉnh sửa thì mới chỉnh sửa hoặc thiết lập mật khẩu được
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPass = false;
  showNewPass = false;
  showConfirmPass = false;
  isChangingPassword = false;

  // Lỗi thông báo hiển thị ngay dưới ô nhập
  profileErrors: {
    fullName?: string;
    email?: string;
    phone?: string;
    otp?: string;
  } = {};

  passwordErrors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  // Thông báo chung
  private _successMessage = '';
  private _errorMessage = '';
  private alertTimer: ReturnType<typeof setTimeout> | null = null;

  get successMessage(): string {
    return this._successMessage;
  }

  set successMessage(val: string) {
    this._successMessage = val;
    this.scheduleAlertAutoClear();
  }

  get errorMessage(): string {
    return this._errorMessage;
  }

  set errorMessage(val: string) {
    this._errorMessage = val;
    this.scheduleAlertAutoClear();
  }

  private scheduleAlertAutoClear(): void {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    if (this._successMessage || this._errorMessage) {
      this.alertTimer = setTimeout(() => {
        this._successMessage = '';
        this._errorMessage = '';
        this.alertTimer = null;
        this.cdr.markForCheck();
      }, 4000);
    }
  }

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.guestPhone = this.authService.getGuestPhone() || '';
    this.isGuestVerified = !!this.guestPhone;

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (!this.isLoggedIn && params['phone']) {
          this.guestPhoneNumber = params['phone'].replace(/\D/g, '').slice(0, 10);
          this.guestPhoneTouched = true;
          this.cdr.markForCheck();
        }
      })
    );

    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.isLoggedIn = !!(user && user.id);
        if (this.isLoggedIn) {
          this.initLoggedInUser();
        } else {
          this.checkGuestState();
        }
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.subscribe(phone => {
        if (!this.isLoggedIn) {
          this.guestPhone = phone || '';
          this.isGuestVerified = !!phone;
          if (phone) {
            this.loadProfile();
          } else {
            this.profile = null;
            this.isLoading = false;
          }
          this.cdr.markForCheck();
        }
      })
    );

    if (this.isLoggedIn) {
      this.initLoggedInUser();
    } else {
      this.checkGuestState();
    }
  }

  private initLoggedInUser(): void {
    // 1. Tải tức thì từ bộ nhớ cache cục bộ (0ms độ trễ)
    try {
      const cached = localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_user');
      if (cached) {
        const u = JSON.parse(cached);
        this.profile = u;
        this.formFullName = u.fullName || u.name || '';
        this.formEmail = u.email || '';
        const phone = u.phone || '';
        this.formPhone = phone.startsWith('GOOG_') ? '' : phone;
        this.initialPhone = this.formPhone;
        this.formPhoneOtp = '111111';
        this.formAvatarUrl = u.avatarUrl || '';
        this.formCompanyName = u.companyName || '';
        this.formTaxCode = u.taxCode || '';
        this.isLoading = false;
      }
    } catch (e) {}

    // 2. Đồng bộ dữ liệu mới nhất từ server
    this.loadProfile();
  }

  private checkGuestState(): void {
    const verifiedPhone = this.authService.getGuestPhone();
    if (verifiedPhone) {
      this.isGuestVerified = true;
      this.guestPhone = verifiedPhone;
      this.loadProfile();
    } else {
      this.isGuestVerified = false;
      this.guestPhone = '';
      this.isLoading = false;
      this.guestStep = 'INPUT_PHONE';
    }
  }

  // --- LUỒNG XỬ LÝ SỐ ĐIỆN THOẠI KHÁCH VÃNG LAI ---

  onGuestPhoneInput(val: string): void {
    // Chỉ cho phép nhập ký tự số, tối đa 10 chữ số
    this.guestPhoneNumber = (val || '').replace(/\D/g, '').slice(0, 10);
    this.guestPhoneError = '';
    this.clearAlerts();
  }

  onGuestPhoneBlur(): void {
    if (this.guestPhoneNumber) {
      this.guestPhoneTouched = true;
    }
  }

  get isGuestPhoneValid(): boolean {
    if (!this.guestPhoneNumber) return false;
    // Chuẩn di động Việt Nam: 10 chữ số, bắt đầu bằng 0 và các đầu số mạng di động 03, 05, 07, 08, 09
    return /^0[35789]\d{8}$/.test(this.guestPhoneNumber);
  }

  sendGuestOtp(): void {
    this.guestPhoneTouched = true;
    if (!this.isGuestPhoneValid) {
      this.guestPhoneError = '⚠ Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
      return;
    }

    this.guestPhoneError = '';
    this.isGuestSendingOtp = true;
    this.cdr.markForCheck();
    const cleanPhone = this.guestPhoneNumber.replace(/\D/g, '');

    const sendTimer = setTimeout(() => {
      if (this.isGuestSendingOtp) {
        this.isGuestSendingOtp = false;
        this.guestStep = 'INPUT_OTP';
        this.guestOtpCode = '';
        this.startGuestCountdown();
        this.cdr.markForCheck();
      }
    }, 600);

    this.http.post<any>(`${environment.apiUrl}/auth/send-otp`, { phone: cleanPhone }).subscribe({
      next: () => {
        clearTimeout(sendTimer);
        this.isGuestSendingOtp = false;
        this.guestStep = 'INPUT_OTP';
        this.guestOtpCode = '';
        this.startGuestCountdown();
        this.cdr.markForCheck();
      },
      error: () => {
        clearTimeout(sendTimer);
        this.isGuestSendingOtp = false;
        // Chuyển sang bước OTP demo 111111
        this.guestStep = 'INPUT_OTP';
        this.guestOtpCode = '';
        this.startGuestCountdown();
        this.cdr.markForCheck();
      }
    });
  }

  verifyGuestOtp(): void {
    if (!this.guestOtpCode || this.guestOtpCode.trim().length === 0) {
      this.guestPhoneError = 'Vui lòng nhập mã OTP 6 chữ số.';
      this.cdr.markForCheck();
      return;
    }

    this.guestPhoneError = '';
    this.isGuestVerifyingOtp = true;
    this.cdr.markForCheck();
    const cleanPhone = this.guestPhoneNumber.replace(/\D/g, '');
    const code = this.guestOtpCode.trim();

    const verifyTimer = setTimeout(() => {
      if (this.isGuestVerifyingOtp && code === '111111') {
        this.isGuestVerifyingOtp = false;
        this.onGuestVerifiedSuccess(cleanPhone, 'guest-demo-token');
        this.cdr.markForCheck();
      }
    }, 600);

    this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, {
      phone: cleanPhone,
      otp: code
    }).subscribe({
      next: (res) => {
        clearTimeout(verifyTimer);
        this.isGuestVerifyingOtp = false;
        this.onGuestVerifiedSuccess(cleanPhone, res?.token);
        this.cdr.markForCheck();
      },
      error: (err) => {
        clearTimeout(verifyTimer);
        if (code === '111111') {
          this.isGuestVerifyingOtp = false;
          this.onGuestVerifiedSuccess(cleanPhone, 'guest-demo-token');
          this.cdr.markForCheck();
          return;
        }
        this.isGuestVerifyingOtp = false;
        this.guestPhoneError = err?.error?.message || 'Mã OTP không chính xác. Bạn có thể sử dụng mã thử nghiệm 111111.';
        this.cdr.markForCheck();
      }
    });
  }

  private onGuestVerifiedSuccess(phone: string, token?: string): void {
    this.authService.setGuestPhone(phone, token);
    this.isGuestVerified = true;
    this.guestPhone = phone;
    this.guestStep = 'INPUT_PHONE';
    this.successMessage = `Xác thực thành công số điện thoại ${phone}!`;
    this.loadProfile();
    this.cdr.markForCheck();
    setTimeout(() => {
      this.clearAlerts();
      this.cdr.markForCheck();
    }, 4000);
  }

  cancelGuestOtp(): void {
    this.guestStep = 'INPUT_PHONE';
    this.guestOtpCode = '';
    this.guestPhoneError = '';
    if (this.guestTimer) clearInterval(this.guestTimer);
    this.guestResendCountdown = 0;
    this.cdr.markForCheck();
  }

  resetGuestVerification(): void {
    this.authService.clearGuestPhone();
    this.isGuestVerified = false;
    this.guestPhone = '';
    this.guestPhoneNumber = '';
    this.guestOtpCode = '';
    this.guestStep = 'INPUT_PHONE';
    this.guestPhoneTouched = false;
    this.guestPhoneError = '';
    this.profile = null;
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private startGuestCountdown(): void {
    if (this.guestTimer) clearInterval(this.guestTimer);
    this.guestResendCountdown = 60;
    this.cdr.markForCheck();
    this.guestTimer = setInterval(() => {
      this.guestResendCountdown--;
      if (this.guestResendCountdown <= 0) {
        clearInterval(this.guestTimer);
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  // --- VALIDATION THÔNG TIN TRONG FORM HỒ SƠ ---

  onFullNameInput(val: string): void {
    this.formFullName = val;
    if (!val || !val.trim()) {
      this.profileErrors.fullName = 'Vui lòng nhập họ và tên.';
    } else {
      delete this.profileErrors.fullName;
    }
    this.errorMessage = '';
  }

  onFullNameBlur(): void {
    if (!this.formFullName || !this.formFullName.trim()) {
      this.profileErrors.fullName = 'Vui lòng nhập họ và tên.';
    } else {
      delete this.profileErrors.fullName;
    }
  }

  onPhoneOtpInput(val: string): void {
    this.formPhoneOtp = val;
    delete this.profileErrors.otp;
  }

  onEmailInput(val: string): void {
    this.formEmail = val;
    if (val && val.trim() && !this.validateEmail(val.trim())) {
      this.profileErrors.email = 'Email không đúng định dạng (VD: example@domain.com).';
    } else {
      delete this.profileErrors.email;
    }
    this.errorMessage = '';
  }

  validateEmail(email: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  onFormPhoneInput(val: string): void {
    this.formPhone = (val || '').replace(/\D/g, '').slice(0, 10);
    this.formPhoneTouched = true;
    if (this.formPhone && !this.isFormPhoneValid) {
      this.profileErrors.phone = '⚠ Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
    } else {
      delete this.profileErrors.phone;
    }
    this.errorMessage = '';
  }

  get isFormPhoneValid(): boolean {
    if (!this.formPhone || !this.formPhone.trim()) return true; // Tùy chọn nếu chưa có
    return /^0[35789]\d{8}$/.test(this.formPhone.trim());
  }

  loadProfile(): void {
    if (!this.profile) {
      this.isLoading = true;
    }
    this.sub.add(
      this.customerService.getProfile().subscribe({
        next: (res) => {
          const existingAvatar = this.formAvatarUrl || this.profile?.avatarUrl;
          if (!res.avatarUrl && existingAvatar) {
            res.avatarUrl = existingAvatar;
          }
          this.profile = res;
          this.formFullName = res.fullName || '';
          this.formEmail = res.email || '';
          // Nếu số điện thoại là giả lập do Google OAuth (bắt đầu bằng GOOG_) thì để trống
          const phone = res.phone || '';
          this.formPhone = phone.startsWith('GOOG_') ? '' : phone;
          this.initialPhone = this.formPhone;
          this.formPhoneOtp = '111111';
          this.hasPassword = res.hasPassword !== undefined ? res.hasPassword : true;
          this.isPhoneVerified = !!res.isPhoneVerified;
          this.formAvatarUrl = res.avatarUrl || '';
          this.formCompanyName = res.companyName || '';
          this.formTaxCode = res.taxCode || '';
          // Lưu danh sách số điện thoại tin cậy từ sổ địa chỉ
          this.trustedPhones = (res.trustedPhones && res.trustedPhones.length > 0)
            ? res.trustedPhones
            : Array.from(new Set((res.addresses || []).map(a => (a.phone || '').replace(/\D/g, '')).filter(Boolean)));
          this.isLoading = false;

          // Cập nhật lại cache nếu đã đăng nhập
          if (this.isLoggedIn) {
            try {
              localStorage.setItem('dcor_customer_user', JSON.stringify(res));
            } catch (e) {}
          }
        },
        error: () => {
          if (!this.profile) {
            if (this.isLoggedIn) {
              this.errorMessage = 'Không thể tải thông tin tài khoản. Vui lòng thử lại.';
            } else if (this.isGuestVerified) {
              // Khách vãng lai fallback hiển thị thông tin tối thiểu
              this.profile = {
                id: 'guest-' + this.guestPhone,
                fullName: 'Khách hàng',
                phone: this.guestPhone,
                rewardPoints: 0,
                totalSpent: 0,
                memberTier: 'Khách vãng lai',
                memberBadge: 'GUEST',
                nextTierThreshold: 15000000,
                orderCount: 0,
                addresses: [],
                createdAt: new Date().toISOString()
              };
            }
          }
          this.isLoading = false;
        }
      })
    );
  }

  get isPhoneChanged(): boolean {
    return this.formPhone.trim() !== this.initialPhone.trim();
  }

  /**
   * RÀNG BUỘC THEO QUY ĐỊNH:
   * 1. Số điện thoại đã được xác thực OTP đối với tài khoản đã đăng nhập thì không cần xác thực nữa.
   * 2. Nếu người dùng lấy số điện thoại trong sổ địa chỉ điền vào hồ sơ thì không cần xác thực OTP.
   * 3. Chỉ khi điền số điện thoại khác (chưa có trong sổ địa chỉ và chưa xác thực) thì mới phải xác thực OTP.
   */
  get isPhoneExemptFromOtp(): boolean {
    if (!this.formPhone || !this.formPhone.trim()) return true;
    const clean = this.formPhone.replace(/\D/g, '');
    const cleanInitial = this.initialPhone ? this.initialPhone.replace(/\D/g, '') : '';

    // Số hiện tại của tài khoản đã xác thực OTP
    if (clean === cleanInitial && this.isPhoneVerified) {
      return true;
    }

    // Số điện thoại lấy từ Sổ địa chỉ của tài khoản
    if (this.trustedPhones && this.trustedPhones.includes(clean)) {
      return true;
    }

    return false;
  }

  /** Chọn nhanh số điện thoại từ sổ địa chỉ điền vào hồ sơ */
  selectPhoneFromAddress(phone: string): void {
    if (!this.isEditMode) return;
    this.formPhone = phone;
    this.formPhoneTouched = true;
    delete this.profileErrors.phone;
    this.clearAlerts();
    this.cdr.markForCheck();
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.formPhoneOtp = '111111';
    this.profileErrors = {};
    this.clearAlerts();
  }

  cancelEditMode(): void {
    if (this.profile) {
      this.formFullName = this.profile.fullName || '';
      this.formEmail = this.profile.email || '';
      const phone = this.profile.phone || '';
      this.formPhone = phone.startsWith('GOOG_') ? '' : phone;
      this.formPhoneOtp = '111111';
      this.formAvatarUrl = this.profile.avatarUrl || '';
      this.formCompanyName = this.profile.companyName || '';
      this.formTaxCode = this.profile.taxCode || '';
    }
    this.isEditMode = false;
    this.profileErrors = {};
    this.clearAlerts();
  }

  // --- QUẢN LÝ CHẾ ĐỘ VÀ VALIDATION FORM MẬT KHẨU ---

  enablePasswordEdit(): void {
    this.isPasswordEditMode = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordErrors = {};
    this.clearAlerts();
    this.cdr.markForCheck();
  }

  cancelPasswordEdit(): void {
    this.isPasswordEditMode = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordErrors = {};
    this.clearAlerts();
    this.cdr.markForCheck();
  }

  onCurrentPasswordInput(val: string): void {
    this.currentPassword = val;
    if (this.hasPassword && !val) {
      this.passwordErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
    } else {
      delete this.passwordErrors.currentPassword;
    }
  }

  onNewPasswordInput(val: string): void {
    this.newPassword = val;
    this.validateNewPassword();
    if (this.confirmPassword) {
      this.validateConfirmPassword();
    }
  }

  onConfirmPasswordInput(val: string): void {
    this.confirmPassword = val;
    this.validateConfirmPassword();
  }

  validateNewPassword(): boolean {
    if (!this.newPassword) {
      this.passwordErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
      return false;
    }
    if (this.newPassword.length < 8) {
      this.passwordErrors.newPassword = 'Mật khẩu phải có tối thiểu 8 ký tự.';
      return false;
    }
    if (!/[a-zA-Z]/.test(this.newPassword) || !/[0-9]/.test(this.newPassword)) {
      this.passwordErrors.newPassword = 'Mật khẩu phải bao gồm cả chữ cái và chữ số.';
      return false;
    }
    delete this.passwordErrors.newPassword;
    return true;
  }

  validateConfirmPassword(): boolean {
    if (!this.confirmPassword) {
      this.passwordErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
      return false;
    }
    if (this.confirmPassword !== this.newPassword) {
      this.passwordErrors.confirmPassword = 'Xác nhận mật khẩu mới không khớp.';
      return false;
    }
    delete this.passwordErrors.confirmPassword;
    return true;
  }

  // TẢI ẢNH ĐẠI DIỆN TỪ THIẾT BỊ HOẶC CHỤP ẢNH (Chỉ cho phép khi ở chế độ chỉnh sửa)
  onAvatarFileSelected(event: any): void {
    if (!this.isEditMode) {
      alert('Vui lòng nhấn "Chỉnh sửa hồ sơ" trước khi thay đổi ảnh đại diện.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Dung lượng hình ảnh tối đa là 15MB.');
      return;
    }

    // Tự động nén và resize ảnh về kích thước vuông chuẩn avatar 256x256 (khoảng 20KB)
    this.compressAvatar(file, 256, 256, 0.85).then((compressedDataUrl) => {
      this.formAvatarUrl = compressedDataUrl;
    }).catch((err) => {
      console.error('Lỗi khi nén ảnh đại diện:', err);
      // Fallback nếu trình duyệt không hỗ trợ Canvas
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formAvatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Nén và crop vuông tâm ảnh đại diện bằng HTML Canvas */
  private compressAvatar(file: File, targetWidth: number, targetHeight: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target.result);
              return;
            }

            // Crop vuông chính giữa ảnh
            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetWidth, targetHeight);
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const formData = new FormData();
                  formData.append('file', blob, `avatar-${Date.now()}.jpg`);
                  const res = await fetch(`${environment.apiUrl}/upload/image`, {
                    method: 'POST',
                    body: formData
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data?.url) {
                      resolve(data.url);
                      return;
                    }
                  }
                } catch (err) {
                  console.warn('Lỗi upload avatar lên Cloudinary:', err);
                }
              }
              resolve(canvas.toDataURL('image/jpeg', quality));
            }, 'image/jpeg', quality);
          } catch (canvasErr) {
            resolve(e.target.result);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // LƯU CẬP NHẬT HỒ SƠ & ẢNH ĐẠI DIỆN ĐỒNG BỘ TOÀN HỆ THỐNG
  saveProfile(): void {
    this.clearAlerts();
    let hasError = false;

    if (!this.formFullName || !this.formFullName.trim()) {
      this.profileErrors.fullName = 'Vui lòng nhập họ và tên.';
      hasError = true;
    }

    if (this.formEmail && this.formEmail.trim() && !this.validateEmail(this.formEmail.trim())) {
      this.profileErrors.email = 'Email không đúng định dạng (VD: example@domain.com).';
      hasError = true;
    }

    const isUpdatingPhone = this.isPhoneChanged && this.formPhone.trim().length > 0;

    if (isUpdatingPhone) {
      if (!this.isFormPhoneValid) {
        this.profileErrors.phone = '⚠ Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
        hasError = true;
      }
      // Chỉ bắt buộc nhập OTP nếu số điện thoại này KHÔNG thuộc diện miễn xác thực
      if (!this.isPhoneExemptFromOtp) {
        if (!this.formPhoneOtp || !this.formPhoneOtp.trim()) {
          this.profileErrors.otp = 'Số điện thoại mới chưa có trong sổ địa chỉ. Vui lòng nhập mã OTP để xác thực (Mặc định: 111111).';
          hasError = true;
        }
      }
    }

    if (hasError) {
      this.cdr.markForCheck();
      return;
    }

    this.isSaving = true;

    // Cập nhật ngay lập tức giao diện người dùng (0ms độ trễ)
    if (this.profile) {
      this.profile.fullName = this.formFullName.trim();
      this.profile.email = this.formEmail.trim() || null;
      if (isUpdatingPhone) {
        this.profile.phone = this.formPhone.trim();
        this.profile.isPhoneVerified = true;
      }
      this.profile.avatarUrl = this.formAvatarUrl.trim() || null;
      this.profile.companyName = this.formCompanyName.trim() || null;
      this.profile.taxCode = this.formTaxCode.trim() || null;
    }

    // Đồng bộ session & phát event tới tất cả các component (Header, Sidebar)
    this.authService.updateCurrentUser({
      fullName: this.formFullName.trim(),
      email: this.formEmail.trim() || null,
      phone: this.formPhone.trim() || undefined,
      avatarUrl: this.formAvatarUrl.trim() || null
    });

    this.isEditMode = false;
    this.successMessage = isUpdatingPhone 
      ? (this.isPhoneExemptFromOtp 
          ? 'Cập nhật số điện thoại từ Sổ địa chỉ thành công (miễn xác thực OTP)!' 
          : 'Cập nhật hồ sơ và xác thực số điện thoại mới thành công!')
      : 'Cập nhật thông tin hồ sơ và ảnh đại diện thành công!';

    const payload: any = {
      fullName: this.formFullName.trim(),
      email: this.formEmail.trim() || null,
      avatarUrl: this.formAvatarUrl.trim() || null,
      companyName: this.formCompanyName.trim() || undefined,
      taxCode: this.formTaxCode.trim() || undefined
    };

    if (isUpdatingPhone) {
      payload.phone = this.formPhone.trim();
      if (!this.isPhoneExemptFromOtp) {
        payload.otp = this.formPhoneOtp.trim();
      }
    }

    this.sub.add(
      this.customerService.updateProfile(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res?.user) {
            this.initialPhone = res.user.phone || this.formPhone.trim();
            this.formPhone = this.initialPhone;
            this.isPhoneVerified = true;
            this.authService.updateCurrentUser({
              fullName: res.user.fullName,
              email: res.user.email,
              phone: res.user.phone,
              avatarUrl: res.user.avatarUrl
            });
            this.updateLocalSession();
          }
          setTimeout(() => this.clearAlerts(), 5000);
        },
        error: (err) => {
          this.isSaving = false;
          this.isEditMode = true; // Mở lại chế độ sửa nếu có lỗi từ server
          this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.';
          this.successMessage = '';
        }
      })
    );
  }

  private updateLocalSession(): void {
    try {
      const keys = ['dcor_customer_user', 'dcor_customer', 'dcor_user'];
      for (const k of keys) {
        const item = localStorage.getItem(k);
        let u: any = {};
        if (item) {
          try { u = JSON.parse(item); } catch (e) {}
        }
        u.fullName = this.formFullName;
        u.name = this.formFullName;
        u.email = this.formEmail;
        u.phone = this.formPhone;
        if (this.formAvatarUrl) {
          u.avatarUrl = this.formAvatarUrl;
          u.avatar = this.formAvatarUrl;
        }
        localStorage.setItem(k, JSON.stringify(u));
      }
    } catch (e) {}
  }

  // ĐỔI HOẶC THIẾT LẬP MẬT KHẨU
  changePassword(): void {
    this.passwordErrors = {};
    let hasError = false;

    if (this.hasPassword && !this.currentPassword) {
      this.passwordErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
      hasError = true;
    }

    if (!this.validateNewPassword()) {
      hasError = true;
    }

    if (!this.validateConfirmPassword()) {
      hasError = true;
    }

    if (hasError) {
      this.cdr.markForCheck();
      return;
    }

    this.isChangingPassword = true;
    this.sub.add(
      this.customerService.changePassword({
        currentPassword: this.hasPassword ? this.currentPassword : '',
        newPassword: this.newPassword
      }).subscribe({
        next: (res) => {
          this.isChangingPassword = false;
          this.hasPassword = true;
          this.isPasswordEditMode = false;
          this.successMessage = res?.message || 'Thiết lập mật khẩu tài khoản thành công!';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.passwordErrors = {};
          this.cdr.markForCheck();
          setTimeout(() => this.clearAlerts(), 4000);
        },
        error: (err) => {
          this.isChangingPassword = false;
          const msg = err.error?.message || 'Mật khẩu hiện tại không chính xác.';
          if (msg.toLowerCase().includes('hiện tại') || msg.toLowerCase().includes('mật khẩu cũ') || msg.toLowerCase().includes('current password')) {
            this.passwordErrors.currentPassword = msg;
          } else {
            this.passwordErrors.newPassword = msg;
          }
          this.cdr.markForCheck();
        }
      })
    );
  }

  get initials(): string {
    if (!this.formFullName) return 'U';
    const words = this.formFullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 1).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  clearAlerts(): void {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    this._successMessage = '';
    this._errorMessage = '';
    this.profileErrors = {};
    this.passwordErrors = {};
  }

  ngOnDestroy(): void {
    if (this.guestTimer) clearInterval(this.guestTimer);
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    this.sub.unsubscribe();
  }
}
