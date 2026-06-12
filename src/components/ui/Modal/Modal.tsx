"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Modal.module.css";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOutsideClick?: boolean;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  size = "md",
  children,
  footer,
  closeOnOutsideClick = true,
}: ModalProps) => {
  // Prevent page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof window === "undefined") return null;

  const modalRoot = document.body;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={closeOnOutsideClick ? onClose : undefined}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={cn(styles.modal, styles[size])}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            
            <div className={styles.body}>{children}</div>

            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, modalRoot);
};

export default Modal;
export { Modal };
