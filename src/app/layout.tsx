// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { getServerSession } from "next-auth";
import ClientChrome from "./ClientChrome";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check so we can hide chrome when logged out
  const session = await getServerSession();
  const authed = !!session?.user;

  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <Analytics />
        {/* Pass 'authed' down; ClientChrome will hide header/sidebar/tabs when false or on /login */}
        <ClientChrome authed={authed}>{children}</ClientChrome>
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
