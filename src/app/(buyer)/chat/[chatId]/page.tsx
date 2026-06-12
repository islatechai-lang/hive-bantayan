"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuthStore } from "@/lib/stores/authStore";
import { formatTime } from "@/lib/utils/formatters";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "../chat.module.css";

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.chatId as string; // We query by business ID directly

  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [business, setBusiness] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = user ? `${user.id}_${businessId}` : "";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load business info and messages
  useEffect(() => {
    if (!user || !businessId) return;
    const currentUser = user;

    async function initializeChat() {
      try {
        // 1. Fetch store info
        const busRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
        const busSnap = await getDoc(busRef);
        if (busSnap.exists()) {
          setBusiness({ id: busSnap.id, ...busSnap.data() });
        }

        // 2. Setup chat document in collection if missing
        const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists() && busSnap.exists()) {
          const storeData = busSnap.data();
          await setDoc(chatRef, {
            participants: [currentUser.id, businessId],
            customerId: currentUser.id,
            customerName: currentUser.displayName,
            customerPhoto: currentUser.photoUrl,
            businessId,
            businessName: storeData.name,
            businessLogo: storeData.logoUrl,
            lastMessage: "Conversation started",
            lastMessageAt: serverTimestamp(),
            unreadCustomer: 0,
            unreadBusiness: 0,
          });
        } else if (chatSnap.exists()) {
          // Clear customer unread counts on enter
          await updateDoc(chatRef, { unreadCustomer: 0 });
        }

        // 3. Listen to messages subcollection in real-time
        const msgRef = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
        const q = query(msgRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(items);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up chat detail:", error);
        setLoading(false);
      }
    }

    initializeChat();
  }, [user, businessId, chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !business) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText("");

    try {
      // 1. Write message to messages subcollection
      const msgRef = collection(db, COLLECTIONS.CHATS, chatId, COLLECTIONS.MESSAGES);
      await addDoc(msgRef, {
        senderId: user.id,
        senderName: user.displayName,
        text: textToSend,
        imageUrl: "",
        orderId: "",
        createdAt: serverTimestamp(),
      });

      // 2. Update chat summary meta
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId);
      await updateDoc(chatRef, {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        unreadBusiness: 1, // Increment business side alert
      });

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Skeleton height={50} />
        <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <Skeleton height={40} width="60%" style={{ alignSelf: "flex-start" }} />
          <Skeleton height={40} width="50%" style={{ alignSelf: "flex-end" }} />
          <Skeleton height={40} width="70%" style={{ alignSelf: "flex-start" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className={styles.chatBox}>
        {/* Sticky Chat Header */}
        <header className={styles.chatBoxHeader}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div className={styles.avatar} style={{ width: 40, height: 40 }}>
            <Image
              src={business?.logoUrl || "/images/logo-placeholder.jpg"}
              alt={business?.name || "Business"}
              fill
              className={styles.avatarImage}
            />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{business?.name || "Store Owner"}</h3>
            <span style={{ fontSize: 11, color: "var(--status-accepted)" }}>Online</span>
          </div>
        </header>

        {/* Scrollable Message List */}
        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", color: "var(--text-light)", fontSize: 13 }}>
              Say hello to start ordering or asking questions!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageWrapper} ${isMe ? styles.senderMe : styles.senderOther}`}
                >
                  <div className={styles.messageBubble}>
                    <p>{msg.text}</p>
                  </div>
                  <span className={styles.messageTime}>
                    {msg.createdAt ? formatTime(msg.createdAt) : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Inputs row */}
        <form onSubmit={handleSend} className={styles.chatInputRow}>
          <input
            type="text"
            placeholder="Type message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            className={styles.inputField}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className={styles.sendBtn}
            aria-label="Send message"
          >
            {sending ? <Loader2 size={16} className="pulse" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
