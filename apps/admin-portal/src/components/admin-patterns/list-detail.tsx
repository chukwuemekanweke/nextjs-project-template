import Link from "next/link";
import {
  ArrowLeftIcon,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@template/ui-core";
import type { ReactNode } from "react";

/*
 * List and detail layout for admin operational screens. They only arrange
 * ui-core primitives: tables are `DataTable` (variant "embedded"), paging is
 * `Pager`, statuses are `Badge` with an app-local status → tone map.
 */

/**
 * List page section: a card with a title, an optional filter toolbar, the
 * table and a footer (usually `Pager`). Put `DashboardHeader` above it.
 */
export function AdminListCard({
  actions,
  children,
  description,
  footer,
  title,
  toolbar,
}: Readonly<{
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  title: string;
  /** Usually an `AdminFilterBar`. */
  toolbar?: ReactNode;
}>) {
  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </CardHeader>
      {toolbar ? (
        <CardContent className="border-border border-b py-3 md:py-4">
          {toolbar}
        </CardContent>
      ) : null}
      {children}
      {footer ? (
        <CardFooter className="justify-between">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}

/**
 * Detail page header (reference user/payment/subscription detail): back
 * link to the list, the record's `h1`, status badges, safe metadata and
 * actions. Actions that need step-up open `AdminStepUpDialog`.
 */
export function AdminDetailHeader({
  actions,
  back,
  badges,
  leading,
  meta,
  title,
}: Readonly<{
  actions?: ReactNode;
  /** Link to an implemented list route. */
  back?: Readonly<{ href: string; label: string }>;
  badges?: ReactNode;
  /** Avatar or icon tile. */
  leading?: ReactNode;
  meta?: ReactNode;
  title: string;
}>) {
  return (
    <div className="grid gap-4">
      {back ? (
        <Link
          className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline focus-visible:underline"
          href={back.href}
        >
          <ArrowLeftIcon size="xs" />
          {back.label}
        </Link>
      ) : null}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5">
          {leading}
          <div className="grid min-w-0 flex-[1_1_240px] gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-h1 text-fg break-words">{title}</h1>
              {badges}
            </div>
            {meta ? (
              <div className="text-fg-muted break-words">{meta}</div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-3 max-sm:*:flex-auto">
              {actions}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
