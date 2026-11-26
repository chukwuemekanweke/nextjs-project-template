"use client";

import { DashboardHeader } from "@template/dashboard-ui";
import { Card, ErrorState } from "@template/ui-core";

export default function ProfileError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <section className="space-y-6">
      <DashboardHeader
        description="We could not load your personal information."
        title="Profile unavailable"
      />
      <Card>
        <ErrorState
          description="Check your connection and try loading your profile again."
          onRetry={reset}
        />
      </Card>
    </section>
  );
}
