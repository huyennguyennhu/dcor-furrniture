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
  GuestSession,
  MessagesResponse,
  TypingIndicator,
  UploadImageResponse,
} from './chat-widget.model';

export const GUEST_STORAGE_KEY = 'dcor_chat_guest';
export const CHAT_UI_OPEN_KEY = 'dcor_chat_ui_open';

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
  public hasMoreHistory = signal(true);
  public isRateLimited = signal(false);
  public rateLimitMessage = signal<string | null>(null);

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
   * Lưu phiên khách vãng lai
   */
  public saveGuestSession(session: GuestSession): void {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Bỏ qua lỗi hạn mức lưu trữ
    }
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
   * Xóa phiên khách vãng lai
   */
  public clearGuestSession(): void {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Bỏ qua
    }
  }

  /**
   * Tạo HttpHeaders chứa token đăng nhập hoặc X-Guest-Token
   */
  private errorTimeoutTimer: any = null;

  /**
   * Đặt thông báo lỗi với cơ chế tự ẩn sau 5.5 giây
   */
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
   * Đảm bảo MỌI lời gọi REST chat tự gắn đúng định danh duy nhất (Authorization hoặc X-Guest-Token)
   */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.authService.isAuthenticated()) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    } else {
      const guestSession = this.getGuestSession();
      if (guestSession?.guestToken) {
        headers = headers.set('X-Guest-Token', guestSession.guestToken);
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

    const guestSession = this.getGuestSession();
    if (guestSession?.guestToken) {
      authPayload['guestToken'] = guestSession.guestToken;
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

      // Đồng bộ lại tin nhắn còn thiếu sau khi kết nối lại
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

    this.socket.on('chat:error', (err: { message: string }) => {
      const msg = err?.message || 'Đã có lỗi xảy ra.';
      this.socketError.set(msg);

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

    // 1. Kiểm tra đối chiếu với tin nhắn gửi lạc quan (optimistic)
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
   * Khởi tạo cuộc trò chuyện cho khách vãng lai
   */
  public async initGuestConversation(name: string, phone: string): Promise<ChatInitResponse> {
    if (!this.socket) {
      this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Chưa thiết lập socket.'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Yêu cầu khởi tạo quá thời gian chờ (15s).'));
      }, 15000);

      this.socket.emit('chat:init', { name, phone }, (res: any) => {
        clearTimeout(timer);
        if (res && res.error) {
          reject(new Error(res.error));
        } else if (res && res.conversationId) {
          const guestSession: GuestSession = {
            conversationId: res.conversationId,
            guestToken: res.guestToken,
            guestName: name,
            guestPhone: phone,
          };
          this.saveGuestSession(guestSession);

          // Tải thông tin hội thoại
          this.currentConversation.set({
            id: res.conversationId,
            mode: 'BOT',
            status: 'OPEN',
            unreadCustomer: 0,
            unreadStaff: 0,
            guestName: name,
            guestPhone: phone,
          });

          // Thêm tin nhắn chào hỏi
          if (res.message) {
            this.messages.set([{ ...res.message, deliveryStatus: 'SENT' }]);
          }

          resolve(res);
        } else {
          reject(new Error('Phản hồi khởi tạo không hợp lệ.'));
        }
      });
    });
  }

  /**
   * Gửi tin nhắn qua Socket kèm cập nhật lạc quan
   */
  public sendMessage(content: string, imageUrl?: string): string {
    const conv = this.currentConversation();
    if (!conv) {
      throw new Error('Chưa có cuộc trò chuyện nào.');
    }

    const clientMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: clientMessageId,
      conversationId: conv.id,
      senderType: 'CUSTOMER',
      senderName: conv.guestName || this.authService.getCurrentUser()?.fullName || 'Khách hàng',
      content: content.trim(),
      imageUrl: imageUrl || null,
      clientMessageId,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'SENDING',
    };

    // Đưa ngay vào danh sách tin nhắn (Optimistic UI)
    this.messages.update((list) => [...list, optimisticMessage]);

    if (!this.socket || !this.socket.connected) {
      // Đánh dấu lỗi nếu socket mất kết nối
      this.markOptimisticMessageFailed(clientMessageId);
      return clientMessageId;
    }

    this.socket.emit('chat:send', {
      conversationId: conv.id,
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      clientMessageId,
    });

    // Timeout dự phòng sau 10 giây nếu server không phản hồi
    setTimeout(() => {
      const target = this.messages().find((m) => m.clientMessageId === clientMessageId);
      if (target && target.deliveryStatus === 'SENDING') {
        this.markOptimisticMessageFailed(clientMessageId);
      }
    }, 10000);

    return clientMessageId;
  }

  /**
   * Thử gửi lại tin nhắn lỗi
   */
  public retryMessage(clientMessageId: string): void {
    const target = this.messages().find((m) => m.clientMessageId === clientMessageId);
    if (!target) return;

    const conv = this.currentConversation();
    if (!conv) return;

    this.messages.update((list) =>
      list.map((m) =>
        m.clientMessageId === clientMessageId ? { ...m, deliveryStatus: 'SENDING' } : m
      )
    );

    if (!this.socket || !this.socket.connected) {
      this.markOptimisticMessageFailed(clientMessageId);
      return;
    }

    this.socket.emit('chat:send', {
      conversationId: conv.id,
      content: target.content,
      imageUrl: target.imageUrl || undefined,
      clientMessageId,
    });

    setTimeout(() => {
      const cur = this.messages().find((m) => m.clientMessageId === clientMessageId);
      if (cur && cur.deliveryStatus === 'SENDING') {
        this.markOptimisticMessageFailed(clientMessageId);
      }
    }, 10000);
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
    const conv = this.currentConversation();
    if (!conv) return;

    if (this.socket && this.socket.connected) {
      this.socket.emit('quickReply:select', {
        conversationId: conv.id,
        payload,
      });
    } else {
      this.sendMessage(payload);
    }
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
        // Gặp 403 hoặc 404 trên phiên cũ (đổi tài khoản, token hết hạn, phiên cũ không khớp):
        // tự xóa phiên lưu cũ dcor_chat_guest và khởi tạo lại phiên mới thay vì hiện lỗi
        this.clearGuestSession();
        this.currentConversation.set(null);
        return null;
      }
      this.handleHttpError(err);
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
        // Tải thêm trang cũ hơn: chèn vào đầu danh sách, loại bỏ trùng
        this.messages.update((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const filteredIncoming = incomingList.filter((m) => !prevIds.has(m.id));
          return [...filteredIncoming, ...prev];
        });
      } else {
        // Tải lần đầu
        this.messages.set(incomingList);
      }

      return incomingList;
    } catch (err: any) {
      if (err instanceof HttpErrorResponse && (err.status === 403 || err.status === 404)) {
        // Gặp 403 hoặc 404 khi tải tin: tự xóa phiên lưu cũ
        this.clearGuestSession();
        this.currentConversation.set(null);
        this.hasMoreHistory.set(false);
        return [];
      }
      this.handleHttpError(err);
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
    } catch {
      // Giữ tin nhắn hiện tại nếu đồng bộ nền thất bại
    }
  }

  /**
   * Nén ảnh phía client xuống tối đa 800KB bằng Canvas
   */
  public async compressImage(file: File, maxSizeBytes: number = 800 * 1024): Promise<File> {
    if (file.size <= maxSizeBytes) {
      return file;
    }

    return new Promise((resolve, reject) => {
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

          // Thử nén dần theo chất lượng
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
    } catch (err) {
      this.handleHttpError(err);
      throw err;
    }
  }

  /**
   * Kết thúc cuộc trò chuyện (Xóa phiên khách vãng lai)
   */
  public endConversation(): void {
    this.clearGuestSession();
    this.currentConversation.set(null);
    this.messages.set([]);
    this.unreadCount.set(0);
    this.typingIndicator.set(null);
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Xử lý lỗi HTTP và trả thông báo tiếng Việt
   */
  public formatErrorMessage(err: any): string {
    if (!err) return 'Đã có lỗi xảy ra.';
    if (err.status === 0) {
      return 'Mất kết nối với máy chủ. Vui lòng kiểm tra đường truyền.';
    }
    if (err.status === 401) {
      return 'Phiên xác thực đã hết hạn. Vui lòng thử lại.';
    }
    if (err.status === 403) {
      return 'Không thể truy cập cuộc trò chuyện. Đang làm mới phiên kết nối...';
    }
    if (err.status === 404) {
      return 'Không tìm thấy cuộc trò chuyện.';
    }
    if (err.status === 429) {
      return 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi trong giây lát.';
    }
    if (typeof err.status === 'number' && err.status >= 500) {
      return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
    }
    if (err.error?.message) {
      return err.error.message;
    }
    return err.message || 'Đã có lỗi xảy ra.';
  }

  private handleHttpError(err: any): void {
    const msg = this.formatErrorMessage(err);
    this.setError(msg);
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

