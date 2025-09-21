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
    href: "/trips",
    label: "Trips",
    isActive: (p) => p === "/trips" || p.startsWith("/trips/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M20 12H4m14 0c0 4-3 7-7 7s-7-3-7-7 3-7 7-7 7 3 7 7Zm-9 0h4"
          className={a ? "fill-none stroke-current" : "fill-none stroke-current/70"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/expenses",
    label: "Expenses",
    isActive: (p) => p === "/expenses" || p.startsWith("/expenses/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M4 7h16v10H4zM8 3v4m8-4v4M7 11h10"
          className={a ? "fill-none stroke-current" : "fill-none stroke-current/70"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    isActive: (p) => p === "/reports" || p.startsWith("/reports/"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M4 19h16M6 17V7m6 10V5m6 12V9"
          className={a ? "fill-none stroke-current" : "fill-none stroke-current/70"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    isActive: (p) => p === "/activity",
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M3 12h3l2 5 4-10 3 7h6"
          className={a ? "fill-none stroke-current" : "fill-none stroke-current/70"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/settings/profile",
    label: "Settings",
    isActive: (p) => p.startsWith("/settings"),
    icon: (a) => (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 4a8 8 0 1 1-16 0"
          className={a ? "fill-none stroke-current" : "fill-none stroke-current/70"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function AppTabsMobile() {
  const pathname = usePathname() || "/";
  return (
    <nav
      aria-label="Primary"
      className="
        fixed inset-x-0 bottom-0 z-[95] border-t border-black/10 bg-white/95
        backdrop-blur supports-[backdrop-filter]:bg-white/75
        dark:border-white/10 dark:bg-neutral-900/80 dark:supports-[backdrop-filter]:bg-neutral-900/60
        md:hidden
      "
    >
      <ul className="safe-bottom mx-auto grid h-[56px] max-w-screen-sm grid-cols-5 px-2">
        {tabs.map((t) => {
          const active = t.isActive(pathname);
          return (
            <li key={t.href} className="flex items-center justify-center">
              <Link
                href={t.href}
                className={`
                  group inline-flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-xl
                  text-[11px] leading-none
                  ${active ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-300"}
                  hover:bg-black/5 dark:hover:bg-white/5
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600
                `}
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
