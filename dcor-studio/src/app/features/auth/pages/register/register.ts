import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  fullName = '';
  phone = '';
  password = '';
  confirmPassword = '';
  
  showPassword = false;
  showConfirmPassword = false;
  
  loading = false;
  error = '';
  success = '';

  constructor(private router: Router, private http: HttpClient) {}

  get isFormValid(): boolean {
    const phoneRegex = /^0[35789]\d{8}$/;
    return (
      this.fullName.trim().length > 0 &&
      phoneRegex.test(this.phone) &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  onPhoneChange(val: string) {
    this.phone = val.replace(/\D/g, '');
    this.error = '';
  }

  handleRegister(e: Event) {
    e.preventDefault();
    if (!this.isFormValid) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post<any>('https://dcor-furrniture.onrender.com/api/auth/customer/register', {
      fullName: this.fullName,
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = 'Đăng ký thành công! Đang chuyển hướng...';
        // Auto login or redirect to login
        localStorage.setItem('dcor_customer_token', res.token);
        localStorage.setItem('dcor_customer_user', JSON.stringify(res.user));
        
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.';
      }
    });
  }

  handleGoogleLogin() {
    this.loading = true;
    this.error = '';

    // Giả lập Payload trả về từ Google/Firebase Auth window
    const mockGoogleUser = {
      email: 'khachhang.google@gmail.com',
      fullName: 'Khách hàng Google',
      avatarUrl: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png'
    };

    this.http.post<any>('https://dcor-furrniture.onrender.com/api/auth/customer/google', mockGoogleUser)
      .subscribe({
        next: (res) => {
          this.loading = false;
          localStorage.setItem('dcor_customer_token', res.token);
          localStorage.setItem('dcor_customer_user', JSON.stringify(res.user));
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Đã có lỗi kết nối máy chủ.';
        }
      });
  }
}

