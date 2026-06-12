"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Clock, Truck, Award } from "lucide-react";
import type { Business } from "@/lib/types";
import { formatCurrency, formatEstimatedTime, isBusinessOpen } from "@/lib/utils/formatters";
import Badge from "@/components/ui/Badge/Badge";
import styles from "./BusinessCard.module.css";

export interface BusinessCardProps {
  business: Business;
}

const BusinessCard = ({ business }: BusinessCardProps) => {
  const router = useRouter();
  
  // Calculate if business is open
  const openInfo = isBusinessOpen(business.businessHours, business.isOpen && !business.isPaused);
  
  const handleClick = () => {
    router.push(`/business/${business.id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      {/* Cover Image */}
      <div className={styles.coverWrapper}>
        <Image
          src={business.coverUrl || "/images/cover-placeholder.jpg"}
          alt={`${business.name} cover`}
          fill
          sizes="(max-width: 480px) 100vw, 400px"
          className={styles.coverImage}
          priority={false}
        />
        {/* Open/Closed Badge Overlay */}
        <div className={styles.badgeOverlay}>
          {openInfo.status === "open" && <Badge variant="accepted">Open Now</Badge>}
          {openInfo.status === "closing_soon" && <Badge variant="pending">Closing Soon</Badge>}
          {openInfo.status === "closed" && <Badge variant="cancelled">Closed</Badge>}
        </div>
      </div>

      {/* Logo Container Overlapping */}
      <div className={styles.logoWrapper}>
        <Image
          src={business.logoUrl || "/images/logo-placeholder.jpg"}
          alt={`${business.name} logo`}
          width={50}
          height={50}
          className={styles.logoImage}
        />
      </div>

      {/* Card Content details */}
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{business.name}</h3>
            {business.isVerified && (
              <span className={styles.verified} title="Verified Store">
                <Award size={16} fill="var(--secondary)" color="#FFFFFF" />
              </span>
            )}
          </div>
          <div className={styles.ratingRow}>
            <Star size={14} fill="var(--accent)" className={styles.starIcon} />
            <span>{business.rating.toFixed(1)}</span>
            <span style={{ color: "var(--text-light)", fontWeight: 400 }}>
              ({business.totalRatings})
            </span>
          </div>
        </div>

        <p className={styles.desc}>{business.description}</p>

        <div className={styles.footerRow}>
          <div className={styles.metric}>
            <Clock size={14} />
            <span>Prep: </span>
            <span className={styles.metricValue}>
              {formatEstimatedTime(business.estimatedPrepTime)}
            </span>
          </div>
          <div className={styles.metric}>
            <Truck size={14} />
            <span>Delivery: </span>
            <span className={styles.metricValue}>
              {business.deliveryFee === 0 ? "FREE" : formatCurrency(business.deliveryFee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
export { BusinessCard };
