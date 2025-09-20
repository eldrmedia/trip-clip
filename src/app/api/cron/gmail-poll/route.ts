import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGoogleOAuthForUser } from "@/lib/google";
import { parseEmail } from "@/lib/parsers/parseItinerary";
import { createOrUpdateTripArtifacts } from "@/lib/googleArtifacts";
import { logActivity } from "@/lib/log";

const SEARCH_QUERY =
  'newer_than:14d (from:("Capital One Travel" OR capitalone.com OR amadeus.com OR expedia.com OR united.com OR delta.com OR aa.com OR southwest.com) subject:(itinerary OR flight OR booking OR "trip confirmation"))';

export async function GET() {
  const users = await prisma.user.findMany({ where: { googleGmailConnected: true } });
  let processed = 0;

  for (const u of users) {
    try {
      const { gmail } = await getGoogleOAuthForUser(u.id);
      const list = await gmail.users.messages.list({ userId: "me", q: SEARCH_QUERY, maxResults: 20 });
      const msgs = list.data.messages ?? [];
      if (msgs.length === 0) continue;

      const seen = new Set((await prisma.gmailMessage.findMany({
        where: { userId: u.id, gmailId: { in: msgs.map(m => m.id!) } }, select: { gmailId: true }
      })).map(e => e.gmailId));

      for (const m of msgs) {
        if (seen.has(m.id!)) continue;
        const full = await gmail.users.messages.get({ userId: "me", id: m.id! });
        const parsed = await parseEmail(full.data);
        if (!parsed) continue;

        const start = parsed.legs[0]?.departure ?? new Date();
        const end = parsed.legs.at(-1)?.arrival ?? start;
        const title = `${parsed.legs[0]?.fromCity ?? "Trip"}→${parsed.legs.at(-1)?.toCity ?? ""} [${parsed.confirmation ?? ""}]`;

        // find overlapping or confirmation-matching trip
        const existing = await prisma.trip.findFirst({
          where: {
            userId: u.id,
            OR: [
              { title: { contains: parsed.confirmation ?? "" } },
              { startDate: { lte: new Date(end.getTime() + 2*86400e3) }, endDate: { gte: new Date(start.getTime() - 2*86400e3) } }
            ]
          }
        });

        const trip = existing
          ? await prisma.trip.update({ where: { id: existing.id }, data: { title, startDate: start, endDate: end, status: "PLANNED" } })
          : await prisma.trip.create({ data: { userId: u.id, title, startDate: start, endDate: end, status: "PLANNED", purpose: "Auto from Gmail" } });

        await prisma.gmailMessage.create({
          data: {
            userId: u.id, gmailId: m.id!, threadId: full.data.threadId!, internalDate: BigInt(full.data.internalDate || 0),
            vendor: parsed.vendor, parsedHash: parsed.hash, tripId: trip.id
          }
        });

        await createOrUpdateTripArtifacts(u.id, trip.id, parsed);
        await logActivity(u.id, { tripId: trip.id, action: "TRIP_CREATED", message: `Trip from ${parsed.vendor ?? "email"}` });
        processed++;
      }
    } catch (e:any) {
      await logActivity(u.id, { level: "error", action: "GMAIL_POLL_FAIL", message: e?.message ?? String(e) });
    }
  }
  return NextResponse.json({ ok: true, processed });
}
