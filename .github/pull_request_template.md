## What changed?

<!-- Provide a concise list of the changes introduced by this PR. -->

-
-

## Context

<!-- Explain why this change is needed and link the relevant story, issue, or documentation. -->

- Story/issue: <!-- FE-000 or URL -->
- Related documentation:

## Scope

<!-- Select every workspace or delivery area affected by this PR. -->

- [ ] User Portal (`apps/user-portal`)
- [ ] Admin Portal (`apps/admin-portal`)
- [ ] Public Portal (`apps/public-portal`)
- [ ] Shared packages (`packages/*`)
- [ ] Tooling or repository configuration
- [ ] CI/CD or deployment
- [ ] Documentation only

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Dependency update
- [ ] Documentation
- [ ] Build, infrastructure, or developer experience

## Configuration and deployment impact

<!-- Identify new or changed environment variables, migrations, deployment ordering, or compatibility concerns. Never include secret values. -->

- Environment variables:
- Deployment considerations:
- Backend/API compatibility:

## Risks and considerations

<!-- Call out edge cases, security implications, affected applications, and areas reviewers should inspect closely. -->

-

## Dependencies

<!-- List dependent PRs, services, packages, or configuration changes. Write "None" when there are no dependencies. -->

-

## Checklist

- [ ] The change is limited to the intended applications and shared packages.
- [ ] Affected applications remain independently buildable and deployable.
- [ ] Code follows the shared TypeScript, ESLint, and formatting standards.
- [ ] Tests were added or updated where appropriate.
- [ ] User-facing or operational documentation was updated where appropriate.
- [ ] New environment variables are documented in the relevant `.env.example` files.
- [ ] No secrets, credentials, or sensitive data are exposed to the client or repository.
- [ ] No unused template demo code or unnecessary dependencies were introduced.
- [ ] Client-side controls do not replace authoritative backend authorization.
- [ ] I completed a self-review of this PR.
