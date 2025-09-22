// src/app/reports/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function ReportsPage() {
  // Avoid `{}` inference
  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id: string }).id;

  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Reports</h1>
        {/* <Link href="/reports/new" className="rounded bg-black px-4 py-2 text-sm text-white">New Report</Link> */}
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-600">No reports yet.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded bg-white p-4 shadow">
              <div className="font-medium">
                <Link href={`/reports/${r.id}`} className="underline">
                  {r.title || `Report ${r.id.slice(0, 8)}`}
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
