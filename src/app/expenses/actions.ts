// src/app/expenses/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";
// OPTIONAL: if you implemented FX, import it. Otherwise we'll noop.
// import { convertToHome } from "@/lib/fx";

const ExpenseSchema = z.object({
  type: z.enum(["FLIGHT","HOTEL","MEAL","RIDESHARE","RENTAL","MILEAGE","OTHER"]),
  date: z.string().min(1),
  merchant: z.string().optional(),
  amountOriginal: z.coerce.number().finite().nonnegative(),
  currencyOriginal: z.string().min(3),
  paymentMethod: z.enum(["CORP_CARD","PERSONAL","CASH"]).optional(),
  tripId: z.string().optional(),
  notes: z.string().optional(),
});

async function resolveUserId() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");
  let uid = (s.user as any).id as string | undefined;
  if (!uid && s.user.email) {
    const found = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    uid = found?.id;
  }
  if (!uid) throw new Error("Could not resolve current user id");
  return uid;
}

export async function createExpense(formData: FormData) {
  // Keep errors visible in server log (helps when UI shows the generic error)
  try {
    const userId = await resolveUserId();

    const parsed = ExpenseSchema.parse({
      type: formData.get("type"),
      date: formData.get("date"),
      merchant: formData.get("merchant") || undefined,
      amountOriginal: formData.get("amountOriginal"),
      currencyOriginal: (formData.get("currencyOriginal") || "USD").toString().toUpperCase(),
      paymentMethod: formData.get("paymentMethod") || undefined,
      tripId: formData.get("tripId") || undefined,
      notes: formData.get("notes") || undefined,
    });

    const date = new Date(parsed.date);
    if (Number.isNaN(+date)) throw new Error("Invalid date");

    // Home currency: use user's default if present
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultCurrency: true },
    });
    const currencyHome = (user?.defaultCurrency || "USD").toUpperCase();

    // Convert amount (noop if you don't have FX hooked yet)
    const amountOriginal = parsed.amountOriginal;
    const amountHome = amountOriginal;
    // If you implemented fx.ts, uncomment this:
    // amountHome = await convertToHome(amountOriginal, parsed.currencyOriginal, currencyHome, date);

    // Optional file upload
    // const file = formData.get("receipt") as File | null;
    // let receiptUrl: string | null = null;
    // if (file && file.size > 0) {
    //   // TODO: upload to Drive or Blob storage, set receiptUrl
    // }

    await prisma.expense.create({
      data: {
        user: { connect: { id: userId } },
        type: parsed.type,
        date,
        merchant: parsed.merchant || null,
        amountOriginal,
        currencyOriginal: parsed.currencyOriginal,
        amountHome,
        currencyHome,
        paymentMethod: (parsed.paymentMethod as any) || null,
        trip: parsed.tripId ? { connect: { id: parsed.tripId } } : undefined,
        notes: parsed.notes || null,
        receiptUrl,
      },
    });

    // Revalidate lists and redirect
    revalidatePath("/expenses");
    if (parsed.tripId) {
      redirect(`/trips/${parsed.tripId}`);
    } else {
      redirect("/expenses");
    }
  } catch (err) {
    console.error("createExpense failed:", err);
    throw err; // Let Next show the error overlay so you can see details in server logs
  }
}
