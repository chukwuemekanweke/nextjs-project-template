FROM node:20.19.0-alpine AS builder
WORKDIR /workspace
RUN npm install --global corepack@0.34.5 && corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @template/user-portal build

FROM node:20.19.0-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /workspace/apps/user-portal/.next/standalone ./
COPY --from=builder /workspace/apps/user-portal/.next/static ./apps/user-portal/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/user-portal/server.js"]
