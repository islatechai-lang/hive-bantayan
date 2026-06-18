"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, Phone, MapPin, Clock, Award, Star, ShoppingBag, Check } from "lucide-react";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, isBusinessOpen, formatEstimatedTime } from "@/lib/utils/formatters";
import { createWhatsAppUrl, createMapsUrl } from "@/lib/utils/helpers";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import Modal from "@/components/ui/Modal/Modal";
import ProductCard from "@/components/shared/ProductCard/ProductCard";
import styles from "./business.module.css";

export default function BusinessProfilePage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.businessId as string;

  const { products, business, loading, error } = useProducts(businessId);
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"products" | "info">("products");
  
  // Product Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<any[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height={180} />
        <div style={{ padding: 20 }}>
          <Skeleton width={120} height={20} />
          <Skeleton width={200} height={15} style={{ marginTop: 8 }} />
          <Skeleton height={200} style={{ marginTop: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className={styles.container} style={{ padding: 40, textAlign: "center" }}>
        <h2>Error Loading Store</h2>
        <p>{error || "Store not found."}</p>
        <Button variant="outline" onClick={() => router.push("/home")} style={{ marginTop: 20 }}>
          Back to Home
        </Button>
      </div>
    );
  }

  const openInfo = isBusinessOpen(business.businessHours, business.isOpen && !business.isPaused);

  // WhatsApp and Map URL helpers
  const whatsappUrl = createWhatsAppUrl(
    business.whatsapp || business.phone,
    `Hello ${business.name}, I am browsing your store on Hive Bantayan and have a question!`
  );

  const mapUrl = createMapsUrl(business.lat, business.lng);

  // Variant click handler
  const handleSelectOption = (variantName: string, option: any) => {
    setSelectedVariants((prev) => {
      const filtered = prev.filter((v) => v.variantName !== variantName);
      return [...filtered, { variantName, selectedOption: option }];
    });
  };

  // AddOn toggle click handler
  const handleToggleAddOn = (addOn: any) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.name === addOn.name);
      if (exists) {
        return prev.filter((a) => a.name !== addOn.name);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const handleOpenProduct = (product: any) => {
    setSelectedProduct(product);
    setQty(1);
    setSelectedVariants([]);
    setSelectedAddOns([]);
    setOrderNotes("");
    setActiveImageIdx(0);
  };

  const handleImageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const idx = Math.round(scrollLeft / width);
      setActiveImageIdx(idx);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Check if required variants are selected
    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      const selectedNames = selectedVariants.map((v) => v.variantName);
      const missing = selectedProduct.variants.filter((v: any) => !selectedNames.includes(v.name));
      if (missing.length > 0) {
        toast.error(`Please select option for: ${missing[0].name}`);
        return;
      }
    }

    // Check if cart contains items from a different business
    const cartItems = useCartStore.getState().items;
    if (cartItems.length > 0 && cartItems[0].businessId !== business.id) {
      const confirmClear = confirm(
        `Your cart contains items from "${cartItems[0].businessName}". Would you like to clear those items and add this item from "${business.name}" instead?`
      );
      if (!confirmClear) return;
    }

    addItem({
      productId: selectedProduct.id,
      businessId: business.id,
      businessName: business.name,
      name: selectedProduct.name,
      imageUrl: selectedProduct.images?.[0] || "/images/product-placeholder.jpg",
      price: selectedProduct.price,
      quantity: qty,
      selectedVariants,
      selectedAddOns,
      notes: orderNotes,
    });

    toast.success("Added to cart!");
    setSelectedProduct(null);
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;

    // Check if required variants are selected
    if (selectedProduct.variants && selectedProduct.variants.length > 0) {
      const selectedNames = selectedVariants.map((v) => v.variantName);
      const missing = selectedProduct.variants.filter((v: any) => !selectedNames.includes(v.name));
      if (missing.length > 0) {
        toast.error(`Please select option for: ${missing[0].name}`);
        return;
      }
    }

    // Check if cart contains items from a different business
    const cartItems = useCartStore.getState().items;
    if (cartItems.length > 0 && cartItems[0].businessId !== business.id) {
      const confirmClear = confirm(
        `Your cart contains items from "${cartItems[0].businessName}". Would you like to clear those items and add this item from "${business.name}" instead?`
      );
      if (!confirmClear) return;
    }

    addItem({
      productId: selectedProduct.id,
      businessId: business.id,
      businessName: business.name,
      name: selectedProduct.name,
      imageUrl: selectedProduct.images?.[0] || "/images/product-placeholder.jpg",
      price: selectedProduct.price,
      quantity: qty,
      selectedVariants,
      selectedAddOns,
      notes: orderNotes,
    });

    setSelectedProduct(null);
    router.push("/cart");
  };

  return (
    <div className={styles.container}>
      {/* Cover Banner */}
      <div className={styles.coverArea}>
        <button className={styles.backBtn} onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <Image
          src={business.coverUrl || "/images/cover-placeholder.jpg"}
          alt={business.name}
          fill
          className={styles.coverImage}
        />
      </div>

      {/* Business Info Info Card details */}
      <div className={styles.profileInfo}>
        <div className={styles.logoWrapper}>
          {business.logoUrl && business.logoUrl !== "" && !business.logoUrl.includes("logo-placeholder") ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={72}
              height={72}
              className={styles.logoImage}
              unoptimized
            />
          ) : (
            <div className={styles.initialsLogo}>
              {business.name ? business.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>

        <div className={styles.titleRow}>
          <div className={styles.nameCol}>
            <h1 className={styles.name}>{business.name}</h1>
            {business.isVerified && <Award size={18} color="var(--primary)" />}
          </div>
          <div className={styles.ratingRow} style={{ fontSize: 15 }}>
            <Star size={16} fill="var(--accent)" color="var(--accent)" />
            <strong>{business.rating.toFixed(1)}</strong>
            <span style={{ color: "var(--text-light)" }}>({business.totalRatings})</span>
          </div>
        </div>

        <p className={styles.description}>{business.description}</p>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <Clock size={14} className={styles.metaIcon} />
            <span>Open: </span>
            <strong>{openInfo.status === "open" ? "Yes" : "No"}</strong>
          </div>
          <div className={styles.metaItem}>
            <MapPin size={14} className={styles.metaIcon} />
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
              Get Directions
            </a>
          </div>
        </div>

        {/* Action button triggers */}
        <div className={styles.contactRow}>
          <Button
            variant="outline"
            fullWidth
            leftIcon={<MessageSquare size={16} />}
            onClick={() => router.push(`/chat/${business.id}`)}
          >
            Chat
          </Button>
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Phone size={16} />}
            className={styles.whatsappBtn}
            onClick={() => window.open(`tel:${business.phone}`, "_self")}
          >
            Call
          </Button>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "products" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Menu & Products
        </button>
        <button
          className={`${styles.tab} ${activeTab === "info" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Store Info
        </button>
      </div>

      {/* Dynamic Tab Body */}
      {activeTab === "products" ? (
        <div className={styles.productsList}>
          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-light)" }}>
              <ShoppingBag size={36} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No products listed yet</p>
            </div>
          ) : (
            products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={handleOpenProduct}
              />
            ))
          )}
        </div>
      ) : (
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Delivery details</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
              Delivery Fee: <strong>{business.deliveryFee === 0 ? "FREE" : formatCurrency(business.deliveryFee)}</strong>
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 4 }}>
              Radius limit: <strong>{business.deliveryRadius} km</strong>
            </p>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Min Order Amount: <strong>{formatCurrency(business.minOrderAmount)}</strong>
            </p>
          </Card>
          <Card>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Estimated Prep Time</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              Average order preparation takes: <strong>{formatEstimatedTime(business.estimatedPrepTime)}</strong>
            </p>
          </Card>
        </div>
      )}

      {/* Product Detail Modal overlay */}
      {selectedProduct && (() => {
        const isOutOfStock = !selectedProduct.inStock || selectedProduct.stockQty <= 0;
        return (
          <Modal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            title="Customize Product"
            footer={
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                {isOutOfStock ? (
                  <Button variant="primary" fullWidth disabled>
                    Sold Out
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" fullWidth onClick={handleAddToCart}>
                      Add to Cart
                    </Button>
                    <Button variant="primary" fullWidth onClick={handleBuyNow}>
                      Buy Now — {formatCurrency(selectedProduct.price * qty)}
                    </Button>
                  </>
                )}
              </div>
            }
          >
            <div className={styles.modalBody}>
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className={styles.modalImagesContainer}>
                  <div className={styles.modalImagesSlider} onScroll={handleImageScroll}>
                    {selectedProduct.images.map((imgUrl: string, idx: number) => (
                      <div key={idx} className={styles.modalImageSlide}>
                        <Image
                          src={imgUrl}
                          alt={`${selectedProduct.name} - ${idx + 1}`}
                          fill
                          className={styles.modalImage}
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                  {selectedProduct.images.length > 1 && (
                    <div className={styles.imageDots}>
                      {selectedProduct.images.map((_: any, idx: number) => (
                        <span
                          key={idx}
                          className={`${styles.imageDot} ${activeImageIdx === idx ? styles.activeDot : ""}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalTitleRow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <h2 className={styles.modalName}>{selectedProduct.name}</h2>
                  {isOutOfStock && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--status-cancelled)",
                        backgroundColor: "var(--status-cancelled-light)",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        textTransform: "uppercase"
                      }}
                    >
                      Sold Out
                    </span>
                  )}
                </div>
                <p className={styles.modalDesc}>{selectedProduct.description}</p>
              </div>

              {/* Custom Variants selection */}
              {selectedProduct.variants?.map((v: any, index: number) => {
                const currentSelect = selectedVariants.find((sv) => sv.variantName === v.name);
                
                return (
                  <div key={index} className={styles.optionSection}>
                    <h4 className={styles.optionSectionTitle}>
                      <span>Select {v.name}</span>
                      <span className={styles.requiredTag}>Required</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {v.options.map((opt: any, optIdx: number) => {
                        const isSelected = currentSelect?.selectedOption.label === opt.label;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(v.name, opt)}
                            className={`${styles.variantRow} ${isSelected ? styles.selectedVariant : ""}`}
                          >
                            <span>{opt.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {opt.price > 0 && <span>+{formatCurrency(opt.price)}</span>}
                              <div className={styles.radioCircle}>
                                {isSelected && <div className={styles.radioFill} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Custom Add-ons selection */}
              {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
                <div className={styles.optionSection}>
                  <h4 className={styles.optionSectionTitle}>Add-ons (Optional)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedProduct.addOns.map((add: any, addIdx: number) => {
                      const isSelected = selectedAddOns.some((sa) => sa.name === add.name);
                      return (
                        <div
                          key={addIdx}
                          onClick={() => handleToggleAddOn(add)}
                          className={`${styles.addOnRow} ${isSelected ? styles.selectedAddOn : ""}`}
                        >
                          <span>{add.name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span>+{formatCurrency(add.price)}</span>
                            <div className={styles.checkboxSquare}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity adjustments */}
              {!isOutOfStock && (
                <div className={styles.quantityRow}>
                  <span>Quantity:</span>
                  <div className={styles.qtyActions}>
                    <button className={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>
                      -
                    </button>
                    <span className={styles.qtyVal}>{qty}</span>
                    <button className={styles.qtyBtn} onClick={() => setQty(qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
