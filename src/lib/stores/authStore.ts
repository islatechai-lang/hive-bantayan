// ============================================================
// Bantayan Hub — Auth Store (Zustand)
// ============================================================

import { create } from "zustand";
import type { User } from "@/lib/types";
import type { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  // State
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;

  // Actions
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setNewUser: (isNew: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,

  setFirebaseUser: (firebaseUser) =>
    set({
      firebaseUser,
      isAuthenticated: !!firebaseUser,
    }),

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  setNewUser: (isNewUser) => set({ isNewUser }),

  reset: () =>
    set({
      firebaseUser: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isNewUser: false,
    }),
}));
