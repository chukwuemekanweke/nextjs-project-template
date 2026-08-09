# Next.js Project Template

A pnpm and Turborepo monorepo for three independently deployable Next.js applications that can share frontend infrastructure while integrating with the same .NET Web API.

## Applications

| Application   | Workspace package         | Development URL       |
| ------------- | ------------------------- | --------------------- |
| User Portal   | `@template/user-portal`   | http://localhost:9000 |
| Admin Portal  | `@template/admin-portal`  | http://localhost:9001 |
| Public Portal | `@template/public-portal` | http://localhost:9002 |

Each application owns its package manifest, build output, runtime command, and deployment lifecycle. A change to one application does not require deploying the others.

## Prerequisites

- Node.js 22.13.0 or later
- Corepack (included with supported Node.js distributions)
- pnpm 11.20.0, pinned through the root `packageManager` field

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

Every application configures the private server-side `API_BASE_URL` and the intentionally public `NEXT_PUBLIC_API_BASE_URL`. Authenticated server calls and session BFF handlers use the private value. The Public Portal additionally configures its canonical URL, product branding, contact details, and `NEXT_PUBLIC_USER_PORTAL_URL`, which is used for registration and sign-in calls to action. Example values are safe local defaults; secrets must never use the `NEXT_PUBLIC_` prefix.

## Independent Containers

Build each image from the repository root so its Dockerfile can access the workspace lockfile and shared packages:

```bash
docker build -f apps/user-portal/Dockerfile -t user-portal .
docker build -f apps/admin-portal/Dockerfile -t admin-portal .
docker build -f apps/public-portal/Dockerfile -t public-portal .
```

The images run their standalone Next.js servers on ports 9000, 9001, and 9002 respectively, use a non-root runtime user, and contain only the selected application's production output.

## Workspace Commands

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Run all application development servers       |
| `pnpm build`        | Create production builds for all applications |
| `pnpm lint`         | Run the shared ESLint rules                   |
| `pnpm typecheck`    | Run strict TypeScript checks                  |
| `pnpm test`         | Run each application's test suite             |
| `pnpm sync:openapi` | Refresh the OpenAPI reference document        |
| `pnpm format`       | Format supported files with Prettier          |
| `pnpm format:check` | Verify formatting without changing files      |

## Git workflow automation

The Windows PowerShell workflow command automates branch creation, validation,
AI-assisted commit and pull-request drafting, publishing, and returning to an
updated `main` after merge. It requires Git, GitHub CLI (`gh`), and an installed
and authenticated Codex CLI. On Windows, the workflow selects a Codex executable
that has its matching sandbox helper, including the version bundled with the
Codex VS Code extension.

This repository publishes through the `chukwuemekanweke` GitHub account without
switching the globally active `gh` login. Git pushes use the
`github-chukwuemekanweke` SSH host alias. Pull-request commands read the
account-specific token from an encrypted local credential and verify the account
before doing any remote work.

Configure the SSH alias in `%USERPROFILE%\.ssh\config`:

```sshconfig
Host github-chukwuemekanweke
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_chukwuemekanweke
    IdentitiesOnly yes
```

Save the PAT once after cloning the repository:

```powershell
.\scripts\git-workflow.ps1 setup-auth
```

The command validates the account before saving the credential under
`%LOCALAPPDATA%\FrontendProjectTemplate`. Windows encrypts the token for the
current user on the current computer, so it is loaded automatically on later
workflow runs. `CHUKWUEMEKANWEKE_GITHUB_TOKEN` remains available as a temporary
override for the current shell. Do not add the private key, token, or encrypted
credential file to this repository.

Start a feature branch from the latest `origin/main`:

```powershell
.\scripts\git-workflow.ps1 start -Epic 12 -Feature 34 -Label "user-profile"
```

After making changes, stage only the intended files and publish them:

```powershell
git add apps/user-portal packages/api-react
git diff --cached
.\scripts\git-workflow.ps1 publish
```

`publish` runs lint, type checking, and tests. Codex then inspects a disposable
Git worktree containing the branch history and staged diff, and drafts a
Conventional Commit message, PR title, and completed
`.github/pull_request_template.md`. The temporary worktree is removed before the
command pauses for approval of the commit message and again for editing or
approval of the PR. PRs are drafts by default; pass `-Ready` to create a
ready-for-review PR, or `-SkipChecks` only when the checks have already been run
separately.
If a push or PR creation is interrupted, run `publish` again; with no staged
changes, it resumes PR creation from the commits already on the feature branch.

Once GitHub reports the current branch's PR as merged, update `main` with:

```powershell
.\scripts\git-workflow.ps1 finish
```

The local feature branch is deliberately preserved. Use `status` for Git and PR
status, or `check` to run the repository validation suite without publishing.

## Repository Structure

```text
apps/
  admin-portal/       Admin application with an app-specific dashboard layout
  public-portal/      Solid-derived public website and route composition
  user-portal/        User application with an app-specific dashboard layout
packages/
  dashboard-ui/       Shared TailAdmin-derived dashboard primitives
  api-client/         Handwritten contracts, domain clients, and API transport
  api-react/          Reusable TanStack Query options, keys, and hooks
  forms/              Reusable React Hook Form and Zod composition
  eslint-config/      Shared Next.js ESLint flat configuration
  public-ui/          Typed Solid-derived public-site sections
  ui-core/            Shared TailAdmin-derived UI primitives
  typescript-config/  Shared strict TypeScript configuration
```

All applications use the `@/*` alias for their local `src/*` directory. `packages/api-client` contains handwritten wire contracts, reusable domain clients, transport, and normalized errors. `packages/api-react` adds reusable TanStack Query policy without moving URLs or HTTP behaviour into React. `packages/forms` composes React Hook Form, Zod, accessible fields, pending submission handling, and explicit backend field-error mapping while leaving schemas and workflows in applications. The checked-in OpenAPI JSON is a reference for maintaining supported operations; CI tests implemented application behavior rather than requiring coverage of the complete backend contract.

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
