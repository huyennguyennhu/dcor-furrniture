export type SenderType = 'CUSTOMER' | 'BOT' | 'STAFF' | 'SYSTEM';

export type ConversationMode = 'BOT' | 'WAITING_STAFF' | 'STAFF';

export type ConversationStatus = 'OPEN' | 'CLOSED';

export type MessageDeliveryStatus = 'SENDING' | 'SENT' | 'FAILED';

export interface QuickReply {
  label: string;
  payload: string;
}

export interface ProductCardItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  formattedPrice?: string;
  link: string;
}

export interface ProductCardsMeta {
  type: 'PRODUCT_CARDS' | 'SOFA_HOT_CARDS';
  products: ProductCardItem[];
}

export interface OrderCardMeta {
  type: 'ORDER_CARD';
  orderId: string;
  orderNumber: string;
  status: string;
  statusVn: string;
  paymentStatus?: string;
  paymentVn?: string;
  totalAmount: string;
  shippingProvider?: string;
  trackingCode?: string;
}

export interface BookingCtaMeta {
  type: 'BOOKING_CTA';
}

export interface LoginCtaMeta {
  type: 'LOGIN_CTA';
}

export interface LinkMeta {
  type: 'LINK';
  label: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  senderName: string;
  content: string;
  imageUrl?: string | null;
  clientMessageId?: string | null;
  quickReplies?: QuickReply[] | null;
  meta?: ProductCardsMeta | OrderCardMeta | BookingCtaMeta | LoginCtaMeta | LinkMeta | any;
  readAt?: Date | string | null;
  createdAt: Date | string;
  deliveryStatus?: MessageDeliveryStatus;
}

export interface ChatConversation {
  id: string;
  customerId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  mode: ConversationMode;
  status: ConversationStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  needsHuman?: boolean;
  unreadStaff?: number;
  unreadCustomer?: number;
  lastMessageAt?: Date | string | null;
  lastMessagePreview?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GuestSession {
  conversationId?: string;
  guestToken: string;
  guestName?: string;
  guestPhone?: string;
}

export interface ChatInitResponse {
  conversationId: string;
  guestToken: string;
  message?: ChatMessage;
  error?: string;
}

export interface GreetingResponse {
  isAuthenticated: boolean;
  customerName?: string;
  greeting: string;
  quickReplies: QuickReply[];
}

export interface TypingIndicator {
  conversationId: string;
  isTyping: boolean;
  senderType: SenderType;
  senderName?: string;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface UploadImageResponse {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}
