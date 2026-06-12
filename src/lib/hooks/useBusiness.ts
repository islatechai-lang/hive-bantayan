"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import type { Business } from "@/lib/types";

export function useBusiness() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all approved businesses
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true);
      try {
        const q = query(
          collection(db, COLLECTIONS.BUSINESSES),
          where("status", "==", "approved")
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Business[];
        setBusinesses(items);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching businesses:", err);
        setError(err.message || "Failed to load businesses");
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, []);

  const getFeaturedBusinesses = () => {
    return businesses.slice(0, 3); // Simple mock recommendation: first 3
  };

  const getPopularBusinesses = () => {
    return [...businesses]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5); // Sorted by highest rating
  };

  const getBusinessesByCategory = (category: string) => {
    if (category === "all") return businesses;
    return businesses.filter((b) => b.category === category);
  };

  return {
    businesses,
    loading,
    error,
    getFeaturedBusinesses,
    getPopularBusinesses,
    getBusinessesByCategory,
  };
}
