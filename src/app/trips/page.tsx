// src/app/trips/page.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function TripsPage() {
  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id: string }).id;

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Trips</h1>
        <Link href="/trips/new" className="rounded bg-black text-white px-4 py-2 text-sm">
          New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="text-gray-600">No trips yet.</p>
      ) : (
        <ul className="space-y-4">
          {trips.map((t) => (
            <li key={t.id}>
              <Link
                href={`/trips/${t.id}`}
                className="block rounded-xl border bg-white shadow hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <div className="p-4">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(t.startDate).toLocaleDateString()} → {new Date(t.endDate).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
