import React from "react";
import styles from "./Badge.module.css";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "outline"
    | "pending"
    | "accepted"
    | "preparing"
    | "ready"
    | "delivery"
    | "completed"
    | "cancelled";
  pill?: boolean;
}

export const Badge = ({
  className,
  variant = "primary",
  pill = false,
  children,
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(
        styles.badge,
        styles[variant],
        pill && styles.pill,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
