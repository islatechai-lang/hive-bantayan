"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Store, ShieldCheck, MapPin, LogOut, ChevronRight, RefreshCw, Moon, Sun, Loader2 } from "lucide-react";
import { signOut } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Toggle from "@/components/ui/Toggle/Toggle";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, reset: resetAuth } = useAuthStore();
  const { currentMode, setMode, theme, toggleTheme } = useUIStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleModeChange = (checked: boolean) => {
    if (checked) {
      if (user?.hasBusiness) {
        setMode("business");
        toast.success("Switched to Business Mode");
        router.push("/dashboard");
      } else {
        // Redirect to business registration setup
        router.push("/setup");
      }
    } else {
      setMode("buyer");
      toast.success("Switched to Buyer Mode");
      router.push("/home");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      resetAuth();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account Profile</h1>

      {/* User Information Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          <Image
            src={user?.photoUrl || "/images/avatar-placeholder.jpg"}
            alt={user?.displayName || "Profile"}
            fill
            className={styles.avatarImage}
          />
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.name}>{user?.displayName || "Guest User"}</h2>
          <span className={styles.email}>{user?.email || "No email linked"}</span>
        </div>
      </div>

      {/* Navigation Switch Mode */}
      <section className={styles.menuSection}>
        <h3 className={styles.sectionTitle}>Preferences</h3>
        
        {/* Switch mode preferences */}
        <div className={styles.menuItem}>
          <div className={styles.menuLeft}>
            <Store size={18} className={styles.menuIcon} />
            <span>Business Mode</span>
          </div>
          <div className={styles.menuRight}>
            <Toggle
              checked={currentMode === "business"}
              onChange={handleModeChange}
            />
          </div>
        </div>

        {/* Theme mode preferences */}
        <div className={styles.menuItem} onClick={toggleTheme}>
          <div className={styles.menuLeft}>
            {theme === "light" ? (
              <Moon size={18} className={styles.menuIcon} />
            ) : (
              <Sun size={18} className={styles.menuIcon} />
            )}
            <span>Dark Appearance</span>
          </div>
          <div className={styles.menuRight}>
            <Toggle
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
          </div>
        </div>
      </section>

      {/* Account Settings Menu */}
      <section className={styles.menuSection}>
        <h3 className={styles.sectionTitle}>Account settings</h3>

        <button className={styles.menuItem} onClick={() => router.push("/orders")}>
          <div className={styles.menuLeft}>
            <RefreshCw size={18} className={styles.menuIcon} />
            <span>Order History</span>
          </div>
          <div className={styles.menuRight}>
            <ChevronRight size={16} />
          </div>
        </button>

        <button className={styles.menuItem} onClick={() => router.push("/addresses")}>
          <div className={styles.menuLeft}>
            <MapPin size={18} className={styles.menuIcon} />
            <span>Saved Addresses</span>
          </div>
          <div className={styles.menuRight}>
            <ChevronRight size={16} />
          </div>
        </button>

        {user?.role === "admin" && (
          <button className={styles.menuItem} onClick={() => router.push("/panel")}>
            <div className={styles.menuLeft}>
              <ShieldCheck size={18} className={styles.menuIcon} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 600, color: "var(--primary)" }}>Admin Panel</span>
            </div>
            <div className={styles.menuRight}>
              <ChevronRight size={16} style={{ color: "var(--primary)" }} />
            </div>
          </button>
        )}
      </section>

      {/* Logout options */}
      <section className={styles.menuSection} style={{ marginTop: 12 }}>
        <button
          className={`${styles.menuItem} ${styles.logoutBtn}`}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <div className={styles.menuLeft} style={{ color: "inherit" }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
          {loggingOut && <Loader2 size={16} className="pulse" />}
        </button>
      </section>
    </div>
  );
}
