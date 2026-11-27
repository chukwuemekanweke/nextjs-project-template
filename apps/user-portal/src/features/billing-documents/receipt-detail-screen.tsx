"use client";

import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MailIcon,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  receiptDocumentContent,
  type BillingDocumentAction,
  type DocumentReadState,
  type UserReceipt,
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
 * User receipt detail (reference `UserReceiptDetail-{subscription,wallet}*`):
 * one composition for both kinds; only the "For" row and the source line
 * items differ. A receipt is shown only when the backend issued one; a
 * successful purchase or wallet top-up is never presented as a receipt.
 * PREVIEW-ONLY (DR-160): no route, navigation entry or production import.
 */

export const RECEIPT_PAGE_DESCRIPTION = "Proof of payment for your records.";

export function ReceiptDetailScreen({
  back,
  brandName,
  busyAction,
  invoiceHref,
  onAction,
  state,
}: DocumentScreenProps &
  Readonly<{
    /** Invoice detail URL for a backend invoice id, once that route exists. */
    invoiceHref?: (invoiceId: string) => string;
    state: DocumentReadState<UserReceipt>;
  }>) {
  if (state.state !== "ready") {
    return (
      <section className="grid gap-5 md:gap-6">
        <DocumentBack back={back} />
        <DocumentStateFallback
          back={back}
          noun="Receipt"
          onAction={onAction}
          state={state}
        />
      </section>
    );
  }

  const receipt = state.document;

  return (
    <section className="grid gap-5 md:gap-6" data-receipt-kind={receipt.kind}>
      <DocumentBack back={back} />
      <DocumentPageHeader
        busyAction={busyAction}
        capabilities={receipt.capabilities}
        description={RECEIPT_PAGE_DESCRIPTION}
        documentId={receipt.id}
        hintPrefix="receipt"
        onAction={onAction}
        title={`Receipt ${receipt.receiptNumber}`}
      />
      <DocumentLayout
        aside={
          <ReceiptPaymentCard
            busyAction={busyAction}
            invoiceHref={invoiceHref}
            onAction={onAction}
            receipt={receipt}
          />
        }
      >
        <BillingDocument
          brandName={brandName}
          {...receiptDocumentContent(receipt)}
        />
      </DocumentLayout>
    </section>
  );
}

/** What the payment was for, from the receipt's own references only. */
function receiptSubject(
  receipt: UserReceipt,
  invoiceHref?: (invoiceId: string) => string,
): ReactNode {
  if (receipt.kind === "wallet") {
    const reference = receipt.walletTransaction?.reference;
    return reference ? (
      <>
        Wallet top-up <span className="font-mono">{reference}</span>
      </>
    ) : (
      "Wallet top-up"
    );
  }
  const invoice = receipt.invoice;
  if (!invoice) return "Subscription";
  if (invoice.id && invoiceHref) {
    return (
      <Link
        className="text-brand-ink font-mono hover:underline focus-visible:underline"
        href={invoiceHref(invoice.id)}
      >
        {invoice.invoiceNumber}
      </Link>
    );
  }
  return <span className="font-mono">{invoice.invoiceNumber}</span>;
}

function ReceiptPaymentCard({
  busyAction,
  invoiceHref,
  onAction,
  receipt,
}: Readonly<{
  busyAction?: BillingDocumentAction["type"];
  invoiceHref?: (invoiceId: string) => string;
  onAction?: (action: BillingDocumentAction) => void;
  receipt: UserReceipt;
}>) {
  const hintId = "receipt-summary-actions-hint";
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Amount paid",
      value: (
        <strong className="font-semibold">
          {formatMinorUnits(receipt.amountPaid, receipt.currencyCode)}
        </strong>
      ),
    },
    { label: "For", value: receiptSubject(receipt, invoiceHref) },
  ];
  if (receipt.paymentMethod) {
    rows.push({ label: "Method", value: receipt.paymentMethod });
  }
  const emailAvailable = Boolean(onAction) && receipt.capabilities.emailCopy;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Payment</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
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
        <div className="grid gap-2">
          <DocumentActionButton
            busy={busyAction === "emailCopy"}
            enabled={receipt.capabilities.emailCopy}
            fullWidth
            hintId={hintId}
            intent="emailCopy"
            leadingIcon={<MailIcon />}
            onAction={
              onAction
                ? () => onAction({ documentId: receipt.id, type: "emailCopy" })
                : undefined
            }
            variant="ghost"
          >
            Email me a copy
          </DocumentActionButton>
          <UnavailableActionsHint
            id={hintId}
            reasons={
              emailAvailable ? [] : ["Emailing a copy is not available yet."]
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
