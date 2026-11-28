# Integration handoff (FE-UI-017)

This handoff turns the [contract matrix](./api-contract-matrix.md) into an integration backlog. It lists each gap with evidence, owner, prerequisite, acceptance criteria and tests, then gives proposed ticket refinement text. Gap records are generated from [`api-contract-matrix.json`](./api-contract-matrix.json) (`gaps[]`) and should be kept in sync with it.

Trello was reconciled on 2026-11-28. FE-UI-016 and FE-UI-017 are in **DOING**; BE-DS-001 is in **DEV TESTING**. Existing owners were refined with the verified findings and missing owners were created. Every gap below now has a verified card URL or an explicit no-card disposition; no implementation card is claimed complete.

Baselines: frontend `79642f8`, backend `1fcad50`, design `ad9386e`.

## Summary

| Severity | Gaps                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blocker  | [002](#gap-017-002) admin step-up MFA, [003](#gap-017-003) admin MFA sign-in                                                                                                                                                                                                                                                                                                                                          |
| High     | [001](#gap-017-001) stale OpenAPI, [004](#gap-017-004) admin admission and permissions, [005](#gap-017-005) admin dashboard, [006](#gap-017-006) admin users                                                                                                                                                                                                                                                          |
| Medium   | [007](#gap-017-007) admin KYC, [008](#gap-017-008) admin payments, [009](#gap-017-009) admin subscriptions, plans and allocation, [010](#gap-017-010) analytics, [011](#gap-017-011) audit, [012](#gap-017-012) providers, [016](#gap-017-016) invoices and receipts, [018](#gap-017-018) preferences, [019](#gap-017-019) wallet, [020](#gap-017-020) password reset, [027](#gap-017-027) reset BFF body enumeration |
| Low      | [013](#gap-017-013), [014](#gap-017-014), [015](#gap-017-015), [021](#gap-017-021), [022](#gap-017-022), [023](#gap-017-023), [024](#gap-017-024), [025](#gap-017-025), [026](#gap-017-026)                                                                                                                                                                                                                           |

**Blockers versus enhancements.** GAP-017-002 and GAP-017-003 together block every privileged admin mutation. Two more gaps carry the "blocks the dependent capability" flag because their capability cannot ship without backend work: GAP-017-016 (invoices and receipts, BE-DS-007) and GAP-017-019 (wallet, BE-DS-005). GAP-017-009 is not flagged, but its missing tenant directory blocks the allocation tenant picker. Customer KYC was completed by CAF-FE-006; remaining admin **read** integrations and preferences are enhancements the backend already supports.

## Recommended sequencing

1. **GAP-017-001: refresh the OpenAPI reference** (separately authorized `pnpm sync:openapi` against backend `1fcad50` or later). This makes the later contract diffs reviewable.
2. **Admin reads, no step-up needed:** GAP-017-005 (dashboard) → GAP-017-006 (users and roles, reads only), GAP-017-007, GAP-017-008, GAP-017-010 and GAP-017-011. Decide GAP-017-004 (admission and per-section 403) first, or alongside.
3. **Customer:** GAP-017-027 (fixed reset BFF body; small, ship first). GAP-017-018 (preferences) follows its product decision. GAP-017-017 was completed by CAF-FE-006.
4. **Admin security foundation:** GAP-017-003 (MFA sign-in), then GAP-017-002 (step-up), together with GAP-017-012 (provider operation drift).
5. **Admin mutations:** users, roles and sessions (GAP-017-006), then subscriptions, plans and allocation (GAP-017-009) and providers (GAP-017-012).
6. **Backend-led:** BE-DS-005 (wallet), BE-DS-006 (password reset), BE-DS-007 (invoices and receipts), BE-DS-008 (notifications), the tenant directory, admin health and reference-data management.

Before each integration, replace the screen's preview-only boundary deliberately. That means updating `admin-preview-boundaries.test.ts` and the route/navigation docs as part of the same change. Never publish mock routes.

## Trello reconciliation

The former proposal section has been applied to the actual boards. Live Trello numbering differs from roadmap/code-reference numbering; the links below are authoritative.

| Gap         | Verified owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-017-001 | [CAF-FE-018 — Refresh checked-in OpenAPI reference](https://trello.com/c/9IvwOi5J/39-caf-fe-018-refresh-checked-in-openapi-reference)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| GAP-017-002 | [CAF-FE-019 — Implement admin MFA sign-in and step-up](https://trello.com/c/zH2S4loY/40-caf-fe-019-implement-admin-mfa-sign-in-and-step-up)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GAP-017-003 | [CAF-FE-019 — Implement admin MFA sign-in and step-up](https://trello.com/c/zH2S4loY/40-caf-fe-019-implement-admin-mfa-sign-in-and-step-up)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GAP-017-004 | [CAF-FE-020 — Decide and implement Admin Portal admission policy](https://trello.com/c/a5anog5t/41-caf-fe-020-decide-and-implement-admin-portal-admission-policy)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GAP-017-005 | [CAF-FE-021 — Integrate live Admin Portal dashboard](https://trello.com/c/tBtw7iJ2/42-caf-fe-021-integrate-live-admin-portal-dashboard)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GAP-017-006 | [CAF-FE-008 — Implement admin user management screens](https://trello.com/c/WevOm7bI/9-caf-fe-008-implement-admin-user-management-screens)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| GAP-017-007 | [CAF-FE-009 — Implement admin KYC monitoring screens](https://trello.com/c/idWAB1hT/10-caf-fe-009-implement-admin-kyc-monitoring-screens)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GAP-017-008 | [CAF-FE-012 — Build admin payment transactions and detail pages](https://trello.com/c/pcUv381R/14-caf-fe-012-build-admin-payment-transactions-and-detail-pages)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GAP-017-009 | [CAF-FE-014 — Build admin subscription plan management screens](https://trello.com/c/m0jIHnTa/18-caf-fe-014-build-admin-subscription-plan-management-screens)<br>[CAF-FE-015 — Build admin subscription management screens](https://trello.com/c/WMnvzksg/16-caf-fe-015-build-admin-subscription-management-screens)<br>[CAF-FE-016 — Build admin subscription allocation workflow](https://trello.com/c/UkhYZPbR/17-caf-fe-016-build-admin-subscription-allocation-workflow)<br>[BE-DS-009 — Define tenant directory contract for admin allocation](https://trello.com/c/acUGqwsT/46-be-ds-009-define-tenant-directory-contract-for-admin-allocation) |
| GAP-017-010 | [CAF-FE-010 — Build admin registration analytics page](https://trello.com/c/e40wpLWG/11-caf-fe-010-build-admin-registration-analytics-page)<br>[CAF-FE-011 — Build admin active-user analytics page](https://trello.com/c/T8f6yIXa/12-caf-fe-011-build-admin-active-user-analytics-page)<br>[CAF-FE-013 — Build admin payment analytics overview](https://trello.com/c/GXMwEsOL/13-caf-fe-013-build-admin-payment-analytics-overview)<br>[CAF-FE-017 — Build admin subscription analytics overview](https://trello.com/c/SXT5WigJ/15-caf-fe-017-build-admin-subscription-analytics-overview)                                                           |
| GAP-017-011 | [CAF-FE-022 — Integrate admin audit history and export](https://trello.com/c/WOcgyG3l/43-caf-fe-022-integrate-admin-audit-history-and-export)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| GAP-017-012 | [CAF-FE-023 — Integrate admin payment providers](https://trello.com/c/QRIuHX4b/44-caf-fe-023-integrate-admin-payment-providers)<br>[BE-DS-004 — Review operational provider and system-health API requirements](https://trello.com/c/MHDBW420/41-be-ds-004-review-operational-provider-and-system-health-api-requirements)                                                                                                                                                                                                                                                                                                                             |
| GAP-017-013 | [BE-DS-010 — Decide admin reference-data management scope](https://trello.com/c/TUdcT0bq/47-be-ds-010-decide-admin-reference-data-management-scope)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| GAP-017-014 | [CAF-FE-008 — Implement admin user management screens](https://trello.com/c/WevOm7bI/9-caf-fe-008-implement-admin-user-management-screens)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| GAP-017-015 | [BE-DS-004 — Review operational provider and system-health API requirements](https://trello.com/c/MHDBW420/41-be-ds-004-review-operational-provider-and-system-health-api-requirements)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GAP-017-016 | [BE-DS-007 — Define invoice and receipt domain and API requirements](https://trello.com/c/8JZSDXfH/44-be-ds-007-define-invoice-and-receipt-domain-and-api-requirements)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GAP-017-017 | [CAF-FE-006 — Implement KYCAid KYC user flow](https://trello.com/c/EWDTKQ3u/7-caf-fe-006-implement-kycaid-kyc-user-flow)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| GAP-017-018 | [CAF-FE-024 — Decide and integrate account preferences](https://trello.com/c/Zmy4ZP7l/45-caf-fe-024-decide-and-integrate-account-preferences)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| GAP-017-019 | [BE-DS-005 — Decide wallet and top-up domain scope for the project template](https://trello.com/c/773lH2Sg/42-be-ds-005-decide-wallet-and-top-up-domain-scope-for-the-project-template)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GAP-017-020 | [BE-DS-006 — Review and harden password-reset API contracts and security](https://trello.com/c/s9tsnAcK/43-be-ds-006-review-and-harden-password-reset-api-contracts-and-security)                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GAP-017-021 | No card: deliberate safe omission until authoritative backend values exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GAP-017-022 | [CAF-FE-025 — Remove or adopt unused authentication BFF routes](https://trello.com/c/Hnl91kV3/46-caf-fe-025-remove-or-adopt-unused-authentication-bff-routes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| GAP-017-023 | This PR (inventory/OKF/docs reconciliation after PR #56).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GAP-017-024 | [BE-DS-008 — Review transactional email catalog and notification infrastructure gaps](https://trello.com/c/RTpBnO3B/45-be-ds-008-review-transactional-email-catalog-and-notification-infrastructure-gaps)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| GAP-017-025 | [CAF-FE-007 — Implement subscription and billing user experience](https://trello.com/c/SnrHMj1K/8-caf-fe-007-implement-subscription-and-billing-user-experience)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| GAP-017-026 | [CAF-FE-027 — Decide public contact form behavior](https://trello.com/c/NlDpmC2a/48-caf-fe-027-decide-public-contact-form-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| GAP-017-027 | [CAF-FE-026 — Make password-reset accepted responses non-enumerating](https://trello.com/c/F9dWgYAW/47-caf-fe-026-make-password-reset-accepted-responses-non-enumerating)<br>[BE-DS-006 — Review and harden password-reset API contracts and security](https://trello.com/c/s9tsnAcK/43-be-ds-006-review-and-harden-password-reset-api-contracts-and-security)                                                                                                                                                                                                                                                                                         |

Existing cards refined: CAF-FE-006…017 where applicable and BE-DS-004…008. New cards created: CAF-FE-018…027 and BE-DS-009…010. FE-UI-016 received the dependency/safety reconciliation in its card discussion.

## Gaps

### <a id="gap-017-001"></a>GAP-017-001: Checked-in OpenAPI reference is far behind the backend

- **Severity:** high (not a blocker). **Kind:** drift. **Owner:** frontend.
- **Observed:** backendprojecttemplatewebapi.json lists 21 operations; backend 1fcad50 has 100 controller endpoints (80 absent from the file). 31 of 48 frontend operations are not in the file, and it still documents POST /api/v1/stakeholders/me/profile/avatar, which the backend no longer exposes (replaced by avatar/uploads + complete). All 48 frontend operation methods/paths match the backend.
- **Desired:** Refresh the reference with pnpm sync:openapi against the recorded backend revision in a separately authorized change; review the diff; no code generation.
- **Evidence:** `backendprojecttemplatewebapi.json`, `packages/api-client/scripts/sync-openapi.mjs`, `src/BackendProjectTemplate.WebAPI/EndpointUrl.cs@1fcad50`.
- **Prerequisite:** Running backend at the recorded commit.
- **Acceptance criteria:** Spec operation set equals backend controller set (webhooks may be included). No TypeScript generated; handwritten contracts unchanged unless a real drift is found.
- **Tests:** Manual diff review; existing api-client HTTP-boundary tests stay green.
- **Sequencing:** First; makes later admin/KYC contract work reviewable.
- **Existing tickets:** [CAF-FE-018 — Refresh checked-in OpenAPI reference](https://trello.com/c/9IvwOi5J/39-caf-fe-018-refresh-checked-in-openapi-reference)
- **Affected actions:** `ADM-PROVIDERS.toggle-payment-provider`, `USR-PROFILE.upload-avatar`.

### <a id="gap-017-002"></a>GAP-017-002: Admin step-up MFA is enforced by the backend but absent in the frontend

- **Severity:** blocker (blocks the dependent capability). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** Every admin mutation (lock/unlock, role assign/remove, session revoke(s), plan create/update/activation, subscription allocate/cancel/retry, payment-provider activation, active provider) carries [RequireStepUpMfa] and needs X-Step-Up-Authorization from POST /api/v1/authentication/security/step-up/verifications. AdminStepUpDialog is presentation-only; no api-client operation; setPaymentProviderActivation/setActiveProvider cannot send the header; OKF authentication domain states 'no step-up endpoint or admin MFA exists' (stale).
- **Desired:** api-client operation for step-up verification; per-operation optional step-up header parameter; admin BFF routes that obtain and attach the proof server-side; dialog wired to verify with authenticator codes only.
- **Evidence:** `apps/admin-portal/src/components/admin-patterns/step-up-dialog.tsx`, `docs/architecture/authorization.md@1fcad50 (backend)`, `.okf/knowledge/domains/authentication.md`.
- **Prerequisite:** GAP-017-003 (admins must be able to sign in with MFA).
- **Acceptance criteria:** Proof requested with the exact method/path/query/body of the intended mutation. Proof/token never stored, logged or exposed to browser JS beyond the BFF. Stable mfa_* errors mapped; consumed proofs never retried.
- **Tests:** HTTP-boundary tests for the new operation and header. BFF route tests for proof attach and error mapping. Dialog browser test (code entry, error, cancel).
- **Sequencing:** After GAP-017-003; before any admin mutation adapter.
- **Existing tickets:** [CAF-FE-019 — Implement admin MFA sign-in and step-up](https://trello.com/c/zH2S4loY/40-caf-fe-019-implement-admin-mfa-sign-in-and-step-up)
- **Affected actions:** `SHARED.admin-verify-step-up`, `ADM-ALLOCATE.submit-allocation`, `ADM-PLANS.create-plan`, `ADM-PLANS.update-plan`, `ADM-PLANS.toggle-plan-activation`, `ADM-PROVIDERS.toggle-payment-provider`, `ADM-PROVIDERS.make-provider-active`, `ADM-STEP-UP.verify-step-up` and 9 more.

### <a id="gap-017-003"></a>GAP-017-003: Admin Portal cannot complete MFA sign-in

- **Severity:** blocker (blocks the dependent capability). **Kind:** security. **Owner:** frontend+product.
- **Observed:** apps/admin-portal/src/app/api/auth/session/route.ts returns 409 two_factor_required ('not available in the admin portal yet'). Step-up requires an enrolled authenticator (mfa_enrollment_required), so an admin able to perform privileged mutations cannot sign in, and there is no admin enrollment surface.
- **Desired:** Admin two-factor challenge continuation (reuse the User Portal challenge-cookie pattern) and a decided enrollment path for admins.
- **Evidence:** `apps/admin-portal/src/app/api/auth/session/route.ts`, `docs/architecture/authorization.md@1fcad50 (backend)`.
- **Prerequisite:** Product decision on where admins enroll MFA.
- **Acceptance criteria:** MFA-enrolled admin can sign in; challenge stored only in HttpOnly cookie; role admission applied after challenge success.
- **Tests:** BFF tests for challenge set/verify/clear; browser test for the two-factor step.
- **Sequencing:** First admin security task.
- **Existing tickets:** [CAF-FE-019 — Implement admin MFA sign-in and step-up](https://trello.com/c/zH2S4loY/40-caf-fe-019-implement-admin-mfa-sign-in-and-step-up)
- **Affected actions:** `SHARED.admin-verify-step-up`, `ADM-ALLOCATE.submit-allocation`, `ADM-PLANS.create-plan`, `ADM-PLANS.update-plan`, `ADM-PLANS.toggle-plan-activation`, `ADM-SIGN-IN.handle-two-factor-required`, `ADM-STEP-UP.verify-step-up`, `ADM-SUBSCRIPTION-DETAIL.cancel-at-period-end` and 8 more.

### <a id="gap-017-004"></a>GAP-017-004: Admin admission and per-permission UX do not reflect backend roles

- **Severity:** high (not a blocker). **Kind:** security. **Owner:** frontend+product.
- **Observed:** Admission checks one JWT role claim (ADMIN_REQUIRED_ROLE). Backend has four seeded roles (Administrator, ComplianceOfficer, FinanceOfficer, SupportAgent) and evaluates permissions per request from current Identity membership, ignoring JWT role claims. No endpoint returns the caller's effective permissions, so UI must treat a 403 per section as hide/disable (BE-DS-002 rule).
- **Desired:** Decide admission (any admin role vs one); per-section 403 handling via AdminForbidden/section states; optional backend 'my permissions' read to avoid probing.
- **Evidence:** `apps/admin-portal/src/lib/admin-authorization.ts`, `apps/admin-portal/src/lib/admin-session-authorization.ts`, `docs/architecture/authorization.md@1fcad50 (backend)`, `docs/architecture/admin-dashboard-data-requirements.md@1fcad50 (backend)`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** Non-Administrator roles can be admitted when intended. A 403 on one section never fails the whole page.
- **Tests:** proxy/admission unit tests per role claim; section-level 403 tests.
- **Sequencing:** With GAP-017-005.
- **Existing tickets:** [CAF-FE-020 — Decide and implement Admin Portal admission policy](https://trello.com/c/a5anog5t/41-caf-fe-020-decide-and-implement-admin-portal-admission-policy)
- **Affected actions:** `SHARED.admin-refresh-session`, `ADM-FORBIDDEN.render-forbidden`, `ADM-SIGN-IN.admission-check`.

### <a id="gap-017-005"></a>GAP-017-005: Admin dashboard shows every panel unavailable although BE-DS-002 endpoints exist

- **Severity:** high (not a blocker). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** productionAdminDashboard hard-codes 'unavailable' with reasons claiming no admin analytics/KYC/provider API (DR-070, DR-074). Backend 503a4e5 closed BE-DS-002 with registrations, active-users, payment and subscription analytics, KYC summary and payment-provider listing.
- **Desired:** admin api-client operations + server reads; independent per-section loading/error/forbidden; period control mapped to from/to.
- **Evidence:** `apps/admin-portal/src/app/_dashboard/admin-dashboard-data.ts`, `docs/architecture/admin-dashboard-data-requirements.md@1fcad50 (backend)`.
- **Prerequisite:** GAP-017-001 refreshed spec (recommended).
- **Acceptance criteria:** Each panel reads its own endpoint under its own permission. No sample or computed figures; currency per backend.
- **Tests:** HTTP-boundary tests per operation; dashboard composition tests for ready/forbidden/error per panel.
- **Sequencing:** First admin read integration (reads need no step-up).
- **Existing tickets:** [CAF-FE-021 — Integrate live Admin Portal dashboard](https://trello.com/c/tBtw7iJ2/42-caf-fe-021-integrate-live-admin-portal-dashboard)
- **Affected actions:** `ADM-DASHBOARD.read-registration-kpis`, `ADM-DASHBOARD.read-active-user-kpis`, `ADM-DASHBOARD.read-payment-kpis`, `ADM-DASHBOARD.read-subscription-kpis`, `ADM-DASHBOARD.read-kyc-queue`, `ADM-DASHBOARD.read-payment-providers`, `ADM-DASHBOARD.change-period`.

### <a id="gap-017-006"></a>GAP-017-006: Admin users: backend list/detail/lock/roles/sessions exist; frontend preview-only

- **Severity:** high (not a blocker). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** Endpoints under /api/v1/admin/users (users.read / users.manage + step-up). Compositions describe 'no admin user API (DR-071, DR-072)'. Preview revokes a single session with ConfirmDialog, but the backend requires step-up for it. Users list has no KYC filter parameter.
- **Desired:** Read adapters first (list/detail/roles); mutations after GAP-017-002/003.
- **Evidence:** `apps/admin-portal/src/features/admin-users/users-model.ts`, `src/BackendProjectTemplate.WebAPI/Features/Authentication/AdminUsers/AdminUsersController.cs@1fcad50`.
- **Prerequisite:** GAP-017-002, GAP-017-003 for mutations.
- **Acceptance criteria:** Routes /users and /users/[userId] published only with live reads. Reason captured for every mutation; step-up for every mutation including single-session revoke.
- **Tests:** Operation tests; route tests; admin-preview-boundaries updated deliberately.
- **Sequencing:** After dashboard reads.
- **Existing tickets:** [CAF-FE-008 — Implement admin user management screens](https://trello.com/c/WevOm7bI/9-caf-fe-008-implement-admin-user-management-screens)
- **Affected actions:** `ADM-ALLOCATE.search-user`, `ADM-USER-DETAIL.read-user`, `ADM-USER-DETAIL.read-user-roles`, `ADM-USER-DETAIL.lock-user`, `ADM-USER-DETAIL.unlock-user`, `ADM-USER-DETAIL.assign-role`, `ADM-USER-DETAIL.remove-role`, `ADM-USER-DETAIL.revoke-user-session` and 4 more.

### <a id="gap-017-007"></a>GAP-017-007: Admin KYC monitoring reads exist; no admin refresh action

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend (reads) / backend (refresh).
- **Observed:** GET /admin/kyc, /admin/kyc/summary, /admin/kyc/{id} exist (kyc.read). kyc.manage permission exists but no endpoint uses it; preview 'request latest status' has no endpoint.
- **Desired:** Wire reads; keep refresh disabled until a backend operation exists.
- **Evidence:** `apps/admin-portal/src/features/admin-kyc/kyc-model.ts`, `docs/kycaid-kyc.md@1fcad50 (backend)`.
- **Prerequisite:** None for reads.
- **Acceptance criteria:** Cursor pagination via getInfiniteQueryOptions; unknown statuses render Unknown.
- **Tests:** Operation + composition tests.
- **Sequencing:** Parallel with GAP-017-006 reads.
- **Existing tickets:** [CAF-FE-009 — Implement admin KYC monitoring screens](https://trello.com/c/idWAB1hT/10-caf-fe-009-implement-admin-kyc-monitoring-screens)
- **Affected actions:** `ADM-KYC.read-kyc-summary`, `ADM-KYC.read-kyc-verifications`, `ADM-KYC.filter-kyc-verifications`, `ADM-KYC.paginate-kyc-verifications`, `ADM-KYC-DETAIL.read-kyc-verification`, `ADM-KYC-DETAIL.refresh-kyc-status`.

### <a id="gap-017-008"></a>GAP-017-008: Admin payments list/detail exist; frontend preview-only

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** GET /admin/payments (cursor/limit, filters) and /admin/payments/{id} (payments.read). Preview model paginates by page reset; backend is cursor-based.
- **Desired:** Adapter (CAF-FE-014) with cursor pagination.
- **Evidence:** `apps/admin-portal/src/features/admin-payments/payments-model.ts`.
- **Prerequisite:** None.
- **Acceptance criteria:** Null fields render 'Not available', never zero.
- **Tests:** Operation + composition tests.
- **Sequencing:** After dashboard.
- **Existing tickets:** [CAF-FE-012 — Build admin payment transactions and detail pages](https://trello.com/c/pcUv381R/14-caf-fe-012-build-admin-payment-transactions-and-detail-pages)
- **Affected actions:** `ADM-PAYMENT-DETAIL.read-payment`, `ADM-PAYMENTS.read-payments`, `ADM-PAYMENTS.filter-payments`, `ADM-PAYMENTS.paginate-payments`.

### <a id="gap-017-009"></a>GAP-017-009: Admin subscriptions, plans and allocation APIs exist; allocation lacks a tenant directory

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend (adapters) / backend (tenant directory).
- **Observed:** Admin subscriptions list/detail/cancel/retry/allocations and admin plans CRUD/activation exist (mutations step-up). Allocation requires tenantId; no tenant listing endpoint exists.
- **Desired:** CAF-FE-015/016 adapters; backend tenant directory or product decision to enter tenant ids.
- **Evidence:** `apps/admin-portal/src/features/admin-subscriptions/allocation-model.ts`, `src/BackendProjectTemplate.WebAPI/Features/Subscriptions/AdminSubscriptions/AdminSubscriptionsController.cs@1fcad50`.
- **Prerequisite:** GAP-017-002/003 for mutations.
- **Acceptance criteria:** Allocation sends idempotencyKey in body and treats 200 as replay. Plan prices converted exactly between editor and wire units.
- **Tests:** Operation tests incl. idempotency; editor conversion tests.
- **Sequencing:** After users.
- **Existing tickets:** [CAF-FE-014 — Build admin subscription plan management screens](https://trello.com/c/m0jIHnTa/18-caf-fe-014-build-admin-subscription-plan-management-screens); [CAF-FE-015 — Build admin subscription management screens](https://trello.com/c/WMnvzksg/16-caf-fe-015-build-admin-subscription-management-screens); [CAF-FE-016 — Build admin subscription allocation workflow](https://trello.com/c/UkhYZPbR/17-caf-fe-016-build-admin-subscription-allocation-workflow); [BE-DS-009 — Define tenant directory contract for admin allocation](https://trello.com/c/acUGqwsT/46-be-ds-009-define-tenant-directory-contract-for-admin-allocation)
- **Affected actions:** `ADM-ALLOCATE.search-tenant`, `ADM-ALLOCATE.search-user`, `ADM-ALLOCATE.submit-allocation`, `ADM-PLANS.read-plans`, `ADM-SUBSCRIPTION-DETAIL.read-subscription`, `ADM-SUBSCRIPTIONS.read-subscriptions`, `ADM-SUBSCRIPTIONS.filter-subscriptions`, `ADM-SUBSCRIPTIONS.paginate-subscriptions`.

### <a id="gap-017-010"></a>GAP-017-010: Admin analytics screens have backend endpoints but no adapters

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** Registrations, active users (+ user lists), payment and subscription analytics endpoints exist. Requests use DateOnly from/to and interval ('Day' default); timezone semantics of DateOnly ranges are not documented in the controller (assumed UTC days — verify in backend analytics docs).
- **Desired:** Adapters + range mapping.
- **Evidence:** `docs/architecture/administrative-user-analytics.md@1fcad50 (backend)`, `docs/architecture/payment-analytics.md@1fcad50 (backend)`, `docs/architecture/subscription-analytics.md@1fcad50 (backend)`.
- **Prerequisite:** None.
- **Acceptance criteria:** Range/interval sent exactly; figures and currency as reported.
- **Tests:** Operation + composition tests.
- **Sequencing:** With dashboard.
- **Existing tickets:** [CAF-FE-010 — Build admin registration analytics page](https://trello.com/c/e40wpLWG/11-caf-fe-010-build-admin-registration-analytics-page); [CAF-FE-011 — Build admin active-user analytics page](https://trello.com/c/T8f6yIXa/12-caf-fe-011-build-admin-active-user-analytics-page); [CAF-FE-013 — Build admin payment analytics overview](https://trello.com/c/GXMwEsOL/13-caf-fe-013-build-admin-payment-analytics-overview); [CAF-FE-017 — Build admin subscription analytics overview](https://trello.com/c/SXT5WigJ/15-caf-fe-017-build-admin-subscription-analytics-overview)
- **Affected actions:** `ADM-ACTIVE-USERS.read-active-user-metrics`, `ADM-ACTIVE-USERS.read-active-user-list`, `ADM-ACTIVE-USERS.filter-range`, `ADM-PAYMENT-ANALYTICS.read-payment-summary`, `ADM-PAYMENT-ANALYTICS.read-payment-timeline`, `ADM-PAYMENT-ANALYTICS.read-payment-statuses`, `ADM-PAYMENT-ANALYTICS.read-payment-providers`, `ADM-PAYMENT-ANALYTICS.read-payment-intents` and 10 more.

### <a id="gap-017-011"></a>GAP-017-011: Admin audit history and export exist; frontend preview-only

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend.
- **Observed:** GET /admin/audit-logs (audit.read, page/pageSize) and /admin/audit-logs/export (audit.export) added in 1fcad50. Export success media type is not declared.
- **Desired:** Adapter; export through a BFF streaming download.
- **Evidence:** `docs/architecture/administrative-audit.md@1fcad50 (backend)`.
- **Prerequisite:** None.
- **Acceptance criteria:** Export never exposes bearer tokens; filename/media type from backend.
- **Tests:** Operation + BFF download tests.
- **Sequencing:** Any time after GAP-017-004.
- **Existing tickets:** [CAF-FE-022 — Integrate admin audit history and export](https://trello.com/c/WOcgyG3l/43-caf-fe-022-integrate-admin-audit-history-and-export)
- **Affected actions:** `ADM-AUDIT.read-audit-log`, `ADM-AUDIT.filter-audit-log`, `ADM-AUDIT.paginate-audit-log`, `ADM-AUDIT.export-audit-log`.

### <a id="gap-017-012"></a>GAP-017-012: Provider operations lack step-up and reason; configure/test missing

- **Severity:** medium (not a blocker). **Kind:** contract-drift. **Owner:** frontend / backend.
- **Observed:** Frontend setPaymentProviderActivation {isActive} and setActiveProvider {providerKey, providerType} omit backend optional reason and cannot send X-Step-Up-Authorization. GET /payment-providers exists without a frontend operation. No configure/test or non-payment provider listing endpoints.
- **Desired:** Extend operations (reason, step-up header); add list operation; keep configure/test disabled.
- **Evidence:** `packages/api-client/src/payments/contracts.ts`, `packages/api-client/src/providers/contracts.ts`, `src/BackendProjectTemplate.WebAPI/Features/Payments/Providers/PaymentProvidersController.cs@1fcad50`.
- **Prerequisite:** GAP-017-002.
- **Acceptance criteria:** Operations send header + reason; HTTP-boundary tests updated.
- **Tests:** api-client operation tests.
- **Sequencing:** With GAP-017-002.
- **Existing tickets:** [CAF-FE-023 — Integrate admin payment providers](https://trello.com/c/QRIuHX4b/44-caf-fe-023-integrate-admin-payment-providers); [BE-DS-004 — Review operational provider and system-health API requirements](https://trello.com/c/MHDBW420/41-be-ds-004-review-operational-provider-and-system-health-api-requirements)
- **Affected actions:** `ADM-PROVIDERS.read-payment-providers`, `ADM-PROVIDERS.toggle-payment-provider`, `ADM-PROVIDERS.make-provider-active`, `ADM-PROVIDERS.configure-provider`, `ADM-PROVIDERS.test-provider`.

### <a id="gap-017-013"></a>GAP-017-013: Reference data: no currencies or admin mutation endpoints

- **Severity:** low (not a blocker). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** Only GET countries (anonymous) and GET languages exist.
- **Desired:** Product decision; backend endpoints if admin management is required.
- **Evidence:** `src/BackendProjectTemplate.WebAPI/Features/ReferenceData@1fcad50`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** Tabs without a source stay unavailable.
- **Tests:** n/a until endpoints exist.
- **Sequencing:** Low.
- **Existing tickets:** [BE-DS-010 — Decide admin reference-data management scope](https://trello.com/c/TUdcT0bq/47-be-ds-010-decide-admin-reference-data-management-scope)
- **Affected actions:** `ADM-REFERENCE-DATA.read-countries`, `ADM-REFERENCE-DATA.read-languages`, `ADM-REFERENCE-DATA.read-currencies`, `ADM-REFERENCE-DATA.edit-reference-data`.

### <a id="gap-017-014"></a>GAP-017-014: Roles screens have no read source by backend design

- **Severity:** low (not a blocker). **Kind:** product. **Owner:** product.
- **Observed:** Backend authorization.md: no role/permission/mapping CRUD APIs; mappings are source-controlled. Per-user role assignment exists.
- **Desired:** Either a read-only static roles page documented from backend mappings, or a backend read endpoint; editor remains out of scope (CAF-FE-008).
- **Evidence:** `docs/architecture/authorization.md@1fcad50 (backend)`, `apps/admin-portal/src/features/admin-roles/roles-model.ts`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** No production role editor.
- **Tests:** n/a
- **Sequencing:** Low.
- **Existing tickets:** [CAF-FE-008 — Implement admin user management screens](https://trello.com/c/WevOm7bI/9-caf-fe-008-implement-admin-user-management-screens)
- **Affected actions:** `ADM-ROLE-EDIT.read-role`, `ADM-ROLE-EDIT.edit-role`, `ADM-ROLES.read-roles`, `ADM-USER-DETAIL.assign-role`.

### <a id="gap-017-015"></a>GAP-017-015: No admin system-health API

- **Severity:** low (not a blocker). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** Only anonymous aggregate /health.
- **Desired:** Authorized per-dependency health read, or drop the screen.
- **Evidence:** `src/BackendProjectTemplate.WebAPI/Program.cs:92@1fcad50`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** Screen stays preview-only until then.
- **Tests:** n/a
- **Sequencing:** Low.
- **Existing tickets:** [BE-DS-004 — Review operational provider and system-health API requirements](https://trello.com/c/MHDBW420/41-be-ds-004-review-operational-provider-and-system-health-api-requirements)
- **Affected actions:** `ADM-SYSTEM-HEALTH.read-system-health`, `ADM-SYSTEM-HEALTH.refresh-system-health`.

### <a id="gap-017-016"></a>GAP-017-016: Invoices and receipts have no backend capability

- **Severity:** medium (blocks the dependent capability). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** No invoice/receipt entity or endpoints (DR-160); billing history rows carry no document ids.
- **Desired:** As specified in docs/architecture/11-subscriptions-and-billing.md (owner-scoped reads, admin search/detail, issuance, PDF).
- **Evidence:** `docs/architecture/11-subscriptions-and-billing.md`.
- **Prerequisite:** BE-DS-007.
- **Acceptance criteria:** Routes and nav stay unpublished until reads exist.
- **Tests:** Existing billing-document browser/print tests reused.
- **Sequencing:** Blocked on backend.
- **Existing tickets:** [BE-DS-007 — Define invoice and receipt domain and API requirements](https://trello.com/c/8JZSDXfH/44-be-ds-007-define-invoice-and-receipt-domain-and-api-requirements)
- **Affected actions:** `ADM-INVOICE-DETAIL.read-invoice`, `ADM-INVOICE-DETAIL.download-invoice-pdf`, `ADM-INVOICE-DETAIL.resend-invoice`, `ADM-INVOICES.read-invoices`, `ADM-INVOICES.filter-invoices`, `ADM-INVOICES.export-invoices`, `USR-BILLING-HISTORY.open-row-detail`, `USR-INVOICE-DETAIL.read-invoice` and 3 more.

### <a id="gap-017-017"></a>GAP-017-017: Resolved — customer KYC is live

- **Resolution:** CAF-FE-006 added the handwritten KYC client, authenticated `GET /api/kyc` and `POST /api/kyc/start` BFF routes, bounded React Query polling, the authenticated `/verification` route, navigation and the dashboard callout.
- **Lifecycle:** `Pending` resumes or retries provider provisioning, `InProgress` waits for a provider decision, and only `Rejected`, `Failed` or `Expired` can restart. `isVerified` is the authoritative success flag; unknown statuses expose no action.
- **Provider return:** The browser navigates only to a backend-returned HTTPS URL. Returning to `/verification` triggers the normal authoritative query; navigation and query parameters are never proof of success.
- **Configuration remaining:** Every backend environment must set `Kyc:Kycaid:RedirectUrl` to its authenticated `/verification` URL and configure valid KYCAid credentials, form ID and trusted form hosts.
- **Evidence:** `docs/architecture/customer-kyc-integration.md`, `packages/api-client/src/kyc/`, `packages/api-react/src/kyc/`, `apps/user-portal/src/app/api/kyc/`, `apps/user-portal/src/app/verification/page.tsx`.
- **Tests:** Operation, BFF, query-policy, adapter, duplicate-submission/navigation and live-composition tests.
- **Existing tickets:** [CAF-FE-006 — Implement KYCAid KYC user flow](https://trello.com/c/EWDTKQ3u/7-caf-fe-006-implement-kycaid-kyc-user-flow)
- **Affected actions:** `USR-VERIFICATION.read-kyc-status`, `USR-VERIFICATION.start-verification`, `USR-VERIFICATION.retry-verification`, `USR-VERIFICATION.return-from-provider`.

### <a id="gap-017-018"></a>GAP-017-018: Account preferences API exists; preferences page is device-local

- **Severity:** medium (not a blocker). **Kind:** missing-integration. **Owner:** frontend+product.
- **Observed:** GET/PUT /stakeholders/me/preferences {theme: system|light|dark, language} and GET /reference-data/languages exist since af5d74e. Page and DR-051 state no API; email-notification preferences genuinely have no API.
- **Desired:** Decide account-level theme sync vs device-only; language persistence only with an i18n plan.
- **Evidence:** `apps/user-portal/src/app/preferences/page.tsx`, `src/BackendProjectTemplate.WebAPI/Features/Stakeholders/Preferences/PreferencesController.cs@1fcad50`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** No copy claims persistence that does not occur.
- **Tests:** BFF + page tests if adopted.
- **Sequencing:** Low/medium.
- **Existing tickets:** [CAF-FE-024 — Decide and integrate account preferences](https://trello.com/c/Zmy4ZP7l/45-caf-fe-024-decide-and-integrate-account-preferences)
- **Affected actions:** `USR-PREFERENCES.change-theme`, `USR-PREFERENCES.read-preferences`, `USR-PREFERENCES.change-language`, `USR-PREFERENCES.change-email-notifications`.

### <a id="gap-017-019"></a>GAP-017-019: Wallet lacks balance read model and customer provider list

- **Severity:** medium (blocks the dependent capability). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** Transactions, top-up lookup and initiate exist; no balance; no customer wallet provider list; initiate amount is decimal and has no idempotency key.
- **Desired:** BE-DS-005 read model; documented amount units; idempotent initiation.
- **Evidence:** `apps/user-portal/src/features/wallet/wallet-model.ts`, `packages/api-client/src/payments/contracts.ts`.
- **Prerequisite:** BE-DS-005.
- **Acceptance criteria:** Balances only from backend; units documented.
- **Tests:** n/a until available.
- **Sequencing:** Optional (wallet).
- **Existing tickets:** [BE-DS-005 — Decide wallet and top-up domain scope for the project template](https://trello.com/c/773lH2Sg/42-be-ds-005-decide-wallet-and-top-up-domain-scope-for-the-project-template)
- **Affected actions:** `USR-DASHBOARD.read-wallet-summary`, `USR-WALLET.read-balance`, `USR-WALLET.read-transactions`, `USR-WALLET.paginate-transactions`, `USR-WALLET.read-top-up-detail`, `USR-WALLET-TOP-UP.select-provider`, `USR-WALLET-TOP-UP.initiate-top-up`.

### <a id="gap-017-020"></a>GAP-017-020: Password reset contract gaps (already tracked)

- **Severity:** medium (not a blocker). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** Unknown email returns 404 (enumerating; BFF folds it); invalid/expired/used OTP is one 400 problem without a stable code; no cooldown/expiry data; Retry-After not forwarded.
- **Desired:** As listed for BE-DS-006.
- **Evidence:** `docs/architecture/09-authentication-and-session-management.md`, `src/BackendProjectTemplate.WebAPI/Features/Authentication/PasswordResets/PasswordResetsController.cs@1fcad50`.
- **Prerequisite:** BE-DS-006.
- **Acceptance criteria:** Remove the BFF 404 folding once the backend is non-enumerating.
- **Tests:** Existing password-reset BFF tests.
- **Sequencing:** Backend-led.
- **Existing tickets:** [BE-DS-006 — Review and harden password-reset API contracts and security](https://trello.com/c/s9tsnAcK/43-be-ds-006-review-and-harden-password-reset-api-contracts-and-security)
- **Affected actions:** `AUTH-FORGOT-PASSWORD.request-reset-code`, `AUTH-RESET-PASSWORD.complete-password-reset`.

### <a id="gap-017-021"></a>GAP-017-021: Auth feedback: no attempt counts or lockout durations

- **Severity:** low (not a blocker). **Kind:** backend-missing. **Owner:** backend/product.
- **Observed:** 423 and 401 carry no counts/durations (DR-016).
- **Desired:** Keep omitted unless backend adds them.
- **Evidence:** `apps/user-portal/src/lib/auth-feedback.ts`.
- **Prerequisite:** None.
- **Acceptance criteria:** UI never invents numbers.
- **Tests:** Existing feedback tests.
- **Sequencing:** Low.
- **Existing tickets:** No card: deliberate safe omission until authoritative backend values exist.
- **Affected actions:** `AUTH-MESSAGES.show-remaining-attempts`, `AUTH-MESSAGES.show-lockout-duration`.

### <a id="gap-017-022"></a>GAP-017-022: BFF routes without callers

- **Severity:** low (not a blocker). **Kind:** drift. **Owner:** frontend.
- **Observed:** User Portal /api/auth/registrations has no browser caller (useSignUp calls the backend directly); Admin Portal /api/auth/session/google has no UI.
- **Desired:** Remove or adopt deliberately (e.g. route signUp through the BFF for consistency).
- **Evidence:** `apps/user-portal/src/app/api/auth/registrations/route.ts`, `apps/admin-portal/src/app/api/auth/session/google/route.ts`.
- **Prerequisite:** None.
- **Acceptance criteria:** Each BFF route has a caller or is removed.
- **Tests:** Route tests updated.
- **Sequencing:** Low.
- **Existing tickets:** [CAF-FE-025 — Remove or adopt unused authentication BFF routes](https://trello.com/c/Hnl91kV3/46-caf-fe-025-remove-or-adopt-unused-authentication-bff-routes)
- **Affected actions:** `ADM-SIGN-IN.sign-in-with-google`, `AUTH-REGISTER.submit-registration`.

### <a id="gap-017-023"></a>GAP-017-023: Screen inventory backend/implementation fields and ticket numbering are stale

- **Severity:** low (not a blocker). **Kind:** docs. **Owner:** lead (shared docs).
- **Observed:** Admin screens marked backend 'Missing' though endpoints exist; compositions marked 'Missing' though implemented; USR-VERIFICATION/USR-PREFERENCES backend support stale; MKT-HOME lists a plan operation it no longer calls; roadmapTicket uses roadmap numbering (FE-UI-017 = Security) that collides with Trello numbering (FE-UI-017 = this mapping).
- **Desired:** Apply the patch proposal in api-contract-matrix.md.
- **Evidence:** `docs/design-system/screen-inventory.json`.
- **Prerequisite:** Reconcile with FE-UI-016 inventory edits.
- **Acceptance criteria:** Inventory backend fields agree with this matrix.
- **Tests:** JSON validation.
- **Sequencing:** Lead, after FE-UI-016 merges.
- **Existing tickets:** This PR (inventory/OKF/docs reconciliation after PR #56).
- **Affected actions:** none (cross-cutting).

### <a id="gap-017-024"></a>GAP-017-024: Email notifications: link existing catalog; no new deltas

- **Severity:** low (not a blocker). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** Backend NotificationType has 11 values; 22 design templates; 11 have no enum value; portal base URLs absent from Notifications:Email. Catalog already inspected at the same backend commit (1fcad50).
- **Desired:** BE-DS-008 work packages BE-NOTIF-01…08.
- **Evidence:** `docs/design-system/email-template-catalog.json`, `docs/design-system/email-notification-handoff.md`.
- **Prerequisite:** BE-DS-008.
- **Acceptance criteria:** No Next.js email transport.
- **Tests:** n/a
- **Sequencing:** Backend-led.
- **Existing tickets:** [BE-DS-008 — Review transactional email catalog and notification infrastructure gaps](https://trello.com/c/RTpBnO3B/45-be-ds-008-review-transactional-email-catalog-and-notification-infrastructure-gaps)
- **Affected actions:** `ADM-INVOICE-DETAIL.resend-invoice`, `USR-PREFERENCES.change-email-notifications`.

### <a id="gap-017-025"></a>GAP-017-025: Customer billing limitations (already documented)

- **Severity:** low (not a blocker). **Kind:** backend-missing. **Owner:** backend.
- **Observed:** No history filters/export, no purchaseId on history rows, no upgrade/downgrade/proration/refund/resume/immediate cancel for customers; Bachs return URLs carry no purchase id.
- **Desired:** As listed in docs/architecture/11-subscriptions-and-billing.md.
- **Evidence:** `docs/architecture/11-subscriptions-and-billing.md`.
- **Prerequisite:** Backend.
- **Acceptance criteria:** UI keeps these actions absent.
- **Tests:** Existing billing tests.
- **Sequencing:** Backend-led.
- **Existing tickets:** [CAF-FE-007 — Implement subscription and billing user experience](https://trello.com/c/SnrHMj1K/8-caf-fe-007-implement-subscription-and-billing-user-experience)
- **Affected actions:** `USR-BILLING.cancel-at-period-end`, `USR-BILLING-HISTORY.filter-billing-history`, `USR-BILLING-HISTORY.export-billing-history`, `USR-BILLING-HISTORY.open-row-detail`.

### <a id="gap-017-027"></a>GAP-017-027: Password-reset request BFF body reveals whether the email exists

- **Severity:** medium (not a blocker). **Kind:** security. **Owner:** frontend (BFF).
- **Observed:** On a known email the BFF passes through the backend 202 body {message: 'If the account is eligible, a password reset OTP will be sent shortly.'} (PasswordResetsController.cs:49); on an unknown email it converts the backend 404 into 202 with its own fixed PASSWORD_RESET_ACCEPTED_MESSAGE 'If the account is eligible, a password reset code will be sent shortly.' (password-reset-bff.ts:20-21). Status codes match and on-screen copy is identical, but the HTTP bodies differ ('OTP' vs 'code'), so the response still enumerates accounts to anyone reading the network response. Raised as an open item by FE-UI-016.
- **Desired:** The request BFF always returns the fixed accepted message (never the backend body) for both outcomes; the completion BFF likewise returns fixed bodies.
- **Evidence:** `apps/user-portal/src/app/api/auth/password-resets/route.ts`, `apps/user-portal/src/lib/password-reset-bff.ts:20-21`, `src/BackendProjectTemplate.WebAPI/Features/Authentication/PasswordResets/PasswordResetsController.cs:49@1fcad50`.
- **Prerequisite:** None (independent of BE-DS-006, which removes the backend 404).
- **Acceptance criteria:** Known and unknown emails produce byte-identical 202 response bodies and the same headers from the BFF.
- **Tests:** BFF route test asserting identical bodies for backend 202 and backend 404.
- **Sequencing:** Small frontend fix; can ship before BE-DS-006.
- **Existing tickets:** [CAF-FE-026 — Make password-reset accepted responses non-enumerating](https://trello.com/c/F9dWgYAW/47-caf-fe-026-make-password-reset-accepted-responses-non-enumerating); [BE-DS-006 — Review and harden password-reset API contracts and security](https://trello.com/c/s9tsnAcK/43-be-ds-006-review-and-harden-password-reset-api-contracts-and-security)
- **Affected actions:** `AUTH-FORGOT-PASSWORD.request-reset-code`.

### <a id="gap-017-026"></a>GAP-017-026: Public contact form has no backend

- **Severity:** low (not a blocker). **Kind:** product. **Owner:** product.
- **Observed:** mailto only (DR-033).
- **Desired:** Keep mailto or add a backend contact endpoint with abuse controls.
- **Evidence:** `apps/public-portal/src/components/contact-form.tsx`.
- **Prerequisite:** Product decision.
- **Acceptance criteria:** Never claim a message was sent.
- **Tests:** n/a
- **Sequencing:** Low.
- **Existing tickets:** [CAF-FE-027 — Decide public contact form behavior](https://trello.com/c/NlDpmC2a/48-caf-fe-027-decide-public-contact-form-behavior)
- **Affected actions:** `MKT-CONTACT.submit-contact`.
