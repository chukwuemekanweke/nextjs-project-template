# `@template/api-client`

This is the handwritten, framework-independent client for the compatible .NET Web API. Read [`docs/architecture/07-api-client.md`](../../docs/architecture/07-api-client.md) for ownership rules, runtime boundaries, authentication, errors, operation examples, and the change workflow.

There is no API client generator and no generated source. `backendprojecttemplatewebapi.json` is a reference that developers inspect when maintaining the resource-grouped contract modules under `src/contracts`.

Useful commands:

```bash
pnpm sync:openapi
pnpm --filter @template/api-client lint
pnpm --filter @template/api-client typecheck
pnpm --filter @template/api-client test
```
