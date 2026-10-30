export type ConversationMode = 'BOT' | 'WAITING_STAFF' | 'STAFF';
export type ConversationStatus = 'OPEN' | 'CLOSED';
export type SenderType = 'CUSTOMER' | 'BOT' | 'STAFF' | 'SYSTEM';
export type BotActionType =
  | 'NONE'
  | 'ORDER_STATUS'
  | 'PRODUCT_SEARCH'
  | 'HANDOFF'
  | 'BUSINESS_HOURS'
  | 'BOOK_CONSULT';

export interface ChatConversation {
  id: string;
  guestName: string;
  guestPhone: string;
  mode: ConversationMode;
  status: ConversationStatus;
  assignedStaffId: string | null;
  assignedStaffName?: string | null;
  needsHuman: boolean;
  unreadStaff: number;
  unreadCustomer: number;
  lastMessageAt: string | Date;
  lastMessagePreview: string;
  customerId?: string | null;
  internalNote?: string | null;
  createdAt: string | Date;
  closedAt?: string | Date | null;
}

export interface QuickReplyOption {
  label: string;
  payload: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  quickReplies?: QuickReplyOption[];
  meta?: any;
  readAt?: string | Date | null;
  createdAt: string | Date;
  clientMessageId?: string | null;
  pending?: boolean;
}

export interface CustomerDetail {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  totalSpent?: number | string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  shippingProvider?: string;
  trackingCode?: string;
  createdAt: string;
}

export interface ConversationDetailResponse {
  conversation: ChatConversation;
  customer: CustomerDetail | null;
  recentOrders: RecentOrder[];
}

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface BotScript {
  id: string;
  intent: string;
  name: string;
  patterns: string[];
  answer: string;
  quickReplies?: QuickReplyOption[];
  actionType: BotActionType;
  priority: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptTestResult {
  intent: string;
  score: number;
  candidates: Array<{ intent: string; name: string; score: number }>;
  reply: string;
  quickReplies?: QuickReplyOption[];
}

export interface WorkingHoursSetting {
  start: string;
  end: string;
  days: number[];
}

export interface ChatSettings {
  workingHours?: WorkingHoursSetting;
  greeting?: string;
  offlineMessage?: string;
  handoffMessage?: string;
  fallbackMessages?: string[];
  hotline?: string;
  address?: string;
}

export interface ConversationListResponse {
  conversations: ChatConversation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

