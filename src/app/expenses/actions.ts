// src/app/expenses/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Keep these enums in Zod so the form coercion is strict
const PaymentMethodEnum = z.enum(["CORP_CARD", "PERSONAL", "CASH"]);
const ExpenseTypeEnum = z.enum([
  "FLIGHT",
  "HOTEL",
  "MEAL",
  "RIDESHARE",
  "RENTAL",
  "MILEAGE",
  "OTHER",
]);

const ExpenseSchema = z.object({
  type: ExpenseTypeEnum,
  date: z.string().min(1), // ISO date string from <input type="date">
  merchant: z.string().optional(),
  amountOriginal: z.coerce.number().finite().nonnegative(),
  currencyOriginal: z.string().min(3),
  paymentMethod: PaymentMethodEnum.optional(),
  tripId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
type ExpenseInput = z.infer<typeof ExpenseSchema>;

async function requireUserId(): Promise<string> {
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");

  // Prefer explicit id if your auth populates it
  const uid = (s.user as { id?: string; email?: string | null }).id;
  if (uid) return uid;

  // Fallback by email if necessary
  if (s.user.email) {
    const found = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    if (found?.id) return found.id;
  }
  throw new Error("Could not resolve current user id");
}

function parseExpenseForm(formData: FormData): ExpenseInput {
  // Let Zod do all the coercion/validation
  return ExpenseSchema.parse({
    type: formData.get("type"),
    date: formData.get("date"),
    merchant: formData.get("merchant") || undefined,
    amountOriginal: formData.get("amountOriginal"),
    currencyOriginal: (formData.get("currencyOriginal") || "USD")
      .toString()
      .toUpperCase(),
    paymentMethod: formData.get("paymentMethod") || undefined,
    tripId: formData.get("tripId") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createExpense(formData: FormData) {
  const userId = await requireUserId();

  const parsed = parseExpenseForm(formData);

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
      amountHome: parsed.amountOriginal, // TODO: convert if you add FX
      currencyHome,
      // ✅ no `any` — Zod ensures union, Prisma accepts string or null
      paymentMethod: (parsed.paymentMethod as PaymentMethod | undefined) ?? null,
      tripId: parsed.tripId || null,
      notes: parsed.notes || null,
      receiptUrl: null,
    },
  });

  revalidatePath("/expenses");
  redirect("/expenses?success=created");
}

export async function updateExpense(id: string, formData: FormData) {
  const userId = await requireUserId();

  const parsed = parseExpenseForm(formData);

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
      // ✅ no `any`
      paymentMethod: (parsed.paymentMethod as PaymentMethod | undefined) ?? null,
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
