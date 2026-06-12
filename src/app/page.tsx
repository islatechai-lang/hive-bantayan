"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Store, ArrowRight, ShieldCheck, Compass, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import styles from "./page.module.css";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { currentMode } = useUIStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.push("/panel");
      } else if (user.role === "business" && currentMode === "business") {
        router.push("/dashboard");
      } else {
        router.push("/home");
      }
    }
  }, [isAuthenticated, user, currentMode, router]);

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <div className="app-container">
      <div className={styles.wrapper}>
        {/* Animated Background Island Sun Gradient */}
        <div className={styles.sunGradient} />

        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoCircle}>🏝️</div>
            <span className={styles.logoText}>Bantayan Hub</span>
          </div>
        </header>

        <main className={styles.main}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={styles.hero}
          >
            <div className={styles.badgeRow}>
              <span className={styles.heroBadge}>
                <Sparkles size={12} className={styles.sparkleIcon} />
                Bantayan Island's Own App
              </span>
            </div>
            <h1 className={styles.title}>
              Island Marketplace <br />
              <span className={styles.highlight}>In Your Pocket</span>
            </h1>
            <p className={styles.description}>
              Discover food, drinks, seafood, and groceries from local Bantayan stores. Direct ordering, COD payment, and self-managed business deliveries.
            </p>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight size={18} />}
              onClick={handleGetStarted}
              className={styles.ctaButton}
            >
              Get Started
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.features}
          >
            <h2 className={styles.sectionTitle}>What can you do?</h2>

            <div className={styles.grid}>
              <Card glass className={styles.featureCard}>
                <div className={styles.iconCircle}>
                  <Compass size={22} className={styles.icon} />
                </div>
                <h3>Order Locally</h3>
                <p>Browse local businesses, order fresh seafood, delicious food, pharmacy products, and track in real-time.</p>
              </Card>

              <Card glass className={styles.featureCard}>
                <div className={styles.iconCircle}>
                  <Store size={22} className={styles.iconSec} />
                </div>
                <h3>Start a Store</h3>
                <p>Register your business, upload products with variants, track sales metrics, and message customers directly.</p>
              </Card>

              <Card glass className={styles.featureCard}>
                <div className={styles.iconCircle}>
                  <ShieldCheck size={22} className={styles.iconAcc} />
                </div>
                <h3>Trusted Safety</h3>
                <p>All stores are verified by platform admins. Pay cash-on-delivery directly to the business delivery riders.</p>
              </Card>
            </div>
          </motion.div>
        </main>

        <footer className={styles.footer}>
          <p>© 2026 Bantayan Hub. All rights reserved.</p>
          <p className={styles.footerNote}>Proudly supporting local commerce in Bantayan Island, Cebu.</p>
        </footer>
      </div>
    </div>
  );
}
