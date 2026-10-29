import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, timeout } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface UserDesignApi {
  id: string;
  customerId: string;
  title: string;
  status: 'DRAFT' | 'SAVED';
  backgroundType: 'TEMPLATE' | 'UPLOAD';
  backgroundUrl: string;
  templateId?: string | null;
  roomLength: number;
  roomWidth: number;
  roomHeight?: number | null;
  layout: any[];
  layoutCount?: number;
  coverImageUrl?: string | null;
  postId?: string | null;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
  daysLeft?: number;
}

export interface LikedPostApi {
  id: string;
  title: string;
  authorName: string;
  description?: string | null;
  imageUrl: string;
  likesCount: number;
  createdAt: string;
  likedAt: string;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface UploadImageResponse {
  url: string;
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export const API_TIMEOUT_MS = 25000;

export function formatMyDesignError(err: any, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (!err) return fallback;

  if (err instanceof TimeoutError || err.name === 'TimeoutError') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau giây lát.';
  }

  if (err.status === 0) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.';
  }

  if (err.status === 401) {
    return 'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.';
  }

  if (err.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác trên thiết kế này.';
  }

  if (err.status === 404) {
    return 'Không tìm thấy thiết kế hoặc bài viết được yêu cầu.';
  }

  if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.';
  }

  if (err.error?.message && typeof err.error.message === 'string') {
    return err.error.message;
  }

  return fallback;
}

@Injectable({
  providedIn: 'root'
})
export class MyDesignApiService {
  private readonly baseUrl = `${environment.apiUrl}/store/my-designs`;
  private readonly communityUrl = `${environment.apiUrl}/store/community`;
  private readonly uploadUrl = `${environment.apiUrl}/upload/image`;

  constructor(private http: HttpClient) {}

  formatError(err: any, fallback?: string): string {
    return formatMyDesignError(err, fallback);
  }

  // 1. Tạo bản nháp thiết kế mới trên máy chủ
  createDraft(data: {
    title: string;
    backgroundType: 'TEMPLATE' | 'UPLOAD';
    backgroundUrl: string;
    templateId?: string | null;
    roomLength: number;
    roomWidth: number;
    roomHeight?: number | null;
    layout?: any[];
    coverImageUrl?: string | null;
  }): Observable<UserDesignApi> {
    return this.http.post<UserDesignApi>(this.baseUrl, data).pipe(timeout(API_TIMEOUT_MS));
  }

  // 2. Tự lưu nội dung thiết kế
  updateDesign(id: string, data: Partial<UserDesignApi>): Observable<UserDesignApi> {
    return this.http.put<UserDesignApi>(`${this.baseUrl}/${id}`, data).pipe(timeout(API_TIMEOUT_MS));
  }

  // 3. Chuyển trạng thái từ DRAFT sang SAVED kèm tiêu đề và ảnh bìa
  saveDesign(id: string, title?: string, coverImageUrl?: string): Observable<UserDesignApi> {
    return this.http.patch<UserDesignApi>(`${this.baseUrl}/${id}/save`, { title, coverImageUrl }).pipe(timeout(API_TIMEOUT_MS));
  }

  // 4. Đổi tên thiết kế
  renameDesign(id: string, title: string): Observable<UserDesignApi> {
    return this.http.patch<UserDesignApi>(`${this.baseUrl}/${id}/rename`, { title }).pipe(timeout(API_TIMEOUT_MS));
  }

  // 5. Liên kết bài đăng cộng đồng đã xuất bản
  linkPost(id: string, postId: string): Observable<UserDesignApi> {
    return this.http.patch<UserDesignApi>(`${this.baseUrl}/${id}/link-post`, { postId }).pipe(timeout(API_TIMEOUT_MS));
  }

  // 6. Xóa thiết kế
  deleteDesign(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`).pipe(timeout(API_TIMEOUT_MS));
  }

  // 7. Lấy chi tiết thiết kế
  getDesign(id: string): Observable<UserDesignApi> {
    return this.http.get<UserDesignApi>(`${this.baseUrl}/${id}`).pipe(timeout(API_TIMEOUT_MS));
  }

  // 8. Lấy danh sách thiết kế theo tab (DRAFT hoặc SAVED)
  listDesigns(tab: 'DRAFT' | 'SAVED'): Observable<UserDesignApi[]> {
    return this.http.get<UserDesignApi[]>(`${this.baseUrl}?tab=${tab}`).pipe(timeout(API_TIMEOUT_MS));
  }

  // 9. Lấy danh sách bài viết cộng đồng đã thích (tab LIKED)
  listLikedPosts(): Observable<LikedPostApi[]> {
    return this.http.get<LikedPostApi[]>(`${this.baseUrl}?tab=LIKED`).pipe(timeout(API_TIMEOUT_MS));
  }

  // 10. Thích hoặc Bỏ thích bài viết cộng đồng (Toggle)
  toggleLikePost(postId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.communityUrl}/${postId}/like`, {}).pipe(timeout(API_TIMEOUT_MS));
  }

  // 11. Lấy danh sách ID các bài viết đã thích để tô tim
  getMyLikes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.communityUrl}/likes/mine`).pipe(timeout(API_TIMEOUT_MS));
  }

  // 12. Upload hình ảnh (ảnh nền hoặc ảnh bìa thiết kế nén) qua multipart/form-data
  uploadImage(fileOrBlob: File | Blob, filename = 'design-image.jpg'): Observable<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', fileOrBlob, filename);
    return this.http.post<UploadImageResponse>(this.uploadUrl, formData).pipe(timeout(60000));
  }
}

