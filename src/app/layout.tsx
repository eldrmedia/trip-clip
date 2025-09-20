import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">Expense Hawk</Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/expenses">Expenses</Link>
              <Link href="/trips">Trips</Link>
              <Link href="/reports">Reports</Link>
              <Link href="/settings/google">Settings</Link>
              <Link href="/activity">Activity</Link>
            </nav>
            <div className="text-xs opacity-70">{session?.user?.email ?? "Not signed in"}</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
