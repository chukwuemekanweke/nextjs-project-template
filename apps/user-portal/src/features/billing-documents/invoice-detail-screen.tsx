"use client";

import { BillingDocument } from "@template/dashboard-ui/documents";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MailIcon,
  buttonVariants,
  formatMinorUnits,
} from "@template/ui-core";
import Link from "next/link";
import {
  describeInvoiceStatus,
  formatDocumentDate,
  invoiceDocumentContent,
  invoicePageDescription,
  type DocumentReadState,
  type UserInvoice,
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
 * User invoice detail (reference `UserInvoiceDetail-{due,overdue,paid}*`):
 * one responsive, theme-aware composition; the variant comes from the
 * status. PREVIEW-ONLY (BE-DS-007, DR-160): no route, navigation item or
 * production import. There is no Pay action: no integration can pay an
 * invoice, so a due or overdue invoice never offers one. "View receipt"
 * links only with a receipt id and a caller-supplied URL builder.
 */

export function InvoiceDetailScreen({
  back,
  brandName,
  onRetry,
  receiptHref,
  state,
}: Readonly<{
  back?: DocumentBackLink;
  /** Product name for the document brand mark. */
  brandName: string;
  onRetry?: () => void;
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
          onRetry={onRetry}
          state={state}
        />
      </section>
    );
  }

  const invoice = state.document;
  const status = describeInvoiceStatus(invoice.status);
  const outstanding = status.variant === "due" || status.variant === "overdue";
  const due = formatDocumentDate(invoice.dueAtUtc);
  const paidOn = formatDocumentDate(invoice.payment?.paidAtUtc);
  const receiptId = invoice.payment?.receiptId;
  const amount =
    outstanding && invoice.amountDue !== null
      ? { label: "Amount due", value: invoice.amountDue }
      : { label: "Total", value: invoice.total };

  return (
    <section
      className="grid gap-5 md:gap-6"
      data-invoice-variant={status.variant}
    >
      <DocumentBack back={back} />
      <DocumentPageHeader
        description={invoicePageDescription(invoice)}
        title={`Invoice ${invoice.invoiceNumber}`}
      />
      <DocumentLayout
        aside={
          <Card>
            <CardHeader>
              <CardTitle as="h2">Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {status.variant === "overdue" ? (
                <p className="text-small text-danger">
                  {due ? `Overdue since ${due}.` : "This invoice is overdue."}
                </p>
              ) : null}
              <SummaryRows
                rows={[
                  {
                    label: "Status",
                    value: <Badge tone={status.tone}>{status.label}</Badge>,
                  },
                  {
                    label: amount.label,
                    value: (
                      <strong className="font-semibold">
                        {formatMinorUnits(amount.value, invoice.currencyCode)}
                      </strong>
                    ),
                  },
                  ...(outstanding && due
                    ? [{ label: "Due date", value: due }]
                    : []),
                  ...(status.variant === "paid" && paidOn
                    ? [{ label: "Paid on", value: paidOn }]
                    : []),
                ]}
              />
              <div className="grid gap-2">
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
              </div>
            </CardContent>
          </Card>
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
