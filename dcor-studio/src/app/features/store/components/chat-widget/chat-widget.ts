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
  ProductCardItem,
  OrderCardMeta,
  ProductCardsMeta,
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

  // Form đăng ký thông tin khách vãng lai
  public guestName = signal('');
  public guestPhone = signal('');
  public guestFormError = signal<string | null>(null);
  public isSubmittingInit = signal(false);

  // Form nhập tin nhắn
  public inputContent = signal('');
  public selectedImageFile = signal<File | null>(null);
  public selectedImagePreview = signal<string | null>(null);
  public isUploadingImage = signal(false);
  public isSending = signal(false);

  // Nút thông báo tin mới khi người dùng đang cuộn lên
  public showNewMessagesButton = signal(false);
  private isUserNearBottom = true;

  // Tập hợp các ID tin nhắn đã được bấm Quick Reply (để vô hiệu hóa)
  public usedQuickReplyMessageIds = signal<Set<string>>(new Set());

  // Popup xác nhận kết thúc trò chuyện
  public showEndConfirm = signal(false);

  // Listeners
  private storageEventListener?: (e: Event) => void;

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
    return 'Tự động giải đáp 24/7';
  });

  constructor() {
    // Tự động cuộn xuống cuối khi có tin nhắn mới nếu người dùng đang ở đáy
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

    if (typeof window !== 'undefined') {
      this.storageEventListener = () => {
        this.checkDockState();
      };
      window.addEventListener('dcor_compare_updated', this.storageEventListener);
      window.addEventListener('storage', this.storageEventListener);

      // Khôi phục trạng thái mở/đóng UI từ sessionStorage
      try {
        const savedOpenState = sessionStorage.getItem(CHAT_UI_OPEN_KEY);
        if (savedOpenState === 'true') {
          this.isOpen.set(true);
          this.chatService.setWindowOpen(true);
        }
      } catch {
        // Bỏ qua
      }
    }

    // Tải hoặc khôi phục phiên chat
    await this.initSession();
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.storageEventListener) {
      window.removeEventListener('dcor_compare_updated', this.storageEventListener);
      window.removeEventListener('storage', this.storageEventListener);
    }
  }

  @HostListener('window:keydown.escape')
  onEscapePressed() {
    if (this.isOpen()) {
      this.closeChat();
    }
  }

  /**
   * Khởi tạo hoặc khôi phục phiên chat
   */
  private async initSession() {
    const isAuth = this.authService.isAuthenticated();
    const guestSession = this.chatService.getGuestSession();

    if (isAuth || guestSession) {
      // Kết nối socket
      this.chatService.connect();

      // Gọi REST API lấy thông tin hội thoại hiện tại
      const conv = await this.chatService.fetchMeConversation();
      if (conv) {
        // Tải 30 tin nhắn mới nhất
        await this.chatService.fetchMessages(conv.id, undefined, 30);
        setTimeout(() => this.scrollToBottom('instant'), 100);
      } else if (isAuth) {
        // Nếu đã đăng nhập nhưng chưa có hội thoại, tự động tạo hội thoại với tên và sđt của tài khoản
        const user = this.authService.getCurrentUser();
        if (user && user.phone) {
          try {
            await this.chatService.initGuestConversation(user.fullName, user.phone);
          } catch {
            // Sẽ hiển thị form nếu khởi tạo tự động chưa thành công
          }
        }
      }
    }
  }

  /**
   * Chuyển đổi trạng thái mở / đóng cửa sổ chat
   */
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
    } catch {
      // Bỏ qua
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
    } catch {
      // Bỏ qua
    }
  }

  /**
   * Bắt đầu trò chuyện từ form khách vãng lai
   */
  public async submitGuestInit() {
    const name = this.guestName().trim();
    const phone = this.guestPhone().trim();

    if (!name) {
      this.guestFormError.set('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    // Kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      this.guestFormError.set('Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam 10 chữ số (đầu số 03, 05, 07, 08, 09).');
      return;
    }

    this.guestFormError.set(null);
    this.isSubmittingInit.set(true);

    try {
      await this.chatService.initGuestConversation(name, phone);
      setTimeout(() => {
        this.scrollToBottom('instant');
        this.focusInput();
      }, 100);
    } catch (err: any) {
      this.guestFormError.set(err?.message || 'Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại.');
    } finally {
      this.isSubmittingInit.set(false);
    }
  }

  /**
   * Bắt đầu cuộc trò chuyện mới sau khi đã kết thúc
   */
  public async startNewConversation() {
    this.chatService.endConversation();
    this.showEndConfirm.set(false);
    this.guestName.set('');
    this.guestPhone.set('');
    this.guestFormError.set(null);

    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user && user.phone) {
        try {
          await this.chatService.initGuestConversation(user.fullName, user.phone);
        } catch {
          // Hiện form nếu cần
        }
      }
    }
  }

  /**
   * Kết thúc cuộc trò chuyện
   */
  public confirmEndConversation() {
    this.chatService.endConversation();
    this.showEndConfirm.set(false);
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
      this.chatService.socketError.set('Tin nhắn không được vượt quá 1000 ký tự.');
      return;
    }

    this.isSending.set(true);
    let uploadedImageUrl: string | undefined = undefined;

    try {
      // 1. Tải ảnh lên nếu có
      if (imageFile) {
        this.isUploadingImage.set(true);
        uploadedImageUrl = await this.chatService.uploadImage(imageFile);
        this.selectedImageFile.set(null);
        this.selectedImagePreview.set(null);
      }

      // 2. Gửi qua socket
      this.chatService.sendMessage(content, uploadedImageUrl);

      // 3. Xóa ô nhập
      this.inputContent.set('');
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.style.height = 'auto';
      }
      this.chatService.sendTyping(false);
      this.scrollToBottom('smooth');
    } catch (err: any) {
      this.chatService.socketError.set(err?.message || 'Không thể gửi tin nhắn.');
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
   * Tự co giãn chiều cao textarea theo nội dung nhập
   */
  public onTextareaInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
    }
    this.handleInputChange();
  }

  /**
   * Thông báo đang gõ phím
   */
  public handleInputChange() {
    const hasContent = this.inputContent().trim().length > 0;
    this.chatService.sendTyping(hasContent);
  }

  /**
   * Xử lý chọn tệp ảnh
   */
  public onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.chatService.socketError.set('Chỉ chấp nhận tệp ảnh định dạng JPG, PNG hoặc WebP.');
      return;
    }

    this.selectedImageFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input để có thể chọn lại cùng file
    target.value = '';
  }

  public removeSelectedImage() {
    this.selectedImageFile.set(null);
    this.selectedImagePreview.set(null);
  }

  public triggerFileInput() {
    this.fileInput?.nativeElement.click();
  }

  /**
   * Bấm chọn Quick Reply (chỉ bấm 1 lần)
   */
  public onQuickReplyClick(messageId: string, payload: string) {
    const used = new Set(this.usedQuickReplyMessageIds());
    if (used.has(messageId)) return;

    used.add(messageId);
    this.usedQuickReplyMessageIds.set(used);

    this.chatService.selectQuickReply(payload);
    setTimeout(() => this.scrollToBottom('smooth'), 100);
  }

  /**
   * Thử gửi lại tin nhắn lỗi
   */
  public retryMessage(clientMessageId: string | null | undefined) {
    if (clientMessageId) {
      this.chatService.retryMessage(clientMessageId);
    }
  }

  /**
   * Cuộn danh sách tin nhắn
   */
  public onScroll(event: Event) {
    const el = event.target as HTMLDivElement;
    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    this.isUserNearBottom = atBottom;

    if (atBottom) {
      this.showNewMessagesButton.set(false);
    }

    // Khi cuộn lên đầu (scrollTop <= 30), tải thêm tin cũ
    if (el.scrollTop <= 30 && this.chatService.hasMoreHistory() && !this.chatService.isLoadingHistory()) {
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

  /**
   * Phân tách chuỗi tin nhắn thành text và liên kết an toàn
   */
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

  /**
   * Định dạng giờ gửi tin nhắn (HH:mm)
   */
  public formatTime(dateVal: Date | string | undefined): string {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  /**
   * Kiểm tra xem 2 tin nhắn liên tiếp có cùng người gửi không
   */
  public isSameSender(curr: ChatMessage, prev: ChatMessage | null): boolean {
    if (!prev) return false;
    return curr.senderType === prev.senderType && curr.senderName === prev.senderName;
  }

  /**
   * Chuyển hướng xem sản phẩm
   */
  public viewProduct(productId: string) {
    this.router.navigate(['/products', productId]);
  }

  /**
   * Kiểm tra trạng thái floating compare dock
   */
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

  /**
   * Ép kiểu meta sản phẩm
   */
  public asProductCards(meta: any): ProductCardsMeta | null {
    if (meta && meta.type === 'PRODUCT_CARDS' && Array.isArray(meta.products)) {
      return meta as ProductCardsMeta;
    }
    return null;
  }

  /**
   * Ép kiểu meta đơn hàng
   */
  public asOrderCard(meta: any): OrderCardMeta | null {
    if (meta && meta.type === 'ORDER_CARD') {
      return meta as OrderCardMeta;
    }
    return null;
  }

  /**
   * Màu sắc badge trạng thái đơn hàng
   */
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

