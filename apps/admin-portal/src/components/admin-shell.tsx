import Link from "next/link";
import type { ReactNode } from "react";
import { adminNavigation } from "@/config/navigation";

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="bg-slate-950 p-6 text-white lg:min-h-screen">
        <Link className="text-xl font-bold" href="/">
          Product
        </Link>
        <p className="mt-1 text-sm text-slate-400">Administration</p>
        <nav
          aria-label="Admin navigation"
          className="mt-8 flex gap-2 overflow-x-auto lg:flex-col"
        >
          {adminNavigation.map((item) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
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
          <span className="font-medium text-slate-800">Operations</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
            Administrator
          </span>
        </header>
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
