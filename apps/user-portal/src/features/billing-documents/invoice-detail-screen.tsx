"use client";

import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CreditCardIcon,
  MailIcon,
  buttonVariants,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  describeInvoiceStatus,
  formatDocumentDate,
  invoiceDocumentContent,
  invoicePageDescription,
  type BillingDocumentAction,
  type DocumentReadState,
  type UserInvoice,
} from "./billing-documents-model";
import {
  DocumentActionButton,
  DocumentBack,
  DocumentLayout,
  DocumentPageHeader,
  DocumentStateFallback,
  UnavailableActionsHint,
  type DocumentScreenProps,
} from "./document-screen-parts";

/*
 * User invoice detail (reference `UserInvoiceDetail-{due,overdue,paid}*`,
 * one responsive, theme-aware composition). The status variant comes only
 * from the backend status. PREVIEW-ONLY: there is no invoice contract
 * (DR-160), so there is no route or navigation entry and nothing in
 * production renders it; tests are the preview harness.
 *
 * Pay appears only when the invoice reports a supported payment
 * integration and the caller handles it; a due or overdue invoice never
 * implies one. "View receipt" links only with a real receipt id and a
 * caller-supplied URL builder.
 */

export function InvoiceDetailScreen({
  back,
  brandName,
  busyAction,
  onAction,
  receiptHref,
  state,
}: DocumentScreenProps &
  Readonly<{
    /** Receipt detail URL for a backend receipt id, once that route exists. */
    receiptHref?: (receiptId: string) => string;
    state: DocumentReadState<UserInvoice>;
  }>) {
  if (state.state !== "ready") {
    return (
      <section className="grid gap-5 md:gap-6">
        <DocumentBack back={back} />
        <DocumentStateFallback
          back={back}
          noun="Invoice"
          onAction={onAction}
          state={state}
        />
      </section>
    );
  }

  const invoice = state.document;
  const status = describeInvoiceStatus(invoice.status);

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-invoice-variant={status.variant}
    >
      <DocumentBack back={back} />
      <DocumentPageHeader
        busyAction={busyAction}
        capabilities={invoice.capabilities}
        description={invoicePageDescription(invoice)}
        documentId={invoice.id}
        hintPrefix="invoice"
        onAction={onAction}
        title={`Invoice ${invoice.invoiceNumber}`}
      />
      <DocumentLayout
        aside={
          <InvoiceSummaryCard
            busyAction={busyAction}
            invoice={invoice}
            onAction={onAction}
            receiptHref={receiptHref}
          />
        }
      >
        <BillingDocument
          brandName={brandName}
          {...invoiceDocumentContent(invoice)}
        />
      </DocumentLayout>
    </section>
  );
}

function InvoiceSummaryCard({
  busyAction,
  invoice,
  onAction,
  receiptHref,
}: Readonly<{
  busyAction?: BillingDocumentAction["type"];
  invoice: UserInvoice;
  onAction?: (action: BillingDocumentAction) => void;
  receiptHref?: (receiptId: string) => string;
}>) {
  const status = describeInvoiceStatus(invoice.status);
  const currency = invoice.currencyCode;
  const outstanding = status.variant === "due" || status.variant === "overdue";
  const canPay = outstanding && invoice.capabilities.pay && Boolean(onAction);
  const receiptId = invoice.payment?.receiptId ?? null;
  const hintId = "invoice-summary-actions-hint";
  const dueDate = formatDocumentDate(invoice.dueAtUtc);
  const paidOn = formatDocumentDate(invoice.payment?.paidAtUtc);

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Status",
      value: <Badge tone={status.tone}>{status.label}</Badge>,
    },
  ];
  if (outstanding && invoice.amountDue !== null) {
    rows.push({
      label: "Amount due",
      value: (
        <strong className="font-semibold">
          {formatMinorUnits(invoice.amountDue, currency)}
        </strong>
      ),
    });
  } else {
    rows.push({
      label: "Total",
      value: (
        <strong className="font-semibold">
          {formatMinorUnits(invoice.total, currency)}
        </strong>
      ),
    });
  }
  if (outstanding && dueDate) {
    rows.push({ label: "Due date", value: dueDate });
  }
  if (status.variant === "paid" && paidOn) {
    rows.push({ label: "Paid on", value: paidOn });
  }

  const reasons = [
    outstanding && !canPay
      ? "Online payment is not available for this invoice."
      : undefined,
    onAction && invoice.capabilities.emailCopy
      ? undefined
      : "Emailing a copy is not available yet.",
  ].filter((reason): reason is string => Boolean(reason));

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {status.variant === "overdue" ? (
          <p className="text-small text-danger" data-overdue-note="">
            {dueDate ? `Overdue since ${dueDate}.` : "This invoice is overdue."}
          </p>
        ) : null}
        <dl className="grid gap-3">
          {rows.map((row) => (
            <div
              className="flex items-center justify-between gap-4"
              key={row.label}
            >
              <dt className="text-fg-muted">{row.label}</dt>
              <dd className="text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-2">
          {canPay && invoice.amountDue !== null ? (
            <DocumentActionButton
              busy={busyAction === "pay"}
              enabled
              fullWidth
              hintId={hintId}
              intent="pay"
              leadingIcon={<CreditCardIcon />}
              onAction={() =>
                onAction?.({ invoiceId: invoice.id, type: "pay" })
              }
            >
              Pay {formatMinorUnits(invoice.amountDue, currency)}
            </DocumentActionButton>
          ) : null}
          {receiptId && receiptHref ? (
            <Link
              className={buttonVariants({
                fullWidth: true,
                variant: "secondary",
              })}
              href={receiptHref(receiptId)}
            >
              View receipt
            </Link>
          ) : null}
          <DocumentActionButton
            busy={busyAction === "emailCopy"}
            enabled={invoice.capabilities.emailCopy}
            fullWidth
            hintId={hintId}
            intent="emailCopy"
            leadingIcon={<MailIcon />}
            onAction={
              onAction
                ? () => onAction({ documentId: invoice.id, type: "emailCopy" })
                : undefined
            }
            variant="ghost"
          >
            Email me a copy
          </DocumentActionButton>
          <UnavailableActionsHint id={hintId} reasons={reasons} />
        </div>
      </CardContent>
    </Card>
  );
}
