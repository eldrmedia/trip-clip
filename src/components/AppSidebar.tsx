"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item =
  | { href: string; label: string; active: (p: string) => boolean; children?: undefined }
  | { label: string; section: true; children: { href: string; label: string; active: (p: string) => boolean }[] };

const items: Item[] = [
  { href: "/",         label: "Dashboard", active: p => p === "/" },
  { href: "/trips",    label: "Trips",     active: p => p === "/trips" || p.startsWith("/trips/") },
  { href: "/expenses", label: "Expenses",  active: p => p === "/expenses" || p.startsWith("/expenses/") },
  { href: "/reports",  label: "Reports",   active: p => p === "/reports" || p.startsWith("/reports/") },
  { href: "/activity", label: "Activity",  active: p => p === "/activity" },
  {
    label: "Settings",
    section: true,
    children: [
      { href: "/settings/profile", label: "Profile", active: p => p === "/settings/profile" },
      { href: "/settings/google",  label: "Google",  active: p => p === "/settings/google"  },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname() || "/";

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="space-y-1">
        {items.map(entry => {
          if ("section" in entry && entry.section) {
            return (
              <li key={entry.label} className="mt-4">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-900">
                  {entry.label}
                </div>
                <ul className="space-y-1">
                  {entry.children.map(child => {
                    const isActive = child.active(pathname);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
                            isActive
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-800 hover:bg-black/10"
                          ].join(" ")}
                        >
                          {isActive && (
                            <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-white/80 mix-blend-overlay" aria-hidden />
                          )}
                          <span
                            className={["inline-block h-2 w-2 rounded-full", isActive ? "bg-white" : "bg-neutral-600"].join(" ")}
                            aria-hidden
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          }

          const isActive = entry.active(pathname);
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-800 hover:bg-black/10"
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-white/80 mix-blend-overlay" aria-hidden />
                )}
                <span
                  className={["inline-block h-2 w-2 rounded-full", isActive ? "bg-white" : "bg-neutral-600"].join(" ")}
                  aria-hidden
                />
                <span className="truncate">{entry.label}</span>
              </Link>

              {/* Inline quick add under Expenses */}
              {entry.href === "/expenses" && (
                <div className="pl-7 pt-1">
                  <Link href="/expenses/quick" className="text-xs text-neutral-700 underline-offset-2 hover:underline">
                    + Quick add expense
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
