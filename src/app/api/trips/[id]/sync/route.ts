// src/app/api/trips/[id]/sync/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrUpdateTripArtifacts } from "@/lib/googleArtifacts";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const s = await getServerSession();
  if (!s?.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const userId = (s.user as { id: string }).id;
  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId } });
  if (!trip) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  await createOrUpdateTripArtifacts(userId, trip.id);
  return NextResponse.json({ ok: true });
}
