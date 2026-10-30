import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Search, Check, AlertCircle, Package, AlertTriangle, Clock, Image as ImageIcon, Plus, X, ChevronDown, Eye, Sparkles } from 'lucide-angular';
import { AccountSidebarComponent } from '../../components/account-sidebar/account-sidebar';
import { GuestPhoneBannerComponent } from '../../../../shared/components/guest-phone-banner/guest-phone-banner';
import { OrderService, OrderSummary, OrderDetail } from '../../../../core/services/order.service';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, AccountSidebarComponent, GuestPhoneBannerComponent],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  readonly icons = { Search, Check, AlertCircle, Package, AlertTriangle, Clock, Image: ImageIcon, Plus, X, ChevronDown, Eye, Sparkles };

  activeTab = 'ALL';
  searchQuery = '';
  rawOrders: OrderSummary[] = [];
  orders: OrderSummary[] = [];
  isLoading = false;

  isLoggedIn = false;
  isPhoneVerified = false;
  guestPhoneFromQuery = '';

  get canViewContent(): boolean {
    return this.isLoggedIn || this.isPhoneVerified;
  }

  // Tabs cấu hình (Đã bỏ tab Đổi trả theo yêu cầu)
  tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'WAITING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'PROCESSING', label: 'Đang chuẩn bị' },
    { key: 'SHIPPED', label: 'Đang giao' },
    { key: 'DELIVERED', label: 'Hoàn tất' },
    { key: 'CANCELLED', label: 'Đã hủy' }
  ];

  // Chi tiết đơn hàng
  selectedOrder: OrderDetail | null = null;
  isDetailDrawerOpen = false;
  isLoadingDetail = false;
  remainingCountdown = '';
  isOrderExpired = false;
  private timerInterval: any = null;
  private autoConfirmCheckInterval: any = null;
  pendingOrderNumberToOpen: string | null = null;

  // Modal Hủy đơn
  isCancelModalOpen = false;
  targetOrderForCancel: OrderSummary | OrderDetail | null = null;
  cancelReason = 'Đổi ý không muốn mua nữa';
  cancelReasonNote = '';

  cancelReasonOptions = [
    'Đổi ý không muốn mua nữa',
    'Muốn thay đổi địa chỉ hoặc số điện thoại nhận hàng',
    'Muốn đổi kích thước, màu sắc hoặc mẫu sản phẩm khác',
    'Thời gian giao hàng dự kiến quá lâu',
    'Tìm thấy sản phẩm giá tốt hơn ở nơi khác',
    'Lý do khác'
  ];

  // Modal Đánh giá
  isReviewModalOpen = false;
  targetOrderForReview: OrderSummary | OrderDetail | null = null;
  reviewRating = 5;
  reviewComment = '';
  reviewHoverRating = 0;

  // Modal Yêu cầu đổi trả
  isReturnModalOpen = false;
  targetOrderForReturn: OrderSummary | OrderDetail | null = null;
  returnReason = 'Sản phẩm lỗi kỹ thuật do nhà sản xuất';
  returnDescription = '';
  returnImagesInput = '';
  returnUploadedImages: string[] = [];

  returnReasonOptions = [
    'Sản phẩm lỗi kỹ thuật do nhà sản xuất',
    'Sản phẩm bị trầy xước, móp méo trong quá trình vận chuyển',
    'Giao sai mẫu mã, màu sắc hoặc kích thước so với đơn đặt',
    'Sản phẩm không đúng với mô tả trên website',
    'Lý do khác'
  ];

  // Toast thông báo
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private sub = new Subscription();

  // Thanh test trạng thái đơn hàng (Đồng bộ với Admin)
  selectedTestOrderNumber = '';
  isTestingStatus = false;

  testStatusOptions = [
    { key: 'PENDING', label: 'Chờ xác nhận (PENDING)' },
    { key: 'CONFIRMED', label: 'Đã xác nhận (CONFIRMED)' },
    { key: 'PROCESSING', label: 'Đang chuẩn bị hàng (PROCESSING)' },
    { key: 'SHIPPED', label: 'Đang giao hàng (SHIPPED)' },
    { key: 'DELIVERED', label: 'Đã giao hàng / Hoàn tất (DELIVERED)' },
    { key: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
    { key: 'RETURNED', label: 'Đổi trả (RETURNED)' }
  ];

  get currentTestOrder(): OrderSummary | undefined {
    if (!this.selectedTestOrderNumber && this.rawOrders.length > 0) {
      this.selectedTestOrderNumber = this.rawOrders[0].orderNumber;
    }
    return this.rawOrders.find(o => o.orderNumber === this.selectedTestOrderNumber) || this.rawOrders[0];
  }

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Xóa sạch cache đơn hàng cũ nếu có
    try {
      localStorage.removeItem('dcor_cache_my_orders');
    } catch (_) {}

    this.isLoggedIn = this.authService.isAuthenticated();
    this.isPhoneVerified = this.authService.isGuestVerified();

    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.checkAndLoad();
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.authService.guestPhone$.subscribe(phone => {
        this.isPhoneVerified = !!phone;
        this.checkAndLoad();
        this.cdr.markForCheck();
      })
    );

    this.sub.add(
      this.route.queryParams.subscribe(params => {
        if (params['tab']) {
          this.activeTab = params['tab'];
        }
        if (params['search']) {
          this.searchQuery = params['search'];
        }
        if (this.canViewContent) {
          this.applyFilter();
        }
        if (params['phone']) {
          this.guestPhoneFromQuery = params['phone'];
        }
        const orderNumber = params['orderNumber'] || params['orderId'];
        if (orderNumber) {
          this.pendingOrderNumberToOpen = orderNumber;
          this.openOrderDetailByNumber(orderNumber);
        }
        this.cdr.markForCheck();
      })
    );

    this.checkAndLoad();

    // Khởi tạo interval 1s để cập nhật đếm ngược 5 phút cho các đơn đang chờ nhận hàng
    this.autoConfirmCheckInterval = setInterval(() => {
      let hasWaiting = false;
      for (const o of this.rawOrders) {
        if (this.isDeliveredWaitingConfirm(o)) {
          hasWaiting = true;
          break;
        }
      }
      if (hasWaiting) {
        this.applyFilter();
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  private checkAndLoad(): void {
    if (this.canViewContent) {
      this.loadOrders();
    } else {
      this.rawOrders = [];
      this.orders = [];
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadOrders(): void {
    if (!this.canViewContent) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();
    this.sub.add(
      this.orderService.getMyOrders('ALL').subscribe({
        next: (data) => {
          this.rawOrders = data || [];
          this.mergeLocalPlacedOrders();
          this.applyFilter();
          this.isLoading = false;
          if (this.pendingOrderNumberToOpen && (!this.selectedOrder || this.selectedOrder.orderNumber !== this.pendingOrderNumberToOpen)) {
            this.openOrderDetailByNumber(this.pendingOrderNumberToOpen);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.rawOrders = [];
          this.mergeLocalPlacedOrders();
          this.applyFilter();
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }

  private mergeLocalPlacedOrders(): void {
    try {
      const localPlaced = JSON.parse(localStorage.getItem('dcor_placed_orders') || '[]');
      if (!Array.isArray(localPlaced) || localPlaced.length === 0) return;

      const currentPhone = this.authService.getGuestPhone()?.trim() || '';

      // Tự động dọn dẹp các đơn rác: tổng tiền 0đ hoặc đơn tạo từ số điện thoại khác
      const validLocalPlaced = localPlaced.filter((item: any) => {
        if (!item || !item.id) return false;
        // Bỏ qua các đơn có tổng tiền bằng 0 (đơn thử nghiệm lỗi/rác)
        if (!item.total || Number(item.total) <= 0) return false;
        // Bỏ qua đơn thuộc số điện thoại khác nếu có lưu phone
        if (item.phone && currentPhone && item.phone.trim() !== currentPhone) return false;
        return true;
      });

      // Lưu lại danh sách đã dọn dẹp vào localStorage
      if (validLocalPlaced.length !== localPlaced.length) {
        localStorage.setItem('dcor_placed_orders', JSON.stringify(validLocalPlaced));
      }

      for (const item of validLocalPlaced) {
        const orderNumber = item.id || item.orderNumber;
        if (!orderNumber) continue;
        const exists = this.rawOrders.some(o => o.orderNumber === orderNumber);
        if (!exists) {
          this.rawOrders.unshift({
            id: orderNumber,
            orderNumber: orderNumber,
            date: item.date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            total: Number(item.total) || 0,
            totalAmount: Number(item.total) || 0,
            subTotal: Number(item.total) || 0,
            shippingFee: 0,
            discountAmount: 0,
            status: item.status === 'Chờ đặt cọc' ? 'WAITING_PAYMENT' : (item.statusKey || 'PENDING'),
            displayStatus: item.status || 'Chờ xác nhận',
            paymentMethod: item.paymentMethod || 'COD',
            paymentStatus: item.status === 'Chờ đặt cọc' ? 'UNPAID' : 'PENDING',
            isHighValue: !!item.depositAmount,
            depositAmount: item.depositAmount || 0,
            items: item.items || 1,
            firstItem: {
              productName: item.firstProductName || ('Đơn hàng vừa đặt #' + orderNumber),
              imageUrl: item.imageUrl || 'assets/img/furniture-placeholder.svg',
              price: Number(item.total) || 0,
              quantity: item.items || 1
            }
          });
        }
      }
    } catch (_) {}
  }

  onGuestPhoneVerified(phone: string): void {
    this.isPhoneVerified = true;
    this.rawOrders = [];
    this.orders = [];
    this.loadOrders();
    this.cdr.markForCheck();
  }

  onGuestPhoneReset(): void {
    this.isPhoneVerified = false;
    this.rawOrders = [];
    this.orders = [];
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  /**
   * Đếm số lượng đơn hàng tương ứng với từng tab trạng thái
   */
  getTabCount(key: string): number {
    if (!this.rawOrders || this.rawOrders.length === 0) return 0;
    if (key === 'ALL') return this.rawOrders.length;

    if (key === 'WAITING_PAYMENT' || key === 'WAITING_DEPOSIT') {
      return this.rawOrders.filter(o => {
        if (o.status === 'CANCELLED') return false;
        const isDeposit = o.isHighValue && o.paymentStatus !== 'PAID';
        const isBankTransfer = (o.paymentMethod === 'BANK_TRANSFER' || o.paymentMethod === 'BANKING') && o.paymentStatus !== 'PAID';
        return isDeposit || isBankTransfer;
      }).length;
    }

    if (key === 'PENDING') {
      return this.rawOrders.filter(o => {
        if (o.status !== 'PENDING') return false;
        const isDeposit = o.isHighValue && o.paymentStatus !== 'PAID';
        const isBankTransfer = (o.paymentMethod === 'BANK_TRANSFER' || o.paymentMethod === 'BANKING') && o.paymentStatus !== 'PAID';
        return !isDeposit && !isBankTransfer;
      }).length;
    }

    if (key === 'SHIPPED') {
      return this.rawOrders.filter(o => o.status === 'SHIPPED' || this.isDeliveredWaitingConfirm(o)).length;
    }

    if (key === 'DELIVERED') {
      return this.rawOrders.filter(o => (o.status === 'COMPLETED' || o.status === 'DELIVERED') && !this.isDeliveredWaitingConfirm(o)).length;
    }

    return this.rawOrders.filter(o => o.status === key).length;
  }

  /**
   * Lọc đơn hàng tức thì trong bộ nhớ (0ms, không round-trip mạng, không spinner)
   */
  applyFilter(): void {
    let list = this.rawOrders;

    // 1. Lọc theo Tab trạng thái
    if (this.activeTab !== 'ALL') {
      if (this.activeTab === 'WAITING_PAYMENT' || this.activeTab === 'WAITING_DEPOSIT') {
        // Tab Chờ thanh toán: gồm 2 loại đơn:
        // + Đơn chuyển khoản: phương thức BANK_TRANSFER/BANKING và chưa thanh toán
        // + Đơn chờ đặt cọc: đơn giá trị cao (>50tr) hoặc có đặt cọc chưa thanh toán
        list = list.filter(o => {
          if (o.status === 'CANCELLED') return false;
          const isDeposit = o.isHighValue && o.paymentStatus !== 'PAID';
          const isBankTransfer = (o.paymentMethod === 'BANK_TRANSFER' || o.paymentMethod === 'BANKING') && o.paymentStatus !== 'PAID';
          return isDeposit || isBankTransfer;
        });
      } else if (this.activeTab === 'PENDING') {
        // Tab Chờ xác nhận: đơn PENDING nhưng không thuộc diện Chờ đặt cọc hay Chờ chuyển khoản
        list = list.filter(o => {
          if (o.status !== 'PENDING') return false;
          const isDeposit = o.isHighValue && o.paymentStatus !== 'PAID';
          const isBankTransfer = (o.paymentMethod === 'BANK_TRANSFER' || o.paymentMethod === 'BANKING') && o.paymentStatus !== 'PAID';
          return !isDeposit && !isBankTransfer;
        });
      } else if (this.activeTab === 'SHIPPED') {
        // Tab Đang giao: gồm đơn SHIPPED VÀ đơn DELIVERED nhưng chưa quá 5 phút (đang chờ khách bấm "Đã nhận hàng")
        list = list.filter(o => o.status === 'SHIPPED' || this.isDeliveredWaitingConfirm(o));
      } else if (this.activeTab === 'DELIVERED') {
        // Tab Hoàn tất: gồm đơn COMPLETED VÀ đơn DELIVERED đã quá 5 phút (tự động hoàn tất) hoặc đã bấm Đã nhận hàng
        list = list.filter(o => (o.status === 'COMPLETED' || o.status === 'DELIVERED') && !this.isDeliveredWaitingConfirm(o));
      } else {
        list = list.filter(o => o.status === this.activeTab);
      }
    }

    // 2. Lọc theo từ khóa tìm kiếm (Mã đơn, Tên người nhận, Tên sản phẩm)
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(o => {
        const matchNum = o.orderNumber?.toLowerCase().includes(q);
        const matchReceiver = (o as any).receiverName?.toLowerCase().includes(q) || (o as any).shippingInfo?.receiverName?.toLowerCase().includes(q);
        const matchItems = (o.allItems || []).some(it => it.productName?.toLowerCase().includes(q)) || o.firstItem?.productName?.toLowerCase().includes(q);
        return matchNum || matchReceiver || matchItems;
      });
    }

    this.orders = list;
  }

  /**
   * Lấy nhãn trạng thái hiển thị chuẩn UX/UI:
   * - Đơn chuyển khoản: "Chờ thanh toán"
   * - Đơn chờ đặt cọc: "Chờ đặt cọc"
   * - Đơn thông thường: "Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn tất", "Đã hủy", "Đổi trả"
   */
  getOrderDisplayStatus(order: OrderSummary | OrderDetail | null | undefined): string {
    if (!order) return '';
    if (order.status === 'CANCELLED') return 'Đã hủy';
    if (order.status === 'RETURNED') return 'Đổi trả';

    // 1. Đơn chờ đặt cọc (đơn giá trị cao >50tr hoặc cần đặt cọc)
    if (order.isHighValue && order.paymentStatus !== 'PAID') {
      return 'Chờ đặt cọc';
    }

    // 2. Đơn chuyển khoản: phương thức BANK_TRANSFER/BANKING và chưa thanh toán
    const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'BANKING';
    if (isBankTransfer && order.paymentStatus !== 'PAID' && (order.status === 'PENDING' || order.status === 'WAITING_PAYMENT')) {
      return 'Chờ thanh toán';
    }

    if (this.isDeliveredWaitingConfirm(order)) {
      return 'Đang giao (Shipper báo đã giao)';
    }

    if (order.status === 'PENDING') return 'Chờ xác nhận';
    if (order.status === 'CONFIRMED') return 'Đã xác nhận';
    if (order.status === 'PROCESSING') return 'Đang chuẩn bị';
    if (order.status === 'SHIPPED') return 'Đang giao';
    if (order.status === 'DELIVERED' || (order.status as any) === 'COMPLETED') return 'Hoàn tất';

    return order.displayStatus || order.status;
  }

  /**
   * Lấy CSS class cho status pill theo chuẩn DCor UI Style Guide
   */
  getOrderStatusClass(order: OrderSummary | OrderDetail | null | undefined): string {
    if (!order) return 'default';
    const display = this.getOrderDisplayStatus(order);
    if (display === 'Chờ đặt cọc') return 'waiting-deposit';
    if (display === 'Chờ thanh toán') return 'waiting-payment';
    if (this.isDeliveredWaitingConfirm(order)) return 'shipped';
    return this.getStatusClass(order.status === 'COMPLETED' ? 'DELIVERED' : order.status);
  }

  /**
   * Điều kiện được phép hủy đơn:
   * Chỉ các đơn ở trạng thái Chờ đặt cọc, Chờ thanh toán, Chờ xác nhận mới hiện nút Hủy đơn
   */
  canCancelOrder(order: OrderSummary | OrderDetail | null | undefined): boolean {
    if (!order) return false;
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED' || (order.status as any) === 'COMPLETED' || order.status === 'SHIPPED' || order.status === 'PROCESSING') {
      return false;
    }
    const display = this.getOrderDisplayStatus(order);
    return display === 'Chờ đặt cọc' || display === 'Chờ thanh toán' || display === 'Chờ xác nhận' || order.status === 'PENDING';
  }

  /**
   * Kiểm tra điều kiện đổi trả:
   * Chỉ những đơn hàng ĐÃ HOÀN TẤT (đã bấm Đã nhận hàng hoặc tự động sau 5 phút)
   * trong vòng 7 ngày mới được đổi trả.
   */
  isEligibleForReturn(order: OrderSummary | OrderDetail | null | undefined): boolean {
    if (!order) return false;
    // Nếu đơn còn trong 5 phút chờ bấm nhận hàng thì CHƯA được yêu cầu đổi trả
    if (this.isDeliveredWaitingConfirm(order)) return false;
    if (order.status !== 'DELIVERED' && (order.status as any) !== 'COMPLETED') return false;

    const rawDate = (order as any).deliveredAt || (order as any).updatedAt || order.createdAt;
    if (!rawDate) return false;
    const deliveredDate = new Date(rawDate);
    const now = new Date();
    const diffMs = now.getTime() - deliveredDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }

  /**
   * Kiểm tra đơn hàng DELIVERED có đang trong 5 phút chờ khách xác nhận hay không
   */
  isDeliveredWaitingConfirm(order: OrderSummary | OrderDetail | null | undefined): boolean {
    if (!order) return false;
    if (order.status !== 'DELIVERED') return false;
    const rawDelivered = (order as any).deliveredAt || (order as any).updatedAt;
    if (!rawDelivered) return false;
    const diffMs = Date.now() - new Date(rawDelivered).getTime();
    return diffMs >= 0 && diffMs < 5 * 60 * 1000;
  }

  /**
   * Tính số giây còn lại trước khi đơn hàng DELIVERED tự động chuyển sang Hoàn tất (sau 5 phút)
   */
  getRemainingConfirmSeconds(order: OrderSummary | OrderDetail | null | undefined): number {
    if (!this.isDeliveredWaitingConfirm(order)) return 0;
    const rawDelivered = (order as any).deliveredAt || (order as any).updatedAt;
    const diffMs = Date.now() - new Date(rawDelivered).getTime();
    return Math.max(0, Math.floor((5 * 60 * 1000 - diffMs) / 1000));
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  /**
   * Đếm tổng số loại sản phẩm khác nhau trong đơn (ví dụ: "2 sản phẩm")
   */
  getDistinctItemsCount(order: OrderSummary | OrderDetail | null | undefined): number {
    if (!order) return 1;
    const o = order as any;
    if (o.allItems && Array.isArray(o.allItems) && o.allItems.length > 0) {
      return o.allItems.length;
    }
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.length;
    }
    if (typeof o.items === 'number' && o.items > 0) {
      return o.items;
    }
    return 1;
  }

  /**
   * Đếm tổng số lượng tất cả sản phẩm trong đơn (ví dụ: "2 sản phẩm (3)")
   */
  getTotalQuantityCount(order: OrderSummary | OrderDetail | null | undefined): number {
    if (!order) return 1;
    const o = order as any;
    if (o.allItems && Array.isArray(o.allItems) && o.allItems.length > 0) {
      return o.allItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    }
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    }
    if (o.firstItem?.quantity) {
      return Number(o.firstItem.quantity);
    }
    if (typeof o.items === 'number' && o.items > 0) {
      return o.items;
    }
    return 1;
  }

  /**
   * Lấy một sản phẩm đại diện hiển thị ngoài khung thẻ theo yêu cầu
   * (nếu một đơn có nhiều sản phẩm thì hiện sản phẩm bất kỳ/đầu tiên, xem chi tiết mới hiện hết)
   */
  getRepresentativeItem(order: OrderSummary | OrderDetail | null | undefined): any {
    if (!order) return null;
    const o = order as any;
    if (o.firstItem && o.firstItem.productName) {
      return o.firstItem;
    }
    if (o.allItems && Array.isArray(o.allItems) && o.allItems.length > 0) {
      return o.allItems[0];
    }
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items[0];
    }
    return {
      productName: `Đơn hàng DCor #${o.orderNumber || ''}`,
      price: o.totalAmount || o.total || 0,
      quantity: 1,
      imageUrl: 'assets/img/furniture-placeholder.svg'
    };
  }

  /**
   * Tính thành tiền của dòng sản phẩm hiển thị góc phải
   */
  getItemLineTotal(item: any): number {
    if (!item) return 0;
    if (item.lineTotal !== undefined && item.lineTotal !== null) {
      return Number(item.lineTotal);
    }
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return price * qty;
  }

  /**
   * Nút Đã nhận hàng chỉ hiển thị khi đơn đang trong 5 phút chờ khách xác nhận
   */
  canConfirmReceived(order: OrderSummary | OrderDetail | null | undefined): boolean {
    return this.isDeliveredWaitingConfirm(order);
  }

  /**
   * Khách hàng bấm nút "Đã nhận hàng"
   */
  handleConfirmReceived(order: OrderSummary | OrderDetail, event?: Event): void {
    if (event) event.stopPropagation();

    this.orderService.confirmReceived(order.orderNumber).subscribe({
      next: () => {
        this.showToast(`Đã xác nhận nhận hàng cho đơn #${order.orderNumber}! Đơn hàng đã chuyển sang tab Hoàn tất.`, 'success');
        this.loadOrders();
        if (this.selectedOrder && this.selectedOrder.orderNumber === order.orderNumber) {
          this.openOrderDetailByNumber(order.orderNumber);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Không thể xác nhận nhận hàng. Vui lòng thử lại.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  switchTab(tabKey: string): void {
    this.activeTab = tabKey;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  /**
   * Kiểm tra đơn hàng có đang ở 1 trong 2 trạng thái cần thanh toán/đặt cọc trong 24h:
   * 1. Đơn chờ đặt cọc (isHighValue, paymentStatus !== 'PAID' && paymentStatus !== 'PARTIAL')
   * 2. Đơn chuyển khoản ngân hàng (paymentMethod === 'BANK_TRANSFER' || BANKING, paymentStatus !== 'PAID')
   */
  isAwaitingPaymentOrDeposit(order: OrderSummary | OrderDetail | null | undefined): boolean {
    if (!order) return false;
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED' || order.status === 'SHIPPED' || order.status === 'PROCESSING') {
      return false;
    }
    const isDeposit = order.isHighValue && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIAL';
    const isBankTransfer = (order.paymentMethod === 'BANK_TRANSFER' || (order.paymentMethod as any) === 'BANKING') && order.paymentStatus !== 'PAID';
    return isDeposit || isBankTransfer;
  }

  /**
   * Tính toán thời điểm hết hạn 24 giờ kể từ khi đặt đơn
   */
  getExpiryDate(order: OrderSummary | OrderDetail | null | undefined): Date | null {
    if (!order) return null;
    if (order.expiresAt) return new Date(order.expiresAt);
    if (order.createdAt) {
      return new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000);
    }
    return null;
  }

  /**
   * Khởi chạy đồng hồ đếm ngược 24 giờ cho đơn chờ thanh toán / đặt cọc
   */
  initOrderTimer(order: OrderDetail | null): void {
    this.clearOrderTimer();
    if (!order) return;

    if (!this.isAwaitingPaymentOrDeposit(order)) {
      this.remainingCountdown = '';
      this.isOrderExpired = false;
      return;
    }

    const expiry = this.getExpiryDate(order);
    if (!expiry) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = expiry.getTime() - now;

      if (diffMs <= 0) {
        this.remainingCountdown = '00:00:00 (Đã quá hạn)';
        this.isOrderExpired = true;
        this.clearOrderTimer();

        // Tự động chuyển trạng thái giao diện sang đã hủy nếu quá hạn 24h
        if (order.status !== 'CANCELLED') {
          order.status = 'CANCELLED';
          order.displayStatus = 'Đã hủy';
          order.cancelReason = 'Hệ thống tự động hủy do quá hạn đặt cọc / chuyển khoản trong vòng 24 giờ.';
          this.loadOrders();
        }
        this.cdr.markForCheck();
        return;
      }

      this.isOrderExpired = false;
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      this.remainingCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      this.cdr.markForCheck();
    };

    updateCountdown();
    this.timerInterval = setInterval(updateCountdown, 1000);
  }

  clearOrderTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  copyToClipboard(text: string, label: string): void {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`Đã sao chép ${label}!`, 'success');
      }).catch(() => {
        this.fallbackCopyText(text, label);
      });
    } else {
      this.fallbackCopyText(text, label);
    }
  }

  private fallbackCopyText(text: string, label: string): void {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    this.showToast(`Đã sao chép ${label}!`, 'success');
  }

  // Xem chi tiết đơn
  openOrderDetail(order: OrderSummary): void {
    if (!order) return;
    this.openOrderDetailByNumber(order.orderNumber, order);
  }

  // Mở chi tiết đơn hàng trực tiếp bằng mã đơn hàng (hỗ trợ chuyển hướng từ thông báo)
  openOrderDetailByNumber(orderNumber: string, fallbackSummary?: OrderSummary): void {
    if (!orderNumber) return;
    this.isDetailDrawerOpen = true;
    this.isLoadingDetail = true;
    this.remainingCountdown = '';
    this.isOrderExpired = false;

    // Tìm trong danh sách nếu chưa có fallbackSummary
    const summary = fallbackSummary || this.rawOrders.find(o => o.orderNumber === orderNumber || (o as any).id === orderNumber);
    if (summary) {
      this.selectedOrder = {
        ...summary,
        receiverName: summary.shippingInfo?.receiverName || '',
        phone: summary.shippingInfo?.phone || '',
        email: summary.shippingInfo?.email || '',
        province: summary.shippingInfo?.province || '',
        district: summary.shippingInfo?.district || '',
        ward: summary.shippingInfo?.ward || '',
        detailAddress: summary.shippingInfo?.detailAddress || '',
        items: summary.allItems || [],
        statusHistory: [],
        payments: []
      };
      this.initOrderTimer(this.selectedOrder);
    } else {
      this.selectedOrder = null;
    }
    this.cdr.markForCheck();

    this.orderService.getOrderDetail(orderNumber).subscribe({
      next: (detail) => {
        this.selectedOrder = detail;
        this.isLoadingDetail = false;
        this.initOrderTimer(detail);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDetail = false;
        if (!this.selectedOrder) {
          this.isDetailDrawerOpen = false;
          this.showToast(`Không tìm thấy chi tiết đơn hàng #${orderNumber}`, 'error');
        }
        this.cdr.markForCheck();
      }
    });
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen = false;
    this.selectedOrder = null;
    this.pendingOrderNumberToOpen = null;
    this.clearOrderTimer();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { orderNumber: null, orderId: null },
      queryParamsHandling: 'merge'
    });
    this.cdr.markForCheck();
  }

  // Mua lại đơn hàng
  reorder(order: OrderSummary | OrderDetail): void {
    const rawItems = (order as any).allItems || (order as any).items || [];
    const items = rawItems.length > 0 ? rawItems : ((order as any).firstItem ? [(order as any).firstItem] : []);

    if (items.length === 0) {
      this.showToast('Không tìm thấy thông tin sản phẩm để mua lại.', 'error');
      return;
    }

    items.forEach((item: any) => {
      this.cartService.addToCart(
        item.variantId || 'default',
        item.quantity || 1,
        item.selectedOptions || null,
        {
          productId: item.productId,
          name: item.productName,
          price: item.price,
          image: item.imageUrl
        }
      ).subscribe();
    });

    this.showToast(`Đã thêm ${items.length} sản phẩm vào giỏ hàng của bạn!`, 'success');
  }

  // Hủy đơn hàng
  openCancelModal(order: OrderSummary | OrderDetail, event?: Event): void {
    if (event) event.stopPropagation();
    this.targetOrderForCancel = order;
    this.cancelReason = this.cancelReasonOptions[0];
    this.cancelReasonNote = '';
    this.isCancelModalOpen = true;
    this.cdr.markForCheck();
  }

  confirmCancelOrder(): void {
    if (!this.targetOrderForCancel) return;

    const fullReason = this.cancelReason === 'Lý do khác' && this.cancelReasonNote
      ? `${this.cancelReason}: ${this.cancelReasonNote}`
      : this.cancelReason;

    this.orderService.cancelOrder(this.targetOrderForCancel.orderNumber, fullReason).subscribe({
      next: () => {
        this.isCancelModalOpen = false;
        this.showToast('Hủy đơn hàng thành công.', 'success');
        this.loadOrders();
        if (this.selectedOrder && this.selectedOrder.orderNumber === this.targetOrderForCancel?.orderNumber) {
          this.selectedOrder.status = 'CANCELLED';
          this.selectedOrder.displayStatus = 'Đã hủy';
          this.selectedOrder.cancelReason = fullReason;
          this.clearOrderTimer();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert(err.error?.message || 'Không thể hủy đơn hàng này.');
        this.cdr.markForCheck();
      }
    });
  }

  // Xác nhận đã nhận hàng
  confirmReceived(order: OrderSummary | OrderDetail, event?: Event): void {
    if (event) event.stopPropagation();
    if (confirm(`Bạn đã nhận được kiện hàng #${order.orderNumber} và kiểm tra hàng đầy đủ?`)) {
      this.orderService.confirmReceived(order.orderNumber).subscribe({
        next: () => {
          this.showToast('Xác nhận nhận hàng thành công. Cảm ơn bạn!', 'success');
          this.loadOrders();
          if (this.selectedOrder && this.selectedOrder.orderNumber === order.orderNumber) {
            this.selectedOrder.status = 'DELIVERED';
            this.selectedOrder.displayStatus = 'Đã giao hàng';
            this.clearOrderTimer();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          alert(err.error?.message || 'Có lỗi xảy ra.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  // Đánh giá sản phẩm
  openReviewModal(order: OrderSummary | OrderDetail, event?: Event): void {
    if (event) event.stopPropagation();
    this.targetOrderForReview = order;
    this.reviewRating = 5;
    this.reviewComment = '';
    this.isReviewModalOpen = true;
    this.cdr.markForCheck();
  }

  submitReview(): void {
    if (!this.targetOrderForReview) return;
    this.orderService.submitReview(this.targetOrderForReview.orderNumber, {
      rating: this.reviewRating,
      comment: this.reviewComment
    }).subscribe({
      next: () => {
        this.isReviewModalOpen = false;
        this.showToast('Gửi đánh giá thành công! Dcor trân trọng phản hồi của bạn.', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert(err.error?.message || 'Có lỗi khi gửi đánh giá.');
        this.cdr.markForCheck();
      }
    });
  }

  // Yêu cầu đổi trả
  openReturnModal(order: OrderSummary | OrderDetail, event?: Event): void {
    if (event) event.stopPropagation();
    this.targetOrderForReturn = order;
    this.returnReason = this.returnReasonOptions[0];
    this.returnDescription = '';
    this.returnImagesInput = '';
    this.returnUploadedImages = [];
    this.isReturnModalOpen = true;
    this.cdr.markForCheck();
  }

  onReturnImagePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Ảnh ${file.name} vượt quá dung lượng cho phép 10MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (e.target?.result && this.returnUploadedImages.length < 5) {
          this.returnUploadedImages.push(e.target.result as string);
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeReturnImage(index: number): void {
    this.returnUploadedImages.splice(index, 1);
    this.cdr.markForCheck();
  }

  submitReturnRequest(): void {
    if (!this.targetOrderForReturn) return;
    const images = this.returnUploadedImages.length > 0 
      ? this.returnUploadedImages 
      : (this.returnImagesInput ? this.returnImagesInput.split(',').map(s => s.trim()).filter(Boolean) : []);

    this.orderService.requestReturn(this.targetOrderForReturn.orderNumber, {
      reason: this.returnReason,
      description: this.returnDescription,
      images
    }).subscribe({
      next: () => {
        this.isReturnModalOpen = false;
        this.showToast('Đã gửi yêu cầu đổi trả thành công! Đơn hàng hiện đang ở tab "Chờ duyệt" của mục Yêu cầu đổi trả.', 'success');
        this.loadOrders();
        setTimeout(() => {
          this.router.navigate(['/account/returns'], { queryParams: { tab: 'PENDING' } });
        }, 1200);
        this.cdr.markForCheck();
      },
      error: (err) => {
        alert(err.error?.message || 'Không thể tạo yêu cầu đổi trả.');
        this.cdr.markForCheck();
      }
    });
  }

  // Format Helpers
  getStatusClass(status: string): string {
    switch (status) {
      case 'WAITING_DEPOSIT': return 'waiting-deposit';
      case 'PENDING': return 'pending';
      case 'CONFIRMED': return 'confirmed';
      case 'PROCESSING': return 'processing';
      case 'SHIPPED': return 'shipped';
      case 'DELIVERED': return 'delivered';
      case 'CANCELLED': return 'cancelled';
      case 'RETURNED': return 'returned';
      default: return 'default';
    }
  }

  formatCurrency(val: number): string {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  // --- CÁC HÀM XỬ LÝ THANH TEST TRẠNG THÁI (ĐỒNG BỘ VỚI ADMIN) ---
  getNextStatus(currentStatus?: string): string {
    switch (currentStatus) {
      case 'PENDING':
        return 'CONFIRMED';
      case 'CONFIRMED':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      case 'DELIVERED':
        return 'COMPLETED';
      case 'COMPLETED':
        return 'PENDING';
      case 'CANCELLED':
        return 'PENDING';
      case 'RETURNED':
        return 'PENDING';
      default:
        return 'CONFIRMED';
    }
  }

  getNextStatusActionLabel(currentStatus?: string): string {
    const next = this.getNextStatus(currentStatus);
    switch (next) {
      case 'CONFIRMED':
        return 'Xác nhận đơn (CONFIRMED)';
      case 'PROCESSING':
        return 'Chuẩn bị hàng (PROCESSING)';
      case 'SHIPPED':
        return 'Giao hàng (SHIPPED)';
      case 'DELIVERED':
        return 'Đã giao tới nơi (DELIVERED)';
      case 'COMPLETED':
        return 'Hoàn tất đơn (COMPLETED)';
      case 'PENDING':
        return 'Đặt lại: Chờ xác nhận (PENDING)';
      default:
        return next;
    }
  }

  getStatusDisplayTitle(status?: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PROCESSING': return 'Đang chuẩn bị';
      case 'SHIPPED': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao (Chờ khách nhận)';
      case 'COMPLETED': return 'Hoàn tất';
      case 'CANCELLED': return 'Đã hủy';
      case 'RETURNED': return 'Đổi trả';
      default: return status || 'Chưa rõ';
    }
  }

  testFastForward5Minutes(): void {
    const order = this.currentTestOrder;
    if (!order) {
      this.showToast('Vui lòng chọn đơn hàng.', 'error');
      return;
    }
    this.executeStatusChange(order.orderNumber, 'COMPLETED', 'Tua nhanh 5 phút: Hệ thống tự động chuyển sang Hoàn tất');
  }

  testAdvanceStatus(): void {
    const order = this.currentTestOrder;
    if (!order) {
      this.showToast('Không có đơn hàng nào để chuyển trạng thái.', 'error');
      return;
    }
    const nextStatus = this.getNextStatus(order.status);
    this.executeStatusChange(order.orderNumber, nextStatus);
  }

  testCancelCurrentOrder(): void {
    const order = this.currentTestOrder;
    if (!order) {
      this.showToast('Không có đơn hàng nào để hủy.', 'error');
      return;
    }
    if (order.status === 'CANCELLED') {
      this.showToast(`Đơn hàng #${order.orderNumber} đã ở trạng thái Đã hủy.`, 'error');
      return;
    }
    this.executeStatusChange(order.orderNumber, 'CANCELLED', 'Hủy đơn thử nghiệm qua thanh test');
  }

  testSetStatusDirectly(status: string): void {
    const order = this.currentTestOrder;
    if (!order) {
      this.showToast('Vui lòng chọn đơn hàng cần đổi trạng thái.', 'error');
      return;
    }
    this.executeStatusChange(order.orderNumber, status);
  }

  private executeStatusChange(orderNumber: string, targetStatus: string, notes?: string): void {
    this.isTestingStatus = true;
    this.cdr.markForCheck();

    this.orderService.updateOrderStatusSync(orderNumber, targetStatus, notes).subscribe({
      next: () => {
        this.isTestingStatus = false;
        const statusLabel = this.getStatusDisplayTitle(targetStatus);

        // Cập nhật ngay trong cache localStorage nếu đơn này được lưu local
        try {
          const local = JSON.parse(localStorage.getItem('dcor_placed_orders') || '[]');
          const item = local.find((it: any) => (it.id === orderNumber || it.orderNumber === orderNumber));
          if (item) {
            item.statusKey = targetStatus;
            item.status = statusLabel;
            localStorage.setItem('dcor_placed_orders', JSON.stringify(local));
          }
        } catch (_) {}

        this.showToast(`Đồng bộ Admin thành công: Đơn #${orderNumber} chuyển sang "${statusLabel}"!`, 'success');
        this.loadOrders();
        if (this.selectedOrder && this.selectedOrder.orderNumber === orderNumber) {
          this.openOrderDetailByNumber(orderNumber);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isTestingStatus = false;
        const msg = err?.error?.message || 'Không thể đồng bộ trạng thái đơn hàng sang Admin.';
        this.showToast(msg, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.autoConfirmCheckInterval) {
      clearInterval(this.autoConfirmCheckInterval);
      this.autoConfirmCheckInterval = null;
    }
    this.clearOrderTimer();
    this.sub.unsubscribe();
  }
}



