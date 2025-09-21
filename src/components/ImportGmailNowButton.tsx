// src/components/ImportGmailNowButton.tsx
"use client";
import { useState } from "react";

export default function ImportGmailNowButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cron/gmail-poll", { method: "GET" });
      const data = await res.json();
      setMsg(res.ok ? `Imported: ${data.processed ?? 0} message(s)` : `Error: ${data.error || "failed"}`);
    } catch (e) {
      setMsg("Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        {busy ? "Importing…" : "Import from Gmail now"}
      </button>
      {msg && <div className="text-xs text-gray-700">{msg}</div>}
    </div>
  );
}
