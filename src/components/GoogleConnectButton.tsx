"use client";
import { signIn } from "next-auth/react";

export default function GoogleConnectButton({
  label,
  scopes,
}: {
  label: string;
  scopes: string[];
}) {
  // join scopes and ask Google for offline access + re-consent
  const scope = scopes.join(" ");
  return (
    <button
      type="button"
      onClick={() =>
        signIn("google", {
          callbackUrl: "/settings/google",
          scope,
          prompt: "consent",
          access_type: "offline",
        })
      }
      className="rounded bg-black text-white px-3 py-2 text-sm"
    >
      {label}
    </button>
  );
}
