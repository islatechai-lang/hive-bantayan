import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/lib/providers/AuthProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Bantayan Hub — Local Marketplace & Delivery",
  description: "Discover local food, grocery, seafood, and items in Bantayan Island. Create your own shop or browse and track orders in real-time.",
  applicationName: "Bantayan Hub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bantayan Hub",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--bg-surface)",
                color: "var(--text-main)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "var(--shadow-md)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
