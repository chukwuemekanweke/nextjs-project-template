# Authentication and session management

FE-021 adds application-owned credential sign-in to the independently deployed User and Admin portals. Both applications expose `/sign-in`, validate email/password input with `@template/forms`, and post only to their own `/api/auth/session` Route Handler. The browser never receives an access token or refresh token.

## Sign-in flow

```mermaid
sequenceDiagram
  participant Browser
  participant Portal as Portal /api/auth/session
  participant Backend as .NET Web API
  Browser->>Portal: POST email + password
  Portal->>Backend: POST /api/v1/authentication/sessions
  Backend-->>Portal: access + refresh tokens
  alt Admin Portal
    Portal->>Portal: require configured role claim
  end
  Portal-->>Browser: HttpOnly cookies + token metadata
  Browser->>Browser: replace with validated returnTo path
```

The form maps response status to application-owned, safe messages. It does not render backend details, account identifiers, tokens, or exception text. `returnTo` accepts only a same-origin absolute path beginning with one slash; missing, external, protocol-relative, and malformed values fall back to `/`. This supplies destination restoration for route guards without creating an open redirect.

The existing portal-specific cookie names keep User and Admin sessions isolated. Cookie creation remains in `src/lib/session-cookies.ts`, and server API clients remain the only consumers of access-token cookies. Later Epic 08 stories own route guards, refresh coordination, logout presentation, and permission-aware controls.

## Admin authorization boundary

The Admin Portal reads `ADMIN_REQUIRED_ROLE` as server-only configuration, defaulting to `Administrator`. After a successful backend credential/Google sign-in or token refresh, its Route Handler accepts the standard `role`, `roles`, or ASP.NET role-claim URI shape. A missing, malformed, or non-matching claim fails closed with `403`; rejected tokens are not persisted or returned to the browser, existing Admin cookies are cleared, and the handler makes a best-effort logout call.

This frontend check is an admission control for the Admin Portal, not a replacement for backend authorization on administrative APIs. The currently checked compatible backend token contains `jti`, `sub`, `email`, and `stakeholder_id` but no role claim, so it will be rejected by the Admin Portal until the backend emits the configured role (or supplies an equivalent backend-authoritative admin policy endpoint). That integration requirement is deliberate: authenticating successfully is not sufficient authorization for an administrative application.

## Extension points

- Add route protection by redirecting unauthenticated requests to `/sign-in?returnTo=<encoded local path>`; reuse the destination validation before redirecting back.
- Keep refresh and logout calls behind the existing same-origin session Route Handlers so token material stays server-only.
- Derive permission-based presentation from backend-authoritative session data when that contract is available, while continuing to enforce every privileged operation in the backend.
