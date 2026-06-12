// ============================================================
// Bantayan Hub — UI Store (Zustand)
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Theme state
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Sidebar / Drawers state
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;

  // Cart preview drawer
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;

  // Active role filter / mode for navigation toggle
  currentMode: "buyer" | "business" | "admin";
  setMode: (mode: "buyer" | "business" | "admin") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          if (typeof window !== "undefined") {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(newTheme);
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        if (typeof window !== "undefined") {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(theme);
        }
        set({ theme });
      },

      isSidebarOpen: false,
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      isCartOpen: false,
      setCartOpen: (isCartOpen) => set({ isCartOpen }),

      currentMode: "buyer",
      setMode: (currentMode) => set({ currentMode }),
    }),
    {
      name: "bantayanhub-ui-storage",
      partialize: (state) => ({
        theme: state.theme,
        currentMode: state.currentMode,
      }),
    }
  )
);
