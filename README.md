# Next.js Project Template

A pnpm and Turborepo monorepo for three independently deployable Next.js applications that can share frontend infrastructure while integrating with the same .NET Web API.

## Applications

| Application   | Workspace package         | Development URL       |
| ------------- | ------------------------- | --------------------- |
| User Portal   | `@template/user-portal`   | http://localhost:3000 |
| Admin Portal  | `@template/admin-portal`  | http://localhost:3001 |
| Public Portal | `@template/public-portal` | http://localhost:3002 |

Each application owns its package manifest, build output, runtime command, and deployment lifecycle. A change to one application does not require deploying the others.

## Prerequisites

- Node.js 20.19.0 or later
- Corepack (included with supported Node.js distributions)
- pnpm 10.34.5, pinned through the root `packageManager` field

Enable the pinned package manager and install dependencies:

```bash
corepack enable
pnpm install
```

The install uses strict peer-dependency validation and does not require `--legacy-peer-deps`.

## Development

Start every application through Turborepo:

```bash
pnpm dev
```

Start one application independently:

```bash
pnpm --filter @template/user-portal dev
pnpm --filter @template/admin-portal dev
pnpm --filter @template/public-portal dev
```

Replace `dev` with `build`, `lint`, `typecheck`, or `test` to run that check for only the selected application.

## Environment Configuration

Each application owns its environment configuration. Copy the relevant example before starting local development:

```bash
cp apps/user-portal/.env.example apps/user-portal/.env.local
cp apps/admin-portal/.env.example apps/admin-portal/.env.local
cp apps/public-portal/.env.example apps/public-portal/.env.local
```

The authenticated portals configure `NEXT_PUBLIC_API_BASE_URL`. The Public Portal additionally configures its canonical URL, product branding, contact details, and `NEXT_PUBLIC_USER_PORTAL_URL`, which is used for registration and sign-in calls to action. Example values are safe local defaults; secrets must never use the `NEXT_PUBLIC_` prefix.

## Independent Containers

Build each image from the repository root so its Dockerfile can access the workspace lockfile and shared packages:

```bash
docker build -f apps/user-portal/Dockerfile -t user-portal .
docker build -f apps/admin-portal/Dockerfile -t admin-portal .
docker build -f apps/public-portal/Dockerfile -t public-portal .
```

The images run their standalone Next.js servers on ports 3000, 3001, and 3002 respectively, use a non-root runtime user, and contain only the selected application's production output.

## Workspace Commands

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Run all application development servers       |
| `pnpm build`        | Create production builds for all applications |
| `pnpm lint`         | Run the shared ESLint rules                   |
| `pnpm typecheck`    | Run strict TypeScript checks                  |
| `pnpm test`         | Run each application's test suite             |
| `pnpm format`       | Format supported files with Prettier          |
| `pnpm format:check` | Verify formatting without changing files      |

## Repository Structure

```text
apps/
  admin-portal/       Admin application with an app-specific dashboard layout
  public-portal/      Solid-derived public website and route composition
  user-portal/        User application with an app-specific dashboard layout
packages/
  dashboard-ui/       Shared TailAdmin-derived dashboard primitives
  eslint-config/      Shared Next.js ESLint flat configuration
  public-ui/          Typed Solid-derived public-site sections
  ui-core/            Shared TailAdmin-derived UI primitives
  typescript-config/  Shared strict TypeScript configuration
```

All applications use the `@/*` alias for their local `src/*` directory. Generated API client code under `packages/api-client/generated` is reserved for a later epic and excluded from formatting and linting.

## Solid Public Portal

The public portal directly adopts the supplied Solid Next.js template assets,
layout styling, and section patterns. Original MIT notices are retained in
`apps/public-portal/LICENSE.solid` and `packages/public-ui/LICENSE.solid`.
Marketing-only dependencies remain scoped to `@template/public-ui` and the
public application, keeping authenticated dashboard bundles independent.

Typed configuration in `apps/public-portal/src/config/site.ts` supplies the
placeholder content used across home, features, pricing, about, contact, blog,
privacy, and terms pages. The portal also provides canonical metadata, a
sitemap, robots metadata, and a responsive Solid-styled 404 page.

## Shared Dashboard UI

Epic 03 introduces two workspace packages for TailAdmin adoption:

- `@template/ui-core` for cards, forms, modals, tables, pagination, and loading states
- `@template/dashboard-ui` for dashboard shells, sidebars, mobile navigation, breadcrumbs, and profile menus

Both packages expose stable root exports, retain TailAdmin MIT attribution in `LICENSE.tailadmin`, and avoid fake ecommerce data, shared navigation state, or template branding. The User Portal and Admin Portal compose those primitives locally so each application can change its navigation independently.

## Foundation Versions

- Next.js 16.2.10
- React 19.2.7
- TypeScript 5.9.3
- Tailwind CSS 4.3.2
- ESLint 9.39.5 with `eslint-config-next` 16.2.10

Dependency versions are centralized in the pnpm workspace catalog to prevent application drift.

## Repository

[chukwuemekanweke/nextjs-project-template](https://github.com/chukwuemekanweke/nextjs-project-template)
