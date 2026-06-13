"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, RefreshCw, ClipboardList } from "lucide-react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { formatCurrency, formatDateShort, formatTime } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./orders.module.css";

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchOrderHistory() {
      try {
        const q = query(
          collection(db, COLLECTIONS.ORDERS),
          where("customerId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(items);
      } catch (error) {
        console.error("Error loading order history:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrderHistory();
  }, [user]);

  const handleReorder = (order: any) => {
    order.items.forEach((item: any) => {
      addItem({
        productId: item.productId,
        businessId: order.businessId,
        businessName: order.businessName,
        name: item.name,
        imageUrl: item.imageUrl || "/images/product-placeholder.jpg",
        price: item.price,
        quantity: item.qty,
        selectedVariants: [], // Default empty on reorder
        selectedAddOns: [],
        notes: item.notes || "",
      });
    });
    toast.success("Items added to cart!");
    router.push("/cart");
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case "pending":
        return "pending";
      case "accepted":
        return "accepted";
      case "out_for_delivery":
        return "delivery";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      default:
        return "primary";
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height={20} width={120} />
        <Skeleton height={140} style={{ marginTop: 20 }} />
        <Skeleton height={140} style={{ marginTop: 16 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Order History</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
          <ClipboardList size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>No Orders Yet</h3>
          <p>When you place cash-on-delivery orders, they will show up here.</p>
          <Button variant="primary" onClick={() => router.push("/home")} style={{ marginTop: 20 }}>
            Start Ordering
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((order) => (
            <Card key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <span className={styles.orderNumber}>{order.orderNumber}</span>
                  <div className={styles.orderDate}>
                    {order.createdAt ? (
                      <>
                        {formatDateShort(order.createdAt)} at {formatTime(order.createdAt)}
                      </>
                    ) : (
                      "Just now"
                    )}
                  </div>
                </div>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>

              {/* Items Summaries */}
              <div className={styles.itemSummary}>
                <strong>{order.businessName}</strong>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
                  {order.items.map((it: any) => `${it.qty}x ${it.name}`).join(", ")}
                </div>
              </div>

              {/* Action buttons triggers */}
              <div className={styles.orderFooter}>
                <span className={styles.totalPrice}>{formatCurrency(order.total)}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw size={12} />}
                    onClick={() => handleReorder(order)}
                  >
                    Reorder
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    Track
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
