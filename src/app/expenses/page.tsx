// src/app/expenses/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Prisma, ExpenseType } from "@prisma/client";
import ExpensesToaster from "./toaster";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  // Server-side session (assert to avoid `{}` inference)
  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");

  const params = await searchParams;
  const userId = (s.user as { id: string }).id;

  // Strongly type the Prisma where input
  const where: Prisma.ExpenseWhereInput = { userId };

  if (params.type && params.type !== "ALL") {
    where.type = params.type as ExpenseType;
  }
  if (params.q) {
    where.OR = [
      { merchant: { contains: params.q, mode: "insensitive" } },
      { notes: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
    include: { trip: true, report: true },
  });

  const types: Array<"ALL" | ExpenseType> = [
    "ALL",
    "FLIGHT",
    "HOTEL",
    "MEAL",
    "RIDESHARE",
    "RENTAL",
    "MILEAGE",
    "OTHER",
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Client-only toast listener */}
      <ExpensesToaster />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className="rounded bg-black px-4 py-2 text-sm text-white">
          Add expense
        </Link>
      </div>

      <form className="flex gap-3">
        <select
          name="type"
          defaultValue={params.type ?? "ALL"}
          className="rounded border bg-white px-3 py-2 text-sm"
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          name="q"
          placeholder="Search merchant/notes…"
          defaultValue={params.q ?? ""}
          className="flex-1 rounded border bg-white px-3 py-2 text-sm"
        />
        <button className="rounded border bg-white px-3 py-2 text-sm">Filter</button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="grid grid-cols-8 gap-3 border-b px-4 py-2 text-xs font-medium">
          <div className="col-span-2">Merchant</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
          <div>Currency</div>
          <div>Trip</div>
          <div>Report</div>
        </div>
        {expenses.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No expenses found.</div>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="grid grid-cols-8 gap-3 border-b px-4 py-2 text-sm last:border-0">
              <div className="col-span-2">{e.merchant ?? "—"}</div>
              <div>{e.type}</div>
              <div>{new Date(e.date).toLocaleDateString()}</div>
              <div className="text-right">${e.amountHome.toString()}</div>
              <div>{e.currencyHome}</div>
              <div>{e.trip?.title ?? "—"}</div>
              <div className="flex items-center gap-2">
                {e.report ? e.report.status : "—"}
                <Link href={`/expenses/${e.id}/edit`} className="text-xs underline">
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
