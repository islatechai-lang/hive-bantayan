// ============================================================
// Bantayan Hub — Cart Store (Zustand)
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ProductAddOn, CartItemVariant } from "@/lib/types";

interface CartState {
  // State
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, "unitTotal">) => void;
  removeItem: (productId: string, selectedVariants: CartItemVariant[], selectedAddOns: ProductAddOn[]) => void;
  updateQuantity: (productId: string, selectedVariants: CartItemVariant[], selectedAddOns: ProductAddOn[], quantity: number) => void;
  updateNotes: (productId: string, selectedVariants: CartItemVariant[], selectedAddOns: ProductAddOn[], notes: string) => void;
  clearCart: () => void;
  clearBusinessCart: (businessId: string) => void;
  
  // Getters (computed values)
  getCartSubtotal: () => number;
  getCartItemsCount: () => number;
  getBusinessId: () => string | null;
  getBusinessName: () => string | null;
}

// Helper to check if item choices match
const isSameSelection = (
  item1Variants: CartItemVariant[],
  item2Variants: CartItemVariant[],
  item1AddOns: ProductAddOn[],
  item2AddOns: ProductAddOn[]
) => {
  if (item1Variants.length !== item2Variants.length) return false;
  if (item1AddOns.length !== item2AddOns.length) return false;

  // Compare variants
  const sortedV1 = [...item1Variants].sort((a, b) => a.variantName.localeCompare(b.variantName));
  const sortedV2 = [...item2Variants].sort((a, b) => a.variantName.localeCompare(b.variantName));
  for (let i = 0; i < sortedV1.length; i++) {
    if (sortedV1[i].variantName !== sortedV2[i].variantName || 
        sortedV1[i].selectedOption.label !== sortedV2[i].selectedOption.label) {
      return false;
    }
  }

  // Compare add-ons
  const sortedA1 = [...item1AddOns].sort((a, b) => a.name.localeCompare(b.name));
  const sortedA2 = [...item2AddOns].sort((a, b) => a.name.localeCompare(b.name));
  for (let i = 0; i < sortedA1.length; i++) {
    if (sortedA1[i].name !== sortedA2[i].name) return false;
  }

  return true;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items;
        
        // Calculate unit price including options/add-ons
        const variantsPrice = newItem.selectedVariants.reduce((sum, v) => sum + v.selectedOption.price, 0);
        const addOnsPrice = newItem.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
        const unitTotal = newItem.price + variantsPrice + addOnsPrice;

        // Check if item from different business
        if (currentItems.length > 0 && currentItems[0].businessId !== newItem.businessId) {
          // If different business, we replace the cart (will be warned in UI)
          set({
            items: [{ ...newItem, unitTotal }],
          });
          return;
        }

        // Find existing match
        const existingIndex = currentItems.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            isSameSelection(
              item.selectedVariants,
              newItem.selectedVariants,
              item.selectedAddOns,
              newItem.selectedAddOns
            )
        );

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { ...newItem, unitTotal }] });
        }
      },

      removeItem: (productId, selectedVariants, selectedAddOns) => {
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.productId === productId &&
                isSameSelection(
                  item.selectedVariants,
                  selectedVariants,
                  item.selectedAddOns,
                  selectedAddOns
                )
              )
          ),
        });
      },

      updateQuantity: (productId, selectedVariants, selectedAddOns, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, selectedVariants, selectedAddOns);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.productId === productId &&
            isSameSelection(
              item.selectedVariants,
              selectedVariants,
              item.selectedAddOns,
              selectedAddOns
            )
              ? { ...item, quantity }
              : item
          ),
        });
      },

      updateNotes: (productId, selectedVariants, selectedAddOns, notes) => {
        set({
          items: get().items.map((item) =>
            item.productId === productId &&
            isSameSelection(
              item.selectedVariants,
              selectedVariants,
              item.selectedAddOns,
              selectedAddOns
            )
              ? { ...item, notes }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      clearBusinessCart: (businessId) => {
        set({
          items: get().items.filter((item) => item.businessId !== businessId),
        });
      },

      getCartSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
      },

      getCartItemsCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getBusinessId: () => {
        const items = get().items;
        return items.length > 0 ? items[0].businessId : null;
      },

      getBusinessName: () => {
        const items = get().items;
        return items.length > 0 ? items[0].businessName : null;
      },
    }),
    {
      name: "bantayanhub-cart-storage",
    }
  )
);
