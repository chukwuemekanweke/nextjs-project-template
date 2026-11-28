# Screen and action API contract matrix (FE-UI-017)

This is the readable summary of [`api-contract-matrix.json`](./api-contract-matrix.json). The JSON file is canonical. It maps every logical screen in [`screen-inventory.json`](./screen-inventory.json) to its user actions, and maps each action to the backend contract that serves it, or records that no backend contract exists. Gaps, owners and ready-to-apply ticket text are in [`integration-handoff.md`](./integration-handoff.md).

FE-UI-017 changes documentation only. No application, package, OpenAPI, lockfile or CI file was changed.

## Baselines

| Source             | Revision                                                                                                                                             | How it was used                                                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend           | `79642f8207962e4160ab23fd387a92d77cf0d784` (origin/main)                                                                                             | Pages, features, BFF route handlers, `browser-api.ts` rewrites, `api-client` contracts/operations, `api-react` hooks/keys/invalidation                                  |
| Backend            | `1fcad50e82198a02e2e0909efb78c9c1cafb3947` (origin/main, "feat(auditing): record and expose unified administrative audit history (#92)", 2026-11-26) | Static read of controllers, `EndpointUrl`, request/response records, `[Authorize]` policies, `[RequireStepUpMfa]`, rate-limit attributes, permission catalogue and docs |
| Design             | `ad9386efe354d0d4d6d9b57d5e1cd492a29cb80d`                                                                                                           | Artboard and variant groups, taken from the screen inventory                                                                                                            |
| Checked-in OpenAPI | `backendprojecttemplatewebapi.json` (OpenAPI 3.1.1, 21 operations)                                                                                   | Compared only. Not refreshed.                                                                                                                                           |

The backend was not run. Its OpenAPI document was not generated, and no endpoint was called. Every statement about the backend comes from source at the commit above. Declared status codes are the ones listed in `[ProducesResponseType]`. Where a controller declares none, the matrix says so instead of guessing.

## How to read the matrix

- **Screen IDs** are the stable IDs from the screen inventory. **Action IDs** are `<SCREEN-ID>.<verb-noun>`. **Shared actions** are `SHARED.<name>`, and screens point to them with `sharedActionRef` instead of repeating them. **Gap IDs** are `GAP-017-NNN`.
- `classification` describes the current frontend:
  - `live`: wired to a backend operation in a deployed route.
  - `partial`: wired, but incomplete or mismatched.
  - `mock-preview-only`: an isolated composition tested with fixtures.
  - `unavailable`: disabled or omitted.
  - `local-static`: local UI, navigation, browser print or static content.
  - `unverified`: code exists, but its use could not be confirmed.
- `backendCapability` describes the backend:
  - `verified-existing`: the endpoint is in source and a frontend operation calls it.
  - `verified-existing-not-integrated`: the endpoint is in source, but no frontend operation calls it yet. Treat these as proposed integrations.
  - `partial`, `missing`, `not-required`: as named.
- A field that does not apply is `{ "value": null, "reason": "…" }`, never a placeholder.
- Full endpoint details are recorded once, in `endpointCatalogue`: authorization, step-up operation, rate-limit policy, declared statuses and response record names, a source `file:line@commit`, whether the endpoint is in the checked-in OpenAPI, and the frontend operation that calls it. Actions refer to endpoints by key.

## Coverage

| Measure                                                         | Count                                                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Inventory screens mapped                                        | **62 / 62**                                                                                           |
| Actions                                                         | **225** (217 on screens + 8 shared; 15 use `sharedActionRef`)                                         |
| Actions by classification                                       | live 72 · mock-preview-only 80 · local-static 36 · unavailable 34 · partial 2 · unverified 1          |
| Actions by backend capability                                   | verified-existing 73 · verified-existing-not-integrated 72 · not-required 44 · missing 28 · partial 8 |
| Screens by overall classification                               | live 21 · mock-preview-only 28 · local-static 10 · partial 3                                          |
| Backend endpoints at `1fcad50`                                  | 100 (95 non-webhook + 5 provider webhooks)                                                            |
| Non-webhook backend endpoints referenced by at least one action | **95 / 95**                                                                                           |
| Frontend `api-client` operations                                | 48; all 48 match a backend method and path                                                            |
| Gaps                                                            | 27: blocker 2 · high 5 · medium 11 · low 9                                                            |

