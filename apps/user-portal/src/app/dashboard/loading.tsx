import {
  Card,
  CardContent,
  CardHeader,
  LoadingStatus,
  Skeleton,
} from "@template/ui-core";

export default function DashboardLoading() {
  return (
    <section aria-busy="true" className="space-y-6">
      <LoadingStatus label="Loading dashboard" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">
        {["wallet", "plan", "security", "sessions"].map((slot) => (
          <Card key={slot}>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-28 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {["profile", "checklist"].map((slot) => (
          <Card key={slot}>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-56 max-w-full" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {["first", "second", "third"].map((slot) => (
            <Skeleton className="h-5 w-full" key={slot} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
