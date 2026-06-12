// ============================================================
// Bantayan Hub — TypeScript Type Definitions
// ============================================================

import { Timestamp } from "firebase/firestore";

// ---- Enums & Unions ----

export type UserRole = "buyer" | "business" | "admin";

export type BusinessStatus = "pending" | "approved" | "rejected" | "suspended";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type FavoriteType = "business" | "product";

export type ReportType = "business" | "product" | "review";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type DiscountType = "percentage" | "fixed";

export type AnnouncementType = "info" | "warning" | "promo";

export type AddressLabel = "home" | "work" | "custom";

export type BusinessCategory =
  | "food"
  | "drinks"
  | "grocery"
  | "pharmacy"
  | "hardware"
  | "electronics"
  | "clothing"
  | "seafood"
  | "other";

// ---- User ----

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoUrl: string;
  phone: string;
  role: UserRole;
  hasBusiness: boolean;
  businessId: string | null;
  fcmToken: string;
  recentlyViewed: string[];
  createdAt: Timestamp;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: AddressLabel;
  customLabel?: string;
  address: string;
  lat: number;
  lng: number;
  landmark: string;
  notes: string;
  isDefault: boolean;
}

// ---- Business ----

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    isClosed: boolean;
  };
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  category: BusinessCategory;
  phone: string;
  whatsapp: string;
  address: string;
  lat: number;
  lng: number;
  businessHours: BusinessHours;
  isOpen: boolean;
  isPaused: boolean;
  isVerified: boolean;
  status: BusinessStatus;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  deliveryFee: number;
  deliveryRadius: number;
  minOrderAmount: number;
  estimatedPrepTime: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Product ----

export interface VariantOption {
  label: string;
  price: number;
}

export interface ProductVariant {
  name: string;
  options: VariantOption[];
}

export interface ProductAddOn {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  inStock: boolean;
  stockQty: number;
  soldQty: number;
  variants: ProductVariant[];
  addOns: ProductAddOn[];
  isFeatured: boolean;
  createdAt: Timestamp;
}

// ---- Cart ----

export interface CartItemVariant {
  variantName: string;
  selectedOption: VariantOption;
}

export interface CartItem {
  productId: string;
  businessId: string;
  businessName: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selectedVariants: CartItemVariant[];
  selectedAddOns: ProductAddOn[];
  notes: string;
  unitTotal: number;
}

// ---- Order ----

export interface OrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  qty: number;
  price: number;
  variant: string;
  addOns: string[];
  notes: string;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  businessId: string;
  businessName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: "cod";
  status: OrderStatus;
  cancelReason: string;
  cancelledBy: "customer" | "business" | null;
  deliveryAddress: SavedAddress;
  notes: string;
  estimatedDelivery: Timestamp | null;
  createdAt: Timestamp;
  statusHistory: OrderStatusEntry[];
}

// ---- Review ----

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhoto: string;
  businessId: string;
  rating: number;
  text: string;
  photos: string[];
  businessReply: string;
  businessReplyAt: Timestamp | null;
  createdAt: Timestamp;
}

// ---- Feed Post ----

export interface FeedPost {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  content: string;
  images: string[];
  likes: number;
  likedBy: string[];
  savedBy: string[];
  createdAt: Timestamp;
}

// ---- Chat ----

export interface Chat {
  id: string;
  participants: [string, string];
  customerId: string;
  customerName: string;
  customerPhoto: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCustomer: number;
  unreadBusiness: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl: string;
  orderId: string;
  createdAt: Timestamp;
}

// ---- Favorite ----

export interface Favorite {
  id: string;
  userId: string;
  type: FavoriteType;
  targetId: string;
  createdAt: Timestamp;
}

// ---- Report ----

export interface Report {
  id: string;
  userId: string;
  userName: string;
  type: ReportType;
  targetId: string;
  reason: string;
  details: string;
  status: ReportStatus;
  adminNote: string;
  createdAt: Timestamp;
}

// ---- Promotion ----

export interface Promotion {
  id: string;
  businessId: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// ---- Announcement ----

export interface Announcement {
  id: string;
  adminId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  createdAt: Timestamp;
}

// ---- UI Types ----

export interface SearchFilters {
  query: string;
  category: BusinessCategory | "all";
  sortBy: "relevance" | "rating" | "distance" | "popular";
  minRating: number;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export interface PaginationState {
  page: number;
  hasMore: boolean;
  loading: boolean;
}
