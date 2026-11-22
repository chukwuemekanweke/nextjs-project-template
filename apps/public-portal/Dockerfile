# Public Portal production image. Build from the repository root:
#   docker build -f apps/public-portal/Dockerfile .
#
# Configuration boundaries:
# - Browser-visible NEXT_PUBLIC_* values are compiled in from the reviewed
#   apps/public-portal/.env.production. They are public by definition.
# - Server-only values (API_BASE_URL, TENANT_ID, APP_ENVIRONMENT,
#   APPLICATION_NAME, APPLICATION_VERSION, future secrets) are never baked in;
#   the container receives them at runtime (deploy/compose.production.yml).

FROM node:22.23.4-alpine AS builder
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global corepack@0.34.5 && corepack enable
WORKDIR /workspace

# Download every locked package once; this layer changes only with the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch --frozen-lockfile

COPY . .
RUN pnpm install --frozen-lockfile --offline --filter "@template/public-portal..."

RUN pnpm --filter @template/public-portal build

FROM node:22.23.4-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=9002
# Apply Alpine security updates, and drop the bundled package managers: the
# standalone server needs only Node.js.
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
      /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app

# Application files stay root-owned and read-only to the runtime user. Only the
# Next.js cache directory is writable (a tmpfs in production Compose).
COPY --from=builder /workspace/apps/public-portal/.next/standalone ./
COPY --from=builder /workspace/apps/public-portal/.next/static ./apps/public-portal/.next/static
COPY --from=builder /workspace/apps/public-portal/public ./apps/public-portal/public
RUN install -d -o node -g node -m 0700 apps/public-portal/.next/cache

USER node
EXPOSE 9002
CMD ["node", "apps/public-portal/server.js"]
