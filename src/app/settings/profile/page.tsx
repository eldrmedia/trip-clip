import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ProfileSettings() {
  const s = await getServerSession(); if (!s?.user) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: (s.user as any).id } });
  if (!user) redirect("/login");

  async function save(formData: FormData) { "use server";
    const name = (formData.get("name") as string) || null;
    const defaultCurrency = (formData.get("defaultCurrency") as string) || "USD";
    const costCenter = (formData.get("costCenter") as string) || null;
    await prisma.user.update({
      where: { id: user.id },
      data: { name, defaultCurrency, costCenter },
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form action={save} className="rounded border p-4 space-y-3 bg-white">
        <label className="block">
          <div className="text-sm">Name</div>
          <input name="name" defaultValue={user.name ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm">Default currency</div>
          <input name="defaultCurrency" defaultValue={user.defaultCurrency ?? "USD"} className="mt-1 w-40 rounded border px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm">Cost center</div>
          <input name="costCenter" defaultValue={user.costCenter ?? ""} className="mt-1 w-60 rounded border px-3 py-2" />
        </label>
        <button className="rounded bg-black text-white px-3 py-2 text-sm">Save</button>
      </form>
    </div>
  );
}
