// src/lib/session.ts
import "server-only";

import { getServerSession, type Session } from "next-auth";
import { authConfig } from "./auth";
import type { PrismaClient } from "@prisma/client";

/** Require an authenticated session (redirect handled by caller). */
export async function getSessionStrict(): Promise<Session | null> {
  const s = await getServerSession(authConfig);
  return s; // may be null; caller decides to redirect
}

/** Resolve a reliable user id (JWT id first, then email lookup). */
export async function resolveUserIdOrThrow(prisma: PrismaClient): Promise<string> {
  const s = await getServerSession(authConfig);
  if (!s?.user) throw new Error("Unauthorized");

  const maybeId = (s.user as { id?: string })?.id;
  if (maybeId) return maybeId;

  const email = (s.user as { email?: string | null })?.email ?? null;
  if (email) {
    const found = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (found?.id) return found.id;
  }

  throw new Error("Could not resolve current user id");
}
