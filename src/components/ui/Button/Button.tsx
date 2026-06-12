import React, { forwardRef } from "react";
import styles from "./Button.module.css";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "danger" | "text" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          styles.btn,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          loading && styles.loading,
          className
        )}
        {...props}
      >
        {loading && <div className={styles.spinner} />}
        {!loading && leftIcon && <span className="btn-left-icon">{leftIcon}</span>}
        <span className="btn-content">{children}</span>
        {!loading && rightIcon && <span className="btn-right-icon">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
export { Button };
