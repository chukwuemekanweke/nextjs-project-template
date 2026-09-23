---
type: convention
title: TypeScript Readability Conventions
description: Control-flow, asynchronous workflow, naming, and concurrency readability rules
resource: okf://knowledge/conventions/typescript-style
tags: [constraint, convention, typescript, readability]
governance: constraint
code_refs: [apps/**/*.ts, apps/**/*.tsx, packages/**/*.ts, packages/**/*.tsx]
sources:
  - kind: file
    path: packages/api-client/src/browser/refresh-coordinated-fetch.ts
generated: { at: "2026-09-24T00:00:00Z", by: human }
status: stable
---

- Always use braces for `if`, `else`, `try`, `catch`, `finally`, `while`, `do`,
  `for`, `for...in`, and `for...of`, including one-line bodies. Do not reformat
  unrelated code.
- Prefer readable `async`/`await` with `try/catch/finally` to long promise
  chains; use Promise combinators when work is intentionally concurrent.
- Keep the happy path procedural and top-to-bottom. Give multi-step workflows
  and business callbacks named functions; extract details behind names that
  communicate intent.
- Distinguish active operations from completed values (`activeRefresh`,
  `refreshResult`, `sessionExpired`). Avoid burying workflows in configuration
  objects, returned anonymous functions, or deep callbacks.
- Prefer small functions and interfaces to unnecessary classes/frameworks. Keep
  dependency injection behind narrow factories/interfaces.
- Preserve explicit concurrency and idempotency mechanisms. Do not remove
  active-operation promises, locks, request clones, version checks, or one-shot
  guards merely to shorten code.
