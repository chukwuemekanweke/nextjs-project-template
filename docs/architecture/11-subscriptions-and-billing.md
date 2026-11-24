# Subscriptions and billing

The frontend presents the customer subscription journey implemented by the backend's subscription billing API (backend PR #80, `docs/architecture/subscription-billing-api.md` in the backend repository). The backend is authoritative for plans, prices, currencies, intervals, payment-provider eligibility, purchases, payment outcomes, activation, renewals, cancellation, and billing history. The frontend owns presentation, API integration, user interaction, cache state, and navigation. It never computes prices, dates, or entitlements.

```mermaid
flowchart LR
  pricing[Public Portal /pricing] -->|planId| checkout[User Portal /billing/checkout]
  checkout -->|unauthenticated| signin[/sign-in?returnTo=.../]
  signin --> checkout
  checkout -->|POST purchase + Idempotency-Key| bff[User Portal /api/billing BFF]
  bff --> api[(Backend API)]
  checkout -->|PaymentLink| provider[Hosted checkout e.g. Bachs]
  provider -->|success_url| ok[/billing/checkout/success]
  provider -->|cancel_url| cancelled[/billing/checkout/cancelled]
  ok -->|poll| bff
  cancelled -->|poll| bff
  checkout -->|BankTransfer| status[/billing/purchases/:purchaseId]
  status -->|poll| bff
  status --> billing[/billing]
  billing -->|current, history, cancel| bff
```

## API client

`packages/api-client/src/subscriptions` follows the payments module layout (`contracts.ts`, `operations.ts`, `subscriptions.client.ts`, `index.ts`) and is exported as `@template/api-client/subscriptions` and as `api.subscriptions` on the aggregate client. Contracts preserve backend camelCase names and nullability. Monetary fields (plan `prices[].price`, `planPrice`, `amount`) stay in whole minor currency units. A plan is a package that offers one price per billing interval in `prices` (monthly and yearly are the same plan). Read prices through `subscriptionPlanPrices`, `findSubscriptionPlanPrice`, and `defaultSubscriptionPlanPrice` (preferred interval, else `Monthly`, else first); they also accept the legacy single `price`/`billingInterval` shape while backends migrate. Plan `description` and `features` are card content configured in the backend; they never affect price, interval, or entitlement. `PurchaseSubscriptionMutationRequest` requires the chosen `billingInterval`. Enumerated response fields are typed as `string` because the backend may add values; the module exports the documented literal lists (`subscriptionPurchaseStatuses`, `subscriptionLifecycleStatuses`, `subscriptionPaymentMethodTypes`, `subscriptionBillingIntervals`, `billingAccountOwnerTypes`) for presentation code to narrow against.

| Operation                       | Route                                                           |
| ------------------------------- | --------------------------------------------------------------- |
| `listSubscriptionPlans`         | `GET /api/v1/subscription-plans` (anonymous)                    |
| `listEligiblePaymentProviders`  | `GET /api/v1/subscription-plans/{planId}/payment-providers`     |
| `purchaseSubscription`          | `POST /api/v1/subscriptions/purchases`                          |
| `getSubscriptionPurchaseStatus` | `GET /api/v1/subscriptions/purchases/{purchaseId}`              |
| `getCurrentSubscription`        | `GET /api/v1/subscriptions/current`                             |
| `getBillingHistory`             | `GET /api/v1/subscriptions/billing-history`                     |
| `cancelSubscriptionAtPeriodEnd` | `POST /api/v1/subscriptions/current/cancellation-at-period-end` |

Owner-scoped operations take a `BillingAccountOwnerType` (`Stakeholder` or `Tenant`) query parameter or body field. No operation accepts a BillingAccount id; the backend derives the account from the authenticated actor. `purchaseSubscription(request, idempotencyKey)` requires a non-empty UUID and always sets the `Idempotency-Key` header itself.

## Billing owner context

The User Portal resolves the owner type in one place, `resolveBillingOwnerType()` in `apps/user-portal/src/config/billing.ts`. It returns `Stakeholder`: User Portal billing is personal. A product that bills the tenant organization changes that resolution; the backend remains responsible for authorizing who may act for a tenant-owned account.

## BFF routing

