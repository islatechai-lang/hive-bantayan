"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Phone, MapPin, AlertCircle, ShoppingBag, CheckCircle2 } from "lucide-react";
import { subscribeToDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatCurrency, formatEstimatedTime } from "@/lib/utils/formatters";
import { createWhatsAppUrl } from "@/lib/utils/helpers";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "../orders.module.css";

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="app-container" style={{ padding: 20 }}>
        <Skeleton height={20} width={100} />
        <Skeleton height={180} style={{ marginTop: 24 }} />
        <Skeleton height={260} style={{ marginTop: 16 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="app-container" style={{ padding: 40, textAlign: "center" }}>
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
    { key: "accepted", label: "Accepted", desc: "Store has accepted your order" },
    { key: "preparing", label: "Preparing", desc: "Kitchen/store is preparing items" },
    { key: "ready", label: "Ready", desc: "Items are packed and ready for delivery" },
    { key: "out_for_delivery", label: "On the Way", desc: "Business rider is delivering" },
    { key: "completed", label: "Completed", desc: "Order delivered successfully" },
  ];

  // Find index of current status
  const currentStepIdx = steps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className={styles.container}>
      {/* Header back button */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => router.push("/orders")}
          style={{ cursor: "pointer", display: "flex", color: "var(--text-muted)" }}
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
          <Badge variant={isCancelled ? "cancelled" : "primary"}>
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>

        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Store: <strong>{order.businessName}</strong>
        </p>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
          Payment: <strong>Cash on Delivery (COD)</strong>
        </p>
      </Card>

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
        <h3 style={{ fontSize: 16, borderBottom: "1px solid var(--border-color)", paddingBottom: 8 }}>
          Items Summary
        </h3>
        {order.items.map((it: any, idx: number) => (
          <div key={idx} className={styles.detailRow}>
            <span>
              {it.qty}x {it.name}{" "}
              {it.variant && <span style={{ fontSize: 11, color: "var(--text-light)" }}>({it.variant})</span>}
            </span>
            <span>{formatCurrency(it.price * it.qty)}</span>
          </div>
        ))}
        <div className={styles.detailRow} style={{ borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
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
