# `@template/api-client`

This is the handwritten, framework-independent client for the compatible .NET Web API. React consumers use the separate `@template/api-react` package; direct usage remains supported for server code, scripts, and tests. Read [`docs/architecture/07-api-client.md`](../../docs/architecture/07-api-client.md) for ownership rules, runtime boundaries, authentication, errors, operation examples, and the change workflow.

There is no API client generator and no generated source. `backendprojecttemplatewebapi.json` is a reference that developers inspect when maintaining each domain's colocated `contracts.ts`; only cross-domain contracts live under `src/shared`.

The Fetch implementation is decomposed under `src/transport` into request building, response parsing, error normalization, cancellation, and orchestration modules. Keep new transport behaviour in the smallest module that owns that responsibility.

Browser applications can use `createRefreshCoordinatedFetch` from `@template/api-client/browser` when they need single-flight refresh handling. The helper owns concurrency and one-time retry behaviour; the application still decides which requests qualify, how to refresh, and where to send the user when the session ends.

Useful commands:

```bash
pnpm sync:openapi
pnpm --filter @template/api-client lint
pnpm --filter @template/api-client typecheck
pnpm --filter @template/api-client test
```
