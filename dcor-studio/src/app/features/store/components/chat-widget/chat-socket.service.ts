import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ChatConversation,
  ChatMessage,
  ChatInitResponse,
  GreetingResponse,
  GuestSession,
  MessagesResponse,
  TypingIndicator,
  UploadImageResponse,
} from './chat-widget.model';

export const GUEST_STORAGE_KEY = 'dcor_chat_guest';
export const CHAT_UI_OPEN_KEY = 'dcor_chat_ui_open';
export const PENDING_HANDOFF_KEY = 'dcor_chat_pending_handoff';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private socket: Socket | null = null;
  private typingTimeoutTimer: any = null;
  private isWindowOpenState = false;

  // Signals
  public isConnected = signal(false);
  public isReconnecting = signal(false);
  public socketError = signal<string | null>(null);
  public currentConversation = signal<ChatConversation | null>(null);
  public messages = signal<ChatMessage[]>([]);
  public typingIndicator = signal<TypingIndicator | null>(null);
  public unreadCount = signal(0);
  public isLoadingHistory = signal(false);
  public hasMoreHistory = signal(false);
  public isRateLimited = signal(false);
  public rateLimitMessage = signal<string | null>(null);
  public initialGreeting = signal<GreetingResponse | null>(null);

  // Computed
  public isGuest = computed(() => !this.authService.isAuthenticated());
  public isConversationClosed = computed(() => this.currentConversation()?.status === 'CLOSED');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  public setWindowOpen(isOpen: boolean) {
    this.isWindowOpenState = isOpen;
    if (isOpen) {
      this.unreadCount.set(0);
      const convId = this.currentConversation()?.id;
      if (convId) {
        this.markAsRead(convId);
      }
    }
  }

  /**
   * Lấy origin URL của máy chủ socket từ apiUrl (bỏ tiền tố /api)
   */
  public getSocketUrl(): string {
    return environment.apiUrl.replace(/\/api\/?$/, '');
  }

  /**
   * Sinh hoặc lấy guestToken ngẫu nhiên duy nhất
   */
  public getOrCreateGuestToken(): string {
    const session = this.getGuestSession();
    if (session?.guestToken) {
      return session.guestToken;
    }
    // Sinh chuỗi ngẫu nhiên 64 ký tự hex
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    }
    const token = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    this.saveGuestSession({ guestToken: token });
    return token;
  }

  /**
   * Lưu phiên khách vãng lai
   */
  public saveGuestSession(session: GuestSession): void {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }

  /**
   * Lấy phiên khách vãng lai từ localStorage
   */
  public getGuestSession(): GuestSession | null {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Xóa toàn bộ dữ liệu lưu phiên chat của khách (token, session id, tin nhắn, pending handoff)
   */
  public clearAllChatStorage(): void {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(PENDING_HANDOFF_KEY);
      sessionStorage.removeItem(CHAT_UI_OPEN_KEY);
      sessionStorage.removeItem('dcor_chat_messages');
      sessionStorage.removeItem('dcor_chat_session_id');
      sessionStorage.removeItem('dcor_chat_token');
    } catch {}
  }

  /**
   * Quản lý cờ pendingHandoff khi chuyển sang đăng nhập
   */
  public setPendingHandoff(val: boolean): void {
    try {
      if (val) {
        localStorage.setItem(PENDING_HANDOFF_KEY, 'true');
      } else {
        localStorage.removeItem(PENDING_HANDOFF_KEY);
      }
    } catch {}
  }

  public hasPendingHandoff(): boolean {
    try {
      return localStorage.getItem(PENDING_HANDOFF_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private errorTimeoutTimer: any = null;

  public setError(msg: string | null): void {
    if (this.errorTimeoutTimer) {
      clearTimeout(this.errorTimeoutTimer);
      this.errorTimeoutTimer = null;
    }
    this.socketError.set(msg);
    if (msg) {
      this.errorTimeoutTimer = setTimeout(() => {
        this.socketError.set(null);
        this.errorTimeoutTimer = null;
      }, 5500);
    }
  }

  /**
   * Tạo HttpHeaders chứa token đăng nhập hoặc X-Guest-Token
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.authService.isAuthenticated()) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    } else {
      const guestToken = this.getOrCreateGuestToken();
      if (guestToken) {
        headers = headers.set('X-Guest-Token', guestToken);
      }
    }
    return headers;
  }

  /**
   * Khởi tạo kết nối Socket.IO
   */
  public connect(): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    const socketUrl = this.getSocketUrl();
    const authPayload: Record<string, string> = {};

    if (this.authService.isAuthenticated()) {
      const token = this.authService.getToken();
      if (token) {
        authPayload['token'] = token;
        authPayload['customerToken'] = token;
      }
    }

    const guestToken = this.getOrCreateGuestToken();
    if (guestToken) {
      authPayload['guestToken'] = guestToken;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
    }

    this.socket = io(socketUrl, {
      auth: authPayload,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });

    this.setupSocketListeners();
  }

  /**
   * Cài đặt các trình lắng nghe sự kiện Socket.IO
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.isReconnecting.set(false);
      this.socketError.set(null);
      this.isRateLimited.set(false);

      const currentConv = this.currentConversation();
      if (currentConv?.id) {
        this.syncMessagesAfterReconnect(currentConv.id);
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', () => {
      this.isConnected.set(false);
      this.isReconnecting.set(true);
    });

    this.socket.on('chat:message', (newMsg: ChatMessage) => {
      this.handleIncomingMessage(newMsg);
    });

    this.socket.on('chat:conversation', (convData: any) => {
      const current = this.currentConversation();
      if (current && current.id === convData.id) {
        this.currentConversation.set({
          ...current,
          ...convData,
        });
      }
    });

    this.socket.on('chat:session_reset', (data: { conversationId: string; clearedAt: string }) => {
      const current = this.currentConversation();
      if (current && current.id === data.conversationId) {
        this.messages.set([]);
        this.fetchGreeting();
      }
    });

    this.socket.on('chat:init:success', (data: { conversationId: string; guestToken?: string }) => {
      if (data?.conversationId) {
        const guestSession = this.getGuestSession() || { guestToken: data.guestToken || '' };
        guestSession.conversationId = data.conversationId;
        if (data.guestToken) {
          guestSession.guestToken = data.guestToken;
        }
        this.saveGuestSession(guestSession);

        const cur = this.currentConversation();
        if (!cur) {
          this.currentConversation.set({
            id: data.conversationId,
            mode: 'BOT',
            status: 'OPEN',
            unreadCustomer: 0,
            unreadStaff: 0,
          });
        }
      }
    });

    this.socket.on('chat:typing', (data: TypingIndicator) => {
      if (data.senderType !== 'CUSTOMER') {
        if (data.isTyping) {
          this.typingIndicator.set(data);
          if (this.typingTimeoutTimer) clearTimeout(this.typingTimeoutTimer);
          this.typingTimeoutTimer = setTimeout(() => {
            this.typingIndicator.set(null);
          }, 6000);
        } else {
          this.typingIndicator.set(null);
          if (this.typingTimeoutTimer) clearTimeout(this.typingTimeoutTimer);
        }
      }
    });

    this.socket.on('chat:read', (data: { conversationId: string; readerType: string }) => {
      if (data.readerType === 'STAFF') {
        const updated = this.messages().map((m) =>
          m.senderType === 'CUSTOMER' && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m
        );
        this.messages.set(updated);
      }
    });

    this.socket.on('chat:error', (err: { code?: string; message?: string }) => {
      const msg = err?.message || 'Đã có lỗi xảy ra.';
      this.setError(msg);

      if (msg.includes('quá nhanh') || msg.includes('20 tin/phút')) {
        this.isRateLimited.set(true);
        this.rateLimitMessage.set(msg);
        setTimeout(() => {
          this.isRateLimited.set(false);
          this.rateLimitMessage.set(null);
        }, 5000);
      }
    });
  }

  /**
   * Xử lý tin nhắn nhận được từ Socket
   */
  private handleIncomingMessage(incoming: ChatMessage): void {
    const list = this.messages();

    // 1. Đối chiếu với tin gửi lạc quan
    if (incoming.clientMessageId) {
      const optIndex = list.findIndex(
        (m) => m.clientMessageId === incoming.clientMessageId
      );
      if (optIndex !== -1) {
        const next = [...list];
        next[optIndex] = {
          ...incoming,
          deliveryStatus: 'SENT',
        };
        this.messages.set(next);
        return;
      }
    }

    // 2. Chống trùng lặp theo ID
    const exists = list.some((m) => m.id === incoming.id);
    if (!exists) {
      this.messages.set([...list, { ...incoming, deliveryStatus: 'SENT' }]);
    }

    // 3. Nếu tin từ BOT, STAFF hoặc SYSTEM
    if (incoming.senderType !== 'CUSTOMER') {
      this.typingIndicator.set(null);
      if (!this.isWindowOpenState) {
        this.unreadCount.update((cnt) => cnt + 1);
      } else {
        this.markAsRead(incoming.conversationId);
      }
    }
  }

  /**
   * REST: GET /api/chat/greeting (Công khai, không tạo hội thoại trong DB)
   */
  public async fetchGreeting(): Promise<GreetingResponse | null> {
    try {
      const headers = this.getAuthHeaders();
      const res = await firstValueFrom(
        this.http
          .get<GreetingResponse>(`${environment.apiUrl}/chat/greeting`, { headers })
          .pipe(timeout(10000))
      );
      if (res) {
        this.initialGreeting.set(res);
        return res;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Gửi tin nhắn qua Socket kèm cập nhật lạc quan
   */
  public sendMessage(content: string, imageUrl?: string): string {
    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const conv = this.currentConversation();
    const convId = conv?.id || '';

    const optimisticMessage: ChatMessage = {
      id: clientMessageId,
      conversationId: convId,
      senderType: 'CUSTOMER',
      senderName: conv?.guestName || this.authService.getCurrentUser()?.fullName || 'Khách vãng lai',
      content: content.trim(),
      imageUrl: imageUrl || null,
      clientMessageId,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'SENDING',
    };

    // Đưa ngay vào danh sách tin nhắn (Optimistic UI)
    this.messages.update((list) => [...list, optimisticMessage]);

    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    const payload: any = {
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      clientMessageId,
    };
    if (convId) {
      payload.conversationId = convId;
    }

    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:send', payload);
    } else {
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('chat:send', payload);
        } else {
          this.markOptimisticMessageFailed(clientMessageId);
        }
      }, 1000);
    }

    // Timeout dự phòng sau 12 giây nếu server không phản hồi
    setTimeout(() => {
      const target = this.messages().find((m) => m.clientMessageId === clientMessageId);
      if (target && target.deliveryStatus === 'SENDING') {
        this.markOptimisticMessageFailed(clientMessageId);
      }
    }, 12000);

    return clientMessageId;
  }

  /**
   * Thử gửi lại tin nhắn lỗi
   */
  public retryMessage(clientMessageId: string): void {
    const target = this.messages().find((m) => m.clientMessageId === clientMessageId);
    if (!target) return;

    this.messages.update((list) =>
      list.map((m) =>
        m.clientMessageId === clientMessageId ? { ...m, deliveryStatus: 'SENDING' } : m
      )
    );

    const conv = this.currentConversation();
    const payload: any = {
      content: target.content,
      imageUrl: target.imageUrl || undefined,
      clientMessageId,
    };
    if (conv?.id) {
      payload.conversationId = conv.id;
    }

    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:send', payload);
    } else {
      this.connect();
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('chat:send', payload);
        } else {
          this.markOptimisticMessageFailed(clientMessageId);
        }
      }, 1000);
    }

    setTimeout(() => {
      const cur = this.messages().find((m) => m.clientMessageId === clientMessageId);
      if (cur && cur.deliveryStatus === 'SENDING') {
        this.markOptimisticMessageFailed(clientMessageId);
      }
    }, 12000);
  }

  private markOptimisticMessageFailed(clientMessageId: string): void {
    this.messages.update((list) =>
      list.map((m) =>
        m.clientMessageId === clientMessageId ? { ...m, deliveryStatus: 'FAILED' } : m
      )
    );
  }

  /**
   * Báo đang gõ phím
   */
  public sendTyping(isTyping: boolean): void {
    const convId = this.currentConversation()?.id;
    if (convId && this.socket && this.socket.connected) {
      this.socket.emit('chat:typing', { conversationId: convId, isTyping });
    }
  }

  /**
   * Đánh dấu đã đọc tin nhắn
   */
  public markAsRead(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:read', { conversationId });
    }
  }

  /**
   * Chọn câu trả lời gợi ý nhanh
   */
  public selectQuickReply(payload: string): void {
    if (!payload || !payload.trim()) return;
    this.sendMessage(payload.trim());
  }

  /**
   * REST: Lấy cuộc trò chuyện hiện tại của khách
   */
  public async fetchMeConversation(): Promise<ChatConversation | null> {
    const headers = this.getAuthHeaders();
    try {
      const res = await firstValueFrom(
        this.http
          .get<{ conversation: ChatConversation }>(`${environment.apiUrl}/chat/conversations/me`, {
            headers,
          })
          .pipe(timeout(10000))
      );

      if (res && res.conversation) {
        this.currentConversation.set(res.conversation);
        return res.conversation;
      }
      return null;
    } catch (err: any) {
      if (err instanceof HttpErrorResponse && (err.status === 404 || err.status === 403)) {
        this.clearAllChatStorage();
        this.currentConversation.set(null);
        return null;
      }
      return null;
    }
  }

  /**
   * REST: Lấy lịch sử tin nhắn của hội thoại
   */
  public async fetchMessages(
    conversationId: string,
    before?: string,
    limit: number = 30
  ): Promise<ChatMessage[]> {
    const headers = this.getAuthHeaders();
    let params: Record<string, string> = { limit: limit.toString() };
    if (before) {
      params['before'] = before;
    }

    try {
      this.isLoadingHistory.set(true);
      const res = await firstValueFrom(
        this.http
          .get<MessagesResponse>(
            `${environment.apiUrl}/chat/conversations/${conversationId}/messages`,
            { headers, params }
          )
          .pipe(timeout(12000))
      );

      this.hasMoreHistory.set(res.hasMore);
      const incomingList = res.messages.map((m) => ({ ...m, deliveryStatus: 'SENT' as const }));

      if (before) {
        this.messages.update((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const filteredIncoming = incomingList.filter((m) => !prevIds.has(m.id));
          return [...filteredIncoming, ...prev];
        });
      } else {
        this.messages.set(incomingList);
      }

      return incomingList;
    } catch (err: any) {
      if (err instanceof HttpErrorResponse && (err.status === 403 || err.status === 404)) {
        this.clearAllChatStorage();
        this.currentConversation.set(null);
        this.hasMoreHistory.set(false);
        return [];
      }
      return [];
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  /**
   * Đồng bộ lại tin nhắn sau khi Socket nối lại
   */
  private async syncMessagesAfterReconnect(conversationId: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      const res = await firstValueFrom(
        this.http
          .get<MessagesResponse>(
            `${environment.apiUrl}/chat/conversations/${conversationId}/messages`,
            { headers, params: { limit: '30' } }
          )
          .pipe(timeout(8000))
      );

      if (res && res.messages) {
        this.messages.update((localList) => {
          const map = new Map<string, ChatMessage>();
          for (const m of localList) {
            map.set(m.id, m);
            if (m.clientMessageId) {
              map.set(m.clientMessageId, m);
            }
          }
          for (const s of res.messages) {
            const enriched = { ...s, deliveryStatus: 'SENT' as const };
            map.set(s.id, enriched);
            if (s.clientMessageId) {
              map.set(s.clientMessageId, enriched);
            }
          }
          const uniqueList = Array.from(new Set(map.values()));
          uniqueList.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return uniqueList;
        });
      }
    } catch {}
  }

  /**
   * REST: POST /api/chat/conversations/claim
   * Gắn hội thoại guest vào customerId sau khi đăng nhập thành công
   */
  public async claimConversation(): Promise<void> {
    if (!this.authService.isAuthenticated()) return;
    const session = this.getGuestSession();
    if (!session?.guestToken) return;

    try {
      const headers = this.getAuthHeaders();
      const res = await firstValueFrom(
        this.http
          .post<{ message: string; conversation: ChatConversation; hadPendingHandoff: boolean }>(
            `${environment.apiUrl}/chat/conversations/claim`,
            { guestToken: session.guestToken },
            { headers }
          )
          .pipe(timeout(10000))
      );

      if (res && res.conversation) {
        this.currentConversation.set(res.conversation);
        this.setPendingHandoff(false);

        // Nối lại socket với JWT token khách
        this.disconnect();
        this.connect();

        // Tải lại tin nhắn mới nhất (đã có tin SYSTEM kết nối nhân viên nếu pendingHandoff)
        await this.fetchMessages(res.conversation.id, undefined, 30);
      }
    } catch {}
  }

  /**
   * REST: DELETE /api/chat/conversations/:id
   * Bấm nút thùng rác: backend KHÔNG xóa hội thoại, chỉ đánh dấu làm mới;
   * KHÔNG xóa conversationId hay guestToken đã lưu (khách vãng lai vẫn là cùng một người);
   * Xóa bong bóng trên màn hình, tải lại lịch sử (rỗng) và hiện lại lời chào gốc.
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    const headers = this.getAuthHeaders();
    try {
      await firstValueFrom(
        this.http
          .delete(`${environment.apiUrl}/chat/conversations/${conversationId}`, { headers })
          .pipe(timeout(10000))
      );
    } catch {}

    // Xóa bong bóng trên màn hình
    this.messages.set([]);
    this.unreadCount.set(0);
    this.typingIndicator.set(null);
    this.setPendingHandoff(false);

    // Tải lại lịch sử (sẽ rỗng vì backend lọc tin createdAt > customerClearedAt)
    await this.fetchMessages(conversationId, undefined, 30);

    // Hiện lại lời chào gốc
    await this.fetchGreeting();
  }

  /**
   * Đưa widget về trạng thái lời chào mới (chưa có hội thoại)
   */
  public resetToFreshState(): void {
    this.clearAllChatStorage();
    this.currentConversation.set(null);
    this.messages.set([]);
    this.unreadCount.set(0);
    this.typingIndicator.set(null);
    this.setPendingHandoff(false);

    // Nạp lại lời chào mới
    this.fetchGreeting();
  }

  /**
   * Nén ảnh phía client xuống tối đa 800KB bằng Canvas
   */
  public async compressImage(file: File, maxSizeBytes: number = 800 * 1024): Promise<File> {
    if (file.size <= maxSizeBytes) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDimension = 1600;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }

                if (blob.size <= maxSizeBytes || quality <= 0.4) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  tryCompress(quality - 0.15);
                }
              },
              'image/webp',
              quality
            );
          };

          tryCompress(0.85);
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Tải ảnh qua REST API POST /api/upload/image
   */
  public async uploadImage(file: File): Promise<string> {
    const compressed = await this.compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);

    const headers = this.getAuthHeaders();
    try {
      const res = await firstValueFrom(
        this.http
          .post<UploadImageResponse>(`${environment.apiUrl}/upload/image`, formData, { headers })
          .pipe(timeout(25000))
      );
      return res.url;
    } catch (err: any) {
      const msg = err?.error?.message || 'Không thể tải ảnh lên.';
      this.setError(msg);
      throw err;
    }
  }

  /**
   * Ngắt kết nối socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.isConnected.set(false);
    this.isReconnecting.set(false);
  }
}
