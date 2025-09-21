import { createExpense } from "../actions";

export default function QuickAdd() {
  // Set a sensible default for date (today) on the server
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={createExpense}
      // Do NOT set method or encType when using a server action.
      className="space-y-4 max-w-md rounded-xl border border-black/10 bg-white p-4 shadow"
    >
      <h1 className="text-lg font-semibold">Quick Add</h1>

      {/* Receipt upload */}
      <div className="space-y-1">
        <label htmlFor="receipt" className="block text-sm font-medium text-neutral-700">
          Receipt (optional)
        </label>
        <input
          id="receipt"
          type="file"
          name="receipt"
          accept="image/*"
          capture="environment"
          className="block w-full rounded border border-black/10 bg-white px-2 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-white"
        />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <label htmlFor="type" className="block text-sm font-medium text-neutral-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          className="block w-full rounded border border-black/10 bg-white px-2 py-2 text-sm"
          defaultValue="MEAL"
          required
        >
          <option value="MEAL">MEAL</option>
          <option value="RIDESHARE">RIDESHARE</option>
          <option value="HOTEL">HOTEL</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label htmlFor="date" className="block text-sm font-medium text-neutral-700">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          defaultValue={today}
          className="block w-full rounded border border-black/10 bg-white px-2 py-2 text-sm"
          required
        />
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label htmlFor="amountOriginal" className="block text-sm font-medium text-neutral-700">
          Amount
        </label>
        <input
          id="amountOriginal"
          name="amountOriginal"
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          className="block w-full rounded border border-black/10 bg-white px-2 py-2 text-sm"
          required
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Save
        </button>
      </div>
    </form>
  );
}
