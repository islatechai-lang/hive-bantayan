"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, PlusCircle, ShoppingBag, Edit, Trash2 } from "lucide-react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Toggle from "@/components/ui/Toggle/Toggle";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./products.module.css";

export default function ManageProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessId) return;
    const businessId = user.businessId;

    async function fetchStoreProducts() {
      try {
        const prodRef = collection(db, COLLECTIONS.BUSINESSES, businessId, COLLECTIONS.PRODUCTS);
        const snap = await getDocs(prodRef);
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStoreProducts();
  }, [user]);

  const handleStockToggle = async (productId: string, currentStock: boolean) => {
    if (!user?.businessId) return;
    try {
      const prodRef = doc(db, COLLECTIONS.BUSINESSES, user.businessId, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(prodRef, { inStock: !currentStock });
      
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, inStock: !currentStock } : p))
      );
      toast.success("Stock status updated!");
    } catch (error) {
      console.error("Error updating stock status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    if (!user?.businessId) return;

    try {
      const prodRef = doc(db, COLLECTIONS.BUSINESSES, user.businessId, COLLECTIONS.PRODUCTS, productId);
      await deleteDoc(prodRef);

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton height={32} width={180} />
          <Skeleton height={32} width={80} />
        </div>
        <Skeleton height={80} style={{ marginTop: 12 }} />
        <Skeleton height={80} style={{ marginTop: 12 }} />
        <Skeleton height={80} style={{ marginTop: 12 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Manage Products</h1>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => router.push("/products/new")}
        >
          Add New
        </Button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
          <ShoppingBag size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>No Products Yet</h3>
          <p>Add products to your shop so customers on the island can start ordering!</p>
          <Button variant="primary" onClick={() => router.push("/products/new")} style={{ marginTop: 20 }}>
            Create First Product
          </Button>
        </div>
      ) : (
        <div className={styles.productList}>
          {products.map((prod) => (
            <Card key={prod.id} className={styles.productCard}>
              <div className={styles.productInfo}>
                <span className={styles.productName}>{prod.name}</span>
                <span className={styles.productPrice}>{formatCurrency(prod.price)}</span>
                <span style={{ fontSize: 12, color: "var(--text-light)" }}>Category: {prod.category}</span>
              </div>

              <div className={styles.productActions}>
                {/* Stock Toggle */}
                <div className={styles.switchCol}>
                  <span className={styles.switchLabel}>{prod.inStock ? "IN STOCK" : "OUT OF STOCK"}</span>
                  <Toggle
                    checked={prod.inStock}
                    onChange={() => handleStockToggle(prod.id, prod.inStock)}
                  />
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => router.push(`/products/${prod.id}`)}
                  style={{ color: "var(--text-light)", cursor: "pointer" }}
                  aria-label="Edit product"
                >
                  <Edit size={18} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  style={{ color: "var(--status-cancelled)", cursor: "pointer" }}
                  aria-label="Delete product"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
