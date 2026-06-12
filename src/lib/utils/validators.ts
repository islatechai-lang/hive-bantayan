// ============================================================
// Bantayan Hub — Validation Helpers
// ============================================================

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Philippine mobile: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (12 digits)
  return /^(09\d{9}|639\d{9})$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidPrice(price: number): boolean {
  return price >= 0 && price <= 999999 && Number.isFinite(price);
}

export function isValidPromoCode(code: string): boolean {
  return /^[A-Z0-9]{3,20}$/.test(code.toUpperCase());
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isFileSizeValid(file: File, maxMB: number): boolean {
  return file.size <= maxMB * 1024 * 1024;
}
