"use client";

import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Button,
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
  type DocumentReadState,
  type UserReceipt,
} from "./billing-documents-model";
import {
  DocumentBack,
  DocumentLayout,
  DocumentPageHeader,
  DocumentStateFallback,
  SummaryRows,
  type DocumentBackLink,
} from "./document-parts";

/*
 * User receipt detail (reference `UserReceiptDetail-{subscription,wallet}*`):
 * one composition for both kinds; only the "For" row and line items differ.
 * A receipt is only ever an issued document, never a successful purchase or
 * top-up. PREVIEW-ONLY (BE-DS-007, DR-160).
 */

/** What the payment was for, from the receipt's own references only. */
function receiptSubject(
  receipt: UserReceipt,
  invoiceHref?: (invoiceId: string) => string,
): ReactNode {
  if (receipt.kind === "wallet") {
    return receipt.walletReference ? (
      <>
        Wallet top-up{" "}
        <span className="font-mono">{receipt.walletReference}</span>
      </>
    ) : (
      "Wallet top-up"
    );
  }
  const invoice = receipt.invoice;
  if (!invoice) return "Subscription";
  return invoice.id && invoiceHref ? (
    <Link
      className="text-brand-ink font-mono hover:underline focus-visible:underline"
      href={invoiceHref(invoice.id)}
    >
      {invoice.invoiceNumber}
    </Link>
  ) : (
    <span className="font-mono">{invoice.invoiceNumber}</span>
  );
}

export function ReceiptDetailScreen({
  back,
  brandName,
  invoiceHref,
  onRetry,
  state,
}: Readonly<{
  back?: DocumentBackLink;
  /** Product name for the document brand mark. */
  brandName: string;
  invoiceHref?: (invoiceId: string) => string;
  onRetry?: () => void;
  state: DocumentReadState<UserReceipt>;
}>) {
  if (state.state !== "ready") {
    return (
      <section className="grid gap-5 md:gap-6">
        <DocumentBack back={back} />
        <DocumentStateFallback
          back={back}
          noun="Receipt"
          onRetry={onRetry}
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
        description="Proof of payment for your records."
        title={`Receipt ${receipt.receiptNumber}`}
      />
      <DocumentLayout
        aside={
          <Card>
            <CardHeader>
              <CardTitle as="h2">Payment</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <SummaryRows
                rows={[
                  {
                    label: "Amount paid",
                    value: (
                      <strong className="font-semibold">
                        {formatMinorUnits(
                          receipt.amountPaid,
                          receipt.currencyCode,
                        )}
                      </strong>
                    ),
                  },
                  { label: "For", value: receiptSubject(receipt, invoiceHref) },
                  ...(receipt.paymentMethod
                    ? [{ label: "Method", value: receipt.paymentMethod }]
                    : []),
                ]}
              />
              <Button
                aria-describedby="document-actions-hint"
                disabled
                fullWidth
                leadingIcon={<MailIcon />}
                type="button"
                variant="ghost"
              >
                Email me a copy
              </Button>
            </CardContent>
          </Card>
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
