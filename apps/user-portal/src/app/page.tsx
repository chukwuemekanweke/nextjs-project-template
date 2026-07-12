import { portalName } from "@/lib/portal";

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-blue-700">{portalName}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Your account overview and product activity will appear here as features
        are enabled.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Account", "Manage your personal information"],
          ["Security", "Review password and session settings"],
          ["Activity", "View recent product activity"],
        ].map(([title, description]) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            key={title}
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
