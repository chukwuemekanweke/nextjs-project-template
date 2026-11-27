# Email notification handoff

Trello FE-UI-019. Implementation handoff for the 22 transactional email designs
at design revision `ad9386e`. The inventory and per-template content contracts
are in [`email-template-catalog.md`](./email-template-catalog.md) and
[`email-template-catalog.json`](./email-template-catalog.json). This document
covers ownership, the verified backend architecture, gaps, security,
email-client compatibility, the password-reset OTP rules, preview policy and the
follow-up backend tickets.

Evidence levels used below: **verified** = read in backend or design source
(paths given), **proposed** = recommendation for the follow-up tickets,
**unverified** = not established from source; needs confirmation. Backend source
was read at `dotnet-core-project-template` `origin/main` `1fcad50` (identical
tree to the local checkout `c0e439d`). No backend code was changed, no email was
sent and no email client rendering was performed for this ticket.

## 1. Ownership

The backend owns transactional email end to end: event triggering, notification
creation, content resolution, template storage and rendering, provider
credentials, delivery, retries and the delivery audit trail. The Next.js
applications own none of these. They:

- never render, send or preview production email, and never hold
  email-provider credentials;
- own only the screens a CTA lands on (for example `/security`, `/billing`,
  `/confirm-email`, the FE-UI-020 password-reset route) and keep those routes
  stable;
- treat this catalog as documentation. There is no frontend package for
  notification contracts, and none should be added: the backend
  `NotificationType` enum and producer payloads are authoritative.

## 2. Verified backend architecture

| Concern                       | Verified implementation                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification types            | `src/BackendProjectTemplate.Contracts/Commands/Notifications/NotificationType.cs`: 11 members, values 1–11 (persisted as integers in the template registry and log).                                                                                                                                                                                                       |
| Notification creation         | Producers (consumer handlers) build `SendNotificationCommand(tenantId, countryId, type, NotificationMedium.Email, EmailNotificationContent(To, Dictionary<string,string>, Cc, Bcc))` with `Language` and `StakeholderId`. Only five types have producers (see the catalog).                                                                                                |
| Dispatch                      | `ICommandSender` (`Infrastructure/Messaging/CommandSender.cs`) writes to the outbox (`OutboxWriter`), supporting scheduled delivery; `RabbitMqOutboxMessageDispatcher` publishes to RabbitMQ.                                                                                                                                                                              |
| Consumption                   | `Consumer/Notifications/SendNotificationHandler.cs` (inbox de-duplication via `BaseMessageHandler` and `MessageInbox`) calls `IEmailNotificationService`. Non-email media throw.                                                                                                                                                                                           |
| Template lookup               | `Infrastructure/Notifications/EmailNotificationDispatcher.cs`: registry row `notifications.EmailNotificationTemplates` by type + language (subject + file name), seeded by `DatabaseMigrator/Scripts/PostDeploy/0001.template-seeder.postdeploy.sql`; HTML files under `Consumer/EmailTemplates/TemplateSets/{brandKey}/{language}/`, falling back to the `default` brand. |
| Rendering and personalization | `{{:Key:}}` placeholder replacement in the subject, the notification body file and `BaseTemplate.html` (`{{:Subject:}}`, `{{:BodyHtml:}}`). A missing key or malformed token throws `NotificationConfigurationException`.                                                                                                                                                  |
| Branding                      | Tenant `BrandKey` selects the template set (`Notifications:Email:DefaultBrandKey` = `default`). Only `default/en` and `default/fr` exist.                                                                                                                                                                                                                                  |
| Provider                      | Active `Provider` of type Email + `IEmailTransportProvider` by provider key; only `MailtrapEmailTransportProvider` is registered. HTML body only (`EmailDeliveryMessage.HtmlBody`).                                                                                                                                                                                        |
| Retries                       | Transient failures rethrow to the RabbitMQ consumer (`MaxRetryCount = 10` in `Consumer/ServiceCollectionExtensions.cs`). `NotificationConfigurationException` becomes `CannotProcessMessageNonTransientException` (no retry).                                                                                                                                              |
| Idempotency                   | `EmailNotificationLog` keyed by command `MessageId`; an already-sent log skips sending.                                                                                                                                                                                                                                                                                    |
| Delivery audit                | `Domain/Notifications/Entities/EmailNotificationLog.cs` (enqueued, sent, delivered, bounced/rejected, failure reasons, provider message id); Mailtrap webhooks → `EmailDeliveryWebhookReceived` → `EmailDeliveryWebhookReceivedHandler` update delivery status.                                                                                                            |
| Sensitive data                | `NotificationContentObfuscator` masks content keys containing `password`, `passwd`, `pwd`, `otp`, `token`, `secret`, `passcode`, `pin` before the log row is written. Telemetry `EmailNotificationSent` records provider key, provider message id and type only.                                                                                                           |

