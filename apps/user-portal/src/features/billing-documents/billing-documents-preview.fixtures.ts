import type {
  DocumentParty,
  DocumentReadState,
  UserInvoice,
  UserReceipt,
} from "./billing-documents-model";

/*
 * PREVIEW ONLY. Deterministic fixtures for the reference
 * `UserInvoiceDetail-*`, `UserReceiptDetail-*`, `PrintInvoice` and
 * `PrintReceipt` artboards, used only by tests (the isolated harness for
 * these screens and for FE-UI-016; there is no route). Obviously synthetic
 * names, numbers and references; never a document issued by the application.
 * Production modules must never import this file
 * (`billing-documents-screens.test.tsx` enforces it).
 */

const issuer: DocumentParty = {
  addressLines: ["1 Fixture Street", "Fixture City, Fixtureland"],
  email: null,
  name: "Fixture Issuer Ltd",
};

const customer: DocumentParty = {
  addressLines: ["Fixture City, Fixtureland"],
  email: "customer@fixture.invalid",
  name: "Fixture Customer",
};

const common = {
  adjustments: [{ amount: 104_651, id: "tax-1", label: "VAT (7.5%)" }],
  currencyCode: "NGN",
  issuer,
  issuerLegalLines: [
    "Fixture Issuer Ltd · Registration no. FIX-RC-0001",
    "Tax no. FIX-TAX-0001 · 1 Fixture Street, Fixture City",
  ],
  notes: ["FIXTURE: notes appear here exactly as supplied."],
  subtotal: 1_395_349,
} as const;

const planLine = {
  amount: 1_395_349,
  description: "Fixture Standard plan",
  detail: "Monthly · 14 Jan 2026 – 14 Feb 2026",
  id: "line-1",
  quantity: 1,
  unitAmount: 1_395_349,
};

export function fixtureInvoice(
  overrides: Partial<UserInvoice> = {},
): UserInvoice {
  return {
    ...common,
    amountDue: 1_500_000,
    amountPaid: null,
    billedTo: customer,
    dueAtUtc: "2026-01-21T00:00:00Z",
    id: "inv-fixture-0142",
    invoiceNumber: "FIX-INV-0142",
    issuedAtUtc: "2026-01-14T09:58:00Z",
    lineItems: [planLine],
    payment: null,
    periodEndUtc: "2026-02-14T00:00:00Z",
    periodStartUtc: "2026-01-14T00:00:00Z",
    status: "Due",
    total: 1_500_000,
    ...overrides,
  };
}

export const fixtureDueInvoice = fixtureInvoice();

export const fixtureOverdueInvoice = fixtureInvoice({ status: "Overdue" });

export const fixturePaidInvoice = fixtureInvoice({
  amountDue: 0,
  amountPaid: 1_500_000,
  payment: {
    method: "Fixture Provider · card",
    paidAtUtc: "2026-01-14T10:01:00Z",
    receiptId: "rct-fixture-0331",
    receiptNumber: "FIX-RCT-0331",
    reference: "FIXPAY-8812",
  },
  status: "Paid",
});

/** Enough line items to span several printed pages. */
export const fixtureLongInvoice = fixtureInvoice({
  lineItems: Array.from({ length: 40 }, (_, index) => ({
    amount: 100_000,
    description: `Fixture line item ${index + 1}`,
    detail: "FIXTURE: a secondary description line",
    id: `line-${index + 1}`,
    quantity: 1,
    unitAmount: 100_000,
  })),
});

export function fixtureReceipt(
  overrides: Partial<UserReceipt> = {},
): UserReceipt {
  return {
    ...common,
    amountPaid: 1_500_000,
    id: "rct-fixture-0331",
    invoice: { id: "inv-fixture-0142", invoiceNumber: "FIX-INV-0142" },
    kind: "subscription",
    lineItems: [
      { ...planLine, detail: `${planLine.detail} · for invoice FIX-INV-0142` },
    ],
    paidAtUtc: "2026-01-14T10:01:00Z",
    payer: customer,
    paymentMethod: "Fixture Provider · card",
    paymentReference: "FIXPAY-8812",
    receiptNumber: "FIX-RCT-0331",
    status: "Paid",
    totalPaid: 1_500_000,
    walletReference: null,
    ...overrides,
  };
}

export const fixtureSubscriptionReceipt = fixtureReceipt();

export const fixtureWalletReceipt = fixtureReceipt({
  adjustments: [{ amount: 0, id: "fee-1", label: "Fees" }],
  amountPaid: 2_000_000,
  id: "rct-fixture-0352",
  invoice: null,
  kind: "wallet",
  lineItems: [
    {
      amount: 2_000_000,
      description: "Wallet top-up",
      detail: "NGN wallet · reference FIX-WTX-21F9",
      id: "line-1",
      quantity: 1,
      unitAmount: 2_000_000,
    },
  ],
  paidAtUtc: "2026-01-24T14:21:00Z",
  paymentMethod: "Fixture Provider · bank transfer",
  paymentReference: "FIXPAY-9921",
  receiptNumber: "FIX-RCT-0352",
  subtotal: 2_000_000,
  totalPaid: 2_000_000,
  walletReference: "FIX-WTX-21F9",
});

/** Every invoice state, by name, for the browser harness and FE-UI-016. */
export const invoicePreviews: Readonly<
  Record<string, DocumentReadState<UserInvoice>>
> = {
  due: { document: fixtureDueInvoice, state: "ready" },
  error: { state: "error" },
  loading: { state: "loading" },
  long: { document: fixtureLongInvoice, state: "ready" },
  notFound: { state: "notFound" },
  overdue: { document: fixtureOverdueInvoice, state: "ready" },
  paid: { document: fixturePaidInvoice, state: "ready" },
  unavailable: { state: "unavailable" },
};

/** Every receipt state, by name. */
export const receiptPreviews: Readonly<
  Record<string, DocumentReadState<UserReceipt>>
> = {
  error: { state: "error" },
  loading: { state: "loading" },
  notFound: { state: "notFound" },
  subscription: { document: fixtureSubscriptionReceipt, state: "ready" },
  unavailable: { state: "unavailable" },
  wallet: { document: fixtureWalletReceipt, state: "ready" },
};
