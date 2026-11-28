# Final visual, accessibility and responsive QA (Trello FE-UI-016)

The comprehensive QA pass of every in-scope screen, preview composition and design reference against the pinned design, with the fixes it produced and the gaps it left. Machine-readable coverage (every canonical file, every screen, the 22 notification designs): [`final-visual-qa.json`](./final-visual-qa.json). Per-screen results are also stored as `qa` blocks in [`screen-inventory.json`](./screen-inventory.json).

## 1. Baseline

| Item                 | Value                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend             | `79642f8207962e4160ab23fd387a92d77cf0d784` (`origin/main`), branch `feat/fe-ui-016-final-visual-qa`                                                                                                                                                           |
| Design               | `ad9386efe354d0d4d6d9b57d5e1cd492a29cb80d` (tree `1000fc95c79c4cda8f3c6361d73f3b5d485cd0c2`); `origin/main` had no later revision on 2026-11-28                                                                                                               |
| Design files         | 994: 425 canonical (337 screen files in `0-foundations` … `5-invoices-and-receipts`, 88 email files in `6-emails`) and 569 exports (`email-pages/` 111, `project-template-design-html/` 458), each export mapped to its canonical equivalent and counted once |
| Notification designs | 22 distinct `NotificationType` values in `email-pages/index.html` (11 Existing, 11 Proposed), each with 4 canonical variants (88) and one live file (22)                                                                                                      |
| Trello               | Verified 2026-11-28: [FE-UI-016](https://trello.com/c/JuXUfUhQ) is in DOING. Its full card acceptance criteria were reconciled; no card status change is claimed by this QA document.                                                                         |
| Manifest             | [`design-source-manifest.json`](./design-source-manifest.json) regenerated for `ad9386e` ([DR-083](./discrepancy-register.md#dr-083) resolved); 84 reference blobs changed since `d23eb85` and are now current in the inventory                               |

## 2. Checks

All commands ran in the worktree on Windows 11 (win32), Node 24.18, pnpm 11.20.0, Playwright 1.65.1 Chromium.

| Command               | Before fixes                        | After fixes                                         |
| --------------------- | ----------------------------------- | --------------------------------------------------- |
| `pnpm format:check`   | pass                                | pass                                                |
| `pnpm lint`           | pass                                | pass                                                |
| `pnpm typecheck`      | pass                                | pass                                                |
| `pnpm test`           | pass (1,507 tests in 10 workspaces) | pass (1,513 tests)                                  |
| `pnpm build`          | pass                                | pass                                                |
| `pnpm test:component` | pass (221 browser tests)            | pass (226 browser tests)                            |
| `pnpm test:visual`    | pass (67 shots)                     | pass (76 shots: 9 new phone/tablet shell baselines) |
| `okf lint -strict`    | —                                   | pass                                                |

`pnpm workbench:build` also passed after the fixes.

## 3. Method

Evidence is kept outside the repository (QA machine: `C:/Work/Chidelu/qa-captures/fe-ui-016`; `final-visual-qa.json` paths are relative to it). The only committed images are approved regression baselines.

- **References:** all 425 canonical files rendered with Chromium at their artboard width (desktop 1440, mobile 390, A4 print 794), full page, reduced motion; the 22 live emails at 1440 and 390 in light and dark `prefers-color-scheme` (513 images).
- **Portal pages (routes):** each portal's production build served with `next start` on spare ports, against a temporary stub of the backend shaped by the handwritten `api-client` contracts (synthetic data, no credentials, auth enforced). Sign-in went through the real BFF, so `proxy.ts`, route handlers and `__Host-` httpOnly cookies ran for real. Business states were driven through stub scenarios (billing `active`, `none`, `pending`, `cancelling`, `pastdue`, `expired`; checkout `success`, `cancelled`, `pending`), URL tabs (`/security?tab=…`) and real interactions (sign-in errors, validation, reset-code steps, the two-factor setup dialog, drawers and menus).
- **Backend-gated screens:** rendered in each app's existing Vitest browser harness inside `DashboardShell` with the colocated preview fixtures — never as a route, navigation item or workbench copy. Invoice and receipt states were also captured with print media emulated.
- **Matrix:** default states at phone 390×844 and desktop 1440×900 in light and dark, plus tablet 834×1112 for routes and shells; extra business states at desktop × light and phone × dark; overlays at phone × light and desktop × dark. Variants left out are recorded as `compared-representative`.
- **Per capture:** axe-core 4.12.1 (WCAG 2.0/2.1/2.2 A and AA tags), document horizontal overflow (and the element causing it), `h1` count, landmarks, theme class before first paint (`DOMContentLoaded`) for a stored dark theme, and console/page errors (hydration).
- **Fidelity:** reference and implementation compared side by side by a reviewer, not pixel-diffed (different data and font pipelines). Deliberate deviations stay as recorded in the register (for example [DR-084](./discrepancy-register.md#dr-084), [DR-086](./discrepancy-register.md#dr-086)–[DR-089](./discrepancy-register.md#dr-089), [DR-161](./discrepancy-register.md#dr-161)–[DR-164](./discrepancy-register.md#dr-164)).
- **Determinism:** fixed fixture data, UTC timezone, `en-GB` locale, reduced motion, fonts awaited; workbench baselines additionally use the dvh probe and a window larger than every artboard.

## 4. Coverage

### Canonical files (425)

| Disposition               | Files | Meaning                                                                                                                             |
| ------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `compared`                | 262   | Implementation captured at the same screen, state, viewport and theme (or print)                                                    |
| `compared-representative` | 62    | Same screen and state captured at the matrix variants; this theme/viewport variant is redundant                                     |
| `not-captured-external`   | 8     | `AUTH-GOOGLE-LINK`, `AUTH-GOOGLE-REGISTER`: need a Google ID token; covered by app static tests and the shared auth layout captures |
| `reference-only`          | 5     | `AUTH-MESSAGES` (message catalogue, mapped in §6) and `FND-FOUNDATIONS` (development-only page; tokens and contrast unit-tested)    |
| `email-static-audit`      | 88    | Email designs: Chromium render plus static HTML audit (§7)                                                                          |
| `not-compared`            | 0     |                                                                                                                                     |

Missing or unsupported states: none of the 337 screen references lacks a decision. Backend-gated (class D) screens were compared as preview compositions and keep **no production route** (`qa.deployedRoute: null`); 28 screens have a deployed route.

### Screens (62)

| Result               | Screens | Notes                                                                                                                                    |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `pass`               | 43      | No axe violation, no page overflow, reference fidelity as recorded (low-severity open items are listed in `qa.gaps`)                     |
| `pass-after-fix`     | 13      | Defects fixed in this ticket (§5)                                                                                                        |
| `gap`                | 2       | `ADM-PAYMENT-ANALYTICS` ([DR-174](./discrepancy-register.md#dr-174)), `USR-PURCHASE-DETAIL` ([DR-175](./discrepancy-register.md#dr-175)) |
| `reference-reviewed` | 4       | `AUTH-MESSAGES`, `FND-FOUNDATIONS`, `AUTH-GOOGLE-LINK`, `AUTH-GOOGLE-REGISTER`                                                           |

387 implementation captures: 179 route captures across the three portals (2 of them the public 404 page) and 208 preview-harness captures (including print). Shared primitives and shells: the 76 workbench baselines (§2) plus the dashboard-ui, ui-core, forms and public-ui browser suites.

### Areas (A5–A8)

- **Public:** all nine routes plus the 404 page and the mobile menu; pricing monthly and yearly switch, CTA, contact (support email; no form endpoint, [DR-033](./discrepancy-register.md#dr-033)), legal pages. `/foundations` is a development-only page and returns 404 in production builds by design.
- **User:** sign-in (default, validation, invalid credentials), two-factor, registration (email and details steps), confirm email, passkey setup, forgot/reset password (all states), dashboard, profile, preferences, security (six tabs and the two-factor setup dialog), billing (six states), history, purchase detail, checkout and the three return routes, mobile drawer. At the FE-UI-016 visual-QA baseline, wallet, top-up and verification were preview-only; CAF-FE-006 subsequently made verification live while preserving that approved composition.
- **Admin:** sign-in, dashboard (production data contract and preview), every preview group (users, roles and role editor, KYC, payments, plans, subscriptions, allocation, invoices, analytics, providers, reference data, audit, system health), the forbidden state and the step-up dialog. Production navigation stays Dashboard-only; `admin-preview-boundaries.test.ts` still passes.
- **Invoices and receipts:** every named preview state (user and admin) at desktop and phone, light and dark, and in print: light paper in the dark theme, chrome hidden only around `data-print-paper`, long documents without clipped totals and no page overflow. Download, email and issuance stay disabled with their reasons (DR-162).
- **Password reset:** request, code and passwords, mismatch, invalid/expired/used code, resend and change email, success, unknown email (same screen as a known one). The BFF answers an unknown email with 202 and an invalid code with one 400, sends `cache-control: no-store`, sets no cookie, and forwards only contract fields. Only `POST /api/auth/password-resets` and `POST /api/auth/password-resets/completions` exist; no reset link or verify endpoint.

## 5. Defects fixed

| ID                                                | Screens                                       | Root cause                                                                                                      | Fix and test                                                                                                  |
| ------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [DR-167](./discrepancy-register.md#dr-167) (High) | `AUTH-FORGOT-PASSWORD`, `AUTH-RESET-PASSWORD` | `/forgot-password` was public but not an auth-layout path: signed-in chrome around the reset form, two `<main>` | `apps/user-portal/src/lib/user-layout.ts`; `user-layout.test.ts`, `user-layout-shell.test.tsx`                |
| [DR-168](./discrepancy-register.md#dr-168)        | `USR-BILLING`, `USR-BILLING-HISTORY` (tablet) | sr-only text in off-screen table columns positioned against an ancestor outside the scroll region               | `packages/ui-core/src/components/table.tsx` (`relative` scroll region); `table.browser.test.tsx`              |
| [DR-169](./discrepancy-register.md#dr-169)        | `ADM-PAYMENT-ANALYTICS` (phone)               | breakdown grid without `min-w-0`: table width sized the page column (492 px)                                    | `payment-analytics-screen.tsx`; `payment-analytics-screen.browser.test.tsx`                                   |
| [DR-170](./discrepancy-register.md#dr-170)        | `MKT-PRICING`                                 | FAQ `dt`/`dd` two `div`s below the `dl`                                                                         | `packages/public-ui/src/components/faq-grid.tsx`; `marketing-sections.browser.test.tsx`                       |
| [DR-165](./discrepancy-register.md#dr-165)        | `MKT-HOME`                                    | CTA lead at 85% white on brand (4.19:1), copied from the reference                                              | `packages/public-ui/src/components/cta-banner.tsx`; `marketing-sections.browser.test.tsx`                     |
| [DR-171](./discrepancy-register.md#dr-171)        | every signed-in User Portal page (desktop)    | help-card support link distinguished by colour only (1.14:1)                                                    | `apps/user-portal/src/components/user-layout-shell.tsx`; `user-layout-shell.test.tsx`                         |
| [DR-085](./discrepancy-register.md#dr-085)        | workbench phone/tablet shells                 | viewport grown to `scrollHeight` while the shell set up its `<main>` scroll region                              | `tooling/ui-workbench/visual/dashboard-shell.visual.test.tsx` (`grow: false`); 9 new reviewed win32 baselines |

Every fix was reproduced by a failing test first. No route, action, BFF call, query, schema or business state changed; the forgot-password layout change is presentation only (same route, same flow).

## 6. Accessibility

- **axe (WCAG 2.0–2.2 A/AA):** before fixes — `color-contrast` (home CTA), `definition-list`/`dlitem` (pricing), `link-in-text-block` (all signed-in user pages); duplicate `main` on forgot-password. After fixes — zero violations on every route and preview capture except `target-size` on the purchase-detail phone layout ([DR-175](./discrepancy-register.md#dr-175)) and `scrollable-region-focusable` on the payment-analytics phone tables ([DR-174](./discrepancy-register.md#dr-174)). Email live files: zero violations.
- **Responsive:** no document horizontal overflow at 390, 834 or 1440 on any route or preview capture after fixes (tables scroll inside their regions); emails also at 320.
- **Structure:** one `h1` and one `main` on every route capture; labelled navigation landmarks; skip link on every signed-in page. Invoice and receipt preview states other than ready have no page `h1` ([DR-176](./discrepancy-register.md#dr-176)); dialog-only harness captures have none by design.
- **Theme:** a stored dark theme is on `<html>` before first paint on every route (no flash) and persists through `localStorage["theme"]`; no hydration or page errors were logged. Exception: pages that call `notFound()` during render ([DR-172](./discrepancy-register.md#dr-172)).
- **Keyboard, focus, dialogs, menus, tabs, combobox, OTP paste/autofill, live regions, reduced motion:** covered by the existing browser suites, re-run here (dialog trap/return and Escape, drawer, account menu, tabs, segmented control, switch, OTP paste, pending/duplicate submission, reset-flow focus and announcements). The step-up, top-up and two-factor setup dialogs were captured open with no violations.
- **Contrast:** `theme.test.ts` asserts all token pairs (text 4.5:1, controls and focus 3:1); the one failing composite (CTA lead) is fixed.
- **Not done:** no screen-reader pass (NVDA/VoiceOver), no 200%/400% zoom pass beyond 320 px reflow, no automated axe job in CI (OD-05).

### Authentication messages (`AuthStates`)

| Reference message               | Implementation                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Incorrect email or password     | 401 → same title and body; "3 attempts left before a short lockout" omitted (the backend returns no count, DR-016) |
| Account locked                  | 423 → "Account locked" with safe copy; "Try again in 15 minutes" omitted (no duration from the backend)            |
| Email not confirmed             | `email_not_verified` / `reason=email_not_confirmed` → warning on confirm email and Google sign-in                  |
| Too many requests               | 429 → warning (sign-in, Google, two-factor, reset)                                                                 |
| Google sign-in failed           | Google errors by stable code                                                                                       |
| Passkey cancelled               | Passkey setup info alert; sign-in cancellation stays silent                                                        |
| No passkey found on this device | Adapted: "Passkey sign-in failed" with the status-specific message (no stable code to detect this case)            |
| Passkeys aren't supported here  | Passkey setup warning; sign-in control disabled with an explanation                                                |
| Code expired                    | Adapted: one "That code didn't work" state for wrong, expired or used codes (the backend returns one 400 for all)  |
| No account for this email       | Omitted: would enable account enumeration (DR-016)                                                                 |
| Invalid authenticator code      | 401 on the two-factor step → same copy                                                                             |
| Password updated                | Reset success; "all your existing sessions were signed out" is backed by `RevokeAllAsync` on completion (DR-141)   |

## 7. Transactional emails (22 designs)

Static HTML audit of the 22 live files and 88 canonical variants, plus Chromium renders at 1440, 390 and 320 in light and dark. **No real email client was tested**; compatibility with Outlook, Gmail or Apple Mail is not claimed ([DR-144](./discrepancy-register.md#dr-144)).

- Layout: 4–8 tables per email, all `role="presentation"`; one `<style>` block plus 20–39 inline `style` attributes; no flex, grid or CSS variables; 600 px max width with a `max-width` media query; no horizontal overflow at 320 px.
- Images: none (the logo is text), so no missing `alt`.
- Links: `mailto:` support link; 2–4 placeholder `#` links per email ("Email preferences", "Privacy") in every live file and all 88 canonical files (DR-143).
- Fonts: Outfit/JetBrains Mono from Google Fonts with Helvetica/Arial/Menlo fallbacks.
- Dark mode: `color-scheme` meta, `prefers-color-scheme: dark` and `[data-ogsc]` overrides on the wrappers; `<body>` is not themed, leaving a light band under short emails ([DR-166](./discrepancy-register.md#dr-166)). No MSO conditional comments or VML buttons (Outlook fallback missing, DR-144).
- Accessibility: `lang`, viewport meta and readable contrast; zero axe violations in every render.
- Per-template results and the 22 `NotificationType` mappings: `final-visual-qa.json#notificationTypes`; the content contracts stay in [`email-template-catalog.json`](./email-template-catalog.json). Nothing here adds email delivery, backend templates or portal routes.

## 8. Remaining gaps

| ID                                         | Severity | Owner                      | Summary                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | -------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DR-174](./discrepancy-register.md#dr-174) | Medium   | Frontend (ui-core)         | Overflowing `DataTable` without focusable cells is not explicitly keyboard-scrollable                                                                                                                                                                                             |
| Password-reset BFF body                    | Medium   | Frontend (BFF, functional) | An accepted request returns the backend's message, while an unknown email gets the BFF's fixed message, so the HTTP bodies can differ (the UI copy is identical). Recommend always returning the fixed message. Recorded, not fixed (BFF behaviour is out of this ticket's scope) |
| [DR-175](./discrepancy-register.md#dr-175) | Low      | Frontend (dashboard-ui)    | Mobile tab bar can partly cover a focused control at the bottom of the first screen                                                                                                                                                                                               |
| [DR-172](./discrepancy-register.md#dr-172) | Low      | Frontend                   | `notFound()` pages render client-side after the error shell; theme applies after first paint                                                                                                                                                                                      |
| [DR-176](./discrepancy-register.md#dr-176) | Low      | Frontend                   | Non-ready invoice/receipt preview states lack a page `h1` (no route yet)                                                                                                                                                                                                          |
| [DR-173](./discrepancy-register.md#dr-173) | Low      | Frontend (workbench)       | Workbench theme toolbar bypasses `next-themes`; no dark overlay baselines                                                                                                                                                                                                         |
| [DR-166](./discrepancy-register.md#dr-166) | Low      | Design / Backend           | Email dark mode leaves `<body>` light                                                                                                                                                                                                                                             |
| DR-144, OD-05                              | Medium   | Backend / DevOps           | No real email-client testing; browser and visual suites not in CI; no Linux baselines                                                                                                                                                                                             |
| Functional journeys                        | Medium   | Frontend                   | Playwright + MSW journey suite still outstanding (verification-strategy §8)                                                                                                                                                                                                       |

## 9. Limitations

- Captures used a local stub of the backend, not a deployed backend; they prove presentation and BFF wiring, not backend contracts (FE-UI-017 maps those).
- The User Portal reads some public data from the browser through `NEXT_PUBLIC_API_BASE_URL` (countries, plans); for the captures that build pointed it at the stub. Production builds are unchanged.
- Portals ran with `next start` although they deploy with `output: standalone`.
- Windows/Chromium only; no Firefox, Safari or real devices.
- Google Identity states were not exercised end to end.
