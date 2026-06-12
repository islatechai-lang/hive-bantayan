"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Compass, MessageSquare, User } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import styles from "./BottomNav.module.css";
import { cn } from "@/lib/utils/cn";

const BottomNav = () => {
  const pathname = usePathname();
  const getCartItemsCount = useCartStore((state) => state.getCartItemsCount);
  const cartCount = getCartItemsCount();

  const navItems = [
    {
      label: "Home",
      href: "/home",
      icon: <Home className={styles.icon} />,
    },
    {
      label: "Search",
      href: "/search",
      icon: <Search className={styles.icon} />,
    },
    {
      label: "Feed",
      href: "/feed",
      icon: <Compass className={styles.icon} />,
    },
    {
      label: "Chats",
      href: "/chat",
      icon: <MessageSquare className={styles.icon} />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className={styles.icon} />,
    },
  ];

  // Hide bottom nav on sub-routes that need full screen (like details/track/chat screens)
  const isSubRoute = pathname.split("/").length > 2;
  if (isSubRoute) return null;

  return (
    <nav className={styles.navBar}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isCart = item.label === "Chats"; // In standard apps, we could show chat or cart. Let's add cart bubble if there are items, but cart is a drawer/subpage. Let's put cart badge on the profile or chats, or we can just replace Feed/Chats with Cart if desired, but chats are important. Let's keep chats, and add cart badge on "Home" or just show chat count.
        // Actually, let's put a badge on Chats for unreads, and we can also add a floating cart button in home/search layouts!
        
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(styles.navItem, isActive && styles.activeItem)}
          >
            {item.icon}
            {isCart && cartCount > 0 && (
              <span className={styles.badge}>{cartCount}</span>
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
export { BottomNav };
