import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  DataTable,
  Skeleton,
} from "@template/ui-core";
import { portalName } from "@/lib/portal";

type Activity = {
  id: string;
  event: string;
  occurredAt: string;
};

export default function Home() {
  const activity: readonly Activity[] = [];

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <DashboardHeader
        description="Account features can be added here as backend capabilities become available."
        eyebrow={portalName}
        title="Welcome back"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          description="Manage personal information supplied by the backend."
          title="Account"
        />
        <OverviewCard
          description="Review authentication and active-session settings."
          title="Security"
        />
        <OverviewCard
          description="View account events when the activity API is connected."
          title="Activity"
        />
      </div>
      <Card>
        <CardContent className="space-y-6">
          <div>
            <CardTitle>Recent account activity</CardTitle>
            <CardDescription>
              This empty state is ready for records returned by the backend.
            </CardDescription>
          </div>
          <DataTable
            columns={[
              { header: "Event", cell: (row: Activity) => row.event },
              { header: "When", cell: (row: Activity) => row.occurredAt },
            ]}
            emptyMessage="No account activity is available."
            keyField={(row: Activity) => row.id}
            rows={activity}
          />
          <div aria-label="Loading state example" className="grid gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function OverviewCard({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <Card>
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
