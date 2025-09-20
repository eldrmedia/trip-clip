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

  // Resolve a reliable user id (JWT uid first, then email lookup)
  const su = s.user as { id?: string; email?: string | null };
  let uid = su.id;

  if (!uid && su.email) {
    const found = await prisma.user.findUnique({
      where: { email: su.email },
      select: { id: true },
    });
    uid = found?.id ?? undefined;
  }
  if (!uid) throw new Error("Could not resolve current user id");

  // Helper to coerce empty strings to undefined for optionals
  const opt = (v: FormDataEntryValue | null) => {
    const s = (v as string | null) ?? null;
    return s && s.trim().length > 0 ? s : undefined;
  };

  // Parse + validate inputs
  const parsed = TripSchema.safeParse({
    title: (formData.get("title") as string) ?? "",
    startDate: (formData.get("startDate") as string) ?? "",
    endDate: (formData.get("endDate") as string) ?? "",
    locationCity: opt(formData.get("locationCity")),
    locationState: opt(formData.get("locationState")),
    locationCountry: opt(formData.get("locationCountry")),
    notes: opt(formData.get("notes")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (Number.isNaN(+start) || Number.isNaN(+end)) throw new Error("Invalid dates");
  if (start > end) throw new Error("Start date must be on/before end date");

  // Create the trip, explicitly connecting the user relation
  const trip = await prisma.trip.create({
    data: {
      title: parsed.data.title,
      startDate: start,
      endDate: end,
      status: "PLANNED",
      // If you later add first-class location fields to Prisma, map them directly.
      region: `${parsed.data.locationCity ?? ""} ${parsed.data.locationState ?? ""} ${parsed.data.locationCountry ?? ""}`
        .trim() || null,
      purpose: parsed.data.notes ?? null,
      user: { connect: { id: uid } },
    },
    select: { id: true },
  });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}
