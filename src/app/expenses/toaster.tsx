// src/app/expenses/toaster.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function ExpensesToaster() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const success = params.get("success");
    if (!success) return;

    const key = `${pathname}:${success}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    if (success === "created") toast.success("Expense created");
    if (success === "updated") toast.success("Expense updated");
    if (success === "deleted") toast.error("Expense deleted"); // 🔴 red toast

    const next = new URLSearchParams(params);
    next.delete("success");
    router.replace(next.toString() ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
