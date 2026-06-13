"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Upload, CheckCircle2, ArrowRight, X, ImagePlus } from "lucide-react";
import { addDocument, updateDocument } from "@/lib/firebase/firestore";
import { uploadBusinessLogo } from "@/lib/firebase/storage";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { generateSlug } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Input from "@/components/ui/Input/Input";
import styles from "./setup.module.css";

export default function CreateBusinessPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { setMode } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("food");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("39");
  const [minOrder, setMinOrder] = useState("150");
  const [prepTime, setPrepTime] = useState("30");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill phone number from authenticated user
  React.useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !description.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in all details");
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(name);

      // Upload logo if provided
      let logoUrl = "";
      if (logoFile) {
        toast.loading("Uploading logo...", { id: "logo-upload" });
        logoUrl = await uploadBusinessLogo(user.id, logoFile);
        toast.dismiss("logo-upload");
      }

      const newBusiness = {
        ownerId: user.id,
        name: name.trim(),
        slug,
        description: description.trim(),
        logoUrl,
        coverUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80", // Standard premium mockup cover
        category,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        address: address.trim(),
        lat: 11.1685, // Bantayan Town Coordinates
        lng: 123.7268,
        businessHours: {
          monday: { open: "08:00", close: "21:00", isClosed: false },
          tuesday: { open: "08:00", close: "21:00", isClosed: false },
          wednesday: { open: "08:00", close: "21:00", isClosed: false },
          thursday: { open: "08:00", close: "21:00", isClosed: false },
          friday: { open: "08:00", close: "22:00", isClosed: false },
          saturday: { open: "08:00", close: "22:00", isClosed: false },
          sunday: { open: "08:00", close: "21:00", isClosed: false },
        },
        isOpen: true,
        isPaused: false,
        isVerified: false,
        status: "pending", // Pending admin review
        rating: 5.0,
        totalRatings: 0,
        totalOrders: 0,
        deliveryFee: Number(deliveryFee),
        deliveryRadius: 8.0, // Default 8km radius
        minOrderAmount: Number(minOrder),
        estimatedPrepTime: Number(prepTime),
        tags: [category, "local"],
      };

      const businessId = await addDocument(COLLECTIONS.BUSINESSES, newBusiness);

      // Link business to user document
      await updateDocument(COLLECTIONS.USERS, user.id, {
        hasBusiness: true,
        businessId,
      });

      setUser({
        ...user,
        hasBusiness: true,
        businessId,
      });

      setSuccess(true);
      toast.success("Business registered successfully!");
    } catch (err: any) {
      console.error("Business setup error:", err);
      toast.error(err.message || "Failed to register your store");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app-container">
        <div className={styles.container} style={{ textAlign: "center", justifyContent: "center" }}>
          <CheckCircle2 size={64} color="var(--status-completed)" style={{ margin: "0 auto 20px auto" }} />
          <h1 className={styles.title}>Registration Sent!</h1>
          <p className={styles.subtitle} style={{ marginBottom: 30 }}>
            Your business registration for <strong>{name}</strong> has been submitted. You can access your dashboard to set up products, but your store won't be visible to buyers until approved by an admin.
          </p>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => {
              setMode("business");
              router.push("/dashboard");
            }}
          >
            Go to Store Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className={styles.container}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Store Setup</h1>
          <p className={styles.subtitle}>List your business on Hive Bantayan to reach thousands of local buyers.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.sectionTitle}>Store Details</h3>

          <Input
            label="Business Name"
            placeholder="e.g. Bantayan Island Seafood Grill"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Short Description"
            placeholder="e.g. Fresh grilled seafood, crabs, and oysters"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Logo Upload */}
          <div className={styles.imageUploads}>
            <label className={styles.label}>Store Logo (Optional)</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Logo must be under 5MB");
                    return;
                  }
                  setLogoFile(file);
                  setLogoPreview(URL.createObjectURL(file));
                }
              }}
            />
            {logoPreview ? (
              <div className={styles.previewWrapper}>
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={100}
                  height={100}
                  className={styles.previewImage}
                  unoptimized
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    if (logoInputRef.current) logoInputRef.current.value = "";
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className={styles.uploadBox}
                onClick={() => logoInputRef.current?.click()}
              >
                <ImagePlus size={28} className={styles.uploadIcon} />
                <span className={styles.uploadText}>Tap to upload logo</span>
                <span className={styles.uploadHint}>PNG, JPG up to 5MB</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className={styles.label}>Business Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="food">🍕 Food / Restaurant</option>
              <option value="drinks">🥤 Drinks / Cafe</option>
              <option value="grocery">🛒 Grocery Store</option>
              <option value="pharmacy">💊 Pharmacy</option>
              <option value="seafood">🦐 Seafood Market</option>
              <option value="clothing">👕 Clothing Store</option>
              <option value="other">📦 Other Shops</option>
            </select>
          </div>

          <Input
            label="Contact / Gcash / WhatsApp Phone"
            placeholder="e.g. 09171234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Store Physical Address"
            placeholder="e.g. Brgy. Ticad, Bantayan Town"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <h3 className={styles.sectionTitle}>Delivery Configuration</h3>

          <div className={styles.row}>
            <Input
              label="Delivery Fee (₱)"
              type="number"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              required
            />
            <Input
              label="Min Order (₱)"
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              required
            />
          </div>

          <Input
            label="Est. Prep Time (mins)"
            type="number"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            style={{ marginTop: 12 }}
            rightIcon={<ArrowRight size={18} />}
          >
            Submit Application
          </Button>
        </form>
      </div>
    </div>
  );
}
