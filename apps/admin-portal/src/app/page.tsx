import { DashboardHeader } from "@template/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  DataTable,
  Pagination,
} from "@template/ui-core";
import { portalName } from "@/lib/portal";

type SystemRecord = {
  id: string;
  name: string;
  status: string;
};

export default function Home() {
  const systems: readonly SystemRecord[] = [];

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      <DashboardHeader
        description="Administrative modules can be added independently as backend operations become available."
        eyebrow={portalName}
        title="Operational overview"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          description="Connect identity administration to the backend API."
          title="Users"
        />
        <OverviewCard
          description="Expose role and permission workflows without duplicating UI primitives."
          title="Access control"
        />
        <OverviewCard
          description="Present health and audit information from authoritative services."
          title="System"
        />
      </div>
      <Card>
        <CardContent className="space-y-6">
          <div>
            <CardTitle>Governed systems</CardTitle>
            <CardDescription>
              This empty state is ready for operational data returned by the
              backend.
            </CardDescription>
          </div>
          <DataTable
            columns={[
              { header: "System", cell: (row: SystemRecord) => row.name },
              { header: "Status", cell: (row: SystemRecord) => row.status },
            ]}
            emptyMessage="No governed systems are available."
            keyField={(row: SystemRecord) => row.id}
            rows={systems}
          />
          <Pagination
            currentPage={1}
            getHref={(page) => `/?page=${page}`}
            totalPages={1}
          />
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
