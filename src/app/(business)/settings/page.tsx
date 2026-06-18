"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, Loader2, RefreshCw, Trash2, AlertTriangle, Upload, X, ImagePlus, LogOut } from "lucide-react";
import { doc, getDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { signOut } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/stores/authStore";
import { useUIStore } from "@/lib/stores/uiStore";
import { uploadBusinessLogo, uploadBusinessCover } from "@/lib/firebase/storage";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Input from "@/components/ui/Input/Input";
import Toggle from "@/components/ui/Toggle/Toggle";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import Modal from "@/components/ui/Modal/Modal";
import styles from "./settings.module.css";

export default function StoreSettingsPage() {
  const router = useRouter();
  const { user, setUser, reset: resetAuth } = useAuthStore();
  const { setMode } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      resetAuth();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  // Business States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [prepTime, setPrepTime] = useState("");

  // Status Toggles
  const [isOpen, setIsOpen] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Cover & Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string>("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.businessId) return;
    const businessId = user.businessId;

    async function loadStoreSettings() {
      try {
        const busRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
        const snap = await getDoc(busRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name);
          setDescription(data.description);
          setPhone(data.phone);
          setAddress(data.address);
          setDeliveryFee(data.deliveryFee.toString());
          setMinOrder(data.minOrderAmount.toString());
          setPrepTime(data.estimatedPrepTime.toString());
          setIsOpen(data.isOpen);
          setIsPaused(data.isPaused || false);
          setExistingLogoUrl(data.logoUrl || "");
          setExistingCoverUrl(data.coverUrl || "");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setFetching(false);
      }
    }

    loadStoreSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.businessId) return;

    setLoading(true);

    try {
      // Upload new logo if selected
      let logoUrl = existingLogoUrl;
      if (logoFile) {
        toast.loading("Uploading logo...", { id: "logo-upload" });
        logoUrl = await uploadBusinessLogo(user.businessId, logoFile);
        toast.dismiss("logo-upload");
      }

      // Upload new cover if selected
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        toast.loading("Uploading cover...", { id: "cover-upload" });
        coverUrl = await uploadBusinessCover(user.businessId, coverFile);
        toast.dismiss("cover-upload");
      }

      const busRef = doc(db, COLLECTIONS.BUSINESSES, user.businessId);
      await updateDoc(busRef, {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim(),
        deliveryFee: Number(deliveryFee),
        minOrderAmount: Number(minOrder),
        estimatedPrepTime: Number(prepTime),
        isOpen,
        isPaused,
        logoUrl,
        coverUrl,
      });

      // Update previews to reflect saved state
      if (logoFile) {
        setExistingLogoUrl(logoUrl);
        setLogoFile(null);
      }
      if (coverFile) {
        setExistingCoverUrl(coverUrl);
        setCoverFile(null);
      }

      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!user?.businessId) return;
    setDeleting(true);
    try {
      const batch = writeBatch(db);

      // Delete the business document
      const busRef = doc(db, COLLECTIONS.BUSINESSES, user.businessId);
      batch.delete(busRef);

      // Reset the user back to a regular buyer
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      batch.update(userRef, {
        role: "buyer",
        hasBusiness: false,
        businessId: "",
      });

      await batch.commit();

      // Update local state
      setUser({ ...user, role: "buyer", hasBusiness: false, businessId: "" });
      setMode("buyer");
      setShowDeleteModal(false);
      toast.success("Business deleted successfully");
      router.push("/home");
    } catch (error: any) {
      console.error("Error deleting business:", error);
      toast.error(error.message || "Failed to delete business");
    } finally {
      setDeleting(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.container}>
        <Skeleton height={32} width={180} />
        <Skeleton height={120} style={{ marginTop: 12 }} />
        <Skeleton height={45} style={{ marginTop: 12 }} />
        <Skeleton height={45} style={{ marginTop: 12 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Store Settings</h1>

      <form onSubmit={handleSaveSettings} className={styles.form}>
        <h3 className={styles.sectionTitle}>Shop Status</h3>

        {/* Operating status toggles */}
        <div className={styles.toggleCard}>
          <div className={styles.toggleText}>
            <span className={styles.toggleLabel}>Store Operating Status</span>
            <span className={styles.toggleDesc}>
              {isOpen ? "Customers can browse and place orders" : "Store is closed. No orders allowed."}
            </span>
          </div>
          <Toggle checked={isOpen} onChange={setIsOpen} />
        </div>

        <div className={styles.toggleCard}>
          <div className={styles.toggleText}>
            <span className={styles.toggleLabel}>Pause Orders</span>
            <span className={styles.toggleDesc}>
              Temporarily reject incoming orders while busy
            </span>
          </div>
          <Toggle checked={isPaused} onChange={setIsPaused} />
        </div>

        <h3 className={styles.sectionTitle}>Store Branding</h3>

        {/* Logo Upload */}
        <div className={styles.imageUploads}>
          <label className={styles.label}>Store Logo</label>
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
          {(logoPreview || existingLogoUrl) ? (
            <div className={styles.previewWrapper}>
              <Image
                src={logoPreview || existingLogoUrl}
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
                  setExistingLogoUrl("");
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

        {/* Cover Banner Upload */}
        <div className={styles.imageUploads}>
          <label className={styles.label}>Cover Banner</label>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("Cover image must be under 5MB");
                  return;
                }
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
              }
            }}
          />
          {(coverPreview || existingCoverUrl) ? (
            <div className={styles.previewWrapper} style={{ width: "100%", height: 140 }}>
              <Image
                src={coverPreview || existingCoverUrl}
                alt="Cover preview"
                fill
                style={{ objectFit: "cover" }}
                className={styles.previewImage}
                unoptimized
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview(null);
                  setExistingCoverUrl("");
                  if (coverInputRef.current) coverInputRef.current.value = "";
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className={styles.uploadBox}
              onClick={() => coverInputRef.current?.click()}
            >
              <Upload size={28} className={styles.uploadIcon} />
              <span className={styles.uploadText}>Tap to upload cover banner</span>
              <span className={styles.uploadHint}>Recommended: 600×200, PNG/JPG up to 5MB</span>
            </div>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Store Details</h3>

        <Input
          label="Store Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Input
          label="Store Contact / Gcash Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <Input
          label="Physical Address"
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
          label="Est. Preparation Time (mins)"
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
          leftIcon={<Save size={18} />}
        >
          Save Configurations
        </Button>
      </form>

      {/* Account Session / Logout */}
      <div className={styles.logoutZone}>
        <h3 className={styles.logoutTitle}>
          <LogOut size={16} />
          Account Session
        </h3>
        <p className={styles.logoutDesc}>
          Sign out of your account on this device. You can log back in at any time.
        </p>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<LogOut size={16} />}
          loading={loggingOut}
          onClick={handleLogout}
          style={{ alignSelf: "flex-start" }}
        >
          Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>
          <AlertTriangle size={16} />
          Danger Zone
        </h3>
        <p className={styles.dangerDesc}>
          Permanently delete your business listing and all associated data. This action cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 size={16} />}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete My Business
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Business?"
        footer={
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={handleDeleteBusiness}>
              Yes, Delete Forever
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "12px 0", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={28} color="var(--status-cancelled)" />
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            This will permanently remove <strong>{name}</strong> from Hive Bantayan. All your products, settings, and store data will be lost. Your account will revert to a regular buyer.
          </p>
        </div>
      </Modal>
    </div>
  );
}
