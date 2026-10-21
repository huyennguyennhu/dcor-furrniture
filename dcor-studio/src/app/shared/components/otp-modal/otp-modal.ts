import { IconComponent } from '../icon/icon';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule],
  templateUrl: './otp-modal.html',
  styleUrls: ['./otp-modal.css']
})
export class OtpModalComponent implements OnChanges, OnDestroy {
  // Required @Input() & @Output() (Giữ nguyên tên và kiểu)
  @Input() isOpen = false;
  @Input() phoneNumber = '09***89';
  @Output() close = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();

  // Optional @Input() theo yêu cầu
  @Input() errorMessage?: string;
  @Input() loading = false;
  @Input() countdown = 90; // Thời gian hiệu lực OTP (giây)
  @Input() resendCountdown = 60; // Thời gian chờ gửi lại (giây)
  @Input() title = 'Xác thực mã OTP';
  @Input() description?: string;
  @Input() confirmText = 'Xác nhận';
  @Input() demoOtp: string | null = null;

  // Optional @Output()
  @Output() resend = new EventEmitter<void>();

  readonly inputIndices = [0, 1, 2, 3, 4, 5];
  otpValues: string[] = ['', '', '', '', '', ''];
  localError = '';
  remainingSeconds = 90;
  remainingResendSeconds = 60;

  // SMS Demo Toast State (Giả lập đồ án)
  showToast = false;
  isToastDismissed = false;
  copied = false;
  private toastTimeout: any = null;
  private copiedTimeout: any = null;

  private timerInterval: any = null;
  private resendInterval: any = null;
  private focusTimeout: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    let shouldScheduleToast = false;

    if (changes['isOpen']) {
      if (this.isOpen) {
        this.resetState();
        this.startTimers();
        if (this.focusTimeout) clearTimeout(this.focusTimeout);
        this.focusTimeout = setTimeout(() => this.focusInput(0), 100);
        this.isToastDismissed = false;
        if (this.demoOtp) {
          shouldScheduleToast = true;
        }
      } else {
        this.stopTimers();
        this.clearToastTimer();
        this.showToast = false;
        this.isToastDismissed = false;
      }
    }

    if (changes['demoOtp']) {
      this.isToastDismissed = false;
      if (this.isOpen && this.demoOtp) {
        shouldScheduleToast = true;
      } else if (!this.demoOtp) {
        this.clearToastTimer();
        this.showToast = false;
      }
    }

    if (shouldScheduleToast) {
      this.scheduleToast();
    }

    if (changes['countdown'] && this.isOpen && changes['countdown'].currentValue) {
      this.remainingSeconds = this.countdown;
      this.startCountdownTimer();
    }

