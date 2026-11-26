import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  LoadingStatus,
  Skeleton,
} from "@template/ui-core";

export default function ProfileLoading() {
  return (
    <section aria-busy="true" className="space-y-6">
      <LoadingStatus label="Loading profile" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <Skeleton className="size-22 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {["first-name", "last-name", "email"].map((slot) => (
            <div className="space-y-2" key={slot}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-11 w-32" />
        </CardFooter>
      </Card>
    </section>
  );
}
