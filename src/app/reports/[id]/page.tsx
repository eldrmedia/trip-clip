import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ReportDetail({ params }: { params: { id: string } }) {
  const s = await getServerSession(); if (!s?.user) redirect("/login");

  const report = await prisma.report.findFirst({
    where: { id: params.id, userId: (s.user as any).id },
    include: {
      expenses: { orderBy: { date: "asc" } },
      approver: true,
    },
  });
  if (!report) notFound();

  const total = report.expenses.reduce((acc, e) => acc + Number(e.amountHome), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          <div className="text-gray-600 text-sm">
                      <Link href={`/api/reports/${report.id}/csv`} className="rounded border px-4 py-2">Export CSV</Link>

            {new Date(report.periodStart).toLocaleDateString()} → {new Date(report.periodEnd).toLocaleDateString()}
          </div>
          <div className="text-sm mt-1">
            Status: <span className="font-medium">{report.status}</span>
            {report.approver ? <> • Approver: {report.approver.name ?? report.approver.email}</> : null}
          </div>
        </div>
        {/* Hook up to export flow later if you want per-report CSVs */}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-3 px-4 py-2 text-xs font-medium border-b">
          <div className="col-span-2">Merchant</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
          <div>Currency</div>
          <div>Trip</div>
          <div>Notes</div>
        </div>
        {report.expenses.length === 0 ? (
          <div className="px-4 py-6 text-gray-600 text-sm">No expenses in this report.</div>
        ) : report.expenses.map(e => (
          <div key={e.id} className="grid grid-cols-8 gap-3 px-4 py-2 border-b last:border-0 text-sm">
            <div className="col-span-2">{e.merchant ?? "—"}</div>
            <div>{e.type}</div>
            <div>{new Date(e.date).toLocaleDateString()}</div>
            <div className="text-right">${e.amountHome.toString()}</div>
            <div>{e.currencyHome}</div>
            <div>{e.tripId ? "Linked" : "—"}</div>
            <div className="truncate">{e.notes ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="text-right text-sm">
        <span className="font-medium">Report total:</span> ${total.toFixed(2)} {report.expenses[0]?.currencyHome ?? "USD"}
      </div>
    </div>
  );
}
