// src/app/settings/google/page.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import GoogleConnectButton from "@/components/GoogleConnectButton";
import FlashFromQuery from "@/components/FlashFromQuery";
import ImportGmailNowButton from "@/components/ImportGmailNowButton";

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
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");

  const su = s.user as { id?: string; email?: string | null };
  const user =
    (su.id && (await prisma.user.findUnique({ where: { id: su.id } }))) ||
    (su.email && (await prisma.user.findUnique({ where: { email: su.email } }))) ||
    null;

  if (!user) redirect("/login");

  // Flags are the source of truth (set by NextAuth events.linkAccount)
  const hasGmail = !!user.googleGmailConnected;
  const hasCalendar = !!user.googleCalendarConnected;
  const hasDrive = !!user.googleDriveConnected;

  async function save(formData: FormData) {
    "use server";
    const usePrim = formData.get("usePrimary") === "on";
    const mins = Number(formData.get("bufferMinutes") || 90);
    await prisma.user.update({
      where: { id: user.id },
      data: { usePrimaryCalendar: usePrim, bufferMinutes: mins },
    });
    revalidatePath("/settings/google");
  }

  async function disconnect(_service: "gmail" | "calendar" | "drive") {
    "use server";

    // Find the Google account to get tokens for revocation
    const acct = await prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
      select: { access_token: true, refresh_token: true },
    });

    // Best-effort revoke on Google's side (revoking refresh_token is preferred)
    const tokenToRevoke = acct?.refresh_token || acct?.access_token;
    if (tokenToRevoke) {
      try {
        // POST form-encoded body per Google spec
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: tokenToRevoke }).toString(),
          // No need to await JSON; 200/400 are both acceptable outcomes to continue
        });
      } catch {
        // ignore revoke network errors; continue cleanup
      }
    }

    // Remove the provider account rows (fully unlinks Google from NextAuth)
    await prisma.account.deleteMany({
      where: { userId: user.id, provider: "google" },
    });

    // Clear ALL Google-connected flags since the token is revoked app-wide
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleGmailConnected: false,
        googleCalendarConnected: false,
        googleDriveConnected: false,
      },
    });

    revalidatePath("/settings/google");
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Google Connections</h1>
      <FlashFromQuery />

      <div className="rounded-xl border p-4 bg-white">
        <div className="font-medium mb-2">Gmail Import</div>
        <p className="text-sm text-gray-600 mb-2">Run the importer immediately (otherwise it runs on a schedule).</p>
        <ImportGmailNowButton />
      </div>      

      <Section
        title="Gmail (read + labels)"
        connected={hasGmail}
        help="Imports travel emails to auto-create Trips."
        connect={
          <GoogleConnectButton
            label={hasGmail ? "Reconnect Gmail" : "Connect Gmail"}
            scopes={gmailScopes}
            service="gmail"
          />
        }
        disconnectAction={
          <form action={disconnect.bind(null, "gmail")}>
            <button className="text-sm text-red-600 hover:underline" type="submit">
              Disconnect
            </button>
          </form>
        }
      />

      <Section
        title="Calendar (events only)"
        connected={hasCalendar}
        help="Adds flight events and travel buffers."
        connect={
          <GoogleConnectButton
            label={hasCalendar ? "Reconnect Calendar" : "Connect Calendar"}
            scopes={calendarScopes}
            service="calendar"
          />
        }
        disconnectAction={
          <form action={disconnect.bind(null, "calendar")}>
            <button className="text-sm text-red-600 hover:underline" type="submit">
              Disconnect
            </button>
          </form>
        }
      />

      <Section
        title="Drive (file create + metadata)"
        connected={hasDrive}
        help="Creates Trip folders and exports CSV/receipts."
        connect={
          <GoogleConnectButton
            label={hasDrive ? "Reconnect Drive" : "Connect Drive"}
            scopes={driveScopes}
            service="drive"
          />
        }
        disconnectAction={
          <form action={disconnect.bind(null, "drive")}>
            <button className="text-sm text-red-600 hover:underline" type="submit">
              Disconnect
            </button>
          </form>
        }
      />

      <form action={save} className="rounded-xl border p-4 space-y-3 bg-white">
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
        <button className="rounded bg-black text-white px-3 py-2 text-sm" type="submit">
          Save
        </button>
      </form>

      <p className="text-xs text-gray-500">
        Disconnecting revokes Google access for this app and unlinks your account. You can also
        manage app access in your{" "}
        <a
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Google Account
        </a>.
      </p>
    </div>
  );
}

function Section({
  title,
  connected,
  help,
  connect,
  disconnectAction,
}: {
  title: string;
  connected: boolean;
  help: string;
  connect: React.ReactNode;
  disconnectAction: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4 bg-white flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{help}</div>
      </div>
      <div className="flex items-center gap-3">
        {connected ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            Not connected
          </span>
        )}
        {connected ? disconnectAction : connect}
      </div>
    </div>
  );
}
