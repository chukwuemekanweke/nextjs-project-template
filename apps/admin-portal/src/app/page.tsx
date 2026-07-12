import { portalName } from "@/lib/portal";

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-indigo-700">{portalName}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Operational overview
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Administrative metrics and privileged workflows will appear here as
        modules are enabled.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Users", "User administration"],
          ["Access control", "Roles and permissions"],
          ["System", "Health and audit information"],
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
