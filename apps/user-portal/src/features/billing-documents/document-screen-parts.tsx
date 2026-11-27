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
  type ButtonProps,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import type {
  BillingDocumentAction,
  DocumentCapabilities,
  DocumentReadState,
} from "./billing-documents-model";

/*
 * Layout and building blocks shared by the invoice and receipt screens. They
 * render what they are given and report intents; they never fetch, print,
 * download, email or pay by themselves.
 */

export type DocumentBackLink = Readonly<{ href: string; label: string }>;

export type DocumentScreenProps = Readonly<{
  /** Billing context to return to; omitted when that route does not exist. */
  back?: DocumentBackLink;
  /** Product name for the document brand mark. */
  brandName: string;
  /** Action being performed, shown busy. */
  busyAction?: BillingDocumentAction["type"];
  onAction?: (action: BillingDocumentAction) => void;
}>;

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
 * A button that reports one intent. Without a handler, or when the document
 * does not support the operation, it renders disabled and is described by a
 * visible reason, so the screen never implies the operation exists.
 */
export function DocumentActionButton({
  busy = false,
  children,
  enabled,
  hintId,
  intent,
  onAction,
  ...props
}: Omit<ButtonProps, "onClick" | "disabled"> &
  Readonly<{
    busy?: boolean;
    children: ReactNode;
    enabled: boolean;
    hintId: string;
    intent: BillingDocumentAction["type"];
    onAction?: () => void;
  }>) {
  const unavailable = !enabled || !onAction;
  return (
    <Button
      {...props}
      aria-describedby={unavailable ? hintId : undefined}
      data-intent={intent}
      disabled={unavailable || busy}
      loading={busy}
      onClick={unavailable ? undefined : onAction}
      type="button"
    >
      {children}
    </Button>
  );
}

/** Visible reasons for disabled actions, one sentence each. */
export function UnavailableActionsHint({
  id,
  reasons,
}: Readonly<{ id: string; reasons: readonly string[] }>) {
  if (reasons.length === 0) return null;
  return (
    <p className="text-small text-fg-subtle" id={id}>
      {reasons.join(" ")}
    </p>
  );
}

/** Page header with the Print and Download PDF actions. */
export function DocumentPageHeader({
  busyAction,
  capabilities,
  description,
  documentId,
  hintPrefix,
  onAction,
  title,
}: Readonly<{
  busyAction?: BillingDocumentAction["type"];
  capabilities: DocumentCapabilities;
  description?: string;
  documentId: string;
  hintPrefix: string;
  onAction?: (action: BillingDocumentAction) => void;
  title: string;
}>) {
  const hintId = `${hintPrefix}-header-actions-hint`;
  const reasons = [
    onAction ? undefined : "Printing is not available here.",
    onAction && capabilities.downloadPdf
      ? undefined
      : "PDF download is not available yet.",
  ].filter((reason): reason is string => Boolean(reason));

  return (
    <div className="grid gap-2 print:hidden" data-print-hidden="">
      <DashboardHeader
        actions={
          <>
            <DocumentActionButton
              enabled
              hintId={hintId}
              intent="print"
              leadingIcon={<PrinterIcon />}
              onAction={
                onAction ? () => onAction({ type: "print" }) : undefined
              }
              size="sm"
              variant="secondary"
            >
              Print
            </DocumentActionButton>
            <DocumentActionButton
              busy={busyAction === "downloadPdf"}
              enabled={capabilities.downloadPdf}
              hintId={hintId}
              intent="downloadPdf"
              leadingIcon={<DownloadIcon />}
              onAction={
                onAction
                  ? () => onAction({ documentId, type: "downloadPdf" })
                  : undefined
              }
              size="sm"
              variant="secondary"
            >
              Download PDF
            </DocumentActionButton>
          </>
        }
        description={description}
        title={title}
      />
      <div className="sm:text-right">
        <UnavailableActionsHint id={hintId} reasons={reasons} />
      </div>
    </div>
  );
}

/** Document sheet beside its summary card (stacked below `lg`). */
export function DocumentLayout({
  aside,
  children,
}: Readonly<{ aside: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-start gap-5 md:gap-6">
      <div className="min-w-0 flex-[999_1_560px] print:flex-none print:basis-full">
        {children}
      </div>
      <aside
        className="grid min-w-0 flex-[1_1_280px] gap-5 print:hidden"
        data-print-hidden=""
      >
        {aside}
      </aside>
    </div>
  );
}

/** Non-ready document states; `null` for `ready`. */
export function DocumentStateFallback<Document>({
  back,
  noun,
  onAction,
  state,
}: Readonly<{
  back?: DocumentBackLink;
  /** "Invoice" or "Receipt". */
  noun: string;
  onAction?: (action: BillingDocumentAction) => void;
  state: DocumentReadState<Document>;
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
    case "ready":
      return null;
    case "loading":
      return (
        <Card aria-busy="true">
          <CardContent className="grid gap-3">
            <LoadingStatus label={`Loading ${noun.toLowerCase()}`} />
            <Skeleton className="h-8 w-60 max-w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      );
    case "error":
      return (
        <Card>
          <ErrorState
            action={backLink}
            description={
              state.message ??
              "Please try again. If it continues, contact support."
            }
            onRetry={onAction ? () => onAction({ type: "retry" }) : undefined}
            title={`Couldn't load this ${noun.toLowerCase()}`}
          />
        </Card>
      );
    case "notFound":
      return (
        <Card>
          <CardContent>
            <EmptyState
              action={backLink}
              description="It may not exist, or it belongs to another account."
              icon={<FileTextIcon />}
              title={`${noun} not found`}
            />
          </CardContent>
        </Card>
      );
    case "unavailable":
      return (
        <Card data-unavailable="">
          <CardContent>
            <EmptyState
              action={backLink}
              description={state.reason}
              icon={<FileTextIcon />}
              title={`${noun}s are not available`}
            />
          </CardContent>
        </Card>
      );
  }
}
