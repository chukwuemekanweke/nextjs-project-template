import { Badge, cn, type BadgeTone } from "@template/ui-core";
import { useId, type ReactNode } from "react";

/*
 * Printable billing document sheet (reference `5-invoices-and-receipts`,
 * `PrintInvoice` / `PrintReceipt`): brand and issuer, document title,
 * number and status, parties, key facts, line items, totals, an optional
 * notice and footer lines.
 *
 * Presentation only and domain-neutral: callers pass text they have already
 * formatted from authoritative data (money with `formatMinorUnits`, dates)
 * and decide what the document contains. The sheet never computes amounts,
 * statuses or dates, and renders nothing for content it is not given:
 * optional columns, facts, notices and footers are simply omitted.
 *
 * The sheet always uses the light theme (`theme-light`), as the paper does
 * in every reference theme, so it reads the same on screen in dark mode and
 * in print. In print it drops its card frame and fills the printable width
 * (the dashboard shell hides navigation; pages hide their own controls),
 * repeats the line-item header on each page and keeps rows, totals and the
 * footer from splitting across pages.
 */

export type BillingDocumentStatus = Readonly<{
  label: string;
  tone: BadgeTone;
}>;

/** One party block, for example "Billed to" or "From". */
export type BillingDocumentParty = Readonly<{
  /** Stable key; defaults to the label. */
  id?: string;
  label: string;
  name: string;
  /** Further lines exactly as supplied (email, address lines). */
  lines?: readonly string[];
}>;

/** A key fact in the facts strip, for example "Issue date". */
export type BillingDocumentFact = Readonly<{
  id?: string;
  label: string;
  /** References and codes render in the monospace face. */
  mono?: boolean;
  value: ReactNode;
}>;

export type BillingDocumentLineItem = Readonly<{
  id: string;
  description: string;
  /** Secondary line under the description. */
  detail?: string;
  /** Formatted quantity; the column is omitted when no row has one. */
  quantity?: string;
  /** Formatted unit price; the column is omitted when no row has one. */
  unitPrice?: string;
  /** Formatted line amount. */
  amount: string;
}>;

export type BillingDocumentTotal = Readonly<{
  id?: string;
  label: string;
  value: string;
  /**
   * `total` separates and strengthens the row; `balance` is the largest
   * figure (for example "Amount due"). Default rows are secondary.
   */
  emphasis?: "default" | "total" | "balance";
}>;

/** A prominent figure under the header (reference receipt "Amount paid"). */
export type BillingDocumentHighlight = Readonly<{
  label: string;
  value: string;
  detail?: ReactNode;
}>;

export type BillingDocumentNotice = Readonly<{
  tone: BadgeTone;
  content: ReactNode;
}>;

export type BillingDocumentProps = Readonly<{
  /** Product name for the brand mark (application configuration). */
  brandName: string;
  className?: string;
  facts?: readonly BillingDocumentFact[];
  /** Footer lines, left column (for example notes the source returned). */
  footerNotes?: readonly string[];
  /** Footer lines, right column (for example issuer legal details). */
  footerDetails?: readonly string[];
  highlight?: BillingDocumentHighlight;
  /** Issuer name under the brand, only when the source returns it. */
  issuerName?: string;
  /** Accessible caption for the line-item table. */
  lineItemsCaption: string;
  lineItems: readonly BillingDocumentLineItem[];
  notice?: BillingDocumentNotice;
  /** Document number, for example an invoice number. */
  number: string;
  /** Label before the number, for example "Invoice no.". */
  numberLabel: string;
  parties?: readonly BillingDocumentParty[];
  status?: BillingDocumentStatus;
  /** Document type, for example "Invoice" or "Receipt" (shown uppercase). */
  title: string;
  totals?: readonly BillingDocumentTotal[];
}>;

const noticeTones: Readonly<Record<BadgeTone, string>> = {
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-bg text-fg-muted",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
};