## Drift summary

| Comparison                                | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checked-in OpenAPI vs backend             | The file has 21 operations and the backend has 100 endpoints, so 80 backend endpoints are missing from the file. The file still documents `POST /api/v1/stakeholders/me/profile/avatar`, which the backend replaced with `…/avatar/uploads` and `…/uploads/{uploadId}/complete`. ([GAP-017-001](./integration-handoff.md#gap-017-001))                                                                                                                                 |
| Frontend operations vs checked-in OpenAPI | 31 of the 48 handwritten operations are not in the file. This includes all two-factor, passkey, session-management, security-activity, password-change, Google flow/link, email-existence and customer subscription operations, plus avatar create/complete.                                                                                                                                                                                                           |
| Frontend operations vs backend            | All 48 methods and paths match. DTO spot checks match the backend records for profile, avatar upload, password reset, purchase, wallet transaction and initiate-payment. Known mismatches: `setPaymentProviderActivation` and `setActiveProvider` omit the backend's optional `reason`, and neither can send the required `X-Step-Up-Authorization` header ([GAP-017-012](./integration-handoff.md#gap-017-012), [GAP-017-002](./integration-handoff.md#gap-017-002)). |
| Backend vs frontend operations            | 47 non-webhook endpoints have no frontend operation: 40 admin endpoints (users, roles, sessions, KYC, payments, plans, subscriptions, allocation, analytics, audit), plus step-up verification, the payment-provider list, languages, customer KYC (2) and preferences (2).                                                                                                                                                                                            |
| BFF vs operations                         | Every authenticated User Portal operation goes through a same-origin BFF route. Two BFF routes have no caller: User Portal `POST /api/auth/registrations`, because `useSignUp` calls the backend directly, and Admin Portal `POST /api/auth/session/google`, which has no UI ([GAP-017-022](./integration-handoff.md#gap-017-022)). The Admin Portal has no data BFF routes at all.                                                                                    |
| Docs/inventory vs backend                 | Several sources still say "no API exists" when the backend now has one: admin compositions (DR-070…074), `productionAdminDashboard`, `USR-VERIFICATION` ("KYC API missing"), `USR-PREFERENCES` and DR-051 (no preferences API), and the OKF authentication domain ("no step-up endpoint or admin MFA exists"). The patch proposal below covers the inventory. OKF and DR updates belong to the lead.                                                                   |

## Authentication and security (B4)

- **Session architecture.** No regression was found. Access and refresh tokens are kept only in HttpOnly `__Host-` cookies. The BFFs return safe metadata. `API_BASE_URL` is private. Browser-direct calls go only to anonymous operations that need no secret: countries, plans, email existence, sign-up and the confirmation-code request. The browser never imports `@template/api-client/server`.
- **Refresh coordination.** One refresh runs per refresh token, and failed requests retry once. Domain 401 responses, such as `invalid_two_factor_code`, skip the refresh. Shared action: `SHARED.user-refresh-session`.
- **`returnTo`.** Destinations are validated by `safeSignInDestination` (`apps/user-portal/src/lib/sign-in.ts`). The public-path allowlist is `apps/user-portal/src/lib/public-paths.ts`.
- **Google.** The flow starts only when the user activates it. The flow token stays in an HttpOnly cookie. The four outcomes (authenticated, `two_factor_required`, `link_required`, registration) each map to `AUTH-*` actions.
- **MFA challenge vs session.** In the User Portal, no session cookie is set until `/api/auth/session/two-factor` succeeds. **In the Admin Portal, a `two_factor_required` outcome is rejected with a 409.** Backend step-up requires an enrolled authenticator, so an admin who can perform privileged mutations cannot sign in at all ([GAP-017-003](./integration-handoff.md#gap-017-003), blocker).
- **Step-up MFA.** Every admin mutation requires `X-Step-Up-Authorization`, obtained from `POST /api/v1/authentication/security/step-up/verifications`. The proof is accepted with authenticator codes only, is bound to the exact method, path, query and body, lasts two minutes and is consumed on first use. Today the frontend dialog only presents the code entry ([GAP-017-002](./integration-handoff.md#gap-017-002), blocker).
- **Admin authorization.** Admission checks one configured role claim. The backend evaluates 15 permissions across four seeded roles from current role membership on every request, and does not trust JWT role claims. No endpoint returns the caller's permissions, so a 403 should hide or disable one section, not fail the page ([GAP-017-004](./integration-handoff.md#gap-017-004)).
- **Passkeys.** The browser uses WebAuthn JSON wire shapes. Base64url conversion lives in `@template/api-client/browser`. Sign-in options and completion go through the BFF only, with a single-use flow cookie.
- **Session revocation.** Customers can revoke one session or all other sessions. A password-reset completion revokes all sessions on the backend (`CompletePasswordResetHandler.cs:59`) and returns no tokens.
- **Lockout, rate limits and enumeration.** The backend sends 423 for a lockout with no duration. Rate-limit policies cover sign-in, sign-up, email operations, password reset, refresh and two-factor. Email-existence checks enumerate by design. A password-reset request for an unknown email returns 404, and the BFF folds that into the accepted response ([GAP-017-020](./integration-handoff.md#gap-017-020), BE-DS-006).
- **Password reset.** The request body is `{email}`. The completion body is `{email, otp, password, confirmPassword}`. There is no standalone OTP verification endpoint, and none is used. Invalid, expired and used codes all return one 400 problem without a stable code. The backend returns no resend cooldown or expiry. The request BFF's accepted 202 body still differs between known emails (the backend message, "…a password reset OTP will be sent shortly.", `PasswordResetsController.cs:49`) and unknown emails (the BFF's fixed "…a password reset code will be sent shortly."), so the network response enumerates accounts even though the on-screen copy is identical ([GAP-017-027](./integration-handoff.md#gap-017-027), medium, frontend BFF: always return the fixed message).
- **AuthStates.** Real outcomes are mapped in `auth-feedback.ts` and `sign-in-feedback.ts`. Attempt counts and lockout durations are not supported and are recorded as gaps ([GAP-017-021](./integration-handoff.md#gap-017-021)).
- **Avatar.** The flow is create (BFF), then a direct storage `PUT` with the server-supplied method and headers and `credentials: "omit"`, with no app auth, tenant or correlation headers (`avatar-upload.ts:24-28`), then complete with the `uploadId` (BFF). The backend validates the upload at completion: 400 for expired or invalid, 409 if the upload changed.
- **Preferences and dashboard.** Theme is stored on the device. The backend preference API (`theme`, `language`) exists but is not used ([GAP-017-018](./integration-handoff.md#gap-017-018)). The dashboard tiles read profile, subscription, two-factor, passkeys, sessions and billing history. The wallet tile is unavailable.

## Commercial (B5)

- **Pricing, plans, checkout and return** are live. The backend is authoritative for price, currency (minor units), interval, eligibility, payment link and status. The purchase call sends `Idempotency-Key`. The return routes read the outcome only from purchase status, never from the URL. Cache invalidation is scoped to the billing owner.
- **Billing history** uses page/pageSize, with no filters, export or row drill-down ([GAP-017-025](./integration-handoff.md#gap-017-025)).
- **Invoices and receipts** have no backend (BE-DS-007, [GAP-017-016](./integration-handoff.md#gap-017-016)). Browser print is `local-static`. Server PDF download is `unavailable`.
- **Wallet.** Transactions, top-up lookup and payment initiation exist on the backend, but there is no balance read model (BE-DS-005) and no customer list of providers. The initiate amount is a decimal with no idempotency key ([GAP-017-019](./integration-handoff.md#gap-017-019)).
- **Customer KYC.** The start and status endpoints exist. The frontend must navigate only to the `verificationUrl` the backend returns. The provider's return URL is backend configuration ([GAP-017-017](./integration-handoff.md#gap-017-017)).

## Admin and public (B6)

- **Admin.** Backend endpoints now exist for the dashboard (BE-DS-002), users, roles assignment, sessions, KYC (read-only), payments, plans, subscriptions and allocation, analytics, audit and export, and payment providers. Every admin screen except sign-in is still a preview composition, and the screen inventory still marks most of them backend "Missing". Pagination differs by endpoint:
  - Offset (`page`/`pageSize`): users, audit.
  - Cursor (`cursor`/`limit`): KYC, payments.
  - Analytics take `DateOnly` `from`/`to` and an `interval` (default `Day`).
  - Reads need permission only. Mutations need permission plus step-up and a non-empty reason.
  - There is no role/permission CRUD, by backend design (CAF-FE-008 stays). There is no tenant directory, admin health API or currencies endpoint.
- **Public.** Only `/pricing` calls the API, from a Server Component (`revalidate: 60`). Every CTA is navigation, not an API call. The contact form uses mailto because there is no endpoint.

## Email (B7)

[`email-template-catalog.json`](./email-template-catalog.json) was already checked against the same backend commit (`1fcad50`). This mapping found no new deltas: the backend `NotificationType` has 11 values, and 11 of the 22 design templates have no enum value. `ResetPassword` maps to `ResetPasswordOtp`, which sends an OTP, not a link. `PasswordResetSuccessful` has an enum value but no producer. The remaining backend work is BE-DS-008 (BE-NOTIF-01…08), and the matrix links to it rather than duplicating it ([GAP-017-024](./integration-handoff.md#gap-017-024)).

## Per-screen summary

| Screen                       | Portal        | Route (existing, or proposed)                | Overall           | Actions | Action classifications                             | Gaps (GAP-017-)    |
| ---------------------------- | ------------- | -------------------------------------------- | ----------------- | ------: | -------------------------------------------------- | ------------------ |
| `ADM-ACTIVE-USERS`           | admin-portal  | /analytics/active-users (proposed)           | mock-preview-only |       3 | mock-preview-only 3                                | 010                |
| `ADM-ALLOCATE`               | admin-portal  | /subscriptions/allocate (proposed)           | mock-preview-only |       4 | mock-preview-only 2, unavailable 1, local-static 1 | 002, 003, 006, 009 |
| `ADM-AUDIT`                  | admin-portal  | /audit (proposed)                            | mock-preview-only |       4 | mock-preview-only 4                                | 011                |
| `ADM-DASHBOARD`              | admin-portal  | /                                            | partial           |       8 | unavailable 7, local-static 1                      | 005                |
| `ADM-FORBIDDEN`              | admin-portal  | in-place state                               | partial           |       1 | partial 1                                          | 004                |
| `ADM-INVOICE-DETAIL`         | admin-portal  | /invoices/[invoiceId] (proposed)             | mock-preview-only |       4 | mock-preview-only 1, unavailable 2, local-static 1 | 016, 024           |
| `ADM-INVOICES`               | admin-portal  | /invoices (proposed)                         | mock-preview-only |       3 | mock-preview-only 1, unavailable 2                 | 016                |
| `ADM-KYC`                    | admin-portal  | /kyc (proposed)                              | mock-preview-only |       5 | mock-preview-only 5                                | 007                |
| `ADM-KYC-DETAIL`             | admin-portal  | /kyc/[verificationId] (proposed)             | mock-preview-only |       2 | mock-preview-only 1, unavailable 1                 | 007                |
| `ADM-NAV-MOBILE`             | admin-portal  | layout                                       | local-static      |       2 | local-static 1, live 1                             | —                  |
| `ADM-PAYMENT-ANALYTICS`      | admin-portal  | /analytics/payments (proposed)               | mock-preview-only |       6 | mock-preview-only 6                                | 010                |
| `ADM-PAYMENT-DETAIL`         | admin-portal  | /payments/[paymentId] (proposed)             | mock-preview-only |       1 | mock-preview-only 1                                | 008                |
| `ADM-PAYMENTS`               | admin-portal  | /payments (proposed)                         | mock-preview-only |       4 | mock-preview-only 4                                | 008                |
| `ADM-PLANS`                  | admin-portal  | /plans (proposed)                            | mock-preview-only |       4 | mock-preview-only 4                                | 002, 003, 009      |
| `ADM-PROVIDERS`              | admin-portal  | /providers (proposed)                        | mock-preview-only |       5 | mock-preview-only 3, unavailable 2                 | 001, 002, 012      |
| `ADM-REFERENCE-DATA`         | admin-portal  | /reference-data (proposed)                   | mock-preview-only |       4 | mock-preview-only 2, unavailable 2                 | 013                |
| `ADM-REGISTRATIONS`          | admin-portal  | /analytics/registrations (proposed)          | mock-preview-only |       3 | mock-preview-only 3                                | 010                |
| `ADM-ROLE-EDIT`              | admin-portal  | /roles/[roleId], /roles/new (proposed)       | mock-preview-only |       2 | mock-preview-only 1, unavailable 1                 | 014                |
| `ADM-ROLES`                  | admin-portal  | /roles (proposed)                            | mock-preview-only |       1 | mock-preview-only 1                                | 014                |
| `ADM-SIGN-IN`                | admin-portal  | /sign-in                                     | live              |       4 | live 2, partial 1, unverified 1                    | 003, 004, 022      |
| `ADM-STEP-UP`                | admin-portal  | dialog (proposed)                            | mock-preview-only |       2 | unavailable 1, local-static 1                      | 002, 003           |
| `ADM-SUBSCRIPTION-ANALYTICS` | admin-portal  | /analytics/subscriptions (proposed)          | mock-preview-only |       6 | mock-preview-only 6                                | 010                |
| `ADM-SUBSCRIPTION-DETAIL`    | admin-portal  | /subscriptions/[subscriptionId] (proposed)   | mock-preview-only |       4 | mock-preview-only 4                                | 002, 003, 009      |
| `ADM-SUBSCRIPTIONS`          | admin-portal  | /subscriptions (proposed)                    | mock-preview-only |       5 | mock-preview-only 5                                | 009                |
| `ADM-SYSTEM-HEALTH`          | admin-portal  | /system-health (proposed)                    | mock-preview-only |       2 | mock-preview-only 2                                | 015                |
| `ADM-USER-DETAIL`            | admin-portal  | /users/[userId] (proposed)                   | mock-preview-only |       8 | mock-preview-only 8                                | 002, 003, 006, 014 |
| `ADM-USERS`                  | admin-portal  | /users (proposed)                            | mock-preview-only |       4 | mock-preview-only 4                                | 006                |
| `AUTH-CONFIRM-EMAIL`         | user-portal   | /confirm-email                               | live              |       2 | live 2                                             | —                  |
| `AUTH-FORGOT-PASSWORD`       | user-portal   | /forgot-password                             | live              |       2 | live 1, local-static 1                             | 020                |
| `AUTH-GOOGLE-LINK`           | user-portal   | /sign-in (link_required)                     | live              |       2 | live 1, local-static 1                             | —                  |
| `AUTH-GOOGLE-REGISTER`       | user-portal   | /register?google=continue                    | live              |       2 | live 2                                             | —                  |
| `AUTH-MESSAGES`              | user-portal   | reference                                    | partial           |       3 | local-static 1, unavailable 2                      | 021                |
| `AUTH-PASSKEY-SETUP`         | user-portal   | /passkey-setup                               | live              |       3 | live 2, local-static 1                             | —                  |
| `AUTH-REGISTER`              | user-portal   | /register                                    | live              |       4 | live 4                                             | 022                |
| `AUTH-RESET-PASSWORD`        | user-portal   | /forgot-password (code step)                 | live              |       3 | live 2, local-static 1                             | 020                |
| `AUTH-SIGN-IN`               | user-portal   | /sign-in                                     | live              |       6 | live 4, local-static 2                             | —                  |
| `AUTH-TWO-FACTOR`            | user-portal   | /sign-in/two-factor                          | live              |       3 | live 3                                             | —                  |
| `FND-FOUNDATIONS`            | public-portal | /foundations                                 | local-static      |       1 | local-static 1                                     | —                  |
| `MKT-ABOUT`                  | public-portal | /about                                       | local-static      |       2 | local-static 2                                     | —                  |
| `MKT-BLOG`                   | public-portal | /blog                                        | local-static      |       2 | local-static 2                                     | —                  |
| `MKT-CONTACT`                | public-portal | /contact                                     | local-static      |       1 | local-static 1                                     | 026                |
| `MKT-FEATURES`               | public-portal | /features                                    | local-static      |       2 | local-static 2                                     | —                  |
| `MKT-HOME`                   | public-portal | /                                            | local-static      |       2 | local-static 2                                     | —                  |
| `MKT-LEGAL`                  | public-portal | /privacy, /terms                             | local-static      |       1 | local-static 1                                     | —                  |
| `MKT-NAV-MOBILE`             | public-portal | layout                                       | local-static      |       1 | local-static 1                                     | —                  |
| `MKT-PRICING`                | public-portal | /pricing                                     | live              |       3 | live 1, local-static 2                             | —                  |
| `USR-BILLING`                | user-portal   | /billing                                     | live              |       6 | live 4, local-static 2                             | 025                |
| `USR-BILLING-HISTORY`        | user-portal   | /billing/history                             | live              |       5 | live 2, unavailable 3                              | 016, 025           |
| `USR-CHECKOUT`               | user-portal   | /billing/checkout                            | live              |       5 | live 5                                             | —                  |
| `USR-CHECKOUT-RESULT`        | user-portal   | /billing/checkout/{success,cancelled,return} | live              |       2 | live 2                                             | —                  |
| `USR-DASHBOARD`              | user-portal   | /dashboard                                   | live              |       6 | live 4, unavailable 1, local-static 1              | 019                |
| `USR-INVOICE-DETAIL`         | user-portal   | /billing/invoices/[invoiceId] (proposed)     | mock-preview-only |       3 | mock-preview-only 1, unavailable 1, local-static 1 | 016                |
| `USR-NAV-MOBILE`             | user-portal   | layout                                       | live              |       3 | live 2, local-static 1                             | —                  |
| `USR-PREFERENCES`            | user-portal   | /preferences                                 | local-static      |       4 | local-static 1, unavailable 3                      | 018, 024           |
| `USR-PROFILE`                | user-portal   | /profile                                     | live              |       4 | live 3, unavailable 1                              | 001                |
| `USR-PURCHASE-DETAIL`        | user-portal   | /billing/purchases/[purchaseId]              | live              |       1 | live 1                                             | 016                |
| `USR-RECEIPT-DETAIL`         | user-portal   | /billing/receipts/[receiptId] (proposed)     | mock-preview-only |       2 | mock-preview-only 1, local-static 1                | 016                |
| `USR-SECURITY`               | user-portal   | /security?tab=…                              | live              |      16 | live 15, local-static 1                            | —                  |
| `USR-TWO-FACTOR-SETUP`       | user-portal   | /security (dialog)                           | live              |       4 | live 2, local-static 2                             | —                  |
| `USR-VERIFICATION`           | user-portal   | /verification (proposed)                     | mock-preview-only |       4 | mock-preview-only 3, unavailable 1                 | 017                |
| `USR-WALLET`                 | user-portal   | /wallet (proposed)                           | mock-preview-only |       4 | mock-preview-only 3, unavailable 1                 | 019                |
| `USR-WALLET-TOP-UP`          | user-portal   | /wallet (dialog, proposed)                   | mock-preview-only |       2 | mock-preview-only 1, unavailable 1                 | 019                |

`FND-FOUNDATIONS` has no `targetApplication` in the inventory, so the JSON records its portal as `n/a`. The page is served by the Public Portal.

## Patch proposal for shared screen-inventory fields

FE-UI-017 does not edit `screen-inventory.json`. The lead should apply the changes below after reconciling with FE-UI-016.

The inventory legend defines `backend.support` as "judged from handwritten api-client operations" (DR-003). Under that definition, admin screens are correctly "Missing" today, but the field reads as "the backend lacks it", which is now false. The proposal therefore adds fields and leaves the meaning of `support` alone:

```jsonc
// legend
"backendEndpointStatus": "Existing | Partial | Missing | Not required (verified against backend source; see api-contract-matrix.json)"

// per screen, beside backend.support
"backend": {
  "support": "<unchanged>",
  "endpointStatus": "<value below>",
  "contractMatrix": "api-contract-matrix.json#<SCREEN-ID>"
}
```

| Screen(s)                                                                                                       | `backend.endpointStatus` | `backend.missingCapabilities` change                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADM-DASHBOARD`, `ADM-REGISTRATIONS`, `ADM-ACTIVE-USERS`, `ADM-PAYMENT-ANALYTICS`, `ADM-SUBSCRIPTION-ANALYTICS` | Existing                 | Replace with `[]`; note BE-DS-002 (backend `503a4e5`)                                                                                                                                  |
| `ADM-USERS`, `ADM-USER-DETAIL`                                                                                  | Existing                 | Replace with "Step-up MFA integration (frontend)"; remove "admin user API"; note the users list has no KYC filter                                                                      |
| `ADM-KYC`                                                                                                       | Existing                 | `[]`                                                                                                                                                                                   |
| `ADM-KYC-DETAIL`                                                                                                | Partial                  | Keep only "Admin refresh/reconcile action"                                                                                                                                             |
| `ADM-PAYMENTS`, `ADM-PAYMENT-DETAIL`                                                                            | Existing                 | `[]`                                                                                                                                                                                   |
| `ADM-PLANS`                                                                                                     | Existing                 | Remove "Admin plan list incl. inactive" and "Create/update/activate plan"; check whether "Subscriber counts" are in `AdminSubscriptionPlanResponse`                                    |
| `ADM-SUBSCRIPTIONS`, `ADM-SUBSCRIPTION-DETAIL`                                                                  | Existing                 | `[]`                                                                                                                                                                                   |
| `ADM-ALLOCATE`                                                                                                  | Partial                  | "Tenant directory"                                                                                                                                                                     |
| `ADM-AUDIT`                                                                                                     | Existing                 | `[]` (backend `1fcad50`)                                                                                                                                                               |
| `ADM-PROVIDERS`                                                                                                 | Partial                  | Replace "Provider list/read endpoints" with "Non-payment provider listing; configure/test endpoints"; replace "Step-up enforcement" with "Frontend step-up support (backend enforces)" |
| `ADM-REFERENCE-DATA`                                                                                            | Partial                  | Add languages read as existing; keep currencies and admin mutations missing                                                                                                            |
| `ADM-STEP-UP`                                                                                                   | Existing                 | `[]`; frontend integration tracked as GAP-017-002                                                                                                                                      |
| `ADM-FORBIDDEN`                                                                                                 | Existing                 | `[]`                                                                                                                                                                                   |
| `ADM-SIGN-IN`                                                                                                   | Existing                 | Add "Admin MFA challenge continuation (frontend)"                                                                                                                                      |
| `ADM-SYSTEM-HEALTH`                                                                                             | Partial                  | "Per-dependency admin health API (only anonymous aggregate /health)"                                                                                                                   |
| `ADM-ROLES`, `ADM-ROLE-EDIT`                                                                                    | Missing                  | Add the note "no role/permission read or CRUD by backend design (authorization.md)"                                                                                                    |
| `USR-VERIFICATION`                                                                                              | Existing                 | Replace with "Configured provider return route aligned with the frontend route"                                                                                                        |
| `USR-PREFERENCES`                                                                                               | Partial                  | Remove "Account-level (cross-device) theme preference" and "Language preference persistence" (backend exists); keep localization and email notification preferences                    |
| `MKT-HOME`                                                                                                      | Not required             | Also set `backend.support` to "Not required" and `operations` to `[]` (the home page no longer loads plans)                                                                            |
| All other screens                                                                                               | Same as `support`        | No change                                                                                                                                                                              |

For `ADM-*` screens whose `backend.operations` is empty, add the endpoint keys from the matrix's `endpointCatalogue`, using the inventory's existing `"<operation> <METHOD> <path>"` style and `(not integrated)` in place of an operation name. Two related inventory issues are outside B's ownership, so they are left to the lead and FE-UI-016:

- `implementation.status` is `Missing` for screens whose preview composition exists. On the FE-UI-016 branch, `qa.deployedRoute` is the field that says whether a production route exists, so use it, not `implementation.status`, when deciding whether an integration may publish a route. Screens affected include including `ADM-ALLOCATE`, `ADM-USERS`, `ADM-PLANS`, `USR-VERIFICATION` and `USR-WALLET`.
- `roadmapTicket` uses roadmap numbering. For example, `USR-SECURITY` has roadmap FE-UI-017 ("Security"), which collides with Trello FE-UI-017 (this mapping) ([GAP-017-023](./integration-handoff.md#gap-017-023)).

## Reconciliation with FE-UI-016

These notes reconcile FE-UI-016 (`4af73eb` on `feat/fe-ui-016-final-visual-qa`, not yet on main). The DR IDs that are new on that branch depend on FE-UI-016 merging.

- **`/forgot-password` layout.** `AUTH-FORGOT-PASSWORD` and `AUTH-RESET-PASSWORD` now render in the standalone auth layout, like `/sign-in`, instead of inside the signed-in dashboard shell (`apps/user-portal/src/lib/user-layout.ts`; DR-167, which depends on FE-UI-016). No matrix entry referred to the shell or navigation for these screens. The route, the BFF calls (`POST /api/auth/password-resets` and `/completions`), the actions and the states are unchanged. The two actions now carry a note recording the delta.
- **Inventory format.** On that branch, every inventory record gains a `qa` block (`surface`, `deployedRoute`), `design.editableArtboards` becomes `design.exportCopies`, and the reference blobs point at `ad9386e`. The matrix reads only `design.artboards` and `design.variants`, which are unchanged, and the screen IDs are identical (62), so the design-reference fields and the join are unaffected. The patch proposal adds `backend.endpointStatus` and `backend.contractMatrix` and touches no FE-UI-016 field. Where it mentions `implementation.status`, `qa.deployedRoute` is now the authority for whether a production route exists.
- **Password-reset response bodies.** FE-UI-016's open item is verified at backend `1fcad50` and recorded as [GAP-017-027](./integration-handoff.md#gap-017-027).
- **`MKT-HOME`.** FE-UI-016's CTA contrast fix is presentation only. The proposal to mark this screen "Not required" still stands.
- **Discrepancy IDs.** The DR IDs cited here (DR-003, 016, 019, 033, 051, 054, 070–074, 089, 160) exist both on main and on the FE-UI-016 branch. FE-UI-016 adds DR-165 to DR-176 and resolves DR-083 and DR-085. This matrix cites none of those except DR-167 above.

## BE-DS-001

No reference to `BE-DS-001` exists in the backend repository: not in docs, source, commit messages on any branch, or branch names. It does not appear in the frontend repository either. The Trello boards could not be read (the API returned 401). **The status of BE-DS-001 and its outputs is unverified.** Nearby evidence:

- BE-DS-002 is the only BE-DS ID in the backend. It appears in `docs/architecture/admin-dashboard-data-requirements.md`, and the commit `503a4e5` ("add KYC summary and payment provider listing endpoints (#91)") states that it closes the two BE-DS-002 dashboard gaps.
- The frontend docs reference BE-DS-005 (wallet), BE-DS-006 (password reset), BE-DS-007 (invoices and receipts) and BE-DS-008 (notifications), each with a Trello URL. None of their statuses were verified.

FE-UI-017 final sign-off depends on BE-DS-001 and on FE-UI-016, so it stays open until both are confirmed.

## Unresolved sources and limitations

- The Trello frontend and backend boards and cards could not be read (401). No card status is claimed. The CAF-FE IDs are referenced only where repository text names them (004, 005, 006, 008, 012, 014, 015, 016). CAF-FE-001 is named in the brief but appears nowhere in the repository.
- The backend was read statically and not run. Generated OpenAPI was not compared. Some controllers declare no status codes (admin user mutations, roles, sessions, two-factor), and those actions say so.
- The extractor truncated the full parameter list of `ListSubscriptionsRequest`, and the action records this. The response field lists of admin records are named but not copied.
- The units of the admin plan price wire fields and of the `initiatePayment` amount were not confirmed. The backend's timezone semantics for `DateOnly` analytics ranges are assumed to be UTC days and were not verified.
- FE-UI-016 may change UI semantics. Any deltas the lead relays must be reconciled into this matrix before final sign-off.
- Validation (JSON parse, unique IDs, screen joins, shared-reference and gap-reference resolution, implementation-path existence) was run with a temporary script outside the repository.
