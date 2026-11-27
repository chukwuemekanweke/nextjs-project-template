import type {
  DocumentIssuer,
  DocumentLineItem,
  DocumentParty,
  UserInvoice,
  UserReceipt,
} from "./billing-documents-model";

/*
 * PREVIEW ONLY. Deterministic fixtures for the reference
 * `UserInvoiceDetail-*`, `UserReceiptDetail-*`, `PrintInvoice` and
 * `PrintReceipt` artboards, used by tests (the isolated harness for these
 * screens; there is no route). Fixed timestamps, obviously synthetic names,
 * numbers and references. They are not documents issued by the application
 * and must never be printed or shown as one: production modules must never
 * import this file, use it as a fallback for a failed request or expose it
 * behind a toggle; `billing-documents-screens.test.tsx` enforces the import
 * rule.
 */

export const FIXTURE_CURRENCY = "NGN";

export const fixtureIssuer: DocumentIssuer = {
  addressLines: ["1 Fixture Street", "Fixture City, Fixtureland"],
  email: null,
  name: "Fixture Issuer Ltd",
  registrationNumber: "FIX-RC-0001",
  taxNumber: "FIX-TAX-0001",
};

export const fixtureCustomer: DocumentParty = {
  addressLines: ["Fixture City, Fixtureland"],
  email: "customer@fixture.invalid",
  name: "Fixture Customer",
};

export const fixturePlanLine: DocumentLineItem = {
  amount: 1_395_349,
  description: "Fixture Standard plan",
  detail: "Monthly · 14 Jan 2026 – 14 Feb 2026",
  id: "line-1",
  quantity: 1,
  unitAmount: 1_395_349,
};

const capabilitiesOff = { downloadPdf: false, emailCopy: false } as const;

export function fixtureInvoice(
  overrides: Partial<UserInvoice> = {},
): UserInvoice {
  return {
    adjustments: [{ amount: 104_651, id: "tax-1", label: "VAT (7.5%)" }],
    amountDue: 1_500_000,
    amountPaid: null,
    billedTo: fixtureCustomer,
    capabilities: { ...capabilitiesOff, pay: false },
    currencyCode: FIXTURE_CURRENCY,
    dueAtUtc: "2026-01-21T00:00:00Z",
    id: "inv-fixture-0142",
    invoiceNumber: "FIX-INV-0142",
    issuedAtUtc: "2026-01-14T09:58:00Z",
    issuer: fixtureIssuer,
    lineItems: [fixturePlanLine],
    notes: ["FIXTURE: notes appear here exactly as the backend returns them."],
    payment: null,
    periodEndUtc: "2026-02-14T00:00:00Z",
    periodStartUtc: "2026-01-14T00:00:00Z",
    status: "Due",
    subtotal: 1_395_349,
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

/** Enough line items to span more than one printed page. */
export const fixtureLongInvoice = fixtureInvoice({
  lineItems: Array.from({ length: 40 }, (_, index) => ({
    amount: 100_000 + index,
    description: `Fixture line item ${index + 1}`,
    detail: "FIXTURE: a secondary description line",
    id: `line-${index + 1}`,
    quantity: index + 1,
    unitAmount: 100_000,
  })),
});

export function fixtureReceipt(
  overrides: Partial<UserReceipt> = {},
): UserReceipt {
  return {
    adjustments: [{ amount: 104_651, id: "tax-1", label: "VAT (7.5%)" }],
    amountPaid: 1_500_000,
    capabilities: capabilitiesOff,
    currencyCode: FIXTURE_CURRENCY,
    id: "rct-fixture-0331",
    invoice: { id: "inv-fixture-0142", invoiceNumber: "FIX-INV-0142" },
    issuer: fixtureIssuer,
    kind: "subscription",
    lineItems: [
      {
        ...fixturePlanLine,
        detail:
          "Monthly · 14 Jan 2026 – 14 Feb 2026 · for invoice FIX-INV-0142",
      },
    ],
    notes: ["FIXTURE: receipt notes appear here as returned."],
    paidAtUtc: "2026-01-14T10:01:00Z",
    payer: fixtureCustomer,
    paymentMethod: "Fixture Provider · card",
    paymentReference: "FIXPAY-8812",
    receiptNumber: "FIX-RCT-0331",
    status: "Paid",
    subtotal: 1_395_349,
    totalPaid: 1_500_000,
    walletTransaction: null,
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
  walletTransaction: { reference: "FIX-WTX-21F9" },
});
