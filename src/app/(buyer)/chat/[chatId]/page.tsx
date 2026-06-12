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
import { sendPushNotification } from "@/lib/utils/onesignal";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "../chat.module.css";

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();

  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [business, setBusiness] = useState<any | null>(null);
  const [chatMeta, setChatMeta] = useState<any | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine role-aware properties
  const isBusinessUser = user?.role === "business" && !!user?.businessId;
  const buyerId = isBusinessUser ? (params.chatId as string) : user?.id;
  const businessId = isBusinessUser ? user.businessId : (params.chatId as string);
  const chatId = buyerId && businessId ? `${buyerId}_${businessId}` : "";

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load business info, chat meta, and messages
  useEffect(() => {
    if (!user || !buyerId || !businessId || !chatId) return;

    async function initializeChat() {
      try {
        // 1. Fetch store info
        const busRef = doc(db, COLLECTIONS.BUSINESSES, businessId as string);
        const busSnap = await getDoc(busRef);
        let currentBusinessData: any = null;
        if (busSnap.exists()) {
          currentBusinessData = { id: busSnap.id, ...busSnap.data() };
          setBusiness(currentBusinessData);
        }

        // 2. Setup chat document in collection if missing
        const chatRef = doc(db, COLLECTIONS.CHATS, chatId as string);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists() && currentBusinessData) {
          // If this is a buyer opening it, let's create the default document
          if (!isBusinessUser) {
            await setDoc(chatRef, {
              participants: [buyerId, businessId],
              customerId: buyerId,
              customerName: user.displayName,
              customerPhoto: user.photoUrl,
              businessId,
              businessName: currentBusinessData.name,
              businessLogo: currentBusinessData.logoUrl,
              lastMessage: "Conversation started",
              lastMessageAt: serverTimestamp(),
              unreadCustomer: 0,
              unreadBusiness: 0,
            });
            const freshSnap = await getDoc(chatRef);
            setChatMeta(freshSnap.data());
          }
        } else if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          setChatMeta(chatData);

          // Clear unread counts for the active user role
          if (isBusinessUser) {
            await updateDoc(chatRef, { unreadBusiness: 0 });
          } else {
            await updateDoc(chatRef, { unreadCustomer: 0 });
          }
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
  }, [user, buyerId, businessId, chatId, isBusinessUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !chatId) return;

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
      const chatRef = doc(db, COLLECTIONS.CHATS, chatId as string);
      await updateDoc(chatRef, {
        lastMessage: textToSend,
        lastMessageAt: serverTimestamp(),
        unreadBusiness: isBusinessUser ? 0 : 1,
        unreadCustomer: isBusinessUser ? 1 : 0,
      });

      // 3. Send OneSignal Push Notification
      try {
        const targetUserId = isBusinessUser ? buyerId : business?.ownerId;
        if (targetUserId) {
          const senderName = isBusinessUser ? `${business?.name || user.displayName} (Store)` : user.displayName;
          await sendPushNotification(
            [targetUserId],
            `New message from ${senderName}`,
            textToSend,
            { chatId, type: "chat_message" }
          );
        }
      } catch (pushErr) {
        console.error("OneSignal chat message notification failed:", pushErr);
      }

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

  const headerTitle = isBusinessUser
    ? (chatMeta?.customerName || "Customer")
    : (business?.name || "Store Owner");

  const headerAvatar = isBusinessUser
    ? (chatMeta?.customerPhoto || "/images/logo-placeholder.jpg")
    : (business?.logoUrl || "/images/logo-placeholder.jpg");

  return (
    <div className="app-container">
      <div className={styles.chatBox}>
        {/* Sticky Chat Header */}
        <header className={styles.chatBoxHeader}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
          <div className={styles.avatar} style={{ position: "relative", width: 40, height: 40 }}>
            <Image
              src={headerAvatar}
              alt={headerTitle}
              fill
              className={styles.avatarImage}
              unoptimized
            />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>{headerTitle}</h3>
            <span style={{ fontSize: 11, color: "var(--status-accepted)" }}>Online</span>
          </div>
        </header>

        {/* Scrollable Message List */}
        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", margin: "auto", color: "var(--text-light)", fontSize: 13 }}>
              Say hello to start the conversation!
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
