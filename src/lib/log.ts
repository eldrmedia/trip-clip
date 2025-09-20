// src/lib/log.ts
import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

export async function logActivity(
  userId: string,
  {
    level = "info",
    action,
    message = "",
    meta,
    tripId,
    reportId,
  }: {
    level?: "info" | "warn" | "error";
    action: string;
    message?: string;
    meta?: Prisma.InputJsonValue; // JSON-safe type for Prisma
    tripId?: string;
    reportId?: string;
  }
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        level,
        action,
        message,
        meta,
        tripId,
        reportId,
      },
    });
  } catch (err: unknown) {
    // Make sure this never crashes the caller
     
    console.error("logActivity failed:", err);
  }
}
