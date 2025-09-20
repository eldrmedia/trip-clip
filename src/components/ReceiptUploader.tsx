"use client";
import React, { useState } from "react";

export default function ReceiptUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      onUploaded(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input type="file" accept="image/*,application/pdf" onChange={handleChange} />
      {busy && <div className="text-sm text-gray-600">Uploading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
