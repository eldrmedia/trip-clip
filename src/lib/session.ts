// src/lib/session.ts
import "server-only";

import { getServerSession } from "next-auth";
import { authConfig } from "./auth";

/** Require an authenticated session (redirect handled by caller). */
export async function getSessionStrict() {
  const s = await getServerSession(authConfig);
  return s; // may be null; caller decides to redirect
}

/** Resolve a reliable user id (JWT id first, then email lookup). */
export async function resolveUserIdOrThrow(prisma: any) {
  const s = await getServerSession(authConfig);
  if (!s?.user) throw new Error("Unauthorized");

  const maybeId = (s.user as { id?: string })?.id;
  if (maybeId) return maybeId;

  if (s.user.email) {
    const found = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    if (found?.id) return found.id;
  }
  throw new Error("Could not resolve current user id");
}
