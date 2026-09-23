---
type: infrastructure
title: Forms and Validation Infrastructure
description:
  Shared React Hook Form/Zod primitives and the boundary for application-owned
  schemas and workflows
resource: okf://knowledge/infrastructure/forms-validation
tags: [constraint, infrastructure, forms, validation]
governance: constraint
code_refs: [packages/forms/**, apps/*/src/app/**/*form.tsx, apps/*/src/lib/**]
sources:
  - kind: file
    path: packages/forms/src/backend-validation.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

`packages/forms` owns domain-neutral client form infrastructure: React Hook Form
configured with Zod, validated form context, accessible typed fields,
password/confirmation/search controls, pending submit behavior, and normalized
backend validation mapping.

`applyBackendValidation` accepts explicit form field names and
application-supplied aliases. It maps normalized backend field names to field
errors and returns unmapped/general messages. Backend validation remains
authoritative; client Zod validation improves feedback but does not replace it.

Applications own domain and screen schemas, multi-step form state, accepted
backend aliases, concrete default values, messages, submission workflows,
mutation choice, navigation, notifications, and product behavior. A registration
schema belongs in the User Portal unless it becomes a truly reusable
domain-neutral primitive. Shared fields must remain accessible and must not
embed routes, copy, or business decisions.
