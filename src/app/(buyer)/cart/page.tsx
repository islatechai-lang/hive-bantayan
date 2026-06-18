"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, ShoppingBag, MapPin, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { addDocument, getDocument } from "@/lib/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { sendPushNotification } from "@/lib/utils/onesignal";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatCurrency, generateOrderNumber } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import styles from "./cart.module.css";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getCartSubtotal, updateNotes } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Delivery configuration simulation (can be queried from the business document)
  const deliveryFee = items.length > 0 ? 39 : 0; // Flat 39 PHP island delivery fee
  const subtotal = getCartSubtotal();
  const total = subtotal + deliveryFee;

  const [addressText, setAddressText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 11.1685, lng: 123.7268 });
  const [gpsStatus, setGpsStatus] = useState<"idle" | "detecting" | "success" | "failed">("idle");

  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  // Load saved locations from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hive_saved_locations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedLocations(parsed);
        } catch (e) {
          console.error("Failed to parse saved locations:", e);
        }
      }
    }
  }, []);

  // Silently request GPS on load as a helper
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
          setAddressText("📍 GPS Location (Acquired)");
        },
        (error) => {
          console.error("Initial GPS error:", error);
          setGpsStatus("failed");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your device");
      return;
    }
    setGpsStatus("detecting");
    const loaderId = toast.loading("Acquiring GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        setGpsStatus("success");
        setAddressText("📍 GPS Location (Acquired)");
        toast.success("GPS Location set!", { id: loaderId });
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsStatus("failed");
        toast.error("Failed to acquire GPS. Used default center.", { id: loaderId });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectSavedLocation = (id: string) => {
    setSelectedLocationId(id);
    if (id === "") {
      setAddressText("");
      setLandmark("");
      setAddressNotes("");
      setCoordinates({ lat: 11.1685, lng: 123.7268 });
      return;
    }
    const loc = savedLocations.find((l) => l.id === id);
    if (loc) {
      setAddressText(loc.address);
      setLandmark(loc.landmark || "");
      setAddressNotes(loc.notes || "");
      setCoordinates({ lat: loc.lat, lng: loc.lng });
      toast.success(`Loaded location: ${loc.label}`);
    }
  };

  const handlePlaceOrder = () => {
    if (!user) {
      toast.error("Please sign in to place orders");
      router.push("/login");
      return;
    }

    if (items.length === 0) return;

    if (!addressText.trim() || addressText === "Bantayan Island, Cebu") {
      toast.error("Please enter a specific delivery address");
      return;
    }

    // Ask to save location if not already in local list
    const isAlreadySaved = savedLocations.some(
      (l) => l.address.toLowerCase() === addressText.toLowerCase() && l.landmark.toLowerCase() === landmark.toLowerCase()
    );

    if (!isAlreadySaved && !selectedLocationId) {
      setShowSaveModal(true);
    } else {
      submitOrder(false);
    }
  };

  const submitOrder = async (shouldSave = false, label = "Home") => {
    if (!user) return;
    setShowSaveModal(false);
    setLoading(true);

    try {
      const firstItem = items[0];
      const businessId = firstItem.businessId;

      // Verify that all products in the cart are in stock
      for (const item of items) {
        const prodRef = doc(db, COLLECTIONS.BUSINESSES, businessId, COLLECTIONS.PRODUCTS, item.productId);
        const snap = await getDoc(prodRef);
        if (snap.exists()) {
          const prodData = snap.data();
          if (!prodData.inStock || (prodData.stockQty !== undefined && prodData.stockQty <= 0)) {
            toast.error(`"${item.name}" is currently out of stock. Please remove it from your cart.`, { duration: 4000 });
            setLoading(false);
            return;
          }
        }
      }

      const orderNumber = generateOrderNumber();

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
        id: selectedLocationId || "custom-address",
        label: selectedLocationId
          ? (savedLocations.find((l) => l.id === selectedLocationId)?.label || "Saved Address")
          : "Delivery Address",
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
        customerPhone: user.phone || "09171234567",
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

      if (shouldSave) {
        const newLoc = {
          id: Date.now().toString(),
          label: label.trim() || "Address",
          address: addressText,
          lat: coordinates.lat,
          lng: coordinates.lng,
          landmark,
          notes: addressNotes,
        };
        const updated = [...savedLocations, newLoc];
        localStorage.setItem("hive_saved_locations", JSON.stringify(updated));
        setSavedLocations(updated);
        toast.success("Location saved for next time!");
      }

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

  const firstItem = items[0];
  const businessId = firstItem?.businessId;
  const businessName = firstItem?.businessName;

  return (
    <div className={styles.container}>
      {businessId && businessName && (
        <button
          onClick={() => router.push(`/business/${businessId}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--primary)",
            background: "none",
            border: "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            marginBottom: 16,
            alignSelf: "flex-start",
            padding: 0
          }}
        >
          ← Add more items from {businessName}
        </button>
      )}
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
                  updateNotes(
                    item.productId,
                    item.selectedVariants,
                    item.selectedAddOns,
                    e.target.value
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
            {gpsStatus === "success" ? "📍 GPS Acquired" : gpsStatus === "detecting" ? "⚡ Fetching GPS..." : "⚠️ GPS Off"}
          </span>
        </div>

        <div className={styles.addressForm}>
          {/* Saved Locations Selector */}
          {savedLocations.length > 0 && (
            <div className={styles.inputGroup} style={{ marginBottom: 4 }}>
              <label className={styles.inputLabel}>Select Saved Location</label>
              <select
                value={selectedLocationId}
                onChange={(e) => handleSelectSavedLocation(e.target.value)}
                className={styles.inputField}
                style={{ padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "8px", cursor: "pointer" }}
              >
                <option value="">-- Choose a Saved Location (Optional) --</option>
                {savedLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.label} ({loc.address})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.inputGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className={styles.inputLabel}>Delivery Address / Street / Barangay</label>
              <button
                type="button"
                onClick={handleGetLocation}
                style={{
                  fontSize: 11,
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                📍 Locate Me
              </button>
            </div>
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
            <label className={styles.inputLabel}>Landmark / House Description (Optional)</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className={styles.inputField}
              placeholder="e.g. Near plaza, red gate (Optional)"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Delivery Instructions (Optional)</label>
            <input
              type="text"
              value={addressNotes}
              onChange={(e) => setAddressNotes(e.target.value)}
              className={styles.inputField}
              placeholder="e.g. Call upon arrival (Optional)"
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

      {/* Save Location Popup Modal */}
      {showSaveModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "12px",
            padding: 24,
            width: "100%",
            maxWidth: 360,
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>Save location details?</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
              Would you like to save this delivery address for your next orders?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Label Name</label>
              <input
                type="text"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="e.g. Home, Work, Resort"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => submitOrder(false)}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => submitOrder(true, saveLabel || "Home")}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
