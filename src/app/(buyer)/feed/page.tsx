"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatRelativeTime } from "@/lib/utils/formatters";
import { Compass, MessageCircle, Heart, Share2 } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import styles from "./feed.module.css";

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const q = query(
          collection(db, COLLECTIONS.FEED_POSTS || "feedPosts"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(items);
      } catch (error) {
        console.error("Error loading feed:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: 20 }}>
        <Skeleton height={32} width={150} style={{ marginBottom: 20 }} />
        {[1, 2].map((i) => (
          <Card key={i} style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Skeleton height={40} width={40} variant="circle" />
              <div>
                <Skeleton height={16} width={100} style={{ marginBottom: 6 }} />
                <Skeleton height={12} width={60} />
              </div>
            </div>
            <Skeleton height={200} style={{ marginBottom: 12 }} />
            <Skeleton height={20} style={{ marginBottom: 6 }} />
            <Skeleton height={20} width="80%" />
          </Card>
        ))}
      </div>
    );
  }

  // Mock posts as fallback if database is empty
  const displayPosts = posts.length > 0 ? posts : [
    {
      id: "mock-1",
      businessName: "Alberto's Pizza Bantayan",
      businessLogo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=80&q=80",
      content: "Fresh out of the oven! 🍕 Get 10% off on our Hawaiian Special today only. Use promo code ALBERTO10 at checkout. Delivery island-wide!",
      images: ["https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"],
      likes: 24,
      createdAt: { toDate: () => new Date(Date.now() - 3600000) },
      businessId: "albertos-pizza"
    },
    {
      id: "mock-2",
      businessName: "Island Grill & Seafoods",
      businessLogo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=80&q=80",
      content: "Craving fresh seafood? 🦀 We just restocked our daily catch! Drop by or order via app for hot garlic butter crabs delivered to your resort.",
      images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"],
      likes: 42,
      createdAt: { toDate: () => new Date(Date.now() - 7200000) },
      businessId: "island-grill"
    }
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Island Feed</h1>

      <div className={styles.postsList}>
        {displayPosts.map((post) => (
          <Card key={post.id} className={styles.postCard}>
            {/* Header */}
            <div className={styles.postHeader} onClick={() => post.businessId && router.push(`/business/${post.businessId}`)}>
              <div className={styles.logoWrapper}>
                <Image
                  src={post.businessLogo || "/images/logo-placeholder.jpg"}
                  alt={post.businessName}
                  fill
                  className={styles.logoImage}
                  unoptimized
                />
              </div>
              <div>
                <h3 className={styles.businessName}>{post.businessName}</h3>
                <span className={styles.postTime}>
                  {post.createdAt ? formatRelativeTime(post.createdAt) : ""}
                </span>
              </div>
            </div>

            {/* Content text */}
            <p className={styles.contentText}>{post.content}</p>

            {/* Post Image */}
            {post.images && post.images.length > 0 && (
              <div className={styles.postImageWrapper}>
                <Image
                  src={post.images[0]}
                  alt="Post media"
                  fill
                  className={styles.postImage}
                  unoptimized
                />
              </div>
            )}

            {/* Actions row */}
            <div className={styles.actionsRow}>
              <button className={styles.actionBtn}>
                <Heart size={18} />
                <span>{post.likes || 0}</span>
              </button>
              <button className={styles.actionBtn} onClick={() => post.businessId && router.push(`/chat/${post.businessId}`)}>
                <MessageCircle size={18} />
                <span>Inquire</span>
              </button>
              <button className={styles.actionBtn}>
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
