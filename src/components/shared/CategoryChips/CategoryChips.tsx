"use client";

import React from "react";
import { CATEGORIES } from "@/lib/utils/constants";
import styles from "./CategoryChips.module.css";
import { cn } from "@/lib/utils/cn";

export interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showAll?: boolean;
}

const CategoryChips = ({
  selectedCategory,
  onSelectCategory,
  showAll = true,
}: CategoryChipsProps) => {
  return (
    <div className={styles.container}>
      {showAll && (
        <button
          onClick={() => onSelectCategory("all")}
          className={cn(
            styles.chip,
            selectedCategory === "all" && styles.activeChip
          )}
        >
          <span>🏝️</span>
          <span>All Stores</span>
        </button>
      )}
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            styles.chip,
            selectedCategory === category.id && styles.activeChip
          )}
        >
          <span>{category.emoji}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
export { CategoryChips };
