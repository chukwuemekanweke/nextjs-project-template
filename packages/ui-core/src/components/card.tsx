import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={["px-6 py-5", className].join(" ")} {...props} />;
}

export function CardTitle({
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={[
        "text-base font-medium text-gray-800 dark:text-white/90",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={[
        "mt-1 text-sm text-gray-500 dark:text-gray-400",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardContent({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-5 sm:p-6", className].join(" ")} {...props} />;
}

export function CardFooter({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3 border-t border-gray-100 p-5 sm:p-6 dark:border-gray-800",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function StatCard({
  eyebrow,
  title,
  value,
  meta,
}: Readonly<{
  eyebrow: string;
  title: string;
  value: string;
  meta?: ReactNode;
}>) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
          {eyebrow}
        </p>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-800 dark:text-white/90">
            {value}
          </p>
        </div>
        {meta ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">{meta}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
