// src/app/settings/profile/page.tsx
import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ProfileSettings() {
  const s = (await getServerSession()) as unknown as Session | null;
  if (!s?.user) redirect("/login");

  const su = s.user as { id?: string; email?: string | null };

  // ✅ use const (assigned once)
  const user =
    (su.id && (await prisma.user.findUnique({ where: { id: su.id } }))) ||
    (su.email && (await prisma.user.findUnique({ where: { email: su.email } }))) ||
    null;

  if (!user) redirect("/login");

  const userId: string = user.id;

  async function save(formData: FormData) {
    "use server";
    const name = ((formData.get("name") as string) || "").trim() || null;
    const defaultCurrency = ((formData.get("defaultCurrency") as string) || "USD").toUpperCase();
    const costCenter = ((formData.get("costCenter") as string) || "").trim() || null;

    await prisma.user.update({
      where: { id: userId },
      data: { name, defaultCurrency, costCenter },
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <form action={save} className="space-y-3 rounded-xl border bg-white p-4">
        <label className="block">
          <div className="text-sm">Name</div>
          <input name="name" defaultValue={user.name ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <div className="text-sm">Default currency</div>
          <input
            name="defaultCurrency"
            defaultValue={user.defaultCurrency ?? "USD"}
            className="mt-1 w-40 rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <div className="text-sm">Cost center</div>
          <input name="costCenter" defaultValue={user.costCenter ?? ""} className="mt-1 w-60 rounded border px-3 py-2" />
        </label>
        <button className="rounded-lg bg-black px-3 py-2 text-sm text-white">Save</button>
      </form>
    </div>
  );
}
