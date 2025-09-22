import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const [recent, trips] = await Promise.all([
    prisma.expense.findMany({ where: { userId: session.user.id }, orderBy: { date: "desc" }, take: 5 }),
    prisma.trip.findMany({ where: { userId: session.user.id }, orderBy: { startDate: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/expenses/new" className="rounded bg-black text-white px-4 py-2">Add Expense</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow border">
          <div className="px-4 py-3 font-medium border-b">Recent expenses</div>
          {recent.length===0 ? <div className="px-4 py-6 text-gray-500">No expenses yet.</div> :
            recent.map(e=>(
              <div key={e.id} className="px-4 py-3 flex items-center justify-between text-sm border-b last:border-0">
                <div>{e.type} • {e.merchant ?? "—"}</div>
                <div>${e.amountHome.toString()} {e.currencyHome}</div>
              </div>
            ))}
        </section>
        <section className="bg-white rounded-xl shadow border">
          <div className="px-4 py-3 font-medium border-b">Recent trips</div>
          {trips.length===0 ? <div className="px-4 py-6 text-gray-500">No trips yet.</div> :
            trips.map(t=>(
              <div key={t.id} className="px-4 py-3 flex items-center justify-between text-sm border-b last:border-0">
                <div>{t.title}</div>
                <Link className="underline" href={`/trips/${t.id}`}>Open</Link>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
