// src/app/reports/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ReportsPage() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const reports = await prisma.report.findMany({
    where: { ownerId: (s.user as any).id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">My Reports</h1>
      {reports.length === 0 ? (
        <p className="text-gray-600">No reports yet.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="p-4 rounded bg-white shadow">
              <div className="font-medium">Report {r.id}</div>
              <div className="text-sm text-gray-600">
                Status: {r.status}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
