import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  phone = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';

  constructor(private router: Router, private http: HttpClient) {}

  get isFormValid(): boolean {
    return /^0[35789]\d{8}$/.test(this.phone) && this.password.length >= 6;
  }

  onPhoneChange(val: string) {
    this.phone = val.replace(/\D/g, '');
    if (this.error) this.error = '';
  }

  handleLogin(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';

    const phoneRegex = /^0[35789]\d{8}$/;
    if (!phoneRegex.test(this.phone)) {
      this.error = 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.';
      this.loading = false;
      return;
    }

    this.http.post<any>('https://dcor-furrniture.onrender.com/api/auth/customer/login', {
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('dcor_customer_token', res.token);
        localStorage.setItem('dcor_customer', JSON.stringify(res.user));
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Đã có lỗi kết nối máy chủ.';
      }
    });
  }

  handleGoogleLogin() {
    this.loading = true;
    this.error = '';

    // Mock payload normally obtained from Firebase/Google Auth window
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
          localStorage.setItem('dcor_customer', JSON.stringify(res.user));
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Đã có lỗi kết nối máy chủ.';
        }
      });
  }
}

