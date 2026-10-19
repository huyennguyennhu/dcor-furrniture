import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  OrderV2, AdminOrderStatus, PaymentStatus, OrderProductV2, 
  DeliveryInfoV2, ReturnInfoV2, QcChecklistV2, AuditLogV2 
} from '../models/order-v2.model';

const STORAGE_KEY = 'dcor_orders_v2_store';

@Injectable({
  providedIn: 'root'
})
export class OrdersV2Service {
  private ordersSubject = new BehaviorSubject<OrderV2[]>([]);
  public orders$: Observable<OrderV2[]> = this.ordersSubject.asObservable();

  constructor() {
    this.initOrders();
  }

  private initOrders() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.ordersSubject.next(parsed);
          return;
        }
      } catch (_) {}
    }
    this.resetToDefaultData();
  }

  private save(orders: OrderV2[]) {
    this.ordersSubject.next([...orders]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (_) {}
  }

  get orders(): OrderV2[] {
    return this.ordersSubject.getValue();
  }

  getOrderById(id: string): OrderV2 | undefined {
    return this.orders.find(o => o.id === id || o.orderNumber === id);
  }

  // =========================================================================
  // STATE MACHINE TRANSITIONS (MOCK ACTION METHODS WITH AUDIT TRAIL)
  // =========================================================================

  // 1. PENDING -> CONFIRMED
  confirmOrder(orderId: string, staffName: string = 'Admin Tran'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    // Rule: Nếu đơn lớn (>50tr) bắt buộc phải cọc >= 30%
    if (order.isHighValue && order.paymentStatus === 'UNPAID') {
      alert('Không thể xác nhận: Đơn hàng giá trị lớn (>= 50 triệu) bắt buộc phải thu cọc tối thiểu 30% trước khi duyệt vào kho!');
      return false;
    }

    order.status = 'CONFIRMED';
    this.addAuditLog(order, staffName, 'Xác nhận đơn hàng', 'Đã liên hệ xác minh thông tin khách và chỉ định kho xuất.');
    this.save(orders);
    return true;
  }

  // 2. PENDING / CONFIRMED -> CANCELLED
  cancelOrder(orderId: string, reason: string, staffName: string = 'Admin Tran'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'CANCELLED';
    order.cancelReason = reason || 'Khách đổi ý không tiếp tục đặt hàng';
    order.cancelledBy = staffName;

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIAL') {
      order.paymentStatus = 'REFUND_PENDING';
      this.addAuditLog(order, staffName, 'Hủy đơn hàng & Yêu cầu hoàn tiền', `Lý do: ${order.cancelReason}. Đã chuyển lệnh hoàn tiền sang kế toán.`);
    } else {
      this.addAuditLog(order, staffName, 'Hủy đơn hàng', `Lý do: ${order.cancelReason}. Đã nhả số lượng tồn kho giữ chỗ.`);
    }

    this.save(orders);
    return true;
  }

  // 3. CONFIRMED -> PROCESSING
  startProcessing(orderId: string, staffName: string = 'Thủ kho Hoàng Sơn'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'PROCESSING';
    this.addAuditLog(order, staffName, 'Bắt đầu xử lý kho', 'In phiếu nhặt hàng (Pick-list) và đưa sản phẩm vào khu vực đóng gói.');
    this.save(orders);
    return true;
  }

  // 4. PROCESSING -> READY_TO_SHIP
  finishPackaging(orderId: string, checklist: QcChecklistV2, staffName: string = 'Thủ kho Hoàng Sơn'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.qcChecklist = { ...checklist };
    order.status = 'READY_TO_SHIP';
    this.addAuditLog(order, staffName, 'Hoàn tất đóng gói', 'Đã kiểm tra ngoại quan QC, bọc xốp EVA 4 cạnh và đưa kiện ra sàn chờ xe lấy.');
    this.save(orders);
    return true;
  }

  updateQcChecklist(orderId: string, checklist: QcChecklistV2): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    order.qcChecklist = { ...checklist };
    this.save(orders);
    return true;
  }

  // 5. READY_TO_SHIP -> SHIPPED
  dispatchOrder(orderId: string, deliveryData: { provider: string; trackingCode: string; driverName?: string; driverPhone?: string; vehiclePlate?: string }, staffName: string = 'Điều phối viên'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    if (!deliveryData.trackingCode || deliveryData.trackingCode.trim() === '') {
      alert('Vui lòng nhập Mã vận đơn trước khi xác nhận xuất kho!');
      return false;
    }

    order.status = 'SHIPPED';
    order.delivery.provider = deliveryData.provider;
    order.delivery.trackingCode = deliveryData.trackingCode;
    order.delivery.driverName = deliveryData.driverName || 'Nguyễn Văn Tài';
    order.delivery.driverPhone = deliveryData.driverPhone || '0988112233';
    order.delivery.vehiclePlate = deliveryData.vehiclePlate || '51D-998.24';
    order.delivery.estimatedDate = '3 - 5 ngày làm việc';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: 'Xuất kho thành công',
      description: `Bàn giao cho ${deliveryData.provider}. Mã vận đơn: ${deliveryData.trackingCode}`,
      location: order.showroom
    });

    this.addAuditLog(order, staffName, 'Xác nhận xuất kho & Bàn giao xe', `Đã trừ tồn kho vật lý. Đơn vị vận chuyển: ${deliveryData.provider} (${deliveryData.trackingCode}).`);
    this.save(orders);
    return true;
  }

  // 6. SHIPPED -> DELIVERED
  markDelivered(orderId: string, staffName: string = 'Tài xế / Webhook ĐVC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'DELIVERED';
    order.deliveredAt = this.getNowFormatted();
    if (order.paymentStatus === 'UNPAID') {
      order.paymentStatus = 'PAID';
    }

    order.delivery.trackingHistory.unshift({
      time: order.deliveredAt,
      status: 'Giao hàng thành công',
      description: 'Khách đã nhận kiện hàng và ký biên bản giao nhận.',
      location: order.address
    });

    this.addAuditLog(order, staffName, 'Giao hàng thành công', 'Khách đã nhận hàng. Bắt đầu kích hoạt thời hạn 72h hỗ trợ đổi trả.');
    this.save(orders);
    return true;
  }

  // 7. SHIPPED -> FAILED_DELIVERY
  markDeliveryFailed(orderId: string, reason: string, staffName: string = 'Tài xế / Webhook ĐVC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'FAILED_DELIVERY';
    order.delivery.failedAttempts += 1;
    order.delivery.failureReason = reason || 'Không liên lạc được với khách hàng qua SĐT';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: `Giao thất bại (Lần ${order.delivery.failedAttempts})`,
      description: `Lý do: ${order.delivery.failureReason}`,
      location: order.address
    });

    this.addAuditLog(order, staffName, `Ghi nhận giao thất bại (Lần ${order.delivery.failedAttempts})`, order.delivery.failureReason);
    this.save(orders);
    return true;
  }

  // 8. FAILED_DELIVERY -> SHIPPED (Lên lịch giao lại)
  rescheduleDelivery(orderId: string, newDateStr: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'SHIPPED';
    order.delivery.estimatedDate = newDateStr || 'Hẹn giao lại ngày mai';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: 'Lên lịch giao lại',
      description: `Đã hẹn lại giờ giao với khách: ${order.delivery.estimatedDate}`,
      location: order.showroom
    });

    this.addAuditLog(order, staffName, 'Hẹn lịch giao lại', `Đã liên lạc khách hẹn lịch giao lại: ${order.delivery.estimatedDate}`);
    this.save(orders);
    return true;
  }

  // 9. DELIVERED -> COMPLETED
  completeOrder(orderId: string, staffName: string = 'Hệ thống tự động'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'COMPLETED';
    order.completedAt = this.getNowFormatted();
    order.warrantyCode = `BH-DCOR-${order.orderNumber.replace('DCOR-ORD-', '')}`;

    this.addAuditLog(order, staffName, 'Hoàn tất đơn hàng vĩnh viễn', `Đã hết hạn 72h đổi trả. Ghi nhận doanh thu thực nhận: ${order.totalAmount.toLocaleString('vi-VN')}đ. Kích hoạt mã bảo hành ${order.warrantyCode}.`);
    this.save(orders);
    return true;
  }

  // 10. DELIVERED -> RETURN_REQUESTED
  requestReturn(orderId: string, returnData: { reason: string; customerNote?: string; type: 'REFUND' | 'EXCHANGE'; proofImages: string[] }): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'RETURN_REQUESTED';
    order.returnInfo = {
      requestedAt: this.getNowFormatted(),
      reason: returnData.reason,
      type: returnData.type,
      proofImages: returnData.proofImages,
      customerNote: returnData.customerNote
    };

    this.addAuditLog(order, 'Khách hàng', 'Gửi yêu cầu đổi/trả hàng', `Lý do: ${returnData.reason}. Kèm ${returnData.proofImages.length} ảnh chứng cứ.`);
    this.save(orders);
    return true;
  }

  // 11. RETURN_REQUESTED -> RETURNING (Chấp thuận)
  approveReturn(orderId: string, note: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'RETURNING';
    this.addAuditLog(order, staffName, 'Chấp thuận yêu cầu đổi trả', `Ghi chú duyệt: ${note}. Đang điều phối xe tải tới nhà khách thu hồi kiện hàng.`);
    this.save(orders);
    return true;
  }

  // 12. RETURN_REQUESTED -> COMPLETED (Từ chối)
  rejectReturn(orderId: string, rejectionReason: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'COMPLETED';
    order.returnInfo.rejectionReason = rejectionReason;
    this.addAuditLog(order, staffName, 'Từ chối yêu cầu đổi trả', `Lý do từ chối: ${rejectionReason}. Đơn hàng chuyển sang Hoàn tất.`);
    this.save(orders);
    return true;
  }

  // 13. RETURNING -> RETURNED (Kho nhận hàng QC)
  receiveReturnQC(orderId: string, qcReport: any, staffName: string = 'Thủ kho QC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'RETURNED';
    order.returnInfo.qcReport = qcReport;
    order.returnInfo.refundAmount = (order.totalAmount * qcReport.refundPercent) / 100;
    order.paymentStatus = 'REFUND_PENDING';

    this.addAuditLog(order, staffName, 'Kiểm định QC hàng thu hồi', `Tình trạng: ${qcReport.condition}. Đề xuất hoàn tiền: ${qcReport.refundPercent}% (${order.returnInfo.refundAmount?.toLocaleString('vi-VN')}đ).`);
    this.save(orders);
    return true;
  }

  // 14. RETURNED -> REFUNDED
  refundOrder(orderId: string, transactionCode: string, staffName: string = 'Kế toán'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.paymentStatus = 'REFUNDED';
    if (order.returnInfo) {
      order.returnInfo.refundTransactionCode = transactionCode || 'VNPAY-REF-99812';
    }

    this.addAuditLog(order, staffName, 'Xác nhận hoàn tiền thành công', `Mã GD hoàn tiền: ${transactionCode || 'VNPAY-REF-99812'}. Đóng hồ sơ đơn hàng.`);
    this.save(orders);
    return true;
  }

  // Helper testing method: Giả lập khách chuyển tiền cọc 30% để test mở khóa nút Xác nhận ở PENDING
  mockSimulateDepositPaid(orderId: string): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.depositPaid = order.depositRequired;
    order.paymentStatus = 'PARTIAL';
    order.remainingAmount = order.totalAmount - order.depositPaid;

    this.addAuditLog(order, 'Hệ thống Kế toán', 'Ghi nhận chuyển khoản cọc', `Đã nhận tiền cọc: ${order.depositPaid.toLocaleString('vi-VN')}đ. Đủ điều kiện xác nhận đơn.`);
    this.save(orders);
    return true;
  }

  private addAuditLog(order: OrderV2, actor: string, action: string, detail: string) {
    order.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: this.getNowFormatted(),
      actor,
      action,
      detail
    });
  }

  private getNowFormatted(): string {
    const d = new Date();
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // =========================================================================
  // DEFAULT 11 MOCK ORDERS REPRESENTING ALL STATES
  // =========================================================================
  resetToDefaultData() {
    const initialOrders: OrderV2[] = [
      // 1. PENDING (Đơn lớn >50tr chưa cọc)
      {
        id: 'ord-101',
        orderNumber: 'DCOR-ORD-101',
        createdAt: '19/10/2026 10:30',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Nguyễn Văn Minh',
        phone: '0901234567',
        email: 'minh.nguyen@gmail.com',
        address: '239 Hoàng Diệu, Phường 8, Quận 4',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 4',
        ward: 'Phường 8',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-101-1',
            name: 'Sofa Indivi 2.5 chỗ',
            sku: 'SF-IND-01',
            variant: 'Chân gỗ sồi, Vải nỉ Copenhagen Nâu',
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
            price: 51290000,
            quantity: 1,
            lineTotal: 51290000,
            stockAvailable: 3
          }
        ],
        subTotal: 51290000,
        shippingFee: 500000,
        discountAmount: 500000,
        totalAmount: 51290000,
        depositRequired: 15387000, // 30%
        depositPaid: 0,
        remainingAmount: 51290000,
        isHighValue: true,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Giao hàng buổi sáng giúp mình, gọi trước 30 phút nhé!',
        internalNotes: 'Khách VIP căn hộ Masteri Millennium. Cần gọi xác nhận cọc sớm.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 10:30', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website', location: 'Website DCor' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-1', timestamp: '19/10/2026 10:30', actor: 'Nguyễn Văn Minh (Khách hàng)', action: 'Đặt hàng qua Web', detail: 'Tạo đơn hàng chuyển khoản.' }
        ]
      },

      // 2. CONFIRMED (Đã duyệt đơn, chờ kho xử lý)
      {
        id: 'ord-102',
        orderNumber: 'DCOR-ORD-102',
        createdAt: '19/10/2026 09:15',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Lê Thu Trang',
        phone: '0912345678',
        email: 'trang.le@gmail.com',
        address: 'Khu công nghệ cao, Phường Tân Phú, Quận 9',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 9',
        ward: 'Phường Tân Phú',
        showroom: 'Showroom Thủ Đức',
        items: [
          {
            id: 'item-102-1',
            name: 'Bàn ăn 6 ghế Gỗ Sồi Bắc Âu',
            sku: 'TB-OAK-06',
            variant: '1m8 - Gỗ tự nhiên, Ghế đệm nỉ xám',
            imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80',
            price: 25000000,
            quantity: 1,
            lineTotal: 25000000,
            stockAvailable: 5
          }
        ],
        subTotal: 25000000,
        shippingFee: 300000,
        discountAmount: 300000,
        totalAmount: 25000000,
        depositRequired: 0,
        depositPaid: 25000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: true,
        customerNote: 'Chúc mừng tân gia em gái. Vui lòng gói quà đẹp!',
        internalNotes: 'Đã nhận đủ thanh toán qua VNPAY. Tồn kho Thủ Đức sẵn 5 cái.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 09:15', status: 'Đặt hàng thành công', description: 'Đã thanh toán qua VNPAY', location: 'Cổng VNPAY' },
            { time: '19/10/2026 09:45', status: 'Admin duyệt đơn', description: 'Chỉ định xuất hàng tại Showroom Thủ Đức', location: 'Showroom Thủ Đức' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-2', timestamp: '19/10/2026 09:45', actor: 'Admin Tran', action: 'Duyệt đơn hàng', detail: 'Xác nhận thông tin & gán kho Thủ Đức.' },
          { id: 'log-1', timestamp: '19/10/2026 09:15', actor: 'Hệ thống VNPAY', action: 'Thanh toán thành công', detail: 'Mã GD: VNP1448992.' }
        ]
      },

      // 3. PROCESSING (Kho đang nhặt hàng & đóng gói)
      {
        id: 'ord-103',
        orderNumber: 'DCOR-ORD-103',
        createdAt: '18/10/2026 14:20',
        status: 'PROCESSING',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'INSTALLMENT',
        customerName: 'Phạm Thị Hương',
        phone: '0988776655',
        email: 'huong.pham@outlook.com',
        address: '45 Lê Lợi, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Kho Tổng Hóc Môn',
        items: [
          {
            id: 'item-103-1',
            name: 'Giường ngủ thông minh 1m8',
            sku: 'BD-SMART-18',
            variant: 'Bọc da bò Ý cao cấp, tích hợp cổng sạc & massage',
            imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
            price: 125000000,
            quantity: 1,
            lineTotal: 125000000,
            stockAvailable: 2
          }
        ],
        subTotal: 125000000,
        shippingFee: 0,
        discountAmount: 5000000,
        totalAmount: 120000000,
        depositRequired: 36000000,
        depositPaid: 36000000,
        remainingAmount: 84000000,
        isHighValue: true,
        isCustomDesign: true,
        isGift: false,
        internalNotes: 'Khách làm hợp đồng trả góp qua HD Saison. Đang bọc xốp EVA bảo vệ.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 14:20', status: 'Tạo đơn', description: 'Đơn trả góp đặt cọc 30%', location: 'Website' },
            { time: '18/10/2026 16:00', status: 'Bắt đầu nhặt hàng', description: 'Thủ kho in phiếu Pick-list', location: 'Kho Tổng' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-3', timestamp: '18/10/2026 16:00', actor: 'Thủ kho Hoàng Sơn', action: 'Bắt đầu nhặt hàng', detail: 'Đang kiểm tra chất lượng nệm da và kết cấu nâng hạ.' },
          { id: 'log-2', timestamp: '18/10/2026 15:00', actor: 'Admin Tran', action: 'Duyệt hồ sơ trả góp', detail: 'Đã nhận cọc 36 triệu.' }
        ]
      },

      // 4. READY_TO_SHIP (Hàng đóng gói xong, chờ xe bốc hàng ở cửa kho)
      {
        id: 'ord-104',
        orderNumber: 'DCOR-ORD-104',
        createdAt: '18/10/2026 08:30',
        status: 'READY_TO_SHIP',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Vũ Đức Thành',
        phone: '0966889900',
        email: 'thanh.vu@gmail.com',
        address: '55 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-104-1',
            name: 'Kệ tivi Como gỗ óc chó tự nhiên',
            sku: 'TV-COMO-02',
            variant: '2m2 - Chân thép mạ vàng PVD',
            imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
            price: 22000000,
            quantity: 1,
            lineTotal: 22000000,
            stockAvailable: 4
          }
        ],
        subTotal: 22000000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 22000000,
        depositRequired: 0,
        depositPaid: 22000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        internalNotes: 'Đã đóng bọc xốp 4 góc, dán tem mã kiện hàng đầy đủ. Chờ GHN đến quét mã.',
        delivery: {
          provider: 'Giao Hàng Nhanh (GHN)',
          trackingCode: 'GHN-8849201',
          driverName: 'Trần Văn Mạnh (Shipper GHN)',
          driverPhone: '0977334455',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 08:30', status: 'Đặt hàng thành công', description: 'Đã nhận chuyển khoản', location: 'Showroom Q1' },
            { time: '18/10/2026 11:00', status: 'Đóng gói hoàn tất', description: 'Kiện hàng sẵn sàng tại cửa kho', location: 'Kho xuất hàng Q1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-3', timestamp: '18/10/2026 11:00', actor: 'Thủ kho Hoàng Sơn', action: 'Hoàn tất đóng gói QC', detail: 'Đã tạo mã vận đơn GHN-8849201.' }
        ]
      },

      // 5. SHIPPED (Đang trên xe vận chuyển)
      {
        id: 'ord-105',
        orderNumber: 'DCOR-ORD-105',
        createdAt: '17/10/2026 10:00',
        status: 'SHIPPED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'COD',
        customerName: 'Hoàng Quốc Việt',
        phone: '0977112233',
        email: 'viet.hoang@vietcorp.vn',
        address: '120 Võ Văn Tần, Phường 6, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 6',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-105-1',
            name: 'Sofa Indivi 3 chỗ (Chân thép, Da Napoli đen)',
            sku: 'SF-IND-02',
            variant: 'Da Napoli đen, Dài 2m6',
            imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=400&q=80',
            price: 80000000,
            quantity: 1,
            lineTotal: 80000000,
            stockAvailable: 2
          },
          {
            id: 'item-105-2',
            name: 'Bàn trà Coda mặt kính khói',
            sku: 'TB-CODA-01',
            variant: 'Đường kính 90cm - Thép sơn tĩnh điện',
            imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=400&q=80',
            price: 10000000,
            quantity: 1,
            lineTotal: 10000000,
            stockAvailable: 4
          }
        ],
        subTotal: 90000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 90000000,
        depositRequired: 27000000,
        depositPaid: 27000000,
        remainingAmount: 63000000, // Cần thu COD 63 triệu
        isHighValue: true,
        isCustomDesign: false,
        isGift: false,
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-09',
          driverName: 'Đặng Quốc Huy',
          driverPhone: '0933556677',
          vehiclePlate: '51C-778.92',
          estimatedDate: 'Hôm nay (Dự kiến 16:30)',
          failedAttempts: 0,
          trackingHistory: [
            { time: '17/10/2026 14:00', status: 'Xuất kho', description: 'Xe tải bốc hàng rời kho Q1', location: 'Showroom Q1' },
            { time: '17/10/2026 15:30', status: 'Đang di chuyển', description: 'Xe tải đang trên đường tới Quận 3', location: 'Quận 3' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-3', timestamp: '17/10/2026 14:00', actor: 'Điều phối viên', action: 'Bàn giao xe tải', detail: 'Tài xế Đặng Quốc Huy phụ trách thu COD 63.000.000đ.' }
        ]
      },

      // 6. FAILED_DELIVERY (Giao thất bại lần 1, đang hẹn giao lại)
      {
        id: 'ord-106',
        orderNumber: 'DCOR-ORD-106',
        createdAt: '16/10/2026 11:20',
        status: 'FAILED_DELIVERY',
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        customerName: 'Đỗ Mỹ Linh',
        phone: '0944556677',
        email: 'mylinh.do@gmail.com',
        address: '78 Thảo Điền, Phường Thảo Điền, Thành phố Thủ Đức',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Thành phố Thủ Đức',
        ward: 'Phường Thảo Điền',
        showroom: 'Showroom Thủ Đức',
        items: [
          {
            id: 'item-106-1',
            name: 'Bàn làm việc Minimalist Gỗ Óc Chó',
            sku: 'DK-MINI-01',
            variant: '1m4 x 70cm - Ngăn kéo ray giảm chấn',
            imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
            price: 18500000,
            quantity: 1,
            lineTotal: 18500000,
            stockAvailable: 2
          }
        ],
        subTotal: 18500000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 18500000,
        depositRequired: 0,
        depositPaid: 18500000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-02',
          driverName: 'Nguyễn Văn Hùng',
          driverPhone: '0908889999',
          vehiclePlate: '51D-123.45',
          failedAttempts: 1,
          failureReason: 'Gọi 3 cuộc khách không nghe máy, nhà khóa cổng vắng người.',
          trackingHistory: [
            { time: '17/10/2026 16:30', status: 'Giao thất bại', description: 'Gọi 3 cuộc khách không nghe máy, nhà khóa cổng', location: 'Thảo Điền, Thủ Đức' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-4', timestamp: '17/10/2026 16:35', actor: 'Tài xế Nguyễn Văn Hùng', action: 'Báo giao thất bại lần 1', detail: 'Khách đi vắng, bảo vệ tòa nhà không nhận thay.' }
        ]
      },

      // 7. DELIVERED (Đã nhận hàng, đang đếm ngược 72h)
      {
        id: 'ord-107',
        orderNumber: 'DCOR-ORD-107',
        createdAt: '16/10/2026 09:00',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Bùi Thanh Hằng',
        phone: '0938221100',
        email: 'hang.bui@hotmail.com',
        address: 'Villa 12, Khu đô thị Sala, Quận 2',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 2',
        ward: 'Phường An Lợi Đông',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-107-1',
            name: 'Ghế bành thư giãn Armchair Como',
            sku: 'AC-COMO-01',
            variant: 'Vải nỉ lông cừu Bouclé Trắng kem',
            imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&q=80',
            price: 16000000,
            quantity: 1,
            lineTotal: 16000000,
            stockAvailable: 3
          }
        ],
        subTotal: 16000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 16000000,
        depositRequired: 0,
        depositPaid: 16000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '18/10/2026 15:30', // Đã qua khoảng 23h
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-05',
          driverName: 'Phan Văn Đức',
          driverPhone: '0919998877',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 15:30', status: 'Giao hàng thành công', description: 'Khách đã nghiệm thu và ký biên bản giao nhận', location: 'Sala, Q2' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-5', timestamp: '18/10/2026 15:30', actor: 'Tài xế Phan Văn Đức', action: 'Xác nhận giao thành công', detail: 'Khách ký biên bản bàn giao. Đang đếm ngược 72h đổi trả.' }
        ]
      },

      // 8. COMPLETED (Hoàn tất vĩnh viễn, khóa đơn, chốt doanh thu)
      {
        id: 'ord-108',
        orderNumber: 'DCOR-ORD-108',
        createdAt: '10/10/2026 14:00',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Trịnh Đình Quang',
        phone: '0918776655',
        email: 'quang.trinh@gmail.com',
        address: '15 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Đa Kao',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-108-1',
            name: 'Tủ quần áo 4 cánh Gỗ Sồi tự nhiên',
            sku: 'WR-OAK-04',
            variant: '2m x 2m2 - Bản lề Blum giảm chấn',
            imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=400&q=80',
            price: 38000000,
            quantity: 1,
            lineTotal: 38000000,
            stockAvailable: 1
          }
        ],
        subTotal: 38000000,
        shippingFee: 0,
        discountAmount: 1000000,
        totalAmount: 37000000,
        depositRequired: 0,
        depositPaid: 37000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '12/10/2026 10:00',
        completedAt: '15/10/2026 10:00',
        warrantyCode: 'BH-DCOR-ORD-108',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-01',
          failedAttempts: 0,
          trackingHistory: [
            { time: '12/10/2026 10:00', status: 'Giao hàng thành công', description: 'Đã hoàn thiện lắp đặt tại phòng ngủ', location: 'Quận 1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-6', timestamp: '15/10/2026 10:00', actor: 'Hệ thống Cron Job', action: 'Hoàn tất đơn hàng tự động', detail: 'Hết 72h đổi trả không khiếu nại. Chốt doanh thu 37 triệu và kích hoạt mã BH-DCOR-ORD-108.' }
        ]
      },

      // 9. CANCELLED (Đã hủy do khách đổi ý)
      {
        id: 'ord-109',
        orderNumber: 'DCOR-ORD-109',
        createdAt: '15/10/2026 09:30',
        status: 'CANCELLED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        customerName: 'Ngô Kiến Huy',
        phone: '0909090909',
        email: 'huy.ngo@yahoo.com',
        address: '12 Tôn Đức Thắng, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-109-1',
            name: 'Sofa băng văng da bò Cognac',
            sku: 'SF-VANG-01',
            variant: '2m - Da Microfiber cao cấp',
            imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=400&q=80',
            price: 42000000,
            quantity: 1,
            lineTotal: 42000000,
            stockAvailable: 2
          }
        ],
        subTotal: 42000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 42000000,
        depositRequired: 0,
        depositPaid: 0,
        remainingAmount: 42000000,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        cancelReason: 'Khách hàng đổi ý mua mẫu khác tại cửa hàng',
        cancelledBy: 'Ngô Kiến Huy (Khách tự hủy)',
        delivery: {
          provider: 'Chưa chỉ định',
          failedAttempts: 0,
          trackingHistory: []
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-2', timestamp: '15/10/2026 10:15', actor: 'Khách hàng', action: 'Hủy đơn hàng', detail: 'Khách hủy trực tiếp qua trang tài khoản cá nhân. Đã nhả tồn kho.' }
        ]
      },

      // 10. RETURN_REQUESTED (Khách khiếu nại yêu cầu đổi trả, có ảnh lỗi)
      {
        id: 'ord-110',
        orderNumber: 'DCOR-ORD-110',
        createdAt: '14/10/2026 15:00',
        status: 'RETURN_REQUESTED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Dương Cẩm Lynh',
        phone: '0937665544',
        email: 'lynh.duong@gmail.com',
        address: 'Penthouse B2, Landmark 81, Bình Thạnh',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận Bình Thạnh',
        ward: 'Phường 22',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-110-1',
            name: 'Bàn trà Coda mặt đá Ceramic bóng',
            sku: 'TB-CODA-03',
            variant: 'Mặt đá vân mây trắng, viền vàng kim',
            imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=400&q=80',
            price: 10000000,
            quantity: 1,
            lineTotal: 10000000,
            stockAvailable: 3
          }
        ],
        subTotal: 10000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 10000000,
        depositRequired: 0,
        depositPaid: 10000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '17/10/2026 14:00',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-07',
          failedAttempts: 0,
          trackingHistory: [
            { time: '17/10/2026 14:00', status: 'Giao hàng thành công', description: 'Khách nhận kiện hàng', location: 'Landmark 81' }
          ]
        },
        returnInfo: {
          requestedAt: '18/10/2026 09:30',
          reason: 'Mặt đá nứt góc cạnh khi mở thùng kiểm tra',
          type: 'REFUND',
          customerNote: 'Lúc nhận hàng vội đi làm chưa bóc bọc xốp, sáng nay bóc ra thấy mặt đá bị nứt góc 5cm. Đề nghị đổi mặt mới hoặc hoàn tiền.',
          proofImages: [
            'https://images.unsplash.com/photo-1581404481488-cb9e68b377b2?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-4', timestamp: '18/10/2026 09:30', actor: 'Dương Cẩm Lynh (Khách hàng)', action: 'Yêu cầu trả hàng & hoàn tiền', detail: 'Khiếu nại mặt đá nứt góc. Đính kèm 2 ảnh chụp hiện trường.' }
        ]
      },

      // 11. RETURNED (Đã thu hồi hàng về kho QC, chờ kế toán chuyển tiền hoàn)
      {
        id: 'ord-111',
        orderNumber: 'DCOR-ORD-111',
        createdAt: '12/10/2026 10:00',
        status: 'RETURNED',
        paymentStatus: 'REFUND_PENDING',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Tô Đình Khánh',
        phone: '0978999111',
        email: 'khanh.to@gmail.com',
        address: '88 Lê Văn Sỹ, Phường 13, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 13',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-111-1',
            name: 'Đèn thả trần Scandinavia Art',
            sku: 'LP-SCAN-02',
            variant: 'Khung đồng thau nguyên khối',
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            price: 8000000,
            quantity: 1,
            lineTotal: 8000000,
            stockAvailable: 2
          }
        ],
        subTotal: 8000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 8000000,
        depositRequired: 0,
        depositPaid: 8000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '14/10/2026 11:00',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-03',
          failedAttempts: 0,
          trackingHistory: [
            { time: '14/10/2026 11:00', status: 'Giao thành công', description: 'Khách nhận đèn', location: 'Quận 3' }
          ]
        },
        returnInfo: {
          requestedAt: '15/10/2026 09:00',
          reason: 'Lắp lên trần không vừa kích thước phòng',
          type: 'REFUND',
          customerNote: 'Phòng khách nhà trần thấp quá không treo đèn thả dài được, xin phép hoàn lại.',
          proofImages: [
            'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
          ],
          qcReport: {
            inspector: 'Kỹ thuật viên Quang Huy',
            condition: 'Hàng còn nguyên thùng hộp, chóa đèn và dây đúc không trầy xước, phụ kiện đủ 100%.',
            defectAssessment: 'Đạt chuẩn 100% nhập lại kho bán mới.',
            refundPercent: 100,
            restockOption: 'RESTOCK_SALE'
          },
          refundAmount: 8000000
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-5', timestamp: '17/10/2026 14:00', actor: 'Thủ kho QC', action: 'Kiểm định hàng hoàn', detail: 'Hàng nguyên vẹn 100%. Đề xuất hoàn 8.000.000đ. Đang chờ kế toán chuyển tiền.' },
          { id: 'log-4', timestamp: '16/10/2026 10:00', actor: 'Admin Tran', action: 'Chấp thuận thu hồi', detail: 'Điều phối xe lấy hàng về kho.' }
        ]
      }
    ];

    this.save(initialOrders);
  }
}
