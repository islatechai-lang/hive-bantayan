import React from "react";
import styles from "./Skeleton.module.css";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rounded" | "pill";
  width?: string | number;
  height?: string | number;
}

const Skeleton = ({
  className,
  variant = "rounded",
  width,
  height,
  style,
  ...props
}: SkeletonProps) => {
  const customStyle: React.CSSProperties = {
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
    ...style,
  };

  return (
    <div
      className={cn(
        styles.skeleton,
        styles[variant],
        className
      )}
      style={customStyle}
      {...props}
    />
  );
};

export default Skeleton;
export { Skeleton };
