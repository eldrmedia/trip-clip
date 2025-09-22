"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountMenuClient from "@/components/AccountMenuClient";

/**
 * Header (static brand)
 * - Sticky top bar with subtle elevation on scroll.
 * - Brand is always "TripClip" (no dynamic page title).
 * - Tailwind-only styling.
 */
export default function Header() {
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
        {/* Brand (always TripClip) */}
        <Link
          href="/"
          aria-label="Go to TripClip home"
          className="inline-flex items-center gap-2"
        >
          {/* If you want a small mark, uncomment this block:
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <span aria-hidden="true" className="text-sm leading-none">✦</span>
          </span>
          */}
          <span className="text-[17px] font-semibold tracking-[0.2px] md:text-lg">
            TripClip
          </span>
        </Link>

        {/* Right side intentionally empty for now */}
        <div>
          <AccountMenuClient />
        </div>
      </div>
    </header>
  );
}
