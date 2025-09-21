"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";
import AppTabsMobile from "../components/AppTabsMobile";
import AppSidebar from "../components/AppSidebar";
import FAB from "../components/FAB";

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hideHeader = pathname === "/login";
  const hideTabs = pathname === "/login";

  // Where to show the FAB
  const showFab =
    pathname === "/expenses" || pathname.startsWith("/trips/") || pathname === "/trips";

  return (
    <>
      {!hideHeader && <Header />}

      <div
        className={[
          hideHeader ? "" : "pt-14 md:pt-16",
          hideTabs ? "" : "with-bottom-tabs",
          "min-h-[100dvh]"
        ].join(" ")}
      >
        <div className="mx-auto max-w-screen-xl px-4 lg:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
          {/* Sidebar (desktop) */}
          <aside
            className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:py-2"
            aria-label="Sidebar"
          >
            <AppSidebar />
          </aside>

          {/* Main content */}
          <main role="main" className="pb-4">
            {children}
          </main>
        </div>
      </div>

      {/* FAB (mobile + desktop) */}
      {showFab && <FAB href="/expenses/quick" label="Quick add expense" />}

      {/* Bottom tabs (mobile only) */}
      {!hideTabs && <AppTabsMobile />}
    </>
  );
}
