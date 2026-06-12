"use client";

import React, { useRef } from "react";
import { Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";
import { cn } from "@/lib/utils/cn";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search products, stores, categories...",
  className,
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <Search size={18} className={styles.searchIcon} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
      {value && (
        <button
          onClick={handleClear}
          className={styles.clearBtn}
          aria-label="Clear search input"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
export { SearchBar };
