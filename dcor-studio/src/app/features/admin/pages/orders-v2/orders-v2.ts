import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  LucideAngularModule, 
  Search, Filter, RefreshCw, Eye, CheckCircle2, XCircle, Clock, Truck, 
  Package, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, 
  ChevronsRight, ShieldCheck, DollarSign, CornerDownLeft, FileText, Check, X,
  Building2, CreditCard
} from 'lucide-angular';
import { OrdersV2Service } from './services/orders-v2.service';
import { 
  OrderV2, AdminOrderStatus, PaymentStatus, UserStatusView, 
  mapAdminStatusToUserView 
} from './models/order-v2.model';

export type KpiTab = 'ALL' | 'PENDING' | 'PREPARING' | 'SHIPPING' | 'DELIVERED_COMPLETED' | 'RETURNS' | 'CANCELLED';

@Component({
  selector: 'app-orders-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-v2.html',
  styleUrls: ['./orders-v2.css']
})
export class OrdersV2Component implements OnInit, OnDestroy {
  icons = {
    Search, Filter, RefreshCw, Eye, CheckCircle2, XCircle, Clock, Truck,
    Package, AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft,
    ChevronsRight, ShieldCheck, DollarSign, CornerDownLeft, FileText, Check, X,
    Building2, CreditCard
  };

  orders: OrderV2[] = [];
  private sub?: Subscription;

  // Filters & State
  activeTab: KpiTab = 'ALL';
  searchQuery = '';
  selectedShowroom = 'ALL';
  selectedPayment = 'ALL';
  selectedStatus = 'ALL';
  sortBy: 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' = 'date-desc';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Toast
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  // Showrooms list
  readonly SHOWROOMS = [
    { id: 'ALL', name: 'Tất cả chi nhánh' },
    { id: 'Showroom Quận 7 (Flagship)', name: 'Showroom Quận 7' },
    { id: 'Showroom Thảo Điền (TP. Thủ Đức)', name: 'Showroom Thảo Điền' },
    { id: 'Kho Tổng Bình Dương', name: 'Kho Tổng Bình Dương' },
    { id: 'Online Store DCOR.vn', name: 'Online Store DCOR.vn' }
  ];

  // Payment statuses
  readonly PAYMENT_STATUSES: { id: string; name: string }[] = [
    { id: 'ALL', name: 'Tất cả thanh toán' },
    { id: 'UNPAID', name: 'Chưa thanh toán' },
    { id: 'PARTIAL', name: 'Đã cọc 30%' },
    { id: 'PAID', name: 'Đã thanh toán đủ' },
    { id: 'REFUND_PENDING', name: 'Chờ hoàn tiền' },
    { id: 'REFUNDED', name: 'Đã hoàn tiền' }
  ];

