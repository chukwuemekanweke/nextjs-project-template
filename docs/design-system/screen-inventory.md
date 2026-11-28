# Screen inventory

Human-readable view of [`screen-inventory.json`](./screen-inventory.json), the authoritative, machine-readable inventory. Both are produced from the same data; when they disagree, the JSON wins. Design source: [`design-source-manifest.json`](./design-source-manifest.json) (commit `d23eb85`; the dashboard shell and navigation records use revision `a7e2a63` — see the manifest's `scopedRevisions` and [DR-083](./discrepancy-register.md#dr-083)).

## How to read this

- A **logical screen** is one user-facing surface (one route, one in-page state machine, one dialog, or one layout pattern). Visual variants (desktop/mobile, light/dark) and business states (billing `active`/`pastdue`, KYC `rejected`) are listed under the screen, never as separate screens.
- Multi-artboard screens: `AUTH-REGISTER` (email, details), `AUTH-FORGOT-PASSWORD` (request, link sent) and `AUTH-RESET-PASSWORD` (new password, done, expired) merge artboards that the design drew separately but that are states of one route.
- Transactional email designs (`6-emails/`, `email-pages/`) are not screens and are not in this inventory; see [`email-template-catalog.md`](./email-template-catalog.md) (Trello FE-UI-019).
- **Status**: the frontend today. **Class**: A existing functional · B existing partial · C UI reference only (workflow not built; backend may exist) · D unsupported capability (the design needs backend support that the handwritten `api-client` does not have).
- **Backend** support is judged from `packages/api-client` operations; the repository OpenAPI snapshot is stale ([DR-003](./discrepancy-register.md#dr-003)).
- **Priority**: P0 foundation · P1 redesign of a live flow · P2 missing screen that is unblocked or low risk · P3 blocked on backend or product decisions.
- Every design file path, git blob id, viewport, theme and state is in the JSON (`design.referenceFiles`). Tickets refer to [migration-roadmap.md](./migration-roadmap.md).

## Statistics

| Measure                                                       | Count |
| ------------------------------------------------------------- | ----- |
| Logical screens (incl. overlays, layout patterns, references) | 62    |
| Design artboards                                              | 68    |
| Canonical static reference files mapped                       | 337   |
| Editable `.dc.html` artboards mapped                          | 239   |
| Screens with an existing route or in-app state                | 26    |
| Screens with a proposed route only                            | 31    |
| Screens whose design assumes unsupported backend capabilities | 48    |
| Status: Implemented                                           | 38    |
| Status: Missing                                               | 21    |
| Status: Partial                                               | 3     |
| Status: Reference-only                                        | 0     |
| Classification A                                              | 15    |
| Classification B                                              | 8     |
| Classification C                                              | 10    |
| Classification D                                              | 29    |
| Backend: Existing                                             | 15    |
| Backend: Missing                                              | 25    |
| Backend: Not required                                         | 8     |
| Backend: Partial                                              | 14    |

## Inventory by category

### Foundations (1)

| Screen ID                             | Screen                                       | Kind      | App | Existing route | Proposed route | Status      | Class | Backend      | Priority | Ticket    |
| ------------------------------------- | -------------------------------------------- | --------- | --- | -------------- | -------------- | ----------- | ----- | ------------ | -------- | --------- |
| [`FND-FOUNDATIONS`](#fnd-foundations) | Foundations (tokens and component specimens) | reference | —   | —              | —              | Implemented | C     | Not required | P0       | FE-UI-003 |

### Marketing site (8)

| Screen ID                           | Screen                           | Kind           | App           | Existing route     | Proposed route | Status      | Class | Backend      | Priority | Ticket    |
| ----------------------------------- | -------------------------------- | -------------- | ------------- | ------------------ | -------------- | ----------- | ----- | ------------ | -------- | --------- |
| [`MKT-ABOUT`](#mkt-about)           | About                            | page           | public-portal | `/about`           | —              | Implemented | C     | Not required | P3       | FE-UI-010 |
| [`MKT-BLOG`](#mkt-blog)             | Blog index                       | page           | public-portal | `/blog`            | —              | Implemented | C     | Not required | P3       | FE-UI-010 |
| [`MKT-CONTACT`](#mkt-contact)       | Contact                          | page           | public-portal | `/contact`         | —              | Partial     | D     | Missing      | P3       | FE-UI-010 |
| [`MKT-FEATURES`](#mkt-features)     | Features                         | page           | public-portal | `/features`        | —              | Implemented | C     | Not required | P2       | FE-UI-010 |
| [`MKT-HOME`](#mkt-home)             | Home                             | page           | public-portal | `/`                | —              | Implemented | B     | Partial      | P2       | FE-UI-010 |
| [`MKT-LEGAL`](#mkt-legal)           | Legal (privacy policy and terms) | page           | public-portal | `/privacy, /terms` | —              | Implemented | C     | Not required | P3       | FE-UI-010 |
| [`MKT-NAV-MOBILE`](#mkt-nav-mobile) | Marketing mobile menu            | layout-pattern | public-portal | —                  | —              | Implemented | B     | Not required | P1       | FE-UI-009 |
| [`MKT-PRICING`](#mkt-pricing)       | Pricing                          | page           | public-portal | `/pricing`         | —              | Implemented | A     | Existing     | P1       | FE-UI-011 |

### Authentication (11)

| Screen ID                                       | Screen                                            | Kind       | App          | Existing route                   | Proposed route     | Status      | Class | Backend  | Priority | Ticket    |
| ----------------------------------------------- | ------------------------------------------------- | ---------- | ------------ | -------------------------------- | ------------------ | ----------- | ----- | -------- | -------- | --------- |
| [`ADM-SIGN-IN`](#adm-sign-in)                   | Admin sign in                                     | page       | admin-portal | `/sign-in`                       | —                  | Implemented | B     | Partial  | P1       | FE-UI-014 |
| [`AUTH-CONFIRM-EMAIL`](#auth-confirm-email)     | Confirm email                                     | page       | user-portal  | `/confirm-email`                 | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-FORGOT-PASSWORD`](#auth-forgot-password) | Forgot password (request and link sent)           | state-flow | user-portal  | —                                | `/forgot-password` | Missing     | C     | Existing | P1       | FE-UI-013 |
| [`AUTH-GOOGLE-LINK`](#auth-google-link)         | Link Google account                               | state-flow | user-portal  | `/sign-in (link_required state)` | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-GOOGLE-REGISTER`](#auth-google-register) | Complete Google sign-up                           | state-flow | user-portal  | `/register?google=continue`      | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-MESSAGES`](#auth-messages)               | Sign-in messages and errors catalogue             | reference  | user-portal  | —                                | —                  | Implemented | B     | Partial  | P1       | FE-UI-012 |
| [`AUTH-PASSKEY-SETUP`](#auth-passkey-setup)     | Passkey setup prompt                              | page       | user-portal  | `/passkey-setup`                 | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-REGISTER`](#auth-register)               | Register (email and details steps)                | state-flow | user-portal  | `/register`                      | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-RESET-PASSWORD`](#auth-reset-password)   | Reset password (new password, done, link expired) | state-flow | user-portal  | —                                | `/reset-password`  | Missing     | C     | Existing | P1       | FE-UI-013 |
| [`AUTH-SIGN-IN`](#auth-sign-in)                 | Sign in                                           | page       | user-portal  | `/sign-in`                       | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-TWO-FACTOR`](#auth-two-factor)           | Two-factor challenge                              | page       | user-portal  | `/sign-in/two-factor`            | —                  | Implemented | A     | Existing | P1       | FE-UI-012 |

### User portal (16)

| Screen ID                                       | Screen                                                                  | Kind           | App         | Existing route                                                                     | Proposed route                                                                 | Status      | Class | Backend      | Priority | Ticket    |
| ----------------------------------------------- | ----------------------------------------------------------------------- | -------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ----- | ------------ | -------- | --------- |
| [`USR-BILLING`](#usr-billing)                   | Billing and plans                                                       | state-flow     | user-portal | `/billing`                                                                         | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-BILLING-HISTORY`](#usr-billing-history)   | Billing history                                                         | page           | user-portal | `/billing/history`                                                                 | —                                                                              | Implemented | A     | Partial      | P1       | FE-UI-018 |
| [`USR-CHECKOUT`](#usr-checkout)                 | Checkout                                                                | page           | user-portal | `/billing/checkout`                                                                | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-CHECKOUT-RESULT`](#usr-checkout-result)   | Checkout result                                                         | state-flow     | user-portal | `/billing/checkout/success, /billing/checkout/cancelled, /billing/checkout/return` | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-DASHBOARD`](#usr-dashboard)               | Overview dashboard                                                      | page           | user-portal | `/dashboard`                                                                       | —                                                                              | Implemented | B     | Partial      | P1       | FE-UI-015 |
| [`USR-INVOICE-DETAIL`](#usr-invoice-detail)     | Invoice detail (due, overdue, paid; print)                              | page           | user-portal | —                                                                                  | `/billing/invoices/[invoiceId]`                                                | Missing     | D     | Missing      | P3       | FE-UI-018 |
| [`USR-NAV-MOBILE`](#usr-nav-mobile)             | User portal mobile navigation (top bar, tab bar, drawer)                | layout-pattern | user-portal | —                                                                                  | —                                                                              | Implemented | B     | Not required | P1       | FE-UI-008 |
| [`USR-PREFERENCES`](#usr-preferences)           | Preferences                                                             | page           | user-portal | `/preferences`                                                                     | —                                                                              | Implemented | C     | Partial      | P2       | FE-UI-020 |
| [`USR-PROFILE`](#usr-profile)                   | Profile                                                                 | page           | user-portal | `/profile`                                                                         | —                                                                              | Implemented | A     | Partial      | P1       | FE-UI-016 |
| [`USR-PURCHASE-DETAIL`](#usr-purchase-detail)   | Purchase detail                                                         | page           | user-portal | `/billing/purchases/[purchaseId]`                                                  | —                                                                              | Implemented | B     | Partial      | P2       | FE-UI-018 |
| [`USR-RECEIPT-DETAIL`](#usr-receipt-detail)     | Receipt detail (subscription, wallet; print)                            | page           | user-portal | —                                                                                  | `/billing/receipts/[receiptId]`                                                | Missing     | D     | Missing      | P3       | FE-UI-018 |
| [`USR-SECURITY`](#usr-security)                 | Security (overview, password, passkeys, two-factor, sessions, activity) | state-flow     | user-portal | `/security`                                                                        | `/security?tab={overview\|password\|passkeys\|two-factor\|sessions\|activity}` | Implemented | A     | Existing     | P1       | FE-UI-017 |
| [`USR-TWO-FACTOR-SETUP`](#usr-two-factor-setup) | Two-factor setup dialog and recovery codes                              | overlay        | user-portal | `/security (dialog)`                                                               | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-017 |
| [`USR-VERIFICATION`](#usr-verification)         | Identity verification (KYC)                                             | state-flow     | user-portal | —                                                                                  | `/verification`                                                                | Missing     | D     | Missing      | P3       | FE-UI-022 |
| [`USR-WALLET`](#usr-wallet)                     | Wallet                                                                  | page           | user-portal | —                                                                                  | `/wallet`                                                                      | Missing     | D     | Partial      | P3       | FE-UI-021 |
| [`USR-WALLET-TOP-UP`](#usr-wallet-top-up)       | Wallet top-up dialog                                                    | overlay        | user-portal | —                                                                                  | `/wallet (dialog)`                                                             | Missing     | D     | Partial      | P3       | FE-UI-021 |

### Admin portal (26)

| Screen ID                                                   | Screen                                       | Kind           | App          | Existing route | Proposed route                                           | Status      | Class | Backend      | Priority | Ticket    |
| ----------------------------------------------------------- | -------------------------------------------- | -------------- | ------------ | -------------- | -------------------------------------------------------- | ----------- | ----- | ------------ | -------- | --------- |
| [`ADM-ACTIVE-USERS`](#adm-active-users)                     | Active-user analytics                        | page           | admin-portal | —              | `/analytics/active-users`                                | Implemented | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-ALLOCATE`](#adm-allocate)                             | Allocate subscription                        | page           | admin-portal | —              | `/subscriptions/allocate`                                | Missing     | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-AUDIT`](#adm-audit)                                   | Audit history                                | page           | admin-portal | —              | `/audit`                                                 | Implemented | D     | Missing      | P3       | FE-UI-030 |
| [`ADM-DASHBOARD`](#adm-dashboard)                           | Operations overview                          | page           | admin-portal | `/`            | —                                                        | Implemented | C     | Missing      | P2       | FE-UI-023 |
| [`ADM-FORBIDDEN`](#adm-forbidden)                           | 403 forbidden state                          | state-flow     | admin-portal | —              | `(in-place state on any admin route)`                    | Partial     | C     | Partial      | P2       | FE-UI-023 |
| [`ADM-INVOICE-DETAIL`](#adm-invoice-detail)                 | Invoice detail (admin)                       | page           | admin-portal | —              | `/invoices/[invoiceId]`                                  | Missing     | D     | Missing      | P3       | FE-UI-018 |
| [`ADM-INVOICES`](#adm-invoices)                             | Invoices and receipts                        | page           | admin-portal | —              | `/invoices`                                              | Missing     | D     | Missing      | P3       | FE-UI-018 |
| [`ADM-KYC`](#adm-kyc)                                       | KYC monitoring                               | page           | admin-portal | —              | `/kyc`                                                   | Missing     | D     | Missing      | P3       | FE-UI-028 |
| [`ADM-KYC-DETAIL`](#adm-kyc-detail)                         | KYC detail                                   | page           | admin-portal | —              | `/kyc/[verificationId]`                                  | Missing     | D     | Missing      | P3       | FE-UI-028 |
| [`ADM-NAV-MOBILE`](#adm-nav-mobile)                         | Admin mobile navigation (top bar and drawer) | layout-pattern | admin-portal | —              | —                                                        | Implemented | B     | Not required | P1       | FE-UI-008 |
| [`ADM-PAYMENT-ANALYTICS`](#adm-payment-analytics)           | Payment analytics                            | page           | admin-portal | —              | `/analytics/payments`                                    | Implemented | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-PAYMENT-DETAIL`](#adm-payment-detail)                 | Payment detail                               | page           | admin-portal | —              | `/payments/[paymentId]`                                  | Missing     | D     | Missing      | P3       | FE-UI-027 |
| [`ADM-PAYMENTS`](#adm-payments)                             | Payments                                     | page           | admin-portal | —              | `/payments`                                              | Missing     | D     | Missing      | P3       | FE-UI-027 |
| [`ADM-PLANS`](#adm-plans)                                   | Plans and plan editor drawer                 | page           | admin-portal | —              | `/plans (edit drawer; optional ?edit={planId})`          | Missing     | D     | Partial      | P3       | FE-UI-026 |
| [`ADM-PROVIDERS`](#adm-providers)                           | Providers                                    | page           | admin-portal | —              | `/providers`                                             | Implemented | D     | Partial      | P3       | FE-UI-029 |
| [`ADM-REFERENCE-DATA`](#adm-reference-data)                 | Reference data                               | page           | admin-portal | —              | `/reference-data?tab={countries\|languages\|currencies}` | Implemented | D     | Partial      | P2       | FE-UI-029 |
| [`ADM-REGISTRATIONS`](#adm-registrations)                   | Registration analytics                       | page           | admin-portal | —              | `/analytics/registrations`                               | Implemented | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-ROLE-EDIT`](#adm-role-edit)                           | Role editor                                  | page           | admin-portal | —              | `/roles/[roleId] and /roles/new`                         | Missing     | D     | Missing      | P3       | FE-UI-025 |
| [`ADM-ROLES`](#adm-roles)                                   | Roles and permissions                        | page           | admin-portal | —              | `/roles`                                                 | Missing     | D     | Missing      | P3       | FE-UI-025 |
| [`ADM-STEP-UP`](#adm-step-up)                               | Step-up MFA confirmation dialog              | overlay        | admin-portal | —              | `(dialog on sensitive admin actions)`                    | Partial     | D     | Missing      | P3       | FE-UI-024 |
| [`ADM-SUBSCRIPTION-ANALYTICS`](#adm-subscription-analytics) | Subscription analytics                       | page           | admin-portal | —              | `/analytics/subscriptions`                               | Implemented | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-SUBSCRIPTION-DETAIL`](#adm-subscription-detail)       | Subscription detail                          | page           | admin-portal | —              | `/subscriptions/[subscriptionId]`                        | Missing     | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-SUBSCRIPTIONS`](#adm-subscriptions)                   | Subscriptions                                | page           | admin-portal | —              | `/subscriptions`                                         | Missing     | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-SYSTEM-HEALTH`](#adm-system-health)                   | System health                                | page           | admin-portal | —              | `/system-health`                                         | Implemented | D     | Missing      | P3       | FE-UI-030 |
| [`ADM-USER-DETAIL`](#adm-user-detail)                       | User detail                                  | page           | admin-portal | —              | `/users/[userId]`                                        | Missing     | D     | Missing      | P3       | FE-UI-024 |
| [`ADM-USERS`](#adm-users)                                   | Users                                        | page           | admin-portal | —              | `/users`                                                 | Missing     | D     | Missing      | P3       | FE-UI-024 |

## Screen details

### FND-FOUNDATIONS

**Foundations (tokens and component specimens)** — reference; target `none`; auth: n/a.

- **Artboards:** `Main` — 1 reference files (desktop; light).
- **Status:** Implemented (C); **backend:** Not required; **priority:** P0; **ticket:** FE-UI-003 (delivered by the Trello card numbered FE-UI-002, see [DR-077](./discrepancy-register.md#dr-077)).
- **Implementation:** `packages/ui-core/src/styles/theme.css`, `packages/ui-core/src/theme/theme-provider.tsx`, `packages/ui-core/src/theme/theme-controls.tsx`, `packages/dashboard-ui/src/tailadmin-theme.css`, `apps/public-portal/src/app/globals.css`, `apps/public-portal/src/app/foundations/page.tsx`
- **Works today:** All three apps import `@template/ui-core/theme.css`, load Outfit and JetBrains Mono with `next/font`, and use the shared `next-themes` `ThemeProvider` with `ThemeSwitch`/`ThemeSelect`.
- **Works today:** A development-only specimen at `/foundations` in the public portal (404 in production builds) renders the real tokens; token values and WCAG contrast are unit-tested from `theme.css`.
- **Gap:** Existing components still use the legacy `brand-*`/`gray-*` and Tailwind status utilities through the dashboard compatibility layer; component and screen tickets migrate them (FE-UI-004 onwards, removal in FE-UI-032).
- **Gap:** Un-migrated `public-ui` sections still use the Solid tokens until FE-UI-009/010.
- **Gap:** The preview is a development route, not the Storybook workbench proposed in TD-15 (OD-05 still open).
- **Note:** Delivered by the Trello card numbered FE-UI-002, which carries this roadmap ticket's scope (see DR-077).
- **Note:** Authoritative token values are the `.tp` / `.tp.dark` custom properties in theme.css inlined into every canonical file; see token-mapping.md.
- **Discrepancies:** [DR-001](./discrepancy-register.md#dr-001), [DR-002](./discrepancy-register.md#dr-002), [DR-020](./discrepancy-register.md#dr-020), [DR-029](./discrepancy-register.md#dr-029), [DR-076](./discrepancy-register.md#dr-076), [DR-077](./discrepancy-register.md#dr-077)

### MKT-ABOUT

**About** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicAbout` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/about/page.tsx`, `apps/public-portal/src/config/site.tsx`, `packages/public-ui/src/components/feature-grid.tsx`
- **Works today:** Trello FE-UI-005: hero and Mission / Values / Team cards per the reference, with configurable placeholder copy.
- **Depends on:** FE-UI-009
- **Discrepancies:** [DR-030](./discrepancy-register.md#dr-030)

### MKT-BLOG

**Blog index** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicBlog` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/blog/page.tsx`, `apps/public-portal/src/config/site.tsx`, `packages/public-ui/src/components/blog-card.tsx`
- **Works today:** Trello FE-UI-005: card grid with brand banner, category chip and excerpt; cards keep #id anchors and do not link.
- **Unsupported / missing backend:** Blog post content source (CMS/MDX) and post detail route
- **Gap:** Reference shows six posts with dates; the site keeps its three placeholder posts without invented dates. Post detail needs a content source (DR-032).
- **Depends on:** FE-UI-009
- **Note:** Post detail route (/blog/[slug]) is reference-less; requires a content-source decision (DR-032).
- **Discrepancies:** [DR-032](./discrepancy-register.md#dr-032)

### MKT-CONTACT

**Contact** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicContact` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/contact/page.tsx`, `apps/public-portal/src/components/contact-form.tsx`, `apps/public-portal/src/lib/contact-mailto.ts`, `packages/public-ui/src/components/contact-layout.tsx`
- **Works today:** Trello FE-UI-005: reference layout (name, email, topic, message; email and office cards). Submitting opens a mailto: draft to the support email and states that nothing is sent from the site.
- **Unsupported / missing backend:** Contact/lead submission endpoint
- **Gap:** No backend endpoint; the button reads 'Continue in your email app' instead of 'Send message' and no reply-time promise is shown (DR-033).
- **Depends on:** FE-UI-007 forms
- **Discrepancies:** [DR-033](./discrepancy-register.md#dr-033)

### MKT-FEATURES

**Features** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicFeatures` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (C); **backend:** Not required; **priority:** P2; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/features/page.tsx`, `apps/public-portal/src/config/site.tsx`, `packages/public-ui/src/components/numbered-feature-list.tsx`
- **Works today:** Trello FE-UI-005: numbered (01-06) capability list with soft icon panels per the reference.
- **Gap:** Copy lists only implemented capabilities (accounts, strong sign-in, security, subscriptions, portals, branding) instead of the reference wallet/verification/administration claims (DR-031).
- **Depends on:** FE-UI-009
- **Note:** Marketing copy describing unimplemented capabilities (wallet, KYC, admin operations) needs product sign-off before launch (DR-031).
- **Discrepancies:** [DR-031](./discrepancy-register.md#dr-031)

### MKT-HOME

**Home** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicHome` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (B); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/page.tsx`, `apps/public-portal/src/config/site.tsx`, `packages/public-ui/src/components/hero.tsx`, `packages/public-ui/src/components/product-shot.tsx`, `packages/public-ui/src/components/feature-grid.tsx`, `packages/public-ui/src/components/cta-banner.tsx`
- **Works today:** Trello FE-UI-005: hero, decorative product shot (no figures), six feature cards and CTA per the reference; static (no plan request).
- **Gap:** Reference 'New: passkey sign-in' chip omitted (announcement copy is a product decision).
- **Gap:** Reference product shot shows sample balances; the implementation is abstract and aria-hidden so it cannot read as data.
- **Operations:** listSubscriptionPlans GET /api/v1/subscription-plans (only if a pricing teaser is kept)
- **Depends on:** FE-UI-003 tokens; FE-UI-009 marketing shell
- **Note:** Removing sections without reference (testimonials, logo cloud, home pricing/contact/blog) is a product decision (DR-030).
- **Discrepancies:** [DR-030](./discrepancy-register.md#dr-030)

### MKT-LEGAL

**Legal (privacy policy and terms)** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicLegal` — 4 reference files (desktop/mobile; dark/light; interactive: document:privacy, document:terms (segmented switch; only privacy drawn)).
- **Status:** Implemented (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/privacy/page.tsx`, `apps/public-portal/src/app/terms/page.tsx`, `apps/public-portal/src/components/legal-page.tsx`, `packages/public-ui/src/components/legal-document.tsx`
- **Works today:** Trello FE-UI-005: 'On this page' contents, Privacy/Terms switch as links with aria-current, numbered sections; both routes kept.
- **Gap:** Legal text remains configurable placeholder copy.
- **Depends on:** FE-UI-009
- **Note:** Keep both routes (linkable, indexable); render the segmented switch as two links (aria-current), not client state.
- **Discrepancies:** [DR-034](./discrepancy-register.md#dr-034)

### MKT-NAV-MOBILE

**Marketing mobile menu** — layout-pattern; target `public-portal`; auth: public.

- **Artboards:** `PublicMobileMenu` — 2 reference files (mobile; dark/light).
- **Status:** Implemented (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-009.
- **Implementation:** `packages/public-ui/src/components/marketing-header.tsx`, `apps/public-portal/src/components/site-header.tsx`, `apps/public-portal/src/app/layout.tsx`
- **Works today:** Trello FE-UI-005: compact bar (brand, Get started, menu) below lg opening a full-screen ui-core Drawer with navigation, both CTAs and a Dark mode switch; focus trap/return, Escape, closes on link choice and at lg.
- **Depends on:** FE-UI-005 Dialog/Sheet
- **Note:** Mobile-only artboards (no desktop variant by design).
- **Discrepancies:** [DR-021](./discrepancy-register.md#dr-021)

### MKT-PRICING

**Pricing** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicPricing` — 4 reference files (desktop/mobile; dark/light; interactive: interval:monthly, interval:yearly (editable .dc.html artboard only)).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-011.
- **Implementation:** `apps/public-portal/src/app/pricing/page.tsx`, `apps/public-portal/src/components/subscription-pricing.tsx`, `apps/public-portal/src/lib/subscription-plans.ts`, `apps/public-portal/src/lib/subscription-pricing.ts`, `packages/public-ui/src/components/plan-card.tsx`, `packages/public-ui/src/components/pricing-intervals.tsx`
- **Works today:** Plans from GET /api/v1/subscription-plans in a streamed Server Component (PlanGridSkeleton while loading); empty and unavailable states; CTA links to User Portal /billing/checkout?planId=&billingInterval=.
- **Works today:** Trello FE-UI-005: plan cards and a Monthly/Yearly switch when plans offer several intervals; questions grid.
- **Operations:** listSubscriptionPlans GET /api/v1/subscription-plans
- **Unsupported / missing backend:** Plan tier label / recommendation flag ('Most popular')
- **Gap:** Reference 'Most popular' badge and featured border are not backed by plan data (OKF forbids local tier labels).
- **Gap:** Reference 'save 17%' interval label omitted (no computed savings).
- **Gap:** FAQ copy is static and must not contradict backend policy.
- **Depends on:** FE-UI-005 SegmentedControl; PlanCard (ui-core)
- **Note:** Interval toggle is client state on a server-rendered list; keep plans loading in Server Components.
- **Note:** Yearly prices appear only in the editable .dc.html artboard, not in the static snapshot.
- **Discrepancies:** [DR-010](./discrepancy-register.md#dr-010), [DR-011](./discrepancy-register.md#dr-011)

### ADM-SIGN-IN

**Admin sign in** — page; target `admin-portal`; auth: public.

- **Artboards:** `AdminSignIn` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-014.
- **Implementation:** `apps/admin-portal/src/app/sign-in/page.tsx`, `apps/admin-portal/src/app/sign-in/sign-in-form.tsx`, `apps/admin-portal/src/lib/sign-in-feedback.ts`, `packages/dashboard-ui/src/components/auth-layout.tsx`, `apps/admin-portal/src/lib/admin-authorization.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): AuthLayout with 'Operations console' panel and 'Admin portal' chip; password flow unchanged; passkey button and authenticator notice omitted (DR-017, DR-041).
- **Operations:** `signIn`; `refreshSession`; `logout`
- **Unsupported / missing backend:** Admin two-factor completion in the admin BFF; Admin passkey BFF routes; Role claim in backend tokens (docs say currently absent)
- **Gap:** Reference offers 'Use a passkey' and implies admins have an authenticator; neither is wired in the Admin Portal.
- **Gap:** Split layout with 'Operations console' panel.
- **Depends on:** FE-UI-008 AuthLayout
- **Note:** Passkey/2FA for admins need new admin BFF routes reusing existing api-client operations; scope as its own ticket.
- **Discrepancies:** [DR-017](./discrepancy-register.md#dr-017), [DR-041](./discrepancy-register.md#dr-041)

### AUTH-CONFIRM-EMAIL

**Confirm email** — page; target `user-portal`; auth: public.

- **Artboards:** `AuthConfirmEmail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/confirm-email/page.tsx`, `apps/user-portal/src/app/confirm-email/confirm-email-form.tsx`, `apps/user-portal/src/lib/email-confirmation-session.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): step 3 with mail icon, six OTP boxes, backend cooldown row, 'Wrong address? Start again'; reason=email_not_confirmed shows the 'Email not confirmed' warning instead of progress.
- **Operations:** `confirmEmail`; `requestEmailConfirmationCode`
- **Gap:** Reference: 6 OTP boxes, 'Resend code in 0:42' countdown row, 'Wrong address? Start again'.
- **Depends on:** FE-UI-007 OTP field

### AUTH-FORGOT-PASSWORD

**Forgot password (request and link sent)** — state-flow; target `user-portal`; auth: public.

- **Artboards:** `AuthForgotPassword`, `AuthForgotSent` — 8 reference files (desktop/mobile; dark/light; states: link-sent, request).
- **Status:** Missing (C); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-013.
- **Implementation:** `apps/user-portal/src/app/api/auth/password-resets/route.ts`
- **Works today:** BFF route and api-client operation exist; no page, no link, not in proxy PUBLIC_PATHS.
- **Operations:** requestPasswordReset POST /api/v1/authentication/password-resets
- **Unsupported / missing backend:** Resend cooldown value (design shows 0:45; backend contract has no retry-at field — verify)
- **Gap:** Whole screen missing; 'sent' is an in-page state after submit and must not reveal whether the account exists.
- **Gap:** 'Open reset page (from email link)' button in the artboard is a prototype affordance - do not implement.
- **Depends on:** FE-UI-008 AuthLayout; proxy PUBLIC_PATHS addition; backend reset-email link target configuration
- **Note:** Add the path to PUBLIC_PATHS explicitly; do not loosen the proxy matcher.
- **Discrepancies:** [DR-015](./discrepancy-register.md#dr-015)
- **Note:** Trello FE-UI-020 owns this screen: design ad9386e uses email entry, then OTP and a new password (not a reset link).

### AUTH-GOOGLE-LINK

**Link Google account** — state-flow; target `user-portal`; auth: public (Google flow cookie).

- **Artboards:** `AuthGoogleLink` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/components/google-link-form.tsx`, `apps/user-portal/src/app/api/auth/google/link/route.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): in-page state of the Google flow; password only (link_required carries no email, DR-086).
- **Operations:** `linkGoogleAccount`
- **Gap:** Reference treats it as a standalone screen; implementation is a state of the Google flow (keep, no new route).
- **Depends on:** FE-UI-008

### AUTH-GOOGLE-REGISTER

**Complete Google sign-up** — state-flow; target `user-portal`; auth: public (Google flow cookie).

- **Artboards:** `AuthGoogleRegister` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/register/registration-form.tsx`, `apps/user-portal/src/app/api/auth/registrations/google/route.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): names and country only; 'Signed in with Google' identity block and terms checkbox omitted (DR-086).
- **Operations:** `signUpWithGoogle`; `getCountries`
- **Gap:** Reference shows a 'Signed in with Google' identity block and a terms checkbox.
- **Depends on:** FE-UI-008; FE-UI-007

### AUTH-MESSAGES

**Sign-in messages and errors catalogue** — reference; target `user-portal`; auth: n/a.

- **Artboards:** `AuthStates` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/lib/auth-feedback.ts`, `apps/user-portal/src/components/auth-feedback-alert.tsx`, `apps/admin-portal/src/lib/sign-in-feedback.ts`, `apps/user-portal/src/lib/sign-in.ts`, `apps/user-portal/src/lib/two-factor.ts`, `apps/user-portal/src/lib/passkey-sign-in.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): titled Alerts mapped from HTTP status / stable error codes; no attempt counts, lockout durations or 'No account for this email' (DR-016); password-updated belongs to the reset flow (FE-UI-020).
- **Unsupported / missing backend:** Remaining-attempts count ('3 attempts left'); Lockout duration ('15 minutes') unless returned by backend
- **Gap:** Catalogue of 11 Alert variants shown above the form; copy and tone must map to existing mappings, not invent numbers.
- **Depends on:** FE-UI-004 Alert
- **Note:** Not a route: use as the copy/visual spec for Alert usage on every auth screen.
- **Discrepancies:** [DR-016](./discrepancy-register.md#dr-016)

### AUTH-PASSKEY-SETUP

**Passkey setup prompt** — page; target `user-portal`; auth: authenticated (no dashboard shell).

- **Artboards:** `AuthPasskeySetup` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/passkey-setup/page.tsx`, `apps/user-portal/src/app/passkey-setup/passkey-setup-prompt.tsx`, `apps/user-portal/src/lib/passkey-setup.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): split layout, benefit list, passkey name field kept (backend binds a name), Create passkey / Skip for now.
- **Operations:** `listPasskeys`; `createPasskeyRegistrationOptions`; `completePasskeyRegistration`
- **Gap:** Reference uses the split auth layout with a benefit list; current page has a passkey name input which the reference omits (keep: backend binds a name).
- **Depends on:** FE-UI-008 AuthLayout

### AUTH-REGISTER

**Register (email and details steps)** — state-flow; target `user-portal`; auth: public.

- **Artboards:** `AuthRegisterEmail`, `AuthRegisterDetails` — 8 reference files (desktop/mobile; dark/light; states: step:details, step:email).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/register/page.tsx`, `apps/user-portal/src/app/register/registration-form.tsx`, `apps/user-portal/src/components/registration-steps.tsx`, `packages/dashboard-ui/src/components/auth-layout.tsx`, `apps/user-portal/src/components/user-auth-layout.tsx`, `apps/user-portal/src/lib/registration.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): Steps Email → Your details → Confirm email; details = profile + password schemas combined (DR-014 adopted); searchable country select kept; policy hint instead of a strength meter.
- **Operations:** `checkEmailExistence`; `getCountries`; `signUp`; `startGoogleAuthenticationFlow`
- **Gap:** Reference has 2 register steps (Email; Your details = names + country + password + confirm) plus 'Confirm email' as step 3 on another route; implementation has 3 register steps.
- **Gap:** Reference shows a password-strength meter; strength rules must mirror backend policy, not invent one.
- **Gap:** Reference uses a native-looking select for country; keep the accessible searchable select.
- **Depends on:** FE-UI-007; FE-UI-006 Steps
- **Note:** Step indicator spans /register and /confirm-email; keep step state in the app, not in URLs, as today.
- **Discrepancies:** [DR-014](./discrepancy-register.md#dr-014)

### AUTH-RESET-PASSWORD

**Reset password (new password, done, link expired)** — state-flow; target `user-portal`; auth: public (token in link).

- **Artboards:** `AuthResetPassword`, `AuthResetDone`, `AuthResetExpired` — 12 reference files (desktop/mobile; dark/light; states: done, link-expired, new-password).
- **Status:** Missing (C); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-013.
- **Implementation:** `apps/user-portal/src/app/api/auth/password-resets/completions/route.ts`
- **Works today:** BFF completion route and api-client operation exist; no page.
- **Operations:** completePasswordReset POST /api/v1/authentication/password-resets/completions
- **Unsupported / missing backend:** Stable error code distinguishing an expired/used token from other failures (verify)
- **Gap:** Whole screen missing; done and expired are in-page states, not separate routes.
- **Gap:** Reference copy claims other sessions are signed out; only state this if the backend guarantees it.
- **Depends on:** AUTH-FORGOT-PASSWORD; proxy PUBLIC_PATHS addition
- **Discrepancies:** [DR-015](./discrepancy-register.md#dr-015)
- **Note:** Trello FE-UI-020 owns this screen: design ad9386e uses email entry, then OTP and a new password (not a reset link).

### AUTH-SIGN-IN

**Sign in** — page; target `user-portal`; auth: public.

- **Artboards:** `AuthSignIn` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/sign-in/page.tsx`, `apps/user-portal/src/app/sign-in/sign-in-form.tsx`, `apps/user-portal/src/app/sign-in/passkey-sign-in-button.tsx`, `apps/user-portal/src/components/google-authentication-button.tsx`, `packages/dashboard-ui/src/components/auth-layout.tsx`, `apps/user-portal/src/components/user-auth-layout.tsx`, `apps/user-portal/src/lib/sign-in.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): AuthLayout split layout; official GIS button kept (DR-013); passkey sign-in; titled alerts from auth-feedback; 'Keep me signed in' omitted (DR-012). 'Forgot password?' renders only with forgotPasswordHref (FE-UI-020).
- **Operations:** `signIn`; `signInWithGoogle`; `startGoogleAuthenticationFlow`; `createPasskeyAuthenticationOptions`; `completePasskeyAuthentication`; `requestEmailConfirmationCode`
- **Unsupported / missing backend:** 'Keep me signed in' (no remember-me parameter; cookie lifetime is fixed by token expiry)
- **Gap:** Split auth layout (form + brand panel) replaces the centered card.
- **Gap:** 'Forgot password?' link targets a route that does not exist yet (AUTH-FORGOT-PASSWORD).
- **Gap:** Reference draws a custom 'Continue with Google' button; implementation must keep Google's official GIS button (OKF constraint, Google branding).
- **Depends on:** FE-UI-008 AuthLayout; FE-UI-007 forms
- **Discrepancies:** [DR-012](./discrepancy-register.md#dr-012), [DR-013](./discrepancy-register.md#dr-013)

### AUTH-TWO-FACTOR

**Two-factor challenge** — page; target `user-portal`; auth: public (challenge cookie).

- **Artboards:** `AuthTwoFactor` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/sign-in/two-factor/page.tsx`, `apps/user-portal/src/app/sign-in/two-factor/two-factor-sign-in-form.tsx`, `apps/user-portal/src/lib/two-factor.ts`
- **Works today:** Trello FE-UI-006 (design ad9386e): authenticator/recovery code switch in the reference help panel, explicit 'Verify and sign in', expiry state on Alert in the same layout (DR-040 resolved).
- **Operations:** `completeTwoFactorChallenge`
- **Gap:** Reference shows recovery-code option as an inline help panel; expiry state is not designed (keep existing).
- **Depends on:** FE-UI-007 OTP field
- **Discrepancies:** [DR-040](./discrepancy-register.md#dr-040)

### USR-BILLING

**Billing and plans** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserBilling` — 24 reference files (desktop/mobile; dark/light; states: active, cancelling, expired, none, pastdue, pending).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018 (UI delivered by Trello FE-UI-010, design `ad9386e`; see DR-055–DR-058).
- **Implementation:** `apps/user-portal/src/app/billing/page.tsx`, `apps/user-portal/src/app/billing/billing-overview.tsx`, `apps/user-portal/src/app/billing/current-subscription-card.tsx`, `apps/user-portal/src/app/billing/subscription-plan-grid.tsx`, `apps/user-portal/src/lib/billing-view.ts`
- **Works today:** View switch (loading/error/discovery/pending/subscription) from current subscription; plan grid with interval toggle; cancel at period end with confirmation; history placement rules.
- **Operations:** `getCurrentSubscription`; `listSubscriptionPlans`; `getBillingHistory`; `cancelSubscriptionAtPeriodEnd`
- **Unsupported / missing backend:** Resume/keep subscription; Pay now for PastDue; Ended-subscription read (current returns 404 once ended); Saved payment method summary; Plan tier label
- **Gap:** Reference states: active, cancelling ('Keep subscription'), pastdue ('Pay now'), pending ('Check status', 'Resume payment'), none, expired ('Your Standard plan expired').
- **Gap:** 'Keep subscription', 'Pay now' and the expired banner are unsupported; 'Most popular' badge unsupported.
- **Gap:** Period progress bar is presentational from backend period dates (allowed).
- **Depends on:** FE-UI-004; PlanCard; FE-UI-008
- **Note:** billing-view.ts stays the single owner of layout rules; restyle only.
- **Discrepancies:** [DR-010](./discrepancy-register.md#dr-010), [DR-055](./discrepancy-register.md#dr-055)

### USR-BILLING-HISTORY

**Billing history** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserBillingHistory` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-018 (UI delivered by Trello FE-UI-010, design `ad9386e`; see DR-055–DR-058).
- **Implementation:** `apps/user-portal/src/app/billing/history/page.tsx`, `apps/user-portal/src/app/billing/billing-history-card.tsx`
- **Works today:** Server-paginated table (page size 20) with 7 columns, reference copy button, empty/loading/error.
- **Operations:** `getBillingHistory`
- **Unsupported / missing backend:** Status filter parameter; CSV export; Purchase id on history rows (rows carry paymentTransactionId/subscriptionId, not purchaseId)
- **Gap:** Reference: All/Paid/Failed filter, Export CSV, 5 columns + 'View' link, Prev/Next pager with 'Showing 1-6 of 6'.
- **Gap:** Reference drops Billing period and Reference columns, conflicting with the OKF 'keep all seven columns' rule.
- **Gap:** Mobile reference stacks rows as cards instead of horizontal scroll.
- **Depends on:** FE-UI-006 DataTable
- **Discrepancies:** [DR-058](./discrepancy-register.md#dr-058)

### USR-CHECKOUT

**Checkout** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserCheckout` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018 (UI delivered by Trello FE-UI-010, design `ad9386e`; see DR-055–DR-058).
- **Implementation:** `apps/user-portal/src/app/billing/checkout/page.tsx`, `apps/user-portal/src/app/billing/checkout/checkout-view.tsx`, `apps/user-portal/src/app/billing/checkout/plan-picker.tsx`, `apps/user-portal/src/lib/checkout-submission.ts`, `apps/user-portal/src/lib/checkout-attempt.ts`
- **Works today:** Plan picker or order summary; eligible providers; PaymentLink/BankTransfer (Card disabled); auto-renew; idempotent purchase; hosted redirect or bank-transfer instructions.
- **Operations:** `listSubscriptionPlans`; `listEligiblePaymentProviders`; `purchaseSubscription`
- **Unsupported / missing backend:** Tax/VAT line; Next charge date in summary (must come from backend)
- **Gap:** Reference: provider radio cards, auto-renew switch, sticky order summary with 'VAT Included' and 'Next charge' copy not provided by the backend.
- **Gap:** Bank-transfer instructions have no reference; compose from primitives.
- **Depends on:** FE-UI-005 RadioGroup/Switch; FE-UI-007
- **Note:** Idempotency and attempt storage logic must not change in a visual ticket.
- **Discrepancies:** [DR-056](./discrepancy-register.md#dr-056)

### USR-CHECKOUT-RESULT

**Checkout result** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserCheckoutResult` — 12 reference files (desktop/mobile; dark/light; states: cancelled, pending, success).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018 (UI delivered by Trello FE-UI-010, design `ad9386e`; see DR-055–DR-058).
- **Implementation:** `apps/user-portal/src/app/billing/checkout/payment-return.tsx`, `apps/user-portal/src/app/billing/checkout/payment-result.tsx`, `apps/user-portal/src/lib/payment-return.ts`
- **Works today:** Outcome resolved only from purchase status polling (3 s x 40); ~10 views (checking, missing, active, activating, pending, not completed, cancelled, failed/expired, underpaid/blocked, unknown).
- **Operations:** `getSubscriptionPurchaseStatus`; `listSubscriptionPlans`
- **Unsupported / missing backend:** Receipt ('View receipt')
- **Gap:** Reference designs 3 states (success, pending, cancelled); the other existing outcomes must reuse the same result template.
- **Gap:** Route is a wording hint only; never show success from the URL.
- **Depends on:** FE-UI-004
- **Discrepancies:** [DR-057](./discrepancy-register.md#dr-057)

### USR-DASHBOARD

**Overview dashboard** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserDashboard` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-015 (delivered by Trello FE-UI-007).
- **Implementation:** `apps/user-portal/src/app/dashboard/page.tsx`, `dashboard-live.tsx`, `dashboard-sections.tsx`, `dashboard-overview.ts`, `dashboard-preview.fixtures.ts`, `loading.tsx`, `error.tsx`
- **UI implemented:** greeting header with View billing, four metric tiles, profile summary, security checklist, recent billing activity (stacked rows on phones); per-widget loading, empty, error and retry states.
- **Existing integration preserved:** identity from the server-side `getProfile`; empty-profile state.
- **Live (existing hooks, no new operations or BFF routes):** current plan (`getCurrentSubscription`), security score and checklist (`getTwoFactorStatus`, `listPasskeys`), active sessions (`listActiveSessions`), recent billing activity (first `getBillingHistory` page, shared with Billing).
- **Unsupported, shown honestly:** wallet tile "Not available"; KYC callout, "Top up wallet", country/language/member-since and wallet activity are not rendered.
- **Preview-only:** typed reference fixtures (wallet balance, KYC callout, mixed wallet/billing rows) used by tests only; a test forbids production imports.
- **Gap:** security score counts three backend-reported steps; the password is not scored ([DR-087](./discrepancy-register.md#dr-087)). Recent activity is billing history only.
- **Discrepancies:** [DR-018](./discrepancy-register.md#dr-018), [DR-050](./discrepancy-register.md#dr-050), [DR-087](./discrepancy-register.md#dr-087), [DR-088](./discrepancy-register.md#dr-088)

### USR-INVOICE-DETAIL

**Invoice detail** — page; target `user-portal`; auth: authenticated (owner-scoped).

- **Artboards:** `UserInvoiceDetail` (states due, overdue, paid) — 12 reference files (desktop/mobile; dark/light); `PrintInvoice` — 1 print reference (A4, light). Design revision `ad9386e`.
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-018.
- **Composition (Trello FE-UI-018):** `apps/user-portal/src/features/billing-documents/` — `billing-documents-model.ts` (local invoice/receipt types, statuses, UTC dates, sheet content), `invoice-detail-screen.tsx` (back link, header with Print and Download PDF, document sheet, summary card), `document-parts.tsx`, `billing-documents-preview.fixtures.ts` (tests only; every state by name); sheet from `@template/dashboard-ui/documents`. Rendered by the static and browser tests only; no route, navigation item, API call or production import.
- **Actions:** Print uses the browser; Download PDF and Email me a copy are disabled with a visible reason; there is no Pay action; View receipt links only with a receipt id.
- **Print:** browser print CSS scoped to pages containing the sheet: the dashboard shell, page header and summary are hidden; the light sheet fills the printable width, repeats the line-item header and keeps rows and totals whole. No print route and no PDF generation.
- **Unsupported / missing backend (BE-DS-007):** Owner-scoped invoice read; invoice ids on billing-history rows and purchase status; invoice PDF, email copy and payment operations
- **Gap:** No invoice or receipt entity, read, render, email or payment operation exists in the backend or api-client (DR-160). Reference issuer placeholders, legal footer, VAT copy, payment-method promises and page numbering are not rendered unless the document model supplies them (DR-161).
- **Depends on:** USR-BILLING-HISTORY; backend invoice read model
- **Discrepancies:** [DR-160](./discrepancy-register.md#dr-160), [DR-161](./discrepancy-register.md#dr-161), [DR-162](./discrepancy-register.md#dr-162), [DR-164](./discrepancy-register.md#dr-164)

### USR-NAV-MOBILE

**User portal mobile navigation (top bar, tab bar, drawer)** — layout-pattern; target `user-portal`; auth: authenticated.

- **Artboards:** `UserMobileMenu` — 2 reference files (mobile; dark/light), revision `a7e2a63` (unchanged since `d23eb85`).
- **Status:** Implemented (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-008 (delivered by Trello FE-UI-004).
- **Implementation:** `apps/user-portal/src/components/user-layout-shell.tsx`, `apps/user-portal/src/config/navigation.ts`, `packages/dashboard-ui/src/components/{dashboard-shell,dashboard-topbar,mobile-nav,mobile-tab-bar,sidebar}.tsx`
- **Works today:** Mobile top bar (menu, brand, account menu); phone tab bar Home, Billing, Security, Account; 304px drawer with profile identity, the implemented destinations, Dark mode switch and Sign out. Tablet (`md`–`lg`) uses top bar + drawer without the tab bar.
- **Operations:** getProfile (identity in top bar and drawer)
- **Gap:** Wallet (tab and drawer) and Verification are omitted until their routes ship. Preferences (Trello FE-UI-007) is in the sidebar and drawer, not the tab bar.
- **Note:** Mobile-only artboards. "Account" links to `/profile`, as the reference markup does.
- **Discrepancies:** [DR-022](./discrepancy-register.md#dr-022), [DR-023](./discrepancy-register.md#dr-023)

### USR-PREFERENCES

**Preferences** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserPreferences` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (C); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-020 (delivered by Trello FE-UI-007).
- **Implementation:** `apps/user-portal/src/app/preferences/page.tsx`; navigation in `config/navigation.ts` and `components/user-layout-shell.tsx`.
- **UI implemented:** Theme card with the shared `ThemeSelect` (Light/Dark/System), applied immediately and stored per portal origin by the existing `ThemeProvider`; sidebar item after Security; breadcrumb Account › Preferences. Not in the phone tab bar.
- **Preview-only:** Language (disabled, English only) and Email notifications ("Proposed": security alerts always on and not toggleable; billing and product updates "Not available"). No save action or success message.
- **Unsupported / missing backend:** language preference and localization; email notification preferences; account-level (cross-device) theme.
- **Discrepancies:** [DR-051](./discrepancy-register.md#dr-051), [DR-090](./discrepancy-register.md#dr-090)

### USR-PROFILE

**Profile** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserProfile` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-016 (delivered by Trello FE-UI-007).
- **Implementation:** `apps/user-portal/src/app/profile/page.tsx`, `profile-edit-form.tsx`, `profile-update-submission.ts`, `avatar-upload-control.tsx`, `avatar-upload-guard.ts`; `apps/user-portal/src/lib/avatar-upload.ts`, `profile-editing.ts`, `profile-display.ts`
- **UI implemented:** Photo card and Personal information card (Cancel resets, Save changes); verification badge in the card header; indeterminate upload status and a success message only after completion.
- **Existing integration preserved:** server-side `getProfile`; `updateProfile` with Zod and backend validation mapping and profile cache invalidation; signed direct avatar upload (create → storage request without credentials → complete) with duplicate-upload guard, input reset and refresh; BFF routes unchanged.
- **Operations:** `getProfile`; `updateProfile`; `createAvatarUpload`; `completeAvatarUpload`
- **Unsupported, shown honestly:** Remove is disabled with an explanation; Country, "Last updated" and the Connected sign-in card are not rendered; no 5 MB / JPG, PNG, WebP claim (no client or contract limit exists).
- **Discrepancies:** [DR-019](./discrepancy-register.md#dr-019), [DR-089](./discrepancy-register.md#dr-089)

### USR-PURCHASE-DETAIL

**Purchase detail** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserPurchaseDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (B); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-018 (UI delivered by Trello FE-UI-010, design `ad9386e`; see DR-055–DR-058).
- **Implementation:** `apps/user-portal/src/app/billing/purchases/[purchaseId]/page.tsx`, `apps/user-portal/src/app/billing/purchases/[purchaseId]/purchase-status-view.tsx`
- **Works today:** Purchase status card with polling, bank-transfer details and blocked/underpaid warnings.
- **Operations:** `getSubscriptionPurchaseStatus`
- **Unsupported / missing backend:** Purchase timeline events; Receipt download; Navigation from history rows (no purchaseId on rows)
- **Gap:** Reference: details key-value card + event timeline + 'Download receipt'; only current status is available. View invoice / View receipt stay omitted: the purchase carries no invoice or receipt id (DR-160).
- **Depends on:** FE-UI-006 Timeline
- **Discrepancies:** [DR-057](./discrepancy-register.md#dr-057), [DR-058](./discrepancy-register.md#dr-058)

### USR-RECEIPT-DETAIL

**Receipt detail** — page; target `user-portal`; auth: authenticated (owner-scoped).

- **Artboards:** `UserReceiptDetail` (states subscription, wallet) — 8 reference files (desktop/mobile; dark/light); `PrintReceipt` — 1 print reference (A4, light). Design revision `ad9386e`.
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-018.
- **Composition (Trello FE-UI-018):** `receipt-detail-screen.tsx` in `apps/user-portal/src/features/billing-documents/` — one composition for subscription and wallet receipts (amount paid and time, parties, method, reference, line items, totals, payment card); the "For" row links an invoice only by its id. Rendered only by tests; no route, navigation item, API call or production import.
- **Actions:** as `USR-INVOICE-DETAIL`; no Pay. A successful purchase or wallet top-up is never presented as a receipt.
- **Unsupported / missing backend (BE-DS-007):** Owner-scoped receipt read; receipt ids on billing-history, purchase status and wallet rows; receipt PDF and email copy operations
- **Gap:** No invoice or receipt entity, read, render, email or payment operation exists in the backend or api-client (DR-160).
- **Depends on:** USR-BILLING-HISTORY; USR-WALLET; backend receipt read model
- **Discrepancies:** [DR-160](./discrepancy-register.md#dr-160), [DR-161](./discrepancy-register.md#dr-161), [DR-162](./discrepancy-register.md#dr-162), [DR-164](./discrepancy-register.md#dr-164)

### USR-SECURITY

**Security (overview, password, passkeys, two-factor, sessions, activity)** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserSecurity` — 24 reference files (desktop/mobile; dark/light; states: activity, overview, passkeys, password, sessions, two-factor).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-017 (delivered by Trello FE-UI-008).
- **Implementation:** `apps/user-portal/src/app/security/page.tsx`, `apps/user-portal/src/app/security/security-tab.ts`, `apps/user-portal/src/app/security/security-tabs.tsx`, `apps/user-portal/src/app/security/security-overview.ts`, `apps/user-portal/src/app/security/security-overview-card.tsx`, `apps/user-portal/src/app/security/password-change-card.tsx`, `apps/user-portal/src/app/security/passkeys-card.tsx`, `apps/user-portal/src/app/security/two-factor-security-card.tsx`, `apps/user-portal/src/app/security/active-sessions-card.tsx`, `apps/user-portal/src/app/security/security-activity-card.tsx`, `apps/user-portal/src/app/security/activity-presentation.tsx`
- **UI implemented:** six URL-addressable tabs (`?tab=overview|password|passkeys|two-factor|sessions|activity`; absent/unknown → overview) on design-system primitives, light/dark, phone to desktop.
- **Existing integration preserved:** password change (backend validation mapping); passkey register/rename/remove (WebAuthn ceremony); 2FA status/setup/verify/regenerate/disable with proof; sessions revoke one/others (each now confirmed); cursor-paginated activity ("Load more").
- **Overview:** protection score out of three backend facts (2FA on, one passkey, backup passkey; the password is never scored); pending while loading, "unavailable" if a query fails; three newest events from the shared activity query; passkey and 2FA statuses plus a "Change password" link (no password status).
- **Preview-only:** none.
- **Operations:** `changePassword`; `getTwoFactorStatus`; `setupTwoFactor`; `verifyTwoFactorEnrollment`; `regenerateRecoveryCodes`; `disableTwoFactor`; `listActiveSessions`; `revokeSession`; `revokeOtherSessions`; `getSecurityActivity`; `listPasskeys`; `createPasskeyRegistrationOptions`; `completePasskeyRegistration`; `renamePasskey`; `removePasskey`
- **Unsupported / missing backend (omitted):** Passkey last-used date; Password last-changed date / strength status; 'Sign out of all other sessions' option on password change; Two-factor enrollment date and total recovery-code count
- **Gap:** Reference masks IPs (102.89.x.x); sessions and activity keep the backend IP as a lookup link until OD-09 is decided (DR-052).
- **Gap:** Activity table adds an IP address column and keeps cursor "Load more" instead of a numbered pager (DR-100).
- **Discrepancies:** [DR-052](./discrepancy-register.md#dr-052), [DR-053](./discrepancy-register.md#dr-053), [DR-096](./discrepancy-register.md#dr-096), [DR-097](./discrepancy-register.md#dr-097), [DR-099](./discrepancy-register.md#dr-099), [DR-100](./discrepancy-register.md#dr-100), [DR-101](./discrepancy-register.md#dr-101)

### USR-TWO-FACTOR-SETUP

**Two-factor setup dialog and recovery codes** — overlay, child of `USR-SECURITY`; target `user-portal`; auth: authenticated.

- **Artboards:** `UserTwoFactorSetup` — 4 reference files (desktop/mobile; dark/light; interactive: step:2-of-3 (scan + verify), step:3-of-3 (recovery codes)).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-017 (delivered by Trello FE-UI-008).
- **Implementation:** `apps/user-portal/src/app/security/two-factor-security-card.tsx`, `apps/user-portal/src/app/security/two-factor-setup-dialog.tsx`, `apps/user-portal/src/app/security/two-factor-proof-dialog.tsx`, `apps/user-portal/src/app/security/recovery-codes-panel.tsx`, `apps/user-portal/src/app/security/two-factor-flow.ts`
- **UI implemented:** three-step `Dialog` on `/security` (1 explain, 2 QR + grouped manual key with copy + six-digit code, 3 recovery codes with download/copy and an "I have saved my recovery codes" gate before Finish); focus trap, Escape and focus return from ui-core `Dialog`.
- **Existing integration preserved:** `setupTwoFactor`; `verifyTwoFactorEnrollment`; `regenerateRecoveryCodes`; disable and regenerate still require an authenticator (6-digit) or recovery-code (10-character) proof.
- **Gap:** Step 1 is not drawn in the reference; implemented as a short explanation (DR-098).
- **Depends on:** FE-UI-005 Dialog
- **Note:** Recovery codes remain ephemeral UI state, shown exactly as returned and cleared on Finish; the codes step cannot be dismissed. Never persisted or put in fixtures that resemble real codes in production bundles.
- **Discrepancies:** [DR-060](./discrepancy-register.md#dr-060), [DR-098](./discrepancy-register.md#dr-098)

### USR-VERIFICATION

**Identity verification (KYC)** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserVerification` — 24 reference files (desktop/mobile; dark/light; states: expired, inprogress, notstarted, pending, rejected, verified).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-022.
- **Works today:** Only profile.isVerified is displayed.
- **Composition (Trello FE-UI-009):** `apps/user-portal/src/features/verification/` — `verification-model.ts` (six-state union, history, loading/error/unknown, action availability, date formatting), `verification-sections.tsx` (header, status panel, instruction steps, history table with stacked phone rows, action slot), `verification-preview.fixtures.ts` (deterministic fixtures, tests only). All six states, loading, error, unknown and empty history are rendered by `verification-screen.test.tsx`; no route, navigation item or production import.
- **Actions:** start / continue / retry / refresh are intents reported through `onAction`; without a handler they render disabled with "Identity verification is not available yet." Pending offers only Refresh status; verified has none; rejected without retry shows the configured support email.
- **Unsupported / missing backend:** KYC session creation (hosted provider link); Verification status and attempt history; Retry rules
- **Gap:** No production route, navigation item or data adapter until a KYC API exists. CAF-FE-006 adds `/verification` (breadcrumb Account > Verification, sidebar after Profile) and maps the API into the view model.
- **Depends on:** Backend KYC API
- **Note:** Blocked for production. Previews are typed fixtures rendered by app tests, never the workbench (no duplicate pages).
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054), [DR-102](./discrepancy-register.md#dr-102), [DR-103](./discrepancy-register.md#dr-103)

### USR-WALLET

**Wallet** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserWallet` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-021.
- **Implementation:** `apps/user-portal/src/features/wallet/wallet-model.ts`, `apps/user-portal/src/features/wallet/wallet-screen.tsx`, `apps/user-portal/src/features/wallet/wallet-preview.fixtures.ts`, `packages/api-client/src/payments/operations.ts`, `packages/api-react/src/payments`
- **Works today:** api-client/api-react wallet transaction operations exist.
- **Composition (Trello FE-UI-011, design `ad9386e`):** `apps/user-portal/src/features/wallet/` — `wallet-model.ts` (summary figures, transaction list typed on `WalletTransactionResponse` plus preview-only status/provider/reference, filters, top-up config, intents, amount parsing), `wallet-screen.tsx` (header with Top up, summary tiles, filters, transactions table with stacked phone rows and Load more), `wallet-top-up-dialog.tsx`, `wallet-preview.fixtures.ts` (tests only). Rendered by `wallet-screen.test.tsx`; no route, navigation item, API call or production import.
- **Actions:** top up, status filter, date range, load more and reload are intents reported through `onAction`; without a handler (or without source support) they render disabled with an explanation. Summary figures without a source read "Not available", never zero.
- **Operations:** getWalletTransactions GET /api/v1/payments/wallet-transactions
- **Unsupported / missing backend:** Wallet balance / pending / funded-this-month aggregates; Transaction status, provider and reference fields on list rows; Status/date-range filters
- **Gap:** List rows expose title/category/type/amount/timestamp only; reference columns Provider, Reference, Status are unsupported.
- **Depends on:** Backend wallet read model; FE-UI-006
- **Note:** Frontend must never compute balances from transaction pages. Blocked for production until the wallet read model exists (BE-DS-005); the Receipt column stays omitted: rows carry no receipt id and receipts are preview-only (FE-UI-018, DR-160).
- **Discrepancies:** [DR-059](./discrepancy-register.md#dr-059), [DR-113](./discrepancy-register.md#dr-113), [DR-115](./discrepancy-register.md#dr-115)

### USR-WALLET-TOP-UP

**Wallet top-up dialog** — overlay, child of `USR-WALLET`; target `user-portal`; auth: authenticated.

- **Artboards:** `UserWalletTopUp` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-021.
- **Works today:** initiatePayment and getWalletTopUpTransaction operations exist.
- **Composition (Trello FE-UI-011):** `wallet-top-up-dialog.tsx` on ui-core `Dialog` — amount (minor-unit parsing, optional limits), preset buttons (`aria-pressed`), provider select and redirect notice; submit validates and reports a `topUp` intent only (no charge, redirect or result screen). Not dismissible while pending.
- **Operations:** initiatePayment POST /api/v1/payments/initiate; `getWalletTopUpTransaction`
- **Unsupported / missing backend:** Provider list for top-ups (eligible providers); Per-intent Bachs return URLs (shared with subscriptions today)
- **Gap:** Amount + preset chips + provider select + redirect notice; return/result handling not designed.
- **Depends on:** USR-WALLET; backend return-URL fix
- **Discrepancies:** [DR-059](./discrepancy-register.md#dr-059), [DR-113](./discrepancy-register.md#dr-113), [DR-114](./discrepancy-register.md#dr-114)

### ADM-ACTIVE-USERS

**Active-user analytics** — page; target `admin-portal`; auth: admin (users.analytics.read).

- **Artboards:** `AdminActiveUsers` — 4 reference files (desktop/mobile; dark/light; interactive: range:7d|30d|90d|custom, day-selected drill-down).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-active-user-analytics/` — supplied DAU/WAU/MAU and stickiness metrics, daily chart with controlled day drill-down (typed ISO date), preset and custom UTC ranges, and a paged activity table titled with the selected date ([DR-135](./discrepancy-register.md#dr-135)). No route, navigation item or production source; deterministic fixtures are test-only.
- **Unsupported / missing backend:** DAU/WAU/MAU and per-day active-user list
- **Gap:** Stat tiles, daily chart with day drill-down, table.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-ALLOCATE

**Allocate subscription** — page; target `admin-portal`; auth: admin (subscriptions.allocate).

- **Artboards:** `AdminAllocate` — 4 reference files (desktop/mobile; dark/light; interactive: owner:user, owner:tenant, overlap-warning).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-subscriptions/allocate-screen.tsx` + `allocation-model.ts` — User/Tenant control, tenant, user lookup (user only), active plan, UTC start date, contract durations, auto-renew, required reason; summary without a computed period end; overlap warning as reported state; confirmation reports an intent. No submission without a handler.
- **Unsupported / missing backend:** Complimentary allocation endpoint; Tenant list; User lookup
- **Gap:** Form with owner type segmented control, plan, start, duration, auto-renew, required reason; summary + overlap warning.
- **Depends on:** ADM-SUBSCRIPTIONS
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-133](./discrepancy-register.md#dr-133)

### ADM-AUDIT

**Audit history** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminAudit` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-030.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-audit/` — immutable event table, UTC dates, actor/action/resource/outcome presentation, controlled search, range and source-supplied actor/action options, paging, and export/detail intents gated by their own availability. No route, navigation item or production source.
- **Unsupported / missing backend:** Audit-log API (reference itself says 'Proposed screen - needs an audit-log API')
- **Gap:** Search, action/actor/date filters, table, CSV export.
- **Depends on:** audit API
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-DASHBOARD

**Operations overview** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminDashboard` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (C); **backend:** Missing; **priority:** P2; **ticket:** FE-UI-023.
- **Implementation:** `apps/admin-portal/src/app/page.tsx`, `apps/admin-portal/src/app/_dashboard/admin-dashboard.tsx`, `apps/admin-portal/src/app/_dashboard/admin-dashboard-data.ts`, `apps/admin-portal/src/app/_dashboard/admin-dashboard-preview.fixtures.ts`, `apps/admin-portal/src/components/admin-patterns/index.ts`
- **Works today:** UI implemented (Trello FE-UI-012): Operations overview header with a UTC reporting-period select, four KPI tiles, registrations and payments chart frames, KYC queue, subscriptions needing attention and payment providers cards; responsive one-to-four-column grids. Unsupported, shown honestly: every panel is 'Not available' with its missing API; the period select is disabled; no 'Open …' links (routes do not exist). Preview-only: typed reference figures in admin-dashboard-preview.fixtures.ts, used by tests only; a test forbids production imports.
- **Unsupported / missing backend:** Admin analytics summaries (users, DAU, payment volume, MRR); KYC queue counts; Subscription attention counts; Provider status read
- **Gap:** Live data for every tile, chart and summary card (admin read APIs).
- **Depends on:** FE-UI-008 admin shell; admin analytics APIs
- **Note:** No mock numbers in production; replace each productionAdminDashboard field with a live read when its API exists (admin-patterns.md).
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-074](./discrepancy-register.md#dr-074), [DR-110](./discrepancy-register.md#dr-110)

### ADM-FORBIDDEN

**403 forbidden state** — state-flow; target `admin-portal`; auth: admin.

- **Artboards:** `AdminForbidden` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (C); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-023.
- **Implementation:** `apps/admin-portal/src/components/admin-patterns/forbidden.tsx`, `apps/admin-portal/src/components/admin-patterns/forbidden-details.ts`, `apps/admin-portal/src/proxy.ts`, `apps/admin-portal/src/lib/admin-authorization.ts`
- **Works today:** Non-admin sessions are still redirected to sign-in by the proxy (unchanged). Reusable AdminForbidden (Trello FE-UI-012): 403 card, permission text only when supplied, Back to dashboard (/), Copy request details limited to status, path without query, correlation id and UTC time; forbiddenDetailsFromError maps a 403 ApiError. No live consumer: the admin portal has no backend reads that can return 403 yet.
- **Unsupported / missing backend:** Permission names in tokens or a permissions endpoint (reference cites payments.analytics.read)
- **Gap:** Wire into admin screens when their backend reads exist.
- **Depends on:** FE-UI-008
- **Note:** Render when a backend call returns 403 inside an admitted admin session; never relax the proxy role check.
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073), [DR-111](./discrepancy-register.md#dr-111)

### ADM-INVOICE-DETAIL

**Invoice detail (admin)** — page; target `admin-portal`; auth: admin (invoices.read; invoices.manage for actions).

- **Artboards:** `AdminInvoiceDetail` — 4 reference files (desktop/mobile; dark/light), revision `ad9386e`.
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-018.
- **Composition (Trello FE-UI-018):** `apps/admin-portal/src/features/admin-invoices/invoice-detail.tsx` — header with status and Print, the shared invoice document sheet, an invoice card (customer, subscription, payment, receipt; links only through ids and caller URL builders) with Resend and Download PDF disabled with their reason, and a history timeline; loading/error/not found/unavailable/forbidden states. In print only the document remains.
- **Unsupported / missing backend (BE-DS-007):** Admin invoice detail; resend and invoice PDF operations
- **Gap:** No invoice or receipt entity, read, render, email or payment operation exists in the backend or api-client (DR-160).
- **Depends on:** ADM-INVOICES
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-160](./discrepancy-register.md#dr-160), [DR-161](./discrepancy-register.md#dr-161), [DR-162](./discrepancy-register.md#dr-162), [DR-164](./discrepancy-register.md#dr-164)

### ADM-INVOICES

**Invoices and receipts** — page; target `admin-portal`; auth: admin (invoices.read).

- **Artboards:** `AdminInvoices` — 4 reference files (desktop/mobile; dark/light), revision `ad9386e`.
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-018.
- **Composition (Trello FE-UI-018):** `apps/admin-portal/src/features/admin-invoices/` — `invoices-model.ts` (local row/detail types, status, sheet content), `invoices-list.tsx` (disabled Export CSV, four KPI tiles, disabled status and date-range filters, eight-column table, pager), `invoices-preview.fixtures.ts` (tests only; every state by name); shared states in `admin-billing-shared/`. Rendered by the static and browser tests only; no route, navigation item or production import.
- **Unsupported / missing backend (BE-DS-007):** Admin invoice search/list; KPI aggregates; CSV export
- **Gap:** The reference adds an "Invoices" item under Operations; production navigation stays Dashboard-only until the route and API exist (DR-163).
- **Depends on:** FE-UI-006; backend admin invoice API
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-160](./discrepancy-register.md#dr-160), [DR-162](./discrepancy-register.md#dr-162), [DR-163](./discrepancy-register.md#dr-163)

### ADM-KYC

**KYC monitoring** — page; target `admin-portal`; auth: admin (kyc.read).

- **Artboards:** `AdminKyc` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-028.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-kyc/` — `AdminKycScreen`: four `AdminKpiCard` count tiles (unavailable is never 0), search/status/provider/UTC period filters inert without a handler, verification table with status badges (incl. Failed and Unknown), pager, empty/filtered-empty/loading/error/forbidden. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Unsupported / missing backend:** KYC verification list and counts
- **Gap:** Route `/kyc`, navigation item and adapter.
- **Depends on:** Backend KYC API
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054), [DR-124](./discrepancy-register.md#dr-124)

### ADM-KYC-DETAIL

**KYC detail** — page; target `admin-portal`; auth: admin (kyc.read).

- **Artboards:** `AdminKycDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-028.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-kyc/` — read-only `AdminKycDetailScreen`: verification key-values, user card, status timeline, previous attempts, provider-decision notice, unknown-status warning. Refresh status is the only intent (`onRefresh`), disabled with an explanation without it; no approve, reject or override. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Unsupported / missing backend:** Verification detail, status history, refresh-from-provider
- **Gap:** Route `/kyc/[verificationId]` and adapter.
- **Depends on:** ADM-KYC
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054), [DR-124](./discrepancy-register.md#dr-124)

### ADM-NAV-MOBILE

**Admin mobile navigation (top bar and drawer)** — layout-pattern; target `admin-portal`; auth: admin.

- **Artboards:** `AdminMobileMenu` — 2 reference files (mobile; dark/light), revision `a7e2a63` (adds Invoices under Operations).
- **Status:** Implemented (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-008 (delivered by Trello FE-UI-004).
- **Implementation:** `apps/admin-portal/src/components/admin-layout-shell.tsx`, `apps/admin-portal/src/config/navigation.ts`, `packages/dashboard-ui/src/components/{dashboard-shell,dashboard-topbar,mobile-nav,sidebar}.tsx`
- **Works today:** Mobile top bar (menu, brand with Admin chip, account menu); drawer with grouped navigation, the admitted role, Dark mode switch and Sign out. Only implemented routes are listed (Dashboard).
- **Unsupported / missing backend:** Global admin search API (top-bar search)
- **Gap:** The 17 reference destinations appear only with their routes and admin APIs; the full grouped navigation is previewed in the UI workbench.
- **Gap:** Identity shows the admitted role, not a name (no admin profile read).
- **Note:** Mobile-only artboards.
- **Discrepancies:** [DR-022](./discrepancy-register.md#dr-022), [DR-027](./discrepancy-register.md#dr-027), [DR-070](./discrepancy-register.md#dr-070), [DR-071](./discrepancy-register.md#dr-071), [DR-075](./discrepancy-register.md#dr-075)

### ADM-PAYMENT-ANALYTICS

**Payment analytics** — page; target `admin-portal`; auth: admin (payments.analytics.read).

- **Artboards:** `AdminPaymentAnalytics` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-payment-analytics/` — currency-scoped supplied metrics, volume/outcome charts, provider and intent breakdowns, controlled filters with source-supplied currency and provider options, and screen-level loading/error/forbidden states. Figures stay labelled with the reported currency during filter transitions ([DR-136](./discrepancy-register.md#dr-136)); missing values stay unavailable; no route or production source.
- **Unsupported / missing backend:** Payment volume/success aggregates by status, provider and intent
- **Gap:** 7 stat tiles, stacked bar chart, donut, two breakdown tables, filter buttons.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-PAYMENT-DETAIL

**Payment detail** — page; target `admin-portal`; auth: admin (payments.read).

- **Artboards:** `AdminPaymentDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-027.
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-payments/payment-detail.tsx` — key-value card, fulfillment outcome alert (from reported fulfillment only, never inferred from payment status), status timeline, webhooks/reconciliation table; missing history/logs say so. Read-only: no refund, retry, copy-link or invoice actions (FE-UI-018).
- **Unsupported / missing backend:** Payment detail, fulfillment outcome, status history, webhook/reconciliation log
- **Gap:** kv card, outcome alert, timeline, events table.
- **Depends on:** ADM-PAYMENTS
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-130](./discrepancy-register.md#dr-130), [DR-131](./discrepancy-register.md#dr-131)

### ADM-PAYMENTS

**Payments** — page; target `admin-portal`; auth: admin (payments.read).

- **Artboards:** `AdminPayments` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-027.
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-payments/` — `payments-model.ts` (row/detail types, status, intent and fulfillment presentation, URL filter helpers), `payments-list.tsx` (Export CSV intent, search + five filters, eight-column table, pager), `payments-preview.fixtures.ts` (tests only); shared states in `admin-billing-shared/`. Rendered only by `payments-screens.test.tsx`; no route, navigation item or production import. Filters, export and row links are inert without caller handlers/routes.
- **Unsupported / missing backend:** Admin payment transaction search/list
- **Gap:** Search, 5 filters, 8-column table, CSV export.
- **Depends on:** FE-UI-006
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-130](./discrepancy-register.md#dr-130)

### ADM-PLANS

**Plans and plan editor drawer** — page; target `admin-portal`; auth: admin (subscriptions.plans.manage).

- **Artboards:** `AdminPlans` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-026.
- **Works today:** Public plan list exists (listSubscriptionPlans); no admin CRUD.
- **Operations:** listSubscriptionPlans (active plans only)
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-plans/` — `plans-model.ts` (plan type, draft, validation, immutable code, create/update intents), `plans-screen.tsx` (table + right `Drawer` editor), `plans-preview.fixtures.ts` (tests only). `listSubscriptionPlans` is not used as an admin inventory. Save is disabled without a handler; the drawer never shows success.
- **Unsupported / missing backend:** Admin plan list incl. inactive; Create/update/activate plan; Subscriber counts
- **Gap:** Table + right drawer editor (name, immutable code, description, monthly/yearly price, features list, active switch).
- **Depends on:** FE-UI-005 Drawer
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-130](./discrepancy-register.md#dr-130), [DR-132](./discrepancy-register.md#dr-132)

### ADM-PROVIDERS

**Providers** — page; target `admin-portal`; auth: admin (payments.manage, providers.manage).

- **Artboards:** `AdminProviders` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-029.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-providers/` — provider directory, supplied operational status, capabilities, search, and per-provider make-active/configure/test intents with their own availability, pending state and confirmation. No credentials, route, navigation item or production list source. Existing mutations remain unwired until an authoritative read exists.
- **Operations:** setPaymentProviderActivation PUT /api/v1/payment-providers/{id}/activation; setActiveProvider PUT /api/v1/providers/active
- **Unsupported / missing backend:** Provider list/read endpoints (current activation state); Step-up enforcement
- **Gap:** Payment provider switches + service provider 'Make active' rows; cannot render current state without a read API.
- **Depends on:** ADM-STEP-UP
- **Discrepancies:** [DR-074](./discrepancy-register.md#dr-074)

### ADM-REFERENCE-DATA

**Reference data** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminReferenceData` — 4 reference files (desktop/mobile; dark/light; interactive: tab:countries, tab:languages (not drawn), tab:currencies (not drawn)).
- **Status:** Implemented (D); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-029.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-reference-data/` — typed, read-only category tabs, search and paging, each controlled and explained when not wired. The public country lookup is not treated as an administrative source; no route, navigation item or mutations.
- **Operations:** getCountries GET /api/v1/reference-data/countries
- **Unsupported / missing backend:** Languages and currencies lists; Country status/dial code/currency fields (verify contract)
- **Gap:** Read-only tabbed tables with search and pager; only Countries tab is drawn.
- **Depends on:** FE-UI-006
- **Note:** Countries tab may ship first if the contract carries the displayed fields.
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-REGISTRATIONS

**Registration analytics** — page; target `admin-portal`; auth: admin (users.analytics.read).

- **Artboards:** `AdminRegistrations` — 4 reference files (desktop/mobile; dark/light; interactive: granularity:day|week|month|year, day-selected drill-down).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-registration-analytics/` — supplied count/growth metrics, line chart with controlled period drill-down (typed UTC range), preset and custom UTC ranges, granularity, search and a paged user table titled with the selected period ([DR-135](./discrepancy-register.md#dr-135)) with avatar fallback and distinct last-login semantics. No route or production source.
- **Unsupported / missing backend:** Registration counts/time series; Users registered in period list
- **Gap:** Charts, granularity toggle, date-range filter, drill-down table.
- **Depends on:** FE-UI-031 charts; admin analytics APIs
- **Note:** Artboard contains an unrendered template token ('1{k}:02') in Last login cells.
- **Discrepancies:** [DR-024](./discrepancy-register.md#dr-024), [DR-070](./discrepancy-register.md#dr-070)

### ADM-ROLE-EDIT

**Role editor** — page; target `admin-portal`; auth: admin (roles.manage).

- **Artboards:** `AdminRoleEdit` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-025.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-roles/` — read-only visual `AdminRoleEditScreen`: details, grouped permission checklists with counts, summary, members, danger zone; every control disabled and explained; no form, intents or persistence. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Unsupported / missing backend:** Role CRUD, permission assignment, membership
- **Gap:** CAF-FE-008 prohibits a production role editor; "Start from" and the removal-impact warning are omitted.
- **Depends on:** ADM-ROLES
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073), [DR-123](./discrepancy-register.md#dr-123)

### ADM-ROLES

**Roles and permissions** — page; target `admin-portal`; auth: admin (roles.read).

- **Artboards:** `AdminRoles` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-025.
- **Works today:** No route or navigation item (navigation lists only Dashboard); authorization is a single configured role claim.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-roles/` — `AdminRolesScreen`: roles table (System/Custom, counts; a missing count is not zero), read-only permission matrix with text Granted/Not granted cells, disabled New role. The 16 × 5 reference catalogue is a test fixture, not an authoritative permission list, and is never evaluated. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Unsupported / missing backend:** Role/permission model and APIs (reference itself says 'Needs new role-management APIs')
- **Gap:** Route `/roles`, navigation item and adapter once a permission model exists.
- **Depends on:** permission model
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073), [DR-122](./discrepancy-register.md#dr-122)

### ADM-STEP-UP

**Step-up MFA confirmation dialog** — overlay, child of `ADM-USER-DETAIL`; target `admin-portal`; auth: admin + fresh MFA.

- **Artboards:** `AdminStepUp` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Implementation:** `apps/admin-portal/src/components/admin-patterns/step-up-dialog.tsx`, `apps/admin-portal/src/components/admin-patterns/step-up-form.ts`
- **Works today:** Presentation-only AdminStepUpDialog (Trello FE-UI-012): action summary, optional reason, authenticator code, cancel/confirm, pending/error states; callbacks only, no verification or privileged action. No step-up endpoint or admin 2FA; no validity window is shown unless the caller supplies one.
- **Unsupported / missing backend:** Step-up challenge/verification endpoint; Reason capture for audit
- **Gap:** Backend step-up contract and wiring in the privileged-action tickets.
- **Depends on:** FE-UI-005 Dialog; FE-UI-007 OTP; admin 2FA
- **Note:** Build as a reusable app-level dialog used by lock, cancel, provider change, role change.
- **Discrepancies:** [DR-041](./discrepancy-register.md#dr-041), [DR-072](./discrepancy-register.md#dr-072), [DR-112](./discrepancy-register.md#dr-112)

### ADM-SUBSCRIPTION-ANALYTICS

**Subscription analytics** — page; target `admin-portal`; auth: admin (subscriptions.analytics.read).

- **Artboards:** `AdminSubscriptionAnalytics` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-subscription-analytics/` — supplied recurring-revenue, churn, growth, lifecycle, renewal and plan metrics/charts formatted in the reported currency, source-supplied plan/owner/currency options and screen-level states ([DR-136](./discrepancy-register.md#dr-136)). No frontend calculation, route or production source.
- **Unsupported / missing backend:** MRR/ARR, churn, renewal aggregates
- **Gap:** 8 stat tiles, 4 charts.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-SUBSCRIPTION-DETAIL

**Subscription detail** — page; target `admin-portal`; auth: admin (subscriptions.read; subscriptions.manage for actions).

- **Artboards:** `AdminSubscriptionDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-subscriptions/subscription-detail.tsx` — state-dependent actions (retry only when fulfillment is blocked), each with its own confirmation reporting an intent and never claiming completion; four stat tiles ('Not available' when unreported), details, timeline, renewals table. Actions disabled without a handler; step-up deferred (DR-112).
- **Unsupported / missing backend:** Admin subscription read; Retry fulfillment; Admin cancel at period end / cancel now
- **Gap:** Actions, stat tiles, kv, timeline, renewals table.
- **Depends on:** ADM-SUBSCRIPTIONS; ADM-STEP-UP
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-130](./discrepancy-register.md#dr-130), [DR-131](./discrepancy-register.md#dr-131)

### ADM-SUBSCRIPTIONS

**Subscriptions** — page; target `admin-portal`; auth: admin (subscriptions.read).

- **Artboards:** `AdminSubscriptions` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Composition (Trello FE-UI-014, design ad9386e):** `apps/admin-portal/src/features/admin-subscriptions/subscriptions-list.tsx` + `subscriptions-model.ts` — search + four filters, owner-type chips, eight-column table, pager; owner and tenant only as returned. Preview-only (`subscriptions-screens.test.tsx`); Allocate/View links only when routes are supplied.
- **Unsupported / missing backend:** Admin subscription list across owners/tenants
- **Gap:** Search, 4 filters, owner type chips, table.
- **Depends on:** FE-UI-006
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070), [DR-130](./discrepancy-register.md#dr-130)

### ADM-SYSTEM-HEALTH

**System health** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminSystemHealth` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-030.
- **Composition (Trello FE-UI-015, design ad9386e):** `apps/admin-portal/src/features/admin-system-health/` — supplied overall/service states, latency, uptime, check timestamps, screen-level forbidden/retry states and a refresh intent gated by its own availability and pending state. Unknown never reads as healthy; no Grafana link, polling, route or production source.
- **Unsupported / missing backend:** Aggregated health-check read API (reference marks the screen 'Proposed'); Grafana URL configuration
- **Gap:** Service status card grid; 'Open Grafana' external link.
- **Depends on:** health API
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-USER-DETAIL

**User detail** — page; target `admin-portal`; auth: admin (users.read; users.manage for actions).

- **Artboards:** `AdminUserDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-users/` — `AdminUserDetailScreen`: identity header with status/email badges and actions, account key-values, role chips with remove and an assign control, KYC and subscription summaries, sessions, security activity; per-section loading/error/unavailable/empty, not found, forbidden. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Actions:** lock/unlock, sign out all and role changes open `AdminStepUpDialog`; revoking one session opens `ConfirmDialog`. Each confirmation captures its explicit target (user id plus role or session id), closes with a notice if the displayed user, status, role or session no longer matches, and is re-checked before submitting; one request at a time; a failure keeps the dialog open with safe copy (`describeAdminActionFailure`) for a retry; success closes it and the screen never shows success. Without a handler every action is disabled with an explanation.
- **Unsupported / missing backend:** Admin user read model; Lock/unlock; Revoke user sessions; Assign/remove roles; User security activity (admin scope)
- **Gap:** Route `/users/[userId]`, adapter and real mutations with a backend step-up contract.
- **Depends on:** ADM-USERS; ADM-STEP-UP
- **Discrepancies:** [DR-072](./discrepancy-register.md#dr-072), [DR-121](./discrepancy-register.md#dr-121)

### ADM-USERS

**Users** — page; target `admin-portal`; auth: admin (users.read).

- **Artboards:** `AdminUsers` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Works today:** No route or navigation item; admin navigation lists only Dashboard.
- **Composition (Trello FE-UI-013):** `apps/admin-portal/src/features/admin-users/` — `users-model.ts` (list item, filters, sort, `AdminListState` model, explicit-target intents), `users-filters.tsx` (`AdminUserFilterBar`), `users-list.tsx` (`AdminUsersScreen` on `AdminListCard` + `AdminListTable` + `AdminListPager`), `users-preview.fixtures.ts` (synthetic fixtures, tests only). Shared date, missing-value, list-state and badge helpers come from `components/admin-patterns`. Search, Status/KYC/Role/Plan menus and sort are controlled callbacks, inert and explained without them; role/plan options come from the backend; status/KYC/plan/role badges; pager only with a page handler; detail links only for an implemented route. No route, navigation item or production import; rendered only by its app tests from typed preview fixtures (design `ad9386e`).
- **Unsupported / missing backend:** Admin user search/list API
- **Gap:** Route `/users`, navigation item, adapter and URL-driven filter/sort/page state.
- **Depends on:** FE-UI-006; admin users API
- **Note:** Filter, sort and paging are exercised only on synthetic fixtures in tests; nothing is server-backed.
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071), [DR-120](./discrepancy-register.md#dr-120)
