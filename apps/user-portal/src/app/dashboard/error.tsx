"use client";

import { DashboardHeader } from "@template/dashboard-ui";
import { Card, ErrorState } from "@template/ui-core";

export default function DashboardError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <section className="space-y-6">
      <DashboardHeader
        description="We could not load your account information."
        title="Dashboard unavailable"
      />
      <Card>
        <ErrorState
          description="Check your connection and try loading the dashboard again."
          onRetry={reset}
        />
      </Card>
    </section>
  );
}
