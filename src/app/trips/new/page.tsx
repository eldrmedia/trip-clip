import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createTrip } from "../actions";

export default async function NewTripPage() {
  const s = await getServerSession();
  if (!s?.user) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">New Trip</h1>

      {/* When using a server action, do not set method/enctype manually */}
      <form action={createTrip} className="bg-white rounded-xl shadow p-6 space-y-4">
        <label className="block">
          <div className="text-sm">Title</div>
          <input name="title" required className="mt-1 w-full rounded border px-3 py-2" placeholder="e.g., Boston Sales Visits" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm">Start date</div>
            <input type="date" name="startDate" required className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">End date</div>
            <input type="date" name="endDate" required className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <div className="text-sm">City</div>
            <input name="locationCity" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">State/Region</div>
            <input name="locationState" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm">Country</div>
            <input name="locationCountry" className="mt-1 w-full rounded border px-3 py-2" defaultValue="USA" />
          </label>
        </div>

        <label className="block">
          <div className="text-sm">Notes</div>
          <textarea name="notes" rows={3} className="mt-1 w-full rounded border px-3 py-2" placeholder="Purpose, accounts to meet, etc." />
        </label>

        <div className="flex gap-3">
          <button className="rounded bg-black text-white px-4 py-2">Create trip</button>
          <a href="/trips" className="rounded border px-4 py-2">Cancel</a>
        </div>
      </form>
    </div>
  );
}
