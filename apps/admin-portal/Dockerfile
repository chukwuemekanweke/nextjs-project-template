FROM node:20.19.0-alpine AS builder
WORKDIR /workspace
RUN npm install --global corepack@0.34.5 && corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @template/admin-portal build

FROM node:20.19.0-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /workspace/apps/admin-portal/.next/standalone ./
COPY --from=builder /workspace/apps/admin-portal/.next/static ./apps/admin-portal/.next/static
USER node
EXPOSE 3001
CMD ["node", "apps/admin-portal/server.js"]
