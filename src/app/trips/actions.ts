// src/app/trips/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TripSchema = z.object({
  title: z.string().min(2, "Title is required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationCountry: z.string().optional(),
  notes: z.string().optional(),
});

export async function createTrip(formData: FormData) {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  // 1) Resolve a reliable user id (JWT uid first, then email lookup)
  let uid = (s.user as any).id as string | undefined;
  if (!uid && s.user.email) {
    const found = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    uid = found?.id;
  }
  if (!uid) throw new Error("Could not resolve current user id");

  // 2) Parse + validate inputs
  const parsed = TripSchema.safeParse({
    title: String(formData.get("title") || ""),
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    locationCity: String(formData.get("locationCity") || ""),
    locationState: String(formData.get("locationState") || ""),
    locationCountry: String(formData.get("locationCountry") || ""),
    notes: String(formData.get("notes") || ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (Number.isNaN(+start) || Number.isNaN(+end)) throw new Error("Invalid dates");
  if (start > end) throw new Error("Start date must be on/before end date");

  // 3) Create the trip, explicitly connecting the user relation
    const trip = await prisma.trip.create({
    data: {
        title: parsed.data.title,
        startDate: start,
        endDate: end,
        status: "PLANNED",
        region: `${parsed.data.locationCity || ""} ${parsed.data.locationState || ""} ${parsed.data.locationCountry || ""}`.trim() || null,
        purpose: parsed.data.notes || null,
        user: { connect: { id: uid } },
    },
    select: { id: true },
    });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}
