# `@template/api-react`

Reusable TanStack Query integration for `@template/api-client`: hierarchical keys, query and mutation options, cache invalidation, `ApiProvider`, and focused convenience hooks.

The package owns no URLs, transport, backend contracts, forms, toasts, or navigation. Import query options directly for prefetching/hydration, or use hooks inside an `ApiProvider` for interactive React consumers. `useApiQueryClient` exposes the provider's Query Client when an application-owned workflow needs to cancel or clear server state.

```bash
pnpm --filter @template/api-react lint
pnpm --filter @template/api-react typecheck
pnpm --filter @template/api-react test
```