  constructor(
    private ordersService: OrdersV2Service,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.ordersService.orders$.subscribe(orders => {
      this.orders = orders;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // --- KPI COUNTS ---
  get countAll(): number {
    return this.orders.length;
  }

  get countPending(): number {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  get countPreparing(): number {
    return this.orders.filter(o => ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(o.status)).length;
  }

  get countShipping(): number {
    return this.orders.filter(o => ['SHIPPED', 'FAILED_DELIVERY'].includes(o.status)).length;
  }

  get countDeliveredCompleted(): number {
    return this.orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length;
  }

  get countReturns(): number {
    return this.orders.filter(o => ['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status)).length;
  }

  get countCancelled(): number {
    return this.orders.filter(o => o.status === 'CANCELLED').length;
  }

  // --- FILTERED ORDERS ---
  get filteredOrders(): OrderV2[] {
    let list = [...this.orders];

    // Filter by KPI Tab
    if (this.activeTab === 'PENDING') {
      list = list.filter(o => o.status === 'PENDING');
    } else if (this.activeTab === 'PREPARING') {
      list = list.filter(o => ['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(o.status));
    } else if (this.activeTab === 'SHIPPING') {
      list = list.filter(o => ['SHIPPED', 'FAILED_DELIVERY'].includes(o.status));
    } else if (this.activeTab === 'DELIVERED_COMPLETED') {
      list = list.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
    } else if (this.activeTab === 'RETURNS') {
      list = list.filter(o => ['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status));
    } else if (this.activeTab === 'CANCELLED') {
      list = list.filter(o => o.status === 'CANCELLED');
    }

    // Filter by Specific Status Dropdown
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(o => o.status === this.selectedStatus);
    }

    // Filter by Showroom
    if (this.selectedShowroom !== 'ALL') {
      list = list.filter(o => o.showroom.includes(this.selectedShowroom) || o.showroom === this.selectedShowroom);
    }

    // Filter by Payment Status
    if (this.selectedPayment !== 'ALL') {
      list = list.filter(o => o.paymentStatus === this.selectedPayment);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(o => 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        (o.deliveryInfo.trackingCode && o.deliveryInfo.trackingCode.toLowerCase().includes(q)) ||
        o.products.some(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (this.sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (this.sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (this.sortBy === 'total-desc') {
        return b.pricing.totalAmount - a.pricing.totalAmount;
      } else if (this.sortBy === 'total-asc') {
        return a.pricing.totalAmount - b.pricing.totalAmount;
      }
      return 0;
    });

    return list;
  }

  // --- PAGINATION ---
  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  get paginatedOrders(): OrderV2[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  setTab(tab: KpiTab) {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  resetFilters() {
    this.activeTab = 'ALL';
    this.searchQuery = '';
    this.selectedShowroom = 'ALL';
    this.selectedPayment = 'ALL';
    this.selectedStatus = 'ALL';
    this.sortBy = 'date-desc';
    this.currentPage = 1;
    this.triggerToast('Đã làm mới bộ lọc!', 'Toàn bộ danh sách đơn hàng đã được hiển thị lại.', 'info');
  }

  // --- ACTIONS ---
  resetMockData() {
    this.ordersService.resetToDefaultData();
    this.triggerToast('Khôi phục dữ liệu gốc thành công!', 'Đã tạo lại 11 đơn hàng mẫu đại diện cho đầy đủ 11 trạng thái workflow.', 'success');
  }

  quickAction(order: OrderV2, event: MouseEvent) {
    event.stopPropagation();
    let success = false;
    let title = '';
    let msg = '';

    switch (order.status) {
      case 'PENDING':
        if (order.isHighValue && order.paymentStatus === 'UNPAID') {
          // Open detail to let user simulate deposit first or read rule
          this.triggerToast('Cần cọc trước!', 'Đơn hàng >= 50 triệu bắt buộc cọc tối thiểu 30% trước khi xác nhận. Đang chuyển sang trang chi tiết...', 'error');
          setTimeout(() => this.router.navigate(['/admin/orders-v2', order.id]), 1200);
          return;
        }
        success = this.ordersService.confirmOrder(order.id, 'Admin Trần');
        title = 'Xác nhận đơn thành công!';
        msg = `Đơn ${order.orderNumber} đã chuyển sang trạng thái CONFIRMED (Đã xác nhận).`;
        break;

      case 'CONFIRMED':
        success = this.ordersService.startProcessing(order.id, 'Kho DCOR');
        title = 'Đã chuyển sang Kho chuẩn bị!';
        msg = `Đơn ${order.orderNumber} đã chuyển sang trạng thái PROCESSING (Đang đóng gói).`;
        break;

      case 'PROCESSING':
        success = this.ordersService.finishPackaging(order.id, 'Thủ kho Hoàng Sơn');
        title = 'Đóng gói hoàn tất!';
        msg = `Đơn ${order.orderNumber} đã chuyển sang trạng thái READY_TO_SHIP (Sẵn sàng xuất kho).`;
        break;

      case 'READY_TO_SHIP':
        success = this.ordersService.dispatchOrder(order.id, order.deliveryInfo.trackingCode || 'DCOR-SHIP-EXPRESS', 'Điều phối kho');
        title = 'Xuất kho thành công!';
        msg = `Đơn ${order.orderNumber} đã bàn giao cho ĐVC và chuyển sang SHIPPED (Đang giao hàng).`;
        break;

      case 'SHIPPED':
        success = this.ordersService.markDelivered(order.id, 'Tài xế DCOR Express');
        title = 'Giao hàng thành công!';
        msg = `Đơn ${order.orderNumber} đã chuyển sang DELIVERED (Bắt đầu đếm ngược 72h).`;
        break;

      case 'FAILED_DELIVERY':
        success = this.ordersService.rescheduleDelivery(order.id, 'Giao lại ca sáng');
        title = 'Đã lên lịch giao lại!';
        msg = `Đơn ${order.orderNumber} đã quay lại trạng thái SHIPPED để giao lại lần 2.`;
        break;

      case 'DELIVERED':
        success = this.ordersService.completeOrder(order.id, 'Hệ thống tự động / Admin');
        title = 'Chốt đơn hoàn tất!';
        msg = `Đơn ${order.orderNumber} đã hoàn tất (COMPLETED). Doanh thu và bảo hành đã ghi nhận.`;
        break;

      case 'RETURN_REQUESTED':
        success = this.ordersService.approveReturn(order.id, 'CSKH DCOR');
        title = 'Đã chấp nhận yêu cầu trả hàng!';
        msg = `Đơn ${order.orderNumber} chuyển sang RETURNING (Đang thu hồi sản phẩm về kho).`;
        break;

      case 'RETURNING':
        success = this.ordersService.receiveReturnQC(order.id, {
          inspector: 'QC Kho Bình Dương',
          condition: 'Đầy đủ phụ kiện, nguyên thùng',
          defectAssessment: 'Lỗi thẩm mỹ nhẹ trong quá trình vận chuyển',
          refundPercent: 100,
          restockOption: 'RESTOCK_SALE'
        }, 'QC Kho');
        title = 'QC tiếp nhận thành công!';
        msg = `Đơn ${order.orderNumber} đã kiểm định xong, chuyển sang RETURNED (Chờ hoàn tiền).`;
        break;

      case 'RETURNED':
        success = this.ordersService.refundOrder(order.id, 'REFUND-VNPAY-88992', 'Kế toán DCOR');
        title = 'Hoàn tiền thành công!';
        msg = `Đã hoàn tiền cho đơn ${order.orderNumber}. Quy trình đổi trả kết thúc.`;
        break;

      default:
        this.router.navigate(['/admin/orders-v2', order.id]);
        return;
    }

    if (success) {
      this.triggerToast(title, msg, 'success');
    }
  }

  // --- HELPERS & FORMATTERS ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit' 
    });
  }

  getAdminStatusMeta(status: AdminOrderStatus) {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', dept: 'CSKH', nextBtn: 'Xác nhận đơn' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', bg: '#E0F2FE', color: '#0284C7', border: '#BAE6FD', dept: 'Thủ kho', nextBtn: 'Nhặt hàng' };
      case 'PROCESSING':
        return { label: 'Đang chuẩn bị', bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE', dept: 'Đóng gói', nextBtn: 'Đóng gói xong' };
      case 'READY_TO_SHIP':
        return { label: 'Sẵn sàng xuất kho', bg: '#FCE7F3', color: '#DB2777', border: '#FBCFE8', dept: 'Xuất kho', nextBtn: 'Xuất kho ĐVC' };
      case 'SHIPPED':
        return { label: 'Đang giao hàng', bg: '#E0E7FF', color: '#4F46E5', border: '#C7D2FE', dept: 'Vận chuyển', nextBtn: 'Giao xong' };
      case 'FAILED_DELIVERY':
        return { label: 'Giao thất bại', bg: '#FEE2E2', color: '#DC2626', border: '#FECACA', dept: 'Điều phối', nextBtn: 'Giao lại' };
      case 'DELIVERED':
        return { label: 'Đã giao hàng (72h)', bg: '#D1FAE5', color: '#059669', border: '#A7F3D0', dept: 'Khách hàng', nextBtn: 'Chốt sớm' };
      case 'COMPLETED':
        return { label: 'Đã hoàn tất', bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC', dept: 'Kế toán', nextBtn: 'Chi tiết' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', dept: 'Đóng đơn', nextBtn: 'Xem đơn' };
      case 'RETURN_REQUESTED':
        return { label: 'Yêu cầu trả hàng', bg: '#FFEDD5', color: '#EA580C', border: '#FED7AA', dept: 'CSKH duyệt', nextBtn: 'Duyệt trả' };
      case 'RETURNING':
        return { label: 'Đang thu hồi', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', dept: 'Kho nhận', nextBtn: 'Nhận & QC' };
      case 'RETURNED':
        return { label: 'Đã trả hàng', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA', dept: 'Kế toán', nextBtn: 'Hoàn tiền' };
      default:
        return { label: status, bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', dept: 'Hệ thống', nextBtn: 'Xem' };
    }
  }

  getUserView(status: AdminOrderStatus): UserStatusView {
    return mapAdminStatusToUserView(status);
  }

  getPaymentMeta(status: PaymentStatus) {
    switch (status) {
      case 'PAID':
        return { label: 'Đã thanh toán đủ', bg: '#DCFCE7', color: '#16A34A' };
      case 'PARTIAL':
        return { label: 'Đã cọc 30%', bg: '#E0F2FE', color: '#0284C7' };
      case 'UNPAID':
        return { label: 'Chưa thanh toán (COD)', bg: '#FEF3C7', color: '#D97706' };
      case 'REFUND_PENDING':
        return { label: 'Chờ hoàn tiền', bg: '#FFEDD5', color: '#EA580C' };
      case 'REFUNDED':
        return { label: 'Đã hoàn tiền', bg: '#FEE2E2', color: '#DC2626' };
      default:
        return { label: status, bg: '#F3F4F6', color: '#6B7280' };
    }
  }

  triggerToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 4500);
  }

  closeToast() {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
