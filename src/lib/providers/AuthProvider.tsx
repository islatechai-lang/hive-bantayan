"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { onAuthChanged, getCurrentUserDoc } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { registerOneSignalUser } from "@/lib/utils/onesignal";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./AuthProvider.module.css";

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setFirebaseUser, setUser, setLoading, isLoading } = useAuthStore();
  const { setTheme, theme } = useUIStore();

  // Load and apply theme on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme]);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setLoading(true);
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDoc = await getCurrentUserDoc();
          setUser(userDoc);
          if (userDoc) {
            const currentMode = useUIStore.getState().currentMode;
            if (userDoc.role === "buyer" && currentMode !== "buyer") {
              useUIStore.getState().setMode("buyer");
            } else if (userDoc.role === "business" && currentMode !== "business") {
              useUIStore.getState().setMode("business");
            }
          }
          registerOneSignalUser(firebaseUser.uid);
        } catch (error) {
          console.error("Error fetching user document:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingBox}>
          <Image
            src="/hb-logo.png"
            alt="Hive Bantayan Logo"
            width={80}
            height={80}
            style={{ borderRadius: "20%", marginBottom: 16 }}
          />
          <h2 className={styles.loadingText}>Hive Bantayan</h2>
          <p className={styles.loadingSubtext}>Loading island vibes...</p>
          <div className={styles.shimmerBox}>
            <Skeleton height={8} width={120} variant="pill" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