Target flow, matching the existing shape: domain event or application operation
→ producer handler builds `SendNotificationCommand` (outbox) → consumer
`SendNotificationHandler` → content resolution (shared branding + typed
payload) → template rendering (design layout) → `IEmailTransportProvider` →
retry on transient failure → `EmailNotificationLog` + delivery webhooks. The
proposals below extend this pipeline; none introduce a second one.

## 3. Proposed differences from today

- **Typed payload per type (proposed).** Keep `Dictionary<string,string>` on the
  wire but have each producer build it from one typed record per notification
  type, formatted by shared backend formatters (dates, money, masked IP), so key
  names and formats cannot drift between producers.
- **Shared branding resolved centrally (proposed).** `ProductName`,
  `SupportEmail`, `OrganizationName`, postal address, privacy and preferences
  links come from tenant brand configuration in the dispatcher, not from each
  producer (today `EmailConfirmationOtpSender` hard-codes `Product` =
  `BackendProjectTemplate`).
- **Design layout as the base template (proposed).** Replace
  `BaseTemplate.html` with the design's table layout, header mark, card and
  footer, so per-type files contain only the card body.
- **Template versioning (proposed).** Today the template version is whatever
  files ship with the consumer build and whichever registry row exists. Record a
  template version (for example a content hash) on `EmailNotificationLog` so a
  delivered email can be traced to the exact template.
- **Localization readiness (verified + proposed).** Language is already a
  dimension (`en`, `fr`). New types must ship both, or the dispatcher must fall
  back to `en` instead of failing (today a missing language row fails
  non-transiently).

## 4. Gaps between the design and the backend today

Verified unless marked.

