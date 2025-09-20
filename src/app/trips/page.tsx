// src/app/trips/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import React from 'react';
import Link from 'next/link';

export default async function TripsPage() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const trips = await prisma.trip.findMany({
    where: { userId: (s.user as any).id },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">My Trips</h1>
        <Link href="/trips/new/" className="rounded bg-black text-white px-4 py-2 text-sm">New Trip</Link>

      {trips.length === 0 ? (
        <p className="text-gray-600">No trips yet.</p>
      ) : (
        <ul className="space-y-4">
          {trips.map((t) => (
            <li key={t.id} className="p-4 rounded bg-white shadow">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-gray-600">
                {t.startDate?.toLocaleDateString()} →{" "}
                {t.endDate?.toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
