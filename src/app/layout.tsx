// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

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
      <Analytics/>
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <Header />
        <main className="pt-14 md:pt-16 min-h-[100dvh] mx-auto max-w-screen-xl px-4">
          {children}
        </main>
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
