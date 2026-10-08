import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, GoogleSigninButtonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  phone = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';
  
  private authSubscription!: Subscription;

  constructor(
    private router: Router, 
    private http: HttpClient,
    private authService: SocialAuthService
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.authState.subscribe((user) => {
      if (user) {
        this.loading = true;
        this.error = '';
        
        const payload = {
          email: user.email,
          fullName: user.name,
          avatarUrl: user.photoUrl
        };

        this.http.post<any>(`${environment.apiUrl}/auth/customer/google`, payload)
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
              this.authService.signOut().catch(() => {}); // Đăng xuất khỏi lib nếu lỗi
            }
          });
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

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

    this.http.post<any>(`${environment.apiUrl}/auth/customer/login`, {
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
}
