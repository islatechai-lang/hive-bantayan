"use client";

import React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/formatters";
import styles from "./ProductCard.module.css";
import { cn } from "@/lib/utils/cn";

export interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddImmediate?: (product: Product) => void;
}

const ProductCard = ({ product, onSelect, onAddImmediate }: ProductCardProps) => {
  const isOutOfStock = !product.inStock || product.stockQty <= 0;

  return (
    <div
      className={cn(styles.card, isOutOfStock && styles.outOfStock)}
      onClick={() => onSelect(product)}
    >
      {isOutOfStock && <div className={styles.outOfStockBadge}>SOLD OUT</div>}
      
      {/* Product Image */}
      <div className={styles.imageWrapper}>
        <Image
          src={product.images?.[0] || "/images/product-placeholder.jpg"}
          alt={product.name}
          fill
          sizes="90px"
          className={styles.image}
        />
      </div>

      {/* Info Column */}
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h4 className={styles.name}>{product.name}</h4>
          <p className={styles.desc}>{product.description}</p>
        </div>

        <div className={styles.priceRow}>
          <div className={styles.priceCol}>
            <span className={styles.price}>{formatCurrency(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className={styles.originalPrice}>
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            className={styles.addBtn}
            onClick={(e) => {
              e.stopPropagation();
              const hasOptions = (product.variants && product.variants.length > 0) || (product.addOns && product.addOns.length > 0);
              if (onAddImmediate && !hasOptions) {
                onAddImmediate(product);
              } else {
                onSelect(product);
              }
            }}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
export { ProductCard };
