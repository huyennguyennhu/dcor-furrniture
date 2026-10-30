import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatUnreadService {
  private destroyRef = inject(DestroyRef, { optional: true });
  private socket: Socket | null = null;

  public readonly totalUnread = signal<number>(0);

  public readonly badgeText = computed(() => {
    const count = this.totalUnread();
    if (count <= 0) return '';
    return count > 99 ? '99+' : count.toString();
  });

  constructor() {
    this.initSocketConnection();

    if (this.destroyRef) {
      this.destroyRef.onDestroy(() => {
        this.disconnect();
      });
    }
  }

  public getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      sessionStorage.getItem('dcor_admin_token') ||
      localStorage.getItem('dcor_admin_token')
    );
  }

  public initSocketConnection(): void {
    if (typeof window === 'undefined') return;
    if (this.socket && this.socket.connected) return;

    const token = this.getAdminToken();
    if (!token) return;

    const socketUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
      });

      this.socket.on('staff:unread', (data: { total: number }) => {
        const total = typeof data?.total === 'number' ? data.total : 0;
        this.totalUnread.set(total);
      });

      this.socket.on('connect', () => {
        // Socket kết nối thành công, server sẽ gửi staff:unread ngay
      });
    } catch {
      // Bỏ qua lỗi kết nối
    }
  }

  public setUnread(count: number): void {
    this.totalUnread.set(Math.max(0, count));
  }

  public decrement(amount: number = 1): void {
    this.totalUnread.update((prev) => Math.max(0, prev - amount));
  }

  public getSocket(): Socket | null {
    if (!this.socket || !this.socket.connected) {
      this.initSocketConnection();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

