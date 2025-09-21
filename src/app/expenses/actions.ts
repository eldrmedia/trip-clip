// src/app/expenses/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";

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

async function requireUserId() {
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");
  const uid = (s.user as { id?: string; email?: string | null }).id;
  if (uid) return uid;

  // fallback by email if needed
  if (s.user.email) {
    const found = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    if (found?.id) return found.id;
  }
  throw new Error("Could not resolve current user id");
}

export async function createExpense(formData: FormData) {
  const userId = await requireUserId();

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

  // home currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultCurrency: true },
  });
  const currencyHome = (user?.defaultCurrency || "USD").toUpperCase();

  await prisma.expense.create({
    data: {
      userId,
      type: parsed.type,
      date,
      merchant: parsed.merchant || null,
      amountOriginal: parsed.amountOriginal,
      currencyOriginal: parsed.currencyOriginal,
      amountHome: parsed.amountOriginal, // (convert later if you add FX)
      currencyHome,
      paymentMethod: (parsed.paymentMethod as any) || null,
      tripId: parsed.tripId || null,
      notes: parsed.notes || null,
      receiptUrl: null,
    },
  });

  revalidatePath("/expenses");
  // If you want to send them to the trip, do that — but for toast, send them back to /expenses with the flag:
  redirect("/expenses?success=created");
}

export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUserId();

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

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Expense not found or not yours");

  await prisma.expense.update({
    where: { id },
    data: {
      type: parsed.type,
      date,
      merchant: parsed.merchant || null,
      amountOriginal: parsed.amountOriginal,
      currencyOriginal: parsed.currencyOriginal,
      // keep amountHome/currencyHome simple for now
      amountHome: parsed.amountOriginal,
      currencyHome: existing.currencyHome,
      paymentMethod: (parsed.paymentMethod as any) || null,
      tripId: parsed.tripId || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/expenses");
  redirect("/expenses?success=updated");
}

export async function deleteExpense(id: string) {
  const userId = await requireUserId();

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Expense not found or not yours");

  await prisma.expense.delete({ where: { id } });

  revalidatePath("/expenses");
  redirect("/expenses?success=deleted");
}
