import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrls: ['./admin-login.css']
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private router: Router, private http: HttpClient) {}

  handleLogin(e: Event) {
    e.preventDefault();
    if (!this.email || !this.password) return;
    
    this.loading = true;
    this.error = '';

    this.http.post<any>('https://dcor-furrniture.onrender.com/api/auth/admin/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        // Lưu token vào localStorage (hoặc sessionStorage)
        localStorage.setItem('dcor_admin_token', res.token);
        localStorage.setItem('dcor_admin_user', JSON.stringify(res.user));
        
        // Điều hướng sang Dashboard
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Không thể kết nối đến Máy chủ Backend. Vui lòng kiểm tra cổng 3000.';
      }
    });
  }
}