Authenticated subscription operations run through same-origin Route Handlers under `apps/user-portal/src/app/api/billing/**`, one handler per operation, using the request-scoped server client so the HttpOnly access token never reaches browser JavaScript. `createUserPortalBrowserApi` rewrites only those six backend paths (matched from `subscriptionsOperations`) to `/api/billing/...`, preserving the query string and headers, so `sessionFetch` refresh coordination applies. Handlers validate the owner type, forward only documented purchase fields, require a valid `Idempotency-Key`, and return failures through `apiRouteError`. The public plan list is called directly against the API, like reference data.

## React Query integration

`packages/api-react/src/subscriptions` provides keys, query/mutation options, and hooks: `useSubscriptionPlans` (used by the User Portal plan picker and checkout), `useEligiblePaymentProviders`, `usePurchaseSubscription`, `useSubscriptionPurchaseStatus`, `useCurrentSubscription`, `useBillingHistory`, and `useCancelSubscriptionAtPeriodEnd`.

```ts
subscriptionKeys.plans(); // ["subscriptions", "plans"]
subscriptionKeys.current("Stakeholder"); // ["subscriptions", "owner", "Stakeholder", "current"]
subscriptionKeys.purchaseStatus("Stakeholder", id);
subscriptionKeys.billingHistory("Stakeholder", { page: 2, pageSize: 20 });
```

Every customer key is nested under the owner scope, so Tenant and Stakeholder data never share cache entries. Logout clears the whole query cache. `currentSubscriptionQueryOptions` maps the backend's `404` to `null`, an expected empty state. Billing history keeps previous page data while the next page loads.

Invalidation is narrow: a successful purchase invalidates the owner's purchases, current subscription, and billing history; cancellation invalidates only the owner's current subscription; when the status hook observes a settled purchase (`isTerminal`) it refreshes the owner's current subscription and billing history. Mutations never retry automatically.

## Pricing and authentication handoff

The Public Portal loads plans on the server. The `/` and `/pricing` Server Components call `loadSubscriptionPlans()` (`src/lib/subscription-plans.ts`), which uses an anonymous request-scoped server client (`src/lib/server-api.ts`, runtime `API_BASE_URL` and `TENANT_ID`) and a Next.js data-cache request (`revalidate: 60`, tag `subscription-plans`). Both pages call `connection()` so they render per request and `next build` never contacts the API; the cached plan response keeps that cheap. A failed load becomes an `unavailable` result rendered as an error message rather than a failed page. Because the browser never calls the API, no CORS rule is needed for the Public Portal. `SubscriptionPricing` maps each plan into the existing `public-ui` `Pricing` section (`toPricePlan`), with empty and error placeholders. Each plan is shown at its default interval (Monthly when offered); plans offering no price are skipped. Prices are formatted from minor units, and the CTA links to `{NEXT_PUBLIC_USER_PORTAL_URL}/billing/checkout?planId={id}&billingInterval={interval}`. API `description`/`features` win over local marketing copy. Optional marketing copy lives in `planMarketing` in `site.ts`, keyed by plan `code`; it never supplies prices, currencies, intervals, or entitlements, and it is empty by default.

The checkout route is protected by the User Portal proxy, so an unauthenticated visitor is redirected to `/sign-in?returnTo=/billing/checkout?planId=...` by the existing `createSignInRedirectUrl` mechanism. `safeSignInDestination` keeps only same-origin relative paths. The sign-in page's register link, the registration form's sign-in links, and the registration → email confirmation redirect all carry the validated `returnTo` (`createRegistrationHref`, `createSignInHref`, `createEmailConfirmationDestination`), so a selected plan survives sign-in, registration, email confirmation, two-factor, and passkey setup.

## Checkout

`/billing/checkout?planId={id}` validates the id format and otherwise shows a plan picker (also the "back to plans" path inside the User Portal). `CheckoutView` finds the plan in the backend plan list, discovers eligible providers for that plan and owner type, and lets the user choose a billing interval (shown only when the plan offers more than one), a provider, and auto-renewal. The interval comes from the explicit choice, then a `billingInterval` query value the plan offers, then the remembered attempt, then the plan default; unoffered values are ignored, and a plan with no prices falls back to the plan picker. The BFF forwards `billingInterval` and rejects purchases without one. Providers whose payment method this portal cannot complete (currently `Card`) are listed but disabled. The amount and currency are never user input.

