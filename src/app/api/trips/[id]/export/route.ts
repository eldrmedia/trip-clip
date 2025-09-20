import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/db";
import { getGoogleOAuthForUser } from "@/lib/google";

function toCSV(rows: Array<Record<string, any>>) {
  if (rows.length === 0) return "message,no rows";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession();
  if (!s?.user) return new Response("Unauthorized", { status: 401 });

  const trip = await prisma.trip.findFirst({
    where: { id: params.id, userId: (s.user as any).id },
    include: { expenses: true, user: true },
  });
  if (!trip) return new Response("Not found", { status: 404 });

  const rows = trip.expenses.map(e => ({
    trip_title: trip.title,
    date: new Date(e.date).toISOString().slice(0,10),
    type: e.type,
    merchant: e.merchant ?? "",
    amount: e.amountHome.toString(),
    currency: e.currencyHome,
    payment: e.paymentMethod ?? "",
    notes: e.notes ?? "",
    city: e.locationCity ?? "",
    state: e.locationState ?? "",
    country: e.locationCountry ?? "",
  }));

  const csv = toCSV(rows);
  const filename = `${trip.title.replace(/[^a-z0-9]+/gi,"_")}_${new Date().toISOString().slice(0,10)}.csv`;

  // Optional ?drive=1 to upload to Drive and return JSON with file id/link
  const url = new URL(req.url);
  if (url.searchParams.get("drive") === "1") {
    try {
      const { drive } = await getGoogleOAuthForUser((s.user as any).id);
      const fileMeta = {
        name: filename,
        mimeType: "text/csv",
        parents: trip.driveFolderId ? [trip.driveFolderId] : undefined,
      } as any;
      const media = {
        mimeType: "text/csv",
        body: Buffer.from(csv),
      } as any;
      // @ts-ignore body can be a Buffer in node
      const created = await drive.files.create({
        requestBody: fileMeta,
        media,
        fields: "id, webViewLink, name",
      });
      const id = created.data.id!;
      await prisma.activityLog.create({
        data: {
          userId: trip.userId,
          tripId: trip.id,
          level: "info",
          action: "trip_csv_export_drive",
          message: `Uploaded ${filename} to Drive`,
          meta: { fileId: id, name: created.data.name, link: created.data.webViewLink },
        },
      });
      return new Response(JSON.stringify({ ok: true, fileId: id, link: created.data.webViewLink }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e?.message || "drive upload failed" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // Default: download CSV to the browser
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
