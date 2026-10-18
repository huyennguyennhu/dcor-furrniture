import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, TimeoutError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerUser {
  id: string;
  fullName: string;
  phone?: string;
  email?: string | null;
  avatar?: string | null;
}

export interface SendOtpResponse {
  message: string;
  expiresIn?: number;
  resendAfter?: number;
  retryAfter?: number;
  devOtp?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: CustomerUser;
}

export interface VerifyForgotOtpResponse {
  message: string;
  resetToken: string;
}

export const AUTH_REQUEST_TIMEOUT_MS = 15000;

/**
 * Chuyển đổi mã trạng thái / lỗi HTTP sang thông báo tiếng Việt thân thiện với người dùng
 */
export function formatAuthError(err: any, fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'): string {
  if (!err) {
    return fallbackMessage;
  }

  // Timeout (RxJS TimeoutError)
  if (err instanceof TimeoutError || err.name === 'TimeoutError') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.';
  }

  // Status 0: không kết nối được máy chủ (mất mạng, server tắt, CORS)
  if (err.status === 0) {
    return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }

  // 429: Quá nhiều yêu cầu
  if (err.status === 429) {
    const retryAfter = err.error?.retryAfter ?? (err.headers?.get ? err.headers.get('Retry-After') : null);
    if (retryAfter !== undefined && retryAfter !== null && retryAfter !== '') {
      return `Vui lòng thử lại sau ${retryAfter} giây.`;
    }
    return err.error?.message || 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau.';
  }

  // 5xx: Lỗi hệ thống server
  if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
    return 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
  }

  // Các lỗi 4xx khác: giữ nguyên message server trả về như hiện tại
  if (err.error?.message && typeof err.error.message === 'string') {
    return err.error.message;
  }

  return fallbackMessage;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth/customer`;
  private readonly TOKEN_KEY = 'dcor_customer_token';
  private readonly USER_KEY = 'dcor_customer';

  constructor(private http: HttpClient) {}

  /**
   * Helper định dạng lỗi cho các component
   */
  formatError(err: any, fallbackMessage?: string): string {
    return formatAuthError(err, fallbackMessage);
  }

  /**
   * Gửi mã OTP xác thực qua SMS (REGISTER hoặc RESET_PASSWORD)
   */
  sendOtp(phone: string, purpose: 'REGISTER' | 'RESET_PASSWORD'): Observable<SendOtpResponse> {
    return this.http
      .post<SendOtpResponse>(`${this.baseUrl}/otp/send`, { phone, purpose })
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Đăng ký tài khoản khách hàng mới bằng OTP
   */
  register(payload: { fullName: string; phone: string; password: string; otp: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Đăng nhập khách hàng bằng SĐT và mật khẩu
   */
  login(payload: { phone: string; password: string; remember?: boolean }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Xác thực mã OTP trong luồng quên mật khẩu để lấy resetToken
   */
  verifyForgotOtp(payload: { phone: string; otp: string }): Observable<VerifyForgotOtpResponse> {
    return this.http
      .post<VerifyForgotOtpResponse>(`${this.baseUrl}/forgot-password/verify-otp`, payload)
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Đặt lại mật khẩu mới bằng resetToken
   */
  resetPassword(payload: { resetToken: string; newPassword: string }): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/forgot-password/reset`, payload)
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Đăng nhập Google
   */
  googleLogin(payload: { email: string; fullName: string; avatarUrl?: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/google`, payload)
      .pipe(timeout(AUTH_REQUEST_TIMEOUT_MS));
  }

  /**
   * Lưu phiên đăng nhập khách hàng vào localStorage
   */
  saveSession(token: string, user: CustomerUser): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Không thể lưu phiên vào localStorage', e);
    }
  }

  /**
   * Lấy token phiên hiện tại
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser(): CustomerUser | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Xóa phiên đăng nhập
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (e) {
      console.error('Lỗi khi xóa phiên', e);
    }
  }

  /**
   * Kiểm tra khách hàng đã đăng nhập hay chưa
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

