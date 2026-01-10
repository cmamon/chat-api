FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm@10.27.0 turbo

COPY . .
RUN turbo prune --scope=presence-service --docker

FROM node:22-alpine AS installer
WORKDIR /app
RUN npm install -g pnpm@10.27.0
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/tsconfig.base.json .
RUN rm -f tsconfig.tsbuildinfo apps/presence-service/tsconfig.tsbuildinfo
RUN pnpm run build --filter=presence-service...

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=installer /app .

CMD ["node", "apps/presence-service/dist/main"]
