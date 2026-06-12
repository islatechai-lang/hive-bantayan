"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import { ClipboardList } from "lucide-react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./store-orders.module.css";

const STATUSES = ["all", "pending", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export default function StoreOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user?.businessId) return;

    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("businessId", "==", user.businessId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, {
        status,
        statusHistory: [
          ...(order.statusHistory || []),
          { status, timestamp: new Date(), note: `Status updated to: ${status.replace(/_/g, " ").toUpperCase()}` },
        ],
      });
      toast.success(`Order status updated to: ${status}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className={styles.skeletonContainer}>
        <Skeleton height={32} width={200} />
        <div className={styles.skeletonFilters}>
          <Skeleton height={36} width={60} variant="pill" />
          <Skeleton height={36} width={80} variant="pill" />
          <Skeleton height={36} width={90} variant="pill" />
          <Skeleton height={36} width={70} variant="pill" />
        </div>
        <Skeleton height={120} />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </div>
    );
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const getStatusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const getStatusVariant = (s: string): "pending" | "accepted" | "preparing" | "ready" | "delivery" | "completed" | "cancelled" | "primary" => {
    switch (s) {
      case "pending": return "pending";
      case "accepted": return "accepted";
      case "preparing": return "preparing";
      case "ready": return "ready";
      case "out_for_delivery": return "delivery";
      case "completed": return "completed";
      case "cancelled": return "cancelled";
      default: return "primary";
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Orders Manager</h1>

      {/* Status Filters */}
      <div className={styles.filterRow}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.activeFilter : ""}`}
            onClick={() => setFilter(s)}
          >
            {getStatusLabel(s)} {s !== "all" && `(${orders.filter((o) => o.status === s).length})`}
            {s === "all" && `(${orders.length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={48} style={{ opacity: 0.4 }} />
          <h3>No Orders Found</h3>
          <p>No orders match the selected filter.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((ord) => (
            <Card key={ord.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <div className={styles.orderNum}>{ord.orderNumber || `#${ord.id.slice(-6)}`}</div>
                  <div className={styles.orderTime}>
                    {ord.createdAt ? formatRelativeTime(ord.createdAt) : ""}
                  </div>
                </div>
                <Badge variant={getStatusVariant(ord.status)}>{getStatusLabel(ord.status)}</Badge>
              </div>

              <div className={styles.orderItems}>
                {ord.items?.map((it: any, i: number) => `${it.qty}x ${it.name}`).join(", ")}
              </div>

              <div className={styles.orderFooter}>
                <span className={styles.orderTotal}>{formatCurrency(ord.total)}</span>

                <div className={styles.actionBtns}>
                  {ord.status === "pending" && (
                    <>
                      <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(ord.id, "cancelled")}>
                        Reject
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(ord.id, "accepted")}>
                        Accept
                      </Button>
                    </>
                  )}
                  {ord.status === "accepted" && (
                    <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(ord.id, "preparing")}>
                      Prepare
                    </Button>
                  )}
                  {ord.status === "preparing" && (
                    <Button variant="accent" size="sm" onClick={() => handleUpdateStatus(ord.id, "ready")}>
                      Ready
                    </Button>
                  )}
                  {ord.status === "ready" && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(ord.id, "out_for_delivery")}>
                      Deliver
                    </Button>
                  )}
                  {ord.status === "out_for_delivery" && (
                    <Button variant="primary" size="sm" style={{ backgroundColor: "var(--status-completed)" }} onClick={() => handleUpdateStatus(ord.id, "completed")}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
