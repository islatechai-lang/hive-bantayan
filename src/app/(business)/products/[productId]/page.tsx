"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { uploadFile } from "@/lib/firebase/storage";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Input from "@/components/ui/Input/Input";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "../products.module.css";

export default function AddEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const isNew = productId === "new";

  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productImages, setProductImages] = useState<{ url: string | null; file: File | null }[]>([
    { url: null, file: null },
    { url: null, file: null },
    { url: null, file: null },
  ]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Variants options state
  const [variantName, setVariantName] = useState("");
  const [variantsList, setVariantsList] = useState<any[]>([]);

  useEffect(() => {
    if (isNew || !user?.businessId) return;
    const businessId = user.businessId;

    async function loadProductDetails() {
      try {
        const prodRef = doc(db, COLLECTIONS.BUSINESSES, businessId, COLLECTIONS.PRODUCTS, productId);
        const snap = await getDoc(prodRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name);
          setDescription(data.description);
          setPrice(data.price.toString());
          if (data.images && data.images.length > 0) {
            setProductImages([
              { url: data.images[0] || null, file: null },
              { url: data.images[1] || null, file: null },
              { url: data.images[2] || null, file: null },
            ]);
          }
          if (data.variants && data.variants.length > 0) {
            setVariantName(data.variants[0].name);
            setVariantsList(data.variants[0].options);
          }
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setFetching(false);
      }
    }

    loadProductDetails();
  }, [productId, isNew, user]);

  const handleAddOption = () => {
    setVariantsList([...variantsList, { label: "", price: 0 }]);
  };

  const handleUpdateOption = (index: number, key: string, val: any) => {
    setVariantsList((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, [key]: val } : opt))
    );
  };

  const handleRemoveOption = (index: number) => {
    setVariantsList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    if (!name.trim() || !description.trim() || !price.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    const activeImages = productImages.filter((img) => img.url !== null || img.file !== null);
    if (activeImages.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }

    setLoading(true);

    try {
      toast.loading("Uploading images...", { id: "img-upload" });
      const finalUrls: string[] = [];
      for (const img of productImages) {
        if (img.file) {
          const uploadedUrl = await uploadFile(`businesses/${user.businessId}/products`, img.file);
          finalUrls.push(uploadedUrl);
        } else if (img.url) {
          finalUrls.push(img.url);
        }
      }
      toast.dismiss("img-upload");

      const formattedVariants = variantsList
        .filter((v) => v.label.trim() !== "")
        .map((v) => ({ label: v.label.trim(), price: 0 }));

      const hasVariants = variantName.trim() !== "" && formattedVariants.length > 0;

      const productPayload = {
        businessId: user.businessId,
        businessName: user.displayName,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        compareAtPrice: null,
        images: finalUrls,
        category: "General",
        inStock: true,
        stockQty: 999,
        soldQty: 0,
        variants: hasVariants ? [{ name: variantName.trim(), options: formattedVariants }] : [],
        addOns: [],
        isFeatured: false,
      };

      if (isNew) {
        const prodColRef = doc(collection(db, COLLECTIONS.BUSINESSES, user.businessId, COLLECTIONS.PRODUCTS));
        await setDoc(prodColRef, {
          ...productPayload,
          createdAt: new Date(),
        });
        toast.success("Product created successfully!");
      } else {
        const prodRef = doc(db, COLLECTIONS.BUSINESSES, user.businessId, COLLECTIONS.PRODUCTS, productId);
        await updateDoc(prodRef, productPayload);
        toast.success("Product updated successfully!");
      }

      router.push("/products");
    } catch (error: any) {
      console.error("Save product error:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.container}>
        <Skeleton height={32} width={180} />
        <Skeleton height={45} style={{ marginTop: 24 }} />
        <Skeleton height={45} style={{ marginTop: 12 }} />
        <Skeleton height={45} style={{ marginTop: 12 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ cursor: "pointer", display: "flex", color: "var(--text-light)" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.title}>{isNew ? "Add Product" : "Edit Product"}</h1>
        </div>

        <form onSubmit={handleSave} className={styles.form} style={{ marginTop: 12 }}>
          <Input
            label="Product Name"
            placeholder="e.g. Grilled Garlic Butter Shrimp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Local shrimp sautéed in real butter and garlic"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            label="Price (₱)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {/* Product Image Upload */}
          <div className={styles.imageUploadSection}>
            <label className={styles.uploadLabel}>Product Images (Up to 3, min 1 required) *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && activeSlot !== null) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image must be under 5MB");
                    return;
                  }
                  const newImages = [...productImages];
                  newImages[activeSlot] = {
                    url: URL.createObjectURL(file),
                    file: file
                  };
                  setProductImages(newImages);
                  e.target.value = "";
                }
              }}
            />
            <div className={styles.imageSlotsRow}>
              {productImages.map((img, idx) => (
                <div key={idx} className={styles.imageSlotContainer}>
                  <span className={styles.slotLabel}>
                    {idx === 0 ? "Main (Req)" : `Image ${idx + 1}`}
                  </span>
                  {img.url ? (
                    <div className={styles.imgPreviewWrapper}>
                      <Image
                        src={img.url}
                        alt={`Preview ${idx + 1}`}
                        fill
                        className={styles.imgPreview}
                        unoptimized
                      />
                      <button
                        type="button"
                        className={styles.imgRemoveBtn}
                        onClick={() => {
                          const newImages = [...productImages];
                          newImages[idx] = { url: null, file: null };
                          setProductImages(newImages);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.imgUploadBoxSmall}
                      onClick={() => {
                        setActiveSlot(idx);
                        fileInputRef.current?.click();
                      }}
                    >
                      <ImagePlus size={20} className={styles.imgUploadIcon} />
                      <span className={styles.uploadBtnText}>Upload</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variants customization area */}
          <h3 className={styles.sectionTitle}>Product Options / Variants</h3>
          
          <Input
            label="Option Title"
            placeholder="e.g. Size, Flavor"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {variantsList.map((opt, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="e.g. Large, Spicy, Chocolate"
                  value={opt.label}
                  onChange={(e) => handleUpdateOption(idx, "label", e.target.value)}
                  wrapperClassName={styles.optionInputFull}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  style={{ color: "var(--status-cancelled)", cursor: "pointer", marginTop: 18 }}
                  aria-label="Remove option"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleAddOption}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            >
              Add Option Row
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            style={{ marginTop: 20 }}
            leftIcon={<Save size={18} />}
          >
            Save Product
          </Button>
        </form>
      </div>
  );
}
