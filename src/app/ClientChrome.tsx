// src/app/ClientChrome.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";
import AppTabsMobile from "../components/AppTabsMobile";

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hideHeader = pathname === "/login";
  const hideTabs = pathname === "/login";

  return (
    <>
      {!hideHeader && <Header />}

      {/* Only add top/bottom padding when chrome is present */}
      <main
        className={[
          hideHeader ? "" : "pt-14 md:pt-16",
          hideTabs ? "" : "with-bottom-tabs",
          "min-h-[100dvh] mx-auto max-w-screen-xl px-4",
        ].join(" ")}
      >
        {children}
      </main>

      {!hideTabs && <AppTabsMobile />}
    </>
  );
}
