---
type: infrastructure
title: Configuration and Environment Boundaries
description:
  Shared validation, tenant and branding configuration, and public versus
  private environment values
resource: okf://knowledge/infrastructure/configuration-environment
tags: [constraint, infrastructure, configuration, environment, secrets]
governance: constraint
code_refs: [packages/config/**, apps/*/.env.example, apps/*/src/config/**]
sources:
  - kind: file
    path: packages/config/src/index.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

`packages/config` provides Zod schemas and builders for common server, browser,
branding, tenant, URL, application identity, and environment fields. Each
application explicitly reads its environment, extends the shared schema with
app-specific values, and exports app-owned configuration.

- Server values include `API_BASE_URL`, `TENANT_ID`, environment/name/version,
  and app-only secrets or policies. Server config modules import `server-only`.
- Browser values are explicitly enumerated `NEXT_PUBLIC_*` fields. They are
  visible in the bundle and must never contain credentials, tokens, private
  endpoints, or secrets.
- Tenant IDs are validated UUIDs and default to the template tenant. Client
  factories add `X-Tenant-Id`; apps choose server or browser configuration
  appropriate to the boundary.
- Branding is validated once and consumed as immutable typed data. Public Portal
  adds site URLs/content; Admin adds required-role configuration.

Document new values in the relevant `.env.example`. Keep application-specific
configuration in its app rather than widening the shared schema without reuse.
