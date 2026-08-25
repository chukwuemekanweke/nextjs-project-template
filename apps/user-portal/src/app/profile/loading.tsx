import { Card, CardContent, Skeleton } from "@template/ui-core";

export default function ProfileLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading profile"
      className="mx-auto max-w-5xl space-y-6 sm:space-y-8"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-52 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-5 border-b border-gray-100 pb-6 dark:border-gray-800">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-6 w-52 max-w-full" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-5 sm:grid-cols-2">
              {["first-name", "last-name", "email", "email-value"].map(
                (slot) => (
                  <Skeleton className="h-4 w-36 max-w-full" key={slot} />
                ),
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
