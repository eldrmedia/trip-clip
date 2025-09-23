// src/app/ClientChrome.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";
import AppTabsMobile from "../components/AppTabsMobile";
import AppSidebar from "../components/AppSidebar";
import FAB from "../components/FAB";

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  // Hide all chrome on the login page
  const isLogin = pathname === "/login";

  // Show FAB only on these pages (and never on login)
  const showFab =
    !isLogin &&
    (pathname === "/expenses" || pathname === "/trips" || pathname.startsWith("/trips/"));

  // Utility to join classes
  const cx = (...parts: Array<string | false>) => parts.filter(Boolean).join(" ");

  return (
    <>
      {/* Header */}
      {!isLogin && <Header />}

      <div className={cx(!isLogin && "pt-14 md:pt-16", !isLogin && "with-bottom-tabs", "min-h-[100dvh]")}>
        <div
          className={cx(
            "mx-auto max-w-screen-xl px-4 lg:px-6",
            !isLogin && "lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6"
          )}
        >
          {/* Sidebar (desktop only, hidden on login) */}
          {!isLogin && (
            <aside
              className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:py-2"
              aria-label="Sidebar"
            >
              <AppSidebar />
            </aside>
          )}

          {/* Main content */}
          <main role="main" className="pb-4">
            {children}
          </main>
        </div>
      </div>

      {/* FAB (mobile + desktop), never on login */}
      {showFab && <FAB href="/expenses/quick" label="Quick add expense" />}

      {/* Bottom tabs (mobile only), hidden on login */}
      {!isLogin && <AppTabsMobile />}
    </>
  );
}
