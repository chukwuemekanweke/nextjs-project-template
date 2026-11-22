# CI/CD and deployment

The repository does not implement its own CI/CD mechanics. `.github/workflows/frontend-ci.yml` is a thin caller of the shared [devops-toolkit](https://github.com/chukwuemekanweke/devops-toolkit) reusable workflows. This repository owns the triggers, configuration files, Dockerfiles, Compose file, health endpoints, and secret mappings. The toolkit owns verification, image publishing, scanning, release manifests, VPS deployment, health gating, and restoration.

Do not add build, publish, scan, or deploy steps to the caller workflow or to local scripts. If the toolkit cannot do something the application needs, raise a generic toolkit enhancement instead.

## Workflow graph

```text
pull_request / push to main (path-filtered)
  |
  +-- verify-monorepo        nextjs-ci.yml             every event
  +-- check-release-config   release-config-check.yml  every event, no secrets
          |
          v  (both must pass; push to main only)
      publish-images         docker-publish.yml        3 images, scan, SBOM, provenance, manifest
          |
          v
      deploy-production      vps-deploy.yml            protected `production` environment
          |
          v  (only if the deployment failed or was cancelled)
      notify-deployment-failure                         caller-owned alert
```

| Job                         | What it does                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-monorepo`           | Node from `.node-version`, pnpm `11.20.0` (matches `packageManager`), `pnpm install --frozen-lockfile`, then `lint`, `typecheck`, `test`, and `build` across the whole workspace. Before building, it copies each portal's safe `.env.example` to `.env.local` through the `build-config-files` input.                                                                                                    |
| `check-release-config`      | Validates `.github/docker-images.json` and `.github/vps-deploy.production.json`, renders `deploy/compose.production.yml` with `deploy/stack.env.example` and placeholder digests, and applies the host Compose policy against `deploy/vps-deploy-stack.production.json`. It uses no secrets, so pull requests catch broken release configuration.                                                         |
| `publish-images`            | Builds the three images from the image configuration as a toolkit matrix. Each is tagged `release-<commit sha>`, and the job refuses to overwrite an existing tag. The job then scans each image (it fails on any CRITICAL vulnerability), attaches SBOM and provenance attestations, and uploads the immutable release manifest artifact `release-manifest-<sha>` with each component's `sha256` digest. |
| `deploy-production`         | Deploys the manifest artifact from the same run to the VPS stack. It runs in the `production` GitHub Environment, so environment protection rules apply.                                                                                                                                                                                                                                                  |
| `notify-deployment-failure` | Writes the sanitized outcome to the job summary and posts it to `DEPLOY_ALERT_WEBHOOK_URL` when that secret is set. Without the secret it emits a warning only. The run is already red either way.                                                                                                                                                                                                        |

Publishing and deployment run only for a `push` to `main`. A pull request never receives registry or VPS credentials. Every job declares only `contents: read`, the workflow default is `permissions: {}`, and secrets are mapped explicitly (never `secrets: inherit`). Main-branch runs are never cancelled by a newer push, because they may be publishing or deploying.

The path filters include `apps/**`, `packages/**`, `deploy/**`, root workspace and tool files, `.dockerignore`, and the two release configuration files. A change outside them, for example documentation only, neither verifies nor deploys.

### Toolkit version pinning

The toolkit has no release tag yet. All four `uses:` references therefore pin the same reviewed full commit SHA, `190253ec766e10185629ef3e6e123bf3d603aadf` (toolkit `main` when this integration was made; it is the first revision that contains `release-config-check.yml`). Never use `@main` or a feature branch.

To upgrade:

1. Read the toolkit changelog and the diff between the pinned SHA and the candidate.
2. Change all four references together. The workflows share contracts (image configuration, manifest, and deployment configuration), so mixing revisions is not supported.
3. Let `verify-monorepo` and `check-release-config` pass on a pull request, then observe the first publish and deploy on `main`.

Once the toolkit publishes immutable release tags, pin `@v1.x.y` (or keep a full SHA). Use the mutable `@v1` alias only if automatic compatible updates are acceptable for production.

## Images

`.github/docker-images.json` (toolkit image configuration `schemaVersion: 1`) declares one component per portal:

| Component       | Image repository                                                   | Dockerfile                      | Container port |
| --------------- | ------------------------------------------------------------------ | ------------------------------- | -------------- |
| `user-portal`   | `docker.io/chukwuemekanweke/frontendprojecttemplate-user-portal`   | `apps/user-portal/Dockerfile`   | 9000           |
| `admin-portal`  | `docker.io/chukwuemekanweke/frontendprojecttemplate-admin-portal`  | `apps/admin-portal/Dockerfile`  | 9001           |
| `public-portal` | `docker.io/chukwuemekanweke/frontendprojecttemplate-public-portal` | `apps/public-portal/Dockerfile` | 9002           |

Repository names follow the backend template's `backendprojecttemplate-<component>` convention. Create the three Docker Hub repositories before the first publish.

Each Dockerfile builds from the repository root in two stages:

1. **builder** (`node:22.13.0-alpine`): `pnpm fetch` from the lockfile (a cacheable layer), copy the workspace, run an offline frozen install filtered to the portal and its workspace dependencies, then `next build`.
2. **runner** (`node:22.13.0-alpine`): Alpine security updates, then removal of npm, npx, corepack, and yarn. The runner copies the standalone server, `.next/static`, and the portal's `public/` directory. Application files stay root-owned and read-only. Only `.next/cache` is writable by the `node` user (uid 1000), which runs the server.

### Build-time and runtime configuration

Next.js inlines `NEXT_PUBLIC_*` values into the JavaScript bundle at build time. Those values must come from the image build, so they are public and identical for every container started from that image.

| Kind                                                                                                               | Source                                                                                                                                | Reaches the browser |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Browser configuration (`NEXT_PUBLIC_*`: API origin, tenant, environment, branding, public URLs)                    | `apps/<portal>/.env.production`, committed and reviewed, loaded automatically by `next build`                                         | Yes, by design      |
| Server-only configuration (`API_BASE_URL`, `TENANT_ID`, `APP_ENVIRONMENT`, `APPLICATION_*`, `ADMIN_REQUIRED_ROLE`) | Container environment at runtime: `deploy/compose.production.yml`, with host-specific values interpolated from the host's `stack.env` | No                  |
| Server-only secrets (none today)                                                                                   | DEVOPS-007 runtime-secret files, see [Runtime secrets](#runtime-secrets-and-doppler)                                                  | No                  |

Rules:

- `.env.production` may contain only `NEXT_PUBLIC_*` keys. `src/config/production-build-env.test.ts` in each portal enforces that, rejects secret-like key names and localhost endpoints, and validates the file against the portal's browser schema. It is the only `.env*` file besides `.env.example` that git and Docker accept.
- During `next build`, Next.js evaluates server modules while collecting page data, and `src/config/server-env.ts` validates server configuration at load time. The user and admin Dockerfiles therefore pass placeholder server values to that single `RUN` step only. The placeholder API host ends in the reserved `.invalid` domain. These values never enter the runtime image, and verification confirmed the placeholder string appears nowhere in the built images. The public portal needs no placeholders.
- Never pass server values or secrets as Docker build arguments or `buildArgs` in the image configuration. Build arguments are recorded in image provenance.
- `.env.local` takes precedence over `.env.production`, so development and CI builds keep using the example values.

Because browser configuration is compiled in, an image is specific to one environment. A future staging environment needs its own browser configuration and image build.

## Production Compose stack

`deploy/compose.production.yml` defines `user-portal`, `admin-portal`, and `public-portal` (service name = manifest component name) on a private `portals` network. It names no image: at deploy time, the toolkit's generated override sets each service to `image@sha256:<digest>` from the release manifest, so a mutable tag is never a deployment identity.

Each service:

- runs as `1000:1000` with `init: true`, `read_only: true`, `cap_drop: [ALL]`, and `no-new-privileges:true`;
- has `tmpfs` mounts for `/tmp` and its own `.next/cache` (image-optimizer cache);
- publishes its container port on loopback only (`127.0.0.1:9000`, `:9001`, `:9002`) for the host reverse proxy;
- uses `restart: unless-stopped` and rotated `json-file` logs;
- has a Docker health check on `GET /api/health`.

Host-specific, non-secret values are interpolated from `<deployment-path>/stack.env` (required: `API_BASE_URL`, `TENANT_ID`; optional: `APP_ENVIRONMENT`, `ADMIN_REQUIRED_ROLE`). `deploy/stack.env.example` documents them and stands in for the host file in `check-release-config`. `API_BASE_URL` must be reachable from inside the containers. Typically this is the public HTTPS API origin, because `127.0.0.1` inside a container is not the host.

No migration service is configured. The portals have no database.

## Health checks

Each portal exposes `GET /api/health`. It returns `200 {"status":"ok"}` with `cache-control: no-store`, renders per request, needs no session, never calls the backend, and exposes no configuration. The user and admin session proxies exclude `/api/*`, so the endpoint is never redirected to sign-in. `/` is not a usable check: it returns `307` to `/sign-in` on the user and admin portals.

If server configuration is missing or invalid, the Next.js instrumentation hook fails and every request, including `/api/health`, returns `500`. A misconfigured release therefore fails the deployment health gate rather than being recorded as healthy.

`.github/vps-deploy.production.json` makes all three services required health services, with a 300-second deadline. It also adds two host-side HTTP checks per portal, each expecting `200`. One is `/api/health`. The other is a page that the server renders without a session or backend call: `/sign-in` on the user and admin portals, and `/` on the public portal. The page check proves that server rendering works, not only the health route. If a derived project makes those pages depend on the backend, replace that check, or backend outages will block frontend deployments.

## Deployment model and restoration

The three portals deploy as **one stack** (`frontendprojecttemplate-production`, Model A). Per-portal stacks (Model B) were evaluated and are not possible with the pinned toolkit without changing it:

- `vps-deploy` requires every component in the release manifest to be a service in the stack's Compose model (`scripts/vps-deploy/compose-policy.mjs`). A stack containing one portal cannot accept the three-component manifest that a single publish produces.
- Producing three single-component manifests would need three `docker-publish.yml` calls in one run. Its run-scoped artifact names (`docker-publish-prepared-<run>-<attempt>` and the `image-result-*` pattern) and its concurrency group would collide. Hand-editing the manifest would break its provenance.

Consequences of Model A:

- Images, digests, scans, and the manifest stay per portal, so a portal can always be identified and inspected independently.
- Every deployment rolls out all three services. Each build produces new digests, so all three containers are recreated, causing a short outage per portal. Deployment is health-gated, not zero-downtime.
- Health gating and restoration operate on the stack. If any portal fails health, the toolkit restores the previous release of all three portals from their recorded digests and verifies them. The run stays failed with outcome `restored-after-failure`. A healthy portal is never left on a newer release than its siblings.
- The first deployment has no previous release. A failure leaves the containers in place for diagnosis (`failed-no-previous-release`).

Independent per-portal rollback needs a generic toolkit enhancement, for example a publish option that writes a manifest scoped to selected components with unique artifact names, or a deploy option that accepts a manifest superset. That enhancement has not been made.

Manual rollback before the toolkit's `vps-rollback.yml` exists: re-run the `deploy-production` job of an earlier successful run, or redeploy its deployment id. The host keeps every manifest under `<deployment-path>/manifests/`.

## Runtime secrets and Doppler

The portals currently need **no** runtime secrets, so the stack declares no Doppler or DEVOPS-007 mounts. Do not add Doppler for non-secret configuration.

When a derived application needs a server-only secret:

1. Never use `NEXT_PUBLIC_*`, Dockerfile `ARG`/`ENV`, `buildArgs`, `.env.production`, the Compose file, or `stack.env` for it.
2. Follow the toolkit's DEVOPS-007 delivery (`docs/doppler/` and `examples/runtime-secrets/` in devops-toolkit). Use a scoped Doppler config per service and one runtime-secret instance per secret-bearing service, registered under `runtimeSecrets.services` in the host stack registry and in `deploy/vps-deploy-stack.production.json`.
3. In Compose, the secret-bearing service mounts exactly `/run/runtime-secrets/<application>/<environment>/<service>/current` at `/run/secrets/app` (`read_only: true`, `bind.create_host_path: false`), adds the instance's group with `group_add`, and switches to `restart: "no"` (the host's boot unit starts it after secrets are initialized).
4. The application reads the secret file at runtime on the server. It must not be read during `next build` or imported by client components.

## Required external setup

### GitHub

GitHub does not let a caller pass Environment secrets to a reusable workflow, so the deployment credentials must be **repository** secrets. The `production` Environment still gates the deploy job through its protection rules. Configure it with required reviewers and restrict deployment branches to `main`. Keep write access to the repository small, because any workflow on a pushed branch can read repository secrets.

| Secret                                            | Purpose                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`           | Publishing. Use a Docker Hub access token with read/write access to the three repositories. |
| `DOCKERHUB_READ_USERNAME`, `DOCKERHUB_READ_TOKEN` | Pull-only token sent to the VPS for one deployment.                                         |
| `VPS_HOST`                                        | VPS hostname or IP.                                                                         |
| `VPS_DEPLOY_USER`                                 | `vps-deploy`.                                                                               |
| `VPS_DEPLOY_SSH_KEY`                              | Private key bound on the host to this stack only (forced command).                          |
| `VPS_KNOWN_HOSTS`                                 | Pinned host key line(s), obtained out of band.                                              |
| `DEPLOY_ALERT_WEBHOOK_URL` (optional)             | Failure alert webhook (Slack, Teams, incident tool).                                        |

### VPS

Follow devops-toolkit `docs/vps-deployment.md`:

1. Install the helper from a checkout of the pinned toolkit SHA, and create the `vps-deploy` account (once per host).
2. Create `/srv/frontendprojecttemplate/production` (root-owned, `0750`).
3. Install `deploy/vps-deploy-stack.production.json` as `/etc/vps-deploy/stacks/frontendprojecttemplate-production.json` (root-owned, `0644`). Keep the repository copy identical; it is what pull requests validate.
4. Create `/srv/frontendprojecttemplate/production/stack.env` from `deploy/stack.env.example` with production values (root-owned, not group/world writable, no secrets).
5. Add the stack's sudoers line and its `restrict,command="/opt/vps-deploy/bin/vps-deploy-ssh frontendprojecttemplate-production"` `authorized_keys` entry for this repository's deploy key.
6. Enable `vps-deploy-stack@frontendprojecttemplate-production.service` so the active release starts at boot.

### Reverse proxy

The toolkit does not manage the reverse proxy. Terminate TLS for each portal's domain and forward to `127.0.0.1:9000` (user), `127.0.0.1:9001` (admin), and `127.0.0.1:9002` (public), passing `Host` and `X-Forwarded-For`/`-Proto`. HTTPS is required because session cookies are `Secure`. The deployment's HTTP checks run from the host, so they do not prove external reachability through the proxy.

## Customizing a derived project

1. Rename the image repositories in `.github/docker-images.json` and `deploy/vps-deploy-stack.production.json`, and the stack name in `frontend-ci.yml`, the registry copy, and `.github/vps-deploy.production.json` (`remoteDeploymentPath`).
2. Replace the example hosts, Google client ID, and branding in each `apps/<portal>/.env.production`. Keep `APPLICATION_VERSION` aligned with the value in the Compose file.
3. Set `allowedSourceRepositories` to the new repository.
4. Adjust host ports, health checks, and `stack.env` keys if the topology changes, and run `check-release-config` (any pull request) to validate.
5. Create the Docker Hub repositories, GitHub secrets, `production` Environment, and the VPS stack registration above.
