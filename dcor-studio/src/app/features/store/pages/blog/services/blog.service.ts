import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, timeout } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  BlogCategory,
  BlogPostDetail,
  BlogPostsListResponse,
  BlogCommentsResponse,
  LikePostResponse,
  CreateCommentResponse
} from '../models/blog.model';

export const BLOG_TIMEOUT_MS = 20000;

/**
 * Xử lý lỗi HTTP (0, 401, 403, 404, 429, 5xx) bằng thông báo tiếng Việt thân thiện
 */
export function formatBlogError(err: any, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'): string {
  if (!err) return fallback;

  if (err instanceof TimeoutError || err.name === 'TimeoutError') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng kiểm tra đường truyền và thử lại.';
  }

  const status = typeof err.status === 'number' ? err.status : 0;

  if (status === 0) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }

  if (status === 400) {
    return err.error?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return err.error?.message || 'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập bằng tài khoản khách hàng.';
  }

  if (status === 404) {
    return err.error?.message || 'Bài viết hoặc dữ liệu yêu cầu không tồn tại hoặc đã được ẩn.';
  }

  if (status === 429) {
    const retryAfter = err.error?.retryAfter ?? (err.headers?.get ? err.headers.get('Retry-After') : null);
    if (retryAfter) {
      return `Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ${retryAfter} giây.`;
    }
    return err.error?.message || 'Bạn đang thao tác quá nhanh. Vui lòng chờ 1 phút rồi thử lại.';
  }

  if (status >= 500 && status < 600) {
    return 'Hệ thống đang gặp sự cố gián đoạn. Vui lòng thử lại sau giây lát.';
  }

  if (err.error?.message && typeof err.error.message === 'string') {
    return err.error.message;
  }

  return fallback;
}

export function slugifyText(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/blog`;

  /**
   * Lấy danh sách danh mục blog công khai
   */
  getCategories(): Observable<BlogCategory[]> {
    return this.http
      .get<BlogCategory[]>(`${this.baseUrl}/categories`)
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Lấy danh sách bài viết blog có tìm kiếm, lọc danh mục, lọc tag, phân trang
   */
  getPosts(params: {
    q?: string;
    category?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }): Observable<BlogPostsListResponse> {
    let httpParams = new HttpParams();

    if (params.q && params.q.trim()) {
      httpParams = httpParams.set('q', params.q.trim());
    }
    if (params.category && params.category.trim()) {
      httpParams = httpParams.set('category', params.category.trim());
    }
    if (params.tag && params.tag.trim()) {
      httpParams = httpParams.set('tag', params.tag.trim());
    }
    if (params.page && params.page > 0) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize && params.pageSize > 0) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http
      .get<BlogPostsListResponse>(`${this.baseUrl}/posts`, { params: httpParams })
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Lấy chi tiết bài viết theo slug
   */
  getPostBySlug(slug: string): Observable<BlogPostDetail> {
    return this.http
      .get<BlogPostDetail>(`${this.baseUrl}/posts/${encodeURIComponent(slug)}`)
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Thả tim hoặc bỏ tim bài viết (Yêu cầu tài khoản khách hàng)
   */
  likePost(slug: string): Observable<LikePostResponse> {
    return this.http
      .post<LikePostResponse>(`${this.baseUrl}/posts/${encodeURIComponent(slug)}/like`, {})
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Lấy danh sách bình luận của bài viết
   */
  getComments(slug: string, page = 1, pageSize = 20): Observable<BlogCommentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<BlogCommentsResponse>(`${this.baseUrl}/posts/${encodeURIComponent(slug)}/comments`, { params })
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Gửi bình luận mới (<= 500 ký tự, yêu cầu tài khoản khách hàng)
   */
  createComment(slug: string, content: string): Observable<CreateCommentResponse> {
    return this.http
      .post<CreateCommentResponse>(`${this.baseUrl}/posts/${encodeURIComponent(slug)}/comments`, {
        content
      })
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Xóa bình luận của chính mình
   */
  deleteComment(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/comments/${encodeURIComponent(id)}`)
      .pipe(timeout(BLOG_TIMEOUT_MS));
  }

  /**
   * Helper định dạng thông báo lỗi tiếng Việt
   */
  formatError(err: any, fallback?: string): string {
    return formatBlogError(err, fallback);
  }
}

