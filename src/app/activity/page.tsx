import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  const s = await getServerSession(); if (!s?.user) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { userId: (s.user as { id: string }).id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Activity</h1>
      <div className="bg-white rounded-xl shadow divide-y">
        {logs.length === 0 ? (
          <div className="px-4 py-6 text-gray-600 text-sm">No activity yet.</div>
        ) : logs.map(l => (
          <div key={l.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className={`mr-2 px-2 py-0.5 rounded text-xs ${
                  l.level === "error" ? "bg-red-100 text-red-700" :
                  l.level === "warn" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>{l.level}</span>
                <span className="font-medium">{l.action}</span>
              </div>
              <div className="text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
            {l.message ? <div className="text-gray-700 mt-1">{l.message}</div> : null}
            {l.meta ? <pre className="mt-2 bg-gray-50 border rounded p-2 overflow-auto">{JSON.stringify(l.meta, null, 2)}</pre> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
