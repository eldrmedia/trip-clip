// src/app/trips/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function TripsPage() {
  // Avoid `{}` inference so `.user` is typed
  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");
  const userId = (s.user as { id: string }).id;

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    select: { id: true, title: true, startDate: true, endDate: true, status: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trips</h1>
        {/* add a create page later if you want */}
        {/* <Link href="/trips/new" className="rounded bg-black px-4 py-2 text-sm text-white">New Trip</Link> */}
      </div>

      {trips.length === 0 ? (
        <p className="text-sm text-gray-600">No trips yet.</p>
      ) : (
        <ul className="grid gap-3">
          {trips.map((t) => (
            <li key={t.id} className="rounded-xl border bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    <Link href={`/trips/${t.id}`} className="underline">
                      {t.title}
                    </Link>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(t.startDate).toLocaleDateString()} →{" "}
                    {new Date(t.endDate).toLocaleDateString()} • {t.status}
                  </div>
                </div>
                <Link
                  href={`/trips/${t.id}`}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
