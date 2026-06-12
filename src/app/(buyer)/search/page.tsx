"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Compass, Eye, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useBusiness } from "@/lib/hooks/useBusiness";
import SearchBar from "@/components/shared/SearchBar/SearchBar";
import BusinessCard from "@/components/shared/BusinessCard/BusinessCard";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./search.module.css";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { businesses, loading } = useBusiness();
  const [queryVal, setQueryVal] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<"rating" | "delivery" | "all">("all");
  const [searchResults, setSearchResults] = useState(businesses);

  // Sync with URL query param if it changes
  useEffect(() => {
    setQueryVal(initialQuery);
  }, [initialQuery]);

  // Run search filtering logic
  useEffect(() => {
    let results = [...businesses];

    // Filter by query matches name, description, tags, or category
    if (queryVal.trim()) {
      const q = queryVal.toLowerCase().trim();
      results = results.filter(
        (bus) =>
          bus.name.toLowerCase().includes(q) ||
          bus.description.toLowerCase().includes(q) ||
          bus.category.toLowerCase().includes(q) ||
          bus.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Apply sorting filters
    if (activeFilter === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    } else if (activeFilter === "delivery") {
      results.sort((a, b) => a.deliveryFee - b.deliveryFee);
    }

    setSearchResults(results);
  }, [queryVal, businesses, activeFilter]);

  // Autocomplete suggestions (mock tags based on typed characters)
  const getSuggestions = () => {
    if (!queryVal.trim()) return [];
    const q = queryVal.toLowerCase().trim();
    const suggestions: string[] = [];

    businesses.forEach((b) => {
      if (b.name.toLowerCase().includes(q) && !suggestions.includes(b.name)) {
        suggestions.push(b.name);
      }
      b.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(q) && !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      });
    });

    return suggestions.slice(0, 5); // Limit suggestions to 5
  };

  const suggestions = getSuggestions();

  return (
    <div className={styles.container}>
      <div className={styles.searchHeader}>
        <SearchBar
          value={queryVal}
          onChange={(val) => setQueryVal(val)}
          placeholder="Search products or store names..."
        />

        {/* Filter Badges Row */}
        <div className={styles.filtersRow}>
          <button
            onClick={() => setActiveFilter("all")}
            className={`${styles.filterBtn} ${activeFilter === "all" ? styles.activeFilter : ""}`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveFilter("rating")}
            className={`${styles.filterBtn} ${activeFilter === "rating" ? styles.activeFilter : ""}`}
          >
            <SlidersHorizontal size={14} />
            Top Rated
          </button>
          <button
            onClick={() => setActiveFilter("delivery")}
            className={`${styles.filterBtn} ${activeFilter === "delivery" ? styles.activeFilter : ""}`}
          >
            <ArrowUpDown size={14} />
            Cheapest Delivery
          </button>
        </div>
      </div>

      {/* Autocomplete Overlay */}
      {suggestions.length > 0 && queryVal.trim() !== suggestions[0] && (
        <div className={styles.autocompleteList}>
          {suggestions.map((item, index) => (
            <button
              key={index}
              className={styles.autocompleteItem}
              onClick={() => setQueryVal(item)}
            >
              <Search size={14} className={styles.itemIcon} />
              <span className={styles.itemText}>{item}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search results list */}
      <div className={styles.resultsHeader}>
        {queryVal ? `Results for "${queryVal}"` : "Explore All Stores"} ({searchResults.length})
      </div>

      {loading ? (
        <div className={styles.resultsGrid}>
          <Skeleton height={180} />
          <Skeleton height={180} />
        </div>
      ) : searchResults.length === 0 ? (
        <div className={styles.emptyState}>
          <Compass size={40} className={styles.emptyIcon} />
          <h3>No stores found</h3>
          <p>Try searching for different terms like "seafood", "pizza", or "pharmacy".</p>
        </div>
      ) : (
        <div className={styles.resultsGrid}>
          {searchResults.map((bus) => (
            <BusinessCard key={bus.id} business={bus} />
          ))}
        </div>
      )}
    </div>
  );
}
