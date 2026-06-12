// ============================================================
// Bantayan Hub — Firebase Auth Helpers
// ============================================================

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { COLLECTIONS } from "@/lib/utils/constants";
import type { User } from "@/lib/types";

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user document exists
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user document
    const newUser: Omit<User, "id"> = {
      displayName: user.displayName || "User",
      email: user.email || "",
      photoUrl: user.photoURL || "",
      phone: "",
      role: "buyer",
      hasBusiness: false,
      businessId: null,
      fcmToken: "",
      recentlyViewed: [],
      createdAt: serverTimestamp() as any,
    };
    await setDoc(userRef, newUser);
  }

  return user;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get current user document from Firestore
 */
export async function getCurrentUserDoc(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Auto-create document if it doesn't exist (e.g. if signup failed earlier due to rules)
    const newUser: Omit<User, "id"> = {
      displayName: firebaseUser.displayName || "User",
      email: firebaseUser.email || "",
      photoUrl: firebaseUser.photoURL || "",
      phone: "",
      role: "buyer",
      hasBusiness: false,
      businessId: null,
      fcmToken: "",
      recentlyViewed: [],
      createdAt: serverTimestamp() as any,
    };
    await setDoc(userRef, newUser);
    return { id: firebaseUser.uid, ...newUser } as User;
  }

  return { id: userSnap.id, ...userSnap.data() } as User;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
