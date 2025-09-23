// src/app/ClientChrome.tsx
"use client";

import { usePathname } from "next/navigation";
import Header from "../components/Header";
import AppTabsMobile from "../components/AppTabsMobile";
import AppSidebar from "../components/AppSidebar";
import FAB from "../components/FAB";

export default function ClientChrome({
  children,
  authed = true,
}: {
  children: React.ReactNode;
  authed?: boolean;
}) {
  const pathname = usePathname() || "/";
  const isLogin = pathname === "/login";
  const hideAllChrome = isLogin || !authed;

  const showFab =
    !hideAllChrome &&
    (pathname === "/expenses" || pathname === "/trips" || pathname.startsWith("/trips/"));

  const cx = (...parts: Array<string | false>) => parts.filter(Boolean).join(" ");

  return (
    <>
      {!hideAllChrome && <Header />}

      <div className={cx(!hideAllChrome && "pt-14 md:pt-16", !hideAllChrome && "with-bottom-tabs", "min-h-[100dvh]")}>
        <div
          className={cx(
            "mx-auto max-w-screen-xl px-4 lg:px-6",
            !hideAllChrome && "lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6"
          )}
        >
          {!hideAllChrome && (
            <aside
              className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:py-2"
              aria-label="Sidebar"
            >
              <AppSidebar />
            </aside>
          )}

          <main role="main" className="pb-4">
            {children}
          </main>
        </div>
      </div>

      {showFab && <FAB href="/expenses/quick" label="Quick add expense" />}
      {!hideAllChrome && <AppTabsMobile />}
    </>
  );
}
