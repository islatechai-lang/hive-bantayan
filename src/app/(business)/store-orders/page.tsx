"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { getDocument } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import { ClipboardList, MessageSquare, Phone, MapPin, ExternalLink, User } from "lucide-react";
import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import DeliveryMap from "@/components/shared/DeliveryMap/DeliveryMap";
import { sendPushNotification } from "@/lib/utils/onesignal";
import { createWhatsAppUrl } from "@/lib/utils/helpers";
import { useRouter } from "next/navigation";
import styles from "./store-orders.module.css";

const STATUSES = ["all", "pending", "accepted", "out_for_delivery", "completed", "cancelled"];

export default function StoreOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user?.businessId) return;

    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("businessId", "==", user.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setOrders(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchStoreCoords = async () => {
      try {
        const businessDoc: any = await getDocument(COLLECTIONS.BUSINESSES, user.businessId!);
        if (businessDoc) {
          if (businessDoc.lat && businessDoc.lng) {
            setStoreCoords({ lat: businessDoc.lat, lng: businessDoc.lng });
          } else {
            setStoreCoords({ lat: 11.1685, lng: 123.7268 }); // Bantayan Center
          }
        }
      } catch (err) {
        console.error("Error fetching store coords:", err);
        setStoreCoords({ lat: 11.1685, lng: 123.7268 });
      }
    };

    fetchStoreCoords();
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

      // Send push notification to the customer
      try {
        if (order.customerId) {
          const readableStatus = status.replace(/_/g, " ").toUpperCase();
          await sendPushNotification(
            [order.customerId],
            "Order Status Update! 📍",
            `Your order ${order.orderNumber || `#${orderId.slice(-6)}`} is now [${readableStatus}].`,
            { orderId, type: "order_status" }
          );
        }
      } catch (pushErr) {
        console.error("OneSignal status update notification failed:", pushErr);
      }

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

  const getStatusLabel = (s: string) => {
    if (s === "out_for_delivery") return "On the Way";
    return s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const getStatusVariant = (s: string): "pending" | "accepted" | "delivery" | "completed" | "cancelled" | "primary" => {
    switch (s) {
      case "pending": return "pending";
      case "accepted": return "accepted";
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
          {filteredOrders.map((ord) => {
            const hasCoords = ord.deliveryAddress?.lat && ord.deliveryAddress?.lng;
            const showCardMap = ord.status === "out_for_delivery" && storeCoords && hasCoords;

            return (
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

                {/* Customer Details Row */}
                <div className={styles.customerSection}>
                  <div className={styles.avatar}>
                    {ord.customerName ? ord.customerName.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerName}>{ord.customerName || "Anonymous Buyer"}</div>
                    <div className={styles.customerPhone}>{ord.customerPhone || "No Phone Number"}</div>
                  </div>
                  <div className={styles.customerActions}>
                    <button
                      className={styles.actionIconBtn}
                      onClick={() => router.push(`/chat/${ord.customerId}`)}
                      title="Chat with Customer"
                    >
                      <MessageSquare size={16} />
                    </button>
                    {ord.customerPhone && (
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className={styles.actionIconBtn}
                        title="Call Customer"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Product Thumbnails Grid */}
                <div className={styles.productThumbnails}>
                  {ord.items?.map((it: any, i: number) => (
                    <div key={i} className={styles.thumbnailRow}>
                      {it.imageUrl && (
                        <div className={styles.thumbnailWrapper}>
                          <Image
                            src={it.imageUrl}
                            alt={it.name}
                            fill
                            className={styles.thumbnailImage}
                          />
                        </div>
                      )}
                      <div className={styles.productText}>
                        <strong>{it.qty}x</strong> {it.name}
                        {it.variant && <span style={{ fontSize: 11, color: "var(--text-light)" }}> ({it.variant})</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address Box */}
                {ord.deliveryAddress && (
                  <div className={styles.addressBox}>
                    <div className={styles.addressHeader}>
                      <MapPin size={12} color="var(--primary)" />
                      <span>Delivery Location</span>
                    </div>
                    <div className={styles.addressDetail}>
                      {ord.deliveryAddress.address}
                    </div>
                    {ord.deliveryAddress.landmark && (
                      <div className={styles.addressNotes}>
                        Landmark: {ord.deliveryAddress.landmark}
                      </div>
                    )}
                    {ord.notes && (
                      <div className={styles.addressNotes} style={{ marginTop: 2, color: "var(--text-muted)" }}>
                        Instructions: "{ord.notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Live Delivery Route Map for Riders */}
                {showCardMap && (
                  <div style={{ marginTop: 6, borderRadius: "8px", overflow: "hidden" }}>
                    <DeliveryMap
                      origin={storeCoords!}
                      destination={{ lat: ord.deliveryAddress.lat, lng: ord.deliveryAddress.lng }}
                      originName="Your Store"
                      destinationName={ord.customerName || "Customer"}
                    />
                  </div>
                )}

                <div className={styles.orderFooter} style={{ marginTop: 8 }}>
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
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(ord.id, "out_for_delivery")}>
                        Out for Delivery
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
            );
          })}
        </div>
      )}
    </div>
  );
}
