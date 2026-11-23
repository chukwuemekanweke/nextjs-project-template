---
type: domain
title: Subscriptions and Billing
description:
  Backend-authoritative plans, idempotent checkout, purchase-status polling,
  billing dashboard, and period-end cancellation
resource: okf://knowledge/domains/subscriptions
tags: [constraint, domain, subscriptions, billing, payments, idempotency]
governance: constraint
code_refs:
  [
    packages/api-client/src/subscriptions/**,
    packages/api-react/src/subscriptions/**,
    packages/ui-core/src/formatting/**,
    apps/public-portal/src/components/subscription-pricing.tsx,
    apps/public-portal/src/lib/subscription-pricing.ts,
    apps/public-portal/src/lib/subscription-plans.ts,
    apps/user-portal/src/app/billing/**,
    apps/user-portal/src/app/api/billing/**,
    apps/user-portal/src/config/billing.ts,
    apps/user-portal/src/lib/billing-*.ts,
    apps/user-portal/src/lib/checkout-*.ts,
    apps/user-portal/src/lib/payment-return.ts,
    apps/user-portal/src/lib/use-checkout-attempt.ts,
  ]
sources:
  - kind: file
    path: docs/architecture/11-subscriptions-and-billing.md
  - kind: file
    path: packages/api-client/src/subscriptions/contracts.ts
generated: { at: "2026-11-23T00:00:00Z", by: human }
status: stable
---

The backend owns plans, prices, currencies, intervals, provider eligibility,
purchases, payment outcomes, activation, renewals, cancellation, and history.
The frontend never computes amounts, dates, or entitlements. Amounts are whole
minor units on the wire; format them only with `formatMinorUnits`
(`@template/ui-core`), which uses decimal strings, not floating point.

- `api-client/src/subscriptions` holds handwritten contracts and the seven
  customer operations. Owner-scoped calls take `BillingAccountOwnerType`
  (`Stakeholder` | `Tenant`), never a BillingAccount id.
  `purchaseSubscription(request, idempotencyKey)` sets `Idempotency-Key`.
- `api-react/src/subscriptions` nests every customer key under
  `["subscriptions", "owner", ownerType]`. Current subscription maps `404` to
  `null`. Purchase-status polling uses `refetchInterval` while
  `shouldContinuePolling`, bounded by `maxPolls`; `pollingExhausted` is a
  processing state, not a failure. Invalidate only the owner's purchases,
  current subscription, and billing history.
- User Portal owner type comes only from `resolveBillingOwnerType()`
  (`Stakeholder`). Authenticated operations go through per-operation BFF
  routes under `/api/billing`, rewritten in `browser-api.ts`; User Portal plans
  go directly to the API.
- Public Portal plans load in Server Components (`loadSubscriptionPlans`,
  anonymous server client, data cache `revalidate: 60`, tag
  `subscription-plans`). Pages call `connection()` so builds never hit the API;
  no browser CORS is needed. Load failures render an unavailable state.
- One checkout attempt (selection, UUID key, purchase id) lives in
  `localStorage`, shared across tabs so a hosted checkout can return in a new
  tab. Reuse the key for identical unsettled retries; new key for any changed
  field, settled attempt, or definitive 400/403/404/409. Keep it on network,
  timeout, 5xx, 401, and 429. The submitter also holds its unresolved attempt
  in memory and discards only by matching key, so tabs cannot clobber each
  other's retries. It is navigation state only; logout clears it.
- Navigate only to a backend `paymentLink` that is absolute HTTPS. Render
  documented `BankTransfer` fields. Do not invent `Card` or other flows.
- Provider returns land on `/billing/checkout/success`, `/cancelled`, or the
  hint-free `/return`, all rendering `PaymentReturn`. Query parameters are
  ignored; the purchase id comes only from the remembered attempt, and the
  outcome only from purchase status via `resolvePaymentReturnView`
  (`lib/payment-return.ts`). The route is a wording hint: success needs
  `SubscriptionActive`/`Scheduled` (paid but unfulfilled is "activating"), a
  cancel return with no final payment state is "not completed", and confirmed
  outcomes replace the URL with the matching route. No context: recoverable
  state, never success, never a purchase.
- Bachs `success_url`/`cancel_url` come from backend config
  `Payments:Bachs:SuccessUrl`/`CancelUrl` (one value for all Bachs intents, no
  purchase id). Bachs cancellation is verified as `PaymentFailed`, so a cancel
  return plus `PaymentFailed` reads as cancelled. Backend gaps are listed in
  `docs/architecture/11-subscriptions-and-billing.md`.
- Public pricing CTAs link to User Portal `/billing/checkout?planId=`; the
  proxy and validated `returnTo` carry the plan through sign-in/registration.

Unsupported by the backend customer API: upgrades, downgrades, proration,
refunds, invoices/receipts, resume, and immediate cancellation. Do not add them
without backend endpoints.
