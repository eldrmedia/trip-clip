// src/lib/log.ts
import { prisma } from "./db";

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
    meta?: any;
    tripId?: string;
    reportId?: string;
  }
) {
  try {
    await prisma.activityLog.create({
      data: { userId, level, action, message, meta, tripId, reportId },
    });
  } catch (err) {
    // Make sure this never crashes the caller
     
    console.error("logActivity failed:", err);
  }
}
