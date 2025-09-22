// src/lib/googleArtifacts.ts
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/log";
import type { ParsedItin } from "@/lib/parsers/parseItinerary";
import { getGoogleOAuthForUser } from "@/lib/google";

/** Minimal shapes for the Google clients we actually use (no heavy deps). */
type DriveFilesCreateArgs = {
  requestBody: { name: string; mimeType: string };
  fields?: string;
};
type DriveFilesCreateResp = { data?: { id?: string; name?: string; webViewLink?: string } };
interface DriveFiles {
  create(args: DriveFilesCreateArgs): Promise<DriveFilesCreateResp>;
}
interface DriveClient {
  files: DriveFiles;
}

type CalendarEventsInsertArgs = {
  calendarId: string;
  requestBody: {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
  };
};
type CalendarEventsInsertResp = { data?: { id?: string } };
interface CalendarEvents {
  insert(args: CalendarEventsInsertArgs): Promise<CalendarEventsInsertResp>;
}
interface CalendarClient {
  events: CalendarEvents;
}

type GoogleClients = { drive?: DriveClient; calendar?: CalendarClient };

/** Lightweight runtime check so we can safely narrow unknown → GoogleClients. */
function isGoogleClients(v: unknown): v is GoogleClients {
  if (typeof v !== "object" || v === null) return false;
  const maybe = v as Record<string, unknown>;
  const driveOk =
    maybe.drive === undefined ||
    (typeof maybe.drive === "object" &&
      maybe.drive !== null &&
      "files" in (maybe.drive as Record<string, unknown>) &&
      typeof (maybe.drive as { files?: unknown }).files === "object");

  const calOk =
    maybe.calendar === undefined ||
    (typeof maybe.calendar === "object" &&
      maybe.calendar !== null &&
      "events" in (maybe.calendar as Record<string, unknown>) &&
      typeof (maybe.calendar as { events?: unknown }).events === "object");

  return driveOk && calOk;
}

export async function createOrUpdateTripArtifacts(
  userId: string,
  tripId: string,
  parsed?: ParsedItin
): Promise<void> {
  const [user, trip] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        googleDriveConnected: true,
        googleCalendarConnected: true,
        bufferMinutes: true,
        usePrimaryCalendar: true,
      },
    }),
    prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, title: true, startDate: true, endDate: true, driveFolderId: true },
    }),
  ]);
  if (!user || !trip) return;

  // Try to get Google clients (may throw if not configured)
  let drive: DriveClient | undefined;
  let calendar: CalendarClient | undefined;
  try {
    const clientsUnknown = await getGoogleOAuthForUser(userId) as unknown;
    if (isGoogleClients(clientsUnknown)) {
      drive = clientsUnknown.drive;
      calendar = clientsUnknown.calendar;
    }
  } catch {
    // continue with whatever is available
  }

  // 1) Drive folder
  if (user.googleDriveConnected && drive && !trip.driveFolderId) {
    try {
      const folderName = `${trip.title} (${toDateStr(trip.startDate)} → ${toDateStr(trip.endDate)})`;
      const created = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id, name, webViewLink",
      });
      const id = created?.data?.id;
      if (id) {
        await prisma.trip.update({ where: { id: trip.id }, data: { driveFolderId: id } });
        await logActivity(userId, {
          tripId: trip.id,
          level: "info",
          action: "drive_folder_created",
          message: `Created Drive folder ${created?.data?.name ?? id}`,
          meta: { id, link: created?.data?.webViewLink },
        });
      }
    } catch (err) {
      await logActivity(userId, {
        tripId: trip.id,
        level: "warn",
        action: "drive_folder_create_failed",
        message: err instanceof Error ? err.message : "Drive folder create failed",
      });
    }
  }

  // 2) Calendar: single window event (trip start/end +/- buffer)
  if (user.googleCalendarConnected && calendar) {
    try {
      const buffer = typeof user.bufferMinutes === "number" ? user.bufferMinutes : 90;
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const startWithBuffer = new Date(start.getTime() - buffer * 60 * 1000);
      const endWithBuffer = new Date(end.getTime() + buffer * 60 * 1000);

      // Create a new event every time (simple). If you later add a column to store an eventId,
      // switch to upsert semantics.
      const res = await calendar.events.insert({
        calendarId: user.usePrimaryCalendar ? "primary" : "primary",
        requestBody: {
          summary: `Trip: ${trip.title}`,
          description: parsed?.confirmation ? `Confirmation: ${parsed.confirmation}` : undefined,
          start: { dateTime: startWithBuffer.toISOString() },
          end: { dateTime: endWithBuffer.toISOString() },
        },
      });

      await logActivity(userId, {
        tripId: trip.id,
        level: "info",
        action: "calendar_event_created",
        message: `Created calendar event for ${trip.title}`,
        meta: { eventId: res?.data?.id },
      });
    } catch (err) {
      await logActivity(userId, {
        tripId: trip.id,
        level: "warn",
        action: "calendar_event_failed",
        message: err instanceof Error ? err.message : "Calendar event create failed",
      });
    }
  }

  // 3) Optional: refine title from parsed
  if (parsed?.confirmation || parsed?.vendor) {
    try {
      const nextTitle = buildTitle(trip.title, parsed);
      if (nextTitle && nextTitle !== trip.title) {
        await prisma.trip.update({ where: { id: trip.id }, data: { title: nextTitle } });
        await logActivity(userId, {
          tripId: trip.id,
          level: "info",
          action: "trip_title_updated",
          message: `Updated title to ${nextTitle}`,
        });
      }
    } catch {
      // ignore
    }
  }
}

function toDateStr(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(+dt) ? "" : dt.toISOString().slice(0, 10);
}

function buildTitle(current: string, parsed?: ParsedItin): string | null {
  if (!parsed) return null;
  const from = parsed.legs?.[0]?.fromCity;
  const to = parsed.legs?.[parsed.legs.length - 1]?.toCity;
  const conf = parsed.confirmation;
  const parts = [from && to ? `${from} → ${to}` : undefined, conf ? `[${conf}]` : undefined].filter(
    Boolean
  ) as string[];
  if (parts.length === 0) return null;
  return parts.join(" ");
}
