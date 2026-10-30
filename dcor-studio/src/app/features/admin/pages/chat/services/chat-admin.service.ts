import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  ChatConversation,
  ConversationDetailResponse,
  ChatMessage,
  StaffUser,
  BotScript,
  ScriptTestResult,
  ConversationListResponse,
} from '../models/chat-admin.model';

@Injectable({
  providedIn: 'root',
})
export class ChatAdminService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/chat`;
  private readonly uploadUrl = `${environment.apiUrl}/upload/image`;

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

    return this.http.get<ConversationListResponse>(`${this.baseUrl}/conversations`, { params });
  }

  /**
   * Lấy chi tiết hội thoại + thông tin khách hàng + 3 đơn gần nhất
   */
  public getConversationDetail(id: string): Observable<ConversationDetailResponse> {
    return this.http.get<ConversationDetailResponse>(`${this.baseUrl}/conversations/${id}`);
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
    return this.http.get<{ messages: ChatMessage[]; hasMore: boolean }>(
      `${this.baseUrl}/conversations/${id}/messages`,
      { params }
    );
  }

  /**
   * Tiếp nhận hội thoại (Claim)
   */
  public claimConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http.post<{ message: string; conversation: ChatConversation }>(
      `${this.baseUrl}/conversations/${id}/claim`,
      {}
    );
  }

  /**
   * Chuyển hội thoại sang nhân viên khác (Transfer)
   */
  public transferConversation(
    id: string,
    staffId: string
  ): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http.post<{ message: string; conversation: ChatConversation }>(
      `${this.baseUrl}/conversations/${id}/transfer`,
      { staffId }
    );
  }

  /**
   * Trả hội thoại về cho bot (Return to Bot)
   */
  public returnToBot(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http.post<{ message: string; conversation: ChatConversation }>(
      `${this.baseUrl}/conversations/${id}/return-to-bot`,
      {}
    );
  }

  /**
   * Đóng cuộc trò chuyện (Close)
   */
  public closeConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http.post<{ message: string; conversation: ChatConversation }>(
      `${this.baseUrl}/conversations/${id}/close`,
      {}
    );
  }

  /**
   * Mở lại cuộc trò chuyện (Reopen)
   */
  public reopenConversation(id: string): Observable<{ message: string; conversation: ChatConversation }> {
    return this.http.post<{ message: string; conversation: ChatConversation }>(
      `${this.baseUrl}/conversations/${id}/reopen`,
      {}
    );
  }

  /**
   * Cập nhật ghi chú nội bộ (Update Note)
   */
  public updateInternalNote(
    id: string,
    internalNote: string
  ): Observable<{ message: string; internalNote: string | null }> {
    return this.http.put<{ message: string; internalNote: string | null }>(
      `${this.baseUrl}/conversations/${id}/note`,
      { internalNote }
    );
  }

  /**
   * Lấy danh sách nhân sự tiếp nhận hội thoại
   */
  public getAvailableStaff(): Observable<{ staff: StaffUser[] }> {
    return this.http.get<{ staff: StaffUser[] }>(`${this.baseUrl}/staff`);
  }

  /**
   * Lấy danh sách kịch bản Bot
   */
  public getScripts(): Observable<{ scripts: BotScript[] }> {
    return this.http.get<{ scripts: BotScript[] }>(`${this.baseUrl}/scripts`);
  }

  /**
   * Tạo kịch bản Bot
   */
  public createScript(script: Partial<BotScript>): Observable<{ message: string; script: BotScript }> {
    return this.http.post<{ message: string; script: BotScript }>(`${this.baseUrl}/scripts`, script);
  }

  /**
   * Cập nhật kịch bản Bot
   */
  public updateScript(id: string, script: Partial<BotScript>): Observable<{ message: string; script: BotScript }> {
    return this.http.put<{ message: string; script: BotScript }>(`${this.baseUrl}/scripts/${id}`, script);
  }

  /**
   * Xóa kịch bản Bot
   */
  public deleteScript(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/scripts/${id}`);
  }

  /**
   * Thử kịch bản (không tạo tin nhắn)
   */
  public testScript(text: string): Observable<ScriptTestResult> {
    return this.http.post<ScriptTestResult>(`${this.baseUrl}/scripts/test`, { text });
  }

  /**
   * Lấy cấu hình Chat & Bot
   */
  public getSettings(): Observable<{ settings: Record<string, any> }> {
    return this.http.get<{ settings: Record<string, any> }>(`${this.baseUrl}/settings`);
  }

  /**
   * Cập nhật cấu hình Chat & Bot
   */
  public updateSettings(payload: Record<string, any>): Observable<{ message: string; settings: Record<string, any> }> {
    return this.http.put<{ message: string; settings: Record<string, any> }>(`${this.baseUrl}/settings`, payload);
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
      })
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

