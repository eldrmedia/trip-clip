import { getServerSession } from "next-auth";
import Link from "next/link";
import AccountMenuClient from "./AccountMenuClient";

export default async function Header() {
  const s = await getServerSession();
  const user = s?.user as { name?: string | null; email?: string | null; image?: string | null } | undefined;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-semibold">
          TripClip
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/trips" className="text-sm hover:underline">Trips</Link>
          <Link href="/expenses" className="text-sm hover:underline">Expenses</Link>
          <Link href="/reports" className="text-sm hover:underline">Reports</Link>

          {user ? (
            <AccountMenuClient name={user.name} email={user.email} image={user.image} />
          ) : (
            <Link
              href="/login"
              className="rounded bg-black px-3 py-1.5 text-sm text-white"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
