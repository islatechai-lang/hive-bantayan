"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Phone, MapPin, AlertCircle, ShoppingBag, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { subscribeToDocument, getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatCurrency, formatEstimatedTime } from "@/lib/utils/formatters";
import { createWhatsAppUrl } from "@/lib/utils/helpers";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import DeliveryMap from "@/components/shared/DeliveryMap/DeliveryMap";
import styles from "../orders.module.css";

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Listen in real-time to the order document changes
    const unsubscribe = subscribeToDocument<any>(
      COLLECTIONS.ORDERS,
      orderId,
      (data) => {
        setOrder(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !order || order.status !== "out_for_delivery") return;
    if (typeof window === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const oldLat = order.deliveryAddress?.lat;
          const oldLng = order.deliveryAddress?.lng;
          const dist = Math.abs(lat - (oldLat || 0)) + Math.abs(lng - (oldLng || 0));
          if (dist > 0.0001) {
            const { doc, updateDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase/config");
            const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
            await updateDoc(orderRef, {
              "deliveryAddress.lat": lat,
              "deliveryAddress.lng": lng,
            });
          }
        } catch (err) {
          console.error("Failed to update live coordinate:", err);
        }
      },
      (err) => {
        console.error("Error watching geolocation:", err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId, order?.status, order?.deliveryAddress?.lat, order?.deliveryAddress?.lng]);

  useEffect(() => {
    if (!order || !order.businessId) return;

    const fetchStoreCoords = async () => {
      try {
        const businessDoc: any = await getDocument(COLLECTIONS.BUSINESSES, order.businessId);
        if (businessDoc && businessDoc.lat && businessDoc.lng) {
          setStoreCoords({ lat: businessDoc.lat, lng: businessDoc.lng });
        } else {
          setStoreCoords({ lat: 11.1685, lng: 123.7268 }); // Bantayan Center
        }
      } catch (err) {
        console.error("Error fetching store coordinates:", err);
        setStoreCoords({ lat: 11.1685, lng: 123.7268 });
      }
    };

    fetchStoreCoords();
  }, [order]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height={20} width={100} />
        <Skeleton height={180} style={{ marginTop: 24 }} />
        <Skeleton height={260} style={{ marginTop: 16 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container} style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Order Not Found</h2>
        <p>The order you are trying to track does not exist.</p>
        <Button variant="outline" onClick={() => router.push("/orders")} style={{ marginTop: 20 }}>
          Back to Orders
        </Button>
      </div>
    );
  }

  // Define steps for timeline tracking
  const steps = [
    { key: "pending", label: "Order Placed", desc: "Waiting for store validation" },
    { key: "accepted", label: "Accepted & Preparing", desc: "Store has accepted & is preparing your order" },
    { key: "out_for_delivery", label: "On the Way", desc: "Business rider is delivering" },
    { key: "completed", label: "Completed", desc: "Order delivered successfully" },
  ];

  // Map database states (preparing/ready) to "accepted" step
  const normalizedStatus = (order.status === "preparing" || order.status === "ready") ? "accepted" : order.status;
  const currentStepIdx = steps.findIndex((s) => s.key === normalizedStatus);
  const isCancelled = order.status === "cancelled";

  const showMap = (order.status === "out_for_delivery" || order.status === "accepted" || order.status === "preparing" || order.status === "ready") &&
    storeCoords &&
    order.deliveryAddress?.lat &&
    order.deliveryAddress?.lng;

  return (
    <div className={styles.container}>
      {/* Header back button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/orders")}
          style={{ cursor: "pointer", display: "flex", color: "var(--text-muted)", background: "none", border: "none" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Track Order</h1>
      </div>

      {/* Main Order Information */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 12, color: "var(--text-light)" }}>ORDER NUMBER</span>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{order.orderNumber}</h3>
          </div>
          <Badge variant={isCancelled ? "cancelled" : (order.status === "out_for_delivery" ? "delivery" : order.status === "completed" ? "completed" : "accepted")}>
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Store: <strong>{order.businessName}</strong>
        </p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
          Payment: <strong>Cash on Delivery (COD)</strong>
        </p>
        {order.notes && (
          <p style={{ fontSize: 13, color: "var(--text-light)", marginTop: 6, fontStyle: "italic" }}>
            Note: "{order.notes}"
          </p>
        )}
      </Card>

      {/* Map Delivery Route */}
      {showMap && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={16} color="var(--primary)" />
              Live Delivery Route
            </span>
            <span style={{ fontSize: 11, color: "var(--text-light)" }}>Bantayan Island</span>
          </div>
          <DeliveryMap
            origin={storeCoords!}
            destination={{ lat: order.deliveryAddress.lat, lng: order.deliveryAddress.lng }}
            originName={order.businessName}
            destinationName="Your Location"
          />
        </Card>
      )}

      {/* Timeline Statuses */}
      {isCancelled ? (
        <Card style={{ borderColor: "var(--status-cancelled)", backgroundColor: "var(--status-cancelled-bg)" }}>
          <div style={{ display: "flex", gap: 10, color: "var(--status-cancelled)" }}>
            <AlertCircle size={20} />
            <div>
              <h4 style={{ fontWeight: 700 }}>Order Cancelled</h4>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Reason: {order.cancelReason || "No cancellation reason provided."}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Delivery Status</h3>
          <div className={styles.timeline}>
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isCompleted = idx < currentStepIdx;
              
              let stepClass = "";
              if (isActive) stepClass = styles.activeStep;
              else if (isCompleted) stepClass = styles.completedStep;

              return (
                <div key={step.key} className={`${styles.timelineStep} ${stepClass}`}>
                  <div className={styles.timelineDot} />
                  <span className={styles.stepTitle}>{step.label}</span>
                  <span className={styles.stepDesc}>{step.desc}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Items Summary detail lists */}
      <Card className={styles.detailsCard}>
        <h3 style={{ fontSize: 16, borderBottom: "1px solid var(--border-color)", paddingBottom: 8, marginBottom: 12 }}>
          Items Summary
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {order.items.map((it: any, idx: number) => (
            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--border-color-light, #f1f5f9)" }}>
              {it.imageUrl && (
                <div style={{ position: "relative", width: 44, height: 44, borderRadius: "6px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-color)" }}>
                  <Image src={it.imageUrl} alt={it.name} fill style={{ objectFit: "cover" }} />
                </div>
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
                  {it.name} <span style={{ color: "var(--primary)", fontSize: 12 }}>x{it.qty}</span>
                </span>
                {it.variant && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{it.variant}</span>}
                {it.notes && <span style={{ fontSize: 11, color: "var(--text-light)", fontStyle: "italic" }}>"{it.notes}"</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{formatCurrency(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div className={styles.detailRow} style={{ borderTop: "1px solid var(--border-color)", paddingTop: 10, marginTop: 8 }}>
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className={styles.detailRow}>
          <span>Delivery Fee</span>
          <span>{formatCurrency(order.deliveryFee)}</span>
        </div>
        <div className={styles.detailRow} style={{ fontWeight: 800, color: "var(--text-main)", fontSize: 15 }}>
          <span>Total Price</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </Card>

      {/* Action button triggers for chat/call */}
      <div style={{ display: "flex", gap: 12 }}>
        <Button
          variant="outline"
          fullWidth
          leftIcon={<MessageSquare size={16} />}
          onClick={() => router.push(`/chat/${order.businessId}`)}
        >
          Message Shop
        </Button>
        <Button
          variant="primary"
          fullWidth
          leftIcon={<Phone size={16} />}
          onClick={() => {
            const waUrl = createWhatsAppUrl(order.customerPhone, `Hello, regarding my order ${order.orderNumber}...`);
            window.open(waUrl, "_blank");
          }}
        >
          Call Shop
        </Button>
      </div>
    </div>
  );
}
