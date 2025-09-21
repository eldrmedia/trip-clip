// src/components/GoogleConnectButton.tsx
"use client";
import { signIn } from "next-auth/react";

export default function GoogleConnectButton({
  label,
  scopes,
  service,
}: {
  label: string;
  scopes: string[];
  service: "gmail" | "calendar" | "drive";
}) {
  return (
    <button
      type="button"
      className="rounded bg-black text-white px-4 py-2 text-sm"
      onClick={() =>
        signIn("google", {
          // Send the user back to the settings page with a flash query param
          callbackUrl: `/settings/google?connected=${service}`,
          prompt: "consent", // or "select_account consent"
          access_type: "offline",
          include_granted_scopes: "true",
          scope: scopes.join(" "),
        })
      }
    >
      {label}
    </button>
  );
}
