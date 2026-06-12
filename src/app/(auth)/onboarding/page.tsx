"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Store, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { updateDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useUIStore } from "@/lib/stores/uiStore";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import styles from "./onboarding.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const { setMode } = useUIStore();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "business">("buyer");
  const [loading, setLoading] = useState(false);

  // If already has business or has completed onboarding, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/admin/panel");
      } else if (user.hasBusiness) {
        setMode("business");
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, user, router, setMode]);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (selectedRole === "buyer") {
        // User wants to be a buyer
        await updateDocument(COLLECTIONS.USERS, user.id, {
          role: "buyer",
        });
        setUser({ ...user, role: "buyer" });
        setMode("buyer");
        toast.success("Ready to browse Hive Bantayan!");
        router.push("/home");
      } else {
        // User wants to register a business
        await updateDocument(COLLECTIONS.USERS, user.id, {
          role: "business",
        });
        setUser({ ...user, role: "business" });
        setMode("business");
        router.push("/setup");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to update account role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className={styles.container}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Choose Your Experience</h1>
          <p className={styles.subtitle}>
            Hive Bantayan supports both roles. You can browse as a buyer or start your own local storefront.
          </p>
        </div>

        <div className={styles.options}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedRole("buyer")}
            className={`${styles.optionCard} ${selectedRole === "buyer" ? styles.selectedCard : ""}`}
          >
            <div className={`${styles.iconWrapper} ${styles.buyerIcon}`}>
              <ShoppingBag size={28} />
            </div>
            <div>
              <h3 className={styles.optionTitle}>Continue as Buyer</h3>
              <p className={styles.optionDesc}>
                Browse island products, place cash-on-delivery orders, and chat directly with storefront owners.
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedRole("business")}
            className={`${styles.optionCard} ${selectedRole === "business" ? styles.selectedCard : ""}`}
          >
            <div className={`${styles.iconWrapper} ${styles.businessIcon}`}>
              <Store size={28} />
            </div>
            <div>
              <h3 className={styles.optionTitle}>Create a Business</h3>
              <p className={styles.optionDesc}>
                Build your own digital store, list products with custom variants, manage orders, and deliver to islanders.
              </p>
            </div>
          </motion.div>
        </div>

        <div className={styles.action}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={<ArrowRight size={18} />}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
