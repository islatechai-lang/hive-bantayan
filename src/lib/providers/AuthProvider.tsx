"use client";

import React, { useEffect } from "react";
import { onAuthChanged, getCurrentUserDoc } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./AuthProvider.module.css";

export interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
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
          <div className={styles.logoRing} />
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
export { AuthProvider };