### Idempotency-key lifecycle

`lib/checkout-attempt.ts` keeps one logical checkout attempt in `localStorage` (`user-portal.subscription-checkout`): plan, provider, owner type, auto-renew, idempotency key, creation time, and, once accepted, the purchase id. It holds no credentials and is navigation/retry state only; the backend only returns a purchase to its owner. Using `localStorage` lets a hosted checkout return in a new tab, or after the original tab was closed, and still find its purchase. `useRememberedCheckoutAttempt` listens for `storage` events so open tabs stay in sync.

- `resolveCheckoutAttempt` reuses the stored key when the selection is identical and the attempt is not settled; any changed field (plan, interval, provider, owner type, auto-renewal) creates a new UUID. Attempts stored without an interval are discarded.
- `createCheckoutSubmitter` ignores submissions while one is in flight (usability only; the backend enforces idempotency), stores the attempt before sending, and records the purchase id on success. An exact replay returns the original purchase, which the UI continues with.
- Because every tab shares the record, the submitter also keeps an attempt whose outcome is unknown (sent, no purchase id yet) in memory. A retry in that tab replays its own key even if another tab has started a different checkout since, and a rejection only removes the stored attempt if it still has the rejected key (`store.discard(key)`). Two tabs submitting the same selection share one key, so they cannot create two purchases.
- Network failures, timeouts, 5xx, 401, and 429 keep the key so a retry replays the same request. Definitive rejections (400, 403, 404, 409) discard the attempt so the next deliberate submission gets a new key. A `409` is shown as a conflict with an existing subscription or earlier checkout.
- After the backend reports a settled purchase, the status page marks the attempt settled; its key is never reused. Attempts older than 24 hours are discarded. Logout clears the attempt.
- An interrupted, unsettled attempt for the same plan restores its selection on the checkout page and links to its status before the user pays again. Submitting the same selection replays the same key, so the backend returns the original purchase (and its payment link) rather than creating another.
- A settled attempt for the same plan (for example after "Return to checkout" from a cancelled payment) only pre-selects its provider and auto-renew choice; submitting it creates a new attempt and key.
- When the selected provider reports `supportsRecurringPayments: false`, the page warns and the order summary does not promise automatic renewal. The user's choice is still sent unchanged.

### Payment instructions and hosted checkout

`checkoutOutcomeFor` maps the purchase response:

- `PaymentLink`: navigate only to `instructionFields.paymentLink`, and only if it is an absolute `https:` URL without credentials (`safePaymentLink`).
  - `submitAndFollowCheckout` navigates once from the submit handler, not from a render effect, so re-renders cannot repeat it. Ignored duplicate submissions and failures never navigate.
  - While the browser leaves, `ProviderRedirect` shows "Taking you to {provider}" with no merchant reference, status link, or polling.
  - A "Continue to {provider}" link to the same backend URL appears only after 4 seconds, as a fallback.
  - A missing or unsafe link is treated as `unsupported`, with a "couldn't open the checkout page" message, the reference, and a status link.
- `BankTransfer`: render the documented `bankName`, `accountName`, `accountNumber`, and `providerReference` fields, the plan amount, expiry, and merchant reference, with a link to the status page.
- Anything else, or an invalid link: show a "cannot be completed in this portal" message with the reference and a status link. No provider URL is constructed.

### Return from hosted checkout

Bachs checkout sessions carry two optional redirect fields, `success_url` and `cancel_url`. The backend fills them from its own configuration (`Payments:Bachs:SuccessUrl` / `Payments:Bachs:CancelUrl`, environment variables `Payments__Bachs__SuccessUrl` / `Payments__Bachs__CancelUrl`, exposed in the backend compose file as `BACHS_SUCCESS_URL` / `BACHS_CANCEL_URL`). They are static per backend deployment; the purchase API does not accept return URLs. Set them per environment to the User Portal origin:

```text
Payments__Bachs__SuccessUrl=https://<user-portal-origin>/billing/checkout/success
Payments__Bachs__CancelUrl=https://<user-portal-origin>/billing/checkout/cancelled
```

Bachs rejects localhost and private-network redirect URLs, so local end-to-end returns need a public tunnel to the User Portal.

