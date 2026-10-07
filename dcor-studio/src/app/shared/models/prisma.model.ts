export enum Role {
  CUSTOMER = 'CUSTOMER',
  B2B = 'B2B',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED'
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COUNTERED = 'COUNTERED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  email?: string;
  phone: string;
  passwordHash?: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  deletedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Address {
  id: string;
  userId: string;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: any;
  basePrice: number;
  discountValue?: number;
  discountType?: string;
  images: any;
  configOptions: any;
  variants: any;
  videos?: any;
  isBestSeller: boolean;
  isNew: boolean;
  isActive: boolean;
  inactiveReason?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Order {
  id: string;
  userId?: string;
  email?: string;
  phone: string;
  receiverName: string;
  address: string;
  isGift: boolean;
  giftMessage?: string;
  hideInvoicePrice: boolean;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantKey: string;
  variantDescription: string;
  imageUrl: string;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variantKey: string;
  variantTags?: any;
  legId?: string;
  upholsteryId?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
