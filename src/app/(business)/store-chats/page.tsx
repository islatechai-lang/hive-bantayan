"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { MessageSquare } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./store-chats.module.css";

export default function StoreChatsPage() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessId) return;

    const q = query(
      collection(db, COLLECTIONS.CHATS || "chats"),
      where("businessId", "==", user.businessId),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChats(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.skeletonContainer}>
        <Skeleton height={32} width={160} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonItem}>
            <Skeleton height={44} width={44} variant="circle" />
            <div className={styles.skeletonText}>
              <Skeleton height={16} width={120} />
              <Skeleton height={14} width={200} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Chat Inbox</h1>

      {chats.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageSquare size={48} style={{ opacity: 0.4 }} />
          <h3>No Messages Yet</h3>
          <p>Customer conversations will appear here when they message your store.</p>
        </div>
      ) : (
        <div className={styles.chatList}>
          {chats.map((chat) => (
            <div key={chat.id} className={styles.chatItem}>
              <div className={styles.avatar}>
                {chat.buyerName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.buyerName || "Customer"}</div>
                <div className={styles.chatPreview}>{chat.lastMessage || "No messages yet"}</div>
              </div>
              <div className={styles.chatMeta}>
                <span className={styles.chatTime}>{formatTime(chat.lastMessageAt)}</span>
                {chat.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{chat.unreadCount}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
