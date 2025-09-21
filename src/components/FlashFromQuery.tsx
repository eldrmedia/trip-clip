// src/components/FlashFromQuery.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function FlashFromQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const c = params.get("connected");
    const d = params.get("disconnected");
    if (c) setMsg(`Connected ${c} successfully`);
    if (d) setMsg(`Disconnected ${d}`);
    if (c || d) {
      const t = setTimeout(() => {
        setMsg(null);
        // Drop the query params from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("connected");
        url.searchParams.delete("disconnected");
        router.replace(url.pathname + url.search + url.hash);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [params, router]);

  if (!msg) return null;
  return (
    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      {msg}
    </div>
  );
}
