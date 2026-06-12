// ============================================================
// Bantayan Hub — Utility Formatters
// ============================================================

/**
 * Format a number as Philippine Peso currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Firestore Timestamp or Date as a relative time string
 * e.g., "2 minutes ago", "1 hour ago", "Yesterday"
 */
export function formatRelativeTime(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a date as a short string
 */
export function formatDateShort(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a time (HH:mm)
 */
export function formatTime(date: Date | { toDate: () => Date }): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a number with compact notation (1.2K, 3.4M)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format estimated delivery time
 */
export function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `~${hours}h`;
  return `~${hours}h ${mins}m`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a phone number for display
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("09")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Generate order number: BH-YYYYMMDD-NNN
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 900) + 100;
  return `BH-${dateStr}-${random}`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a business is currently open based on business hours
 */
export function isBusinessOpen(
  businessHours: Record<string, { open: string; close: string; isClosed: boolean }>,
  isManuallyOpen: boolean
): { isOpen: boolean; status: "open" | "closed" | "closing_soon" } {
  if (!isManuallyOpen) return { isOpen: false, status: "closed" };

  const now = new Date();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = dayNames[now.getDay()];
  const hours = businessHours[today];

  if (!hours || hours.isClosed) return { isOpen: false, status: "closed" };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
    return { isOpen: false, status: "closed" };
  }

  // Closing within 30 minutes
  if (closeMinutes - currentMinutes <= 30) {
    return { isOpen: true, status: "closing_soon" };
  }

  return { isOpen: true, status: "open" };
}
