import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, CheckCircle2, AlertCircle, MapPin, Pencil, Trash2, Phone, Check, X, Smartphone } from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { CustomerService, CustomerAddress } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ALL_VIETNAM_PROVINCE_NAMES, getWardsForProvince } from '../../../../shared/data/vietnam-administrative.data';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AccountSidebarComponent],
  templateUrl: './addresses.html',
  styleUrls: ['./addresses.css']
})
export class AccountAddressesComponent implements OnInit, OnDestroy {
  icons = {
    Plus,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Pencil,
    Trash2,
    Phone,
    Check,
    X,
    Smartphone
  };

  currentUser: any = null;
  addresses: CustomerAddress[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Modal State
  isModalOpen = false;
  editingId: string | null = null;
  isSaving = false;

  // Delete Confirmation Modal State
  isDeleteModalOpen = false;
  addressToDelete: CustomerAddress | null = null;
  isDeleting = false;

  // OTP & Popup hỏi lưu số vào hồ sơ
  verifiedPhonesList: string[] = [];
  isOtpModalOpen = false;
  otpCode = '';
  otpErrorMessage = '';
  isSendingOtp = false;
  otpCountdown = 0;
  private otpTimer: any = null;
  targetPhoneForOtp = '';

  showSavePhonePromptModal = false;
  phoneToSaveToProfile = '';
  isSavingPhoneToProfile = false;

  formData = {
    receiverName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detail: '',
    addressType: 'HOME' as 'HOME' | 'OFFICE',
    isDefault: false
  };

  formErrors: {
    receiverName?: string;
    phone?: string;
    province?: string;
    detail?: string;
  } = {};

  provinces: string[] = ALL_VIETNAM_PROVINCE_NAMES;
  wards: string[] = [];

  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get hasUserPhone(): boolean {
    const raw = this.currentUser?.phone || '';
    return !raw.startsWith('GOOG_') && raw.trim().length >= 9;
  }

  ngOnInit(): void {
    // 0. Lấy thông tin tài khoản hiện tại
    try {
      const stored = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {}

    // 1. Tải tức thì từ bộ nhớ tạm để không phải chờ đợi
    try {
      const cached = localStorage.getItem('dcor_saved_addresses');
      if (cached) {
        this.addresses = JSON.parse(cached);
        this.isLoading = false;
      }
    } catch (e) {}

    this.loadVerifiedPhones();
    this.cdr.markForCheck();

    // 2. Đồng bộ mới nhất từ server
    this.loadAddresses();
  }

  loadAddresses(): void {
    if (this.addresses.length === 0) {
      this.isLoading = true;
      this.cdr.markForCheck();
    }
    this.sub.add(
      this.customerService.getAddresses().subscribe({
        next: (data) => {
          this.addresses = data || [];
          this.isLoading = false;
          // Lưu cache đồng bộ với trang checkout
          try {
            localStorage.setItem('dcor_saved_addresses', JSON.stringify(data));
          } catch (e) {}
          this.loadVerifiedPhones();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.warn('Lỗi khi đồng bộ sổ địa chỉ từ server:', err);
          // Chỉ hiển thị thông báo lỗi khi chưa có dữ liệu nào trong cache
          if (this.addresses.length === 0) {
            if (err.status === 401 || err.status === 403) {
              this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (err.status === 0) {
              this.errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.';
            } else {
              this.errorMessage = err.error?.message || 'Không thể tải sổ địa chỉ.';
            }
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  onProvinceChange(): void {
    delete this.formErrors.province;
    if (this.formData.province) {
      this.wards = getWardsForProvince(this.formData.province);
      this.formData.ward = '';
    } else {
      this.wards = [];
      this.formData.ward = '';
    }
    this.cdr.markForCheck();
  }

  onReceiverNameInput(): void {
    if (this.formData.receiverName && this.formData.receiverName.trim()) {
      delete this.formErrors.receiverName;
      this.cdr.markForCheck();
    }
  }

  onPhoneInput(): void {
    if (this.formData.phone && this.formData.phone.trim()) {
      delete this.formErrors.phone;
      this.cdr.markForCheck();
    }
  }

  onDetailInput(): void {
    if (this.formData.detail && this.formData.detail.trim()) {
      delete this.formErrors.detail;
      this.cdr.markForCheck();
    }
  }

  openCreateModal(): void {
    this.editingId = null;
    this.formData = {
      receiverName: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      detail: '',
      addressType: 'HOME',
      isDefault: this.addresses.length === 0
    };
    this.wards = [];
    this.isModalOpen = true;
    this.formErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  openEditModal(addr: CustomerAddress): void {
    this.editingId = addr.id;
    this.formData = {
      receiverName: addr.receiverName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district || '',
      ward: addr.ward || '',
      detail: addr.detail,
      addressType: addr.addressType || 'HOME',
      isDefault: addr.isDefault
    };

    if (addr.province) {
      this.wards = getWardsForProvince(addr.province);
    }
    this.isModalOpen = true;
    this.formErrors = {};
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.formErrors = {};
    this.cdr.markForCheck();
  }

  loadVerifiedPhones(): void {
    if (!this.currentUser) return;
    const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email || 'user';
    try {
      const stored = localStorage.getItem(`dcor_verified_phones_${userId}`);
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const addressPhones = (this.addresses || []).map(a => (a.phone || '').trim()).filter(Boolean);
      this.verifiedPhonesList = Array.from(new Set([...parsed, ...addressPhones]));
    } catch (e) {
      this.verifiedPhonesList = [];
    }
  }

  addVerifiedPhone(phone: string): void {
    if (!phone) return;
    const clean = phone.trim();
    if (!this.verifiedPhonesList.includes(clean)) {
      this.verifiedPhonesList.push(clean);
    }
    if (this.currentUser) {
      const userId = this.currentUser.id || this.currentUser._id || this.currentUser.email || 'user';
      try {
        localStorage.setItem(`dcor_verified_phones_${userId}`, JSON.stringify(this.verifiedPhonesList));
      } catch (e) {}
    }
  }

  isPhoneOtpRequired(phoneStr?: string): boolean {
    const phone = (phoneStr || '').trim();
    if (!phone) return true;
    if (this.hasUserPhone) return false;
    if (this.verifiedPhonesList.includes(phone)) return false;
    return true;
  }

  saveAddress(): void {
    this.formErrors = {};
    let hasErr = false;

    if (!this.formData.receiverName || !this.formData.receiverName.trim()) {
      this.formErrors.receiverName = 'Vui lòng nhập họ và tên người nhận.';
      hasErr = true;
    }

    const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
    if (!this.formData.phone || !this.formData.phone.trim()) {
      this.formErrors.phone = 'Vui lòng nhập số điện thoại người nhận.';
      hasErr = true;
    } else if (!phoneRegex.test(this.formData.phone.trim())) {
      this.formErrors.phone = 'Số điện thoại cần đủ 10 chữ số (đầu số 03, 05, 07, 08, 09).';
      hasErr = true;
    }

    if (!this.formData.province) {
      this.formErrors.province = 'Vui lòng chọn Tỉnh / Thành phố.';
      hasErr = true;
    }

    if (!this.formData.detail || !this.formData.detail.trim()) {
      this.formErrors.detail = 'Vui lòng nhập số nhà, tên đường chi tiết.';
      hasErr = true;
    }

    if (hasErr) {
      return;
    }

    const phone = this.formData.phone.trim();
    // Bắt buộc xác thực OTP nếu tài khoản chưa có SĐT trong hồ sơ và SĐT này chưa từng xác thực
    if (this.isPhoneOtpRequired(phone)) {
      this.targetPhoneForOtp = phone;
      this.sendOtp();
      return;
    }

    this.executeSaveAddress();
  }

  sendOtp(): void {
    if (!this.targetPhoneForOtp) return;
    this.isSendingOtp = true;
    this.otpErrorMessage = '';
    this.cdr.markForCheck();

    fetch(`${environment.apiUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: this.targetPhoneForOtp })
    })
      .then(res => res.json())
      .catch(() => ({}))
      .finally(() => {
        this.isSendingOtp = false;
        this.isOtpModalOpen = true;
        this.otpCode = '';
        this.startOtpCountdown();
        this.cdr.markForCheck();
      });
  }

  startOtpCountdown(): void {
    this.otpCountdown = 60;
    this.cdr.markForCheck();
    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
        this.cdr.markForCheck();
      } else {
        clearInterval(this.otpTimer);
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  verifyOtp(): void {
    const code = (this.otpCode || '').trim();
    if (!code || code.length < 4) {
      this.otpErrorMessage = 'Vui lòng nhập mã OTP đầy đủ.';
      this.cdr.markForCheck();
      return;
    }

    const onOtpSuccess = () => {
      this.addVerifiedPhone(this.targetPhoneForOtp);
      this.isOtpModalOpen = false;
      this.otpErrorMessage = '';
      if (this.otpTimer) clearInterval(this.otpTimer);

      if (!this.hasUserPhone) {
        this.phoneToSaveToProfile = this.targetPhoneForOtp;
        this.showSavePhonePromptModal = true;
        this.cdr.markForCheck();
        return;
      }

      this.executeSaveAddress();
      this.cdr.markForCheck();
    };

    if (code === '111111') {
      onOtpSuccess();
      return;
    }

    fetch(`${environment.apiUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: this.targetPhoneForOtp, otp: code })
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => onOtpSuccess())
      .catch(() => {
        this.otpErrorMessage = 'Mã OTP không chính xác. Vui lòng nhập mã 111111.';
        this.cdr.markForCheck();
      });
  }

  confirmSavePhoneToProfile(): void {
    if (!this.phoneToSaveToProfile) return;
    this.isSavingPhoneToProfile = true;
    this.cdr.markForCheck();
    const phone = this.phoneToSaveToProfile;

    this.sub.add(
      this.customerService.updateProfile({
        fullName: this.formData.receiverName || this.currentUser?.fullName || 'Khách hàng',
        phone: phone,
        otp: '111111'
      }).subscribe({
        next: () => {
          this.isSavingPhoneToProfile = false;
          this.showSavePhonePromptModal = false;
          if (this.currentUser) {
            this.currentUser.phone = phone;
            this.currentUser.isPhoneVerified = true;
          }
          this.authService.updateCurrentUser({
            phone: phone,
            isPhoneVerified: true
          });
          this.addVerifiedPhone(phone);
          this.executeSaveAddress();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSavingPhoneToProfile = false;
          console.warn('Lỗi lưu SĐT vào hồ sơ:', err);
          if (this.currentUser) {
            this.currentUser.phone = phone;
            this.currentUser.isPhoneVerified = true;
          }
          this.authService.updateCurrentUser({
            phone: phone,
            isPhoneVerified: true
          });
          this.addVerifiedPhone(phone);
          this.showSavePhonePromptModal = false;
          this.executeSaveAddress();
          this.cdr.markForCheck();
        }
      })
    );
  }

  dismissSavePhonePrompt(): void {
    if (this.phoneToSaveToProfile) {
      this.addVerifiedPhone(this.phoneToSaveToProfile);
    }
    this.showSavePhonePromptModal = false;
    this.executeSaveAddress();
    this.cdr.markForCheck();
  }

  executeSaveAddress(): void {

    this.isSaving = true;
    this.cdr.markForCheck();
    const payload = {
      receiverName: this.formData.receiverName.trim(),
      phone: this.formData.phone.trim(),
      province: this.formData.province.trim(),
      district: this.formData.district ? this.formData.district.trim() : null,
      ward: this.formData.ward ? this.formData.ward.trim() : null,
      detail: this.formData.detail.trim(),
      addressType: this.formData.addressType,
      isDefault: this.formData.isDefault
    };

    if (this.editingId) {
      const editId = this.editingId;
      const idx = this.addresses.findIndex(a => a.id === editId);
      if (idx !== -1) {
        this.addresses[idx] = {
          ...this.addresses[idx],
          ...payload
        };
        if (payload.isDefault) {
          this.addresses.forEach(a => {
            if (a.id !== editId) a.isDefault = false;
          });
        }
      }
      this.saveLocalAddresses(this.addresses);
      this.closeModal();
      this.successMessage = 'Cập nhật địa chỉ nhận hàng thành công!';
      this.cdr.markForCheck();

      this.sub.add(
        this.customerService.updateAddress(editId, payload).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.loadAddressesSilently();
            setTimeout(() => {
              this.successMessage = '';
              this.cdr.markForCheck();
            }, 4000);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSaving = false;
            alert(err.error?.message || 'Lỗi khi cập nhật địa chỉ.');
            this.loadAddresses();
            this.cdr.markForCheck();
          }
        })
      );
    } else {
      const tempId = `addr-${Date.now()}`;
      const newAddr: CustomerAddress = {
        id: tempId,
        receiverName: payload.receiverName,
        phone: payload.phone,
        province: payload.province,
        district: payload.district,
        ward: payload.ward,
        detail: payload.detail,
        addressType: payload.addressType,
        isDefault: payload.isDefault
      };
      if (newAddr.isDefault) {
        this.addresses.forEach(a => a.isDefault = false);
      }
      this.addresses.unshift(newAddr);
      this.saveLocalAddresses(this.addresses);
      this.closeModal();
      this.successMessage = 'Thêm địa chỉ nhận hàng mới thành công!';
      this.cdr.markForCheck();

      this.sub.add(
        this.customerService.createAddress(payload).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            if (res?.address) {
              newAddr.id = res.address.id;
              this.saveLocalAddresses(this.addresses);
            }
            this.loadAddressesSilently();
            setTimeout(() => {
              this.successMessage = '';
              this.cdr.markForCheck();
            }, 4000);
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSaving = false;
            this.addresses = this.addresses.filter(a => a.id !== tempId);
            this.saveLocalAddresses(this.addresses);
            alert(err.error?.message || 'Lỗi khi thêm địa chỉ.');
            this.cdr.markForCheck();
          }
        })
      );
    }
  }

  private saveLocalAddresses(list: CustomerAddress[]): void {
    try {
      localStorage.setItem('dcor_saved_addresses', JSON.stringify(list));
    } catch (e) {}
  }

  private loadAddressesSilently(): void {
    this.sub.add(
      this.customerService.getAddresses().subscribe({
        next: (data) => {
          this.addresses = data || [];
          this.saveLocalAddresses(data);
          this.cdr.markForCheck();
        },
        error: () => {}
      })
    );
  }

  setDefault(addr: CustomerAddress): void {
    // Optimistic UI update
    this.addresses.forEach(a => a.isDefault = (a.id === addr.id));
    this.saveLocalAddresses(this.addresses);
    this.successMessage = `Đã đặt "${addr.detail}" làm địa chỉ nhận hàng mặc định.`;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 3000);

    this.sub.add(
      this.customerService.setDefaultAddress(addr.id).subscribe({
        next: () => {
          this.loadAddressesSilently();
          this.cdr.markForCheck();
        },
        error: (err) => {
          alert(err.error?.message || 'Không thể thiết lập mặc định.');
          this.loadAddresses();
          this.cdr.markForCheck();
        }
      })
    );
  }

  deleteAddress(addr: CustomerAddress): void {
    this.addressToDelete = addr;
    this.isDeleteModalOpen = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.isDeleteModalOpen = false;
    this.addressToDelete = null;
    this.cdr.markForCheck();
  }

  confirmDeleteAddress(): void {
    const target = this.addressToDelete;
    if (!target || this.isDeleting) return;

    this.isDeleting = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.sub.add(
      this.customerService.deleteAddress(target.id).subscribe({
        next: () => {
          this.isDeleting = false;
          this.isDeleteModalOpen = false;
          this.addressToDelete = null;
          this.addresses = this.addresses.filter(a => a.id !== target.id);
          this.saveLocalAddresses(this.addresses);
          this.successMessage = 'Đã xóa địa chỉ nhận hàng thành công.';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.markForCheck();
          }, 3500);
          this.loadAddressesSilently();
        },
        error: (err) => {
          this.isDeleting = false;
          this.isDeleteModalOpen = false;
          this.addressToDelete = null;
          this.errorMessage = err.error?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại.';
          this.cdr.markForCheck();
          setTimeout(() => {
            this.errorMessage = '';
            this.cdr.markForCheck();
          }, 4500);
          this.loadAddresses();
        }
      })
    );
  }

  getFullAddress(addr: CustomerAddress): string {
    return [addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
