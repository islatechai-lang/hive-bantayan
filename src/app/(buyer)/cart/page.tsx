"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, ShoppingBag, MapPin, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { addDocument, getDocument } from "@/lib/firebase/firestore";
import { sendPushNotification } from "@/lib/utils/onesignal";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatCurrency, generateOrderNumber } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import styles from "./cart.module.css";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getCartSubtotal } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Delivery configuration simulation (can be queried from the business document)
  const deliveryFee = items.length > 0 ? 39 : 0; // Flat 39 PHP island delivery fee
  const subtotal = getCartSubtotal();
  const total = subtotal + deliveryFee;

  const [addressText, setAddressText] = useState("Bantayan Island, Cebu");
  const [landmark, setLandmark] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 11.1685, lng: 123.7268 });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "detecting" | "success" | "failed">("idle");

  React.useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setGpsStatus("detecting");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsStatus("success");
        },
        (error) => {
          console.error("Error getting location:", error);
          setGpsStatus("failed");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place orders");
      router.push("/login");
      return;
    }

    if (items.length === 0) return;

    if (!addressText.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    setLoading(true);

    try {
      const orderNumber = generateOrderNumber();
      const firstItem = items[0];

      // Format items list for database
      const orderItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        qty: item.quantity,
        price: item.price,
        variant: item.selectedVariants.map((v) => `${v.variantName}: ${v.selectedOption.label}`).join(", ") || "",
        addOns: item.selectedAddOns.map((a) => a.name) || [],
        notes: item.notes || "",
      }));

      const deliveryAddress = {
        id: "custom-address",
        label: "Delivery Address",
        address: addressText,
        lat: coordinates.lat,
        lng: coordinates.lng,
        landmark: landmark,
        notes: addressNotes,
        isDefault: true,
      };

      const newOrder = {
        orderNumber,
        customerId: user.id,
        customerName: user.displayName,
        customerPhone: user.phone || "09171234567", // Fallback if phone not updated
        businessId: firstItem.businessId,
        businessName: firstItem.businessName,
        items: orderItems,
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        paymentMethod: "cod",
        status: "pending",
        cancelReason: "",
        cancelledBy: null,
        deliveryAddress,
        notes: addressNotes,
        estimatedDelivery: null,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(),
            note: "Order placed successfully. Waiting for store verification.",
          },
        ],
      };

      const orderId = await addDocument(COLLECTIONS.ORDERS, newOrder);

      // Fetch store owner and notify via OneSignal
      try {
        const businessDoc: any = await getDocument(COLLECTIONS.BUSINESSES, firstItem.businessId);
        if (businessDoc && businessDoc.ownerId) {
          await sendPushNotification(
            [businessDoc.ownerId],
            "New Order Received! 🛍️",
            `Order ${orderNumber} (${formatCurrency(total)}) has been placed by ${user.displayName}.`,
            { orderId, type: "new_order" }
          );
        }
      } catch (pushErr) {
        console.error("OneSignal notification failed:", pushErr);
      }

      toast.success("Order placed successfully!");
      clearCart();
      
      // Redirect to Order Tracking screen
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      console.error("Order submission error:", err);
      toast.error(err.message || "Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="app-container">
        <div className={styles.emptyCart}>
          <ShoppingBag size={48} className={styles.emptyIcon} />
          <h2>Your Cart is Empty</h2>
          <p>Browse local stores to add delicious items and products to your cart!</p>
          <Button variant="primary" onClick={() => router.push("/home")}>
            Shop Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Shopping Cart</h1>

      {/* Cart Items list */}
      <div className={styles.cartList}>
        {items.map((item, index) => (
          <div key={index} className={styles.cartItem}>
            <div className={styles.itemImage}>
              <Image src={item.imageUrl} alt={item.name} fill className={styles.image} />
            </div>

            <div className={styles.itemInfo}>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.productId, item.selectedVariants, item.selectedAddOns)}
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Selected Options/Addons */}
              {(item.selectedVariants.length > 0 || item.selectedAddOns.length > 0) && (
                <div className={styles.itemMeta}>
                  {item.selectedVariants.map((v, idx) => (
                    <div key={idx}>
                      • {v.variantName}: <strong>{v.selectedOption.label}</strong>
                    </div>
                  ))}
                  {item.selectedAddOns.map((a, idx) => (
                    <div key={idx}>
                      • Add-on: <strong>{a.name}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Order Notes text area */}
              <input
                type="text"
                placeholder="Add special instructions (e.g. no onions)"
                value={item.notes || ""}
                onChange={(e) =>
                  updateQuantity(
                    item.productId,
                    item.selectedVariants,
                    item.selectedAddOns,
                    item.quantity
                  )
                }
                className={styles.notesInput}
              />

              <div className={styles.itemBottom}>
                <span className={styles.itemPrice}>{formatCurrency(item.unitTotal * item.quantity)}</span>
                <div className={styles.qtyWrapper}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.selectedVariants,
                        item.selectedAddOns,
                        item.quantity - 1
                      )
                    }
                  >
                    -
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.selectedVariants,
                        item.selectedAddOns,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address section */}
      <div className={styles.addressCard}>
        <div className={styles.addressHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={16} color="var(--primary)" />
            <span>Delivery details</span>
          </div>
          <span 
            style={{ 
              fontSize: 11, 
              padding: "2px 8px", 
              borderRadius: "12px", 
              background: gpsStatus === "success" ? "#D1FAE5" : gpsStatus === "detecting" ? "#FEF3C7" : "#FEE2E2",
              color: gpsStatus === "success" ? "#065F46" : gpsStatus === "detecting" ? "#92400E" : "#991B1B",
              fontWeight: 600
            }}
          >
            {gpsStatus === "success" ? "📍 GPS Acquired" : gpsStatus === "detecting" ? "⚡ Fetching GPS..." : "⚠️ GPS Off (Using Default)"}
          </span>
        </div>
        <div className={styles.addressForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Delivery Address / Street / Barangay</label>
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              className={styles.inputField}
              placeholder="e.g. Brgy. Binaobao, Bantayan Town"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Landmark / House Description</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className={styles.inputField}
              placeholder="e.g. Near Bantayan Plaza, red gate"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Delivery Instructions (for rider)</label>
            <input
              type="text"
              value={addressNotes}
              onChange={(e) => setAddressNotes(e.target.value)}
              className={styles.inputField}
              placeholder="e.g. Leave with guard / call upon arrival"
            />
          </div>
        </div>
      </div>

      {/* Payment details (COD exclusive) */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <CreditCard size={18} color="var(--secondary)" />
          <span>Payment Method: <strong>Cash on Delivery (COD)</strong></span>
        </div>
      </Card>

      {/* Cart Summary */}
      <div className={styles.summarySection}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Delivery Fee</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Total (VAT incl.)</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={handlePlaceOrder}
        rightIcon={!loading && <ArrowRight size={18} />}
        style={{ marginTop: 10 }}
      >
        Place Order
      </Button>
    </div>
  );
}
