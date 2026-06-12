"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Sun, Moon } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useUIStore } from "@/lib/stores/uiStore";
import Image from "next/image";
import BottomNav from "@/components/shared/BottomNav/BottomNav";
import styles from "./layout.module.css";

export default function BuyerShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const getCartItemsCount = useCartStore((state) => state.getCartItemsCount);
  const cartCount = getCartItemsCount();
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="app-container safe-padding-bottom">
      {/* Top Header Shell */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href="/home" className={styles.brandLogo}>
            <Image
              src="/hb-logo.png"
              alt="Logo"
              width={28}
              height={28}
              style={{ marginRight: 8, borderRadius: "20%" }}
            />
            <span className={styles.brandText}>Hive Bantayan</span>
          </Link>
        </div>

        <div className={styles.actions}>
          {/* Theme Switcher */}
          <button className={styles.actionBtn} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Shopping Cart Button */}
          <button
            className={styles.cartBtn}
            onClick={() => router.push("/cart")}
            aria-label="View shopping cart"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Main Pages Content */}
      <main className={styles.content}>{children}</main>

      {/* Bottom Tabs Nav */}
      <BottomNav />
    </div>
  );
}
