"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header
 * - Sticky top bar with contextual title derived from the current route.
 * - Tailwind-only styling; no extra CSS files.
 * - No business logic. Pure chrome.
 */
export default function Header() {
  const pathname = usePathname() || "/";
  const title = deriveTitle(pathname);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-[100] border-b border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75",
        elevated ? "shadow-sm" : "shadow-none",
        "h-14 md:h-16",
      ].join(" ")}
    >
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-4">
        {/* Left: Brand + Title */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Go to Home page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white"
          >
            <span aria-hidden="true" className="text-sm leading-none">✦</span>
          </Link>
          <h1
            className="truncate text-[17px] font-semibold tracking-[0.2px] md:text-lg"
            aria-live="polite"
          >
            {title}
          </h1>
        </div>

        {/* Right: Global actions (placeholders—no logic yet) */}
        <nav className="flex items-center gap-1" aria-label="Global actions">
          <button
            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" />
            </svg>
          </button>
          <button
            className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-hidden="true">
              <path d="M12 8a2 2 0 110-4 2 2 0 010 4Zm0 6a2 2 0 110-4 2 2 0 010 4Zm0 6a2 2 0 110-4 2 2 0 010 4Z" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}

function deriveTitle(path: string): string {
  if (path === "/" || path.startsWith("/trips")) {
    if (path === "/trips") return "Dashboard";
    if (path === "/trips/new") return "New Trip";
    if (/^\/trips\/[^/]+$/.test(path)) return "Trip Details";
    return "Trips";
  }
  if (path.startsWith("/expenses")) {
    if (path === "/expenses") return "Expenses";
    if (path === "/expenses/new") return "New Expense";
    if (path === "/expenses/quick") return "Quick Add";
    if (/^\/expenses\/[^/]+\/edit$/.test(path)) return "Edit Expense";
    return "Expenses";
  }
  if (path.startsWith("/reports")) {
    if (path === "/reports") return "Reports";
    if (/^\/reports\/[^/]+$/.test(path)) return "Report";
    return "Reports";
  }
  if (path.startsWith("/settings")) {
    if (path.endsWith("/profile")) return "Profile Settings";
    if (path.endsWith("/google")) return "Google Settings";
    return "Settings";
  }
  if (path === "/activity") return "Activity";
  if (path === "/health") return "Health";
  if (path === "/login") return "Login";
  return "App";
}
