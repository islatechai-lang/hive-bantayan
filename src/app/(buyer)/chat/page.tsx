"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MessageSquare, Calendar } from "lucide-react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatRelativeTime } from "@/lib/utils/formatters";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./chat.module.css";

export default function ChatListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    // Listen to chats in real-time
    const q = query(
      collection(db, COLLECTIONS.CHATS),
      where("customerId", "==", userId),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to chats list:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: 20 }}>
        <Skeleton height={20} width={120} />
        <Skeleton height={80} style={{ marginTop: 24 }} />
        <Skeleton height={80} style={{ marginTop: 12 }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Inbox Messages</h1>

      {chats.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-light)" }}>
          <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <h3>No Messages Yet</h3>
          <p>Your conversations with store owners will show up here.</p>
        </div>
      ) : (
        <div className={styles.chatList}>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={styles.chatItem}
              onClick={() => router.push(`/chat/${chat.businessId}`)}
            >
              <div className={styles.avatar}>
                <Image
                  src={chat.businessLogo || "/images/logo-placeholder.jpg"}
                  alt={chat.businessName}
                  fill
                  className={styles.avatarImage}
                />
              </div>

              <div className={styles.chatDetails}>
                <div className={styles.chatHeader}>
                  <span className={styles.chatName}>{chat.businessName}</span>
                  <span className={styles.chatTime}>
                    {chat.lastMessageAt ? formatRelativeTime(chat.lastMessageAt) : ""}
                  </span>
                </div>
                <div className={styles.chatSub}>
                  <p className={styles.lastMsg}>{chat.lastMessage}</p>
                  {chat.unreadCustomer > 0 && (
                    <span className={styles.unreadBadge}>{chat.unreadCustomer}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
