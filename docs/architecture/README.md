# Architecture documentation

This guide explains the frontend architecture implemented through Epics 1–4: the monorepo foundation, application bootstrapping, TailAdmin-derived dashboard infrastructure, and Solid-derived public portal. It is for developers who know Next.js routes such as `page.tsx` and want to understand how this repository composes three deployable applications from workspace packages.

Read in this order:

1. [Monorepo foundation](./01-monorepo-foundation.md)
2. [Application architecture](./02-application-architecture.md)
3. [Shared dashboard architecture](./03-shared-dashboard-architecture.md)
4. [Public portal architecture](./04-public-portal-architecture.md)
5. [Development and extension guide](./05-development-and-extension-guide.md)

## Summary

`apps/user-portal`, `apps/admin-portal`, and `apps/public-portal` are separate Next.js applications. They share tooling and presentation infrastructure, not product composition: the two dashboard applications consume `@template/ui-core` and `@template/dashboard-ui`; the marketing application consumes `@template/public-ui`. pnpm links these workspace packages, Turborepo runs their tasks in dependency order, and each application builds a standalone container on its own port.

The documents describe implemented structure, including placeholder pages and content. They do not treat later-epic capabilities—authentication, generated API integration, business workflows, shared configuration validation, query/form infrastructure, or observability—as present.
