import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

import {
  ChatConversation,
  ConversationDetailResponse,
  ChatMessage,
} from './models/chat-admin.model';
import { ChatAdminService } from './services/chat-admin.service';
import { ChatUnreadService } from './services/chat-unread.service';

export type ChatTabFilter = 'all' | 'unanswered' | 'waiting';

export interface GroupedChatMessage {
  message: ChatMessage;
  showSenderHeader: boolean;
  isLastCustomerSeen: boolean;
  showDateSeparator: boolean;
  dateSeparatorLabel: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  public adminAuth = inject(AdminAuthService);
  public chatAdminService = inject(ChatAdminService);
  public chatUnreadService = inject(ChatUnreadService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('composerTextarea') private composerTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  // Phân quyền
  public hasPermission = computed(() => {
    return this.adminAuth.hasPermission('chat', 'view');
  });

  // Realtime Socket
  private socket: Socket | null = null;
  public isConnected = signal<boolean>(true);

  // Bộ lọc danh sách (4 tab: all, unread, waiting, mine)
  public activeFilter = signal<ChatTabFilter>('all');
  public searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // Danh sách hội thoại
  public conversations = signal<ChatConversation[]>([]);
  public totalConversations = signal<number>(0);
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(25);
  public totalPages = signal<number>(1);
  public isLoadingList = signal<boolean>(false);

  // Sắp xếp: Cần NV lên đầu (mode = WAITING_STAFF hoặc needsHuman), rồi theo tin mới nhất
  public sortedConversations = computed(() => {
    const list = [...this.conversations()];
    return list.sort((a, b) => {
      // 1. Cần NV lên đầu
      const aNeeds = a.needsHuman || a.mode === 'WAITING_STAFF' ? 1 : 0;
      const bNeeds = b.needsHuman || b.mode === 'WAITING_STAFF' ? 1 : 0;
      if (aNeeds !== bNeeds) return bNeeds - aNeeds;

      // 2. Thời gian tin nhắn cuối cùng mới nhất
      const aTime = new Date(a.lastMessageAt).getTime() || 0;
      const bTime = new Date(b.lastMessageAt).getTime() || 0;
      return bTime - aTime;
    });
  });

  // Counts từ backend
  public serverCounts = signal<{ all: number; waiting: number; unanswered: number }>({
    all: 0,
    waiting: 0,
    unanswered: 0,
  });

  // Đếm theo từng tab: ưu tiên số đếm toàn cục từ server
  public tabCounts = computed(() => {
    return this.serverCounts();
  });

  // Hội thoại đang chọn
  public selectedConversationId = signal<string | null>(null);
  public conversationDetail = signal<ConversationDetailResponse | null>(null);
  public isLoadingDetail = signal<boolean>(false);

  // Tin nhắn
  public messages = signal<ChatMessage[]>([]);
  public isLoadingMessages = signal<boolean>(false);
  public isLoadingMoreMessages = signal<boolean>(false);
  public hasMoreMessages = signal<boolean>(false);

  // Messenger logic: Nhóm tin liên tiếp cùng người gửi & vạch ngày & đánh dấu 'Đã xem'
  public groupedMessages = computed<GroupedChatMessage[]>(() => {
    const msgs = this.messages();
    const result: GroupedChatMessage[] = [];

    // Tìm tin nhắn cuối cùng do STAFF gửi mà khách đã xem (conv.unreadCustomer === 0 hoặc readAt có giá trị)
    const conv = this.conversationDetail()?.conversation;
    const isCustomerSeen = conv ? conv.unreadCustomer === 0 : false;
    let lastStaffMsgIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].senderType === 'STAFF' && !msgs[i].pending) {
        lastStaffMsgIndex = i;
        break;
      }
    }

