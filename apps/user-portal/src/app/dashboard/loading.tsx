import { Card, CardContent, Skeleton } from "@template/ui-core";

export default function DashboardLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading dashboard"
      className="mx-auto max-w-7xl space-y-8"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        {["identity", "status"].map((slot) => (
          <Card key={slot}>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-4 w-44 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["activity", "usage", "applications"].map((slot) => (
          <Card key={slot}>
            <CardContent className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
