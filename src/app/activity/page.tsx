// src/app/activity/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  // No authConfig import — use default getServerSession()
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id?: string } | null)?.id;
  if (!userId) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Activity</h1>
      <div className="divide-y rounded-xl border bg-white shadow">
        {logs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No activity yet.</div>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={[
                      "mr-2 rounded px-2 py-0.5 text-xs",
                      l.level === "error"
                        ? "bg-red-100 text-red-700"
                        : l.level === "warn"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700",
                    ].join(" ")}
                  >
                    {l.level}
                  </span>
                  <span className="font-medium">{l.action}</span>
                </div>
                <div className="text-gray-500">
                  {new Date(l.createdAt).toLocaleString()}
                </div>
              </div>
              {l.message ? <div className="mt-1 text-gray-700">{l.message}</div> : null}
              {l.meta ? (
                <pre className="mt-2 overflow-auto rounded border bg-gray-50 p-2">
                  {JSON.stringify(l.meta, null, 2)}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
