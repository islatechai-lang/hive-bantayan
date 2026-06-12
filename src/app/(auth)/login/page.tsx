"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Card from "@/components/ui/Card/Card";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setUser, setFirebaseUser } = useAuthStore();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      setFirebaseUser(firebaseUser);
      
      toast.success("Welcome to Hive Bantayan!");
      router.push("/onboarding");
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className={styles.container}>
        <div className={styles.glow} />

        <button className={styles.backButton} onClick={() => router.push("/")} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={styles.card}>
            <div className={styles.logoArea}>
              <Image
                src="/hb-logo.png"
                alt="Hive Bantayan Logo"
                width={80}
                height={80}
                style={{ borderRadius: "20%" }}
              />
              <span className={styles.logoText}>Hive Bantayan</span>
            </div>

            <div className={styles.infoArea}>
              <h1 className={styles.title}>Welcome to the Island Hub</h1>
              <p className={styles.subtitle}>
                Sign in with your Google account to start browsing local shops or managing your own business.
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={styles.googleBtn}
            >
              {loading ? (
                <Loader2 size={20} className="pulse" />
              ) : (
                <div className={styles.googleIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.8 14.96 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.82 2.96c.9-2.7 3.42-4.48 6.79-4.48z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-1.99 3.41-4.92 3.41-8.6z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.21 14.52c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.56C.5 9.35 0 11.34 0 13.43s.5 4.08 1.39 5.87l3.82-2.96z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.35 1.11-3.95 1.11-3.37 0-6.22-2.28-7.24-5.37L1.23 15.9c1.98 3.93 5.98 6.6 10.77 6.6z"
                    />
                  </svg>
                </div>
              )}
              <span>{loading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            <div className={styles.securityNote}>
              <Lock size={14} className={styles.lockIcon} />
              <span>Secure, passwordless authentication</span>
            </div>

            <p className={styles.footer}>
              By signing in, you agree to our <br />
              <a href="#" className={styles.link}>Terms of Service</a> & <a href="#" className={styles.link}>Privacy Policy</a>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
