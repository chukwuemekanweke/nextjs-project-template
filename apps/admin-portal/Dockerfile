# Admin Portal production image. Build from the repository root:
#   docker build -f apps/admin-portal/Dockerfile .
#
# Configuration boundaries:
# - Browser-visible NEXT_PUBLIC_* values are compiled in from the reviewed
#   apps/admin-portal/.env.production. They are public by definition.
# - Server-only values (API_BASE_URL, TENANT_ID, APP_ENVIRONMENT,
#   APPLICATION_NAME, APPLICATION_VERSION, ADMIN_REQUIRED_ROLE, future secrets)
#   are never baked in; the container receives them at runtime
#   (deploy/compose.production.yml).

FROM node:22.23.4-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global corepack@0.34.5 && corepack enable
WORKDIR /workspace

# Download every locked package once; this layer changes only with the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --frozen-lockfile --offline --filter "@template/admin-portal..."

# `next build` evaluates server modules while collecting page data, and the
# server configuration module validates its values at load time. These
# placeholders exist only for this RUN step, never reach the runtime image, and
# use a reserved .invalid host so any accidental use is obvious and fails.
RUN API_BASE_URL=http://server-config-supplied-at-runtime.invalid \
    APP_ENVIRONMENT=production \
    APPLICATION_NAME=admin-portal \
    APPLICATION_VERSION=0.0.0-build \
    pnpm --filter @template/admin-portal build

FROM node:22.23.4-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=9001
# Apply Alpine security updates, and drop the bundled package managers: the
# standalone server needs only Node.js.
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app

# Application files stay root-owned and read-only to the runtime user. Only the
# Next.js cache directory is writable (a tmpfs in production Compose).
COPY --from=builder /workspace/apps/admin-portal/.next/standalone ./
COPY --from=builder /workspace/apps/admin-portal/.next/static ./apps/admin-portal/.next/static
COPY --from=builder /workspace/apps/admin-portal/public ./apps/admin-portal/public
RUN install -d -o node -g node -m 0700 apps/admin-portal/.next/cache

USER node
EXPOSE 9001
CMD ["node", "apps/admin-portal/server.js"]
