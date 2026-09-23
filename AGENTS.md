# AGENTS

This repository is a pnpm/Turborepo frontend monorepo with three independently
deployable Next.js applications and reusable workspace packages. Durable
architecture, infrastructure, convention, workflow, testing, and domain
knowledge lives in the small OKF knowledge base at `.okf/knowledge/`; this file
routes agents into it rather than duplicating it.

## Before non-trivial repository work

1. Identify the paths and concerns likely to change.
2. Query OKF before broad exploration: use the OKF MCP server (`okf_load_bundle`
   once per session, then a short `okf_query`/`okf_search`) or
   `okf search -q "<topic>"` / `okf show -detail` from the repository root.
3. Load only the few relevant concepts. Follow `governance: constraint`
   concepts; load `governance: context` concepts when their reasoning is useful.
   Do not enumerate or inject the entire bundle for normal work.
4. Inspect the relevant implementation. Source code is authoritative when it
   conflicts with OKF.
5. Implement and verify the change.
6. Whenever `apps/`, `packages/`, build/testing/deployment configuration, or PR
   workflow changes materially, perform the mandatory OKF check in
   `.okf/knowledge/workflows/okf-maintenance.md` before considering the work
   done.

`docs/architecture/` is detailed, human-facing documentation. Do not routinely
load it as agent context. Update it when an architecture-affecting change makes
it inaccurate; keep OKF concise and retrieval-oriented.

## Verification

Run, in order:

1. `pnpm format:check`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Filtered workspace checks are useful during development, but shared-package or
repository-wide changes must finish with repository-level verification.

## Git output

- Commit messages must use Conventional Commit format.
- Keep the commit subject concise.
- Add at most one short explanatory body sentence when the subject alone is
  insufficient.
- For pull-request work, retrieve the applicable OKF workflow before drafting.

## Always

- Never commit or print secrets, credentials, access tokens, refresh tokens, or
  API keys. Never expose secrets through `NEXT_PUBLIC_*`.
- Browser code must not import `@template/api-client/server`, server cookie
  readers, private environment values, access tokens, or refresh tokens.
- Keep the API client handwritten; do not introduce client/DTO generation from
  OpenAPI.
- Use public package exports. Features must not construct backend URLs or
  implement HTTP transport.
- Keep product workflows and application composition in `apps/*`; reusable
  infrastructure and UI primitives belong in `packages/*`.
- Preserve package-level third-party notices such as `LICENSE.tailadmin` and
  `LICENSE.solid`.
- Keep this router small; durable knowledge belongs in OKF.