    for (let i = 0; i < msgs.length; i++) {
      const current = msgs[i];
      const prev = i > 0 ? msgs[i - 1] : null;

      // Kiểm tra vạch ngày
      const currentDateKey = this.getDateKey(current.createdAt);
      const prevDateKey = prev ? this.getDateKey(prev.createdAt) : null;
      const showDateSeparator = i === 0 || currentDateKey !== prevDateKey;
      const dateSeparatorLabel = showDateSeparator ? this.formatDateSeparator(current.createdAt) : '';

      // Hiện sender header nếu là tin đầu tiên hoặc khác sender với tin trước
      const showSenderHeader = !prev || prev.senderType !== current.senderType;
      const isLastCustomerSeen = i === lastStaffMsgIndex && isCustomerSeen;

      result.push({
        message: current,
        showSenderHeader,
        isLastCustomerSeen,
        showDateSeparator,
        dateSeparatorLabel,
      });
    }

    return result;
  });

  // Chỉ báo khách đang nhập
  public isCustomerTyping = signal<boolean>(false);
  private customerTypingTimeout: any = null;

  // Cuộn tin nhắn & nút 'Tin mới' khi đang đọc phía trên
  public showNewMessageFloatingBtn = signal<boolean>(false);
  private isUserNearBottom = true;

  // Khung soạn tin
  public composerText = signal<string>('');
  public selectedImageFile = signal<File | null>(null);
  public selectedImagePreview = signal<string | null>(null);
  public isUploadingImage = signal<boolean>(false);
  public isSendingMessage = signal<boolean>(false);

  // Drawer thông tin khách hàng trượt từ phải
  public isCustomerDrawerOpen = signal<boolean>(false);
  public noteInput = signal<string>('');
  public isSavingNote = signal<boolean>(false);
  public noteSavedSuccess = signal<boolean>(false);

  // Lightbox
  public lightboxImageUrl = signal<string | null>(null);

  // Mobile mode
  public isMobileChatActive = signal<boolean>(false);

  // Phụ trách & quyền hành động - MỘT NGUỒN SỰ THẬT DUY NHẤT TÍNH TỪ DỮ LIỆU HỘI THOẠI, KHÔNG PHỤ THUỘC STATUS
  public currentStaffId = computed(() => {
    const u = this.adminAuth.currentUser;
    return u?.id ? String(u.id) : null;
  });

  public isCurrentStaffAssigned = computed(() => {
    const conv = this.conversationDetail()?.conversation;
    const staffId = this.currentStaffId();
    return Boolean(
      conv &&
      conv.mode === 'STAFF' &&
      conv.assignedStaffId &&
      staffId &&
      conv.assignedStaffId === staffId
    );
  });

  public isAssignedToOtherStaff = computed(() => {
    const conv = this.conversationDetail()?.conversation;
    const staffId = this.currentStaffId();
    return Boolean(
      conv &&
      conv.mode === 'STAFF' &&
      conv.assignedStaffId &&
      conv.assignedStaffId !== staffId
    );
  });

  public canClaimCurrent = computed(() => {
    const conv = this.conversationDetail()?.conversation;
    if (!conv) return false;
    return conv.mode === 'BOT' || conv.mode === 'WAITING_STAFF';
  });

  // canReply = mode là STAFF và assignedStaffId là nhân viên đang đăng nhập
  public canReply = computed(() => {
    return this.isCurrentStaffAssigned();
  });

  public isComposerDisabled = computed(() => {
    return !this.canReply();
  });

  public composerPlaceholder = computed(() => {
    const conv = this.conversationDetail()?.conversation;
    if (!conv) return 'Chọn hội thoại để trả lời...';
    if (this.canReply()) {
      return 'Nhập nội dung tư vấn... (Enter gửi, Shift+Enter xuống dòng)';
    }
    if (this.isAssignedToOtherStaff()) {
      const otherName = conv.assignedStaffName || 'nhân viên khác';
      return `Đang do ${otherName} phụ trách`;
    }
    return 'Nhấn Nhận hội thoại để trả lời khách';
  });

  constructor() {
    // Cập nhật số chưa đọc trên tiêu đề tab trình duyệt
    effect(() => {
      const count = this.chatUnreadService.totalUnread();
      if (typeof document !== 'undefined') {
        if (count > 0) {
          document.title = `(${count}) Quản lý Chatbox - DCor Admin`;
        } else {
          document.title = 'Quản lý Chatbox - DCor Admin';
        }
      }
    });
  }

  ngOnInit(): void {
    // 1. Khởi tạo tìm kiếm debounce
    this.searchSub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.currentPage.set(1);
        this.loadConversations();
      });

    // 2. Tải danh sách
    this.loadConversations();

    // 3. Khởi tạo socket realtime
    this.initSocket();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.disconnectSocket();
    if (this.customerTypingTimeout) clearTimeout(this.customerTypingTimeout);
  }

  @HostListener('window:keydown', ['$event'])
  handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.lightboxImageUrl()) {
        this.closeLightbox();
        return;
      }
      if (this.isCustomerDrawerOpen()) {
        this.closeCustomerDrawer();
      }
    }
  }

  // =========================================================================
  // API LOADERS
  // =========================================================================

  public loadConversations(page: number = this.currentPage()): void {
    this.isLoadingList.set(true);
    this.chatAdminService
      .getConversations(this.activeFilter(), this.searchQuery(), page, this.pageSize())
      .subscribe({
        next: (res) => {
          this.conversations.set(res.conversations || []);
          this.totalConversations.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.totalPages.set(res.totalPages || 1);
          if (res.counts) {
            this.serverCounts.set(res.counts);
          }
          this.isLoadingList.set(false);

          // Tự chọn hội thoại đầu tiên trên desktop nếu chưa chọn
          if (!this.selectedConversationId() && res.conversations?.length > 0) {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              this.selectConversation(res.conversations[0].id);
            }
          }
        },
        error: () => {
          this.isLoadingList.set(false);
        },
      });
  }

  public setFilter(filter: ChatTabFilter): void {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.loadConversations();
  }

  public onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value || '';
    this.searchSubject.next(val);
  }

  public clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  public selectConversation(id: string): void {
    if (this.selectedConversationId() === id && this.conversationDetail()) {
      this.isMobileChatActive.set(true);
      return;
    }

    this.selectedConversationId.set(id);
    this.isMobileChatActive.set(true);
    this.isLoadingDetail.set(true);
    this.isLoadingMessages.set(true);
    this.messages.set([]);
    this.noteSavedSuccess.set(false);
    this.isCustomerTyping.set(false);
    this.showNewMessageFloatingBtn.set(false);

    // 1. Chi tiết hội thoại
    this.chatAdminService.getConversationDetail(id).subscribe({
      next: (detail) => {
        this.conversationDetail.set(detail);
        this.noteInput.set(detail.conversation.internalNote || '');
        this.isLoadingDetail.set(false);
      },
      error: () => {
        this.isLoadingDetail.set(false);
      },
    });

    // 2. Danh sách tin nhắn
    this.chatAdminService.getMessages(id, undefined, 30).subscribe({
      next: (res) => {
        this.messages.set(res.messages || []);
        this.hasMoreMessages.set(res.hasMore || false);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();

        // Đánh dấu đã đọc qua socket
        this.emitStaffRead(id);

        // Cập nhật unread tại chỗ
        this.conversations.update((list) =>
          list.map((c) => (c.id === id ? { ...c, unreadStaff: 0 } : c))
        );
      },
      error: () => {
        this.isLoadingMessages.set(false);
      },
    });
  }

  // Cuộn tải tin cũ
  public onMessagesScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const threshold = 60;
    this.isUserNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    if (this.isUserNearBottom) {
      this.showNewMessageFloatingBtn.set(false);
    }

    if (el.scrollTop === 0 && this.hasMoreMessages() && !this.isLoadingMoreMessages()) {
      this.loadOlderMessages();
    }
  }

  public loadOlderMessages(): void {
    const convId = this.selectedConversationId();
    const currentMessages = this.messages();
    if (!convId || currentMessages.length === 0) return;

    const oldest = currentMessages[0];
    const beforeDate =
      typeof oldest.createdAt === 'string'
        ? oldest.createdAt
        : oldest.createdAt.toISOString();

    const container = this.messagesContainer?.nativeElement;
    const previousHeight = container?.scrollHeight || 0;

    this.isLoadingMoreMessages.set(true);
    this.chatAdminService.getMessages(convId, beforeDate, 30).subscribe({
      next: (res) => {
        this.messages.update((list) => [...(res.messages || []), ...list]);
        this.hasMoreMessages.set(res.hasMore || false);
        this.isLoadingMoreMessages.set(false);

        // Duy trì vị trí scroll sau khi prepending messages mà không nhảy vị trí cuộn
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - previousHeight;
          }
        }, 10);
      },
      error: () => {
        this.isLoadingMoreMessages.set(false);
      },
    });
  }

  // =========================================================================
  // ACTIONS: NHẬN HỘI THOẠI & KẾT THÚC CA TƯ VẤN
  // =========================================================================

  public claimCurrentConversation(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;

    this.chatAdminService.claimConversation(convId).subscribe({
      next: (res) => {
        this.conversationDetail.update((d) =>
          d ? { ...d, conversation: res.conversation } : null
        );
        this.loadConversations();
      },
      error: (err) => {
        alert(err?.error?.message || 'Không thể tiếp nhận cuộc trò chuyện.');
      },
    });
  }

  public closeConsultation(): void {
    const conv = this.conversationDetail()?.conversation;
    if (!conv) return;

    if (!confirm('Bạn có chắc muốn kết thúc ca tư vấn này và trả về cho trợ lý AI?')) {
      return;
    }

    // Gửi staff:close qua socket để kích hoạt chuẩn hệ thống (không khóa chat của khách)
    if (this.socket && this.socket.connected) {
      this.socket.emit('staff:close', { conversationId: conv.id }, (res: any) => {
        if (res?.conversation) {
          this.conversationDetail.update((d) =>
            d ? { ...d, conversation: res.conversation } : null
          );
        }
        this.loadConversations();
      });
    } else {
      this.chatAdminService.closeConversation(conv.id).subscribe({
        next: (res) => {
          this.conversationDetail.update((d) =>
            d ? { ...d, conversation: res.conversation } : null
          );
          this.loadConversations();
        },
        error: (err) => alert(err?.error?.message || 'Không thể đóng ca tư vấn.'),
      });
    }
  }

  // =========================================================================
  // COMPOSER & GỬI TIN NHẮN
  // =========================================================================

  public onComposerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else {
      this.emitStaffTyping(true);
    }
  }

  public onComposerInput(): void {
    const textarea = this.composerTextarea?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      // Tối đa 4 dòng ~ 96px
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
    }
    this.emitStaffTyping(this.composerText().trim().length > 0);
  }

  public onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (JPEG, PNG, WebP).');
      target.value = '';
      return;
    }

    this.selectedImageFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    target.value = '';
  }

  public removeSelectedImage(): void {
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  public async sendMessage(): Promise<void> {
    const convId = this.selectedConversationId();
    const content = this.composerText().trim();
    const imageFile = this.selectedImageFile();

    if (!convId || (!content && !imageFile)) return;
    if (content.length > 1000) {
      alert('Tin nhắn không được vượt quá 1000 ký tự.');
      return;
    }

    this.isSendingMessage.set(true);
    this.emitStaffTyping(false);

    let imageUrl: string | undefined = undefined;

    // 1. Tải ảnh nếu có
    if (imageFile) {
      this.isUploadingImage.set(true);
      try {
        const uploadRes = await new Promise<{ url: string }>((resolve, reject) => {
          this.chatAdminService.compressAndUploadImage(imageFile).subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err),
          });
        });
        imageUrl = uploadRes.url;
      } catch (err: any) {
        this.isUploadingImage.set(false);
        this.isSendingMessage.set(false);
        alert('Không thể tải ảnh: ' + (err?.error?.message || 'Lỗi mạng hoặc tải file.'));
        return;
      }
      this.isUploadingImage.set(false);
    }

    // 2. Gửi lạc quan (Optimistic update)
    const clientMessageId = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currentStaff = this.adminAuth.currentUser;
    const staffName = currentStaff?.fullName || 'Chuyên viên tư vấn';

    const optimisticMsg: ChatMessage = {
      id: clientMessageId,
      conversationId: convId,
      senderType: 'STAFF',
      senderId: currentStaff ? String(currentStaff.id) : null,
      senderName: staffName,
      content,
      imageUrl: imageUrl || null,
      createdAt: new Date(),
      clientMessageId,
      pending: true,
    };

    this.messages.update((list) => [...list, optimisticMsg]);
    this.scrollToBottom();

    // 3. Reset ô soạn
    this.composerText.set('');
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
    if (this.composerTextarea?.nativeElement) {
      this.composerTextarea.nativeElement.style.height = 'auto';
    }

    // 4. Bắn socket staff:send
    if (this.socket && this.socket.connected) {
      this.socket.emit('staff:send', {
        conversationId: convId,
        content,
        imageUrl,
        clientMessageId,
      });
    }

    this.isSendingMessage.set(false);

    // Cập nhật mode nếu chưa phải STAFF
    const detail = this.conversationDetail();
    if (detail && detail.conversation.mode !== 'STAFF') {
      this.conversationDetail.update((d) =>
        d
          ? {
              ...d,
              conversation: {
                ...d.conversation,
                mode: 'STAFF',
                assignedStaffId: currentStaff ? String(currentStaff.id) : null,
                assignedStaffName: staffName,
              },
            }
          : null
      );
    }
  }

  // =========================================================================
  // DRAWER & GHI CHÚ NỘI BỘ
  // =========================================================================

  public openCustomerDrawer(): void {
    this.isCustomerDrawerOpen.set(true);
  }

  public closeCustomerDrawer(): void {
    this.isCustomerDrawerOpen.set(false);
  }

  public saveInternalNote(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;

    this.isSavingNote.set(true);
    this.noteSavedSuccess.set(false);

    this.chatAdminService.updateInternalNote(convId, this.noteInput()).subscribe({
      next: (res) => {
        this.isSavingNote.set(false);
        this.noteSavedSuccess.set(true);
        this.conversationDetail.update((d) =>
          d
            ? {
                ...d,
                conversation: { ...d.conversation, internalNote: res.internalNote },
              }
            : null
        );
        setTimeout(() => this.noteSavedSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isSavingNote.set(false);
        alert(err?.error?.message || 'Không thể lưu ghi chú.');
      },
    });
  }

  public getValidPhone(): string {
    const conv = this.conversationDetail()?.conversation;
    const cust = this.conversationDetail()?.customer;
    // Khách vãng lai không hiển thị SĐT
    if (!cust && (!conv?.customerType || conv.customerType === 'GUEST')) {
      return '';
    }
    const phone = cust?.phone || conv?.guestPhone || '';
    if (!phone || phone.startsWith('GOOG_')) return '';
    return phone;
  }

  // =========================================================================
  // SOCKET REALTIME LISTENERS
  // =========================================================================

  private initSocket(): void {
    if (typeof window === 'undefined') return;

    const token =
      sessionStorage.getItem('dcor_admin_token') ||
      localStorage.getItem('dcor_admin_token');

    if (!token) return;

    const socketUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        this.isConnected.set(true);
        if (this.selectedConversationId()) {
          this.emitStaffRead(this.selectedConversationId()!);
        }
      });

      this.socket.on('disconnect', () => {
        this.isConnected.set(false);
      });

      this.socket.on('staff:unread', (data: { total: number }) => {
        const count = typeof data?.total === 'number' ? data.total : 0;
        this.chatUnreadService.setUnread(count);
      });

      this.socket.on('staff:conversation:update', (payload: any) => {
        if (!payload || !payload.id) return;
        this.conversations.update((list) => {
          const idx = list.findIndex((c) => c.id === payload.id);
          if (idx >= 0) {
            const updated = { ...list[idx], ...payload };
            const nextList = [...list];
            nextList[idx] = updated;
            return nextList;
          }
          return [payload, ...list];
        });

        if (payload.id === this.selectedConversationId()) {
          this.emitStaffRead(payload.id);
        }
      });

      this.socket.on('chat:message', (msg: ChatMessage) => {
        if (!msg || !msg.conversationId) return;

        if (msg.conversationId === this.selectedConversationId()) {
          this.messages.update((list) => {
            const exists = list.some(
              (m) =>
                m.id === msg.id ||
                (m.clientMessageId && msg.clientMessageId && m.clientMessageId === msg.clientMessageId)
            );
            if (!exists) return [...list, msg];
            return list.map((m) =>
              m.clientMessageId === msg.clientMessageId ? { ...msg, pending: false } : m
            );
          });

          if (this.isUserNearBottom) {
            this.scrollToBottom();
          } else {
            this.showNewMessageFloatingBtn.set(true);
          }

          this.emitStaffRead(msg.conversationId);
        }
      });

      // Lắng nghe sự kiện khách đã làm mới cuộc trò chuyện
      this.socket.on('chat:session_reset', (data: { conversationId: string; clearedAt: string; message: any }) => {
        if (data?.conversationId === this.selectedConversationId() && data?.message) {
          this.messages.update((list) => [...list, data.message]);
          this.scrollToBottom();
        }
      });

      // Lắng nghe khách đã xem (chat:read)
      this.socket.on('chat:read', (data: { conversationId: string; readerType: string }) => {
        if (data?.conversationId === this.selectedConversationId() && data?.readerType === 'CUSTOMER') {
          this.conversationDetail.update((d) =>
            d
              ? {
                  ...d,
                  conversation: { ...d.conversation, unreadCustomer: 0 },
                }
              : null
          );
        }
      });

      // Chỉ báo khách đang nhập
      this.socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean; senderType?: string }) => {
        if (data?.conversationId === this.selectedConversationId() && data?.senderType === 'CUSTOMER') {
          this.isCustomerTyping.set(!!data.isTyping);
          if (this.customerTypingTimeout) clearTimeout(this.customerTypingTimeout);
          if (data.isTyping) {
            this.customerTypingTimeout = setTimeout(() => {
              this.isCustomerTyping.set(false);
            }, 4000);
          }
        }
      });
    } catch {
      this.isConnected.set(false);
    }
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private emitStaffRead(conversationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('staff:read', { conversationId });
    }
  }

  private emitStaffTyping(isTyping: boolean): void {
    const convId = this.selectedConversationId();
    if (convId && this.socket && this.socket.connected) {
      this.socket.emit('staff:typing', { conversationId: convId, isTyping });
    }
  }

  // =========================================================================
  // SCROLL & UI HELPERS
  // =========================================================================

  public scrollToBottom(): void {
    setTimeout(() => {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 30);
  }

  public scrollToBottomSmooth(): void {
    const container = this.messagesContainer?.nativeElement;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      this.showNewMessageFloatingBtn.set(false);
    }
  }

  public backToConversationsList(): void {
    this.isMobileChatActive.set(false);
  }

  public openLightbox(imageUrl: string): void {
    this.lightboxImageUrl.set(imageUrl);
  }

  public closeLightbox(): void {
    this.lightboxImageUrl.set(null);
  }

  // Chip trạng thái danh sách: tính từ MỘT NGUỒN SỰ THẬT DUY NHẤT (không phụ thuộc status)
  public getConversationChip(conv: ChatConversation): { label: string; class: string } | null {
    if (conv.mode === 'STAFF') {
      const name = conv.assignedStaffName ? ` · ${conv.assignedStaffName}` : '';
      return { label: `Đang tư vấn${name}`, class: 'staff' };
    }
    if (conv.mode === 'WAITING_STAFF' || conv.needsHuman) {
      return { label: 'Chờ nhân viên', class: 'waiting' };
    }
    return null;
  }

  // Header loại khách
  public getCustomerTypeLabel(conv: ChatConversation): string {
    if (conv.customerType === 'MEMBER' || conv.customerId) {
      return 'Thành viên';
    }
    return 'Khách vãng lai';
  }

  public getAvatarColor(name: string): string {
    const colors = ['#765337', '#934B22', '#695138', '#5E4934', '#3E2F23', '#8B5E3C'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  public getInitials(name: string): string {
    if (!name) return 'K';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  public formatRelativeTime(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  public formatMessageTime(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private getDateKey(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  public formatDateSeparator(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return 'Hôm nay';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return 'Hôm qua';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  public isSessionResetMessage(msg: ChatMessage): boolean {
    return msg.meta && msg.meta.type === 'SESSION_RESET';
  }

  public formatCurrency(amount: string | number | undefined): string {
    if (amount === undefined || amount === null) return '0 đ';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }

  public getOrderStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang chuẩn bị',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã hủy',
      RETURN_REQUESTED: 'Y/c đổi trả',
      RETURNED: 'Đã đổi trả',
    };
    return map[status] || status;
  }
}
