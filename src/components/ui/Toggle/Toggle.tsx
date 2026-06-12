import React from "react";
import styles from "./Toggle.module.css";
import { cn } from "@/lib/utils/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: ToggleProps) => {
  return (
    <div
      className={cn(
        styles.container,
        checked && styles.checked,
        disabled && styles.disabled,
        className
      )}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className={styles.switch}>
        <div className={styles.knob} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};

export default Toggle;
export { Toggle };
