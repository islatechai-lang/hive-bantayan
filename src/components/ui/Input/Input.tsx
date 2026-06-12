import React, { forwardRef } from "react";
import styles from "./Input.module.css";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          styles.container,
          error && styles.error,
          disabled && styles.disabled,
          wrapperClassName
        )}
      >
        {label && <label className={styles.label}>{label}</label>}
        <div
          className={cn(
            styles.inputWrapper,
            leftIcon ? styles.hasLeftIcon : "",
            rightIcon ? styles.hasRightIcon : ""
          )}
        >
          {leftIcon && <div className={styles.iconLeft}>{leftIcon}</div>}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(styles.input, className)}
            {...props}
          />
          {rightIcon && <div className={styles.iconRight}>{rightIcon}</div>}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
        {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
export { Input };
