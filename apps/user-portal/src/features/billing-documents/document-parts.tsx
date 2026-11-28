"use client";

import { DashboardHeader } from "@template/dashboard-ui";
import {
  ArrowLeftIcon,
  Button,
  Card,
  CardContent,
  DownloadIcon,
  EmptyState,
  ErrorState,
  FileTextIcon,
  LoadingStatus,
  PrinterIcon,
  Skeleton,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DocumentReadState } from "./billing-documents-model";

/*
 * Layout shared by the invoice and receipt screens. Everything here except
 * the document sheet is hidden in print.
 */

export type DocumentBackLink = Readonly<{ href: string; label: string }>;

/** Shown beside actions that need backend support (BE-DS-007). */
export const DOCUMENT_ACTIONS_UNAVAILABLE =
  "PDF download and email copies are not available yet.";

export function DocumentBack({ back }: Readonly<{ back?: DocumentBackLink }>) {
  if (!back) return null;
  return (
    <Link
      className="text-small text-brand-ink inline-flex w-fit items-center gap-1.5 font-medium hover:underline focus-visible:underline print:hidden"
      href={back.href}
    >
      <ArrowLeftIcon size="xs" />
      {back.label}
    </Link>
  );
}

/**
 * Page heading with Print (the browser prints the page; the shell and these
 * controls are hidden) and Download PDF, disabled until a PDF exists.
 */
export function DocumentPageHeader({
  description,
  title,
}: Readonly<{ description?: string; title: string }>) {
  return (
    <div className="grid gap-2 print:hidden">
      <DashboardHeader
        actions={
          <>
            <Button
              leadingIcon={<PrinterIcon />}
              onClick={() => window.print()}
              size="sm"
              type="button"
              variant="secondary"
            >
              Print
            </Button>
            <Button
              aria-describedby="document-actions-hint"
              disabled
              leadingIcon={<DownloadIcon />}
              size="sm"
              type="button"
              variant="secondary"
            >
              Download PDF
            </Button>
          </>
        }
        description={description}
        title={title}
      />
      <p
        className="text-small text-fg-subtle sm:text-right"
        id="document-actions-hint"
      >
        {DOCUMENT_ACTIONS_UNAVAILABLE}
      </p>
    </div>
  );
}

/** The document sheet beside its summary card (stacked on narrow screens). */
export function DocumentLayout({
  aside,
  children,
}: Readonly<{ aside: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-start gap-5 md:gap-6">
      <div className="min-w-0 flex-[999_1_560px] print:basis-full">
        {children}
      </div>
      <aside className="grid min-w-0 flex-[1_1_280px] gap-5 print:hidden">
        {aside}
      </aside>
    </div>
  );
}

/** Summary rows of the side card. */
export function SummaryRows({
  rows,
}: Readonly<{ rows: readonly { label: string; value: ReactNode }[] }>) {
  return (
    <dl className="grid gap-3">
      {rows.map((row) => (
        <div
          className="flex items-center justify-between gap-4"
          key={row.label}
        >
          <dt className="text-fg-muted">{row.label}</dt>
          <dd className="min-w-0 text-right break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Non-ready states; never shows document content. */
export function DocumentStateFallback({
  back,
  noun,
  onRetry,
  state,
}: Readonly<{
  back?: DocumentBackLink;
  /** "Invoice" or "Receipt". */
  noun: string;
  onRetry?: () => void;
  state: Exclude<DocumentReadState<unknown>, { state: "ready" }>;
}>) {
  const backLink = back ? (
    <Link
      className="text-brand-ink font-medium hover:underline"
      href={back.href}
    >
      {back.label}
    </Link>
  ) : undefined;
  switch (state.state) {
    case "loading":
      return (
        <Card aria-busy="true">
          <CardContent className="grid gap-3">
            <LoadingStatus label={`Loading ${noun.toLowerCase()}`} />
            <Skeleton className="h-8 w-60 max-w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      );
    case "error":
      return (
        <Card>
          <ErrorState
            action={backLink}
            onRetry={onRetry}
            title={`Couldn't load this ${noun.toLowerCase()}`}
          />
        </Card>
      );
    case "notFound":
    case "unavailable":
      return (
        <Card data-state={state.state}>
          <CardContent>
            <EmptyState
              action={backLink}
              description={
                state.state === "notFound"
                  ? "It may not exist, or it belongs to another account."
                  : `${noun}s are not available yet.`
              }
              icon={<FileTextIcon />}
              title={
                state.state === "notFound"
                  ? `${noun} not found`
                  : `${noun}s are not available`
              }
            />
          </CardContent>
        </Card>
      );
  }
}
