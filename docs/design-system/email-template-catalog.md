# Email template catalog

Trello FE-UI-019. Human-readable view of [`email-template-catalog.json`](./email-template-catalog.json), which is authoritative when the two disagree. Architecture, security, client compatibility, password-reset rules and follow-up backend tickets: [`email-notification-handoff.md`](./email-notification-handoff.md).

This catalog documents designs and proposed content contracts for the backend notification owner. It is not a frontend package or a second notification model: the backend `NotificationType` enum and producer payloads stay authoritative, and proposed names below are marked as proposals.

## Source

| Item                  | Value                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Design repository     | https://github.com/chukwuemekanweke/Project-Template-Design-System                                                                      |
| Design revision       | `ad9386efe354d0d4d6d9b57d5e1cd492a29cb80d` (2026-11-25T21:19:56+01:00)                                                                  |
| Gallery               | `email-pages/index.html` (blob `845691e`)                                                                                               |
| Canonical visuals     | `6-emails/` (tree `8958b95`): 88 files = 22 templates × desktop/mobile × light/dark                                                     |
| Responsive email HTML | `email-pages/live/` (tree `70679e8`): 22 files                                                                                          |
| Locked previews       | `email-pages/screens/` (tree `a84c1c0`): 88 files, identical to `6-emails/` apart from the preview background; never deploy             |
| Backend inspected     | https://github.com/chukwuemekanweke/dotnet-core-project-template at 1fcad50 (origin/main; local checkout c0e439d has an identical tree) |

**22 templates.** Variants and the duplicated `screens/` exports are not extra notification types, and none of these files are screens: they are not in `screen-inventory.json`.

Reference paths per template follow one pattern: live `email-pages/live/<Name>.html`; desktop light/dark `6-emails/Email<Name>.html`, `Email<Name>Dark.html`; mobile light/dark `Email<Name>Mobile.html`, `Email<Name>MobileDark.html`; previews `email-pages/screens/<Name>{,Dark,Mobile,MobileDark}.html`.

## Inventory and backend coverage

"Design type" is the `NotificationType` column of the gallery. "Backend type" is the verified enum member in `src/BackendProjectTemplate.Contracts/Commands/Notifications/NotificationType.cs` (value in brackets); "—" means no enum member exists. Statuses: _Implemented and verified_, _Partially implemented_, _Backend trigger exists but template missing_, _Proposed notification_, _Contract not verified_, _Not supported_.