    if (changes['resendCountdown'] && this.isOpen && changes['resendCountdown'].currentValue) {
      this.remainingResendSeconds = this.resendCountdown;
      this.startResendTimer();
    }

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.stopTimers();
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
      this.focusTimeout = null;
    }
    this.clearToastTimer();
    if (this.copiedTimeout) {
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = null;
    }
  }

  get formattedDemoOtp(): string {
    if (!this.demoOtp) return '';
    const digits = this.demoOtp.replace(/\D/g, '');
    if (digits.length === 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }
    return this.demoOtp;
  }

  get formattedTime(): string {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get isExpired(): boolean {
    return this.remainingSeconds <= 0;
  }

  get displayError(): string {
    if (this.errorMessage) return this.errorMessage;
    if (this.localError) return this.localError;
    if (this.isExpired) return 'Mã OTP đã hết hiệu lực. Vui lòng bấm Gửi lại mã.';
    return '';
  }

  get isComplete(): boolean {
    const code = this.otpValues.join('');
    return /^\d{6}$/.test(code);
  }

  get canConfirm(): boolean {
    return this.isComplete && !this.loading && !this.isExpired;
  }

  resetState(): void {
    this.otpValues = ['', '', '', '', '', ''];
    this.localError = '';
    this.remainingSeconds = this.countdown || 90;
    this.remainingResendSeconds = this.resendCountdown || 60;
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (el) el.value = '';
    }
    this.cdr.markForCheck();
  }

  startTimers(): void {
    this.startCountdownTimer();
    this.startResendTimer();
  }

  startCountdownTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  startResendTimer(): void {
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      if (this.remainingResendSeconds > 0) {
        this.remainingResendSeconds--;
      } else {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
      this.cdr.markForCheck();
    }, 1000);
  }

  stopTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  closeModal(): void {
    this.stopTimers();
    this.clearToastTimer();
    this.showToast = false;
    this.isToastDismissed = false;
    this.isOpen = false;
    this.close.emit();
    this.cdr.markForCheck();
  }

  onOtpInput(event: Event, index: number): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value || '';
    const digitsOnly = rawVal.replace(/\D/g, '');

    // Hỗ trợ trường hợp mobile browser autofill mã 6 số qua input
    if (digitsOnly.length >= 6) {
      this.fillAllOtp(digitsOnly);
      return;
    }

    // Chỉ nhận chữ số, lấy đúng 1 ký tự cuối
    const digit = digitsOnly.slice(-1);
    this.otpValues[index] = digit;
    inputEl.value = digit;
    this.localError = '';
    this.cdr.markForCheck();

    if (digit && index < 5) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const currentVal = this.otpValues[index];
      if (currentVal) {
        // Ô hiện tại có giá trị -> xóa giá trị ô này
        event.preventDefault();
        this.otpValues[index] = '';
        const inputEl = event.target as HTMLInputElement;
        if (inputEl) inputEl.value = '';
        this.localError = '';
        this.cdr.markForCheck();
      } else if (index > 0) {
        // Ô hiện tại trống -> lùi về ô trước và xóa
        event.preventDefault();
        this.otpValues[index - 1] = '';
        const prevEl = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        if (prevEl) prevEl.value = '';
        this.localError = '';
        this.cdr.markForCheck();
        this.focusInput(index - 1);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.canConfirm) {
        this.handleVerify();
      }
    }
  }

  onPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const clipData = event.clipboardData?.getData('text') || '';
    const digitsOnly = clipData.replace(/\D/g, '');
    if (!digitsOnly) return;

    if (digitsOnly.length >= 6) {
      this.fillAllOtp(digitsOnly);
      return;
    }

    // Dán chuỗi < 6 số từ vị trí index hiện tại
    for (let i = 0; i < digitsOnly.length && index + i < 6; i++) {
      const targetIdx = index + i;
      const digit = digitsOnly[i];
      this.otpValues[targetIdx] = digit;
      const el = document.getElementById(`otp-${targetIdx}`) as HTMLInputElement;
      if (el) el.value = digit;
    }

    this.localError = '';
    this.cdr.markForCheck();
    const nextIdx = Math.min(index + digitsOnly.length, 5);
    this.focusInput(nextIdx);
  }

  private fillAllOtp(digits: string): void {
    const clean = digits.replace(/\D/g, '').slice(0, 6);
    for (let i = 0; i < clean.length; i++) {
      this.otpValues[i] = clean[i];
      const el = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (el) el.value = clean[i];
    }
    this.localError = '';
    this.cdr.markForCheck();
    this.focusInput(Math.min(clean.length - 1, 5));
  }

  focusInput(index: number): void {
    const input = document.getElementById(`otp-${index}`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  handleResend(): void {
    if (this.remainingResendSeconds > 0 || this.loading) return;
    this.localError = '';
    this.otpValues = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById(`otp-${i}`) as HTMLInputElement;
      if (el) el.value = '';
    }
    this.isToastDismissed = false;
    this.clearToastTimer();
    this.showToast = false;
    this.resend.emit();
    this.remainingResendSeconds = this.resendCountdown || 60;
    this.remainingSeconds = this.countdown || 90;
    this.startTimers();
    this.focusInput(0);
    this.cdr.markForCheck();
  }

  handleVerify(): void {
    if (this.isExpired) {
      this.localError = 'Mã OTP đã hết hiệu lực. Vui lòng bấm Gửi lại mã.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.isComplete) {
      this.localError = 'Vui lòng nhập đủ 6 chữ số OTP.';
      this.cdr.markForCheck();
      return;
    }

    this.localError = '';
    this.cdr.markForCheck();
    this.verify.emit(this.otpValues.join(''));
  }

  // --- SMS DEMO TOAST ACTIONS (Giả lập đồ án) ---

  scheduleToast(): void {
    this.clearToastTimer();
    this.showToast = false;
    this.toastTimeout = setTimeout(() => {
      if (this.isOpen && this.demoOtp && !this.isToastDismissed) {
        this.showToast = true;
        this.cdr.markForCheck();
      }
    }, 600);
  }

  clearToastTimer(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  dismissToast(): void {
    this.isToastDismissed = true;
    this.showToast = false;
    this.clearToastTimer();
    this.cdr.markForCheck();
  }

  copyOtp(): void {
    if (!this.demoOtp) return;
    const code = this.demoOtp.replace(/\D/g, '').slice(0, 6) || this.demoOtp;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        this.triggerCopiedState();
      }).catch(() => {
        this.fallbackCopy(code);
      });
    } else {
      this.fallbackCopy(code);
    }
  }

  private fallbackCopy(text: string): void {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.triggerCopiedState();
    } catch {
      // fallback
    }
  }

  private triggerCopiedState(): void {
    this.copied = true;
    this.cdr.markForCheck();
    if (this.copiedTimeout) clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  fillDemoOtp(): void {
    if (!this.demoOtp) return;
    this.fillAllOtp(this.demoOtp);
  }
}
