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
  const [comparePrice, setComparePrice] = useState("");
  const [category, setCategory] = useState("Main Course");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Custom Variants options state (e.g. Pizza Sizes)
  const [variantName, setVariantName] = useState("Size");
  const [variantsList, setVariantsList] = useState<any[]>([
    { label: "Regular", price: 0 },
    { label: "Large", price: 50 },
  ]);

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
          setComparePrice(data.compareAtPrice?.toString() || "");
          setCategory(data.category);
          if (data.images?.[0]) {
            setImagePreview(data.images[0]);
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

    if (!imageFile && !imagePreview) {
      toast.error("Please add a product image");
      return;
    }

    setLoading(true);

    try {
      // Upload new image if a file was selected
      let finalImageUrl = imagePreview || "";
      if (imageFile) {
        toast.loading("Uploading image...", { id: "img-upload" });
        finalImageUrl = await uploadFile(`businesses/${user.businessId}/products`, imageFile);
        toast.dismiss("img-upload");
      }

      const formattedVariants = variantsList.filter((v) => v.label.trim() !== "");
      const productPayload = {
        businessId: user.businessId,
        businessName: user.displayName,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        compareAtPrice: comparePrice ? Number(comparePrice) : null,
        images: [finalImageUrl],
        category: category.trim(),
        inStock: true,
        stockQty: 999,
        soldQty: 0,
        variants: formattedVariants.length > 0 ? [{ name: variantName, options: formattedVariants }] : [],
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
      <div className="app-container" style={{ padding: 20 }}>
        <Skeleton height={20} width={100} />
        <Skeleton height={40} style={{ marginTop: 24 }} />
        <Skeleton height={40} style={{ marginTop: 12 }} />
      </div>
    );
  }

  return (
    <div className="app-container">
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

          <div className={styles.row}>
            <Input
              label="Price (₱)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Compare Price (₱)"
              type="number"
              placeholder="Optional sale price"
              value={comparePrice}
              onChange={(e) => setComparePrice(e.target.value)}
            />
          </div>

          {/* Product Image Upload */}
          <div className={styles.imageUploadSection}>
            <label className={styles.uploadLabel}>Product Image *</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image must be under 5MB");
                    return;
                  }
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            {imagePreview ? (
              <div className={styles.imgPreviewWrapper}>
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  width={160}
                  height={120}
                  className={styles.imgPreview}
                  unoptimized
                />
                <button
                  type="button"
                  className={styles.imgRemoveBtn}
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className={styles.imgUploadBox}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus size={32} className={styles.imgUploadIcon} />
                <span className={styles.imgUploadText}>Tap to upload product photo</span>
                <span className={styles.imgUploadHint}>PNG, JPG up to 5MB</span>
              </div>
            )}
          </div>

          <Input
            label="Menu Category"
            placeholder="e.g. Seafood, Drinks, Pizza"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

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
                  placeholder="e.g. Large"
                  value={opt.label}
                  onChange={(e) => handleUpdateOption(idx, "label", e.target.value)}
                  wrapperClassName={styles.optionInput}
                />
                <Input
                  type="number"
                  placeholder="Price (+)"
                  value={opt.price}
                  onChange={(e) => handleUpdateOption(idx, "price", Number(e.target.value))}
                  wrapperClassName={styles.optionPriceInput}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  style={{ color: "var(--status-cancelled)", cursor: "pointer", marginTop: 20 }}
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
    </div>
  );
}
