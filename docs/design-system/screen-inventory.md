# Screen inventory

Human-readable view of [`screen-inventory.json`](./screen-inventory.json), the authoritative, machine-readable inventory. Both are produced from the same data; when they disagree, the JSON wins. Design source: [`design-source-manifest.json`](./design-source-manifest.json) (commit `d23eb85`).

## How to read this

- A **logical screen** is one user-facing surface (one route, one in-page state machine, one dialog, or one layout pattern). Visual variants (desktop/mobile, light/dark) and business states (billing `active`/`pastdue`, KYC `rejected`) are listed under the screen, never as separate screens.
- Multi-artboard screens: `AUTH-REGISTER` (email, details), `AUTH-FORGOT-PASSWORD` (request, link sent) and `AUTH-RESET-PASSWORD` (new password, done, expired) merge artboards that the design drew separately but that are states of one route.
- **Status**: the frontend today. **Class**: A existing functional · B existing partial · C UI reference only (workflow not built; backend may exist) · D unsupported capability (the design needs backend support that the handwritten `api-client` does not have).
- **Backend** support is judged from `packages/api-client` operations; the repository OpenAPI snapshot is stale ([DR-003](./discrepancy-register.md#dr-003)).
- **Priority**: P0 foundation · P1 redesign of a live flow · P2 missing screen that is unblocked or low risk · P3 blocked on backend or product decisions.
- Every design file path, git blob id, viewport, theme and state is in the JSON (`design.referenceFiles`). Tickets refer to [migration-roadmap.md](./migration-roadmap.md).

## Statistics

| Measure                                                       | Count |
| ------------------------------------------------------------- | ----- |
| Logical screens (incl. overlays, layout patterns, references) | 58    |
| Design artboards                                              | 62    |
| Canonical static reference files mapped                       | 307   |
| Editable `.dc.html` artboards mapped                          | 239   |
| Screens with an existing route or in-app state                | 25    |
| Screens with a proposed route only                            | 28    |
| Screens whose design assumes unsupported backend capabilities | 44    |
| Status: Implemented                                           | 16    |
| Status: Missing                                               | 28    |
| Status: Partial                                               | 13    |
| Status: Reference-only                                        | 1     |
| Classification A                                              | 15    |
| Classification B                                              | 8     |
| Classification C                                              | 10    |
| Classification D                                              | 25    |
| Backend: Existing                                             | 15    |
| Backend: Missing                                              | 21    |
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
| [`MKT-ABOUT`](#mkt-about)           | About                            | page           | public-portal | `/about`           | —              | Partial     | C     | Not required | P3       | FE-UI-010 |
| [`MKT-BLOG`](#mkt-blog)             | Blog index                       | page           | public-portal | `/blog`            | —              | Partial     | C     | Not required | P3       | FE-UI-010 |
| [`MKT-CONTACT`](#mkt-contact)       | Contact                          | page           | public-portal | `/contact`         | —              | Partial     | D     | Missing      | P3       | FE-UI-010 |
| [`MKT-FEATURES`](#mkt-features)     | Features                         | page           | public-portal | `/features`        | —              | Partial     | C     | Not required | P2       | FE-UI-010 |
| [`MKT-HOME`](#mkt-home)             | Home                             | page           | public-portal | `/`                | —              | Partial     | B     | Partial      | P2       | FE-UI-010 |
| [`MKT-LEGAL`](#mkt-legal)           | Legal (privacy policy and terms) | page           | public-portal | `/privacy, /terms` | —              | Partial     | C     | Not required | P3       | FE-UI-010 |
| [`MKT-NAV-MOBILE`](#mkt-nav-mobile) | Marketing mobile menu            | layout-pattern | public-portal | —                  | —              | Partial     | B     | Not required | P1       | FE-UI-009 |
| [`MKT-PRICING`](#mkt-pricing)       | Pricing                          | page           | public-portal | `/pricing`         | —              | Implemented | A     | Existing     | P1       | FE-UI-011 |

### Authentication (11)

| Screen ID                                       | Screen                                            | Kind       | App          | Existing route                   | Proposed route     | Status         | Class | Backend  | Priority | Ticket    |
| ----------------------------------------------- | ------------------------------------------------- | ---------- | ------------ | -------------------------------- | ------------------ | -------------- | ----- | -------- | -------- | --------- |
| [`ADM-SIGN-IN`](#adm-sign-in)                   | Admin sign in                                     | page       | admin-portal | `/sign-in`                       | —                  | Partial        | B     | Partial  | P1       | FE-UI-014 |
| [`AUTH-CONFIRM-EMAIL`](#auth-confirm-email)     | Confirm email                                     | page       | user-portal  | `/confirm-email`                 | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-FORGOT-PASSWORD`](#auth-forgot-password) | Forgot password (request and link sent)           | state-flow | user-portal  | —                                | `/forgot-password` | Missing        | C     | Existing | P1       | FE-UI-013 |
| [`AUTH-GOOGLE-LINK`](#auth-google-link)         | Link Google account                               | state-flow | user-portal  | `/sign-in (link_required state)` | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-GOOGLE-REGISTER`](#auth-google-register) | Complete Google sign-up                           | state-flow | user-portal  | `/register?google=continue`      | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-MESSAGES`](#auth-messages)               | Sign-in messages and errors catalogue             | reference  | user-portal  | —                                | —                  | Reference-only | B     | Partial  | P1       | FE-UI-012 |
| [`AUTH-PASSKEY-SETUP`](#auth-passkey-setup)     | Passkey setup prompt                              | page       | user-portal  | `/passkey-setup`                 | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-REGISTER`](#auth-register)               | Register (email and details steps)                | state-flow | user-portal  | `/register`                      | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-RESET-PASSWORD`](#auth-reset-password)   | Reset password (new password, done, link expired) | state-flow | user-portal  | —                                | `/reset-password`  | Missing        | C     | Existing | P1       | FE-UI-013 |
| [`AUTH-SIGN-IN`](#auth-sign-in)                 | Sign in                                           | page       | user-portal  | `/sign-in`                       | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |
| [`AUTH-TWO-FACTOR`](#auth-two-factor)           | Two-factor challenge                              | page       | user-portal  | `/sign-in/two-factor`            | —                  | Implemented    | A     | Existing | P1       | FE-UI-012 |

### User portal (14)

| Screen ID                                       | Screen                                                                  | Kind           | App         | Existing route                                                                     | Proposed route                                                                 | Status      | Class | Backend      | Priority | Ticket    |
| ----------------------------------------------- | ----------------------------------------------------------------------- | -------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------- | ----- | ------------ | -------- | --------- |
| [`USR-BILLING`](#usr-billing)                   | Billing and plans                                                       | state-flow     | user-portal | `/billing`                                                                         | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-BILLING-HISTORY`](#usr-billing-history)   | Billing history                                                         | page           | user-portal | `/billing/history`                                                                 | —                                                                              | Implemented | A     | Partial      | P1       | FE-UI-018 |
| [`USR-CHECKOUT`](#usr-checkout)                 | Checkout                                                                | page           | user-portal | `/billing/checkout`                                                                | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-CHECKOUT-RESULT`](#usr-checkout-result)   | Checkout result                                                         | state-flow     | user-portal | `/billing/checkout/success, /billing/checkout/cancelled, /billing/checkout/return` | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-018 |
| [`USR-DASHBOARD`](#usr-dashboard)               | Overview dashboard                                                      | page           | user-portal | `/dashboard`                                                                       | —                                                                              | Partial     | B     | Partial      | P1       | FE-UI-015 |
| [`USR-NAV-MOBILE`](#usr-nav-mobile)             | User portal mobile navigation (top bar, tab bar, drawer)                | layout-pattern | user-portal | —                                                                                  | —                                                                              | Partial     | B     | Not required | P1       | FE-UI-008 |
| [`USR-PREFERENCES`](#usr-preferences)           | Preferences                                                             | page           | user-portal | —                                                                                  | `/preferences`                                                                 | Missing     | C     | Partial      | P2       | FE-UI-020 |
| [`USR-PROFILE`](#usr-profile)                   | Profile                                                                 | page           | user-portal | `/profile`                                                                         | —                                                                              | Implemented | A     | Partial      | P1       | FE-UI-016 |
| [`USR-PURCHASE-DETAIL`](#usr-purchase-detail)   | Purchase detail                                                         | page           | user-portal | `/billing/purchases/[purchaseId]`                                                  | —                                                                              | Partial     | B     | Partial      | P2       | FE-UI-018 |
| [`USR-SECURITY`](#usr-security)                 | Security (overview, password, passkeys, two-factor, sessions, activity) | state-flow     | user-portal | `/security`                                                                        | `/security?tab={overview\|password\|passkeys\|two-factor\|sessions\|activity}` | Implemented | A     | Existing     | P1       | FE-UI-017 |
| [`USR-TWO-FACTOR-SETUP`](#usr-two-factor-setup) | Two-factor setup dialog and recovery codes                              | overlay        | user-portal | `/security (dialog)`                                                               | —                                                                              | Implemented | A     | Existing     | P1       | FE-UI-017 |
| [`USR-VERIFICATION`](#usr-verification)         | Identity verification (KYC)                                             | state-flow     | user-portal | —                                                                                  | `/verification`                                                                | Missing     | D     | Missing      | P3       | FE-UI-022 |
| [`USR-WALLET`](#usr-wallet)                     | Wallet                                                                  | page           | user-portal | —                                                                                  | `/wallet`                                                                      | Missing     | D     | Partial      | P3       | FE-UI-021 |
| [`USR-WALLET-TOP-UP`](#usr-wallet-top-up)       | Wallet top-up dialog                                                    | overlay        | user-portal | —                                                                                  | `/wallet (dialog)`                                                             | Missing     | D     | Partial      | P3       | FE-UI-021 |

### Admin portal (24)

| Screen ID                                                   | Screen                                       | Kind           | App          | Existing route | Proposed route                                           | Status  | Class | Backend      | Priority | Ticket    |
| ----------------------------------------------------------- | -------------------------------------------- | -------------- | ------------ | -------------- | -------------------------------------------------------- | ------- | ----- | ------------ | -------- | --------- |
| [`ADM-ACTIVE-USERS`](#adm-active-users)                     | Active-user analytics                        | page           | admin-portal | —              | `/analytics/active-users`                                | Missing | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-ALLOCATE`](#adm-allocate)                             | Allocate subscription                        | page           | admin-portal | —              | `/subscriptions/allocate`                                | Missing | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-AUDIT`](#adm-audit)                                   | Audit history                                | page           | admin-portal | —              | `/audit`                                                 | Missing | D     | Missing      | P3       | FE-UI-030 |
| [`ADM-DASHBOARD`](#adm-dashboard)                           | Operations overview                          | page           | admin-portal | `/`            | —                                                        | Partial | C     | Missing      | P2       | FE-UI-023 |
| [`ADM-FORBIDDEN`](#adm-forbidden)                           | 403 forbidden state                          | state-flow     | admin-portal | —              | `(in-place state on any admin route)`                    | Missing | C     | Partial      | P2       | FE-UI-023 |
| [`ADM-KYC`](#adm-kyc)                                       | KYC monitoring                               | page           | admin-portal | —              | `/kyc`                                                   | Missing | D     | Missing      | P3       | FE-UI-028 |
| [`ADM-KYC-DETAIL`](#adm-kyc-detail)                         | KYC detail                                   | page           | admin-portal | —              | `/kyc/[verificationId]`                                  | Missing | D     | Missing      | P3       | FE-UI-028 |
| [`ADM-NAV-MOBILE`](#adm-nav-mobile)                         | Admin mobile navigation (top bar and drawer) | layout-pattern | admin-portal | —              | —                                                        | Partial | B     | Not required | P1       | FE-UI-008 |
| [`ADM-PAYMENT-ANALYTICS`](#adm-payment-analytics)           | Payment analytics                            | page           | admin-portal | —              | `/analytics/payments`                                    | Missing | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-PAYMENT-DETAIL`](#adm-payment-detail)                 | Payment detail                               | page           | admin-portal | —              | `/payments/[paymentId]`                                  | Missing | D     | Missing      | P3       | FE-UI-027 |
| [`ADM-PAYMENTS`](#adm-payments)                             | Payments                                     | page           | admin-portal | —              | `/payments`                                              | Missing | D     | Missing      | P3       | FE-UI-027 |
| [`ADM-PLANS`](#adm-plans)                                   | Plans and plan editor drawer                 | page           | admin-portal | —              | `/plans (edit drawer; optional ?edit={planId})`          | Missing | D     | Partial      | P3       | FE-UI-026 |
| [`ADM-PROVIDERS`](#adm-providers)                           | Providers                                    | page           | admin-portal | —              | `/providers`                                             | Missing | D     | Partial      | P3       | FE-UI-029 |
| [`ADM-REFERENCE-DATA`](#adm-reference-data)                 | Reference data                               | page           | admin-portal | —              | `/reference-data?tab={countries\|languages\|currencies}` | Missing | D     | Partial      | P2       | FE-UI-029 |
| [`ADM-REGISTRATIONS`](#adm-registrations)                   | Registration analytics                       | page           | admin-portal | —              | `/analytics/registrations`                               | Missing | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-ROLE-EDIT`](#adm-role-edit)                           | Role editor                                  | page           | admin-portal | —              | `/roles/[roleId] and /roles/new`                         | Missing | D     | Missing      | P3       | FE-UI-025 |
| [`ADM-ROLES`](#adm-roles)                                   | Roles and permissions                        | page           | admin-portal | —              | `/roles`                                                 | Missing | D     | Missing      | P3       | FE-UI-025 |
| [`ADM-STEP-UP`](#adm-step-up)                               | Step-up MFA confirmation dialog              | overlay        | admin-portal | —              | `(dialog on sensitive admin actions)`                    | Missing | D     | Missing      | P3       | FE-UI-024 |
| [`ADM-SUBSCRIPTION-ANALYTICS`](#adm-subscription-analytics) | Subscription analytics                       | page           | admin-portal | —              | `/analytics/subscriptions`                               | Missing | D     | Missing      | P3       | FE-UI-031 |
| [`ADM-SUBSCRIPTION-DETAIL`](#adm-subscription-detail)       | Subscription detail                          | page           | admin-portal | —              | `/subscriptions/[subscriptionId]`                        | Missing | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-SUBSCRIPTIONS`](#adm-subscriptions)                   | Subscriptions                                | page           | admin-portal | —              | `/subscriptions`                                         | Missing | D     | Missing      | P3       | FE-UI-026 |
| [`ADM-SYSTEM-HEALTH`](#adm-system-health)                   | System health                                | page           | admin-portal | —              | `/system-health`                                         | Missing | D     | Missing      | P3       | FE-UI-030 |
| [`ADM-USER-DETAIL`](#adm-user-detail)                       | User detail                                  | page           | admin-portal | —              | `/users/[userId]`                                        | Missing | D     | Missing      | P3       | FE-UI-024 |
| [`ADM-USERS`](#adm-users)                                   | Users                                        | page           | admin-portal | —              | `/users`                                                 | Missing | D     | Missing      | P3       | FE-UI-024 |

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
- **Status:** Partial (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/about/page.tsx`
- **Works today:** Static PageIntro, image + copy, testimonials, CTA.
- **Gap:** Reference is hero + three cards (Mission, Values, Team) with bracketed placeholder copy.
- **Depends on:** FE-UI-009
- **Discrepancies:** [DR-030](./discrepancy-register.md#dr-030)

### MKT-BLOG

**Blog index** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicBlog` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/blog/page.tsx`, `apps/public-portal/src/config/site.ts`
- **Works today:** Three hardcoded BlogCards linking to /blog#anchor; no post pages.
- **Unsupported / missing backend:** Blog post content source (CMS/MDX) and post detail route
- **Gap:** Reference is a 6-card grid with category chips and dates; no post-detail artboard exists.
- **Depends on:** FE-UI-009
- **Note:** Post detail route (/blog/[slug]) is reference-less; requires a content-source decision (DR-032).
- **Discrepancies:** [DR-032](./discrepancy-register.md#dr-032)

### MKT-CONTACT

**Contact** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicContact` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/contact/page.tsx`, `packages/public-ui/src/components/contact-section.tsx`
- **Works today:** Contact form whose submit handler only calls preventDefault.
- **Unsupported / missing backend:** Contact/lead submission endpoint
- **Gap:** Reference adds Topic select and 'Send message' with implied delivery.
- **Gap:** No backend endpoint; the form must not show a success outcome until one exists (render email/mailto fallback).
- **Depends on:** FE-UI-007 forms
- **Discrepancies:** [DR-033](./discrepancy-register.md#dr-033)

### MKT-FEATURES

**Features** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicFeatures` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (C); **backend:** Not required; **priority:** P2; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/features/page.tsx`, `apps/public-portal/src/config/site.ts`
- **Works today:** Static PageIntro + Features grid + CTA from site config.
- **Gap:** Reference is a numbered (01-06) alternating feature list; copy mentions Wallet, Verification and Administration capabilities that are not implemented.
- **Depends on:** FE-UI-009
- **Note:** Marketing copy describing unimplemented capabilities (wallet, KYC, admin operations) needs product sign-off before launch (DR-031).
- **Discrepancies:** [DR-031](./discrepancy-register.md#dr-031)

### MKT-HOME

**Home** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicHome` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (B); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/page.tsx`, `apps/public-portal/src/config/site.ts`, `packages/public-ui/src/components/*`
- **Works today:** Server-rendered page; pricing section reads backend plans (loadSubscriptionPlans, revalidate 60 s).
- **Works today:** Hero, logo cloud, features, CTA, FAQ, testimonials, contact and blog cards are static config content.
- **Operations:** listSubscriptionPlans GET /api/v1/subscription-plans (only if a pricing teaser is kept)
- **Gap:** Reference composition is hero + product shot + 6 feature cards + CTA; current page adds logo cloud, FAQ, testimonials, pricing, contact and blog sections with no reference.
- **Gap:** Reference 'product shot' is an illustrative dashboard mock with sample balances; must stay decorative, not data.
- **Gap:** Solid-derived sections, framer-motion reveals and hero images do not match the reference.
- **Depends on:** FE-UI-003 tokens; FE-UI-009 marketing shell
- **Note:** Removing sections without reference (testimonials, logo cloud, home pricing/contact/blog) is a product decision (DR-030).
- **Discrepancies:** [DR-030](./discrepancy-register.md#dr-030)

### MKT-LEGAL

**Legal (privacy policy and terms)** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicLegal` — 4 reference files (desktop/mobile; dark/light; interactive: document:privacy, document:terms (segmented switch; only privacy drawn)).
- **Status:** Partial (C); **backend:** Not required; **priority:** P3; **ticket:** FE-UI-010.
- **Implementation:** `apps/public-portal/src/app/privacy/page.tsx`, `apps/public-portal/src/app/terms/page.tsx`, `apps/public-portal/src/components/legal-page.tsx`
- **Works today:** Two routes rendering placeholder legal text.
- **Gap:** Reference is one document layout with 'On this page' TOC and a Privacy/Terms segmented switch.
- **Depends on:** FE-UI-009
- **Note:** Keep both routes (linkable, indexable); render the segmented switch as two links (aria-current), not client state.
- **Discrepancies:** [DR-034](./discrepancy-register.md#dr-034)

### MKT-NAV-MOBILE

**Marketing mobile menu** — layout-pattern; target `public-portal`; auth: public.

- **Artboards:** `PublicMobileMenu` — 2 reference files (mobile; dark/light).
- **Status:** Partial (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-009.
- **Implementation:** `packages/public-ui/src/components/header.tsx`, `apps/public-portal/src/app/layout.tsx`
- **Works today:** Solid header with a mobile toggle and theme switch (next-themes).
- **Gap:** Reference: compact top bar (logo, Get started, menu button) opening a full-screen sheet with nav, both CTAs and a Dark mode switch.
- **Gap:** Header source contains mis-encoded glyphs (mojibake) for the theme/menu icons.
- **Depends on:** FE-UI-005 Dialog/Sheet
- **Note:** Mobile-only artboards (no desktop variant by design).
- **Discrepancies:** [DR-021](./discrepancy-register.md#dr-021)

### MKT-PRICING

**Pricing** — page; target `public-portal`; auth: public.

- **Artboards:** `PublicPricing` — 4 reference files (desktop/mobile; dark/light; interactive: interval:monthly, interval:yearly (editable .dc.html artboard only)).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-011.
- **Implementation:** `apps/public-portal/src/app/pricing/page.tsx`, `apps/public-portal/src/components/subscription-pricing.tsx`, `apps/public-portal/src/lib/subscription-plans.ts`, `apps/public-portal/src/lib/subscription-pricing.ts`
- **Works today:** Plans from GET /api/v1/subscription-plans in Server Components; empty and unavailable states; CTA links to User Portal /billing/checkout?planId=&billingInterval=.
- **Operations:** listSubscriptionPlans GET /api/v1/subscription-plans
- **Unsupported / missing backend:** Plan tier label / recommendation flag ('Most popular')
- **Gap:** Reference has Monthly/Yearly segmented toggle (interactive artboard); public page shows the default interval only.
- **Gap:** Reference 'Most popular' badge and featured border are not backed by plan data (OKF forbids local tier labels).
- **Gap:** FAQ copy is static and must not contradict backend policy.
- **Depends on:** FE-UI-005 SegmentedControl; PlanCard (ui-core)
- **Note:** Interval toggle is client state on a server-rendered list; keep plans loading in Server Components.
- **Note:** Yearly prices appear only in the editable .dc.html artboard, not in the static snapshot.
- **Discrepancies:** [DR-010](./discrepancy-register.md#dr-010), [DR-011](./discrepancy-register.md#dr-011)

### ADM-SIGN-IN

**Admin sign in** — page; target `admin-portal`; auth: public.

- **Artboards:** `AdminSignIn` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-014.
- **Implementation:** `apps/admin-portal/src/app/sign-in/page.tsx`, `apps/admin-portal/src/app/sign-in/sign-in-form.tsx`, `apps/admin-portal/src/lib/admin-authorization.ts`
- **Works today:** Password sign-in with admin-role admission; 401/403/423/429 mapping; 2FA outcome rejected with 409.
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
- **Works today:** Code entry, BFF confirmation that creates the session, resend with backend retryAtUtc cooldown, redirect to /passkey-setup.
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

### AUTH-GOOGLE-LINK

**Link Google account** — state-flow; target `user-portal`; auth: public (Google flow cookie).

- **Artboards:** `AuthGoogleLink` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/components/google-link-form.tsx`, `apps/user-portal/src/app/api/auth/google/link/route.ts`
- **Works today:** Password confirmation that links Google to an existing account inside the sign-in/register flow.
- **Operations:** `linkGoogleAccount`
- **Gap:** Reference treats it as a standalone screen; implementation is a state of the Google flow (keep, no new route).
- **Depends on:** FE-UI-008

### AUTH-GOOGLE-REGISTER

**Complete Google sign-up** — state-flow; target `user-portal`; auth: public (Google flow cookie).

- **Artboards:** `AuthGoogleRegister` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/register/registration-form.tsx`, `apps/user-portal/src/app/api/auth/registrations/google/route.ts`
- **Works today:** Profile-only Google registration (names, country, terms) then /passkey-setup.
- **Operations:** `signUpWithGoogle`; `getCountries`
- **Gap:** Reference shows a 'Signed in with Google' identity block and a terms checkbox.
- **Depends on:** FE-UI-008; FE-UI-007

### AUTH-MESSAGES

**Sign-in messages and errors catalogue** — reference; target `user-portal`; auth: n/a.

- **Artboards:** `AuthStates` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Reference-only (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/lib/sign-in.ts`, `apps/user-portal/src/lib/two-factor.ts`, `apps/user-portal/src/lib/passkey-sign-in.ts`
- **Works today:** Error mapping exists for invalid credentials, lockout, unconfirmed email, rate limit, Google failure, passkey cancel/unsupported, invalid/expired codes.
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
- **Works today:** Optional enrolment after confirmation/Google registration; unsupported-browser, already-enrolled and cancelled states; skip.
- **Operations:** `listPasskeys`; `createPasskeyRegistrationOptions`; `completePasskeyRegistration`
- **Gap:** Reference uses the split auth layout with a benefit list; current page has a passkey name input which the reference omits (keep: backend binds a name).
- **Depends on:** FE-UI-008 AuthLayout

### AUTH-REGISTER

**Register (email and details steps)** — state-flow; target `user-portal`; auth: public.

- **Artboards:** `AuthRegisterEmail`, `AuthRegisterDetails` — 8 reference files (desktop/mobile; dark/light; states: step:details, step:email).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/register/page.tsx`, `apps/user-portal/src/app/register/registration-form.tsx`, `apps/user-portal/src/lib/registration.ts`
- **Works today:** Single-route 3-step flow: email existence check -> profile (first/last name, searchable country) -> password; Google entry; existing email redirects to sign-in.
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

### AUTH-SIGN-IN

**Sign in** — page; target `user-portal`; auth: public.

- **Artboards:** `AuthSignIn` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-012.
- **Implementation:** `apps/user-portal/src/app/sign-in/page.tsx`, `apps/user-portal/src/app/sign-in/sign-in-form.tsx`, `apps/user-portal/src/app/sign-in/passkey-sign-in-button.tsx`, `apps/user-portal/src/components/google-authentication-button.tsx`, `apps/user-portal/src/lib/sign-in.ts`
- **Works today:** Password sign-in via BFF POST /api/auth/session; Google (GIS) and passkey sign-in; 2FA continuation; unconfirmed-email redirect; ?confirmed, ?email, ?returnTo handling; 401/403/423/429 error mapping.
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
- **Works today:** Authenticator or recovery-code verification through BFF; challenge expiry timer and restart; auto-submit.
- **Operations:** `completeTwoFactorChallenge`
- **Gap:** Reference shows recovery-code option as an inline help panel; expiry state is not designed (keep existing).
- **Depends on:** FE-UI-007 OTP field
- **Discrepancies:** [DR-040](./discrepancy-register.md#dr-040)

### USR-BILLING

**Billing and plans** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserBilling` — 24 reference files (desktop/mobile; dark/light; states: active, cancelling, expired, none, pastdue, pending).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018.
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
- **Status:** Implemented (A); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-018.
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
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018.
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
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-018.
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
- **Status:** Partial (B); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-015.
- **Implementation:** `apps/user-portal/src/app/dashboard/page.tsx`, `apps/user-portal/src/app/dashboard/loading.tsx`, `apps/user-portal/src/app/dashboard/error.tsx`
- **Works today:** Server Component: identity card, verified/pending status, three placeholder metric slots.
- **Operations:** `getProfile`; `getCurrentSubscription`; `listActiveSessions`; `getTwoFactorStatus`; `listPasskeys`; `getBillingHistory`; `getWalletTransactions`
- **Unsupported / missing backend:** Wallet balance; KYC status; Profile country/language/member-since; Password last-changed date
- **Gap:** Reference: greeting header with actions, KYC banner, 4 stat tiles (wallet balance, plan, security score, sessions), profile card, security checklist, recent activity table.
- **Gap:** Wallet balance, KYC banner, country/language/member-since and 'password changed 2 months ago' have no backend source.
- **Gap:** Recent activity mixes wallet and billing events; no unified activity endpoint.
- **Depends on:** FE-UI-008 shell; FE-UI-004 Stat/KeyValue
- **Note:** Render only tiles backed by real data; omit (not mock) unsupported tiles until endpoints exist.
- **Discrepancies:** [DR-018](./discrepancy-register.md#dr-018), [DR-050](./discrepancy-register.md#dr-050)

### USR-NAV-MOBILE

**User portal mobile navigation (top bar, tab bar, drawer)** — layout-pattern; target `user-portal`; auth: authenticated.

- **Artboards:** `UserMobileMenu` — 2 reference files (mobile; dark/light).
- **Status:** Partial (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-008.
- **Implementation:** `apps/user-portal/src/components/user-layout-shell.tsx`, `apps/user-portal/src/config/navigation.ts`, `packages/dashboard-ui/src/components/mobile-nav.tsx`
- **Works today:** Off-canvas sidebar drawer below lg with 4 nav items.
- **Operations:** getProfile (identity in drawer)
- **Gap:** Reference: mobile top bar + 5-item bottom tab bar (Home, Wallet, Billing, Security, Account) + left drawer with identity and dark-mode switch.
- **Gap:** Tab bar includes Wallet which does not exist; 'Account' tab behaviour is undefined.
- **Depends on:** FE-UI-008
- **Note:** Mobile-only artboards.
- **Discrepancies:** [DR-022](./discrepancy-register.md#dr-022), [DR-023](./discrepancy-register.md#dr-023)

### USR-PREFERENCES

**Preferences** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserPreferences` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (C); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-020.
- **Implementation:** `packages/dashboard-ui/src/components/theme-toggle.tsx`
- **Works today:** Only a header theme toggle (light/dark, localStorage 'theme').
- **Unsupported / missing backend:** Language preference persistence; Email notification preferences (marked 'Proposed' in the reference)
- **Gap:** Theme (Light/Dark/Match system) can ship client-side; language and notifications need backend support.
- **Depends on:** FE-UI-003 theme provider
- **Note:** Ship theme only; hide or disable language/notification sections until endpoints exist (do not persist locally as if saved).
- **Discrepancies:** [DR-051](./discrepancy-register.md#dr-051)

### USR-PROFILE

**Profile** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserProfile` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Implemented (A); **backend:** Partial; **priority:** P1; **ticket:** FE-UI-016.
- **Implementation:** `apps/user-portal/src/app/profile/page.tsx`, `apps/user-portal/src/app/profile/profile-edit-form.tsx`, `apps/user-portal/src/app/profile/avatar-upload-control.tsx`, `apps/user-portal/src/lib/avatar-upload.ts`
- **Works today:** Name edit with validation mapping, read-only email, presigned avatar upload, success/error alerts.
- **Operations:** `getProfile`; `updateProfile`; `createAvatarUpload`; `completeAvatarUpload`
- **Unsupported / missing backend:** Country on profile (UpdateProfileRequest has firstName/lastName only); Remove avatar; Upload progress percentage; Google link status / 'Connected sign-in' read model; Profile 'last updated' timestamp
- **Gap:** Reference adds Country select, Remove photo, upload progress %, 'Connected sign-in' card and Cancel button.
- **Depends on:** FE-UI-007; FE-UI-008
- **Discrepancies:** [DR-019](./discrepancy-register.md#dr-019)

### USR-PURCHASE-DETAIL

**Purchase detail** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserPurchaseDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (B); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-018.
- **Implementation:** `apps/user-portal/src/app/billing/purchases/[purchaseId]/page.tsx`, `apps/user-portal/src/app/billing/purchases/[purchaseId]/purchase-status-view.tsx`
- **Works today:** Purchase status card with polling, bank-transfer details and blocked/underpaid warnings.
- **Operations:** `getSubscriptionPurchaseStatus`
- **Unsupported / missing backend:** Purchase timeline events; Receipt download; Navigation from history rows (no purchaseId on rows)
- **Gap:** Reference: details key-value card + event timeline + 'Download receipt'; only current status is available.
- **Depends on:** FE-UI-006 Timeline
- **Discrepancies:** [DR-057](./discrepancy-register.md#dr-057), [DR-058](./discrepancy-register.md#dr-058)

### USR-SECURITY

**Security (overview, password, passkeys, two-factor, sessions, activity)** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserSecurity` — 24 reference files (desktop/mobile; dark/light; states: activity, overview, passkeys, password, sessions, two-factor).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-017.
- **Implementation:** `apps/user-portal/src/app/security/page.tsx`, `apps/user-portal/src/app/security/security-tabs.tsx`, `apps/user-portal/src/app/security/security-overview-card.tsx`, `apps/user-portal/src/app/security/passkeys-card.tsx`, `apps/user-portal/src/app/security/two-factor-security-card.tsx`, `apps/user-portal/src/app/security/active-sessions-card.tsx`, `apps/user-portal/src/app/security/security-activity-card.tsx`
- **Works today:** Two local tabs (General: overview, password change, passkeys, 2FA; Devices: sessions, activity); revoke one/others; activity infinite list.
- **Operations:** `changePassword`; `getTwoFactorStatus`; `setupTwoFactor`; `verifyTwoFactorEnrollment`; `regenerateRecoveryCodes`; `disableTwoFactor`; `listActiveSessions`; `revokeSession`; `revokeOtherSessions`; `getSecurityActivity`; `listPasskeys`; `createPasskeyRegistrationOptions`; `completePasskeyRegistration`; `renamePasskey`; `removePasskey`
- **Unsupported / missing backend:** Passkey last-used date; Password last-changed date / strength status; 'Sign out of all other sessions' option on password change
- **Gap:** Reference has six tabs; implementation has two. Tabs should become URL-addressable (?tab=) so dashboard links can deep-link.
- **Gap:** Reference masks IPs (102.89.x.x); current activity shows the backend IP as a lookup link (OKF).
- **Gap:** Security score '3 of 4' must be derived only from real facts (2FA on, passkey count).
- **Depends on:** FE-UI-005 Tabs/Dialog; FE-UI-006 DataTable
- **Discrepancies:** [DR-052](./discrepancy-register.md#dr-052), [DR-053](./discrepancy-register.md#dr-053)

### USR-TWO-FACTOR-SETUP

**Two-factor setup dialog and recovery codes** — overlay, child of `USR-SECURITY`; target `user-portal`; auth: authenticated.

- **Artboards:** `UserTwoFactorSetup` — 4 reference files (desktop/mobile; dark/light; interactive: step:2-of-3 (scan + verify), step:3-of-3 (recovery codes)).
- **Status:** Implemented (A); **backend:** Existing; **priority:** P1; **ticket:** FE-UI-017.
- **Implementation:** `apps/user-portal/src/app/security/two-factor-security-card.tsx`
- **Works today:** Setup modal with QR (qrcode.react), manual key, code verification, one-time recovery codes with copy/download.
- **Operations:** `setupTwoFactor`; `verifyTwoFactorEnrollment`; `regenerateRecoveryCodes`
- **Gap:** Reference: 3-step dialog ('Step 2 of 3'), recovery codes card with 'I have saved my recovery codes' confirmation before Finish.
- **Gap:** Modal must gain focus trap/Esc/return focus (current Modal lacks them).
- **Depends on:** FE-UI-005 Dialog
- **Note:** Recovery codes remain ephemeral UI state; never persisted or put in fixtures that resemble real codes in production bundles.
- **Discrepancies:** [DR-060](./discrepancy-register.md#dr-060)

### USR-VERIFICATION

**Identity verification (KYC)** — state-flow; target `user-portal`; auth: authenticated.

- **Artboards:** `UserVerification` — 24 reference files (desktop/mobile; dark/light; states: expired, inprogress, notstarted, pending, rejected, verified).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-022.
- **Works today:** Only profile.isVerified is displayed.
- **Unsupported / missing backend:** KYC session creation (hosted provider link); Verification status and attempt history; Retry rules
- **Gap:** Six states (notstarted, inprogress, pending, verified, rejected, expired) and history table have no API.
- **Depends on:** Backend KYC API
- **Note:** Blocked. Do not add a nav item or route until the API exists; previews only via fixtures in the workbench.
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054)

### USR-WALLET

**Wallet** — page; target `user-portal`; auth: authenticated.

- **Artboards:** `UserWallet` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-021.
- **Implementation:** `packages/api-client/src/payments/operations.ts`, `packages/api-react/src/payments`
- **Works today:** api-client/api-react wallet transaction operations exist; no UI.
- **Operations:** getWalletTransactions GET /api/v1/payments/wallet-transactions
- **Unsupported / missing backend:** Wallet balance / pending / funded-this-month aggregates; Transaction status, provider and reference fields on list rows; Status/date-range filters
- **Gap:** List rows expose title/category/type/amount/timestamp only; reference columns Provider, Reference, Status are unsupported.
- **Depends on:** Backend wallet read model; FE-UI-006
- **Note:** Frontend must never compute balances from transaction pages.
- **Discrepancies:** [DR-059](./discrepancy-register.md#dr-059)

### USR-WALLET-TOP-UP

**Wallet top-up dialog** — overlay, child of `USR-WALLET`; target `user-portal`; auth: authenticated.

- **Artboards:** `UserWalletTopUp` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-021.
- **Works today:** initiatePayment and getWalletTopUpTransaction operations exist; no UI.
- **Operations:** initiatePayment POST /api/v1/payments/initiate; `getWalletTopUpTransaction`
- **Unsupported / missing backend:** Provider list for top-ups (eligible providers); Per-intent Bachs return URLs (shared with subscriptions today)
- **Gap:** Amount + preset chips + provider select + redirect notice; return/result handling not designed.
- **Depends on:** USR-WALLET; backend return-URL fix
- **Discrepancies:** [DR-059](./discrepancy-register.md#dr-059)

### ADM-ACTIVE-USERS

**Active-user analytics** — page; target `admin-portal`; auth: admin (users.analytics.read).

- **Artboards:** `AdminActiveUsers` — 4 reference files (desktop/mobile; dark/light; interactive: range:7d|30d|90d|custom, day-selected drill-down).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Unsupported / missing backend:** DAU/WAU/MAU and per-day active-user list
- **Gap:** Stat tiles, daily chart with day drill-down, table.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-ALLOCATE

**Allocate subscription** — page; target `admin-portal`; auth: admin (subscriptions.allocate).

- **Artboards:** `AdminAllocate` — 4 reference files (desktop/mobile; dark/light; interactive: owner:user, owner:tenant, overlap-warning).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Unsupported / missing backend:** Complimentary allocation endpoint; Tenant list; User lookup
- **Gap:** Form with owner type segmented control, plan, start, duration, auto-renew, required reason; summary + overlap warning.
- **Depends on:** ADM-SUBSCRIPTIONS
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-AUDIT

**Audit history** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminAudit` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-030.
- **Implementation:** `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Navigation item exists and 404s.
- **Unsupported / missing backend:** Audit-log API (reference itself says 'Proposed screen - needs an audit-log API')
- **Gap:** Search, action/actor/date filters, table, CSV export.
- **Depends on:** audit API
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-DASHBOARD

**Operations overview** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminDashboard` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Partial (C); **backend:** Missing; **priority:** P2; **ticket:** FE-UI-023.
- **Implementation:** `apps/admin-portal/src/app/page.tsx`
- **Works today:** Static placeholder overview cards and an empty table.
- **Unsupported / missing backend:** Admin analytics summaries (users, DAU, payment volume, MRR); KYC queue counts; Subscription attention counts; Provider status read
- **Gap:** Every tile and chart needs admin read APIs.
- **Depends on:** FE-UI-008 admin shell; admin analytics APIs
- **Note:** Keep the placeholder (restyled) until APIs exist; no mock numbers in production.
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-FORBIDDEN

**403 forbidden state** — state-flow; target `admin-portal`; auth: admin.

- **Artboards:** `AdminForbidden` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (C); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-023.
- **Implementation:** `apps/admin-portal/src/proxy.ts`, `apps/admin-portal/src/lib/admin-authorization.ts`
- **Works today:** Non-admin sessions are redirected to sign-in; no in-shell forbidden state.
- **Unsupported / missing backend:** Permission names in tokens or a permissions endpoint (reference cites payments.analytics.read)
- **Gap:** In-shell 403 card with required permission, Back to dashboard, Copy request details.
- **Depends on:** FE-UI-008
- **Note:** Render when a backend call returns 403 inside an admitted admin session; never relax the proxy role check.
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073)

### ADM-KYC

**KYC monitoring** — page; target `admin-portal`; auth: admin (kyc.read).

- **Artboards:** `AdminKyc` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-028.
- **Unsupported / missing backend:** KYC verification list and counts
- **Gap:** Stat tiles, search, filters, table.
- **Depends on:** Backend KYC API
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054)

### ADM-KYC-DETAIL

**KYC detail** — page; target `admin-portal`; auth: admin (kyc.read).

- **Artboards:** `AdminKycDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-028.
- **Unsupported / missing backend:** Verification detail, status history, refresh-from-provider
- **Gap:** Read-only kv + timeline + attempts; decisions belong to the provider.
- **Depends on:** ADM-KYC
- **Discrepancies:** [DR-054](./discrepancy-register.md#dr-054)

### ADM-NAV-MOBILE

**Admin mobile navigation (top bar and drawer)** — layout-pattern; target `admin-portal`; auth: admin.

- **Artboards:** `AdminMobileMenu` — 2 reference files (mobile; dark/light).
- **Status:** Partial (B); **backend:** Not required; **priority:** P1; **ticket:** FE-UI-008.
- **Implementation:** `apps/admin-portal/src/components/admin-layout-shell.tsx`, `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Off-canvas sidebar drawer with 6 flat items.
- **Unsupported / missing backend:** Global admin search API (top-bar search)
- **Gap:** Reference: grouped navigation (Analytics, Operations, Platform) with 16 items, identity block, dark-mode switch; top-bar search button; no bottom tab bar.
- **Depends on:** FE-UI-008
- **Note:** Mobile-only artboards.
- **Discrepancies:** [DR-022](./discrepancy-register.md#dr-022), [DR-075](./discrepancy-register.md#dr-075)

### ADM-PAYMENT-ANALYTICS

**Payment analytics** — page; target `admin-portal`; auth: admin (payments.analytics.read).

- **Artboards:** `AdminPaymentAnalytics` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Unsupported / missing backend:** Payment volume/success aggregates by status, provider and intent
- **Gap:** 7 stat tiles, stacked bar chart, donut, two breakdown tables, filter buttons.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-PAYMENT-DETAIL

**Payment detail** — page; target `admin-portal`; auth: admin (payments.read).

- **Artboards:** `AdminPaymentDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-027.
- **Unsupported / missing backend:** Payment detail, fulfillment outcome, status history, webhook/reconciliation log
- **Gap:** kv card, outcome alert, timeline, events table.
- **Depends on:** ADM-PAYMENTS
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-PAYMENTS

**Payments** — page; target `admin-portal`; auth: admin (payments.read).

- **Artboards:** `AdminPayments` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-027.
- **Unsupported / missing backend:** Admin payment transaction search/list
- **Gap:** Search, 5 filters, 8-column table, CSV export.
- **Depends on:** FE-UI-006
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-PLANS

**Plans and plan editor drawer** — page; target `admin-portal`; auth: admin (subscriptions.plans.manage).

- **Artboards:** `AdminPlans` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-026.
- **Works today:** Public plan list exists (listSubscriptionPlans); no admin CRUD.
- **Operations:** listSubscriptionPlans (active plans only)
- **Unsupported / missing backend:** Admin plan list incl. inactive; Create/update/activate plan; Subscriber counts
- **Gap:** Table + right drawer editor (name, immutable code, description, monthly/yearly price, features list, active switch).
- **Depends on:** FE-UI-005 Drawer
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-PROVIDERS

**Providers** — page; target `admin-portal`; auth: admin (payments.manage, providers.manage).

- **Artboards:** `AdminProviders` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Partial; **priority:** P3; **ticket:** FE-UI-029.
- **Implementation:** `packages/api-client/src/payments/operations.ts`, `packages/api-client/src/providers`
- **Works today:** Mutations exist (setPaymentProviderActivation, setActiveProvider) with no UI.
- **Operations:** setPaymentProviderActivation PUT /api/v1/payment-providers/{id}/activation; setActiveProvider PUT /api/v1/providers/active
- **Unsupported / missing backend:** Provider list/read endpoints (current activation state); Step-up enforcement
- **Gap:** Payment provider switches + service provider 'Make active' rows; cannot render current state without a read API.
- **Depends on:** ADM-STEP-UP
- **Discrepancies:** [DR-074](./discrepancy-register.md#dr-074)

### ADM-REFERENCE-DATA

**Reference data** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminReferenceData` — 4 reference files (desktop/mobile; dark/light; interactive: tab:countries, tab:languages (not drawn), tab:currencies (not drawn)).
- **Status:** Missing (D); **backend:** Partial; **priority:** P2; **ticket:** FE-UI-029.
- **Implementation:** `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Navigation item exists and 404s; getCountries exists (public lookup).
- **Operations:** getCountries GET /api/v1/reference-data/countries
- **Unsupported / missing backend:** Languages and currencies lists; Country status/dial code/currency fields (verify contract)
- **Gap:** Read-only tabbed tables with search and pager; only Countries tab is drawn.
- **Depends on:** FE-UI-006
- **Note:** Countries tab may ship first if the contract carries the displayed fields.
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-REGISTRATIONS

**Registration analytics** — page; target `admin-portal`; auth: admin (users.analytics.read).

- **Artboards:** `AdminRegistrations` — 4 reference files (desktop/mobile; dark/light; interactive: granularity:day|week|month|year, day-selected drill-down).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Unsupported / missing backend:** Registration counts/time series; Users registered in period list
- **Gap:** Charts, granularity toggle, date-range filter, drill-down table.
- **Depends on:** FE-UI-031 charts; admin analytics APIs
- **Note:** Artboard contains an unrendered template token ('1{k}:02') in Last login cells.
- **Discrepancies:** [DR-024](./discrepancy-register.md#dr-024), [DR-070](./discrepancy-register.md#dr-070)

### ADM-ROLE-EDIT

**Role editor** — page; target `admin-portal`; auth: admin (roles.manage).

- **Artboards:** `AdminRoleEdit` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-025.
- **Unsupported / missing backend:** Role CRUD, permission assignment, membership
- **Gap:** Grouped permission checklists with select-all, summary, members, danger zone.
- **Depends on:** ADM-ROLES
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073)

### ADM-ROLES

**Roles and permissions** — page; target `admin-portal`; auth: admin (roles.read).

- **Artboards:** `AdminRoles` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-025.
- **Implementation:** `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Navigation item exists and 404s; authorization is a single configured role claim.
- **Unsupported / missing backend:** Role/permission model and APIs (reference itself says 'Needs new role-management APIs')
- **Gap:** Roles table + read-only permission matrix (16 permissions, 5 roles).
- **Depends on:** permission model
- **Discrepancies:** [DR-073](./discrepancy-register.md#dr-073)

### ADM-STEP-UP

**Step-up MFA confirmation dialog** — overlay, child of `ADM-USER-DETAIL`; target `admin-portal`; auth: admin + fresh MFA.

- **Artboards:** `AdminStepUp` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Works today:** No step-up exists; admin 2FA is not supported at sign-in.
- **Unsupported / missing backend:** Step-up challenge/verification endpoint; Reason capture for audit
- **Gap:** Reusable confirm-with-authenticator dialog (action summary, reason, OTP, 5-minute validity hint).
- **Depends on:** FE-UI-005 Dialog; FE-UI-007 OTP; admin 2FA
- **Note:** Build as a reusable app-level dialog used by lock, cancel, provider change, role change.
- **Discrepancies:** [DR-041](./discrepancy-register.md#dr-041), [DR-072](./discrepancy-register.md#dr-072)

### ADM-SUBSCRIPTION-ANALYTICS

**Subscription analytics** — page; target `admin-portal`; auth: admin (subscriptions.analytics.read).

- **Artboards:** `AdminSubscriptionAnalytics` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-031.
- **Unsupported / missing backend:** MRR/ARR, churn, renewal aggregates
- **Gap:** 8 stat tiles, 4 charts.
- **Depends on:** FE-UI-031
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-SUBSCRIPTION-DETAIL

**Subscription detail** — page; target `admin-portal`; auth: admin (subscriptions.read; subscriptions.manage for actions).

- **Artboards:** `AdminSubscriptionDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Unsupported / missing backend:** Admin subscription read; Retry fulfillment; Admin cancel at period end / cancel now
- **Gap:** Actions, stat tiles, kv, timeline, renewals table.
- **Depends on:** ADM-SUBSCRIPTIONS; ADM-STEP-UP
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-SUBSCRIPTIONS

**Subscriptions** — page; target `admin-portal`; auth: admin (subscriptions.read).

- **Artboards:** `AdminSubscriptions` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-026.
- **Unsupported / missing backend:** Admin subscription list across owners/tenants
- **Gap:** Search, 4 filters, owner type chips, table.
- **Depends on:** FE-UI-006
- **Discrepancies:** [DR-070](./discrepancy-register.md#dr-070)

### ADM-SYSTEM-HEALTH

**System health** — page; target `admin-portal`; auth: admin.

- **Artboards:** `AdminSystemHealth` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-030.
- **Implementation:** `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Navigation item exists and 404s.
- **Unsupported / missing backend:** Aggregated health-check read API (reference marks the screen 'Proposed'); Grafana URL configuration
- **Gap:** Service status card grid; 'Open Grafana' external link.
- **Depends on:** health API
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)

### ADM-USER-DETAIL

**User detail** — page; target `admin-portal`; auth: admin (users.read; users.manage for actions).

- **Artboards:** `AdminUserDetail` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Unsupported / missing backend:** Admin user read model; Lock/unlock; Revoke user sessions; Assign/remove roles; User security activity (admin scope)
- **Gap:** Identity header with actions, account kv, roles chips + assign, KYC/subscription summaries, sessions, activity table.
- **Depends on:** ADM-USERS; ADM-STEP-UP
- **Discrepancies:** [DR-072](./discrepancy-register.md#dr-072)

### ADM-USERS

**Users** — page; target `admin-portal`; auth: admin (users.read).

- **Artboards:** `AdminUsers` — 4 reference files (desktop/mobile; dark/light).
- **Status:** Missing (D); **backend:** Missing; **priority:** P3; **ticket:** FE-UI-024.
- **Implementation:** `apps/admin-portal/src/config/navigation.ts`
- **Works today:** Navigation item exists and 404s.
- **Unsupported / missing backend:** Admin user search/list API
- **Gap:** Search + 5 filter menus + sort; table with status/KYC/plan/role badges; pager.
- **Depends on:** FE-UI-006; admin users API
- **Note:** Remove or hide the dead nav link until the route ships (DR-071).
- **Discrepancies:** [DR-071](./discrepancy-register.md#dr-071)
