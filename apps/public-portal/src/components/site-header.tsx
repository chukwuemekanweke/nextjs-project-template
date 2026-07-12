import Link from "next/link";
import { userPortalHref } from "@/config/env";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between px-6">
        <Link className="text-xl font-bold text-blue-700" href="/">
          Product
        </Link>
        <nav
          aria-label="Public navigation"
          className="flex items-center gap-6 text-sm font-medium text-slate-700"
        >
          <Link
            className="hidden hover:text-blue-700 sm:inline"
            href="#features"
          >
            Features
          </Link>
          <a className="hover:text-blue-700" href={userPortalHref("/login")}>
            Sign in
          </a>
          <a
            className="rounded-full bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
            href={userPortalHref("/register")}
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}
