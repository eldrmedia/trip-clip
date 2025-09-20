// src/app/settings/google/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import GoogleConnectButton from "@/components/GoogleConnectButton";

const gmailScopes = [
  "openid", "email", "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

const calendarScopes = [
  "openid", "email", "profile",
  "https://www.googleapis.com/auth/calendar.events",
];

const driveScopes = [
  "openid", "email", "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

export default async function GoogleSettings() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const user =
    (s.user as any).id
      ? await prisma.user.findUnique({ where: { id: (s.user as any).id } })
      : s.user.email
      ? await prisma.user.findUnique({ where: { email: s.user.email } })
      : null;

  if (!user) redirect("/login");

  // Look for an existing Google account row to infer granted scopes
  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: "google" },
    select: { scope: true },
  });
  const granted = (account?.scope || "").split(/\s+/);

  const hasGmail =
    user.googleGmailConnected ||
    granted.some((s) => s.startsWith("https://www.googleapis.com/auth/gmail"));
  const hasCalendar =
    user.googleCalendarConnected ||
    granted.includes("https://www.googleapis.com/auth/calendar") || // if previously granted broad scope
    granted.includes("https://www.googleapis.com/auth/calendar.events");
  const hasDrive =
    user.googleDriveConnected ||
    granted.includes("https://www.googleapis.com/auth/drive.file");

  async function save(formData: FormData) {
    "use server";
    const usePrim = formData.get("usePrimary") === "on";
    const mins = Number(formData.get("bufferMinutes") || 90);
    await prisma.user.update({
      where: { id: user.id },
      data: { usePrimaryCalendar: usePrim, bufferMinutes: mins },
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Google Connections</h1>

      <Section
        title="Gmail (read + labels)"
        connected={hasGmail}
        help="Imports travel emails to auto-create Trips."
        action={
          <GoogleConnectButton
            label={hasGmail ? "Reconnect Gmail" : "Connect Gmail"}
            scopes={gmailScopes}
          />
        }
      />

      <Section
        title="Calendar (events only)"
        connected={hasCalendar}
        help="Adds flight events and travel buffers."
        action={
          <GoogleConnectButton
            label={hasCalendar ? "Reconnect Calendar" : "Connect Calendar"}
            scopes={calendarScopes}
          />
        }
      />

      <Section
        title="Drive (file create + metadata)"
        connected={hasDrive}
        help="Creates Trip folders and exports CSV/receipts."
        action={
          <GoogleConnectButton
            label={hasDrive ? "Reconnect Drive" : "Connect Drive"}
            scopes={driveScopes}
          />
        }
      />

      <form action={save} className="rounded border p-4 space-y-3 bg-white">
        <div className="font-medium">Preferences</div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="usePrimary"
            defaultChecked={!!user.usePrimaryCalendar}
          />
          <span>Use primary calendar (instead of dedicated “Travel” calendar)</span>
        </label>
        <label className="block">
          <div className="text-sm">Buffer minutes (pre/post flight)</div>
          <input
            type="number"
            name="bufferMinutes"
            defaultValue={user.bufferMinutes ?? 90}
            className="mt-1 w-28 rounded border px-2 py-1"
          />
        </label>
        <button className="rounded bg-black text-white px-3 py-2 text-sm">Save</button>
      </form>
    </div>
  );
}

function Section({
  title,
  connected,
  help,
  action,
}: {
  title: string;
  connected: boolean;
  help: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded border p-4 bg-white flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{help}</div>
      </div>
      {connected ? (
        <span className="text-green-700 text-sm">Connected</span>
      ) : (
        action
      )}
    </div>
  );
}
