# Architecture documentation

This guide explains the frontend architecture implemented through Epics 1–6: the monorepo foundation, application bootstrapping, dashboard and public-portal infrastructure, shared configuration, and the handwritten API client. It is for developers who know Next.js routes such as `page.tsx` and want to understand how this repository composes three deployable applications from workspace packages.

Read in this order:

1. [Monorepo foundation](./01-monorepo-foundation.md)
2. [Application architecture](./02-application-architecture.md)
3. [Shared dashboard architecture](./03-shared-dashboard-architecture.md)
4. [Public portal architecture](./04-public-portal-architecture.md)
5. [Development and extension guide](./05-development-and-extension-guide.md)
6. [Shared configuration](./06-shared-configuration.md)
7. [Handwritten API client](./07-api-client.md)

## Summary

`apps/user-portal`, `apps/admin-portal`, and `apps/public-portal` are separate Next.js applications. They share tooling, presentation infrastructure, validated configuration, and the handwritten `@template/api-client`—not route or feature composition. The two dashboard applications consume `@template/ui-core`, `@template/dashboard-ui`, and `@template/config`; the marketing application consumes `@template/public-ui` and `@template/config`. pnpm links these workspace packages, Turborepo runs their tasks in dependency order, and each application builds a standalone container on its own port.

The documents describe implemented structure, including the dashboard portals' session BFF endpoints and placeholder pages. Session infrastructure is present; authentication screens, frontend authorization policy, business workflows, application-specific query/form presentation, and observability are not.
