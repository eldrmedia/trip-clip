// src/app/expenses/[id]/edit/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateExpense, deleteExpense } from "@/app/expenses/actions";

export const revalidate = 0;

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");
  const userId = (s.user as { id: string }).id;

  const [expense, trips] = await Promise.all([
    prisma.expense.findFirst({ where: { id, userId } }),
    prisma.trip.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { startDate: "desc" },
      take: 50,
    }),
  ]);
  if (!expense) notFound();

  // ✅ Capture a non-null id for use inside server actions
  const expenseId = expense.id;

  async function save(formData: FormData) {
    "use server";
    await updateExpense(expenseId, formData);
    redirect("/expenses?success=updated");
  }

  async function destroy() {
    "use server";
    await deleteExpense(expenseId);
    redirect("/expenses?success=deleted");
  }

  const types = ["FLIGHT","HOTEL","MEAL","RIDESHARE","RENTAL","MILEAGE","OTHER"] as const;
  const pay = ["CORP_CARD","PERSONAL","CASH"] as const;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-semibold">Edit expense</h1>

      <form action={save} className="space-y-4 rounded-xl border bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm">Type</div>
            <select name="type" defaultValue={expense.type} className="mt-1 w-full rounded border px-3 py-2">
              {types.map((t) => (<option key={t}>{t}</option>))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm">Date</div>
            <input
              type="date"
              name="date"
              defaultValue={new Date(expense.date).toISOString().slice(0, 10)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>

          <label className="col-span-2 block">
            <div className="text-sm">Merchant</div>
            <input name="merchant" defaultValue={expense.merchant ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>

          <label className="block">
            <div className="text-sm">Amount (original)</div>
            <input
              type="number"
              step="0.01"
              name="amountOriginal"
              defaultValue={expense.amountOriginal.toString()}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="text-sm">Currency (original)</div>
            <input name="currencyOriginal" defaultValue={expense.currencyOriginal} className="mt-1 w-full rounded border px-3 py-2" />
          </label>

          <label className="block">
            <div className="text-sm">Payment method</div>
            <select name="paymentMethod" defaultValue={expense.paymentMethod ?? ""} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">—</option>
              {pay.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm">Trip</div>
            <select name="tripId" defaultValue={expense.tripId ?? ""} className="mt-1 w-full rounded border px-3 py-2">
              <option value="">—</option>
              {trips.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
            </select>
          </label>

          <label className="col-span-2 block">
            <div className="text-sm">Notes</div>
            <textarea name="notes" defaultValue={expense.notes ?? ""} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700" type="submit">
            Save changes
          </button>
          <button formAction={destroy} className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700" type="submit">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
