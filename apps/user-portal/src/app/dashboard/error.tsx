"use client";

import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@template/ui-core";
import { portalName } from "@/lib/portal";

export default function DashboardError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <DashboardHeader
        description="We could not load your account information."
        eyebrow={portalName}
        title="Dashboard unavailable"
      />
      <Card>
        <CardContent>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            Check your connection and try loading the dashboard again.
          </CardDescription>
          <button
            className="bg-brand-500 hover:bg-brand-600 mt-5 rounded-lg px-4 py-2 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    </section>
  );
}
