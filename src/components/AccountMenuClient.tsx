"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type SessionResponse = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
} | null;

export default function AccountMenuClient(initial: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Local state (can come from props or session fetch)
  const [name, setName] = useState<string | null>(initial.name ?? null);
  const [email, setEmail] = useState<string | null>(initial.email ?? null);
  const [image, setImage] = useState<string | null>(initial.image ?? null);

  // If ANY field is missing, hydrate from NextAuth session
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (name && email && image) return; // we already have everything
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const data: SessionResponse = await res.json();
        if (cancelled) return;
        const u = data?.user;
        if (!u) return;

        if (!name && u.name) setName(u.name);
        if (!email && u.email) setEmail(u.email);
        if (!image && u.image) setImage(u.image);
      } catch {
        // ignore – we’ll show fallback avatar
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
    // run once; internal logic gates the fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build avatar URL with smart fallbacks and Google sizing hint
  const baseDisplay = name || email || "Account";
  const initialsSeed = encodeURIComponent(name || email || "U");

  const googleSized = image && image.includes("lh3.googleusercontent.com")
    ? `${image}${image.includes("?") ? "&" : "?"}sz=64`
    : image || "";

  const [avatarSrc, setAvatarSrc] = useState<string>(
    googleSized || `https://api.dicebear.com/8.x/initials/svg?seed=${initialsSeed}`
  );

  // Keep avatarSrc in sync when `image` arrives later
  useEffect(() => {
    const next = googleSized || `https://api.dicebear.com/8.x/initials/svg?seed=${initialsSeed}`;
    setAvatarSrc(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, name, email]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50"
      >
        <img
          src={avatarSrc}
          alt=""
          className="h-7 w-7 rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={() =>
            setAvatarSrc(`https://api.dicebear.com/8.x/initials/svg?seed=${initialsSeed}`)
          }
        />
        <span className="hidden sm:block max-w-[12rem] truncate text-sm">
          {baseDisplay}
        </span>
        <svg className="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.127l3.71-3.896a.75.75 0 1 1 1.08 1.04l-4.24 4.46a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg"
        >
          <div className="border-b px-4 py-3">
            <div className="truncate text-sm font-medium">{name || "Signed in"}</div>
            <div className="truncate text-xs text-gray-600">{email}</div>
          </div>
          <div className="py-1">
            <Link
              href="/settings/profile"
              role="menuitem"
              className="block px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/settings/google"
              role="menuitem"
              className="block px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Google settings
            </Link>
          </div>
          <div className="border-t">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
