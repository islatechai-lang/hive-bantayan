"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { useAuthStore } from "@/lib/stores/authStore";
import SearchBar from "@/components/shared/SearchBar/SearchBar";
import CategoryChips from "@/components/shared/CategoryChips/CategoryChips";
import BusinessCard from "@/components/shared/BusinessCard/BusinessCard";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./home.module.css";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { loading, error, getFeaturedBusinesses, getPopularBusinesses, getBusinessesByCategory } = useBusiness();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const featured = getFeaturedBusinesses();
  const popular = getPopularBusinesses();
  const filtered = getBusinessesByCategory(selectedCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className={styles.container}>
      {/* Greetings Header */}
      <div className={styles.greetings}>
        <span className={styles.welcome}>Welcome back,</span>
        <h1 className={styles.userName}>{user?.displayName || "Island Guest"} 👋</h1>
      </div>

      {/* Sticky Search Trigger */}
      <div className={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            if (val) handleSearchSubmit(val);
          }}
          placeholder="Search foods, seafoods, hardware..."
        />
      </div>

      {/* Categories Horizontal Slider */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Categories</h2>
        </div>
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </section>

      {/* Featured Businesses Section */}
      {selectedCategory === "all" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Sparkles size={16} className={styles.sparkleIcon} />
              Featured Stores
            </h2>
          </div>

          {loading ? (
            <div className={styles.horizontalScroll}>
              <Skeleton width={260} height={180} />
              <Skeleton width={260} height={180} />
            </div>
          ) : featured.length === 0 ? (
            <div className={styles.emptyCard}>
              <Compass size={24} className={styles.emptyIcon} />
              <p>No featured stores yet on the island</p>
            </div>
          ) : (
            <div className={styles.horizontalScroll}>
              {featured.map((bus) => (
                <div key={bus.id} className={styles.horizontalCardWrapper}>
                  <BusinessCard business={bus} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dynamic List Section (Filtered or Popular) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {selectedCategory === "all" ? "Popular Stores" : "Store Listings"}
          </h2>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className={styles.verticalGrid}>
            <Skeleton height={200} />
            <Skeleton height={200} />
          </div>
        ) : (selectedCategory === "all" ? popular : filtered).length === 0 ? (
          <div className={styles.emptyCard}>
            <ShoppingBag size={24} className={styles.emptyIcon} />
            <p>No stores found matching this category</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={styles.verticalGrid}
          >
            {(selectedCategory === "all" ? popular : filtered).map((bus) => (
              <motion.div key={bus.id} variants={itemVariants}>
                <BusinessCard business={bus} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
