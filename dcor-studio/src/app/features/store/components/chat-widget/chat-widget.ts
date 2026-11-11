import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  signal,
  computed,
  HostListener,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatSocketService, CHAT_UI_OPEN_KEY } from './chat-socket.service';
import {
  ChatMessage,
  ProductCardsMeta,
  OrderCardMeta,
  LinkMeta,
} from './chat-widget.model';

interface TextSegment {
  type: 'text' | 'link';
  value: string;
  href?: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  public chatService = inject(ChatSocketService);
  public authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('messageTextarea') private messageTextarea?: ElementRef<HTMLTextAreaElement>;

  // Trạng thái mở/đóng cửa sổ chat
  public isOpen = signal(false);

  // Trạng thái thanh so sánh nổi
  public isDockActive = signal(false);

  // Form nhập tin nhắn
  public inputContent = signal('');
  public selectedImageFile = signal<File | null>(null);
  public selectedImagePreview = signal<string | null>(null);
  public isUploadingImage = signal(false);
  public isSending = signal(false);

  // Nút thông báo tin mới khi người dùng đang cuộn lên
  public showNewMessagesButton = signal(false);
  private isUserNearBottom = true;

  // Tập hợp các ID tin nhắn đã được bấm Quick Reply
  public usedQuickReplyMessageIds = signal<Set<string>>(new Set());

  // Hộp xác nhận dạng lớp phủ (Overlay) khi bấm icon thùng rác
  public showResetConfirm = signal(false);

  // Nhắc nhở đăng nhập cục bộ khi khách vãng lai bấm nút ảnh
  public showGuestUploadLoginPrompt = signal(false);

  // Listeners
  private storageEventListener?: (e: Event) => void;
  private focusEventListener?: () => void;
  private lastKnownAuthToken: string | null = null;

  // Computed properties
  public currentUser = computed(() => this.authService.getCurrentUser());
  public isAuthenticated = computed(() => this.authService.isAuthenticated());

  public hasActiveSession = computed(() => {
    return !!this.chatService.currentConversation()?.id;
  });

  public unreadBadgeText = computed(() => {
    const count = this.chatService.unreadCount();
    if (count <= 0) return '';
    return count > 9 ? '9+' : count.toString();
  });

  public conversationTitle = computed(() => {
    const conv = this.chatService.currentConversation();
    if (!conv) return 'Trợ lý DCor';
    if (conv.mode === 'STAFF') {
      return conv.assignedStaffName || 'Chuyên viên tư vấn';
    }
    if (conv.mode === 'WAITING_STAFF') {
      return 'Đang chờ nhân viên';
    }
    return 'Trợ lý DCor';
  });

  public conversationSubtitle = computed(() => {
    const conv = this.chatService.currentConversation();
    if (!conv) return 'Hỗ trợ khách hàng 24/7';
    if (conv.mode === 'STAFF') {
      return 'Chuyên viên đang trực tiếp hỗ trợ';
    }
    if (conv.mode === 'WAITING_STAFF') {
      return 'Chuyên viên sẽ phản hồi bạn trong giây lát';
    }
    return 'Hỗ trợ khách hàng 24/7';
  });

  constructor() {
    // Tự động cuộn xuống cuối khi có tin nhắn mới
    effect(() => {
      const msgs = this.chatService.messages();
      if (msgs.length > 0) {
        setTimeout(() => {
          if (this.isUserNearBottom) {
            this.scrollToBottom('smooth');
          } else {
            this.showNewMessagesButton.set(true);
          }
        }, 50);
      }
    });

    // Tự động cuộn khi typing indicator thay đổi
    effect(() => {
      const typing = this.chatService.typingIndicator();
      if (typing && this.isUserNearBottom) {
        setTimeout(() => this.scrollToBottom('smooth'), 50);
      }
    });
  }

