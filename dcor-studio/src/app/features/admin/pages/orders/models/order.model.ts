export type AdminOrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'FAILED_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNING'
  | 'RETURNED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'VNPAY' | 'INSTALLMENT';

export type UserViewGroup = 
  | 'Chờ xử lý' 
  | 'Chuẩn bị hàng' 
  | 'Vận chuyển' 
  | 'Hoàn thành' 
  | 'Hủy đơn' 
  | 'Đổi trả / Hoàn tiền';

export interface UserStatusView {
  group: UserViewGroup;
  label: string;
  description: string;
  color: string;
  canCancel: boolean;
  canRequestReturn: boolean;
  canReview: boolean;
  canRequestWarranty: boolean;
}

export interface OrderProduct {
  id: string;
  name: string;
  sku: string;
  variant: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lineTotal: number;
  stockAvailable: number;
}
export type OrderProductV2 = OrderProduct;

export interface DeliveryTrackingEntry {
  time: string;
  status: string;
  description: string;
  location: string;
}

export interface DeliveryInfo {
  provider: string; // 'Xe tải DCOR Express' | 'Giao Hàng Nhanh (GHN)' | 'Viettel Post'
  trackingCode?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  estimatedDate?: string;
  failedAttempts: number;
  failureReason?: string;
  trackingHistory: DeliveryTrackingEntry[];
}
export type DeliveryInfoV2 = DeliveryInfo;

export interface ReturnQcReport {
  inspector: string;
  condition: string;
  defectAssessment: string;
  refundPercent: number;
  restockOption: 'RESTOCK_SALE' | 'SEND_TO_REPAIR' | 'LIQUIDATION';
}

export interface ReturnInfo {
  returnRequestId?: string;
  requestedAt?: string;
  reason?: string;
  type?: 'REFUND' | 'EXCHANGE';
  proofImages?: string[];
  customerNote?: string;
  rejectionReason?: string;
  qcReport?: ReturnQcReport;
  refundAmount?: number;
  refundTransactionCode?: string;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
}
export type ReturnInfoV2 = ReturnInfo;

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}
export type AuditLogV2 = AuditLog;

export interface QcChecklist {
  surfaceChecked: boolean;
  structureChecked: boolean;
  cushionLeatherChecked: boolean;
  protectiveWrapDone: boolean;
}
export type QcChecklistV2 = QcChecklist;

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  createdAt: string;
  status: AdminOrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  accountName?: string;
  phone: string;
  customerPhone?: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  showroom: string;
  items: OrderProduct[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  vatRate?: number;
  totalAmount: number;
  depositRequired: number;
  depositPaid: number;
  remainingAmount: number;
  isDepositRequired?: boolean;
  paymentHoldReason?: 'NONE' | 'AWAITING_PAYMENT' | 'AWAITING_DEPOSIT';
  expiresAt?: string;
  isHighValue: boolean;
  isCustomDesign: boolean;
  isGift: boolean;
  customerNote?: string;
  internalNotes?: string;
  cancelReason?: string;
  cancelledBy?: string;
  deliveredAt?: string;
  completedAt?: string;
  warrantyCode?: string;
  delivery: DeliveryInfo;
  returnInfo?: ReturnInfo;
  qcChecklist: QcChecklist;
  auditLogs: AuditLog[];
}
export type OrderV2 = Order;

export function mapAdminStatusToUserView(status: AdminOrderStatus): UserStatusView {
  switch (status) {
    case 'PENDING':
      return {
        group: 'Chờ xử lý',
        label: 'Chờ xác nhận',
        description: 'Đơn hàng đã đặt thành công, đang chờ hệ thống/shop xác nhận.',
        color: '#d97706',
        canCancel: true,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };

    case 'CONFIRMED':
    case 'PROCESSING':
    case 'READY_TO_SHIP':
      return {
        group: 'Chuẩn bị hàng',
        label: 'Đang chuẩn bị hàng',
        description: 'Shop đã nhận đơn, đang nhặt hàng, đóng gói và chờ đơn vị vận chuyển qua lấy.',
        color: '#2563eb',
        canCancel: false,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };

    case 'SHIPPED':
      return {
        group: 'Vận chuyển',
        label: 'Đang giao hàng',
        description: 'Đơn vị vận chuyển đang mang hàng đến cho bạn.',
        color: '#9333ea',
        canCancel: false,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };

    case 'FAILED_DELIVERY':
      return {
        group: 'Vận chuyển',
        label: 'Đang giao hàng (Hẹn lại)',
        description: 'Tài xế chưa liên lạc được với bạn. Chúng tôi sẽ liên hệ lại để giao hàng sớm nhất.',
        color: '#ea580c',
        canCancel: false,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };

    case 'DELIVERED':
      return {
        group: 'Hoàn thành',
        label: 'Đã nhận hàng',
        description: 'Đơn hàng đã giao thành công. Bạn có thể yêu cầu đổi trả trong vòng 72 giờ.',
        color: '#059669',
        canCancel: false,
        canRequestReturn: true,
        canReview: true,
        canRequestWarranty: false,
      };

    case 'COMPLETED':
      return {
        group: 'Hoàn thành',
        label: 'Hoàn tất đơn hàng',
        description: 'Giao dịch đã kết thúc thành công. Cảm ơn bạn đã tin chọn DCOR!',
        color: '#047857',
        canCancel: false,
        canRequestReturn: false,
        canReview: true,
        canRequestWarranty: true,
      };

    case 'CANCELLED':
      return {
        group: 'Hủy đơn',
        label: 'Đã hủy',
        description: 'Đơn hàng đã bị hủy. Nếu đã thanh toán, hệ thống đang tiến hành hoàn tiền cho bạn.',
        color: '#dc2626',
        canCancel: false,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };

    case 'RETURN_REQUESTED':
    case 'RETURNING':
    case 'RETURNED':
      return {
        group: 'Đổi trả / Hoàn tiền',
        label: 'Đang xử lý đổi / trả',
        description: 'Yêu cầu đổi trả của bạn đang được shop tiếp nhận, kiểm tra hàng và xử lý hoàn tiền/đổi mới.',
        color: '#ea580c',
        canCancel: false,
        canRequestReturn: false,
        canReview: false,
        canRequestWarranty: false,
      };
  }
}
