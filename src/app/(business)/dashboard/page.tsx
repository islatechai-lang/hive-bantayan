"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ShoppingBag, DollarSign, Users, AlertCircle, BellRing, ClipboardList, CheckCircle2, XCircle, MessageSquare, Phone, MapPin, User } from "lucide-react";
import { collection, query, where, orderBy, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import DeliveryMap from "@/components/shared/DeliveryMap/DeliveryMap";
import { sendPushNotification } from "@/lib/utils/onesignal";
import { getDocument } from "@/lib/firebase/firestore";
import { createWhatsAppUrl } from "@/lib/utils/helpers";
import styles from "./dashboard.module.css";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    pendingCount: 0,
  });

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


  useEffect(() => {
    if (!user?.businessId) return;

    // Listen to business document in real-time
    const unsubBusiness = onSnapshot(doc(db, COLLECTIONS.BUSINESSES, user.businessId), (docSnap) => {
      if (docSnap.exists()) {
        setBusiness({ id: docSnap.id, ...docSnap.data() });
      }
    });

    // Listen to store orders in real-time
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("businessId", "==", user.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort in memory to avoid index requirements
      items.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(items);

      // Calculate stats
      let todayRev = 0;
      let monthRev = 0;
      let pending = 0;
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      items.forEach((ord: any) => {
        if (ord.status === "completed") {
          const createdAt = ord.createdAt?.toDate() || new Date();
          if (createdAt >= startOfToday) {
            todayRev += ord.total;
          }
          if (createdAt >= startOfMonth) {
            monthRev += ord.total;
          }
        }
        if (ord.status === "pending") {
          pending++;
        }
      });

      setStats({
        todayRevenue: todayRev,
        monthRevenue: monthRev,
        totalOrders: items.length,
        pendingCount: pending,
      });

      // Sound Alerts for incoming pending orders
      if (pending > 0) {
        // Trigger a premium UI sound notify
        const audio = new Audio("/sounds/new-order.mp3");
        audio.play().catch(() => {});
        toast("New order waiting for verification!", {
          icon: "🔔",
          duration: 4000,
        });
      }

      setLoading(false);
    });

    return () => {
      unsubBusiness();
      unsubscribe();
    };
  }, [user]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, {
        status,
        [`statusHistory`]: [
          ...order.statusHistory,
          {
            status,
            timestamp: new Date(),
            note: `Status updated to: ${status.replace(/_/g, " ").toUpperCase()}`,
          },
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
        console.error("OneSignal dashboard status update notification failed:", pushErr);
      }

      toast.success(`Order status updated to: ${status}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height={32} width={180} style={{ marginBottom: 24 }} />
        
        {/* Stats Grid Skeleton */}
        <div className={styles.statsGrid}>
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </div>
        
        {/* Orders Section Skeleton */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton height={24} width={150} />
            <Skeleton height={20} width={60} />
          </div>
          <Skeleton height={110} />
          <Skeleton height={110} />
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Store Dashboard</h1>

      {/* Business Registration Status Banner */}
      {business && (
        <>
          {business.status === "pending" && (
            <div className={`${styles.statusBanner} ${styles.statusBannerPending}`}>
              <AlertCircle size={20} className={styles.bannerIcon} />
              <div className={styles.bannerContent}>
                <div className={styles.bannerTitle}>Application Pending Approval</div>
                <div className={styles.bannerText}>
                  Your registration for <strong>{business.name}</strong> is currently under review. Buyers won't see your store or products on the app until it is approved. In the meantime, you can add products and adjust your settings.
                </div>
              </div>
            </div>
          )}

          {business.status === "rejected" && (
            <div className={`${styles.statusBanner} ${styles.statusBannerRejected}`}>
              <XCircle size={20} className={styles.bannerIcon} />
              <div className={styles.bannerContent}>
                <div className={styles.bannerTitle}>Registration Rejected</div>
                <div className={styles.bannerText}>
                  Your application has been rejected. Please review your store details or contact support.
                </div>
              </div>
            </div>
          )}

          {business.status === "unlisted" && (
            <div className={`${styles.statusBanner} ${styles.statusBannerUnlisted}`}>
              <AlertCircle size={20} className={styles.bannerIcon} />
              <div className={styles.bannerContent}>
                <div className={styles.bannerTitle}>Store Unlisted</div>
                <div className={styles.bannerText}>
                  Your store is currently unlisted. Buyers cannot find your store or products.
                </div>
              </div>
            </div>
          )}

          {business.status === "approved" && (
            <div className={`${styles.statusBanner} ${styles.statusBannerApproved}`}>
              <CheckCircle2 size={20} className={styles.bannerIcon} />
              <div className={styles.bannerContent}>
                <div className={styles.bannerTitle}>Store Status: Live & Active</div>
                <div className={styles.bannerText}>
                  Congratulations! Your business is verified and live on Hive Bantayan.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Today's Sales</span>
          <span className={styles.statVal} style={{ color: "var(--primary)" }}>
            {formatCurrency(stats.todayRevenue)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>This Month</span>
          <span className={styles.statVal}>
            {formatCurrency(stats.monthRevenue)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Orders</span>
          <span className={styles.statVal}>{stats.totalOrders}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending Orders</span>
          <span className={styles.statVal} style={{ color: "var(--accent)" }}>
            {stats.pendingCount}
          </span>
        </div>
      </div>

      {/* Sound Alerts Indicators */}
      {stats.pendingCount > 0 && (
        <div className={styles.soundAlert}>
          <BellRing size={16} className="pulse" />
          <span>You have {stats.pendingCount} pending orders awaiting action!</span>
        </div>
      )}

      {/* Incoming Orders Manager */}
      <section className={styles.ordersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Incoming Orders</h2>
          <Button variant="text" size="sm" onClick={() => router.push("/store-orders")}>
            View All
          </Button>
        </div>

        {activeOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-light)" }}>
            <ClipboardList size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>No active orders at the moment</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeOrders.map((ord) => {
              const hasCoords = ord.deliveryAddress?.lat && ord.deliveryAddress?.lng;
              const showCardMap = ord.status === "out_for_delivery" && storeCoords && hasCoords;

              return (
                <Card key={ord.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className={styles.orderNum}>{ord.orderNumber || `#${ord.id.slice(-6)}`}</div>
                      <div className={styles.orderTime}>
                        {ord.createdAt ? formatRelativeTime(ord.createdAt) : ""}
                      </div>
                    </div>
                    <Badge variant={ord.status === "out_for_delivery" ? "delivery" : ord.status === "completed" ? "completed" : "accepted"}>
                      {ord.status.toUpperCase()}
                    </Badge>
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

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span className={styles.orderTotal} style={{ fontSize: 15, color: "var(--primary)" }}>{formatCurrency(ord.total)}</span>

                    <div style={{ display: "flex", gap: 8 }}>
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
      </section>
    </div>
  );
}
