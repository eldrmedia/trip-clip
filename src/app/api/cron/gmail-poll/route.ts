// src/app/api/cron/gmail-poll/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGoogleOAuthForUser } from "@/lib/google";
import { createOrUpdateTripArtifacts } from "@/lib/googleArtifacts";
import { logActivity } from "@/lib/log";
import type { gmail_v1 } from "googleapis";

// IMPORTANT: install a Node-safe File *before* we touch any code that might use it.
// (Static imports are evaluated before module body, so we will dynamically import
// parseItinerary later, after this runs.)
import { installNodeFilePolyfill } from "@/lib/nodeFilePolyfill";
installNodeFilePolyfill();

// ---- Minimal internal Gmail types (match what parseEmail expects) ----
type GmailHeader = { name?: string; value?: string };
type GmailBody = { data?: string; size?: number; attachmentId?: string };
type GmailPart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailBody;
  parts?: GmailPart[];
};
type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string | number;
  payload?: GmailPart;
};

// ---- Adapter: Google Schema$Message -> internal GmailMessage (nulls -> undefined) ----
function normalizePart(p?: gmail_v1.Schema$MessagePart | null): GmailPart | undefined {
  if (!p) return undefined;
  return {
    partId: p.partId ?? undefined,
    mimeType: p.mimeType ?? undefined,
    filename: p.filename ?? undefined,
    headers: p.headers?.map(h => ({ name: h.name ?? undefined, value: h.value ?? undefined })) ?? undefined,
    body: p.body
      ? {
          data: p.body.data ?? undefined,
          size: p.body.size ?? undefined,
          attachmentId: p.body.attachmentId ?? undefined,
        }
      : undefined,
    parts: p.parts?.map(pp => normalizePart(pp)!) ?? undefined,
  };
}

function normalizeMessage(m: gmail_v1.Schema$Message): GmailMessage {
  return {
    id: m.id ?? undefined,
    threadId: m.threadId ?? undefined,
    labelIds: m.labelIds ?? undefined,
    snippet: m.snippet ?? undefined,
    internalDate: m.internalDate ?? undefined,
    payload: normalizePart(m.payload),
  };
}

const SEARCH_QUERY =
  'newer_than:14d (from:("Capital One Travel" OR capitalone.com OR amadeus.com OR expedia.com OR united.com OR delta.com OR aa.com OR southwest.com) subject:(itinerary OR flight OR booking OR "trip confirmation"))';

export async function GET() {
  // ⬇️ Dynamically import parseEmail *after* the polyfill is installed.
  const { parseEmail } = await import("@/lib/parsers/parseItinerary");

  const users = await prisma.user.findMany({ where: { googleGmailConnected: true } });
  let processed = 0;

  for (const u of users) {
    try {
      const { gmail } = await getGoogleOAuthForUser(u.id);
      const list = await gmail.users.messages.list({ userId: "me", q: SEARCH_QUERY, maxResults: 20 });
      const msgs = list.data.messages ?? [];
      if (msgs.length === 0) continue;

      const seenIds = new Set(
        (
          await prisma.gmailMessage.findMany({
            where: { userId: u.id, gmailId: { in: msgs.map(m => m.id!).filter(Boolean) } },
            select: { gmailId: true },
          })
        ).map(e => e.gmailId)
      );

      for (const m of msgs) {
        if (!m.id || seenIds.has(m.id)) continue;

        const full = await gmail.users.messages.get({ userId: "me", id: m.id });
        const normalized = normalizeMessage(full.data);
        const parsed = await parseEmail(normalized);
        if (!parsed) continue;

        const start = parsed.legs[0]?.departure ?? new Date();
        const end = parsed.legs.at(-1)?.arrival ?? start;
        const title = `${parsed.legs[0]?.fromCity ?? "Trip"}→${parsed.legs.at(-1)?.toCity ?? ""} [${parsed.confirmation ?? ""}]`;

        // Find overlapping or confirmation-matching trip
        const existing = await prisma.trip.findFirst({
          where: {
            userId: u.id,
            OR: [
              { title: { contains: parsed.confirmation ?? "" } },
              {
                startDate: { lte: new Date(end.getTime() + 2 * 86400e3) },
                endDate: { gte: new Date(start.getTime() - 2 * 86400e3) },
              },
            ],
          },
        });

        const trip = existing
          ? await prisma.trip.update({
              where: { id: existing.id },
              data: { title, startDate: start, endDate: end, status: "PLANNED" },
            })
          : await prisma.trip.create({
              data: {
                userId: u.id,
                title,
                startDate: start,
                endDate: end,
                status: "PLANNED",
                purpose: "Auto from Gmail",
              },
            });

        await prisma.gmailMessage.create({
          data: {
            userId: u.id,
            gmailId: m.id,
            threadId: full.data.threadId ?? "",
            internalDate: BigInt(full.data.internalDate || 0),
            vendor: parsed.vendor,
            parsedHash: parsed.hash,
            tripId: trip.id,
          },
        });

        await createOrUpdateTripArtifacts(u.id, trip.id, parsed);
        await logActivity(u.id, {
          tripId: trip.id,
          action: "TRIP_CREATED",
          message: `Trip from ${parsed.vendor ?? "email"}`,
        });

        processed++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await logActivity(u.id, { level: "error", action: "GMAIL_POLL_FAIL", message: msg });
    }
  }

  return NextResponse.json({ ok: true, processed });
}
