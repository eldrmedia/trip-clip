// src/app/expenses/new/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ExpenseFormClient from "@/components/ExpenseFormClient";

export default async function NewExpensePage() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  const userId = (s.user as { id: string }).id;

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    take: 20,
    select: { id: true, title: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Add expense</h1>
      <ExpenseFormClient trips={trips} />
    </div>
  );
}
