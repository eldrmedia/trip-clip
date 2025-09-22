// src/app/reports/[id]/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ReportDetail({ params }: { params: { id: string } }) {
  // Avoid `{}` inference by asserting the type
  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id: string }).id;

  const report = await prisma.report.findFirst({
    where: { id: params.id, userId },
    include: {
      expenses: { orderBy: { date: "asc" } },
      approver: true,
    },
  });
  if (!report) notFound();

  const total = report.expenses.reduce((acc, e) => acc + Number(e.amountHome), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          <div className="text-sm text-gray-600">
            <Link href={`/api/reports/${report.id}/csv`} className="rounded border px-4 py-2">
              Export CSV
            </Link>{" "}
            {new Date(report.periodStart).toLocaleDateString()} →{" "}
            {new Date(report.periodEnd).toLocaleDateString()}
          </div>
          <div className="mt-1 text-sm">
            Status: <span className="font-medium">{report.status}</span>
            {report.approver ? <> • Approver: {report.approver.name ?? report.approver.email}</> : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="grid grid-cols-8 gap-3 border-b px-4 py-2 text-xs font-medium">
          <div className="col-span-2">Merchant</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
          <div>Currency</div>
          <div>Trip</div>
          <div>Notes</div>
        </div>
        {report.expenses.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No expenses in this report.</div>
        ) : (
          report.expenses.map((e) => (
            <div key={e.id} className="grid grid-cols-8 gap-3 border-b px-4 py-2 text-sm last:border-0">
              <div className="col-span-2">{e.merchant ?? "—"}</div>
              <div>{e.type}</div>
              <div>{new Date(e.date).toLocaleDateString()}</div>
              <div className="text-right">${e.amountHome.toString()}</div>
              <div>{e.currencyHome}</div>
              <div>{e.tripId ? "Linked" : "—"}</div>
              <div className="truncate">{e.notes ?? "—"}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-right text-sm">
        <span className="font-medium">Report total:</span> ${total.toFixed(2)}{" "}
        {report.expenses[0]?.currencyHome ?? "USD"}
      </div>
    </div>
  );
}
