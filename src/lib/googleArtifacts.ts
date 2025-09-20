import { prisma } from "./db";
import { getGoogleOAuthForUser } from "./google";
import { logActivity } from "./log";
import type { ParsedItin } from "./parsers/parseItinerary";

export async function createOrUpdateTripArtifacts(userId: string, tripId: string, parsed: ParsedItin) {
  const user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) return;

  if (user.googleCalendarConnected) {
    const ids = await createOrUpdateCalendarEvents(user, parsed);
    await prisma.trip.update({ where: { id: tripId }, data: { calendarEventIds: ids } });
  }
  if (user.googleDriveConnected) {
    const folderId = await ensureTripDriveFolders(user, tripId);
    await prisma.trip.update({ where: { id: tripId }, data: { driveFolderId: folderId } });
  }
}

async function createOrUpdateCalendarEvents(user:any, parsed: ParsedItin){
  const { calendar } = await getGoogleOAuthForUser(user.id);
  const calendarId = user.usePrimaryCalendar ? "primary" : await ensureTravelCalendar(user, calendar);
  const buffer = user.bufferMinutes ?? 90;
  const ids:string[] = [];

  for (const leg of parsed.legs) {
    const dep = leg.departure; const arr = leg.arrival;
    // main
    const main = await calendar.events.insert({
      calendarId, requestBody: {
        summary: `${leg.fromCity ?? ""}→${leg.toCity ?? ""} (${parsed.confirmation ?? ""})`.trim(),
        description: `Auto-created by Expense App (${parsed.vendor ?? "travel"})`,
        start: { dateTime: dep.toISOString() }, end: { dateTime: arr.toISOString() }, transparency: "opaque",
      }
    }); ids.push(main.data.id!);

    // buffers (freebusy-checked)
    const preStart = new Date(dep.getTime() - buffer*60*1000);
    const postEnd  = new Date(arr.getTime() + buffer*60*1000);

    const fbPre = await calendar.freebusy.query({ requestBody: { timeMin: preStart.toISOString(), timeMax: dep.toISOString(), items: [{ id: calendarId }] } });
    const preConflict = (fbPre.data.calendars?.[calendarId]?.busy?.length ?? 0) > 0;
    const pre = await calendar.events.insert({
      calendarId, requestBody: { summary: "Travel buffer (to airport)" + (preConflict ? " — overlaps existing" : ""),
      start: { dateTime: preStart.toISOString() }, end: { dateTime: dep.toISOString() }, transparency: "opaque" }
    }); ids.push(pre.data.id!);

    const fbPost = await calendar.freebusy.query({ requestBody: { timeMin: arr.toISOString(), timeMax: postEnd.toISOString(), items: [{ id: calendarId }] } });
    const postConflict = (fbPost.data.calendars?.[calendarId]?.busy?.length ?? 0) > 0;
    const post = await calendar.events.insert({
      calendarId, requestBody: { summary: "Travel buffer (from airport)" + (postConflict ? " — overlaps existing" : ""),
      start: { dateTime: arr.toISOString() }, end: { dateTime: postEnd.toISOString() }, transparency: "opaque" }
    }); ids.push(post.data.id!);
  }
  await logActivity(user.id, { action: "CALENDAR_EVENTS_CREATED", message: `Created ${ids.length} events` });
  return ids;
}

async function ensureTravelCalendar(user:any, calendar:any){
  if (user.googleCalendarId) return user.googleCalendarId;
  const cal = await calendar.calendars.insert({ requestBody: { summary: "Travel (Expense App)" } });
  await prisma.user.update({ where: { id: user.id }, data: { googleCalendarId: cal.data.id! }});
  return cal.data.id!;
}

async function ensureTripDriveFolders(user:any, tripId:string){
  const { drive } = await getGoogleOAuthForUser(user.id);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return null;
  if (trip.driveFolderId) return trip.driveFolderId;

  const name = `${trip.startDate.toISOString().slice(0,10)} ${trip.title.replace(/[/\\]/g,"-")}`;
  const res = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder",
      parents: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID ? [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID] : undefined },
    fields: "id"
  });
  const root = res.data.id!;
  await drive.files.create({ requestBody: { name:"Receipts", mimeType:"application/vnd.google-apps.folder", parents:[root] } });
  await drive.files.create({ requestBody: { name:"Reports",  mimeType:"application/vnd.google-apps.folder", parents:[root] } });
  await logActivity(user.id, { tripId, action: "DRIVE_FOLDER_CREATED", message: `Drive folder ${name}` });
  return root;
}
