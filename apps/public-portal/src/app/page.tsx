import { portalName } from "@/lib/portal";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">{portalName}</h1>
      <p className="mt-3 text-slate-600">
        The public product experience starts here.
      </p>
    </main>
  );
}
