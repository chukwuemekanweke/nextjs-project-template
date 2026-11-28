import type {
  AdminDetailState,
  AdminListState,
} from "../admin-billing-shared/billing-model";
import type {
  AdminInvoiceDetail,
  AdminInvoiceRow,
  AdminInvoiceSummary,
} from "./invoices-model";

/*
 * PREVIEW ONLY. Deterministic fixtures for the admin invoice screens, used
 * only by tests (the isolated harness for these screens and for FE-UI-016;
 * there is no route). Obviously synthetic customers, numbers and references.
 * Production modules must never import this file
 * (`features/admin-preview-boundaries.test.ts` enforces it).
 */

function row(
  index: number,
  overrides: Partial<AdminInvoiceRow> = {},
): AdminInvoiceRow {
  const number = String(140 + index).padStart(4, "0");
  return {
    currencyCode: "NGN",
    customerEmail: `customer${index}@fixture.invalid`,
    customerId: `user-fixture-${index}`,
    customerName: `Fixture Customer ${index}`,
    dueAtUtc: `2026-01-${String(17 + index).padStart(2, "0")}T00:00:00Z`,
    id: `inv-fixture-${index}`,
    invoiceNumber: `FIX-INV-${number}`,
    issuedAtUtc: `2026-01-${String(10 + index).padStart(2, "0")}T09:58:00Z`,
    planLabel: "Fixture Standard · monthly",
    receiptNumber: `FIX-RCT-${number}`,
    status: "Paid",
    total: 1_500_000,
    ...overrides,
  };
}

const rows: readonly AdminInvoiceRow[] = [
  row(1),
  row(2, { receiptNumber: null, status: "Due" }),
  row(3, { receiptNumber: null, status: "Overdue" }),
  row(4, { receiptNumber: null, status: "Void" }),
  row(5, {
    customerEmail: null,
    customerName: null,
    dueAtUtc: null,
    planLabel: null,
  }),
  row(6, { status: "ProviderReview" }),
];

export function fixtureInvoiceList(
  list: readonly AdminInvoiceRow[] = rows,
): AdminListState<AdminInvoiceRow> {
  return {
    page: 1,
    pageSize: 20,
    rows: list,
    state: "ready",
    totalItems: list.length,
    totalPages: 1,
  };
}

const unavailable = {
  reason: "Not reported by the backend.",
  state: "unavailable",
} as const;

export const unavailableInvoiceSummary: AdminInvoiceSummary = {
  collected: unavailable,
  invoiced: unavailable,
  outstanding: unavailable,
  overdue: unavailable,
};

export const fixtureInvoiceSummary: AdminInvoiceSummary = {
  collected: { state: "ready", value: "NGN 61,000.00" },
  invoiced: {
    context: "FIXTURE · 6 invoices",
    state: "ready",
    value: "NGN 64,000.00",
  },
  outstanding: { state: "ready", value: "NGN 2,120.00" },
  overdue: { state: "ready", value: "NGN 950.00" },
};

export function fixtureInvoiceDetail(
  overrides: Partial<AdminInvoiceDetail> = {},
): AdminInvoiceDetail {
  return {
    ...row(2),
    adjustments: [{ amount: 104_651, id: "tax-1", label: "VAT (7.5%)" }],
    amountDue: 0,
    amountPaid: 1_500_000,
    billedTo: {
      addressLines: ["Fixture City, Fixtureland"],
      email: "customer2@fixture.invalid",
      name: "Fixture Customer 2",
    },
    history: [
      { atUtc: "2026-01-12T10:02:00Z", id: "h-3", label: "Receipt emailed" },
      {
        atUtc: "2026-01-12T10:01:00Z",
        id: "h-2",
        label: "Marked paid",
        source: "Provider webhook",
      },
      { atUtc: "2026-01-12T09:58:00Z", id: "h-1", label: "Invoice issued" },
    ],
    issuer: {
      addressLines: ["1 Fixture Street", "Fixture City, Fixtureland"],
      email: null,
      name: "Fixture Issuer Ltd",
    },
    issuerLegalLines: ["Fixture Issuer Ltd · Registration no. FIX-RC-0001"],
    lineItems: [
      {
        amount: 1_395_349,
        description: "Fixture Standard plan",
        detail: "Monthly · 12 Jan 2026 – 12 Feb 2026",
        id: "line-1",
        quantity: 1,
        unitAmount: 1_395_349,
      },
    ],
    notes: ["FIXTURE: notes appear here exactly as supplied."],
    payment: {
      method: "Fixture Provider · card",
      paidAtUtc: "2026-01-12T10:01:00Z",
      paymentId: "pay-fixture-2",
      reference: "FIXPAY-0002",
    },
    periodEndUtc: "2026-02-12T00:00:00Z",
    periodStartUtc: "2026-01-12T00:00:00Z",
    receiptNumber: "FIX-RCT-0142",
    status: "Paid",
    subscriptionId: "sub-fixture-2",
    subtotal: 1_395_349,
    ...overrides,
  };
}

/** Every list state, by name, for the browser harness and FE-UI-016. */
export const invoiceListPreviews: Readonly<
  Record<string, AdminListState<AdminInvoiceRow>>
> = {
  empty: fixtureInvoiceList([]),
  error: { state: "error" },
  forbidden: { permission: "invoices.read", state: "forbidden" },
  loading: { state: "loading" },
  ready: fixtureInvoiceList(),
  unavailable: {
    reason: "The backend has no invoice API yet.",
    state: "unavailable",
  },
};

/** Every detail state, by name. */
export const invoiceDetailPreviews: Readonly<
  Record<string, AdminDetailState<AdminInvoiceDetail>>
> = {
  due: {
    record: fixtureInvoiceDetail({
      amountPaid: null,
      amountDue: 1_500_000,
      payment: null,
      receiptNumber: null,
      status: "Due",
    }),
    state: "ready",
  },
  error: { state: "error" },
  forbidden: { permission: "invoices.read", state: "forbidden" },
  loading: { state: "loading" },
  notFound: { state: "notFound" },
  overdue: {
    record: fixtureInvoiceDetail({
      amountPaid: null,
      amountDue: 1_500_000,
      payment: null,
      receiptNumber: null,
      status: "Overdue",
    }),
    state: "ready",
  },
  paid: { record: fixtureInvoiceDetail(), state: "ready" },
  unavailable: {
    reason: "The backend has no invoice API yet.",
    state: "unavailable",
  },
};
