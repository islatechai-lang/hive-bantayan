import React from "react";
import styles from "./Card.module.css";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  flat?: boolean;
}

const Card = ({
  className,
  hoverable = false,
  glass = false,
  flat = false,
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        styles.card,
        hoverable && styles.hoverable,
        glass && styles.glass,
        flat && styles.flat,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
export { Card };
