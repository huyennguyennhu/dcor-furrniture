import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-modal.html',
  styleUrls: ['./otp-modal.css']
})
export class OtpModalComponent {
  @Input() isOpen = false;
  @Input() phoneNumber = '09***89'; // Mock phone
  
  @Output() close = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();

  otpValues: string[] = ['', '', '', '', '', ''];
  error = '';
  loading = false;

  closeModal() {
    this.isOpen = false;
    this.close.emit();
  }

  onOtpInput(event: any, index: number) {
    const value = event.target.value;
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  handleVerify() {
    const otp = this.otpValues.join('');
    if (otp.length !== 6) {
      this.error = 'Vui lòng nhập đủ 6 số OTP.';
      return;
    }
    this.error = '';
    this.loading = true;
    
    // Simulate API Call
    setTimeout(() => {
      this.loading = false;
      this.verify.emit(otp);
      this.closeModal();
    }, 1500);
  }
}
