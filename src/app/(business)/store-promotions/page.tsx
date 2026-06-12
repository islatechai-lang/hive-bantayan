"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "react-hot-toast";
import { Tag, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./store-promotions.module.css";

export default function StorePromotionsPage() {
  const { user } = useAuthStore();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: "",
    description: "",
    expiresAt: "",
  });

  const fetchPromos = async () => {
    if (!user?.businessId) return;
    try {
      const q = query(
        collection(db, COLLECTIONS.PROMOTIONS),
        where("businessId", "==", user.businessId)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPromos(items);
    } catch (error) {
      console.error("Error fetching promos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromos();
  }, [user]);

  const handleCreate = async () => {
    if (!formData.code || !formData.discountPercent) {
      toast.error("Code and discount are required");
      return;
    }
    try {
      await addDoc(collection(db, COLLECTIONS.PROMOTIONS), {
        businessId: user?.businessId,
        code: formData.code.toUpperCase(),
        discountPercent: Number(formData.discountPercent),
        description: formData.description,
        expiresAt: formData.expiresAt ? Timestamp.fromDate(new Date(formData.expiresAt)) : null,
        createdAt: Timestamp.now(),
        active: true,
      });
      toast.success("Promo code created!");
      setShowForm(false);
      setFormData({ code: "", discountPercent: "", description: "", expiresAt: "" });
      fetchPromos();
    } catch (error) {
      console.error("Error creating promo:", error);
      toast.error("Failed to create promo code");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.PROMOTIONS, id));
      toast.success("Promo code deleted");
      setPromos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting promo:", error);
      toast.error("Failed to delete promo code");
    }
  };

  if (loading) {
    return (
      <div className={styles.skeletonContainer}>
        <Skeleton height={32} width={180} />
        <Skeleton height={100} />
        <Skeleton height={100} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Promo Codes</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add
        </Button>
      </div>

      {promos.length === 0 ? (
        <div className={styles.emptyState}>
          <Tag size={48} style={{ opacity: 0.4 }} />
          <h3>No Promo Codes</h3>
          <p>Create promo codes to attract more customers to your store.</p>
        </div>
      ) : (
        <div className={styles.promoList}>
          {promos.map((promo) => (
            <Card key={promo.id} className={styles.promoCard}>
              <div className={styles.promoHeader}>
                <span className={styles.promoCode}>{promo.code}</span>
                <span className={styles.promoDiscount}>{promo.discountPercent}% OFF</span>
              </div>
              {promo.description && (
                <div className={styles.promoDetails}>{promo.description}</div>
              )}
              <div className={styles.promoFooter}>
                <span className={styles.promoExpiry}>
                  {promo.expiresAt ? `Expires: ${new Date(promo.expiresAt.seconds * 1000).toLocaleDateString()}` : "No expiry"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(promo.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Promo Form (Bottom Sheet) */}
      <AnimatePresence>
        {showForm && (
          <div className={styles.formOverlay} onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={styles.formSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={styles.formTitle}>New Promo Code</h2>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Promo Code</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Discount (%)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  placeholder="e.g. 15"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Description (optional)</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. Summer sale discount"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Expires On (optional)</label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>

              <div className={styles.formActions}>
                <Button variant="ghost" size="md" fullWidth onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" fullWidth onClick={handleCreate}>
                  Create Promo
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
