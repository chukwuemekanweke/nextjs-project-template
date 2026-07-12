import { portalName } from "@/lib/portal";
import { userPortalHref } from "@/config/env";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_45%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">
            {portalName}
          </p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            A strong foundation for your next product.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            A focused public experience that introduces the product and guides
            customers into their dedicated account portal.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-800"
              href={userPortalHref("/register")}
            >
              Create an account
            </a>
            <a
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:border-blue-300"
              href={userPortalHref("/login")}
            >
              Sign in
            </a>
          </div>
        </div>
      </section>
      <section className="bg-slate-50 px-6 py-20" id="features">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            ["Focused", "A clear experience for every audience."],
            ["Connected", "Designed to integrate with the shared .NET API."],
            [
              "Independent",
              "Each portal builds and deploys on its own lifecycle.",
            ],
          ].map(([title, description]) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-7"
              key={title}
            >
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
