"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import type { Product, Business } from "@/lib/types";

export function useProducts(businessId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    async function fetchStoreAndProducts() {
      setLoading(true);
      try {
        // 1. Fetch business info
        const busRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
        const busSnap = await getDoc(busRef);

        if (!busSnap.exists()) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        const businessData = { id: busSnap.id, ...busSnap.data() } as Business;
        setBusiness(businessData);

        // 2. Fetch products subcollection
        const prodRef = collection(db, COLLECTIONS.BUSINESSES, businessId, COLLECTIONS.PRODUCTS);
        const snapshot = await getDocs(prodRef);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(items);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching business products:", err);
        setError(err.message || "Failed to load store content");
      } finally {
        setLoading(false);
      }
    }

    fetchStoreAndProducts();
  }, [businessId]);

  return {
    products,
    business,
    loading,
    error,
  };
}
