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
  selector: 'app-register',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, GoogleSigninButtonModule],
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
              this.authService.signOut().catch(() => {});
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

    this.http.post<any>(`${environment.apiUrl}/auth/customer/register`, {
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
}
