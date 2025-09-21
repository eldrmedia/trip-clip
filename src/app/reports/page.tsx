// src/app/reports/page.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ReportsPage() {
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id: string }).id;

  const reports = await prisma.report.findMany({
    where: { userId }, // ✅ fix: was ownerId
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Reports</h1>
        {/* optional: add a create flow later */}
        {/* <Link href="/reports/new" className="rounded bg-black text-white px-4 py-2 text-sm">New Report</Link> */}
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-600">No reports yet.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="p-4 rounded bg-white shadow">
              <div className="font-medium">
                <Link href={`/reports/${r.id}`} className="underline">
                  {r.title || `Report ${r.id.slice(0,8)}`}
                </Link>
              </div>
              <div className="text-sm text-gray-600">Status: {r.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
