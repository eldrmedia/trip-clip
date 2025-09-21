// src/app/trips/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import React from "react";

export default async function TripDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = await getServerSession(authConfig);
  if (!s?.user) redirect("/login");
  const userId = (s.user as { id: string }).id;

  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: { expenses: { orderBy: { date: "asc" } } },
  });
  if (!trip) notFound();

  const total = trip.expenses.reduce((acc, e) => acc + Number(e.amountHome), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{trip.title}</h1>
          <div className="text-gray-600 text-sm">
            {new Date(trip.startDate).toLocaleDateString()} →{" "}
            {new Date(trip.endDate).toLocaleDateString()} • {trip.status}
          </div>
        </div>

        {/* CSV download hits an API route, so <a> is fine */}
        <a
          href={`/api/trips/${trip.id}/export`}
          className="rounded bg-black text-white px-4 py-2 text-sm"
        >
          Download CSV
        </a>

        {/* Example sync action to your API route */}
        <form action={`/api/trips/${trip.id}/sync`} method="post">
          <button className="rounded border px-4 py-2 text-sm">Sync Calendar & Drive</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-3 px-4 py-2 text-xs font-medium border-b">
          <div className="col-span-2">Merchant</div>
          <div>Type</div>
          <div>Date</div>
          <div className="text-right">Amount</div>
          <div>Currency</div>
          <div>Notes</div>
        </div>
        {trip.expenses.length === 0 ? (
          <div className="px-4 py-6 text-gray-600 text-sm">No expenses yet.</div>
        ) : (
          trip.expenses.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-7 gap-3 px-4 py-2 border-b last:border-0 text-sm"
            >
              <div className="col-span-2">{e.merchant ?? "—"}</div>
              <div>{e.type}</div>
              <div>{new Date(e.date).toLocaleDateString()}</div>
              <div className="text-right">${e.amountHome.toString()}</div>
              <div>{e.currencyHome}</div>
              <div className="truncate">{e.notes ?? "—"}</div>
            </div>
          ))
        )}
      </div>

      <div className="text-right text-sm">
        <span className="font-medium">Trip total:</span> ${total.toFixed(2)}{" "}
        {trip.expenses[0]?.currencyHome ?? "USD"}
      </div>
    </div>
  );
}
