// src/app/expenses/page.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
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
  // ✅ Server-side session fetch (safe in RSC)
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");

  const params = await searchParams;
  const userId = (s.user as { id: string }).id;

  // Strongly type the Prisma where input
  const where: Prisma.ExpenseWhereInput = { userId };

  if (params.type && params.type !== "ALL") {
    // cast to the generated Prisma enum
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Client-only toast listener */}
      <ExpensesToaster />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className="rounded bg-black text-white px-4 py-2 text-sm">
          Add expense
        </Link>
      </div>

      <form className="flex gap-3">
        <select
          name="type"
          defaultValue={params.type ?? "ALL"}
          className="rounded border px-3 py-2 text-sm"
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          name="q"
          placeholder="Search merchant/notes…"
          defaultValue={params.q ?? ""}
          className="rounded border px-3 py-2 text-sm flex-1"
        />
        <button className="rounded border px-3 py-2 text-sm">Filter</button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-3 px-4 py-2 text-xs font-medium border-b">
          <div className="col-span-2">Merchant</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
          <div>Currency</div>
          <div>Trip</div>
          <div>Report</div>
        </div>
        {expenses.length === 0 ? (
          <div className="px-4 py-6 text-gray-600 text-sm">No expenses found.</div>
        ) : (
          expenses.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-8 gap-3 px-4 py-2 border-b last:border-0 text-sm"
            >
              <div className="col-span-2">{e.merchant ?? "—"}</div>
              <div>{e.type}</div>
              <div>{new Date(e.date).toLocaleDateString()}</div>
              <div className="text-right">${e.amountHome.toString()}</div>
              <div>{e.currencyHome}</div>
              <div>{e.trip?.title ?? "—"}</div>
              <div className="flex items-center gap-2">
                {e.report ? e.report.status : "—"}
                <Link href={`/expenses/${e.id}/edit`} className="underline text-xs">
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
