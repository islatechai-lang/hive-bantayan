// ============================================================
// Bantayan Hub — Constants
// ============================================================

export const APP_NAME = "Bantayan Hub";
export const APP_DESCRIPTION = "Bantayan Island's local marketplace";
export const APP_URL = "https://bantayanhub.com";

// ---- Business Categories ----

export const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍕", color: "#FF6B35" },
  { id: "drinks", label: "Drinks", emoji: "🥤", color: "#00B4D8" },
  { id: "grocery", label: "Grocery", emoji: "🛒", color: "#2D6A4F" },
  { id: "pharmacy", label: "Pharmacy", emoji: "💊", color: "#E63946" },
  { id: "hardware", label: "Hardware", emoji: "🔧", color: "#6C757D" },
  { id: "electronics", label: "Electronics", emoji: "📱", color: "#7209B7" },
  { id: "clothing", label: "Clothing", emoji: "👕", color: "#F72585" },
  { id: "seafood", label: "Seafood", emoji: "🦐", color: "#0077B6" },
  { id: "other", label: "Other", emoji: "📦", color: "#FFB800" },
] as const;

// ---- Order Statuses ----

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#FFB800",
    bgColor: "#FFF3CD",
    icon: "clock",
    description: "Waiting for business to accept",
  },
  accepted: {
    label: "Accepted",
    color: "#0D9488",
    bgColor: "#D1FAE5",
    icon: "check-circle",
    description: "Order has been accepted",
  },
  preparing: {
    label: "Preparing",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    icon: "chef-hat",
    description: "Your order is being prepared",
  },
  ready: {
    label: "Ready",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    icon: "package-check",
    description: "Order is ready for pickup/delivery",
  },
  out_for_delivery: {
    label: "On the Way",
    color: "#EA580C",
    bgColor: "#FED7AA",
    icon: "truck",
    description: "Your order is on the way!",
  },
  completed: {
    label: "Completed",
    color: "#16A34A",
    bgColor: "#BBF7D0",
    icon: "circle-check",
    description: "Order delivered successfully",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    icon: "x-circle",
    description: "Order was cancelled",
  },
} as const;

// ---- Days of Week ----

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

// ---- Bantayan Island Coordinates (center) ----

export const BANTAYAN_CENTER = {
  lat: 11.1685,
  lng: 123.7268,
};

export const DEFAULT_ZOOM = 13;

// ---- Pagination ----

export const PAGE_SIZE = 20;
export const FEED_PAGE_SIZE = 10;

// ---- Image Limits ----

export const MAX_PRODUCT_IMAGES = 5;
export const MAX_REVIEW_PHOTOS = 3;
export const MAX_FEED_IMAGES = 4;
export const MAX_IMAGE_SIZE_MB = 5;

// ---- Recently Viewed Limit ----

export const MAX_RECENTLY_VIEWED = 20;

// ---- Firebase Collections ----

export const COLLECTIONS = {
  USERS: "users",
  BUSINESSES: "businesses",
  PRODUCTS: "products",
  ORDERS: "orders",
  REVIEWS: "reviews",
  FEED_POSTS: "feedPosts",
  CHATS: "chats",
  MESSAGES: "messages",
  FAVORITES: "favorites",
  REPORTS: "reports",
  PROMOTIONS: "promotions",
  ANNOUNCEMENTS: "announcements",
  SAVED_ADDRESSES: "savedAddresses",
} as const;