| #   | Template                                                    | Design type                   | Design status | Backend type                       | Category       | Coverage                                    | Follow-up   |
| --- | ----------------------------------------------------------- | ----------------------------- | ------------- | ---------------------------------- | -------------- | ------------------------------------------- | ----------- |
| 1   | [AccountCreated](#accountcreated)                           | `AccountCreated`              | Existing      | `AccountCreated` (1)               | account        | Partially implemented                       | BE-NOTIF-02 |
| 2   | [ConfirmEmail](#confirmemail)                               | `EmailConfirmationOtp`        | Existing      | `EmailConfirmationOtp` (2)         | authentication | Implemented and verified                    | BE-NOTIF-02 |
| 3   | [EmailConfirmationFollowUp](#emailconfirmationfollowup)     | `EmailConfirmationFollowUp`   | Existing      | `EmailConfirmationFollowUp` (5)    | account        | Partially implemented                       | BE-NOTIF-02 |
| 4   | [ResetPassword](#resetpassword)                             | `ResetPasswordOtp`            | Existing      | `ResetPasswordOtp` (3)             | security       | Implemented and verified                    | BE-NOTIF-02 |
| 5   | [PasswordResetSuccessful](#passwordresetsuccessful)         | `PasswordResetSuccessful`     | Existing      | `PasswordResetSuccessful` (4)      | security       | Partially implemented                       | BE-NOTIF-02 |
| 6   | [SignInSuccessful](#signinsuccessful)                       | `SignInSuccessful`            | Existing      | `SignInSuccessful` (6)             | security       | Implemented and verified                    | BE-NOTIF-02 |
| 7   | [AccountLocked](#accountlocked)                             | `AccountLocked`               | Existing      | `AccountLocked` (7)                | security       | Implemented and verified                    | BE-NOTIF-02 |
| 8   | [TrialExpired](#trialexpired)                               | `TrialExpired`                | Existing      | `TrialExpired` (8)                 | subscriptions  | Partially implemented                       | BE-NOTIF-03 |
| 9   | [CancelledSubscription](#cancelledsubscription)             | `SubscriptionCancelled`       | Existing      | `SubscriptionCancelled` (9)        | subscriptions  | Partially implemented                       | BE-NOTIF-03 |
| 10  | [Invoice](#invoice)                                         | `SubscriptionInvoice`         | Existing      | `SubscriptionInvoice` (10)         | invoices       | Partially implemented                       | BE-NOTIF-07 |
| 11  | [InvoiceIssued](#invoiceissued)                             | `InvoiceIssued`               | Proposed      | —                                  | invoices       | Not supported                               | BE-NOTIF-07 |
| 12  | [InvoiceOverdue](#invoiceoverdue)                           | `InvoiceOverdue`              | Proposed      | —                                  | invoices       | Not supported                               | BE-NOTIF-07 |
| 13  | [SubscriptionRenewalReminder](#subscriptionrenewalreminder) | `SubscriptionRenewalReminder` | Existing      | `SubscriptionRenewalReminder` (11) | payments       | Backend trigger exists but template missing | BE-NOTIF-01 |
| 14  | [SecuritySettingChanged](#securitysettingchanged)           | `SecuritySettingChanged`      | Proposed      | —                                  | security       | Backend trigger exists but template missing | BE-NOTIF-02 |
| 15  | [KycVerified](#kycverified)                                 | `KycVerified`                 | Proposed      | —                                  | kyc            | Backend trigger exists but template missing | BE-NOTIF-05 |
| 16  | [KycRejected](#kycrejected)                                 | `KycRejected`                 | Proposed      | —                                  | kyc            | Proposed notification                       | BE-NOTIF-05 |
| 17  | [WalletTopUpSucceeded](#wallettopupsucceeded)               | `WalletTopUpSucceeded`        | Proposed      | —                                  | wallet         | Backend trigger exists but template missing | BE-NOTIF-04 |
| 18  | [PaymentFailed](#paymentfailed)                             | `PaymentFailed`               | Proposed      | —                                  | payments       | Backend trigger exists but template missing | BE-NOTIF-04 |
| 19  | [SubscriptionActivated](#subscriptionactivated)             | `SubscriptionActivated`       | Proposed      | —                                  | subscriptions  | Backend trigger exists but template missing | BE-NOTIF-03 |
| 20  | [UpcomingRenewal](#upcomingrenewal)                         | `UpcomingRenewal`             | Proposed      | —                                  | subscriptions  | Proposed notification                       | BE-NOTIF-03 |
| 21  | [SubscriptionAllocated](#subscriptionallocated)             | `SubscriptionAllocated`       | Proposed      | —                                  | subscriptions  | Backend trigger exists but template missing | BE-NOTIF-03 |
| 22  | [AdminRoleChanged](#adminrolechanged)                       | `AdminRoleChanged`            | Proposed      | —                                  | security       | Backend trigger exists but template missing | BE-NOTIF-06 |

Coverage totals: Partially implemented 6 · Implemented and verified 4 · Not supported 2 · Backend trigger exists but template missing 8 · Proposed notification 2. The 11 templates the gallery marks "Existing" match the 11 backend enum members exactly; the 11 "Proposed" ones have no enum member.

Design template names and backend type names differ for four templates (`ConfirmEmail` → `EmailConfirmationOtp`, `ResetPassword` → `ResetPasswordOtp`, `CancelledSubscription` → `SubscriptionCancelled`, `Invoice` → `SubscriptionInvoice`); backend template file names follow the design template names (`ResetPassword.html`). Keep both; do not rename either side.

## Template-to-event coverage matrix

| Template                    | Backend trigger (verified)                                                                                                                                                                                                  | Producer                                    | Template file / registration                           | Current payload keys                                                                       | Missing                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| AccountCreated              | None. No code sends NotificationType.AccountCreated.                                                                                                                                                                        | —                                           | `AccountCreated.html`; en, fr registered               | `Product`, `FirstName`, `DashboardUrl`                                                     | producer, design-aligned template                                      |
| ConfirmEmail                | UserCreated event; SendEmailConfirmationOtp command (resend)                                                                                                                                                                | `EmailConfirmationOtpSender.cs`             | `ConfirmEmail.html`; en, fr registered                 | `FirstName`, `LastName`, `OtpCode`, `OtpExpiresAtUtc`, `VerifyUrl`, `Product`              | design-aligned template                                                |
| EmailConfirmationFollowUp   | None. No code sends NotificationType.EmailConfirmationFollowUp.                                                                                                                                                             | —                                           | `EmailConfirmationFollowUp.html`; en, fr registered    | `OtpCode`, `Product`, `VerifyUrl`                                                          | producer, design-aligned template                                      |
| ResetPassword               | POST password-reset request -> RequestPasswordResetHandler sends ResetPasswordCommand (only for an existing user) -> ResetPasswordHandler                                                                                   | `ResetPasswordHandler.cs`                   | `ResetPassword.html`; en, fr registered                | `FirstName`, `LastName`, `OtpCode`, `OtpExpiresAtUtc`                                      | design-aligned template                                                |
| PasswordResetSuccessful     | None. CompletePasswordResetHandler resets the password and revokes all sessions but sends no notification.                                                                                                                  | —                                           | `PasswordResetSuccessful.html`; en, fr registered      | —                                                                                          | producer, design-aligned template                                      |
| SignInSuccessful            | UserSignInSuccessful event (every successful sign-in)                                                                                                                                                                       | `UserSignInSuccessfulHandler.cs`            | `SignInSuccessful.html`; en, fr registered             | `IpAddress`, `UserAgent`                                                                   | design-aligned template                                                |
| AccountLocked               | UserSignInFailed with InvalidCredentials when Identity reports the user locked out (Authentication:Lockout MaxFailedAttempts 5, Duration 12h in Consumer appsettings); all sessions are revoked first.                      | `UserSignInFailedHandler.cs`                | `AccountLocked.html`; en, fr registered                | `LockedUntilUtc`                                                                           | design-aligned template                                                |
| TrialExpired                | None. Trials exist only as SubscriptionAllocationSource.Trial on admin allocations; ExpireSubscriptionHandler sends nothing.                                                                                                | —                                           | `TrialExpired.html`; en, fr registered                 | `Product`, `BillingPortalUrl`                                                              | producer, design-aligned template                                      |
| CancelledSubscription       | None. CancelSubscriptionAtPeriodEnd, CancelSubscriptionImmediately and AdministrativelyCancelSubscriptionAtPeriodEnd send no notification.                                                                                  | —                                           | `CancelledSubscription.html`; en, fr registered        | `Product`, `FeedbackUrl`                                                                   | producer, design-aligned template                                      |
| Invoice                     | None. The backend has no invoice or receipt entity, numbering or PDF generation.                                                                                                                                            | —                                           | `Invoice.html`; en, fr registered                      | `FirstName`, `InvoiceNumber`, `InvoiceDate`, `Currency`, `AmountDue`, `DownloadInvoiceUrl` | producer, design-aligned template                                      |
| InvoiceIssued               | None. No invoice domain.                                                                                                                                                                                                    | —                                           | —                                                      | —                                                                                          | enum member, template, producer, domain model, design-aligned template |
| InvoiceOverdue              | None. No invoice domain or due-date tracking.                                                                                                                                                                               | —                                           | —                                                      | —                                                                                          | enum member, template, producer, domain model, design-aligned template |
| SubscriptionRenewalReminder | RenewSubscriptionHandler schedules reminders at period start + Subscriptions:Renewal:ReminderSchedule (2 and 6 days) while the renewal is unfulfilled and the subscription is still Active.                                 | `SendSubscriptionRenewalReminderHandler.cs` | `SubscriptionRenewalReminder.html`; **not registered** | `SubscriptionId`, `PeriodEnd`                                                              | seed row, design-aligned template                                      |
| SecuritySettingChanged      | UserSecurityActivityOccurred (passkey_added, passkey_removed, two_factor_enabled, two_factor_disabled, two_factor_recovery_codes_regenerated, password_changed); UserSecurityActivityOccurredHandler records activity only. | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| KycVerified                 | StakeholderKycVerified event (KycWebhookReceivedHandler, KycReconciliationService); no consumer handles it.                                                                                                                 | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| KycRejected                 | None. KycVerification transitions to Rejected but no event is published.                                                                                                                                                    | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| WalletTopUpSucceeded        | SuccessfulPaymentConfirmed -> CreditWalletCommand -> CreditWalletHandler; sends nothing.                                                                                                                                    | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| PaymentFailed               | UnsuccessfulPaymentConcluded (failed, expired or uncredited underpayment); handler updates subscription purchases only.                                                                                                     | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| SubscriptionActivated       | SuccessfulPaymentConfirmed -> ActivateSubscriptionCommand -> ActivateSubscriptionHandler; sends nothing.                                                                                                                    | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| UpcomingRenewal             | None. Renewal is scheduled at period end (RenewSubscriptionCommand); there is no pre-renewal notice.                                                                                                                        | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| SubscriptionAllocated       | AllocateSubscription (admin) and ActivateAllocatedSubscriptionHandler; send nothing.                                                                                                                                        | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |
| AdminRoleChanged            | Admin role assignment/removal (Infrastructure/Persistence/AdminUserRoleAdministration.cs; audited as users.roles.assigned / users.roles.removed by AdminUserMutationExecutor); no event or notification.                    | —                                           | —                                                      | —                                                                                          | enum member, template, producer, design-aligned template               |

Every row also needs the design-aligned layout, because the current backend templates are plain single-column HTML inside a generic `BaseTemplate.html` ([handoff §4](./email-notification-handoff.md#4-gaps-between-the-design-and-the-backend-today)).

## Shared content

**Shared branding variables** (resolved once by the backend base layout from tenant brand configuration, never by producers):

| Variable                    | Type   | Required | Source                                                                                                             | Missing data                     |
| --------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `ProductName`               | text   | yes      | Tenant brand configuration (backend key 'Product'; EmailConfirmationOtpSender hard-codes 'BackendProjectTemplate') | Configuration error: do not send |
| `SupportEmail`              | email  | yes      | Tenant brand configuration                                                                                         | Configuration error: do not send |
| `OrganizationName`          | text   | yes      | Tenant brand configuration (footer)                                                                                | Configuration error: do not send |
| `OrganizationPostalAddress` | text   | no       | Tenant brand configuration (footer)                                                                                | Omit the line                    |
| `PrivacyUrl`                | url    | no       | Tenant brand configuration (public portal /privacy)                                                                | Omit the link                    |
| `EmailPreferencesUrl`       | url    | no       | Only if an email-preferences surface exists (none today, DR-051)                                                   | Omit the link                    |
| `CopyrightYear`             | number | yes      | Render time                                                                                                        | n/a                              |

**Recipient:** EmailNotificationContent.To (resolved by the producer from the stakeholder/Identity user; never from request input). Language: SendNotificationCommand.Language from the stakeholder preference ('en', 'fr' templates exist).

**Formats:**

- `dateTimeUtc`: Absolute UTC date and time, e.g. '25 Nov 2026 · 11:30 UTC' (en). Today the backend formats 'dddd, MMMM d, yyyy at h:mm tt UTC (relative)'; drop the relative part because it is computed at send time and is wrong when read later.
- `date`: Absolute date, e.g. '14 Dec 2026' (en); localize by SendNotificationCommand.Language.
- `money`: Formatted by the backend from decimal + ISO 4217 currency with the currency's minor units. The design mixes 'NGN 15,000.00' and '₦15,000.00'; pick one convention.
- `otp`: 6 numeric digits. Display grouped '629 044' for readability; the plain-text part should show the ungrouped code. Grouping is presentation only (see FE-UI-020 note in the handoff).
- `url`: Absolute https URL built by the backend from configured portal base URLs and a fixed path allowlist; HTML-attribute encoded; no secrets or personal data.
- `text`: Plain text, HTML-escaped before insertion.

**Variable columns:** _Status_ — backend-key = key already used by the backend template or producer; proposed = new key for the follow-up ticket. _Sensitive_ — none | personal | financial | secret. Every value is a string in transport (`Dictionary<string,string>`); the type says how the backend must produce it.

## Content contracts

### AccountCreated

- **Design type:** `AccountCreated` (Existing) · **backend:** `AccountCreated` = 1 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Welcome to Template
- **Preheader:** Your account is ready. Here's how to get started.
- **Category / recipient:** account · The new user
- **Trigger:** UserEmailConfirmed (the account becomes usable only after email confirmation). Sending on UserCreated would welcome unconfirmed addresses.
- **Actions:** primary "Go to your dashboard" → User portal /dashboard (sign-in redirects as usual)
- **Design content without a backend source:** Three-step checklist (passkey, identity verification, choose a plan) is product copy; keep only steps the deployment supports (KYC and plans are configurable).
- **Open questions:** Trigger: UserEmailConfirmed (recommended) or UserCreated? Is the checklist static copy or capability-driven?

| Variable       | Type | Req. | Source                                                                                  | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| -------------- | ---- | ---- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`    | text | no   | Stakeholder profile                                                                     | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `DashboardUrl` | url  | yes  | Backend-built from the configured portal base URL + fixed path (user portal /dashboard) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | backend-key |

### ConfirmEmail

- **Design type:** `EmailConfirmationOtp` (Existing) · **backend:** `EmailConfirmationOtp` = 2 · **coverage:** Implemented and verified · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Your Template confirmation code: 481 902
- **Preheader:** Enter this code to confirm your email address.
- **Category / recipient:** authentication · The registering user (unconfirmed address)
- **Trigger:** Unchanged: UserCreated and the resend command.
- **Actions:** none (code only)
- **Security:** One-time code. Never in a URL, log, telemetry or analytics event; the notification log already masks keys containing 'otp'.
- **Time-sensitive:** Expiry: 5 minutes unless the registration session's remaining lifetime is shorter (AuthenticationOtpDefaults.EmailConfirmationLifetime).
- **Design content without a backend source:** Subject contains the code. Decided by Product: use a code-free subject ('Your Template confirmation code') so the code does not appear in lock-screen previews or mailbox search (DR-142). Backend template still renders a 'Confirm your email' button with an empty VerifyUrl; the design has no CTA. Remove the button and the VerifyUrl key.

| Variable          | Type     | Req. | Source                                          | Format            | Sensitive | Missing data | Status      |
| ----------------- | -------- | ---- | ----------------------------------------------- | ----------------- | --------- | ------------ | ----------- |
| `OtpCode`         | otp      | yes  | ITwoFactorOtpService (intent EmailConfirmation) | otp (see formats) | secret    | Do not send  | backend-key |
| `OtpExpiresAtUtc` | dateTime | yes  | TwoFactorOtp.ExpiresAtUtc                       | dateTimeUtc       | none      | Do not send  | backend-key |

### EmailConfirmationFollowUp

- **Design type:** `EmailConfirmationFollowUp` (Existing) · **backend:** `EmailConfirmationFollowUp` = 5 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Reminder: confirm your email for Template
- **Preheader:** You're one step away from finishing your account.
- **Category / recipient:** account · A registered user whose email is still unconfirmed
- **Trigger:** Scheduled reminder after registration while the email is unconfirmed and the registration session is alive (EmailConfirmationSessionLifetime is 1 day). Must issue a fresh OTP through the same service and invalidate the previous one.
- **Actions:** primary "Continue setup" → User portal /confirm-email. The confirmation page needs its email-confirmation session cookie; a cold link must fall back to sign-in, which routes unconfirmed users back to confirmation.
- **Security:** One-time code; never in the CTA URL.
- **Time-sensitive:** Design copy says 'Codes expire after a short time' without a time; add the verified expiry instead.
- **Open questions:** Reminder schedule and maximum count are not defined anywhere. Does a reminder with a new code conflict with the 'active OTP exists' rule in EmailConfirmationOtpSender?

| Variable           | Type     | Req. | Source                                                                                      | Format                                                                                            | Sensitive | Missing data    | Status      |
| ------------------ | -------- | ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | --------------- | ----------- |
| `OtpCode`          | otp      | yes  | ITwoFactorOtpService (intent EmailConfirmation)                                             | otp (see formats)                                                                                 | secret    | Do not send     | backend-key |
| `OtpExpiresAtUtc`  | dateTime | yes  | TwoFactorOtp.ExpiresAtUtc                                                                   | dateTimeUtc                                                                                       | none      | Do not send     | proposed    |
| `ContinueSetupUrl` | url      | no   | Backend-built from the configured portal base URL + fixed path (user portal /confirm-email) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action | proposed    |

### ResetPassword

- **Design type:** `ResetPasswordOtp` (Existing) · **backend:** `ResetPasswordOtp` = 3 · **coverage:** Implemented and verified · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Your Template password reset code
- **Preheader:** Use this code to choose a new password.
- **Category / recipient:** security · The account holder of the submitted email address
- **Trigger:** Unchanged.
- **Actions:** none (code only)
- **Security:** OTP, not a link: no 'Reset password' button and never put the code in a URL. Must say the password changes only if someone enters the code, and to ignore the email otherwise (present in the design). LastName is sent but not rendered by the design; drop it from the payload (data minimisation).
- **Time-sensitive:** Verified expiry today: 2 minutes from issue (TwoFactorOtpService.ResolveLifetime). Decided (OD-19): change the password-reset lifetime to 3 minutes (BE-NOTIF-02). The design's '11:30 UTC' is sample data. While an unexpired reset code exists, a new request sends nothing (ResetPasswordHandler returns early).

| Variable          | Type     | Req. | Source                                                                                         | Format                                                          | Sensitive | Missing data                                                   | Status      |
| ----------------- | -------- | ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`       | text     | no   | Stakeholder profile                                                                            | Plain text, HTML-escaped                                        | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `OtpCode`         | otp      | yes  | ITwoFactorOtpService (intent PasswordReset), 6 numeric digits                                  | otp (see formats)                                               | secret    | Do not send                                                    | backend-key |
| `OtpExpiresAtUtc` | dateTime | yes  | TwoFactorOtp.ExpiresAtUtc (issue time + lifetime: 2 minutes today, 3 minutes decided in OD-19) | dateTimeUtc; drop the relative suffix the backend appends today | none      | Do not send                                                    | backend-key |

### PasswordResetSuccessful

- **Design type:** `PasswordResetSuccessful` (Existing) · **backend:** `PasswordResetSuccessful` = 4 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Your Template password was changed
- **Preheader:** Your password was just changed. If this wasn't you, act now.
- **Category / recipient:** security · The account holder
- **Trigger:** Only after CompletePasswordResetHandler succeeds (password reset and RevokeAllAsync committed). Never on the request step.
- **Actions:** primary "Secure my account" → User portal password-reset entry (FE-UI-020 route) with no token or code; support contact in the footer.
- **Security:** Copy 'you were signed out of all other devices' is accurate for reset: RevokeAllAsync revokes every session. In-session password change sends SecuritySettingChanged instead (OD-18), so this copy is never used for it.
- **Design content without a backend source:** Device and location rows need the request's IP and user agent passed into the completion event; omit rows when absent.

| Variable              | Type     | Req. | Source                                                                                                    | Format                                                                                            | Sensitive | Missing data | Status   |
| --------------------- | -------- | ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ------------ | -------- |
| `ChangedAtUtc`        | dateTime | yes  | Event timestamp                                                                                           | dateTimeUtc                                                                                       | none      | Do not send  | proposed |
| `DeviceDescription`   | text     | no   | Parsed user agent (browser + platform), as already stored on SecurityActivity                             | Plain text, e.g. 'Chrome on macOS'                                                                | personal  | Omit the row | proposed |
| `ApproximateLocation` | text     | no   | IP geolocation already resolved for SecurityActivity (city, country code)                                 | Plain text, e.g. 'Lagos, NG'                                                                      | personal  | Omit the row | proposed |
| `SecureAccountUrl`    | url      | yes  | Backend-built from the configured portal base URL + fixed path (user portal /forgot-password (FE-UI-020)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send  | proposed |

### SignInSuccessful

- **Design type:** `SignInSuccessful` (Existing) · **backend:** `SignInSuccessful` = 6 · **coverage:** Implemented and verified · **follow-up:** BE-NOTIF-02
- **Subject (sample):** New sign-in to your Template account
- **Preheader:** We noticed a new sign-in. Review it if it wasn't you.
- **Category / recipient:** security · The account holder
- **Trigger:** Unchanged, optionally limited to new devices (product decision).
- **Actions:** primary "Review active sessions" → User portal /security (sessions list)
- **Security:** Backend currently sends the raw IP and full user-agent string and inserts them unescaped (DR-140). Replace with masked IP and parsed device text.
- **Open questions:** Send on every sign-in or only for unrecognised devices? IP masking policy (OD-09).

| Variable              | Type     | Req. | Source                                                                                 | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| --------------------- | -------- | ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`           | text     | no   | Stakeholder profile                                                                    | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `SignedInAtUtc`       | dateTime | yes  | Event timestamp                                                                        | dateTimeUtc                                                                                       | none      | Do not send                                                    | proposed    |
| `SignInMethod`        | enum     | no   | Sign-in event (password, passkey, Google)                                              | Display label                                                                                     | none      | Omit the row                                                   | proposed    |
| `DeviceDescription`   | text     | no   | Parsed user agent (browser + platform), as already stored on SecurityActivity          | Plain text, e.g. 'Chrome on macOS'                                                                | personal  | Omit the row                                                   | proposed    |
| `MaskedIpAddress`     | text     | no   | UserSignInSuccessful.IpAddress, masked by the backend                                  | IPv4 last two octets masked ('102.89.x.x'); IPv6 prefix only                                      | personal  | Omit the row                                                   | proposed    |
| `ApproximateLocation` | text     | no   | IP geolocation already resolved for SecurityActivity (city, country code)              | Plain text, e.g. 'Lagos, NG'                                                                      | personal  | Omit the row                                                   | proposed    |
| `ActiveSessionsUrl`   | url      | yes  | Backend-built from the configured portal base URL + fixed path (user portal /security) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### AccountLocked

- **Design type:** `AccountLocked` (Existing) · **backend:** `AccountLocked` = 7 · **coverage:** Implemented and verified · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Your Template account is temporarily locked
- **Preheader:** Too many failed sign-in attempts.
- **Category / recipient:** security · The account holder
- **Trigger:** Unchanged.
- **Actions:** primary "Reset password" → User portal password-reset entry (FE-UI-020 route); no token or code
- **Security:** Do not state the number of attempts or the attacker's IP.
- **Time-sensitive:** Lock end time is absolute; no relative phrase.
- **Design content without a backend source:** Two-factor suggestion is static copy.
- **Open questions:** Does a password reset while locked clear the lockout? Not verified.

| Variable           | Type     | Req. | Source                                                                                                    | Format                                                                                            | Sensitive | Missing data | Status      |
| ------------------ | -------- | ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ------------ | ----------- |
| `LockedUntilUtc`   | dateTime | yes  | Identity lockout end                                                                                      | dateTimeUtc                                                                                       | none      | Do not send  | backend-key |
| `ResetPasswordUrl` | url      | yes  | Backend-built from the configured portal base URL + fixed path (user portal /forgot-password (FE-UI-020)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send  | proposed    |

### TrialExpired

- **Design type:** `TrialExpired` (Existing) · **backend:** `TrialExpired` = 8 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-03
- **Subject (sample):** Your Template free trial has ended
- **Preheader:** Choose a plan to keep going — your data is safe for 30 days.
- **Category / recipient:** subscriptions · The billing-account owner whose trial allocation expired
- **Trigger:** ExpireSubscriptionHandler expiring a subscription whose allocation source is Trial.
- **Actions:** primary "Choose a plan" → User portal /billing
- **Design content without a backend source:** 'We'll keep your account and data for 30 days' has no backend retention policy behind it; remove unless one is defined.
- **Open questions:** Data retention after trial expiry.

| Variable        | Type | Req. | Source                                                                                | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| --------------- | ---- | ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`     | text | no   | Stakeholder profile                                                                   | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `ChoosePlanUrl` | url  | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### CancelledSubscription

- **Design type:** `SubscriptionCancelled` (Existing) · **backend:** `SubscriptionCancelled` = 9 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-03
- **Subject (sample):** Your Template subscription was cancelled
- **Preheader:** You keep access until the end of your billing period.
- **Category / recipient:** subscriptions · The billing-account owner
- **Trigger:** Successful user or administrative cancellation (at period end or immediate).
- **Actions:** primary "Resubscribe" → User portal /billing; secondary "Share feedback" → Configured feedback URL; omit when not configured
- **Time-sensitive:** Access end date.
- **Design content without a backend source:** Immediate cancellation has no 'keep access until' date; the design shows only the at-period-end case.
- **Open questions:** One template with conditional copy, or separate types for immediate vs period-end? Notify on administrative cancellation?

| Variable          | Type | Req. | Source                                                                                    | Format                                                                                            | Sensitive | Missing data                                                                   | Status      |
| ----------------- | ---- | ---- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------ | ----------- |
| `FirstName`       | text | no   | Stakeholder profile                                                                       | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name                 | backend-key |
| `PlanName`        | text | yes  | Subscription plan                                                                         | Plain text                                                                                        | none      | Do not send                                                                    | proposed    |
| `AccessEndsAtUtc` | date | no   | Subscription CurrentPeriodEndUtc (at-period-end cancellation)                             | date                                                                                              | none      | Immediate cancellation: use a variant without the 'keep access until' sentence | proposed    |
| `ResubscribeUrl`  | url  | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing)     | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                                    | proposed    |
| `FeedbackUrl`     | url  | no   | Backend-built from the configured portal base URL + fixed path (configured feedback form) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action                                                                | backend-key |

### Invoice

- **Design type:** `SubscriptionInvoice` (Existing) · **backend:** `SubscriptionInvoice` = 10 · **coverage:** Partially implemented · **follow-up:** BE-NOTIF-07
- **Subject (sample):** Receipt for your Template payment — INV-2026-0142
- **Preheader:** Thanks for your payment. Your receipt and invoice are attached.
- **Category / recipient:** invoices · The billing-account owner
- **Trigger:** Successful subscription payment once invoice and receipt records exist (after ActivateSubscription / renewal fulfilment).
- **Actions:** primary "View receipt" → User portal receipt view (FE-UI-018; route not yet defined); link "Download invoice (PDF)" → Authenticated download; never a public or signed long-lived URL
- **Security:** PDF attachments: the delivery message has no attachment support today (EmailDeliveryMessage has HtmlBody only).
- **Design content without a backend source:** Template is a receipt (payment confirmation) although its type is SubscriptionInvoice; the current backend template says 'Thank you for your order' with AmountDue. Attachments, tax lines and masked card details have no backend source.
- **Open questions:** Rename to a receipt type or keep SubscriptionInvoice for the receipt email? Attachment vs authenticated link.

| Variable                   | Type  | Req. | Source                                                                                                      | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| -------------------------- | ----- | ---- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`                | text  | no   | Stakeholder profile                                                                                         | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `InvoiceNumber`            | text  | yes  | Invoice record (not yet modelled)                                                                           | As issued                                                                                         | financial | Do not send                                                    | backend-key |
| `ReceiptNumber`            | text  | yes  | Receipt record (not yet modelled)                                                                           | As issued                                                                                         | financial | Do not send                                                    | proposed    |
| `PlanName`                 | text  | yes  | Subscription plan                                                                                           | Plain text + billing interval                                                                     | none      | Do not send                                                    | proposed    |
| `BillingPeriodStartUtc`    | date  | yes  | Subscription period                                                                                         | date                                                                                              | none      | Do not send                                                    | proposed    |
| `BillingPeriodEndUtc`      | date  | yes  | Subscription period                                                                                         | date                                                                                              | none      | Do not send                                                    | proposed    |
| `PaidAtUtc`                | date  | yes  | Payment transaction                                                                                         | date                                                                                              | none      | Do not send                                                    | proposed    |
| `PaymentMethodDescription` | text  | no   | Provider + masked instrument if the provider returns one                                                    | e.g. 'card •••• 4242'                                                                             | financial | Show provider only                                             | proposed    |
| `TaxAmount`                | money | no   | Decimal amount + ISO 4217 currency from the owning record                                                   | money (see formats)                                                                               | financial | Omit the row                                                   | proposed    |
| `TaxLabel`                 | text  | no   | Tax configuration (not yet modelled)                                                                        | e.g. 'VAT (7.5%)'                                                                                 | none      | Omit the row                                                   | proposed    |
| `TotalPaid`                | money | yes  | Decimal amount + ISO 4217 currency from the owning record                                                   | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `NextChargeAtUtc`          | date  | no   | Subscription renewal schedule                                                                               | date                                                                                              | none      | Omit the sentence                                              | proposed    |
| `ReceiptUrl`               | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal receipt view (FE-UI-018))       | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |
| `InvoicePdfUrl`            | url   | no   | Backend-built from the configured portal base URL + fixed path (authenticated invoice download (FE-UI-018)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action                                                | proposed    |

### InvoiceIssued

- **Design type:** `InvoiceIssued` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Not supported · **follow-up:** BE-NOTIF-07
- **Subject (sample):** Invoice INV-2026-0142 from Template — due 21 Dec 2026
- **Preheader:** Your invoice is ready. Pay by the due date to keep your plan.
- **Category / recipient:** invoices · The billing-account owner
- **Trigger:** Invoice issued (requires backend invoice issuance).
- **Actions:** primary "Pay invoice" → User portal invoice payment flow (not yet defined); link "View invoice online" → User portal invoice view (FE-UI-018)
- **Time-sensitive:** Due date in subject and body.
- **Design content without a backend source:** 'If auto-renew is on, we'll charge your saved payment method' depends on recurring authorization state.
- **Open questions:** Does the product issue invoices before payment at all, or only receipts?

| Variable                | Type  | Req. | Source                                                                                                   | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ----------------------- | ----- | ---- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`             | text  | no   | Stakeholder profile                                                                                      | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `InvoiceNumber`         | text  | yes  | Invoice record                                                                                           | As issued                                                                                         | financial | Do not send                                                    | proposed    |
| `PlanName`              | text  | yes  | Subscription plan                                                                                        | Plain text + billing interval                                                                     | none      | Do not send                                                    | proposed    |
| `IssuedAtUtc`           | date  | yes  | Invoice record                                                                                           | date                                                                                              | none      | Do not send                                                    | proposed    |
| `BillingPeriodStartUtc` | date  | yes  | Invoice record                                                                                           | date                                                                                              | none      | Do not send                                                    | proposed    |
| `BillingPeriodEndUtc`   | date  | yes  | Invoice record                                                                                           | date                                                                                              | none      | Do not send                                                    | proposed    |
| `DueAtUtc`              | date  | yes  | Invoice record                                                                                           | date                                                                                              | none      | Do not send                                                    | proposed    |
| `AmountDue`             | money | yes  | Decimal amount + ISO 4217 currency from the owning record                                                | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `PayInvoiceUrl`         | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal invoice payment (FE-UI-018)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |
| `InvoiceUrl`            | url   | no   | Backend-built from the configured portal base URL + fixed path (user portal invoice view (FE-UI-018))    | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action                                                | proposed    |

### InvoiceOverdue

- **Design type:** `InvoiceOverdue` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Not supported · **follow-up:** BE-NOTIF-07
- **Subject (sample):** Overdue: invoice INV-2026-0142 from Template
- **Preheader:** Your invoice is past due. Pay now to keep access.
- **Category / recipient:** invoices · The billing-account owner
- **Trigger:** Scheduled check after an invoice's due date while unpaid.
- **Actions:** primary "Pay now" → User portal invoice payment flow (not yet defined)
- **Time-sensitive:** Due date and pause date.
- **Design content without a backend source:** 'Already paid? Reply to this email' assumes a monitored reply-to mailbox.
- **Open questions:** How does this relate to SubscriptionRenewalReminder, which already covers failed renewals?

| Variable            | Type  | Req. | Source                                                                                                   | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ------------------- | ----- | ---- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`         | text  | no   | Stakeholder profile                                                                                      | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `InvoiceNumber`     | text  | yes  | Invoice record                                                                                           | As issued                                                                                         | financial | Do not send                                                    | proposed    |
| `AmountDue`         | money | yes  | Decimal amount + ISO 4217 currency from the owning record                                                | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `DueAtUtc`          | date  | yes  | Invoice record                                                                                           | date                                                                                              | none      | Do not send                                                    | proposed    |
| `PlanName`          | text  | yes  | Subscription plan                                                                                        | Plain text                                                                                        | none      | Do not send                                                    | proposed    |
| `AccessPausedAtUtc` | date  | no   | Grace-period policy                                                                                      | date                                                                                              | none      | Omit the warning block                                         | proposed    |
| `PayInvoiceUrl`     | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal invoice payment (FE-UI-018)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### SubscriptionRenewalReminder

- **Design type:** `SubscriptionRenewalReminder` (Existing) · **backend:** `SubscriptionRenewalReminder` = 11 · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-01
- **Subject (sample):** Action needed: we couldn't renew your Template subscription
- **Preheader:** Update your payment to keep access.
- **Category / recipient:** payments · The billing-account owner
- **Trigger:** Unchanged.
- **Actions:** primary "Pay now" → User portal /billing (renewal payment)
- **Security:** Do not expose the internal SubscriptionId GUID; the current template prints it.
- **Time-sensitive:** Grace period end.
- **Design content without a backend source:** 'We'll retry automatically' is true only when a usable recurring authorization exists.

| Variable           | Type  | Req. | Source                                                                                | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ------------------ | ----- | ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`        | text  | no   | Stakeholder profile                                                                   | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `PlanName`         | text  | yes  | Subscription plan                                                                     | Plain text + billing interval                                                                     | none      | Do not send                                                    | proposed    |
| `AmountDue`        | money | yes  | Decimal amount + ISO 4217 currency from the owning record                             | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `PeriodEndedAtUtc` | date  | yes  | Renewal TargetPeriodStartUtc (sent today as ISO 8601 'PeriodEnd')                     | date                                                                                              | none      | Do not send                                                    | proposed    |
| `Reference`        | text  | no   | Renewal or payment reference safe to show customers (not the subscription GUID)       | Short reference                                                                                   | none      | Omit the row                                                   | proposed    |
| `AccessEndsAtUtc`  | date  | no   | Period start + Subscriptions:Renewal:GracePeriod (7 days)                             | date                                                                                              | none      | Omit the date from the warning                                 | proposed    |
| `PayNowUrl`        | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### SecuritySettingChanged

- **Design type:** `SecuritySettingChanged` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-02
- **Subject (sample):** Security change on your Template account
- **Preheader:** A security setting on your account changed.
- **Category / recipient:** security · The account holder
- **Trigger:** UserSecurityActivityOccurred, one email per activity. Includes in-session password change (ChangePasswordHandler publishes password_changed), decided in OD-18.
- **Actions:** primary "Review security" → User portal /security
- **Security:** Never include recovery codes, authenticator secrets or passkey identifiers.

| Variable              | Type     | Req. | Source                                                                                 | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| --------------------- | -------- | ---- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`           | text     | no   | Stakeholder profile                                                                    | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `ChangeType`          | enum     | yes  | UserSecurityActivityTypes value                                                        | Mapped to a localized heading and sentence per type                                               | none      | Do not send                                                    | proposed    |
| `ChangedAtUtc`        | dateTime | yes  | Event timestamp                                                                        | dateTimeUtc                                                                                       | none      | Do not send                                                    | proposed    |
| `DeviceDescription`   | text     | no   | Parsed user agent (browser + platform), as already stored on SecurityActivity          | Plain text, e.g. 'Chrome on macOS'                                                                | personal  | Omit the row                                                   | proposed    |
| `ApproximateLocation` | text     | no   | IP geolocation already resolved for SecurityActivity (city, country code)              | Plain text, e.g. 'Lagos, NG'                                                                      | personal  | Omit the row                                                   | proposed    |
| `SecuritySettingsUrl` | url      | yes  | Backend-built from the configured portal base URL + fixed path (user portal /security) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### KycVerified

- **Design type:** `KycVerified` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-05
- **Subject (sample):** You're verified on Template
- **Preheader:** Your identity verification was approved.
- **Category / recipient:** kyc · The verified user
- **Trigger:** StakeholderKycVerified.
- **Actions:** primary "Go to dashboard" → User portal /dashboard
- **Security:** No document data, provider references or verification details.
- **Design content without a backend source:** 'Payouts and higher limits are now available' is an unsupported claim (see DR-102).

| Variable       | Type | Req. | Source                                                                                  | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| -------------- | ---- | ---- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`    | text | no   | Stakeholder profile                                                                     | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `DashboardUrl` | url  | yes  | Backend-built from the configured portal base URL + fixed path (user portal /dashboard) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### KycRejected

- **Design type:** `KycRejected` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Proposed notification · **follow-up:** BE-NOTIF-05
- **Subject (sample):** Your Template verification needs another try
- **Preheader:** We couldn't approve your identity verification.
- **Category / recipient:** kyc · The user whose verification was rejected
- **Trigger:** New StakeholderKycRejected event on the Rejected transition.
- **Actions:** primary "Try again" → User portal verification screen; omit when retry is not allowed or the route does not exist
- **Security:** Reasons can reveal document problems; keep generic and customer-safe.
- **Design content without a backend source:** Sample reason and photo guidance are illustrative.
- **Open questions:** Retry policy and reason mapping.

| Variable          | Type    | Req. | Source                                                                                                            | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ----------------- | ------- | ---- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`       | text    | no   | Stakeholder profile                                                                                               | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `RejectionReason` | text    | no   | Customer-safe reason mapped from the provider decision                                                            | Plain text, HTML-escaped; never raw provider output                                               | personal  | Show 'No reason was provided for this decision.'               | proposed    |
| `CanRetry`        | boolean | yes  | KYC retry policy                                                                                                  | Controls the CTA                                                                                  | none      | Treat as false                                                 | proposed    |
| `VerificationUrl` | url     | no   | Backend-built from the configured portal base URL + fixed path (user portal verification screen (not yet routed)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action                                                | proposed    |

### WalletTopUpSucceeded

- **Design type:** `WalletTopUpSucceeded` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-04
- **Subject (sample):** Your Template wallet was topped up
- **Preheader:** Funds were added to your wallet.
- **Category / recipient:** wallet · The wallet owner
- **Trigger:** After CreditWalletHandler commits the credit (idempotent per payment transaction).
- **Actions:** primary "View receipt" → User portal wallet transaction/receipt (FE-UI-018); omit until it exists
- **Design content without a backend source:** New balance requires the wallet read model (BE-DS-005); receipt attachment has no backend support.

| Variable            | Type     | Req. | Source                                                                                                  | Format                                                                                            | Sensitive | Missing data              | Status   |
| ------------------- | -------- | ---- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ------------------------- | -------- |
| `AmountCredited`    | money    | yes  | Decimal amount + ISO 4217 currency from the owning record                                               | money (see formats)                                                                               | financial | Do not send               | proposed |
| `MerchantReference` | text     | yes  | Payment transaction merchant reference                                                                  | As stored                                                                                         | none      | Do not send               | proposed |
| `ProviderName`      | text     | no   | Payment provider display name                                                                           | Plain text                                                                                        | none      | Omit the row              | proposed |
| `CreditedAtUtc`     | dateTime | yes  | Event timestamp                                                                                         | dateTimeUtc                                                                                       | none      | Do not send               | proposed |
| `NewBalance`        | money    | no   | Decimal amount + ISO 4217 currency from the owning record                                               | money (see formats)                                                                               | financial | Omit the row              | proposed |
| `ReceiptNumber`     | text     | no   | Receipt record (not yet modelled)                                                                       | As issued                                                                                         | financial | Omit the receipt sentence | proposed |
| `ReceiptUrl`        | url      | no   | Backend-built from the configured portal base URL + fixed path (user portal wallet receipt (FE-UI-018)) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Omit the action           | proposed |

### PaymentFailed

- **Design type:** `PaymentFailed` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-04
- **Subject (sample):** Your Template payment didn't go through
- **Preheader:** Your payment failed — you have not been charged.
- **Category / recipient:** payments · The payer
- **Trigger:** UnsuccessfulPaymentConcluded for user-initiated payments (wallet top-up, subscription purchase); not for renewals, which use SubscriptionRenewalReminder.
- **Actions:** primary "Try again" → The originating flow (billing checkout or wallet top-up)
- **Security:** 'You have not been charged' is only true for failed/expired states; an uncredited underpayment means money moved. Copy must vary by PaymentStatus.
- **Open questions:** Which PaymentStatus values qualify; underpayment wording.

| Variable            | Type  | Req. | Source                                                                                                 | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ------------------- | ----- | ---- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`         | text  | no   | Stakeholder profile                                                                                    | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `PaymentPurpose`    | enum  | yes  | PaymentIntent                                                                                          | Localized label ('wallet top-up', 'subscription')                                                 | none      | Do not send                                                    | proposed    |
| `Amount`            | money | yes  | Decimal amount + ISO 4217 currency from the owning record                                              | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `FailureReason`     | text  | no   | Customer-safe mapping of PaymentStatus/provider reason                                                 | Plain text                                                                                        | none      | Omit the row                                                   | proposed    |
| `MerchantReference` | text  | yes  | Payment transaction                                                                                    | As stored                                                                                         | none      | Do not send                                                    | proposed    |
| `ProviderName`      | text  | no   | Payment provider display name                                                                          | Plain text                                                                                        | none      | Omit the row                                                   | proposed    |
| `RetryUrl`          | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing or wallet top-up) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### SubscriptionActivated

- **Design type:** `SubscriptionActivated` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-03
- **Subject (sample):** Your Template Premium plan is active
- **Preheader:** Your subscription is now active.
- **Category / recipient:** subscriptions · The billing-account owner
- **Trigger:** After ActivateSubscriptionHandler commits a paid activation.
- **Actions:** primary "Go to billing" → User portal /billing
- **Design content without a backend source:** Subject embeds the plan name ('Premium'); subjects need the same placeholder support as bodies (already supported).
- **Open questions:** Send for renewals too, or only first activation?

| Variable         | Type    | Req. | Source                                                                                | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ---------------- | ------- | ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`      | text    | no   | Stakeholder profile                                                                   | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `PlanName`       | text    | yes  | Subscription plan                                                                     | Plain text + billing interval; also used in the subject                                           | none      | Do not send                                                    | proposed    |
| `PeriodStartUtc` | date    | yes  | Subscription period                                                                   | date                                                                                              | none      | Do not send                                                    | proposed    |
| `PeriodEndUtc`   | date    | yes  | Subscription period                                                                   | date                                                                                              | none      | Do not send                                                    | proposed    |
| `AutoRenew`      | boolean | yes  | Recurring authorization state                                                         | 'On' / 'Off'                                                                                      | none      | Omit the row                                                   | proposed    |
| `BillingUrl`     | url     | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### UpcomingRenewal

- **Design type:** `UpcomingRenewal` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Proposed notification · **follow-up:** BE-NOTIF-03
- **Subject (sample):** Your Template subscription renews on 14 Dec 2026
- **Preheader:** A heads-up before we charge your saved payment method.
- **Category / recipient:** subscriptions · The billing-account owner with auto-renew on
- **Trigger:** Scheduled N days before CurrentPeriodEndUtc when a usable recurring authorization exists and the subscription is not cancelling.
- **Actions:** primary "Manage subscription" → User portal /billing
- **Time-sensitive:** Renewal date.
- **Open questions:** Lead time (days before renewal)? Regulatory need for pre-renewal notices per market?

| Variable                | Type  | Req. | Source                                                                                | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ----------------------- | ----- | ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`             | text  | no   | Stakeholder profile                                                                   | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `RenewsAtUtc`           | date  | yes  | Subscription CurrentPeriodEndUtc                                                      | date; also used in the subject                                                                    | none      | Do not send                                                    | proposed    |
| `RenewalAmount`         | money | yes  | Decimal amount + ISO 4217 currency from the owning record                             | money (see formats)                                                                               | financial | Do not send                                                    | proposed    |
| `PlanName`              | text  | yes  | Subscription plan                                                                     | Plain text + billing interval                                                                     | none      | Do not send                                                    | proposed    |
| `ManageSubscriptionUrl` | url   | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### SubscriptionAllocated

- **Design type:** `SubscriptionAllocated` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-03
- **Subject (sample):** You've been given Template Premium
- **Preheader:** A complimentary plan was added to your account.
- **Category / recipient:** subscriptions · The user receiving the allocation
- **Trigger:** Allocation created (or activated, if it starts later) — decide one.
- **Actions:** primary "See what's included" → User portal /billing
- **Security:** Do not name the administrator who made the allocation unless product approves.
- **Design content without a backend source:** 'Auto-renew Off' row is implied by allocation; omit unless meaningful.
- **Open questions:** Send at allocation or at activation?

| Variable           | Type | Req. | Source                                                                                | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ------------------ | ---- | ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`        | text | no   | Stakeholder profile                                                                   | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `PlanName`         | text | yes  | Allocated plan                                                                        | Plain text; also used in the subject                                                              | none      | Do not send                                                    | proposed    |
| `StartsAtUtc`      | date | yes  | Allocation StartAtUtc                                                                 | date                                                                                              | none      | Do not send                                                    | proposed    |
| `EndsAtUtc`        | date | no   | Allocation end                                                                        | date                                                                                              | none      | Omit the row (open-ended)                                      | proposed    |
| `AllocationSource` | enum | no   | SubscriptionAllocationSource (Trial, complimentary, ...)                              | Selects copy; Trial uses trial wording                                                            | none      | Use neutral copy                                               | proposed    |
| `PlanDetailsUrl`   | url  | yes  | Backend-built from the configured portal base URL + fixed path (user portal /billing) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |

### AdminRoleChanged

- **Design type:** `AdminRoleChanged` (Proposed) · **backend:** none (proposed name, not verified) · **coverage:** Backend trigger exists but template missing · **follow-up:** BE-NOTIF-06
- **Subject (sample):** Your Template admin access changed
- **Preheader:** Your administrative role was updated.
- **Category / recipient:** security · The administrator whose roles changed
- **Trigger:** Committed role assignment or removal (one email per change set).
- **Actions:** primary "Open admin portal" → Admin portal root (sign-in as usual)
- **Security:** Admin portal URL must come from configuration, never from request headers.
- **Design content without a backend source:** 'Sensitive actions will ask for your authenticator code' depends on admin MFA policy (OD-14).
- **Open questions:** Notify on removal as well as assignment?

| Variable            | Type | Req. | Source                                                                          | Format                                                                                            | Sensitive | Missing data                                                   | Status      |
| ------------------- | ---- | ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------- | ----------- |
| `FirstName`         | text | no   | Stakeholder profile                                                             | Plain text, HTML-escaped                                                                          | personal  | Omit the name: greeting reads 'Hi,' / heading without the name | backend-key |
| `RoleName`          | text | yes  | Role display name                                                               | Plain text                                                                                        | none      | Do not send                                                    | proposed    |
| `ChangeKind`        | enum | yes  | Assigned \| Removed                                                             | Selects heading                                                                                   | none      | Do not send                                                    | proposed    |
| `ChangedByName`     | text | no   | Acting administrator display name                                               | Plain text                                                                                        | personal  | Say 'An administrator'                                         | proposed    |
| `PermissionSummary` | list | no   | Role permission groups                                                          | Up to N label/description pairs                                                                   | none      | Omit the list                                                  | proposed    |
| `AdminPortalUrl`    | url  | yes  | Backend-built from the configured portal base URL + fixed path (admin portal /) | Absolute https URL on an allowlisted portal origin; no tokens, OTPs or personal data in the query | none      | Do not send                                                    | proposed    |