`/billing/checkout/success`, `/billing/checkout/cancelled`, and the hint-free `/billing/checkout/return` all render `PaymentReturn` (`app/billing/checkout/payment-return.tsx`). It:

1. Ignores every provider query parameter. The purchase id comes only from this browser's remembered checkout attempt, and only when the attempt's owner type matches. With no remembered purchase it shows a recoverable "We couldn't find your checkout" state linking to Billing and checkout. It never shows success and never purchases.
2. Reads the authoritative status with `useSubscriptionPurchaseStatus` (same polling policy as below; the hook invalidates the owner's current subscription and billing history once the purchase is terminal) and marks the attempt settled when `isTerminal`.
3. Maps status plus the route hint with `resolvePaymentReturnView` (`lib/payment-return.ts`). The hint only changes wording; it never overrides the backend:

| Backend status                                 | Success / return route         | Cancelled route                                         |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| `SubscriptionActive`, `SubscriptionScheduled`  | "Payment successful"           | "Payment successful" (URL replaced with `/success`)     |
| `PaymentSucceededFulfillmentPending`           | "Activating your subscription" | same                                                    |
| `PurchaseInitiated`, `PaymentPending`          | "Confirming your payment"      | "Payment not completed" (checkout can still be resumed) |
| `PaymentCancelled`                             | URL replaced with `/cancelled` | "Payment cancelled"                                     |
| `PaymentFailed`                                | "Payment failed"               | "Payment cancelled" (Bachs records cancel as a failure) |
| `PaymentExpired`                               | "Payment expired"              | same                                                    |
| `PaymentUnderpaid`, `FulfillmentBlocked`       | Needs attention + support      | same                                                    |
| `SubscriptionCancelled`, `SubscriptionExpired` | Subscription has since ended   | same                                                    |
| unknown                                        | Confirming; "Check again"      | same                                                    |

`canonicalPaymentReturnRoute` replaces the URL only for backend-confirmed success or cancellation, so a refresh shows the matching page. A polling timeout keeps the waiting state with "Check again" and states that it is not a failure. "Return to checkout" links to `/billing/checkout?planId=&billingInterval=` for the remembered plan and interval and never purchases by itself.

Session recovery uses the existing proxy: an expired access token is refreshed; without a valid session the proxy redirects to `/sign-in?returnTo=/billing/checkout/success…`, `safeSignInDestination` keeps only same-origin paths, and after sign-in the route re-reads the remembered attempt (session expiry does not clear it; logout does) and re-queries the backend.

The result pages share `PaymentResultCard` and `PaymentResultSummary` (`payment-result.tsx`). Amount and currency come from the purchase status; plan name and interval come from the backend plan list for the remembered plan id (the status response has neither) and are omitted if the plan is no longer listed.

## Purchase status and polling

`/billing/purchases/{purchaseId}` uses `useSubscriptionPurchaseStatus`. Its `refetchInterval` polls every 3 seconds only while the backend's `shouldContinuePolling` is true and stops after 40 successful reads or after a failed read (`nextPurchaseStatusPoll`). `pollingExhausted` reports a still-pending purchase at the bound; the page then shows a processing message ("this does not mean it failed") and a manual "Check again" button. A failed status read keeps the last confirmed state and offers a manual retry; it never starts a payment.

`describePurchaseStatus` maps normalized statuses to presentation:

| Status                                            | Presentation                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `PurchaseInitiated`, `PaymentPending`             | Waiting for payment (polling)                                        |
| `PaymentSucceededFulfillmentPending`              | Payment received, activation in progress (polling)                   |
| `SubscriptionActive`, `SubscriptionScheduled`     | Success; link to billing                                             |
| `PaymentFailed`/`Cancelled`/`Expired`/`Underpaid` | Unsuccessful payment; "Start a new checkout" for the remembered plan |
| `SubscriptionCancelled`, `SubscriptionExpired`    | The purchase's subscription has since ended                          |
| `FulfillmentBlocked`                              | Needs attention; support contact; explicitly not a payment failure   |
| anything else (for example `SubscriptionPending`) | Confirming; manual "Check again"                                     |

`isTerminal` only means polling has finished for this purchase; it is not read as loss of entitlement.

## Billing page

`/billing` (in the User Portal navigation) is the unified subscription entry point. `BillingOverview` (client) reads the owner's current subscription and selects one of three layouts. All rendering decisions live in `lib/billing-view.ts` (`resolveBillingView`, `resolvePlanLayout`, `resolveBillingHistoryPlacement`) so they are tested without rendering.

### Subscription state

| `GET /subscriptions/current` result                               | View           | Main content                                     |
| ----------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| Loading                                                           | `loading`      | Skeleton; never a "no subscription" state        |
| Network, `401`, `403`, `5xx`                                      | `error`        | Error alert with retry; plans are not offered    |
| `404` (mapped to `null`)                                          | `discovery`    | Plans (and history per the rules below)          |
| `lifecycleStatus` `Pending`                                       | `pending`      | Processing/recovery card, history when it exists |
| `Active`, `PastDue`, cancellation scheduled, `Scheduled`, unknown | `subscription` | Current subscription card, then billing history  |
| `Cancelled`/`Expired` (not returned today; defensive)             | `discovery`    | Plans                                            |

The backend returns only `Pending` or `Active` subscriptions from the current endpoint (Active first); ended subscriptions answer `404`, so the customer may buy again. A cancellation scheduled for period end is still an active entitlement and keeps the subscription view. Unknown lifecycle values are treated as an entitlement, never as permission to purchase. Plans are fetched only in the discovery view.

The pending card never links to checkout (the backend reserves the entitlement and rejects a conflicting purchase with `409`). It offers "View payment status" when this browser's remembered, unsettled checkout attempt is for the same plan, a "Check again" refetch, and a support contact.

### Plan layouts

`SubscriptionPlanGrid` renders backend plans in order, without filtering. One plan uses a centered card (`max-w-md`); two use two equal columns from `md`; three or more use the expanded grid (one column on mobile, two on tablet, three from `xl`, wrapping into more rows). Every layout uses the same pricing card (the three-plan design): a decorative icon (cycled by position, never implying a tier), name, description, formatted price, cadence, "Billed monthly/yearly", a divider, a feature checklist, and a "Choose plan" link to `/billing/checkout?planId={id}&billingInterval={interval}`. When the plans offer more than one interval, a Monthly/Yearly toggle (default Monthly) above the grid picks the price each card shows; a plan that does not offer the selected interval shows its own default; selection never starts a purchase. The checkout page's plan picker reuses the same grid.

All card content comes from `GET /subscription-plans`. `planCardContent` trims the backend `description` and `features` and drops blanks; when the backend sends none, the card omits them rather than substituting local copy. There is no tier pill or recommendation highlight because the API does not provide one.

### Billing-history visibility

| State                         | History                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| Subscription view             | Always inline (empty message when there are no records)                  |
| Pending                       | Inline when records exist                                                |
| Discovery, no records         | Hidden (no empty table)                                                  |
| Discovery, records, 0–2 plans | Inline below the plans                                                   |
| Discovery, records, 3+ plans  | Hidden from the page; "View billing history" links to `/billing/history` |

`/billing/history` renders the same `BillingHistoryCard` with its own pagination base path, so past payments remain reachable after a subscription is cancelled or expires. The discovery view reads history page 1 through the same query key the table uses, so no extra request is made.

### Current subscription card

The card shows plan name, a status badge from `lifecycleStatus` (raw `status` preserved in `data-subscription-status`), price and cadence, then current period start/end, next billing date (only when auto-renewing and not cancelling), auto-renewal, and, when cancelling, the effective and requested cancellation dates. `currentPeriodEndUtc`, `nextBillingAtUtc`, and `cancellationEffectiveAtUtc` are displayed separately and never derived from the interval. `PastDue` shows a renewal warning; a scheduled cancellation shows the access end date.

There is no "Upgrade plan" action: the customer API has no plan-change endpoint, and buying a second plan against an active entitlement is rejected. The card says plan changes are not available yet and that the customer can cancel at period end and choose a new plan afterwards.

### Billing history table

History is server-paginated through `?page=` (page size 20) with the shared `Pagination` and `DataTable`. All seven columns are kept on every viewport: date (paid date, or created date marked "Not paid"), plan, billing period (backend boundaries, or "—"), amount (right-aligned), payment status, provider, and merchant reference. Status badges are subtle filled pills with text labels: Succeeded green, Failed red, Pending amber, Underpaid amber, Cancelled and Expired neutral; unknown values pass through as neutral. Long references are abbreviated with the full value in `title` and a copy button that writes the complete reference and announces the result through a polite live region. Cells do not wrap; the table scrolls horizontally inside its rounded container, never the page. No invoices, receipts, or refunds are shown.

Amounts everywhere use `formatMinorUnits` from `@template/ui-core`, which reads the currency's minor-unit scale from `Intl` and converts with decimal string arithmetic. Dates use `formatBillingDate` (`en-US`, medium date style) in the browser's time zone.

## Cancellation at period end

When raw `status` is `Active` and `cancelAtPeriodEnd` is false, the current subscription card offers "Cancel at period end". A confirmation modal explains that the subscription will not renew, access continues until the current period end returned by the backend, and no refund is issued. Confirming calls the mutation (guarded against repeated submission), then shows `entitledUntilUtc` from the response and hides the action immediately; the invalidated current subscription refreshes into the "Cancellation scheduled" state, which no longer offers the action. Immediate cancellation, resume, upgrade, downgrade, proration, and refunds are not implemented because the customer API does not support them.

## Known backend gaps and limitations

- Both `409` cases (idempotency-key reuse with a different payload, and an entitlement conflict) are plain Problem Details without a stable `code`, so the UI shows one combined conflict message.
- There is no customer plan-change endpoint (upgrade, downgrade, proration), so the Billing page offers no "Upgrade plan" action. Adding one requires a backend operation that changes the plan of the current entitlement; the frontend must not emulate it with a second purchase.
- Plans expose no tier label or recommendation flag, so cards show neither. The frontend still accepts the legacy single `price`/`billingInterval` plan shape alongside `prices`.
- `GET /subscriptions/current` returns `404` once a subscription is cancelled or expired, so the Billing page cannot show the ended plan; billing history remains the record of past subscriptions.
- The backend does not currently restrict which tenant users may act for a `Tenant` billing account; the User Portal uses `Stakeholder` only.
- Bachs `success_url`/`cancel_url` come from one backend-wide setting (`BachsOptions.SuccessUrl`/`CancelUrl`) applied to every Bachs checkout, including wallet top-ups. Pointing it at the User Portal subscription routes also sends wallet top-up returns there. The backend needs per-intent return URLs (for example `Payments:Bachs:ReturnUrls:SubscriptionPurchase:*`) selected in `BachsPaymentProviderService` from the payment intent.
- The redirect carries no purchase correlation, so recovery depends on this browser's remembered attempt. Proposed backend change: append the purchase id (for example `?purchaseId={id}`) when building `success_url`/`cancel_url` per checkout. The frontend would use it only as a lookup key; the owner-scoped status endpoint already returns `404` for other owners.
- A cancelled Bachs checkout is verified as `PaymentStatus.Failed` (`provider_reported_cancelled` in `BachsPaymentProviderService.VerifyPaymentAsync`), never `Cancelled`, and only by reconciliation: the webhook subscribes to `collection.*` and `checkout.expired`, not to a cancellation event. After a cancel redirect the backend usually still reports `PaymentPending` until reconciliation or checkout expiry, so the cancelled route shows "Payment not completed". Proposed: map provider cancellation to `PaymentStatus.Cancelled` and subscribe to a Bachs checkout-cancelled event if one exists.
- `Card` instruction fields are undocumented, so card-method providers are shown but cannot be selected.
- Plans have no backend feature/entitlement list; the pricing page shows no feature bullets unless marketing copy is configured.
- The backend accepts `autoRenew: true` for a provider whose `supportsRecurringPayments` is false (no validation in `PurchaseSubscriptionHandler`). The UI warns and does not promise renewal, but does not change the submitted choice.
- Checkout recovery works across tabs of the same browser (`localStorage`) for 24 hours. Returning on another browser or device falls back to the billing page, because the backend has no "latest purchase" endpoint to recover from.
- The remembered attempt is cleared on explicit logout but not when a session simply expires. If a different user then signs in on the same browser, the checkout page may link to the previous user's purchase; the backend answers `404` for it, so no data is exposed.
- End-to-end browser tests are not included because the repository has no browser test runner; journeys are covered by unit, route, and rendering tests.
