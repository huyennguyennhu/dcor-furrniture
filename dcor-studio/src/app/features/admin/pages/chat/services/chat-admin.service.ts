import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError, MonoTypeOperatorFunction } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  ChatConversation,
  ConversationDetailResponse,
  ChatMessage,
  StaffUser,
  BotScript,
  ScriptTestResult,
  ConversationListResponse,
  ChatSummary,
} from '../models/chat-admin.model';

/**
 * Đường dẫn API gốc phân hệ quản trị Chatbox CSKH
 */
export const CHAT_ADMIN_API_BASE_URL = `${environment.apiUrl}/admin/chatbox`;

@Injectable({
  providedIn: 'root',
})
export class ChatAdminService {
  private http = inject(HttpClient);
  public readonly baseUrl = CHAT_ADMIN_API_BASE_URL;
  private readonly uploadUrl = `${environment.apiUrl}/upload/image`;

  /**
   * Chuẩn hóa và xử lý lỗi từ HTTP API (đặc biệt 401 & 403)
   */
  public handleHttpError(error: any, fallbackMessage: string = 'Đã xảy ra lỗi khi thực hiện thao tác.'): string {
    if (error instanceof HttpErrorResponse || (error && typeof error === 'object' && 'status' in error)) {
      if (error.status === 401) {
        return error.error?.message || 'Phiên làm việc hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.';
      }
      if (error.status === 403) {
        return error.error?.message || 'Bạn không đủ quyền thực hiện hành động này trên phân hệ quản trị chatbox (403 Forbidden).';
      }
      if (error.error?.message && typeof error.error.message === 'string') {
        return error.error.message;
      }
    }
    return fallbackMessage;
  }

  /**
   * Pipe xử lý lỗi tự động cho Observable, bảo toàn kiểu dữ liệu T
   */
  private catchAuthErrors<T>(fallbackMessage: string): MonoTypeOperatorFunction<T> {
    return catchError((err: any) => {
      const formattedMessage = this.handleHttpError(err, fallbackMessage);
      if (err && typeof err === 'object') {
        err.formattedMessage = formattedMessage;
        if (err.error && typeof err.error === 'object') {
          err.error.message = err.error.message || formattedMessage;
        }
      }
      return throwError(() => err);
    });
  }

  /**
   * Thống kê tổng quan hội thoại CSKH: {total, waiting, mine, unread, resolved}
   */
  public getSummary(): Observable<ChatSummary> {
    return this.http
      .get<ChatSummary>(`${this.baseUrl}/summary`)
      .pipe(this.catchAuthErrors('Không thể lấy dữ liệu thống kê hội thoại.'));
  }

  /**
   * Lấy danh sách hội thoại
   */
  public getConversations(
    filter: string = 'all',
    q: string = '',
    page: number = 1,
    pageSize: number = 20
  ): Observable<ConversationListResponse> {
    let params = new HttpParams()
      .set('filter', filter)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http
      .get<ConversationListResponse>(`${this.baseUrl}/conversations`, { params })
      .pipe(this.catchAuthErrors('Không thể lấy danh sách cuộc trò chuyện.'));
  }

  /**
   * Lấy chi tiết hội thoại + thông tin khách hàng + 3 đơn gần nhất
   */
  public getConversationDetail(id: string): Observable<ConversationDetailResponse> {
    return this.http
      .get<ConversationDetailResponse>(`${this.baseUrl}/conversations/${id}`)
      .pipe(this.catchAuthErrors('Không thể lấy chi tiết cuộc trò chuyện.'));
  }