  async ngOnInit() {
    this.checkDockState();
    this.lastKnownAuthToken = this.authService.getToken();

    if (typeof window !== 'undefined') {
      this.storageEventListener = () => {
        this.checkDockState();
        this.checkAuthStatusTransition();
      };
      window.addEventListener('dcor_compare_updated', this.storageEventListener);
      window.addEventListener('storage', this.storageEventListener);

      this.focusEventListener = () => {
        this.checkAuthStatusTransition();
      };
      window.addEventListener('focus', this.focusEventListener);

      try {
        const savedOpenState = sessionStorage.getItem(CHAT_UI_OPEN_KEY);
        if (savedOpenState === 'true') {
          this.isOpen.set(true);
          this.chatService.setWindowOpen(true);
        }
      } catch {}
    }

    // Khởi tạo phiên
    await this.initSession();
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      if (this.storageEventListener) {
        window.removeEventListener('dcor_compare_updated', this.storageEventListener);
        window.removeEventListener('storage', this.storageEventListener);
      }
      if (this.focusEventListener) {
        window.removeEventListener('focus', this.focusEventListener);
      }
    }
  }

  @HostListener('window:keydown.escape')
  onEscapePressed() {
    if (this.showResetConfirm()) {
      this.showResetConfirm.set(false);
      return;
    }
    if (this.isOpen()) {
      this.closeChat();
    }
  }

  /**
   * Theo dõi trạng thái đăng nhập đổi từ guest -> đã đăng nhập hoặc ngược lại
   */
  private checkAuthStatusTransition() {
    const currentToken = this.authService.getToken();

    // 1. Trường hợp vừa đăng nhập thành công (từ null sang có token)
    if (!this.lastKnownAuthToken && currentToken) {
      this.lastKnownAuthToken = currentToken;
      // Gọi claim conversation
      this.chatService.claimConversation();
      return;
    }

    // 2. Trường hợp đăng xuất (từ có token sang null):
    // "Khi đăng xuất: ngắt socket, xóa toàn bộ khóa chat khỏi storage, đóng cửa sổ và về lời chào guest mới"
    if (this.lastKnownAuthToken && !currentToken) {
      this.lastKnownAuthToken = null;
      this.chatService.disconnect();
      this.chatService.clearAllChatStorage();
      this.closeChat();
      this.chatService.resetToFreshState();
      return;
    }

    this.lastKnownAuthToken = currentToken;
  }

  /**
   * Khởi tạo hoặc khôi phục phiên chat
   */
  private async initSession() {
    // 1. Luôn tải lời chào (GET /api/chat/greeting: text + nút gợi ý, theo trạng thái đăng nhập)
    await this.chatService.fetchGreeting();

    // 2. Thử khôi phục hội thoại cũ qua REST (nếu có sẵn)
    const conv = await this.chatService.fetchMeConversation();
    if (conv) {
      this.chatService.connect();
      await this.chatService.fetchMessages(conv.id, undefined, 30);
      setTimeout(() => this.scrollToBottom('instant'), 100);
    } else {
      // Chưa có hội thoại, kiểm tra nếu khách vừa đăng nhập sau handoff
      if (this.authService.isAuthenticated() && this.chatService.hasPendingHandoff()) {
        await this.chatService.claimConversation();
      }
    }
  }

  public toggleChat() {
    if (this.isOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  public openChat() {
    this.isOpen.set(true);
    this.chatService.setWindowOpen(true);
    try {
      sessionStorage.setItem(CHAT_UI_OPEN_KEY, 'true');
    } catch {}

    // Kiểm tra nếu chưa nạp greeting thì nạp lại
    if (!this.chatService.initialGreeting()) {
      this.chatService.fetchGreeting();
    }

    setTimeout(() => {
      this.scrollToBottom('instant');
      this.focusInput();
    }, 150);
  }

  public closeChat() {
    this.isOpen.set(false);
    this.chatService.setWindowOpen(false);
    try {
      sessionStorage.setItem(CHAT_UI_OPEN_KEY, 'false');
    } catch {}
  }

  /**
   * Bấm nút thùng rác: Mở hộp xác nhận
   */
  public openResetConfirm() {
    this.showResetConfirm.set(true);
  }

  public closeResetConfirm() {
    this.showResetConfirm.set(false);
  }

  /**
   * Xác nhận làm mới cuộc trò chuyện:
   * Gọi DELETE /api/chat/conversations/:id, xóa bong bóng, xóa phiên lưu của khách,
   * trả về trạng thái lời chào mới.
   */
  public async confirmResetConversation() {
    this.showResetConfirm.set(false);
    const conv = this.chatService.currentConversation();
    if (conv?.id) {
      await this.chatService.deleteConversation(conv.id);
    } else {
      this.chatService.resetToFreshState();
    }
  }

  /**
   * Xử lý gửi tin nhắn văn bản & ảnh
   */
  public async handleSendMessage() {
    if (this.isSending() || this.isUploadingImage()) return;

    const content = this.inputContent().trim();
    const imageFile = this.selectedImageFile();

    if (!content && !imageFile) return;

    if (content.length > 1000) {
      this.chatService.setError('Tin nhắn không được vượt quá 1000 ký tự.');
      return;
    }

    // Nếu khách vãng lai gửi ảnh: từ chối và hiện LOGIN_CTA
    if (imageFile && !this.authService.isAuthenticated()) {
      this.removeSelectedImage();
      this.showGuestUploadLoginPrompt.set(true);
      return;
    }

    this.isSending.set(true);
    let uploadedImageUrl: string | undefined = undefined;

    try {
      if (imageFile) {
        this.isUploadingImage.set(true);
        uploadedImageUrl = await this.chatService.uploadImage(imageFile);
        this.selectedImageFile.set(null);
        this.selectedImagePreview.set(null);
      }

      this.chatService.sendMessage(content, uploadedImageUrl);

      this.inputContent.set('');
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.style.height = 'auto';
      }
      this.chatService.sendTyping(false);
      this.scrollToBottom('smooth');
    } catch (err: any) {
      this.chatService.setError(err?.message || 'Không thể gửi tin nhắn.');
    } finally {
      this.isSending.set(false);
      this.isUploadingImage.set(false);
      this.focusInput();
    }
  }

  /**
   * Phím Enter để gửi, Shift+Enter xuống dòng
   */
  public handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }

  /**
   * Tự co giãn chiều cao textarea (tối đa 4 dòng ~ 96px)
   */
  public onTextareaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
    }
    this.handleInputChange();
  }

  public handleInputChange() {
    const hasContent = this.inputContent().trim().length > 0;
    this.chatService.sendTyping(hasContent);
  }

  /**
   * Xử lý khi bấm nút icon đính kèm ảnh:
   * Nếu là khách vãng lai: không mở chọn tệp, hiện bong bóng nhắc đăng nhập
   */
  public triggerFileInput() {
    if (!this.authService.isAuthenticated()) {
      this.showGuestUploadLoginPrompt.set(true);
      return;
    }
    this.fileInput?.nativeElement.click();
  }

  public onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.chatService.setError('Chỉ chấp nhận tệp ảnh định dạng JPG, PNG hoặc WebP.');
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

  public removeSelectedImage() {
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
  }

  /**
   * Bấm chọn Quick Reply (chỉ bấm 1 lần)
   */
  public onQuickReplyClick(messageId: string, payload: string) {
    const used = new Set(this.usedQuickReplyMessageIds());
    if (used.has(messageId)) return;

    used.add(messageId);
    this.usedQuickReplyMessageIds.set(used);

    // Nếu payload là đường dẫn (ví dụ /explore)
    if (payload.startsWith('/')) {
      this.router.navigateByUrl(payload);
      return;
    }

    this.chatService.selectQuickReply(payload);
    setTimeout(() => this.scrollToBottom('smooth'), 100);
  }

  /**
   * Bấm nút [Đăng nhập] từ thẻ LOGIN_CTA:
   * Điều hướng /login?returnUrl=<trang hiện tại> và ghi nhớ pendingHandoff
   */
  public navigateToLogin() {
    this.chatService.setPendingHandoff(true);
    const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  /**
   * Bấm nút 'Đặt lịch tư vấn tại Showroom' (BOOKING_CTA):
   * Tìm trigger mở modal showroom tư vấn nếu đang ở trang có modal (home, product-detail),
   * nếu không thì điều hướng sang trang đặt lịch (/account/appointments hoặc /consultation)
   */
  public handleBookingCta() {
    // 1. Thử kích hoạt nút/trigger mở modal showroom tư vấn đã có trên DOM mà không sửa code
    if (typeof document !== 'undefined') {
      const showroomBtn = document.querySelector<HTMLElement>(
        '[data-open-showroom-modal], .open-showroom-btn, .btn-consultation-trigger'
      );
      if (showroomBtn) {
        showroomBtn.click();
        return;
      }
    }

    // 2. Điều hướng tới route đặt lịch tư vấn tương đương trong dự án
    this.router.navigate(['/account/appointments']);
  }

  public retryMessage(clientMessageId: string | null | undefined) {
    if (clientMessageId) {
      this.chatService.retryMessage(clientMessageId);
    }
  }

  public onScroll(event: Event) {
    const el = event.target as HTMLDivElement;
    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    this.isUserNearBottom = atBottom;

    if (atBottom) {
      this.showNewMessagesButton.set(false);
    }

    const isScrollable = el.scrollHeight > el.clientHeight + 20;
    if (isScrollable && el.scrollTop <= 30 && this.chatService.hasMoreHistory() && !this.chatService.isLoadingHistory()) {
      const convId = this.chatService.currentConversation()?.id;
      const msgs = this.chatService.messages();
      if (convId && msgs.length > 0) {
        const oldestMsg = msgs[0];
        const oldHeight = el.scrollHeight;
        this.chatService.fetchMessages(convId, oldestMsg.createdAt as string, 30).then(() => {
          setTimeout(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - oldHeight;
          }, 30);
        });
      }
    }
  }

  public scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
      this.showNewMessagesButton.set(false);
      this.isUserNearBottom = true;
    }
  }

  private focusInput() {
    setTimeout(() => {
      this.messageTextarea?.nativeElement.focus();
    }, 100);
  }

  public parseMessageContent(text: string): TextSegment[] {
    if (!text) return [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments: TextSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          value: text.substring(lastIndex, match.index),
        });
      }

      segments.push({
        type: 'link',
        value: match[0],
        href: match[0],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        value: text.substring(lastIndex),
      });
    }

    return segments;
  }

  public formatTime(dateVal: Date | string | undefined): string {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  public isSameSender(curr: ChatMessage, prev: ChatMessage | null): boolean {
    if (!prev) return false;
    return curr.senderType === prev.senderType && curr.senderName === prev.senderName;
  }

  public viewProduct(productId: string) {
    this.router.navigate(['/products', productId]);
  }

  private checkDockState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      const list = stored ? JSON.parse(stored) : [];
      this.isDockActive.set(list.length > 0);
    } catch {
      this.isDockActive.set(false);
    }
  }

  public asLinkMeta(meta: any): LinkMeta | null {
    if (meta && meta.type === 'LINK' && meta.url) {
      return meta as LinkMeta;
    }
    return null;
  }

  public isInternalUrl(url: string | undefined): boolean {
    if (!url) return false;
    return url.startsWith('/') && !url.startsWith('//');
  }

  public handleLinkClick(url: string | undefined): void {
    if (!url) return;
    if (this.isInternalUrl(url)) {
      this.router.navigateByUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  public asProductCards(meta: any): ProductCardsMeta | null {
    if (meta && (meta.type === 'PRODUCT_CARDS' || meta.type === 'SOFA_HOT_CARDS') && Array.isArray(meta.products)) {
      return meta as ProductCardsMeta;
    }
    return null;
  }

  public asOrderCard(meta: any): OrderCardMeta | null {
    if (meta && meta.type === 'ORDER_CARD') {
      return meta as OrderCardMeta;
    }
    return null;
  }

  public isBookingCta(meta: any): boolean {
    return meta && meta.type === 'BOOKING_CTA';
  }

  public isLoginCta(meta: any): boolean {
    return meta && meta.type === 'LOGIN_CTA';
  }

  public getOrderStatusClass(status: string): string {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'SHIPPED':
      case 'READY_TO_SHIP':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  }
}