1. **Unescaped values (security).** `RenderTemplate` inserts dictionary values
   into the HTML body verbatim; only the subject is HTML-encoded in the base
   template. User-controlled values such as `FirstName` and the request
   `UserAgent` can inject markup into security emails
   ([DR-140](./discrepancy-register.md#dr-140)).
2. **`SubscriptionRenewalReminder` is not registered.** The producer and both
   template files exist, but the seed script has no row for type 11, so every
   reminder fails with "No 'en' email template is configured" and is not
   retried ([DR-139](./discrepancy-register.md#dr-139)). Deployed databases were
   not inspected (unverified there).
3. **Six enum members have templates but no producer:** `AccountCreated`,
   `EmailConfirmationFollowUp`, `PasswordResetSuccessful`, `TrialExpired`,
   `SubscriptionCancelled`, `SubscriptionInvoice`
   ([DR-138](./discrepancy-register.md#dr-138)).
4. **Eleven designs have no enum member.** Their trigger status is in the
   catalog; KYC rejection, upcoming renewal and all invoice designs also lack
   the triggering event or domain.
5. **Current templates do not match the design.** They are short plain HTML in a
   generic base with an external `i.imgur.com` logo, an `Unsubscribe` link with
   an empty `href` and a placeholder postal address. `ConfirmEmail.html` renders
   a "Confirm your email" button with an empty `VerifyUrl`.
6. **Payload gaps.** Security emails send a raw IP and raw user-agent string;
   the design shows device, approximate location, method and a masked IP
   (`SecurityActivity` already stores parsed device and IP location).
   `SubscriptionRenewalReminder` sends the internal subscription GUID and an
   ISO 8601 `PeriodEnd`; the design shows plan, amount, reference and a date.
7. **Relative time in emails.** `DateTimeFormatter.FormatHumanReadableUtc`
   appends a relative phrase computed at send time, which is wrong by the time
   the email is read.
8. **No plain-text part and no attachments.** `EmailDeliveryMessage` carries
   HTML only; receipts/invoices designs mention attached PDFs.
9. **OTP persisted in transit stores (unverified retention).** The OTP travels
   in the `SendNotificationCommand` content through the outbox and RabbitMQ in
   plain text; only the notification log is masked. Outbox retention was not
   verified.

## 5. Rendering, personalization and security requirements

For the owning backend implementation (proposed requirements):

- **Escaping:** HTML-encode every text value; attribute-encode URLs; never
  accept HTML from payloads. Subjects are plain text (strip CR/LF).
- **URLs:** build every CTA from configured portal base URLs plus a fixed path
  allowlist; https only; never from request headers or user input. No OTPs,
  tokens, session ids, emails or other personal data in query strings. Footer
  links (privacy, preferences) come from brand configuration and are omitted
  when not configured.
- **Missing data:** required variables keep today's fail-fast behaviour (throw,
  record on the log, alert); optional variables follow the catalog's
  "missing data" column (omit the row/sentence/action). Never render empty
  `href`s or "undefined".
- **Dates and money:** absolute dates in UTC (or the recipient's zone, once
  stored), localized by `Language`; money formatted from decimal + ISO currency
  by one backend formatter; one currency convention per tenant (the design
  mixes `NGN 15,000.00` and `₦15,000.00`).
- **Sensitive data:** OTPs appear only in the body (not the subject, not a
  URL); keep the content obfuscator in step with new key names; no raw IPs,
  full user agents, document data or provider payloads in emails or logs;
  telemetry carries ids and types, never content.
- **Logs and observability:** keep `EmailNotificationLog` masked; add template
  version and failure category; alert on non-transient configuration failures
  (missing template/registry row), which today only mark the log as failed.
- **Retries:** transient provider errors retry (existing); configuration
  errors do not. Producers must be idempotent per business event (the renewal
  reminder already uses `MarkReminderSent`).
- **Transactional vs marketing:** all 22 designs are transactional or security
  notices. Decided ([OD-20](./discrepancy-register.md#open-decisions),
  2026-11-27):
  - **Billing emails may be opted out of:** catalog categories `subscriptions`,
    `invoices`, `payments` and `wallet` (11 templates). These carry the
    "Email preferences" footer link once a preferences surface exists
    (BE-NOTIF-08).
  - **Security emails can never be opted out of:** categories `security` and
    `authentication` (OTPs, reset, sign-in, lock, security change, admin
    role). They carry no "Email preferences" or "Unsubscribe" link.
  - **Account and KYC emails can never be opted out of:** categories `account`
    and `kyc`. They carry no "Email preferences" or "Unsubscribe" link.
  - Until BE-NOTIF-08 lands, omit the preferences link everywhere
    ([DR-051](./discrepancy-register.md#dr-051)); the current base template's
    empty "Unsubscribe" link must go.

## 6. Password-reset OTP (correction and FE-UI-020 contract)

The design `ResetPassword` email (`6-emails/EmailResetPassword*`,
`email-pages/live/ResetPassword.html`) is already OTP-based: heading "Reset your
password", the code in a monospace block, an expiry sentence and "Didn't ask
for this? Ignore this email. Your password won't change unless someone enters
this code." It has **no CTA**. Keep it that way: no "Reset password" link
button, and never place the code in a URL.

Verified backend facts:

| Fact                    | Value                                                                                                                                                                                   | Evidence                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification type       | `ResetPasswordOtp` = 3, template `ResetPassword.html`, en + fr registered                                                                                                               | `NotificationType.cs`; `0001.template-seeder.postdeploy.sql`                                                                                 |
| Trigger                 | Request handler sends `ResetPasswordCommand` only when the email belongs to a user; the consumer generates the code and sends the email                                                 | `Application/Authentication/Features/RequestPasswordReset/RequestPasswordResetHandler.cs`; `Consumer/Authentication/ResetPasswordHandler.cs` |
| Code                    | 6 characters, numeric (`characterLength: 6, isAlphaNumeric: false`), cryptographic RNG                                                                                                  | `ResetPasswordHandler.cs`; `Infrastructure/Authentication/TwoFactorOtpService.cs`                                                            |
| Expiry                  | 2 minutes from issue (`OtpIntent.PasswordReset => TimeSpan.FromMinutes(2)`); cache entry expires with it. Decided: change to 3 minutes (OD-19, BE-NOTIF-02)                             | `TwoFactorOtpService.ResolveLifetime`                                                                                                        |
| Re-request while active | No new code and no email while an unexpired reset code exists                                                                                                                           | `ResetPasswordHandler` (`OtpExistsAsync` early return)                                                                                       |
| Attempts                | 5 failed validations remove the code; a correct code is single-use (removed on success)                                                                                                 | `TwoFactorOtpService.ValidateOtpAsync`, `ResolveMaxFailedAttempts`                                                                           |
| Validation input        | `Trim().ToUpperInvariant()`; inner spaces are **not** removed                                                                                                                           | `ValidateOtpAsync`                                                                                                                           |
| Completion              | Unknown user, invalid/expired/exhausted code and password-policy failure return distinct statuses; on success the password is reset and **all** sessions are revoked (`RevokeAllAsync`) | `Application/Authentication/Features/CompletePasswordReset/CompletePasswordResetHandler.cs`                                                  |
| Success notification    | **Not sent.** `PasswordResetSuccessful` (4) has templates but no producer                                                                                                               | Same handler; no `NotificationType.PasswordResetSuccessful` reference in source                                                              |
| Payload today           | `FirstName`, `LastName`, `OtpCode`, `OtpExpiresAtUtc` (formatted `dddd, MMMM d, yyyy 'at' h:mm tt 'UTC'` + relative phrase)                                                             | `ResetPasswordHandler.cs`; `Domain/Common/Formatting/DateTimeFormatter.cs`                                                                   |
| Logging                 | `OtpCode` is masked in `EmailNotificationLog` (key contains `otp`); telemetry event `PasswordResetOtpSent` carries no code                                                              | `NotificationContentObfuscator.cs`; `ResetPasswordHandler.cs`                                                                                |

Template contract (`ResetPasswordOtp`): `OtpCode` (required, secret, 6 digits,
displayed grouped `629 044`), `OtpExpiresAtUtc` (required, absolute time only,
no relative phrase), `FirstName` (optional; greeting without a name when
absent). Drop `LastName` from the payload. Subject stays code-free ("Your
Template password reset code"). The sample time `11:30 UTC` in the design is
illustrative; the only verified lifetime is 2 minutes, and the decided target
is 3 minutes (OD-19). The email must render the backend's `OtpExpiresAtUtc`,
never a hardcoded duration.

`PasswordResetSuccessful` stays a separate notification, sent only after
`CompletePasswordResetHandler` succeeds (proposed in BE-NOTIF-02). Its design
copy "you were signed out of all other devices" matches reset behaviour
(`RevokeAllAsync`). An in-session password change sends
`SecuritySettingChanged` instead (OD-18): `ChangePasswordHandler` already
publishes `UserSecurityActivityOccurred` (`password_changed`), and reset
completion publishes no security activity, so the two never double-send.

Notes for FE-UI-020 (documentation only; this ticket changes no frontend auth
code):

- Strip whitespace inside the entered code before submitting; the email shows
  it grouped and the backend does not remove inner spaces.
- While a code is active (2 minutes today, 3 once BE-NOTIF-02 lands), "resend"
  sends nothing; the UI must not promise a new email in that case, and expiry
  copy must not state a duration the backend does not return.
- After 5 wrong codes the code is gone; the user must request a new one.
- Never log or persist the entered code; use synthetic codes in fixtures.

## 7. Email client compatibility

Reviewed by **source inspection** of `email-pages/live/*.html`. No client
rendering (Litmus/Email on Acid or real inboxes) was performed; actual
compatibility is **unverified** and belongs to the owning backend
implementation (BE-NOTIF-01) and FE-UI-016 visual QA of the design source only.

| Check           | Finding in `live/` (source inspection)                                                                             | Requirement for production                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Layout          | Nested `role="presentation"` tables, 600px max-width card, inline styles, `bgcolor` fallbacks                      | Keep; verify Outlook desktop (Word engine) honours `max-width` (needs a fixed-width MSO wrapper)                   |
| Responsive      | One `@media (max-width:480px)` block reducing padding, heading and code size                                       | Gmail apps without media-query support must still read well at 600px scaled                                        |
| Dark mode       | `color-scheme` meta, `@media (prefers-color-scheme: dark)` and `[data-ogsc]` overrides                             | Test Apple Mail, iOS, Outlook.com and Gmail forced inversion; check OTP and pill contrast after inversion          |
| Fonts           | Google Fonts `<link>` (Outfit, JetBrains Mono) with Helvetica/Arial and Menlo/Consolas fallbacks                   | Many clients ignore web fonts; fallbacks must be acceptable; consider dropping the remote font request             |
| Logo / images   | No images: text "T" mark in a coloured cell                                                                        | Survives image blocking; if a real logo image is added, give it `alt`, width/height and keep a text fallback       |
| Buttons         | `<a>` with padding inside a coloured `td`, `border-radius`                                                         | No VML/MSO fallback: Outlook desktop shows square corners and a reduced hit area; add a bulletproof button pattern |
| OTP readability | Monospace 34px (28px mobile), letter-spacing, grouped `3+3`                                                        | Plain-text part must show the code; ensure copy/paste yields digits only or the frontend strips spaces             |
| Long text       | No explicit `word-break` for long names, references or emails                                                      | Add wrapping for user-supplied values                                                                              |
| Contrast        | Light/dark token pairs from the design system                                                                      | Re-check after client dark-mode transforms                                                                         |
| Accessibility   | `lang="en"`, `<h1>`, presentation tables, descriptive link text ("Review active sessions"); hidden preheader `div` | Set `lang` per `Language`; keep link text meaningful; title = subject                                              |
| Plain text      | None in the design; none in the backend (`HtmlBody` only)                                                          | Generate a plain-text alternative for every type                                                                   |
| Footer          | Sample `[Organization name]`, `support@example.com`, "Email preferences" and "Privacy" links (`href="#"`)          | Brand configuration; preferences link only on billing emails once BE-NOTIF-08 exists; never on security mail       |

## 8. Preview policy

No new preview tooling. The design repository's `email-pages/index.html`
gallery (live HTML plus four locked views per template) is the preview for
design and QA. A backend-side preview, if ever needed, belongs to the backend
(synthetic fixtures, no sending, no production data). The frontend adds no
preview route, Storybook story or fixture for emails.

## 9. Follow-up backend tickets (proposed, not created)

No backend GitHub issues exist (checked with `gh issue list`); Trello was not
accessible from this environment, so duplicates there were not checked. Group
boundaries follow backend ownership: the notifications module first, then each
producing module.

### BE-NOTIF-01 — Notification rendering hardening and design layout

- **Objective:** make the existing pipeline safe and design-aligned before
  adding types.
- **Context:** `EmailNotificationDispatcher`, `BaseTemplate.html`,
  `0001.template-seeder.postdeploy.sql`, `DateTimeFormatter`.
- **Types:** all; fixes `SubscriptionRenewalReminder` registration.
- **Scope:** HTML/attribute escaping of values; design base layout (header,
  card, footer, dark-mode rules, bulletproof button, plain-text part); branding
  variables from tenant configuration; remove imgur logo and empty
  "Unsubscribe"; seed type 11 (en, fr); absolute-only date formatting; money
  formatter; template version on the log; language fallback policy; alert on
  non-transient failures.
- **Security:** escaping, URL allowlist, obfuscator coverage for new keys.
- **Acceptance:** a value containing `<script>` renders as text; type 11 sends
  in en and fr; every template renders with the shared layout and a plain-text
  part; log rows carry the template version.
- **Testing:** dispatcher unit tests (escaping, missing key, malformed token,
  fallback), integration test per registered type with synthetic data, client
  rendering check (Outlook desktop, Gmail web/app, Apple Mail, Outlook.com).
- **Dependencies:** none.

### BE-NOTIF-02 — Authentication and security notifications

- **Objective:** complete and align account, authentication and security email.
- **Context:** `Consumer/Authentication/*`, `CompletePasswordResetHandler`,
  `ChangePasswordHandler`, `UserSecurityActivityOccurredHandler`,
  `SecurityActivity`.
- **Types:** `AccountCreated`, `EmailConfirmationOtp`,
  `EmailConfirmationFollowUp`, `ResetPasswordOtp`, `PasswordResetSuccessful`,
  `SignInSuccessful`, `AccountLocked`, new `SecuritySettingChanged` (12,
  proposed value; append, never renumber).
- **Triggers:** `UserEmailConfirmed` → `AccountCreated` (decided; produce it
  from the existing `UserEmailConfirmedHandler` consumer); scheduled follow-up
  while unconfirmed; successful reset completion → `PasswordResetSuccessful`;
  `UserSecurityActivityOccurred` → `SecuritySettingChanged`, including
  in-session `password_changed` (OD-18).
- **Reset-code lifetime:** change `OtpIntent.PasswordReset` in
  `TwoFactorOtpService.ResolveLifetime` from 2 to 3 minutes (OD-19), with its
  unit test.
- **Payloads:** per the catalog: drop `LastName` and `VerifyUrl`; masked IP,
  device, location, method and time for security emails; absolute expiry; CTA
  URLs from configuration.
- **Security:** no OTP in subject or URL; `ConfirmEmail` subject made code-free
  ("Your Template confirmation code", approved, DR-142); no recovery codes or
  secrets.
- **Acceptance:** each trigger produces exactly one email per event; reset
  success email only after completion; design copy and variables match the
  catalog.
- **Testing:** consumer integration tests per trigger (existing
  `WhenHandling*` pattern), idempotency on redelivery.
- **Dependencies:** BE-NOTIF-01 (OD-18 and OD-19 are decided).

### BE-NOTIF-03 — Subscription lifecycle notifications

- **Types:** `SubscriptionActivated`, `SubscriptionAllocated`,
  `SubscriptionCancelled`, `TrialExpired`, `UpcomingRenewal` (new types for the
  proposed ones), payload enrichment of `SubscriptionRenewalReminder`.
- **Triggers:** `ActivateSubscriptionHandler`, `AllocateSubscription` /
  `ActivateAllocatedSubscriptionHandler`, the three cancellation features,
  `ExpireSubscriptionHandler` (Trial source), a new scheduled pre-renewal
  command.
- **Payloads:** plan name and interval, period dates, auto-renew state, amounts
  with currency, customer-safe reference (not the subscription GUID).
- **Acceptance / testing:** one email per lifecycle transition; scheduled
  commands cancelled or ignored when the state changes (pattern of
  `SendSubscriptionRenewalReminderHandler` guards).
- **Dependencies:** BE-NOTIF-01; product decisions on renewal lead time and
  trial data retention.

### BE-NOTIF-04 — Payment and wallet notifications

- **Types:** `WalletTopUpSucceeded`, `PaymentFailed` (new).
- **Triggers:** `CreditWalletHandler` after commit; `UnsuccessfulPaymentConcluded`
  for user-initiated payments.
- **Payloads:** amount + currency, merchant reference, provider display name,
  time; new balance only once the wallet read model exists; customer-safe
  failure reason; copy varies by `PaymentStatus` (an uncredited underpayment is
  not "not charged").
- **Dependencies:** BE-NOTIF-01; wallet read model (BE-DS-005) for balance;
  receipts (BE-NOTIF-07) for the receipt link.

### BE-NOTIF-05 — KYC notifications

- **Types:** `KycVerified`, `KycRejected` (new).
- **Triggers:** consume `StakeholderKycVerified`; publish a new
  `StakeholderKycRejected` on the Rejected transition (`KycVerification`).
- **Security:** customer-safe reason mapping only; no document or provider data.
- **Dependencies:** BE-NOTIF-01; retry policy decision.

### BE-NOTIF-06 — Administrator access notification

- **Type:** `AdminRoleChanged` (new).
- **Trigger:** committed role assignment/removal (`AdminUserRoleAdministration`,
  audited by `AdminUserMutationExecutor`); publish an event rather than sending
  from the persistence layer.
- **Payload:** role name, change kind, optional actor display name, permission
  summary, admin portal URL from configuration.
- **Dependencies:** BE-NOTIF-01; OD-14 (admin MFA wording).

### BE-NOTIF-07 — Invoice and receipt notifications

- **Types:** `SubscriptionInvoice` (receipt design), `InvoiceIssued`,
  `InvoiceOverdue`.
- **Context:** no invoice or receipt entity, numbering, tax or PDF exists in the
  backend; FE-UI-018 owns the invoice/receipt screens and their backend gaps.
- **Scope:** after the invoice/receipt domain lands: receipt email on successful
  subscription payment, invoice-issued and overdue emails, authenticated
  document links (attachments optional, needs transport support).
- **Dependencies:** backend invoice/receipt domain (FE-UI-018 handoff),
  BE-NOTIF-01.

### BE-NOTIF-08 — Billing email preferences

- **Objective:** let recipients opt out of billing emails while security emails
  stay mandatory (OD-20).
- **Context:** no email-preference storage or API exists
  ([DR-051](./discrepancy-register.md#dr-051)); the user portal Preferences
  screen has non-working notification controls (DR-090).
- **Types:** opt-out allowed for categories `subscriptions`, `invoices`,
  `payments`, `wallet`; never for `security`, `authentication`, `account` or
  `kyc`.
- **Scope:** per-user preference storage and owner-scoped read/update API; a
  preference check in the dispatch path before rendering (skipped emails logged
  as suppressed, not failed); `EmailPreferencesUrl` in the footer and a
  one-click `List-Unsubscribe` / `List-Unsubscribe-Post` header on optional
  emails only.
- **Security:** the category-to-optional mapping is server-owned, so a client
  cannot opt out of a security email; unsubscribe links use signed, expiring,
  single-purpose tokens that grant no other access.
- **Acceptance:** an opted-out user receives no billing email of that category
  and still receives every security email; mandatory emails have no
  unsubscribe header or link.
- **Testing:** dispatcher tests for suppressed vs mandatory types; API tests
  for owner scoping; token tamper and expiry tests.
- **Dependencies:** BE-NOTIF-01; a frontend follow-up to wire the user portal
  Preferences notification controls (DR-090).

## 10. FE-UI-016 QA handoff

- Visual QA covers the design source only: compare `6-emails/` and
  `email-pages/screens/` (identical apart from preview background) for the 22
  templates; do not add them to the portal visual suites or count them as
  screens.
- Check the design issues already registered: OTP in the `ConfirmEmail`
  subject (DR-142), sample/claim copy (DR-143), mixed currency notation, footer
  placeholders.
- Client rendering QA belongs to the backend implementation (BE-NOTIF-01) with
  real email clients; no frontend evidence exists.

## 11. FE-UI-017 API and integration gaps

No frontend API change is needed for email. Integration points the frontend
must keep stable because emails link to them:

| Email CTA destination         | Route                        | Status                               |
| ----------------------------- | ---------------------------- | ------------------------------------ |
| Dashboard                     | user portal `/dashboard`     | exists                               |
| Billing / plans               | user portal `/billing`       | exists                               |
| Security / sessions           | user portal `/security`      | exists                               |
| Email confirmation            | user portal `/confirm-email` | exists; needs its session cookie     |
| Password reset entry          | FE-UI-020 route              | in progress (FE-UI-020)              |
| Receipt / invoice views       | FE-UI-018 routes             | in progress (FE-UI-018)              |
| Identity verification, wallet | none                         | no route; omit CTAs until they exist |
| Admin portal                  | admin portal `/`             | exists                               |

The backend needs configured base URLs for the user and admin portals to build
these links (not present in `Notifications:Email` today; proposed in
BE-NOTIF-01). Email-preference management has no API (DR-051).

## 12. Open questions

Registered as [OD-18 … OD-20](./discrepancy-register.md#open-decisions) and in
each template's "open questions" in the catalog. Decided on 2026-11-27:
in-session password change sends `SecuritySettingChanged` (OD-18); the
reset-code lifetime becomes 3 minutes (OD-19); the `ConfirmEmail` subject
becomes code-free (DR-142); billing emails may be opted out of and security
emails never; account and KYC emails stay mandatory (OD-20, BE-NOTIF-08);
`AccountCreated` fires on `UserEmailConfirmed`. Still open: trigger timing for
`SubscriptionAllocated`; whether the receipt email keeps
the `SubscriptionInvoice` name.