const sectionLabel =
  "text-micro text-fg-subtle font-semibold tracking-[0.08em] uppercase";

export function BillingDocument({
  brandName,
  className,
  facts = [],
  footerDetails = [],
  footerNotes = [],
  highlight,
  issuerName,
  lineItems,
  lineItemsCaption,
  notice,
  number,
  numberLabel,
  parties = [],
  status,
  title,
  totals = [],
}: BillingDocumentProps) {
  const titleId = useId();
  const showQuantity = lineItems.some((item) => item.quantity !== undefined);
  const showUnitPrice = lineItems.some((item) => item.unitPrice !== undefined);

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "theme-light bg-surface text-fg border-border mx-auto w-full max-w-[860px] min-w-0 rounded-2xl border p-5 shadow-lg md:p-12",
        "print:max-w-none! print:rounded-none! print:border-0! print:p-0! print:shadow-none! print:[print-color-adjust:exact]",
        className,
      )}
      data-billing-document=""
    >
      <header className="flex break-inside-avoid flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="bg-brand text-on-brand grid size-10 shrink-0 place-items-center rounded-[10px] text-xl font-bold"
          >
            {brandName.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xl leading-tight font-bold break-words">
              {brandName}
            </p>
            {issuerName ? (
              <p className="text-caption text-fg-subtle font-normal break-words">
                {issuerName}
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid min-w-0 justify-items-start gap-1 sm:justify-items-end sm:text-right">
          <h2
            className="text-[28px] leading-tight font-semibold tracking-[0.04em] uppercase"
            id={titleId}
          >
            {title}
          </h2>
          <p className="text-small text-fg-subtle">
            {numberLabel}{" "}
            <span className="text-fg font-mono break-all">{number}</span>
          </p>
          {status ? (
            <Badge className="mt-1" tone={status.tone}>
              {status.label}
            </Badge>
          ) : null}
        </div>
      </header>

      {highlight ? (
        <div className="mt-7 break-inside-avoid">
          <p className={sectionLabel}>{highlight.label}</p>
          <p className="mt-1 text-[32px] leading-tight font-semibold tracking-[-0.01em] break-words">
            {highlight.value}
          </p>
          {highlight.detail ? (
            <p className="text-small text-fg-muted mt-1">{highlight.detail}</p>
          ) : null}
        </div>
      ) : null}

      {parties.length > 0 ? (
        <div className="mt-8 flex break-inside-avoid flex-wrap gap-x-8 gap-y-6">
          {parties.map((party) => (
            <section
              className="min-w-0 flex-[1_1_220px]"
              key={party.id ?? party.label}
            >
              <h3 className={cn(sectionLabel, "mb-1.5")}>{party.label}</h3>
              <address className="text-label leading-[22px] not-italic">
                <span className="block font-semibold break-words">
                  {party.name}
                </span>
                {(party.lines ?? []).map((line, index) => (
                  <span
                    className="text-fg-subtle block break-words"
                    key={`${index}-${line}`}
                  >
                    {line}
                  </span>
                ))}
              </address>
            </section>
          ))}
        </div>
      ) : null}

      {facts.length > 0 ? (
        <dl className="border-border bg-surface-2 mt-7 flex break-inside-avoid flex-wrap overflow-hidden rounded-lg border">
          {facts.map((fact) => (
            <div
              className="border-border -mr-px -mb-px min-w-0 flex-[1_1_140px] border-r border-b px-4 py-3"
              key={fact.id ?? fact.label}
            >
              <dt className={sectionLabel}>{fact.label}</dt>
              <dd
                className={cn(
                  "text-label mt-1 font-medium break-words",
                  fact.mono && "font-mono break-all",
                )}
              >
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <table className="text-label mt-7 w-full border-collapse">
        <caption className="sr-only">{lineItemsCaption}</caption>
        <thead className="max-sm:sr-only">
          <tr>
            <th
              className={cn(
                sectionLabel,
                "border-border border-b py-2.5 text-left",
              )}
              scope="col"
            >
              Description
            </th>
            {showQuantity ? (
              <th
                className={cn(
                  sectionLabel,
                  "border-border border-b py-2.5 pl-3 text-right",
                )}
                scope="col"
              >
                Qty
              </th>
            ) : null}
            {showUnitPrice ? (
              <th
                className={cn(
                  sectionLabel,
                  "border-border border-b py-2.5 pl-3 text-right",
                )}
                scope="col"
              >
                Unit price
              </th>
            ) : null}
            <th
              className={cn(
                sectionLabel,
                "border-border border-b py-2.5 pl-3 text-right",
              )}
              scope="col"
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr
              className="border-border break-inside-avoid border-b max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-4 max-sm:py-3.5"
              data-line-item={item.id}
              key={item.id}
            >
              <td className="min-w-0 py-3.5 align-top max-sm:py-0">
                <span className="block font-medium break-words">
                  {item.description}
                </span>
                {item.detail ? (
                  <span className="text-caption text-fg-subtle block font-normal break-words">
                    {item.detail}
                  </span>
                ) : null}
                <MobileUnitLine item={item} />
              </td>
              {showQuantity ? (
                <td className="py-3.5 pl-3 text-right align-top whitespace-nowrap max-sm:hidden">
                  {item.quantity ?? ""}
                </td>
              ) : null}
              {showUnitPrice ? (
                <td className="py-3.5 pl-3 text-right align-top whitespace-nowrap max-sm:hidden">
                  {item.unitPrice ?? ""}
                </td>
              ) : null}
              <td className="py-3.5 pl-3 text-right align-top font-medium whitespace-nowrap max-sm:py-0">
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totals.length > 0 ? (
        <div className="mt-4 flex break-inside-avoid justify-end">
          <dl className="w-full max-w-[320px]">
            {totals.map((total) => (
              <div
                className={cn(
                  "flex justify-between gap-4",
                  total.emphasis === "total" || total.emphasis === "balance"
                    ? "border-border mt-1.5 border-t pt-2.5 font-semibold"
                    : "text-label text-fg-muted py-1.5",
                  total.emphasis === "total" && "text-base",
                  total.emphasis === "balance" && "text-xl",
                )}
                data-total={total.emphasis ?? "default"}
                key={total.id ?? total.label}
              >
                <dt>{total.label}</dt>
                <dd
                  className={cn(
                    "text-right whitespace-nowrap",
                    (total.emphasis ?? "default") === "default" && "text-fg",
                  )}
                >
                  {total.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {notice ? (
        <div
          className={cn(
            "text-small mt-6 break-inside-avoid rounded-lg px-4 py-3.5 break-words",
            noticeTones[notice.tone],
          )}
          data-notice={notice.tone}
        >
          {notice.content}
        </div>
      ) : null}

      {footerNotes.length > 0 || footerDetails.length > 0 ? (
        <footer className="border-border text-caption text-fg-subtle mt-9 flex break-inside-avoid flex-wrap justify-between gap-6 border-t pt-5 leading-[18px] font-normal">
          <div className="max-w-[420px] min-w-0">
            {footerNotes.map((line, index) => (
              <p className="break-words" key={`${index}-${line}`}>
                {line}
              </p>
            ))}
          </div>
          <div className="min-w-0 sm:text-right">
            {footerDetails.map((line, index) => (
              <p className="break-words" key={`${index}-${line}`}>
                {line}
              </p>
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}

/**
 * Phones hide the quantity and unit-price columns; this line repeats them
 * under the description so no supplied value is lost.
 */
function MobileUnitLine({ item }: Readonly<{ item: BillingDocumentLineItem }>) {
  const parts = [
    item.quantity !== undefined ? `Qty ${item.quantity}` : undefined,
    item.unitPrice !== undefined ? `Unit price ${item.unitPrice}` : undefined,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <span className="text-caption text-fg-subtle block font-normal sm:hidden">
      {parts.join(" · ")}
    </span>
  );
}
