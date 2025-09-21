"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * FAB
 * - Appears bottom-right.
 * - On desktop, shows a tooltip on hover.
 * - On mobile, it’s just a tap target.
 */
export default function FAB({ href = "/expenses/quick", label = "Quick add" }: { href?: string; label?: string }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="fixed bottom-[72px] right-4 z-[96] md:bottom-6"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={href}
        className="
          inline-flex h-12 w-12 items-center justify-center rounded-full
          bg-neutral-900 text-white shadow-lg
          hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600
        "
        aria-label={label}
        title={label}
      >
        {/* plus icon */}
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 5v14M5 12h14" className="fill-none stroke-current" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>

      {/* Tooltip (desktop) */}
      <div
        className={[
          "pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 rounded-lg bg-black/90 px-2.5 py-1 text-xs text-white shadow",
          hover ? "opacity-100" : "opacity-0",
          "hidden md:block transition-opacity"
        ].join(" ")}
      >
        {label}
      </div>
    </div>
  );
}
