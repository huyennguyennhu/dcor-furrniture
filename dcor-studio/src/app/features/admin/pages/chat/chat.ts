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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { Modal } from '../../../../shared/components/modal/modal';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

import {
  ChatConversation,
  ConversationDetailResponse,
  ChatMessage,
  StaffUser,
  BotScript,
  BotActionType,
  QuickReplyOption,
  ScriptTestResult,
  WorkingHoursSetting,
} from './models/chat-admin.model';
import { ChatAdminService } from './services/chat-admin.service';
import { ChatUnreadService } from './services/chat-unread.service';
import { ChatAudioService } from './services/chat-audio.service';

type ChatTabFilter = 'all' | 'unread' | 'unanswered' | 'mine' | 'waiting' | 'closed';
type ActiveView = 'conversations' | 'scripts' | 'settings';

const DAYS_OF_WEEK: { day: number; label: string }[] = [
  { day: 1, label: 'Thứ 2' },
  { day: 2, label: 'Thứ 3' },
  { day: 3, label: 'Thứ 4' },
  { day: 4, label: 'Thứ 5' },
  { day: 5, label: 'Thứ 6' },
  { day: 6, label: 'Thứ 7' },
  { day: 0, label: 'Chủ nhật' },
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, Modal],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  public adminAuth = inject(AdminAuthService);
  public chatAdminService = inject(ChatAdminService);
  public chatUnreadService = inject(ChatUnreadService);
  public audioService = inject(ChatAudioService);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('composerTextarea') private composerTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  // 1. Chế độ xem trang chính
  public currentView = signal<ActiveView>('conversations');

  // Phân quyền
  public hasPermission = computed(() => {
    return this.adminAuth.hasPermission('chat', 'view');
  });

  // 2. Realtime Socket State
  private socket: Socket | null = null;
  public isConnected = signal<boolean>(true);
  public isReconnecting = signal<boolean>(false);
  public connectionBannerDismissed = signal<boolean>(false);

  // 3. Tab HỘI THOẠI (Conversations)
  public activeFilter = signal<ChatTabFilter>('all');
  public searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  public conversations = signal<ChatConversation[]>([]);
  public totalConversations = signal<number>(0);
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(25);
  public totalPages = signal<number>(1);
  public isLoadingList = signal<boolean>(false);

  // Filter Counts
  public filterCounts = signal<Record<ChatTabFilter, number>>({
    all: 0,
    unread: 0,
    unanswered: 0,
    mine: 0,
    waiting: 0,
    closed: 0,
  });

  // Hội thoại đang chọn
  public selectedConversationId = signal<string | null>(null);
  public conversationDetail = signal<ConversationDetailResponse | null>(null);
  public isLoadingDetail = signal<boolean>(false);

  // Tin nhắn trong hội thoại
  public messages = signal<ChatMessage[]>([]);
  public isLoadingMessages = signal<boolean>(false);
  public isLoadingMoreMessages = signal<boolean>(false);
  public hasMoreMessages = signal<boolean>(false);

  // Khách đang nhập
  public isCustomerTyping = signal<boolean>(false);
  private customerTypingTimeout: any = null;

  // Ô soạn thảo
  public composerText = signal<string>('');
  public selectedImageFile = signal<File | null>(null);
  public selectedImagePreview = signal<string | null>(null);
  public isUploadingImage = signal<boolean>(false);
  public isSendingMessage = signal<boolean>(false);

  // Ghi chú nội bộ
  public noteInput = signal<string>('');
  public isSavingNote = signal<boolean>(false);
  public noteSavedSuccess = signal<boolean>(false);

  // Nhân sự phục vụ tiếp nhận & chuyển giao
  public staffList = signal<StaffUser[]>([]);
  public showTransferModal = signal<boolean>(false);
  public selectedTransferStaffId = signal<string>('');
  public isTransferring = signal<boolean>(false);

  // Lightbox xem ảnh
  public lightboxImageUrl = signal<string | null>(null);

  // Responsive Drawer & Mobile View
  public isMobileChatActive = signal<boolean>(false);
  public isCustomerDrawerOpen = signal<boolean>(false);

  // 4. Tab KỊCH BẢN BOT (Bot Scripts)
  public scripts = signal<BotScript[]>([]);
  public isLoadingScripts = signal<boolean>(false);
  public scriptSearch = signal<string>('');

  public filteredScripts = computed(() => {
    const q = this.scriptSearch().trim().toLowerCase();
    const list = this.scripts();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.intent.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.patterns.some((p) => p.toLowerCase().includes(q))
    );
  });

  // Modal tạo/sửa kịch bản
  public isScriptModalOpen = signal<boolean>(false);
  public editingScriptId = signal<string | null>(null);
  public scriptIntent = signal<string>('');
  public scriptName = signal<string>('');
  public scriptPatterns = signal<string[]>([]);
  public patternChipInput = signal<string>('');
  public scriptAnswer = signal<string>('');
  public scriptQuickReplies = signal<QuickReplyOption[]>([]);
  public scriptActionType = signal<BotActionType>('NONE');
  public scriptPriority = signal<number>(0);
  public scriptIsActive = signal<boolean>(true);
  public scriptFormError = signal<string | null>(null);
  public isSavingScript = signal<boolean>(false);

  // Cảnh báo trùng câu mẫu giữa các kịch bản
  public duplicatePatternWarning = computed(() => {
    const currentPatterns = this.scriptPatterns().map((p) => p.trim().toLowerCase());
    const editId = this.editingScriptId();
    const otherScripts = this.scripts().filter((s) => s.id !== editId);

    const duplicates: { pattern: string; scriptName: string }[] = [];
    for (const p of currentPatterns) {
      if (!p) continue;
      for (const s of otherScripts) {
        if (s.patterns.some((sp) => sp.trim().toLowerCase() === p)) {
          duplicates.push({ pattern: p, scriptName: s.name });
        }
      }
    }
    return duplicates;
  });

  // Xem trước câu trả lời đã thay biến động
  public answerPreview = computed(() => {
    const raw = this.scriptAnswer();
    return this.replaceTemplateVariables(raw);
  });

  // Xóa kịch bản
  public isDeleteScriptModalOpen = signal<boolean>(false);
  public scriptToDelete = signal<BotScript | null>(null);
  public isDeletingScript = signal<boolean>(false);

  // Thử kịch bản (Test script)
  public testText = signal<string>('');
  public isTestingScript = signal<boolean>(false);
  public testResult = signal<ScriptTestResult | null>(null);
  public testError = signal<string | null>(null);

  // 5. Tab CÀI ĐẶT (Settings)
  public daysOfWeek = DAYS_OF_WEEK;
  public settingsWorkingHours = signal<WorkingHoursSetting>({
    start: '08:00',
    end: '22:00',
    days: [0, 1, 2, 3, 4, 5, 6],
  });
  public settingsGreeting = signal<string>('');
  public settingsOfflineMessage = signal<string>('');
  public settingsHandoffMessage = signal<string>('');
  public settingsFallbackMessages = signal<string[]>([]);
  public newFallbackInput = signal<string>('');
  public settingsHotline = signal<string>('1900 1234');
  public settingsAddress = signal<string>('669 QL1A, TP. Hồ Chí Minh');

  public isSavingSettings = signal<boolean>(false);
  public settingsFeedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quản lý tiêu đề trang
  private originalDocumentTitle = '';
  private pollIntervalTimer: any = null;

  constructor() {
    // Tự động cập nhật tiêu đề tab trình duyệt theo unread
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
    if (typeof document !== 'undefined') {
      this.originalDocumentTitle = document.title;
    }

    // Debounce tìm kiếm hội thoại 300ms
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => {
        this.searchQuery.set(q);
        this.currentPage.set(1);
        this.loadConversations();
      });

    // Nạp dữ liệu ban đầu
    this.initSocket();
    this.loadConversations();
    this.loadFilterCounts();
    this.loadStaffList();
    this.loadSettings();
    this.loadScripts();

    // Polling nhẹ dự phòng mỗi 5s để đồng bộ danh sách hội thoại
    // Polling backup da duoc tang tu 5s len 30s de giam Egress/DB vi he thong da co WebSocket socket.io realtime
    this.pollIntervalTimer = setInterval(() => {
      if (this.currentView() === 'conversations' && !this.isConnected()) {
        this.refreshActiveConversationSilently();
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined' && this.originalDocumentTitle) {
      document.title = this.originalDocumentTitle;
    }

    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }

    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }

    if (this.customerTypingTimeout) {
      clearTimeout(this.customerTypingTimeout);
    }

    this.disconnectSocket();
  }

  // =========================================================================
  // SOCKET.IO REALTIME
  // =========================================================================

  private initSocket(): void {
    if (typeof window === 'undefined') return;

    const token = this.chatUnreadService.getAdminToken();
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

      this.socket.on('connect', () => {
        this.isConnected.set(true);
        this.isReconnecting.set(false);
      });

      this.socket.on('disconnect', () => {
        this.isConnected.set(false);
        this.isReconnecting.set(true);
      });

      this.socket.on('connect_error', () => {
        this.isConnected.set(false);
        this.isReconnecting.set(true);
      });

      // Lắng nghe cập nhật unread toàn cục
      this.socket.on('staff:unread', (data: { total: number }) => {
        this.chatUnreadService.setUnread(data?.total || 0);
      });

      // Lắng nghe hội thoại mới được khởi tạo từ khách hàng
      this.socket.on('staff:conversation:new', (data: any) => {
        this.audioService.playChime();
        this.loadConversations();
        this.loadFilterCounts();
      });

      // Lắng nghe cập nhật hội thoại (có tin mới, chuyển trạng thái, v.v.)
      this.socket.on('staff:conversation:update', (payload: any) => {
        if (!payload || !payload.id) return;

        // Nếu có tin nhắn mới mà không phải hội thoại đang mở -> phát âm báo
        if (payload.id !== this.selectedConversationId() && payload.unreadStaff > 0) {
          this.audioService.playChime();
        }

        // Cập nhật dòng hội thoại trong danh sách
        this.conversations.update((list) => {
          const index = list.findIndex((c) => c.id === payload.id);
          if (index !== -1) {
            const updated = {
              ...list[index],
              mode: payload.mode,
              status: payload.status,
              assignedStaffId: payload.assignedStaffId,
              assignedStaffName: payload.assignedStaffName,
              needsHuman: payload.needsHuman,
              unreadStaff: payload.unreadStaff,
              unreadCustomer: payload.unreadCustomer,
              lastMessageAt: payload.lastMessageAt || new Date(),
              lastMessagePreview: payload.lastMessagePreview || list[index].lastMessagePreview,
            };
            const newList = [...list];
            newList.splice(index, 1);
            return [updated, ...newList];
          }
          return list;
        });

        // Nếu là hội thoại đang mở -> tải tin nhắn mới
        if (payload.id === this.selectedConversationId()) {
          this.fetchLatestMessagesForActiveConversation();
          // Đánh dấu đã đọc
          this.emitStaffRead(payload.id);
        }

        this.loadFilterCounts();
      });

      // Lắng nghe tin nhắn mới nếu socket tham gia room hội thoại
      this.socket.on('chat:message', (msg: ChatMessage) => {
        if (!msg || !msg.conversationId) return;

        if (msg.conversationId === this.selectedConversationId()) {
          this.messages.update((list) => {
            // Chống trùng bằng id hoặc clientMessageId
            const exists = list.some(
              (m) =>
                m.id === msg.id ||
                (m.clientMessageId && msg.clientMessageId && m.clientMessageId === msg.clientMessageId)
            );
            if (!exists) {
              return [...list, msg];
            }
            // Nếu đã tồn tại dưới dạng pending -> cập nhật
            return list.map((m) =>
              m.clientMessageId === msg.clientMessageId ? { ...msg, pending: false } : m
            );
          });
          this.scrollToBottom();
          this.emitStaffRead(msg.conversationId);
        } else {
          // Tin nhắn của hội thoại khác
          if (msg.senderType === 'CUSTOMER') {
            this.audioService.playChime();
          }
        }
      });

      // Lắng nghe trạng thái khách đang gõ
      this.socket.on(
        'chat:typing',
        (data: { conversationId: string; isTyping: boolean; senderType?: string }) => {
          if (data?.conversationId === this.selectedConversationId() && data?.senderType === 'CUSTOMER') {
            this.isCustomerTyping.set(!!data.isTyping);
            if (this.customerTypingTimeout) {
              clearTimeout(this.customerTypingTimeout);
            }
            if (data.isTyping) {
              this.customerTypingTimeout = setTimeout(() => {
                this.isCustomerTyping.set(false);
              }, 4000);
            }
          }
        }
      );
    } catch {
      this.isConnected.set(false);
    }
  }

  public retryConnection(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initSocket();
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
  // DANH SÁCH HỘI THOẠI (TAB CONVERSATIONS)
  // =========================================================================

  public onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value || '';
    this.searchSubject.next(val);
  }

  public setFilter(filter: ChatTabFilter): void {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.loadConversations();
  }

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
          this.isLoadingList.set(false);

          // Nếu chưa có hội thoại nào được chọn và có danh sách -> chọn hội thoại đầu tiên trên desktop
          if (!this.selectedConversationId() && res.conversations?.length > 0) {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) {
              this.selectConversation(res.conversations[0].id);
            }
          }
        },
        error: (err) => {
          this.isLoadingList.set(false);
        },
      });
  }

  public loadFilterCounts(): void {
    const filters: ChatTabFilter[] = ['all', 'unread', 'unanswered', 'mine', 'waiting', 'closed'];
    filters.forEach((f) => {
      this.chatAdminService.getConversations(f, '', 1, 1).subscribe({
        next: (res) => {
          this.filterCounts.update((counts) => ({
            ...counts,
            [f]: res.total || 0,
          }));
        },
        error: () => {},
      });
    });
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

    // 1. Tải chi tiết hội thoại
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

    // 2. Tải danh sách tin nhắn
    this.chatAdminService.getMessages(id, undefined, 30).subscribe({
      next: (res) => {
        this.messages.set(res.messages || []);
        this.hasMoreMessages.set(res.hasMore || false);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();

        // Đánh dấu đã đọc qua socket
        this.emitStaffRead(id);

        // Giảm unread trong danh sách tại chỗ
        this.conversations.update((list) =>
          list.map((c) => (c.id === id ? { ...c, unreadStaff: 0 } : c))
        );
      },
      error: () => {
        this.isLoadingMessages.set(false);
      },
    });
  }

  public backToConversationsList(): void {
    this.isMobileChatActive.set(false);
  }

  public toggleCustomerDrawer(): void {
    this.isCustomerDrawerOpen.update((v) => !v);
  }

  // Cuộn lên tải tin nhắn cũ
  public onMessagesScroll(event: Event): void {
    const el = event.target as HTMLElement;
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

    this.isLoadingMoreMessages.set(true);
    const container = this.messagesContainer?.nativeElement;
    const prevScrollHeight = container?.scrollHeight || 0;

    this.chatAdminService.getMessages(convId, beforeDate, 30).subscribe({
      next: (res) => {
        const older = res.messages || [];
        this.messages.update((list) => [...older, ...list]);
        this.hasMoreMessages.set(res.hasMore || false);
        this.isLoadingMoreMessages.set(false);

        // Duy trì vị trí cuộn sau khi tải tin cũ
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        }, 50);
      },
      error: () => {
        this.isLoadingMoreMessages.set(false);
      },
    });
  }

  private fetchLatestMessagesForActiveConversation(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;

    this.chatAdminService.getMessages(convId, undefined, 30).subscribe({
      next: (res) => {
        const fetched = res.messages || [];
        this.messages.update((existing) => {
          const map = new Map<string, ChatMessage>();
          existing.forEach((m) => {
            if (m.id) map.set(m.id, m);
            else if (m.clientMessageId) map.set(m.clientMessageId, m);
          });
          fetched.forEach((m) => {
            if (m.id) map.set(m.id, m);
          });
          const merged = Array.from(map.values());
          merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return merged;
        });
        this.scrollToBottom();
      },
    });
  }

  private refreshActiveConversationSilently(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;
    this.chatAdminService.getConversationDetail(convId).subscribe({
      next: (detail) => {
        this.conversationDetail.set(detail);
      },
    });
  }

  // =========================================================================
  // GỬI TIN NHẮN (COMPOSER)
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
        alert('Không thể tải ảnh lên: ' + (err?.error?.message || 'Lỗi mạng hoặc server.'));
        return;
      }
      this.isUploadingImage.set(false);
    }

    // 2. Chuẩn bị payload
    const clientMessageId = `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currentStaff = this.adminAuth.currentUser;
    const staffName = currentStaff?.fullName || 'Chuyên viên tư vấn';

    // 3. Optimistic update
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

    // 4. Reset composer
    this.composerText.set('');
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);

    // 5. Gửi qua socket
    if (this.socket && this.socket.connected) {
      this.socket.emit('staff:send', {
        conversationId: convId,
        content,
        imageUrl,
        clientMessageId,
      });
    }

    this.isSendingMessage.set(false);

    // Cập nhật chế độ hội thoại nếu chưa gán
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
                needsHuman: false,
              },
            }
          : null
      );
    }
  }

  // =========================================================================
  // THAO TÁC HỘI THOẠI (STATE MACHINE)
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
        this.loadFilterCounts();
      },
      error: (err) => {
        alert(err?.error?.message || 'Không thể tiếp nhận cuộc trò chuyện.');
      },
    });
  }

  public openTransferModal(): void {
    this.selectedTransferStaffId.set('');
    this.showTransferModal.set(true);
  }

  public closeTransferModal(): void {
    this.showTransferModal.set(false);
  }

  public confirmTransferConversation(): void {
    const convId = this.selectedConversationId();
    const staffId = this.selectedTransferStaffId();
    if (!convId || !staffId) return;

    this.isTransferring.set(true);
    this.chatAdminService.transferConversation(convId, staffId).subscribe({
      next: (res) => {
        this.isTransferring.set(false);
        this.showTransferModal.set(false);
        this.conversationDetail.update((d) =>
          d ? { ...d, conversation: res.conversation } : null
        );
        this.loadConversations();
        this.loadFilterCounts();
      },
      error: (err) => {
        this.isTransferring.set(false);
        alert(err?.error?.message || 'Không thể chuyển giao cuộc trò chuyện.');
      },
    });
  }

  public returnCurrentToBot(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;

    if (!confirm('Bạn có chắc muốn trả cuộc trò chuyện này về cho trợ lý ảo DCor xử lý tự động?')) {
      return;
    }

    this.chatAdminService.returnToBot(convId).subscribe({
      next: (res) => {
        this.conversationDetail.update((d) =>
          d ? { ...d, conversation: res.conversation } : null
        );
        this.loadConversations();
        this.loadFilterCounts();
      },
      error: (err) => {
        alert(err?.error?.message || 'Không thể chuyển về cho Bot.');
      },
    });
  }

  public toggleCloseConversation(): void {
    const conv = this.conversationDetail()?.conversation;
    if (!conv) return;

    if (conv.status === 'OPEN') {
      if (!confirm('Bạn có chắc muốn kết thúc cuộc trò chuyện này?')) return;
      this.chatAdminService.closeConversation(conv.id).subscribe({
        next: (res) => {
          this.conversationDetail.update((d) =>
            d ? { ...d, conversation: res.conversation } : null
          );
          this.loadConversations();
          this.loadFilterCounts();
        },
        error: (err) => alert(err?.error?.message || 'Không thể đóng cuộc trò chuyện.'),
      });
    } else {
      this.chatAdminService.reopenConversation(conv.id).subscribe({
        next: (res) => {
          this.conversationDetail.update((d) =>
            d ? { ...d, conversation: res.conversation } : null
          );
          this.loadConversations();
          this.loadFilterCounts();
        },
        error: (err) => alert(err?.error?.message || 'Không thể mở lại cuộc trò chuyện.'),
      });
    }
  }

  public saveInternalNote(): void {
    const convId = this.selectedConversationId();
    if (!convId) return;

    this.isSavingNote.set(true);
    this.noteSavedSuccess.set(false);

    this.chatAdminService.updateInternalNote(convId, this.noteInput()).subscribe({
      next: () => {
        this.isSavingNote.set(false);
        this.noteSavedSuccess.set(true);
        setTimeout(() => this.noteSavedSuccess.set(false), 3000);
      },
      error: (err) => {
        this.isSavingNote.set(false);
        alert(err?.error?.message || 'Không thể lưu ghi chú.');
      },
    });
  }

  private loadStaffList(): void {
    this.chatAdminService.getAvailableStaff().subscribe({
      next: (res) => {
        this.staffList.set(res.staff || []);
      },
    });
  }

  // =========================================================================
  // TAB KỊCH BẢN BOT (SCRIPTS)
  // =========================================================================

  public loadScripts(): void {
    this.isLoadingScripts.set(true);
    this.chatAdminService.getScripts().subscribe({
      next: (res) => {
        this.scripts.set(res.scripts || []);
        this.isLoadingScripts.set(false);
      },
      error: () => {
        this.isLoadingScripts.set(false);
      },
    });
  }

  public openCreateScriptModal(): void {
    this.editingScriptId.set(null);
    this.scriptIntent.set('');
    this.scriptName.set('');
    this.scriptPatterns.set([]);
    this.patternChipInput.set('');
    this.scriptAnswer.set('');
    this.scriptQuickReplies.set([]);
    this.scriptActionType.set('NONE');
    this.scriptPriority.set(0);
    this.scriptIsActive.set(true);
    this.scriptFormError.set(null);
    this.isScriptModalOpen.set(true);
  }

  public openEditScriptModal(script: BotScript): void {
    this.editingScriptId.set(script.id);
    this.scriptIntent.set(script.intent);
    this.scriptName.set(script.name);
    this.scriptPatterns.set([...(script.patterns || [])]);
    this.patternChipInput.set('');
    this.scriptAnswer.set(script.answer || '');
    this.scriptQuickReplies.set([...(script.quickReplies || [])]);
    this.scriptActionType.set(script.actionType || 'NONE');
    this.scriptPriority.set(script.priority || 0);
    this.scriptIsActive.set(script.isActive !== false);
    this.scriptFormError.set(null);
    this.isScriptModalOpen.set(true);
  }

  public closeScriptModal(): void {
    this.isScriptModalOpen.set(false);
  }

  // Chip management
  public addPatternChip(): void {
    const val = this.patternChipInput().trim();
    if (!val) return;
    if (this.scriptPatterns().includes(val)) {
      this.patternChipInput.set('');
      return;
    }
    this.scriptPatterns.update((chips) => [...chips, val]);
    this.patternChipInput.set('');
  }

  public onPatternInputKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addPatternChip();
    }
  }

  public removePatternChip(index: number): void {
    this.scriptPatterns.update((chips) => chips.filter((_, i) => i !== index));
  }

  // Quick replies management
  public addQuickReplyOption(): void {
    if (this.scriptQuickReplies().length >= 6) {
      alert('Tối đa 6 nút phản hồi nhanh.');
      return;
    }
    this.scriptQuickReplies.update((list) => [...list, { label: '', payload: '' }]);
  }

  public removeQuickReplyOption(index: number): void {
    this.scriptQuickReplies.update((list) => list.filter((_, i) => i !== index));
  }

  public updateQuickReplyLabel(index: number, label: string): void {
    this.scriptQuickReplies.update((list) =>
      list.map((item, i) => (i === index ? { ...item, label } : item))
    );
  }

  public updateQuickReplyPayload(index: number, payload: string): void {
    this.scriptQuickReplies.update((list) =>
      list.map((item, i) => (i === index ? { ...item, payload } : item))
    );
  }

  // Chèn biến vào câu trả lời
  public insertVariable(variableName: string): void {
    this.scriptAnswer.update((prev) => prev + variableName);
  }

  public saveScript(): void {
    const isEdit = !!this.editingScriptId();
    const intent = this.scriptIntent().trim().toUpperCase();
    const name = this.scriptName().trim();
    const patterns = this.scriptPatterns();
    const answer = this.scriptAnswer().trim();

    if (!intent || !name) {
      this.scriptFormError.set('Vui lòng nhập đầy đủ Mã kịch bản (intent) và Tên kịch bản.');
      return;
    }

    if (patterns.length < 1) {
      this.scriptFormError.set('Kịch bản phải có tối thiểu 1 câu mẫu/từ khóa.');
      return;
    }

    if (!answer) {
      this.scriptFormError.set('Vui lòng nhập nội dung câu trả lời của trợ lý ảo.');
      return;
    }

    if (answer.length > 2000) {
      this.scriptFormError.set('Nội dung câu trả lời không được vượt quá 2000 ký tự.');
      return;
    }

    // Validate quick replies
    const validQuickReplies = this.scriptQuickReplies().filter(
      (qr) => qr.label.trim() && qr.payload.trim()
    );

    this.isSavingScript.set(true);
    this.scriptFormError.set(null);

    const payload: Partial<BotScript> = {
      intent,
      name,
      patterns,
      answer,
      quickReplies: validQuickReplies.length > 0 ? validQuickReplies : undefined,
      actionType: this.scriptActionType(),
      priority: Number(this.scriptPriority()) || 0,
      isActive: this.scriptIsActive(),
    };

    if (isEdit) {
      this.chatAdminService.updateScript(this.editingScriptId()!, payload).subscribe({
        next: () => {
          this.isSavingScript.set(false);
          this.isScriptModalOpen.set(false);
          this.loadScripts();
        },
        error: (err) => {
          this.isSavingScript.set(false);
          this.scriptFormError.set(err?.error?.message || 'Không thể cập nhật kịch bản.');
        },
      });
    } else {
      this.chatAdminService.createScript(payload).subscribe({
        next: () => {
          this.isSavingScript.set(false);
          this.isScriptModalOpen.set(false);
          this.loadScripts();
        },
        error: (err) => {
          this.isSavingScript.set(false);
          this.scriptFormError.set(err?.error?.message || 'Không thể tạo kịch bản.');
        },
      });
    }
  }

  public openDeleteScriptModal(script: BotScript): void {
    this.scriptToDelete.set(script);
    this.isDeleteScriptModalOpen.set(true);
  }

  public closeDeleteScriptModal(): void {
    this.isDeleteScriptModalOpen.set(false);
    this.scriptToDelete.set(null);
  }

  public confirmDeleteScript(): void {
    const script = this.scriptToDelete();
    if (!script) return;

    this.isDeletingScript.set(true);
    this.chatAdminService.deleteScript(script.id).subscribe({
      next: () => {
        this.isDeletingScript.set(false);
        this.isDeleteScriptModalOpen.set(false);
        this.scriptToDelete.set(null);
        this.loadScripts();
      },
      error: (err) => {
        this.isDeletingScript.set(false);
        alert(err?.error?.message || 'Không thể xóa kịch bản.');
      },
    });
  }

  public toggleScriptActive(script: BotScript): void {
    this.chatAdminService
      .updateScript(script.id, { isActive: !script.isActive })
      .subscribe({
        next: () => this.loadScripts(),
        error: (err) => alert(err?.error?.message || 'Không thể đổi trạng thái kịch bản.'),
      });
  }

  // Thử kịch bản (Test script)
  public runScriptTest(): void {
    const text = this.testText().trim();
    if (!text) return;

    this.isTestingScript.set(true);
    this.testError.set(null);
    this.testResult.set(null);

    this.chatAdminService.testScript(text).subscribe({
      next: (res) => {
        this.testResult.set(res);
        this.isTestingScript.set(false);
      },
      error: (err) => {
        this.testError.set(err?.error?.message || 'Không thể kiểm tra kịch bản.');
        this.isTestingScript.set(false);
      },
    });
  }

  // =========================================================================
  // TAB CÀI ĐẶT (SETTINGS)
  // =========================================================================

  public loadSettings(): void {
    this.chatAdminService.getSettings().subscribe({
      next: (res) => {
        const s = res.settings || {};
        if (s['workingHours']) {
          this.settingsWorkingHours.set(s['workingHours']);
        }
        if (s['greeting']) this.settingsGreeting.set(s['greeting']);
        if (s['offlineMessage']) this.settingsOfflineMessage.set(s['offlineMessage']);
        if (s['handoffMessage']) this.settingsHandoffMessage.set(s['handoffMessage']);
        if (Array.isArray(s['fallbackMessages'])) {
          this.settingsFallbackMessages.set(s['fallbackMessages']);
        } else {
          this.settingsFallbackMessages.set([
            'Xin lỗi, DCor chưa hiểu câu hỏi của bạn. Bạn có thể miêu tả chi tiết hơn không?',
            'DCor chưa nhận diện được yêu cầu này. Bạn vui lòng chọn các gợi ý bên dưới hoặc bấm Gặp nhân viên nhé!',
            'DCor xin lỗi vì sự bất tiện này. Bạn có muốn kết nối với chuyên viên tư vấn ngay không?',
          ]);
        }
        if (s['hotline']) this.settingsHotline.set(s['hotline']);
        if (s['address']) this.settingsAddress.set(s['address']);
      },
    });
  }

  public toggleWorkingDay(day: number): void {
    this.settingsWorkingHours.update((wh) => {
      const days = [...wh.days];
      const idx = days.indexOf(day);
      if (idx > -1) {
        if (days.length <= 1) {
          alert('Phải chọn ít nhất 1 ngày làm việc trong tuần.');
          return wh;
        }
        days.splice(idx, 1);
      } else {
        days.push(day);
      }
      return { ...wh, days: days.sort() };
    });
  }

  public isDaySelected(day: number): boolean {
    return this.settingsWorkingHours().days.includes(day);
  }

  public updateWorkStart(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.settingsWorkingHours.update((wh) => ({ ...wh, start: val }));
  }

  public updateWorkEnd(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.settingsWorkingHours.update((wh) => ({ ...wh, end: val }));
  }

  public addFallbackMessage(): void {
    const val = this.newFallbackInput().trim();
    if (!val) return;
    if (val.length > 500) {
      alert('Tin nhắn dự phòng không được vượt quá 500 ký tự.');
      return;
    }
    this.settingsFallbackMessages.update((list) => [...list, val]);
    this.newFallbackInput.set('');
  }

  public removeFallbackMessage(index: number): void {
    if (this.settingsFallbackMessages().length <= 3) {
      alert('Danh sách tin nhắn Fallback phải duy trì tối thiểu 3 biến thể.');
      return;
    }
    this.settingsFallbackMessages.update((list) => list.filter((_, i) => i !== index));
  }

  public updateFallbackItem(index: number, text: string): void {
    this.settingsFallbackMessages.update((list) =>
      list.map((item, i) => (i === index ? text : item))
    );
  }

  public saveSettings(): void {
    const wh = this.settingsWorkingHours();
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(wh.start) || !timeRegex.test(wh.end)) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Giờ làm việc phải theo định dạng HH:mm (ví dụ 08:00, 22:00).',
      });
      return;
    }

    if (wh.start >= wh.end) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Giờ kết thúc phải sau giờ bắt đầu làm việc.',
      });
      return;
    }

    if (wh.days.length === 0) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Vui lòng chọn ít nhất 1 ngày làm việc.',
      });
      return;
    }

    const fallbacks = this.settingsFallbackMessages().map((f) => f.trim()).filter(Boolean);
    if (fallbacks.length < 3) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Cần ít nhất 3 biến thể tin nhắn dự phòng (Fallback).',
      });
      return;
    }

    if (
      (this.settingsGreeting() && this.settingsGreeting().length > 500) ||
      (this.settingsOfflineMessage() && this.settingsOfflineMessage().length > 500) ||
      (this.settingsHandoffMessage() && this.settingsHandoffMessage().length > 500)
    ) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Các tin nhắn cấu hình không được vượt quá 500 ký tự.',
      });
      return;
    }

    this.isSavingSettings.set(true);
    this.settingsFeedback.set(null);

    const payload = {
      workingHours: wh,
      greeting: this.settingsGreeting().trim(),
      offlineMessage: this.settingsOfflineMessage().trim(),
      handoffMessage: this.settingsHandoffMessage().trim(),
      fallbackMessages: fallbacks,
      hotline: this.settingsHotline().trim(),
      address: this.settingsAddress().trim(),
    };

    this.chatAdminService.updateSettings(payload).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.settingsFeedback.set({
          type: 'success',
          message: 'Lưu cấu hình Chat & Bot thành công!',
        });
        setTimeout(() => this.settingsFeedback.set(null), 4000);
      },
      error: (err) => {
        this.isSavingSettings.set(false);
        this.settingsFeedback.set({
          type: 'error',
          message: err?.error?.message || 'Không thể lưu cấu hình.',
        });
      },
    });
  }

  // =========================================================================
  // HELPER FORMATTERS
  // =========================================================================

  public openLightbox(imageUrl: string): void {
    this.lightboxImageUrl.set(imageUrl);
  }

  public closeLightbox(): void {
    this.lightboxImageUrl.set(null);
  }

  public replaceTemplateVariables(text: string): string {
    if (!text) return '';
    const wh = this.settingsWorkingHours();
    const hoursText = `${wh.start} - ${wh.end} (Hàng ngày)`;
    const statusOpenText = 'Đang mở cửa';

    return text
      .replace(/\{\{hotline\}\}/g, this.settingsHotline() || '1900 1234')
      .replace(/\{\{address\}\}/g, this.settingsAddress() || '669 QL1A, TP. Hồ Chí Minh')
      .replace(/\{\{hours\}\}/g, hoursText)
      .replace(/\{\{status_open\}\}/g, statusOpenText)
      .replace(/\{\{handoffMessage\}\}/g, this.settingsHandoffMessage());
  }

  public getInitials(name: string): string {
    if (!name) return 'K';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name[0] || 'K').toUpperCase();
  }

  public getAvatarColor(name: string): string {
    const colors = [
      '#765337',
      '#BC5F13',
      '#4F46E5',
      '#059669',
      '#D97706',
      '#DC2626',
      '#7C3AED',
      '#0284C7',
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  public formatRelativeTime(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    const d = date.getDate().toString().padStart(2, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}/${mo}`;
  }

  public formatMessageTime(dateInput: string | Date | undefined): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  public formatCurrency(val: any): string {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }

  public getOrderStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      READY_TO_SHIP: 'Sẵn sàng giao',
      SHIPPED: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      COMPLETED: 'Hoàn tất',
      CANCELLED: 'Đã hủy',
      RETURN_REQUESTED: 'Yêu cầu trả hàng',
    };
    return map[status] || status;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 60);
  }
}
