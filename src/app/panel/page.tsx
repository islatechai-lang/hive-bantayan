"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, query, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import { ArrowLeft, Store, Users, ClipboardCheck, UserCheck, AlertTriangle } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/formatters";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Badge from "@/components/ui/Badge/Badge";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./panel.module.css";

type TabOption = "pending" | "stores" | "users" | "orders";

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabOption>("pending");
  const [loading, setLoading] = useState(true);

  // Firestore Collections Data
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Setup real-time listeners for all data
  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) return;

    setLoading(true);

    const unsubBusinesses = onSnapshot(collection(db, COLLECTIONS.BUSINESSES), (snapshot) => {
      setBusinesses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubOrders = onSnapshot(collection(db, COLLECTIONS.ORDERS), (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubBusinesses();
      unsubUsers();
      unsubOrders();
    };
  }, [user]);

  // Dev bypass helper to make current account Admin
  const handleBecomeAdmin = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      await updateDoc(userRef, { role: "admin" });
      setUser({ ...user, role: "admin" });
      toast.success("Successfully upgraded to Admin role (Dev Mode)!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upgrade role");
    }
  };

  // Action: Approve business application
  const handleApproveStore = async (business: any) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Update business status to approved
      const businessRef = doc(db, COLLECTIONS.BUSINESSES, business.id);
      batch.update(businessRef, {
        status: "approved",
        isVerified: true,
      });

      // 2. Upgrade owner's user account role to business
      const ownerRef = doc(db, COLLECTIONS.USERS, business.ownerId);
      batch.update(ownerRef, {
        role: "business",
        hasBusiness: true,
        businessId: business.id,
      });

      await batch.commit();
      
      // If the currently logged-in user is the owner, sync their store state
      if (user && user.id === business.ownerId) {
        setUser({
          ...user,
          role: "business",
          hasBusiness: true,
          businessId: business.id,
        });
      }

      toast.success(`Successfully approved "${business.name}"!`);
    } catch (err: any) {
      console.error("Error approving store:", err);
      toast.error(err.message || "Failed to approve store");
    }
  };

  // Action: Reject business application
  const handleRejectStore = async (business: any) => {
    try {
      const businessRef = doc(db, COLLECTIONS.BUSINESSES, business.id);
      await updateDoc(businessRef, {
        status: "rejected",
        isVerified: false,
      });
      toast.success(`Rejected "${business.name}" application`);
    } catch (err: any) {
      console.error("Error rejecting store:", err);
      toast.error(err.message || "Failed to reject store");
    }
  };

  // Action: Update user role
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, { role });
      
      if (user && user.id === userId) {
        setUser({ ...user, role: role as any });
      }

      toast.success("User role updated successfully");
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast.error("Failed to update user role");
    }
  };

  // 1. Access Control: If not signed in or not an Admin, show Dev Bypass screen
  if (!user || user.role !== "admin") {
    return (
      <div className="app-container">
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", gap: 16 }}>
          <AlertTriangle size={64} color="var(--accent)" className="pulse" />
          <h1 className={styles.title}>Admin Access Restricted</h1>
          <p className={styles.subtitle} style={{ maxWidth: 360, marginBottom: 12 }}>
            Your account is currently set as a <strong>{user?.role || "guest"}</strong>. You need an <strong>admin</strong> account to access this panel.
          </p>
          
          <Button variant="primary" fullWidth onClick={handleBecomeAdmin}>
            Become Admin (Dev Mode Bypass)
          </Button>

          <Button variant="text" fullWidth onClick={() => router.push("/home")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Pending business submissions
  const pendingStores = businesses.filter((b) => b.status === "pending");

  return (
    <div className="app-container">
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push("/profile")} aria-label="Go back to profile">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>Admin Panel</h1>
            <p className={styles.subtitle}>Bantayan Hub Platform Management</p>
          </div>
        </header>

        {/* Tab Selection */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Stores ({pendingStores.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "stores" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("stores")}
          >
            All Stores ({businesses.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "users" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users ({users.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "orders" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            All Orders ({orders.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton height={120} />
            <Skeleton height={120} />
            <Skeleton height={120} />
          </div>
        ) : (
          <div className={styles.content}>
            {/* TAB: PENDING STORES */}
            {activeTab === "pending" && (
              <section className={styles.section}>
                {pendingStores.length === 0 ? (
                  <div className={styles.emptyState}>
                    <ClipboardCheck size={48} className={styles.emptyIcon} />
                    <h3>No Pending Submissions</h3>
                    <p>All business registration applications have been reviewed!</p>
                  </div>
                ) : (
                  <div className={styles.cardList}>
                    {pendingStores.map((store) => (
                      <Card key={store.id} className={styles.itemCard}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>{store.name}</h3>
                          <Badge variant="pending">Pending Review</Badge>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          {store.description}
                        </p>
                        <div className={styles.infoGrid}>
                          <div><strong>Owner ID:</strong> {store.ownerId.slice(0, 8)}...</div>
                          <div><strong>Category:</strong> {store.category.toUpperCase()}</div>
                          <div><strong>Phone:</strong> {store.phone}</div>
                          <div><strong>Location:</strong> {store.address}</div>
                        </div>
                        <div className={styles.cardActions}>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectStore(store)}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveStore(store)}
                          >
                            Approve
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB: ALL STORES */}
            {activeTab === "stores" && (
              <section className={styles.section}>
                {businesses.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Store size={48} className={styles.emptyIcon} />
                    <h3>No Stores Registered</h3>
                    <p>No business accounts exist on the platform yet.</p>
                  </div>
                ) : (
                  <div className={styles.cardList}>
                    {businesses.map((store) => (
                      <Card key={store.id} className={styles.itemCard}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>{store.name}</h3>
                          <Badge
                            variant={
                              store.status === "approved"
                                ? "completed"
                                : store.status === "rejected"
                                ? "cancelled"
                                : "pending"
                            }
                          >
                            {store.status}
                          </Badge>
                        </div>
                        <div className={styles.cardMeta}>
                          <div className={styles.metaRow}>
                            <span><strong>Address:</strong> {store.address}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span><strong>Owner:</strong> {store.ownerId}</span>
                          </div>
                        </div>
                        <div className={styles.infoGrid}>
                          <div><strong>Delivery Fee:</strong> ₱{store.deliveryFee}</div>
                          <div><strong>Min Order:</strong> ₱{store.minOrderAmount}</div>
                          <div><strong>Verified:</strong> {store.isVerified ? "Yes ✅" : "No ❌"}</div>
                          <div><strong>Orders:</strong> {store.totalOrders || 0}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB: USERS LIST */}
            {activeTab === "users" && (
              <section className={styles.section}>
                <div className={styles.cardList}>
                  {users.map((u) => (
                    <Card key={u.id} className={`${styles.itemCard} ${styles.userCard}`}>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.displayName || "User"}</span>
                        <span className={styles.userEmail}>{u.email || "No Email"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <select
                          className={styles.roleSelect}
                          value={u.role || "buyer"}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="business">Business</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* TAB: ORDERS MONITOR */}
            {activeTab === "orders" && (
              <section className={styles.section}>
                {orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Compass size={48} className={styles.emptyIcon} />
                    <h3>No Orders Placed</h3>
                    <p>No transactions have been recorded on the system yet.</p>
                  </div>
                ) : (
                  <div className={styles.cardList}>
                    {orders.map((ord) => (
                      <Card key={ord.id} className={styles.itemCard}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>{ord.orderNumber}</h3>
                          <Badge
                            variant={
                              ord.status === "completed"
                                ? "completed"
                                : ord.status === "cancelled"
                                ? "cancelled"
                                : ord.status === "pending"
                                ? "pending"
                                : "preparing"
                            }
                          >
                            {ord.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className={styles.cardMeta}>
                          <div><strong>Store:</strong> {ord.businessName}</div>
                          <div><strong>Customer:</strong> {ord.customerName} ({ord.customerPhone})</div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span><strong>Placed:</strong> {ord.createdAt ? formatRelativeTime(ord.createdAt) : "Just now"}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(ord.total)}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
