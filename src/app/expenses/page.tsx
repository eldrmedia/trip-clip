// src/app/expenses/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const params = await searchParams; // ✅ await in Next 15
  const where: any = { userId: (s.user as any).id };

  if (params.type && params.type !== "ALL") where.type = params.type;
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

  const types = ["ALL","FLIGHT","HOTEL","MEAL","RIDESHARE","RENTAL","MILEAGE","OTHER"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Link href="/expenses/new" className="rounded bg-black text-white px-4 py-2 text-sm">
          Add expense
        </Link>
      </div>

      <form className="flex gap-3">
        <select
          name="type"
          defaultValue={params.type ?? "ALL"} // ✅ use awaited params
          className="rounded border px-3 py-2 text-sm"
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          name="q"
          placeholder="Search merchant/notes…"
          defaultValue={params.q ?? ""} // ✅ use awaited params
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
              <div>{e.report ? e.report.status : "—"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
