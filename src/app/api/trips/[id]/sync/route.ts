import { getServerSession, type Session } from "next-auth";
import { authConfig } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrUpdateTripArtifacts } from "@/lib/googleArtifacts";

type Params = { id: string };

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { id } = await ctx.params;

  // Cast so TS doesn't treat this as `{}` and complain about `.user`
  const s = (await getServerSession(authConfig)) as unknown as Session | null;
  if (!s?.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = (s.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  await createOrUpdateTripArtifacts(userId, trip.id);

  return NextResponse.json({ ok: true });
}
