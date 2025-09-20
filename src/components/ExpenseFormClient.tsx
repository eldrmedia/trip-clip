"use client";

import ReceiptUploader from "@/components/ReceiptUploader";
import { createExpense } from "@/app/expenses/actions";

type TripLite = { id: string; title: string };

export default function ExpenseFormClient({ trips }: { trips: TripLite[] }) {
  return (
    // ✅ Client component can reference a Server Action in `action=`
    <form action={createExpense} className="bg-white rounded-xl shadow p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm">Type</span>
          <select name="type" required className="mt-1 w-full rounded border px-3 py-2">
            <option>FLIGHT</option><option>HOTEL</option><option>MEAL</option>
            <option>RIDESHARE</option><option>RENTAL</option><option>MILEAGE</option><option>OTHER</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Date</span>
          <input name="date" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm">Merchant</span>
          <input name="merchant" className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm">Amount</span>
          <input name="amountOriginal" type="number" step="0.01" required className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm">Currency</span>
          <input name="currencyOriginal" defaultValue="USD" className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <span className="text-sm">Payment</span>
          <select name="paymentMethod" className="mt-1 w-full rounded border px-3 py-2">
            <option value="">—</option>
            <option>CORP_CARD</option><option>PERSONAL</option><option>CASH</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Trip</span>
          <select name="tripId" className="mt-1 w-full rounded border px-3 py-2">
            <option value="">—</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm">Notes</span>
        <textarea name="notes" rows={3} className="mt-1 w-full rounded border px-3 py-2" />
      </label>

      {/* Hidden field to carry the uploaded URL */}
      <input type="hidden" name="receiptUrl" id="receiptUrl" />

      <label className="block">
        <span className="text-sm">Receipt</span>
        {/* ✅ Now the function lives entirely in a Client Component */}
        <ReceiptUploader
          onUploaded={(url) => {
            const el = document.getElementById("receiptUrl") as HTMLInputElement | null;
            if (el) el.value = url;
          }}
        />
        <div className="text-xs text-gray-600 mt-1">
          Uploads to storage, then saves the URL with the expense.
        </div>
      </label>

      <button className="rounded bg-black text-white px-4 py-2">Save</button>
    </form>
  );
}
