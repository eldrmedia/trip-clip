import { createExpense } from "../actions";
export default function QuickAdd(){
  return (
    <form action={createExpense} encType="multipart/form-data" className="space-y-3 max-w-md bg-white rounded-xl p-4 shadow">
      <h1 className="text-lg font-semibold">Quick Add</h1>
      <input type="file" name="receipt" accept="image/*" capture="environment" className="block w-full"/>
      <select name="type" className="block w-full border rounded px-2 py-2">
        <option>MEAL</option><option>RIDESHARE</option><option>HOTEL</option><option>OTHER</option>
      </select>
      <input name="date" type="date" className="block w-full border rounded px-2 py-2" />
      <input name="amountOriginal" type="number" step="0.01" placeholder="Amount" className="block w-full border rounded px-2 py-2" />
      <button className="rounded bg-black text-white px-3 py-2">Save</button>
    </form>
  );
}
