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
- pnpm 11.12.0, pinned through the root `packageManager` field

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
  admin-portal/       Admin application (TailAdmin adoption follows)
  public-portal/      Public website (Solid adoption follows)
  user-portal/        User application (TailAdmin adoption follows)
packages/
  eslint-config/      Shared Next.js ESLint flat configuration
  typescript-config/  Shared strict TypeScript configuration
```

All applications use the `@/*` alias for their local `src/*` directory. Generated API client code under `packages/api-client/generated` is reserved for a later epic and excluded from formatting and linting.

## Foundation Versions

- Next.js 16.2.10
- React 19.2.7
- TypeScript 5.9.3
- Tailwind CSS 4.3.2
- ESLint 9.39.5 with `eslint-config-next` 16.2.10

Dependency versions are centralized in the pnpm workspace catalog to prevent application drift.

## Repository

[chukwuemekanweke/nextjs-project-template](https://github.com/chukwuemekanweke/nextjs-project-template)
