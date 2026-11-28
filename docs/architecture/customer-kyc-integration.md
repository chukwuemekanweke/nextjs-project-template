# Customer KYC integration

CAF-FE-006 connects the approved identity-verification composition to the
backend-owned KYCAid lifecycle. The frontend never constructs provider URLs,
accepts stakeholder IDs, or treats browser navigation as verification proof.

## Modules and routes

- `packages/api-client/src/kyc/` owns the handwritten wire contracts and
  `GET /api/v1/stakeholders/me/kyc` / `POST
/api/v1/stakeholders/me/kyc/start` operations. Start has no request body.
- `packages/api-react/src/kyc/` owns the `['kyc', 'current']` key, query,
  bounded polling policy, start mutation and invalidation.
- User Portal BFF routes are `GET /api/kyc` and `POST /api/kyc/start`. They use
  the normal server API factory, which forwards the HttpOnly active-session
  token, configured tenant ID and approved request headers.
- `/verification` is authenticated by the existing User Portal proxy and is
  also the canonical provider-return page.
- `verification-adapter.ts` separates backend DTOs from the approved
  presentation model. Preview fixtures remain test-only.

Browser operations use the backend-shaped handwritten client API, but
`browser-api.ts` rewrites both authenticated KYC operations to the same-origin
BFF. Access tokens and provider credentials never enter browser JavaScript.

## Lifecycle mapping

| Backend state                      | Presentation and action                                     | Automatic polling |
| ---------------------------------- | ----------------------------------------------------------- | ----------------- |
| `NotStarted`                       | Offer Start verification                                    | No                |
| `Pending` with URL                 | Offer Continue verification; start returns the existing URL | Yes               |
| `Pending` without URL              | Show provider-session preparation and a recoverable retry   | Yes               |
| `InProgress`                       | Show review pending; do not create a new form               | Yes               |
| `Verified` with `isVerified: true` | Show verified with no action                                | No                |
| `Rejected`                         | Offer retry through the start endpoint                      | No                |
| `Failed`                           | Offer retry through the start endpoint                      | No                |
| `Expired`                          | Offer start again through the start endpoint                | No                |
| Unknown                            | Show an unavailable state with no action                    | No                |

`isVerified` is the authoritative stakeholder success flag. A `Verified`
attempt without that flag is rendered as unknown rather than success. No
provider rejection reason is displayed because the customer contract does not
return one.

## Start, return and polling

The start mutation is single-flight in the UI; the backend's active-attempt
uniqueness and provisioning lease remain the correctness boundary. A successful
response navigates once, and only when `verificationUrl` is valid HTTPS. A null
or unusable URL remains on the page in a recoverable preparation state.

The mutation invalidates current KYC state after success and after ambiguous
failure. The query polls only `Pending` and `InProgress`, every three seconds,
for at most 40 successful reads (about two minutes). It stops on a terminal or
unknown state, read error, unmount, or session failure. When the budget is
exhausted, the page explicitly offers manual refresh.

Returning from KYCAid simply loads `/verification` and reads current state.
Return query parameters, hosted-form completion and navigation history are
never evidence of success. Expired authentication follows the existing proxy
and `sessionFetch` sign-in/refresh behavior, including safe `returnTo` handling.

## Error behavior

The UI branches only on HTTP status, not provider or English response text:

- `400`: complete first and last name in Profile.
- `401`: the existing session flow reauthenticates or returns to sign-in.
- `404`: the stakeholder profile is not ready.
- `409`: state changed/already verified; authoritative state is refreshed.
- `503`: provider unavailable, timed out, disabled, untrusted, or still
  provisioning; remain recoverable and retry later.

Raw provider payloads and internal error detail are never rendered.

## Deployment configuration and limitations

Each backend environment must configure `Kyc:Kycaid:RedirectUrl` to the public,
authenticated frontend `/verification` URL. The WebAPI and Jobs host also need
the KYCAid enablement, API key, form ID, base URL, trusted form hosts and timeout
documented by the backend. Development needs a provider-acceptable public HTTPS
return URL.

Known limitations: customer attempt history and stable machine-readable KYC
error codes are not exposed; automated tests use mocked backend/provider
responses and do not exercise a live KYCAid account.
