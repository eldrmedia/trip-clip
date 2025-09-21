// src/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import ClientChrome from "./ClientChrome";

export const metadata: Metadata = {
  title: "TripClip",
  description: "Trips, expenses, and reports",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        {/* Client shell decides when to show header/tabs and applies padding */}
        <ClientChrome>{children}</ClientChrome>

        {/* Keep analytics and toaster inside body */}
        <Analytics />
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
