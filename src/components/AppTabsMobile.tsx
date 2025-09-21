"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  isActive: (path: string) => boolean;
  icon: (active: boolean) => JSX.Element;
};

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    isActive: (p) => p === "/",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 10l8-6 8 6v8a2 2 0 0 1-2 2h-4V12H10v8H6a2 2 0 0 1-2-2v-8Z"
          className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/trips",
    label: "Trips",
    isActive: (p) => p === "/trips" || p.startsWith("/trips/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M20 12H4m14 0c0 4-3 7-7 7s-7-3-7-7 3-7 7-7 7 3 7 7Zm-9 0h4"
          className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/expenses",
    label: "Expenses",
    isActive: (p) => p === "/expenses" || p.startsWith("/expenses/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 7h16v10H4zM8 3v4m8-4v4M7 11h10"
          className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    isActive: (p) => p === "/reports" || p.startsWith("/reports/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 19h16M6 17V7m6 10V5m6 12V9"
          className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/settings/profile",
    label: "Settings",
    isActive: (p) => p.startsWith("/settings"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 4a8 8 0 1 1-16 0"
          className="fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AppTabsMobile() {
  const pathname = usePathname() || "/";
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:hidden"
    >
      <ul className="safe-bottom mx-auto grid h-[56px] max-w-screen-sm grid-cols-5 px-2">
        {tabs.map((t) => {
          const active = t.isActive(pathname);
          return (
            <li key={t.href} className="flex items-center justify-center">
              <Link
                href={t.href}
                className={[
                  "group inline-flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] leading-none",
                  active ? "text-neutral-900" : "text-neutral-600",
                  "hover:bg-black/5",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {t.icon(active)}
                <span className="mt-0.5">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
