"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2, Phone, Check } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Card from "@/components/ui/Card/Card";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || recaptchaVerifierRef.current) return;

    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          toast.error("reCAPTCHA expired. Please try again.");
        }
      });
    } catch (err) {
      console.error("Failed to initialize RecaptchaVerifier:", err);
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Standardize phone number (+63 prefix for Philippines)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+63" + formattedPhone.slice(1);
      } else {
        formattedPhone = "+63" + formattedPhone;
      }
    }

    setLoading(true);
    try {
      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        throw new Error("Recaptcha verifier is not initialized");
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep("code");
      toast.success(`Verification code sent to ${formattedPhone}`);
    } catch (error: any) {
      console.error("SMS Code Send failed:", error);
      toast.error(error.message || "Failed to send verification code. Check your phone number.");
      if (typeof window !== "undefined" && (window as any).grecaptcha && recaptchaVerifierRef.current) {
        try {
          (window as any).grecaptcha.reset();
        } catch (resetErr) {
          console.error("Error resetting recaptcha:", resetErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No pending confirmation found");
      }

      const result = await confirmationResult.confirm(verificationCode);
      const firebaseUser = result.user;
      
      // Update state
      useAuthStore.getState().setFirebaseUser(firebaseUser);

      toast.success("Welcome to Hive Bantayan!");
      router.push("/onboarding");
    } catch (error: any) {
      console.error("Verification failed:", error);
      toast.error(error.message || "Incorrect verification code. Please try again.");
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
                {step === "phone" 
                  ? "Enter your phone number to sign up or log in. We will send you a one-time verification code."
                  : "We sent a 6-digit code to your phone number. Enter it below to confirm your account."
                }
              </p>
            </div>

            <div id="recaptcha-container" className={styles.recaptchaContainer}></div>

            {step === "phone" ? (
              <form onSubmit={handleSendCode} className={styles.phoneForm}>
                <div>
                  <label className={styles.inputLabel}>Mobile Phone Number</label>
                  <div className={styles.phoneInputWrapper}>
                    <span className={styles.countryCode}>+63</span>
                    <input
                      type="tel"
                      placeholder="912 345 6789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      className={styles.phoneInput}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                 <button
                  type="submit"
                  disabled={loading || phoneNumber.length < 10}
                  className={styles.submitBtn}
                >
                  {loading ? (
                    <Loader2 size={20} className={styles.spinner} />
                  ) : (
                    <Phone size={18} />
                  )}
                  <span>{loading ? "Sending..." : "Send Verification SMS"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className={styles.phoneForm}>
                <div>
                  <label className={styles.inputLabel}>Enter 6-Digit Code</label>
                  <input
                    type="text"
                    placeholder="••••••"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    className={styles.codeInput}
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className={styles.submitBtn}
                >
                  {loading ? (
                    <Loader2 size={20} className={styles.spinner} />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>{loading ? "Verifying..." : "Confirm & Continue"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  disabled={loading}
                  className={styles.changePhoneBtn}
                >
                  Change phone number
                </button>
              </form>
            )}

            <div className={styles.securityNote}>
              <Lock size={14} className={styles.lockIcon} />
              <span>Secure, SMS-based verification</span>
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