  /**
   * Lấy danh sách tin nhắn của cuộc trò chuyện (hỗ trợ phân trang cuộn lên)
   */
  public getMessages(
    id: string,
    before?: string,
    limit: number = 30
  ): Observable<{ messages: ChatMessage[]; hasMore: boolean }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (before) {
      params = params.set('before', before);
    }
    return this.http
      .get<{ messages: ChatMessage[]; hasMore: boolean }>(
        `${this.baseUrl}/conversations/${id}/messages`,
        { params }
      )
      .pipe(this.catchAuthErrors('Không thể lấy tin nhắn cuộc trò chuyện.'));
  }

  /**
   * Tiếp nhận hội thoại (Claim)
   */
  public claimConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http
      .post<{ message: string; conversation: ChatConversation }>(
        `${this.baseUrl}/conversations/${id}/claim`,
        {}
      )
      .pipe(this.catchAuthErrors('Không thể tiếp nhận cuộc trò chuyện.'));
  }

  /**
   * Chuyển hội thoại sang nhân viên khác (Transfer)
   */
  public transferConversation(
    id: string,
    staffId: string
  ): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http
      .post<{ message: string; conversation: ChatConversation }>(
        `${this.baseUrl}/conversations/${id}/transfer`,
        { staffId }
      )
      .pipe(this.catchAuthErrors('Không thể chuyển giao cuộc trò chuyện.'));
  }

  /**
   * Trả hội thoại về cho bot (Return to Bot)
   */
  public returnToBot(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http
      .post<{ message: string; conversation: ChatConversation }>(
        `${this.baseUrl}/conversations/${id}/return-to-bot`,
        {}
      )
      .pipe(this.catchAuthErrors('Không thể chuyển cuộc trò chuyện về cho Bot.'));
  }

  /**
   * Đóng cuộc trò chuyện (Close)
   */
  public closeConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http
      .post<{ message: string; conversation: ChatConversation }>(
        `${this.baseUrl}/conversations/${id}/close`,
        {}
      )
      .pipe(this.catchAuthErrors('Không thể đóng cuộc trò chuyện.'));
  }

  /**
   * Mở lại cuộc trò chuyện (Reopen)
   */
  public reopenConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http
      .post<{ message: string; conversation: ChatConversation }>(
        `${this.baseUrl}/conversations/${id}/reopen`,
        {}
      )
      .pipe(this.catchAuthErrors('Không thể mở lại cuộc trò chuyện.'));
  }

  /**
   * Cập nhật ghi chú nội bộ (Update Note)
   */
  public updateInternalNote(
    id: string,
    internalNote: string
  ): Observable<{ message: string; internalNote: string | null }> {
    return this.http
      .put<{ message: string; internalNote: string | null }>(
        `${this.baseUrl}/conversations/${id}/note`,
        { internalNote }
      )
      .pipe(this.catchAuthErrors('Không thể cập nhật ghi chú nội bộ.'));
  }

  /**
   * Lấy danh sách nhân sự tiếp nhận hội thoại
   */
  public getAvailableStaff(): Observable<{ staff: StaffUser[] }> {
    return this.http
      .get<{ staff: StaffUser[] }>(`${this.baseUrl}/staff`)
      .pipe(this.catchAuthErrors('Không thể lấy danh sách nhân sự.'));
  }

  /**
   * Lấy danh sách kịch bản Bot
   */
  public getScripts(): Observable<{ scripts: BotScript[] }> {
    return this.http
      .get<{ scripts: BotScript[] }>(`${this.baseUrl}/scripts`)
      .pipe(this.catchAuthErrors('Không thể lấy danh sách kịch bản bot.'));
  }

  /**
   * Tạo kịch bản Bot
   */
  public createScript(script: Partial<BotScript>): Observable<{ message: string; script: BotScript }> {
    return this.http
      .post<{ message: string; script: BotScript }>(`${this.baseUrl}/scripts`, script)
      .pipe(this.catchAuthErrors('Không thể tạo kịch bản bot.'));
  }

  /**
   * Cập nhật kịch bản Bot
   */
  public updateScript(id: string, script: Partial<BotScript>): Observable<{ message: string; script: BotScript }> {
    return this.http
      .put<{ message: string; script: BotScript }>(`${this.baseUrl}/scripts/${id}`, script)
      .pipe(this.catchAuthErrors('Không thể cập nhật kịch bản bot.'));
  }

  /**
   * Xóa kịch bản Bot
   */
  public deleteScript(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/scripts/${id}`)
      .pipe(this.catchAuthErrors('Không thể xóa kịch bản bot.'));
  }

  /**
   * Thử kịch bản (không tạo tin nhắn)
   */
  public testScript(text: string): Observable<ScriptTestResult> {
    return this.http
      .post<ScriptTestResult>(`${this.baseUrl}/scripts/test`, { text })
      .pipe(this.catchAuthErrors('Không thể kiểm tra kịch bản bot.'));
  }

  /**
   * Lấy cấu hình Chat & Bot
   */
  public getSettings(): Observable<{ settings: Record<string, any> }> {
    return this.http
      .get<{ settings: Record<string, any> }>(`${this.baseUrl}/settings`)
      .pipe(this.catchAuthErrors('Không thể lấy cấu hình chat.'));
  }

  /**
   * Cập nhật cấu hình Chat & Bot
   */
  public updateSettings(payload: Record<string, any>): Observable<{ message: string; settings: Record<string, any> }> {
    return this.http
      .put<{ message: string; settings: Record<string, any> }>(`${this.baseUrl}/settings`, payload)
      .pipe(this.catchAuthErrors('Không thể cập nhật cấu hình chat.'));
  }

  /**
   * Nén ảnh client-side đảm bảo <= 800KB và tải lên máy chủ qua POST /api/upload/image
   */
  public compressAndUploadImage(file: File): Observable<{ url: string }> {
    return from(this.compressImage(file, 800 * 1024)).pipe(
      switchMap((compressedFile) => {
        const formData = new FormData();
        formData.append('file', compressedFile);
        return this.http.post<{ url: string }>(this.uploadUrl, formData);
      }),
      this.catchAuthErrors('Không thể tải ảnh lên máy chủ.')
    );
  }

  /**
   * Nén ảnh bằng HTML5 Canvas sang định dạng WebP với kích thước <= maxSizeBytes
   */
  private compressImage(file: File, maxSizeBytes: number = 800 * 1024): Promise<File> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        return resolve(file);
      }

      if (file.size <= maxSizeBytes && file.type === 'image/webp') {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.85;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve(file);
                if (blob.size <= maxSizeBytes || quality <= 0.3) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  quality -= 0.15;
                  tryCompress();
                }
              },
              'image/webp',
              quality
            );
          };

          tryCompress();
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }
}
