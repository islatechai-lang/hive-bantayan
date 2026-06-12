"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Settings, ArrowLeft, Menu, X, PlusCircle, MessageSquare, Tag } from "lucide-react";
import { useUIStore } from "@/lib/stores/uiStore";
import styles from "./layout.module.css";
import { cn } from "@/lib/utils/cn";

export default function BusinessShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setMode } = useUIStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Orders Manager", href: "/store-orders", icon: <ShoppingCart size={18} /> },
    { label: "Products List", href: "/products", icon: <PlusCircle size={18} /> },
    { label: "Promo Codes", href: "/store-promotions", icon: <Tag size={18} /> },
    { label: "Chat Inbox", href: "/store-chats", icon: <MessageSquare size={18} /> },
    { label: "Store Settings", href: "/settings", icon: <Settings size={18} /> },
  ];

  const handleSwitchToBuyer = () => {
    setMode("buyer");
    router.push("/home");
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <button className={styles.menuBtn} onClick={() => setDrawerOpen(true)} aria-label="Open sidebar menu">
            <Menu size={20} />
          </button>
          <span>Store Manager</span>
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleSwitchToBuyer}
            className={styles.modeBtn}
            title="Switch to Buyer Mode"
            aria-label="Switch to Buyer Mode"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={styles.drawer}
            >
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitle}>Hive Bantayan</span>
                <button className={styles.menuBtn} onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                  <X size={18} />
                </button>
              </div>

              <nav className={styles.navLinks}>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(styles.navLink, isActive && styles.activeLink)}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleSwitchToBuyer}
                className={styles.navLink}
                style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16 }}
              >
                <ArrowLeft size={18} />
                <span>Buyer Mode</span>
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Pages Content */}
      <main className={styles.content}>{children}</main>
    </div>
  );
}
