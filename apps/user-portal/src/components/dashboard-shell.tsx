import Link from "next/link";
import type { ReactNode } from "react";
import { userNavigation } from "@/config/navigation";

export function DashboardShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-slate-200 bg-white p-6 lg:min-h-screen lg:border-r lg:border-b-0">
        <Link className="text-xl font-bold text-blue-700" href="/">
          Product
        </Link>
        <p className="mt-1 text-sm text-slate-500">User Portal</p>
        <nav
          aria-label="User navigation"
          className="mt-8 flex gap-2 overflow-x-auto lg:flex-col"
        >
          {userNavigation.map((item) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <span className="font-medium text-slate-800">My account</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
            User
          </span>
        </header>
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
