---
type: convention
title: Public Package Exports
description: Package entry-point rules that preserve domain and server-browser boundaries
resource: okf://knowledge/conventions/package-exports
tags: [constraint, convention, packages, exports]
governance: constraint
code_refs:
  [
    packages/*/package.json,
    packages/*/src/index.ts,
    packages/api-client/src/exports.test.ts,
  ]
sources:
  - kind: file
    path: packages/api-client/package.json
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

Consumers import only entry points declared in package `exports`. Never reach
into `packages/*/src/**` from an application or another package.

`api-client` intentionally exposes a root, stable domain entry points,
`browser`, `server`, and `transport`. Preserve the server/browser split:
`server` imports `server-only`; browser and root/domain exports must not
transitively expose server modules, Next cookie APIs, or environment reads.
Extend the closest stable domain export when adding contracts/operations rather
than creating one entry per DTO.

The other runtime packages expose curated root or domain surfaces. Add an export
only when it is supported as reusable API; do not export internals merely to
avoid placing application-specific code in an app. Keep Next `transpilePackages`
aligned when an application starts importing another source-distributed
workspace package.
